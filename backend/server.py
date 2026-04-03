from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
import json
import math
import re
import csv
import io

from models import (
    UserCreate, UserLogin, User, UserUpdate, UserRole,
    LocationCreate, Location,
    ActivityCreate, Activity, ActivityUpdate, ActivityStatus,
    TeamCreate, Team, TeamUpdate,
    GeofenceCreate, Geofence, GeofenceUpdate,
    GeofenceAlert, AlertType,
    CustomerCreate, Customer, CustomerUpdate,
    ProductCreate, Product, ProductUpdate,
    LeadCreate, Lead, LeadUpdate,
    Token
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, security
)
from rbac import require_admin, require_admin_or_agent, get_current_user_data

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(**user_data.model_dump(exclude={'password'}))
    user_dict = user.model_dump()
    user_dict['password_hash'] = get_password_hash(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return Token(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc or not verify_password(credentials.password, user_doc.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Convert datetime strings back to datetime objects
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('updated_at'), str):
        user_doc['updated_at'] = datetime.fromisoformat(user_doc['updated_at'])
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return Token(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('updated_at'), str):
        user_doc['updated_at'] = datetime.fromisoformat(user_doc['updated_at'])
    
    return User(**user_doc)

# ============================================================================
# USER ENDPOINTS
# ============================================================================

@api_router.get("/users", response_model=List[User])
async def get_users(
    role: Optional[UserRole] = None,
    current_user_id: str = Depends(get_current_user)
):
    query = {}
    if role:
        query['role'] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        if isinstance(user.get('updated_at'), str):
            user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    return users

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('updated_at'), str):
        user_doc['updated_at'] = datetime.fromisoformat(user_doc['updated_at'])
    
    return User(**user_doc)

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user_id: str = Depends(get_current_user)
):
    current_user = await get_current_user_data(current_user_id)
    
    # Only admins can update other users, users can update their own profile (except role)
    if current_user['role'] != UserRole.admin:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update other users")
        # Non-admins cannot change their own role
        if user_update.role is not None:
            raise HTTPException(status_code=403, detail="Cannot change your own role")
    
    update_data = user_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('updated_at'), str):
        user_doc['updated_at'] = datetime.fromisoformat(user_doc['updated_at'])
    
    return User(**user_doc)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    # Only admins can delete users
    await require_admin(current_user_id)
    
    # Cannot delete yourself
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ============================================================================
# LOCATION ENDPOINTS
# ============================================================================

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

@api_router.post("/locations", response_model=Location)
async def update_location(
    location_data: LocationCreate,
    current_user_id: str = Depends(get_current_user)
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

@api_router.get("/locations/current")
async def get_current_locations(current_user_id: str = Depends(get_current_user)):
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

@api_router.get("/locations/user/{user_id}")
async def get_user_location_history(
    user_id: str,
    limit: int = 100,
    current_user_id: str = Depends(get_current_user)
):
    locations = await db.locations.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for location in locations:
        if isinstance(location.get('timestamp'), str):
            location['timestamp'] = datetime.fromisoformat(location['timestamp'])
    
    return locations

@api_router.get("/locations/user/{user_id}/route")
async def get_user_route(
    user_id: str,
    date: Optional[str] = None,
    current_user_id: str = Depends(get_current_user)
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

@api_router.get("/locations/user/{user_id}/distance")
async def get_user_distance(
    user_id: str,
    date: Optional[str] = None,
    current_user_id: str = Depends(get_current_user)
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

# ============================================================================
# ACTIVITIES ENDPOINTS
# ============================================================================

@api_router.post("/activities", response_model=Activity)
async def create_activity(
    activity_data: ActivityCreate,
    current_user_id: str = Depends(get_current_user)
):
    # All authenticated users can create activities
    activity = Activity(**activity_data.model_dump(), created_by=current_user_id)
    activity_dict = activity.model_dump()
    activity_dict['created_at'] = activity_dict['created_at'].isoformat()
    activity_dict['updated_at'] = activity_dict['updated_at'].isoformat()
    if activity_dict.get('due_date'):
        activity_dict['due_date'] = activity_dict['due_date'].isoformat()
    
    await db.activities.insert_one(activity_dict)
    return activity

@api_router.get("/activities", response_model=List[Activity])
async def get_activities(
    status: Optional[ActivityStatus] = None,
    assigned_to: Optional[str] = None,
    current_user_id: str = Depends(get_current_user)
):
    query = {}
    if status:
        query['status'] = status
    if assigned_to:
        query['assigned_to'] = assigned_to
    
    activities = await db.activities.find(query, {"_id": 0}).to_list(1000)
    
    for activity in activities:
        if isinstance(activity.get('created_at'), str):
            activity['created_at'] = datetime.fromisoformat(activity['created_at'])
        if isinstance(activity.get('updated_at'), str):
            activity['updated_at'] = datetime.fromisoformat(activity['updated_at'])
        if activity.get('due_date') and isinstance(activity['due_date'], str):
            activity['due_date'] = datetime.fromisoformat(activity['due_date'])
    
    return activities

@api_router.get("/activities/{activity_id}", response_model=Activity)
async def get_activity(activity_id: str, current_user_id: str = Depends(get_current_user)):
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

@api_router.put("/activities/{activity_id}", response_model=Activity)
async def update_activity(
    activity_id: str,
    activity_update: ActivityUpdate,
    current_user_id: str = Depends(get_current_user)
):
    update_data = activity_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # If status is being updated and notes are provided, add to history
    if 'status' in update_data:
        activity_doc = await db.activities.find_one({"id": activity_id}, {"_id": 0})
        if not activity_doc:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        # Create status history entry
        status_entry = {
            'status': update_data['status'],
            'updated_by': current_user_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'notes': update_data.pop('notes', '')  # Remove notes from main update, add to history
        }
        
        # Update status history
        await db.activities.update_one(
            {"id": activity_id},
            {"$push": {"status_history": status_entry}}
        )
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    if 'due_date' in update_data and update_data['due_date']:
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    result = await db.activities.update_one(
        {"id": activity_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity_doc = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    
    if isinstance(activity_doc.get('created_at'), str):
        activity_doc['created_at'] = datetime.fromisoformat(activity_doc['created_at'])
    if isinstance(activity_doc.get('updated_at'), str):
        activity_doc['updated_at'] = datetime.fromisoformat(activity_doc['updated_at'])
    if activity_doc.get('due_date') and isinstance(activity_doc['due_date'], str):
        activity_doc['due_date'] = datetime.fromisoformat(activity_doc['due_date'])
    
    return Activity(**activity_doc)

@api_router.post("/activities/{activity_id}/progress")
async def add_progress_update(
    activity_id: str,
    update_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Add a progress update to an in-progress activity"""
    activity_doc = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    if not activity_doc:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    if activity_doc.get('status') != 'in_progress':
        raise HTTPException(status_code=400, detail="Can only add progress updates to in-progress activities")
    
    # Create progress entry
    progress_entry = {
        'update': update_data.get('update', ''),
        'percentage': update_data.get('percentage', 0),
        'updated_by': current_user_id,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    # Add to progress_updates array
    await db.activities.update_one(
        {"id": activity_id},
        {
            "$push": {"progress_updates": progress_entry},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Progress update added successfully", "progress": progress_entry}

@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, current_user_id: str = Depends(get_current_user)):
    # Only admins can delete activities
    await require_admin(current_user_id)
    
    result = await db.activities.delete_one({"id": activity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Activity deleted successfully"}

@api_router.get("/activities/stats/summary")
async def get_activities_stats(current_user_id: str = Depends(get_current_user)):
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

# ============================================================================
# TEAMS ENDPOINTS
# ============================================================================

@api_router.post("/teams", response_model=Team)
async def create_team(
    team_data: TeamCreate,
    current_user_id: str = Depends(get_current_user)
):
    # Only admins can create teams
    await require_admin(current_user_id)
    
    team = Team(**team_data.model_dump())
    team_dict = team.model_dump()
    team_dict['created_at'] = team_dict['created_at'].isoformat()
    team_dict['updated_at'] = team_dict['updated_at'].isoformat()
    
    await db.teams.insert_one(team_dict)
    return team

@api_router.get("/teams", response_model=List[Team])
async def get_teams(current_user_id: str = Depends(get_current_user)):
    teams = await db.teams.find({}, {"_id": 0}).to_list(1000)
    
    for team in teams:
        if isinstance(team.get('created_at'), str):
            team['created_at'] = datetime.fromisoformat(team['created_at'])
        if isinstance(team.get('updated_at'), str):
            team['updated_at'] = datetime.fromisoformat(team['updated_at'])
    
    return teams

@api_router.get("/teams/{team_id}", response_model=Team)
async def get_team(team_id: str, current_user_id: str = Depends(get_current_user)):
    team_doc = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team_doc:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if isinstance(team_doc.get('created_at'), str):
        team_doc['created_at'] = datetime.fromisoformat(team_doc['created_at'])
    if isinstance(team_doc.get('updated_at'), str):
        team_doc['updated_at'] = datetime.fromisoformat(team_doc['updated_at'])
    
    return Team(**team_doc)

@api_router.put("/teams/{team_id}", response_model=Team)
async def update_team(
    team_id: str,
    team_update: TeamUpdate,
    current_user_id: str = Depends(get_current_user)
):
    update_data = team_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.teams.update_one(
        {"id": team_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_doc = await db.teams.find_one({"id": team_id}, {"_id": 0})
    
    if isinstance(team_doc.get('created_at'), str):
        team_doc['created_at'] = datetime.fromisoformat(team_doc['created_at'])
    if isinstance(team_doc.get('updated_at'), str):
        team_doc['updated_at'] = datetime.fromisoformat(team_doc['updated_at'])
    
    return Team(**team_doc)

@api_router.delete("/teams/{team_id}")
async def delete_team(team_id: str, current_user_id: str = Depends(get_current_user)):
    # Only admins can delete teams
    await require_admin(current_user_id)
    
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team deleted successfully"}

@api_router.post("/teams/{team_id}/members/{user_id}")
async def add_team_member(
    team_id: str,
    user_id: str,
    current_user_id: str = Depends(get_current_user)
):
    # Only admins can add team members
    await require_admin(current_user_id)
    
    # Check if user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add user to team
    result = await db.teams.update_one(
        {"id": team_id},
        {"$addToSet": {"member_ids": user_id}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Update user's team_id
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"team_id": team_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Member added successfully"}

@api_router.delete("/teams/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: str,
    user_id: str,
    current_user_id: str = Depends(get_current_user)
):
    # Only admins can remove team members
    await require_admin(current_user_id)
    
    result = await db.teams.update_one(
        {"id": team_id},
        {"$pull": {"member_ids": user_id}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Remove user's team_id
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"team_id": None, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Member removed successfully"}

# ============================================================================
# GEOFENCES ENDPOINTS
# ============================================================================

@api_router.post("/geofences", response_model=Geofence)
async def create_geofence(
    geofence_data: GeofenceCreate,
    current_user_id: str = Depends(get_current_user)
):
    # Only admins can create geofences
    await require_admin(current_user_id)
    
    geofence = Geofence(**geofence_data.model_dump(), created_by=current_user_id)
    geofence_dict = geofence.model_dump()
    geofence_dict['created_at'] = geofence_dict['created_at'].isoformat()
    
    await db.geofences.insert_one(geofence_dict)
    return geofence

@api_router.get("/geofences", response_model=List[Geofence])
async def get_geofences(current_user_id: str = Depends(get_current_user)):
    geofences = await db.geofences.find({}, {"_id": 0}).to_list(1000)
    
    for geofence in geofences:
        if isinstance(geofence.get('created_at'), str):
            geofence['created_at'] = datetime.fromisoformat(geofence['created_at'])
    
    return geofences

@api_router.get("/geofences/{geofence_id}", response_model=Geofence)
async def get_geofence(geofence_id: str, current_user_id: str = Depends(get_current_user)):
    geofence_doc = await db.geofences.find_one({"id": geofence_id}, {"_id": 0})
    if not geofence_doc:
        raise HTTPException(status_code=404, detail="Geofence not found")
    
    if isinstance(geofence_doc.get('created_at'), str):
        geofence_doc['created_at'] = datetime.fromisoformat(geofence_doc['created_at'])
    
    return Geofence(**geofence_doc)

@api_router.put("/geofences/{geofence_id}", response_model=Geofence)
async def update_geofence(
    geofence_id: str,
    geofence_update: GeofenceUpdate,
    current_user_id: str = Depends(get_current_user)
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

@api_router.delete("/geofences/{geofence_id}")
async def delete_geofence(geofence_id: str, current_user_id: str = Depends(get_current_user)):
    # Only admins can delete geofences
    await require_admin(current_user_id)
    
    result = await db.geofences.delete_one({"id": geofence_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return {"message": "Geofence deleted successfully"}

@api_router.get("/geofences/alerts/list")
async def get_geofence_alerts(
    limit: int = 100,
    current_user_id: str = Depends(get_current_user)
):
    alerts = await db.geofence_alerts.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for alert in alerts:
        if isinstance(alert.get('timestamp'), str):
            alert['timestamp'] = datetime.fromisoformat(alert['timestamp'])
    
    return alerts

# ============================================================================
# DASHBOARD ENDPOINTS
# ============================================================================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user_id: str = Depends(get_current_user)):
    total_users = await db.users.count_documents({})
    total_sales = await db.users.count_documents({"role": "sales"})
    total_support = await db.users.count_documents({"role": "support"})
    total_activities = await db.activities.count_documents({})
    pending_activities = await db.activities.count_documents({"status": "pending"})
    completed_activities = await db.activities.count_documents({"status": "completed"})
    total_teams = await db.teams.count_documents({})
    total_geofences = await db.geofences.count_documents({})
    
    # Get active users (users with locations in last 24 hours)
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    active_users_pipeline = [
        {"$match": {"timestamp": {"$gte": yesterday}}},
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"}
    ]
    active_users_result = await db.locations.aggregate(active_users_pipeline).to_list(1)
    active_users = active_users_result[0]['count'] if active_users_result else 0
    
    return {
        "total_users": total_users,
        "total_sales": total_sales,
        "total_support": total_support,
        "active_users": active_users,
        "total_activities": total_activities,
        "pending_activities": pending_activities,
        "completed_activities": completed_activities,
        "total_teams": total_teams,
        "total_geofences": total_geofences
    }

# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_warranty_finished_date(purchase_date: datetime, warranty_period: str) -> Optional[datetime]:
    """Calculate warranty end date from purchase date and warranty period string"""
    if not purchase_date or not warranty_period:
        return None
    
    # Parse warranty period (e.g., "12 months", "24 months", "1 year", "2 years")
    warranty_period = warranty_period.lower().strip()
    
    # Extract number and unit
    match = re.match(r'(\d+)\s*(month|months|year|years)', warranty_period)
    if not match:
        return None
    
    value = int(match.group(1))
    unit = match.group(2)
    
    if 'month' in unit:
        return purchase_date + relativedelta(months=value)
    elif 'year' in unit:
        return purchase_date + relativedelta(years=value)
    
    return None

# ============================================================================
# CUSTOMERS ENDPOINTS
# ============================================================================

@api_router.post("/customers", response_model=Customer)
async def create_customer(
    customer_data: CustomerCreate,
    current_user_id: str = Depends(get_current_user)
):
    # Sales and Support can create customers
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] not in ['admin', 'sales', 'support']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if customer email already exists
    existing = await db.customers.find_one({"email": customer_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    
    customer = Customer(**customer_data.model_dump(), created_by=current_user_id)
    customer_dict = customer.model_dump()
    customer_dict['created_at'] = customer_dict['created_at'].isoformat()
    customer_dict['updated_at'] = customer_dict['updated_at'].isoformat()
    
    await db.customers.insert_one(customer_dict)
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(
    current_user_id: str = Depends(get_current_user)
):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    
    for customer in customers:
        if isinstance(customer.get('created_at'), str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
        if isinstance(customer.get('updated_at'), str):
            customer['updated_at'] = datetime.fromisoformat(customer['updated_at'])
    
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(
    customer_id: str,
    current_user_id: str = Depends(get_current_user)
):
    customer_doc = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer_doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if isinstance(customer_doc.get('created_at'), str):
        customer_doc['created_at'] = datetime.fromisoformat(customer_doc['created_at'])
    if isinstance(customer_doc.get('updated_at'), str):
        customer_doc['updated_at'] = datetime.fromisoformat(customer_doc['updated_at'])
    
    return Customer(**customer_doc)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    current_user_id: str = Depends(get_current_user)
):
    # Only Admin can update customers
    await require_admin(current_user_id)
    
    update_data = customer_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer_doc = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    
    if isinstance(customer_doc.get('created_at'), str):
        customer_doc['created_at'] = datetime.fromisoformat(customer_doc['created_at'])
    if isinstance(customer_doc.get('updated_at'), str):
        customer_doc['updated_at'] = datetime.fromisoformat(customer_doc['updated_at'])
    
    return Customer(**customer_doc)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: str,
    current_user_id: str = Depends(get_current_user)
):
    # Only Admin can delete customers
    await require_admin(current_user_id)
    
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# ============================================================================
# PRODUCTS ENDPOINTS
# ============================================================================

@api_router.post("/products", response_model=Product)
async def create_product(
    product_data: ProductCreate,
    current_user_id: str = Depends(get_current_user)
):
    # Only Admin can create products
    await require_admin(current_user_id)
    
    # Check if serial number already exists
    existing = await db.products.find_one({"serial_number": product_data.serial_number})
    if existing:
        raise HTTPException(status_code=400, detail="Product with this serial number already exists")
    
    # Create product instance
    product = Product(**product_data.model_dump(), created_by=current_user_id)
    
    # Calculate warranty_finished_date if purchase_date and warranty_period are provided
    if product.purchase_date and product.warranty_period:
        product.warranty_finished_date = calculate_warranty_finished_date(
            product.purchase_date, 
            product.warranty_period
        )
    
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    product_dict['updated_at'] = product_dict['updated_at'].isoformat()
    if product_dict.get('purchase_date'):
        product_dict['purchase_date'] = product_dict['purchase_date'].isoformat()
    if product_dict.get('installation_date'):
        product_dict['installation_date'] = product_dict['installation_date'].isoformat()
    if product_dict.get('next_maintenance_date'):
        product_dict['next_maintenance_date'] = product_dict['next_maintenance_date'].isoformat()
    if product_dict.get('warranty_finished_date'):
        product_dict['warranty_finished_date'] = product_dict['warranty_finished_date'].isoformat()
    
    await db.products.insert_one(product_dict)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products(
    current_user_id: str = Depends(get_current_user)
):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product.get('updated_at'), str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
        if product.get('purchase_date') and isinstance(product['purchase_date'], str):
            product['purchase_date'] = datetime.fromisoformat(product['purchase_date'])
        if product.get('installation_date') and isinstance(product['installation_date'], str):
            product['installation_date'] = datetime.fromisoformat(product['installation_date'])
        if product.get('next_maintenance_date') and isinstance(product['next_maintenance_date'], str):
            product['next_maintenance_date'] = datetime.fromisoformat(product['next_maintenance_date'])
        if product.get('warranty_finished_date') and isinstance(product['warranty_finished_date'], str):
            product['warranty_finished_date'] = datetime.fromisoformat(product['warranty_finished_date'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(
    product_id: str,
    current_user_id: str = Depends(get_current_user)
):
    product_doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product_doc:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product_doc.get('created_at'), str):
        product_doc['created_at'] = datetime.fromisoformat(product_doc['created_at'])
    if isinstance(product_doc.get('updated_at'), str):
        product_doc['updated_at'] = datetime.fromisoformat(product_doc['updated_at'])
    if product_doc.get('purchase_date') and isinstance(product_doc['purchase_date'], str):
        product_doc['purchase_date'] = datetime.fromisoformat(product_doc['purchase_date'])
    if product_doc.get('installation_date') and isinstance(product_doc['installation_date'], str):
        product_doc['installation_date'] = datetime.fromisoformat(product_doc['installation_date'])
    
    return Product(**product_doc)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user_id: str = Depends(get_current_user)
):
    # Only Admin can update products
    await require_admin(current_user_id)
    
    update_data = product_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Check if serial number is being updated and if it already exists
    if 'serial_number' in update_data:
        existing = await db.products.find_one({
            "serial_number": update_data['serial_number'],
            "id": {"$ne": product_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Product with this serial number already exists")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    if update_data.get('purchase_date'):
        update_data['purchase_date'] = update_data['purchase_date'].isoformat()
    if update_data.get('installation_date'):
        update_data['installation_date'] = update_data['installation_date'].isoformat()
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if isinstance(product_doc.get('created_at'), str):
        product_doc['created_at'] = datetime.fromisoformat(product_doc['created_at'])
    if isinstance(product_doc.get('updated_at'), str):
        product_doc['updated_at'] = datetime.fromisoformat(product_doc['updated_at'])
    if product_doc.get('purchase_date') and isinstance(product_doc['purchase_date'], str):
        product_doc['purchase_date'] = datetime.fromisoformat(product_doc['purchase_date'])
    if product_doc.get('installation_date') and isinstance(product_doc['installation_date'], str):
        product_doc['installation_date'] = datetime.fromisoformat(product_doc['installation_date'])
    
    return Product(**product_doc)

@api_router.get("/products/alerts/warranty-expiring")
async def get_warranty_expiring_products(
    days: int = 30,
    current_user_id: str = Depends(get_current_user)
):
    """Get products with warranty expiring within specified days"""
    now = datetime.now(timezone.utc)
    future_date = now + timedelta(days=days)
    
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    expiring_products = []
    
    for product in products:
        if product.get('warranty_finished_date'):
            warranty_date = product['warranty_finished_date']
            if isinstance(warranty_date, str):
                warranty_date = datetime.fromisoformat(warranty_date)
            
            # Check if warranty expires within the specified days
            if now <= warranty_date <= future_date:
                days_remaining = (warranty_date - now).days
                product['days_remaining'] = days_remaining
                expiring_products.append(product)
    
    return expiring_products

@api_router.get("/products/alerts/maintenance-due")
async def get_maintenance_due_products(
    days: int = 30,
    current_user_id: str = Depends(get_current_user)
):
    """Get products with maintenance due within specified days"""
    now = datetime.now(timezone.utc)
    future_date = now + timedelta(days=days)
    
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    maintenance_due = []
    
    for product in products:
        if product.get('next_maintenance_date'):
            maintenance_date = product['next_maintenance_date']
            if isinstance(maintenance_date, str):
                maintenance_date = datetime.fromisoformat(maintenance_date)
            
            # Check if maintenance is due within the specified days
            if maintenance_date <= future_date:
                days_until = (maintenance_date - now).days
                product['days_until_maintenance'] = days_until
                maintenance_due.append(product)
    
    return maintenance_due

@api_router.get("/products/export/csv")
async def export_products_csv(
    current_user_id: str = Depends(get_current_user)
):
    """Export all products to CSV with warranty status"""
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'name', 'serial_number', 'model', 'category', 'license_code',
        'price', 'warranty_period', 'purchase_date', 'warranty_finished_date',
        'warranty_status', 'next_maintenance_date', 'specifications'
    ])
    
    writer.writeheader()
    now = datetime.now(timezone.utc)
    
    for product in products:
        # Determine warranty status
        warranty_status = 'N/A'
        if product.get('warranty_finished_date'):
            warranty_date = product['warranty_finished_date']
            if isinstance(warranty_date, str):
                warranty_date = datetime.fromisoformat(warranty_date)
            warranty_status = 'Active' if warranty_date > now else 'Expired'
        
        writer.writerow({
            'name': product.get('name', ''),
            'serial_number': product.get('serial_number', ''),
            'model': product.get('model', ''),
            'category': product.get('category', ''),
            'license_code': product.get('license_code', ''),
            'price': product.get('price', ''),
            'warranty_period': product.get('warranty_period', ''),
            'purchase_date': product.get('purchase_date', ''),
            'warranty_finished_date': product.get('warranty_finished_date', ''),
            'warranty_status': warranty_status,
            'next_maintenance_date': product.get('next_maintenance_date', ''),
            'specifications': product.get('specifications', '')
        })
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_export.csv"}
    )

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user_id: str = Depends(get_current_user)
):
    # Only Admin can delete products
    await require_admin(current_user_id)
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.post("/products/import/csv")
async def import_products_csv(
    file_content: str,
    current_user_id: str = Depends(get_current_user)
):
    """Bulk import products from CSV with auto warranty calculation"""
    await require_admin(current_user_id)
    
    try:
        # Parse CSV
        csv_file = io.StringIO(file_content)
        reader = csv.DictReader(csv_file)
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Check if serial number exists
                existing = await db.products.find_one({"serial_number": row['serial_number']})
                if existing:
                    errors.append(f"Row {row_num}: Serial number {row['serial_number']} already exists")
                    continue
                
                # Create product
                product_data = {
                    "name": row['name'],
                    "serial_number": row['serial_number'],
                    "model": row.get('model', ''),
                    "category": row.get('category', ''),
                    "license_code": row.get('license_code', ''),
                    "price": float(row['price']) if row.get('price') else None,
                    "warranty_period": row.get('warranty_period', ''),
                    "description": row.get('description', ''),
                    "specifications": row.get('specifications', '')
                }
                
                # Parse dates if provided
                if row.get('purchase_date'):
                    product_data['purchase_date'] = datetime.fromisoformat(row['purchase_date'].replace('Z', '+00:00'))
                if row.get('next_maintenance_date'):
                    product_data['next_maintenance_date'] = datetime.fromisoformat(row['next_maintenance_date'].replace('Z', '+00:00'))
                
                product = Product(**product_data, created_by=current_user_id)
                
                # Calculate warranty_finished_date
                if product.purchase_date and product.warranty_period:
                    product.warranty_finished_date = calculate_warranty_finished_date(
                        product.purchase_date,
                        product.warranty_period
                    )
                
                # Save to database
                product_dict = product.model_dump()
                product_dict['created_at'] = product_dict['created_at'].isoformat()
                product_dict['updated_at'] = product_dict['updated_at'].isoformat()
                if product_dict.get('purchase_date'):
                    product_dict['purchase_date'] = product_dict['purchase_date'].isoformat()
                if product_dict.get('next_maintenance_date'):
                    product_dict['next_maintenance_date'] = product_dict['next_maintenance_date'].isoformat()
                if product_dict.get('warranty_finished_date'):
                    product_dict['warranty_finished_date'] = product_dict['warranty_finished_date'].isoformat()
                
                await db.products.insert_one(product_dict)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "imported": imported_count,
            "errors": errors,
            "total_rows": row_num - 1 if 'row_num' in locals() else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")


# ============================================================================
# LEADS (SALES FEATURE)
# ============================================================================

@api_router.post("/leads", response_model=Lead)
async def create_lead(
    lead_data: LeadCreate,
    current_user_id: str = Depends(get_current_user)
):
    # Only sales and admin can create leads
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] not in ['admin', 'sales']:
        raise HTTPException(status_code=403, detail="Only sales team can create leads")
    
    lead = Lead(**lead_data.model_dump(), created_by=current_user_id)
    lead_dict = lead.model_dump()
    lead_dict['created_at'] = lead_dict['created_at'].isoformat()
    lead_dict['updated_at'] = lead_dict['updated_at'].isoformat()
    if lead_dict.get('quote_date'):
        lead_dict['quote_date'] = lead_dict['quote_date'].isoformat()
    if lead_dict.get('expected_close_date'):
        lead_dict['expected_close_date'] = lead_dict['expected_close_date'].isoformat()
    
    await db.leads.insert_one(lead_dict)
    return lead

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(
    current_user_id: str = Depends(get_current_user),
    status: Optional[str] = None
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
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
        if isinstance(lead.get('updated_at'), str):
            lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
        if lead.get('quote_date') and isinstance(lead.get('quote_date'), str):
            lead['quote_date'] = datetime.fromisoformat(lead['quote_date'])
        if lead.get('expected_close_date') and isinstance(lead.get('expected_close_date'), str):
            lead['expected_close_date'] = datetime.fromisoformat(lead['expected_close_date'])
        if lead.get('closed_at') and isinstance(lead.get('closed_at'), str):
            lead['closed_at'] = datetime.fromisoformat(lead['closed_at'])
    
    return leads

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(
    lead_id: str,
    current_user_id: str = Depends(get_current_user)
):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Sales users can only view their own leads
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] == 'sales' and lead['created_by'] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this lead")
    
    if isinstance(lead.get('created_at'), str):
        lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    if isinstance(lead.get('updated_at'), str):
        lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    if lead.get('quote_date') and isinstance(lead.get('quote_date'), str):
        lead['quote_date'] = datetime.fromisoformat(lead['quote_date'])
    if lead.get('expected_close_date') and isinstance(lead.get('expected_close_date'), str):
        lead['expected_close_date'] = datetime.fromisoformat(lead['expected_close_date'])
    if lead.get('closed_at') and isinstance(lead.get('closed_at'), str):
        lead['closed_at'] = datetime.fromisoformat(lead['closed_at'])
    
    return Lead(**lead)

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    current_user_id: str = Depends(get_current_user)
):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Sales users can only update their own leads
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] == 'sales' and lead['created_by'] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this lead")
    
    update_data = lead_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Track update in history
    update_note = update_data.pop('update_note', None)
    update_history_entry = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": current_user_id,
        "note": update_note,
        "changes": update_data.copy()
    }
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Auto-set closed_at when status changes to closed_won or closed_lost
    if 'status' in update_data and update_data['status'] in ['closed_won', 'closed_lost']:
        update_data['closed_at'] = datetime.now(timezone.utc).isoformat()
    
    # Convert datetime fields to ISO format
    if 'quote_date' in update_data and isinstance(update_data['quote_date'], datetime):
        update_data['quote_date'] = update_data['quote_date'].isoformat()
    if 'expected_close_date' in update_data and isinstance(update_data['expected_close_date'], datetime):
        update_data['expected_close_date'] = update_data['expected_close_date'].isoformat()
    
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
    
    if isinstance(updated_lead.get('created_at'), str):
        updated_lead['created_at'] = datetime.fromisoformat(updated_lead['created_at'])
    if isinstance(updated_lead.get('updated_at'), str):
        updated_lead['updated_at'] = datetime.fromisoformat(updated_lead['updated_at'])
    if updated_lead.get('quote_date') and isinstance(updated_lead.get('quote_date'), str):
        updated_lead['quote_date'] = datetime.fromisoformat(updated_lead['quote_date'])
    if updated_lead.get('expected_close_date') and isinstance(updated_lead.get('expected_close_date'), str):
        updated_lead['expected_close_date'] = datetime.fromisoformat(updated_lead['expected_close_date'])
    if updated_lead.get('closed_at') and isinstance(updated_lead.get('closed_at'), str):
        updated_lead['closed_at'] = datetime.fromisoformat(updated_lead['closed_at'])
    
    return Lead(**updated_lead)

@api_router.delete("/leads/{lead_id}")
async def delete_lead(
    lead_id: str,
    current_user_id: str = Depends(get_current_user)
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

@api_router.get("/leads/stats/summary")
async def get_leads_summary(current_user_id: str = Depends(get_current_user)):
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


# ============================================================================
# WEBSOCKET ENDPOINTS
# ============================================================================

@app.websocket("/ws/locations")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
