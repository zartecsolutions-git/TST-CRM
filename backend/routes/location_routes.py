from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import math

from models import LocationCreate, Location, GeofenceAlert, AlertType
from auth import get_current_user
from rbac import require_admin
from utils.dependencies import get_db, get_websocket_manager

router = APIRouter()


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters using Haversine formula"""
    R = 6371000  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


@router.post("/locations", response_model=Location)
async def update_location(
    location_data: LocationCreate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db),
    manager = Depends(get_websocket_manager)
):
    location = Location(**location_data.model_dump(), user_id=current_user_id)
    location_dict = location.model_dump()
    location_dict['timestamp'] = location_dict['timestamp'].isoformat()
    
    await db.locations.insert_one(location_dict)
    
    # Check geofence alerts
    geofences = await db.geofences.find({}, {"_id": 0}).to_list(1000)
    for geofence_doc in geofences:
        distance = calculate_distance(
            location.latitude, location.longitude,
            geofence_doc['center_lat'], geofence_doc['center_lng']
        )
        
        # Check if user just entered or exited
        is_inside = distance <= geofence_doc['radius']
        
        # Get last location
        last_locations = await db.locations.find(
            {"user_id": current_user_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(2).to_list(2)
        
        if len(last_locations) > 1:
            last_loc = last_locations[1]
            last_distance = calculate_distance(
                last_loc['latitude'], last_loc['longitude'],
                geofence_doc['center_lat'], geofence_doc['center_lng']
            )
            was_inside = last_distance <= geofence_doc['radius']
            
            # Trigger alert if status changed
            if is_inside and not was_inside and geofence_doc.get('alert_on_enter'):
                alert = GeofenceAlert(
                    geofence_id=geofence_doc['id'],
                    user_id=current_user_id,
                    alert_type=AlertType.enter,
                    latitude=location.latitude,
                    longitude=location.longitude
                )
                alert_dict = alert.model_dump()
                alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
                await db.geofence_alerts.insert_one(alert_dict)
                
            elif not is_inside and was_inside and geofence_doc.get('alert_on_exit'):
                alert = GeofenceAlert(
                    geofence_id=geofence_doc['id'],
                    user_id=current_user_id,
                    alert_type=AlertType.exit,
                    latitude=location.latitude,
                    longitude=location.longitude
                )
                alert_dict = alert.model_dump()
                alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
                await db.geofence_alerts.insert_one(alert_dict)
    
    # Broadcast location update via WebSocket
    await manager.broadcast({
        "type": "location_update",
        "user_id": current_user_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "timestamp": location.timestamp.isoformat()
    })
    
    return location


@router.get("/locations/current")
async def get_current_locations(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get the most recent location for all users - Admin only"""
    # Only admins can view all locations
    await require_admin(current_user_id)
    
    users = await db.users.find({}, {"_id": 0, "id": 1, "name": 1, "role": 1}).to_list(1000)
    
    result = []
    for user in users:
        # Use find().sort().limit(1) instead of find_one().sort()
        locations_cursor = db.locations.find(
            {"user_id": user['id']},
            {"_id": 0}
        ).sort("timestamp", -1).limit(1)
        locations_list = await locations_cursor.to_list(1)
        location = locations_list[0] if locations_list else None
        
        if location:
            if isinstance(location.get('timestamp'), str):
                location['timestamp'] = datetime.fromisoformat(location['timestamp'])
            
            result.append({
                "user": user,
                "location": location
            })
    
    return result


@router.get("/locations/user/{user_id}")
async def get_user_location_history(
    user_id: str,
    limit: int = 100,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    locations = await db.locations.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for location in locations:
        if isinstance(location.get('timestamp'), str):
            location['timestamp'] = datetime.fromisoformat(location['timestamp'])
    
    return locations



@router.get("/locations/history/{user_id}")
async def get_user_location_history_filtered(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user's location history with date filtering - Admin only"""
    await require_admin(current_user_id)
    
    # Build query
    query = {"user_id": user_id}
    
    # Add date filtering if provided
    if start_date or end_date:
        timestamp_filter = {}
        if start_date:
            start_dt = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
            timestamp_filter["$gte"] = start_dt.isoformat()
        if end_date:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, microsecond=999999)
            timestamp_filter["$lte"] = end_dt.isoformat()
        
        if timestamp_filter:
            query["timestamp"] = timestamp_filter
    
    # Fetch locations
    locations = await db.locations.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(1000).to_list(1000)
    
    # Convert timestamps
    for location in locations:
        if isinstance(location.get('timestamp'), str):
            location['timestamp'] = datetime.fromisoformat(location['timestamp'])
    
    return locations


@router.get("/locations/user/{user_id}/route")
async def get_user_route(
    user_id: str,
    date: Optional[str] = None,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user's route for a specific date (defaults to today)"""
    if date:
        start_date = datetime.fromisoformat(date)
    else:
        start_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    end_date = start_date + timedelta(days=1)
    
    locations = await db.locations.find(
        {
            "user_id": user_id,
            "timestamp": {"$gte": start_date.isoformat(), "$lt": end_date.isoformat()}
        },
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    for location in locations:
        if isinstance(location.get('timestamp'), str):
            location['timestamp'] = datetime.fromisoformat(location['timestamp'])
    
    return locations


@router.get("/locations/user/{user_id}/distance")
async def get_user_distance(
    user_id: str,
    date: Optional[str] = None,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Calculate total distance traveled by user"""
    if date:
        start_date = datetime.fromisoformat(date)
    else:
        start_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    end_date = start_date + timedelta(days=1)
    
    locations = await db.locations.find(
        {
            "user_id": user_id,
            "timestamp": {"$gte": start_date.isoformat(), "$lt": end_date.isoformat()}
        },
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    total_distance = 0
    for i in range(1, len(locations)):
        distance = calculate_distance(
            locations[i-1]['latitude'], locations[i-1]['longitude'],
            locations[i]['latitude'], locations[i]['longitude']
        )
        total_distance += distance
    
    return {
        "user_id": user_id,
        "date": start_date.isoformat(),
        "total_distance_meters": total_distance,
        "total_distance_km": round(total_distance / 1000, 2),
        "points_count": len(locations)
    }


@router.get("/locations/my-history")
async def get_my_location_history(
    limit: int = 100,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get current user's location history"""
    locations = await db.locations.find(
        {"user_id": current_user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for location in locations:
        if isinstance(location.get('timestamp'), str):
            location['timestamp'] = datetime.fromisoformat(location['timestamp'])
    
    return locations
