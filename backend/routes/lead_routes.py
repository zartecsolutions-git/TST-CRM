from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone

from models import LeadCreate, Lead, LeadUpdate
from auth import get_current_user
from rbac import get_current_user_data
from utils.dependencies import get_db
from utils.datetime_helpers import (
    convert_datetime_fields,
    parse_datetime_fields,
    get_current_utc_iso,
    get_current_date_string
)
from utils.validation_helpers import validate_update_data, check_lead_ownership

router = APIRouter()


@router.post("/leads", response_model=Lead)
async def create_lead(
    lead_data: LeadCreate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only sales and admin can create leads
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] not in ['admin', 'sales']:
        raise HTTPException(status_code=403, detail="Only sales team can create leads")
    
    lead = Lead(**lead_data.model_dump(), created_by=current_user_id)
    lead_dict = lead.model_dump()
    lead_dict['created_at'] = lead_dict['created_at'].isoformat()
    lead_dict['updated_at'] = lead_dict['updated_at'].isoformat()
    
    # Convert date strings to ISO format if provided
    if lead_dict.get('quote_date'):
        try:
            # If it's already a string, keep it; if datetime, convert
            if isinstance(lead_dict['quote_date'], datetime):
                lead_dict['quote_date'] = lead_dict['quote_date'].isoformat()
        except (AttributeError, ValueError):
            pass
    
    if lead_dict.get('expected_close_date'):
        try:
            if isinstance(lead_dict['expected_close_date'], datetime):
                lead_dict['expected_close_date'] = lead_dict['expected_close_date'].isoformat()
        except (AttributeError, ValueError):
            pass
    
    await db.leads.insert_one(lead_dict)
    return lead


@router.get("/leads", response_model=List[Lead])
async def get_leads(
    current_user_id: str = Depends(get_current_user),
    status: Optional[str] = None,
    db = Depends(get_db)
):
    user_data = await get_current_user_data(current_user_id)
    
    # Sales users see only their leads, admins see all
    query = {}
    if user_data['role'] == 'sales':
        query['created_by'] = current_user_id
    
    if status:
        query['status'] = status
    
    leads = await db.leads.find(query, {"_id": 0}).to_list(1000)
    
    for lead in leads:
        # Convert ISO string dates back to datetime objects for Pydantic validation
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
        if isinstance(lead.get('updated_at'), str):
            lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
        
        # Keep quote_date and expected_close_date as strings (they're already strings in DB)
        # Remove them if they're datetime objects (shouldn't happen but just in case)
        if lead.get('quote_date') and isinstance(lead.get('quote_date'), datetime):
            lead['quote_date'] = lead['quote_date'].isoformat().split('T')[0]
        if lead.get('expected_close_date') and isinstance(lead.get('expected_close_date'), datetime):
            lead['expected_close_date'] = lead['expected_close_date'].isoformat().split('T')[0]
            
        if lead.get('closed_at') and isinstance(lead.get('closed_at'), str):
            lead['closed_at'] = datetime.fromisoformat(lead['closed_at'])
    
    return leads


@router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(
    lead_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Sales users can only view their own leads
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] == 'sales' and lead['created_by'] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this lead")
    
    # Convert ISO strings to datetime objects
    if isinstance(lead.get('created_at'), str):
        lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    if isinstance(lead.get('updated_at'), str):
        lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    
    # Keep date fields as strings
    if lead.get('quote_date') and isinstance(lead.get('quote_date'), datetime):
        lead['quote_date'] = lead['quote_date'].isoformat().split('T')[0]
    if lead.get('expected_close_date') and isinstance(lead.get('expected_close_date'), datetime):
        lead['expected_close_date'] = lead['expected_close_date'].isoformat().split('T')[0]
        
    if lead.get('closed_at') and isinstance(lead.get('closed_at'), str):
        lead['closed_at'] = datetime.fromisoformat(lead['closed_at'])
    
    return Lead(**lead)


@router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Sales users can only update their own leads
    user_data = await get_current_user_data(current_user_id)
    await check_lead_ownership(db, lead, current_user_id, user_data)
    
    update_data = lead_update.model_dump(exclude_unset=True)
    validate_update_data(update_data)
    
    # Track update in history
    update_note = update_data.pop('update_note', None)
    update_date = update_data.pop('update_date', None)
    update_history_entry = {
        "updated_at": get_current_utc_iso(),
        "update_date": update_date or get_current_date_string(),
        "updated_by": current_user_id,
        "note": update_note,
        "changes": update_data.copy()
    }
    
    update_data['updated_at'] = get_current_utc_iso()
    
    # Auto-set closed_at when status changes to closed_won or closed_lost
    if 'status' in update_data and update_data['status'] in ['closed_won', 'closed_lost']:
        update_data['closed_at'] = get_current_utc_iso()
    
    # Convert datetime fields to ISO format
    convert_datetime_fields(update_data, ['quote_date', 'expected_close_date'])
    
    # Add to updates history
    result = await db.leads.update_one(
        {"id": lead_id},
        {
            "$set": update_data,
            "$push": {"updates_history": update_history_entry}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    updated_lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    
    # Parse datetime fields back to datetime objects
    parse_datetime_fields(updated_lead, ['created_at', 'updated_at', 'closed_at'])
    
    # Keep date fields as strings
    if updated_lead.get('quote_date') and isinstance(updated_lead.get('quote_date'), datetime):
        updated_lead['quote_date'] = updated_lead['quote_date'].isoformat().split('T')[0]
    if updated_lead.get('expected_close_date') and isinstance(updated_lead.get('expected_close_date'), datetime):
        updated_lead['expected_close_date'] = updated_lead['expected_close_date'].isoformat().split('T')[0]
        
    if updated_lead.get('closed_at') and isinstance(updated_lead.get('closed_at'), str):
        updated_lead['closed_at'] = datetime.fromisoformat(updated_lead['closed_at'])
    
    return Lead(**updated_lead)


@router.delete("/leads/{lead_id}")
async def delete_lead(
    lead_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Sales users can only delete their own leads, admins can delete any
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] == 'sales' and lead['created_by'] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this lead")
    
    result = await db.leads.delete_one({"id": lead_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead deleted successfully"}


@router.get("/leads/stats/summary")
async def get_leads_summary(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get lead statistics for sales dashboard"""
    user_data = await get_current_user_data(current_user_id)
    
    query = {}
    if user_data['role'] == 'sales':
        query['created_by'] = current_user_id
    
    total_leads = await db.leads.count_documents(query)
    new_leads = await db.leads.count_documents({**query, "status": "new"})
    qualified_leads = await db.leads.count_documents({**query, "status": "qualified"})
    won_leads = await db.leads.count_documents({**query, "status": "closed_won"})
    lost_leads = await db.leads.count_documents({**query, "status": "closed_lost"})
    
    # Calculate total quote value
    pipeline = [
        {"$match": query},
        {"$match": {"quote_value": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": None, "total": {"$sum": "$quote_value"}}}
    ]
    quote_result = await db.leads.aggregate(pipeline).to_list(1)
    total_quote_value = quote_result[0]['total'] if quote_result else 0
    
    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "qualified_leads": qualified_leads,
        "won_leads": won_leads,
        "lost_leads": lost_leads,
        "total_quote_value": total_quote_value
    }
