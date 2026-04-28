"""Activity Management API Routes"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
from models import Activity, ActivityCreate, ActivityUpdate, ActivityStatus
from auth import get_current_user
from rbac import require_admin, get_current_user_data, block_employee
from utils.dependencies import db
from utils.datetime_helpers import (
    convert_datetime_fields,
    parse_datetime_fields,
    get_current_utc_iso
)
from utils.validation_helpers import validate_update_data, check_activity_edit_permission

router = APIRouter(prefix="/activities", tags=["activities"], dependencies=[Depends(block_employee)])

@router.post("", response_model=Activity)
async def create_activity(
    activity_data: ActivityCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new activity (Admin and Support only)"""
    user_data = await get_current_user_data(current_user_id)
    
    # Only Admin and Support can create activities
    if user_data['role'] == 'sales':
        raise HTTPException(status_code=403, detail="Sales users have read-only access to activities")
    
    activity = Activity(**activity_data.model_dump(), created_by=current_user_id)
    activity_dict = activity.model_dump()
    activity_dict['created_at'] = activity_dict['created_at'].isoformat()
    activity_dict['updated_at'] = activity_dict['updated_at'].isoformat()
    if activity_dict.get('due_date'):
        activity_dict['due_date'] = activity_dict['due_date'].isoformat()
    if activity_dict.get('next_maintenance_date'):
        activity_dict['next_maintenance_date'] = activity_dict['next_maintenance_date'].isoformat()
    
    await db.activities.insert_one(activity_dict)
    return activity

@router.get("", response_model=List[Activity])
async def get_activities(
    status: Optional[ActivityStatus] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    current_user_id: str = Depends(get_current_user)
):
    """Get all activities with optional filters"""
    query = {}
    
    if assigned_to:
        query['assigned_to'] = assigned_to
    
    if status:
        query['status'] = status
    
    # Search functionality
    if search:
        customer_docs = await db.customers.find(
            {"name": {"$regex": search, "$options": "i"}},
            {"id": 1, "_id": 0}
        ).to_list(100)
        customer_ids = [c['id'] for c in customer_docs]
        
        product_docs = await db.products.find(
            {"name": {"$regex": search, "$options": "i"}},
            {"id": 1, "_id": 0}
        ).to_list(100)
        product_ids = [p['id'] for p in product_docs]
        
        user_docs = await db.users.find(
            {"name": {"$regex": search, "$options": "i"}},
            {"id": 1, "_id": 0}
        ).to_list(100)
        user_ids = [u['id'] for u in user_docs]
        
        query["$or"] = [
            {"invoice_number": {"$regex": search, "$options": "i"}},
            {"work_order_no": {"$regex": search, "$options": "i"}},
            {"serial_number": {"$regex": search, "$options": "i"}},
            {"customer_id": {"$in": customer_ids}},
            {"product_ids": {"$in": product_ids}},
            {"assigned_to": {"$in": user_ids}},
            {"created_by": {"$in": user_ids}}
        ]
    
    activities = await db.activities.find(query, {"_id": 0}).to_list(1000)
    
    for activity in activities:
        if isinstance(activity.get('created_at'), str):
            activity['created_at'] = datetime.fromisoformat(activity['created_at'])
        if isinstance(activity.get('updated_at'), str):
            activity['updated_at'] = datetime.fromisoformat(activity['updated_at'])
        if activity.get('due_date') and isinstance(activity['due_date'], str):
            activity['due_date'] = datetime.fromisoformat(activity['due_date'])
    
    return activities

@router.get("/{activity_id}", response_model=Activity)
async def get_activity(activity_id: str, current_user_id: str = Depends(get_current_user)):
    """Get a single activity by ID"""
    activity_doc = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    if not activity_doc:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    if isinstance(activity_doc.get('created_at'), str):
        activity_doc['created_at'] = datetime.fromisoformat(activity_doc['created_at'])
    if isinstance(activity_doc.get('updated_at'), str):
        activity_doc['updated_at'] = datetime.fromisoformat(activity_doc['updated_at'])
    if activity_doc.get('due_date') and isinstance(activity_doc['due_date'], str):
        activity_doc['due_date'] = datetime.fromisoformat(activity_doc['due_date'])
    
    return Activity(**activity_doc)

@router.put("/{activity_id}", response_model=Activity)
async def update_activity(
    activity_id: str,
    activity_update: ActivityUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update an activity (Admin and Support only)"""
    activity_doc = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    if not activity_doc:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    user_data = await get_current_user_data(current_user_id)
    
    # Check edit permissions
    await check_activity_edit_permission(activity_doc, current_user_id, user_data)
    
    update_data = activity_update.model_dump(exclude_unset=True)
    validate_update_data(update_data)
    
    # Handle status update with history tracking
    if 'status' in update_data:
        status_entry = {
            'status': update_data['status'],
            'updated_by': current_user_id,
            'timestamp': get_current_utc_iso(),
            'notes': update_data.pop('notes', '')
        }
        
        await db.activities.update_one(
            {"id": activity_id},
            {"$push": {"status_history": status_entry}}
        )
    
    update_data['updated_at'] = get_current_utc_iso()
    
    # Convert datetime fields to ISO format
    convert_datetime_fields(update_data, ['due_date', 'next_maintenance_date'])
    
    result = await db.activities.update_one(
        {"id": activity_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity_doc = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    
    # Parse datetime fields back to datetime objects
    parse_datetime_fields(activity_doc, ['created_at', 'updated_at', 'due_date'])
    
    return Activity(**activity_doc)

@router.post("/{activity_id}/progress")
async def add_progress_update(
    activity_id: str,
    update_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Add a progress update to an in-progress activity (Admin and Support only)"""
    user_data = await get_current_user_data(current_user_id)
    
    # Sales users cannot add progress updates
    if user_data['role'] == 'sales':
        raise HTTPException(status_code=403, detail="Sales users have read-only access to activities")
    
    activity_doc = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    if not activity_doc:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    if activity_doc.get('status') != 'in_progress':
        raise HTTPException(status_code=400, detail="Can only add progress updates to in-progress activities")
    
    progress_entry = {
        'update': update_data.get('update', ''),
        'percentage': update_data.get('percentage', 0),
        'updated_by': current_user_id,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    await db.activities.update_one(
        {"id": activity_id},
        {
            "$push": {"progress_updates": progress_entry},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Progress update added successfully", "progress": progress_entry}

@router.delete("/{activity_id}")
async def delete_activity(activity_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete an activity (admin only)"""
    await require_admin(current_user_id)
    
    result = await db.activities.delete_one({"id": activity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Activity deleted successfully"}

@router.get("/stats/summary")
async def get_activities_stats(current_user_id: str = Depends(get_current_user)):
    """Get activity statistics"""
    total = await db.activities.count_documents({})
    pending = await db.activities.count_documents({"status": "pending"})
    in_progress = await db.activities.count_documents({"status": "in_progress"})
    completed = await db.activities.count_documents({"status": "completed"})
    
    return {
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed
    }
