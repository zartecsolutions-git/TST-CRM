from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime

from models import Geofence, GeofenceCreate, GeofenceUpdate
from auth import get_current_user
from rbac import require_admin
from utils.dependencies import get_db

router = APIRouter()


@router.post("/geofences", response_model=Geofence)
async def create_geofence(
    geofence_data: GeofenceCreate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only admins can create geofences
    await require_admin(current_user_id)
    
    geofence = Geofence(**geofence_data.model_dump(), created_by=current_user_id)
    geofence_dict = geofence.model_dump()
    geofence_dict['created_at'] = geofence_dict['created_at'].isoformat()
    
    await db.geofences.insert_one(geofence_dict)
    return geofence


@router.get("/geofences", response_model=List[Geofence])
async def get_geofences(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    geofences = await db.geofences.find({}, {"_id": 0}).to_list(1000)
    
    for geofence in geofences:
        if isinstance(geofence.get('created_at'), str):
            geofence['created_at'] = datetime.fromisoformat(geofence['created_at'])
    
    return geofences


@router.get("/geofences/{geofence_id}", response_model=Geofence)
async def get_geofence(
    geofence_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    geofence_doc = await db.geofences.find_one({"id": geofence_id}, {"_id": 0})
    if not geofence_doc:
        raise HTTPException(status_code=404, detail="Geofence not found")
    
    if isinstance(geofence_doc.get('created_at'), str):
        geofence_doc['created_at'] = datetime.fromisoformat(geofence_doc['created_at'])
    
    return Geofence(**geofence_doc)


@router.put("/geofences/{geofence_id}", response_model=Geofence)
async def update_geofence(
    geofence_id: str,
    geofence_update: GeofenceUpdate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    update_data = geofence_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.geofences.update_one(
        {"id": geofence_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Geofence not found")
    
    geofence_doc = await db.geofences.find_one({"id": geofence_id}, {"_id": 0})
    
    if isinstance(geofence_doc.get('created_at'), str):
        geofence_doc['created_at'] = datetime.fromisoformat(geofence_doc['created_at'])
    
    return Geofence(**geofence_doc)


@router.delete("/geofences/{geofence_id}")
async def delete_geofence(
    geofence_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only admins can delete geofences
    await require_admin(current_user_id)
    
    result = await db.geofences.delete_one({"id": geofence_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return {"message": "Geofence deleted successfully"}


@router.get("/geofences/alerts/list")
async def get_geofence_alerts(
    limit: int = 100,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    alerts = await db.geofence_alerts.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for alert in alerts:
        if isinstance(alert.get('timestamp'), str):
            alert['timestamp'] = datetime.fromisoformat(alert['timestamp'])
    
    return alerts
