from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timezone

from models import Team, TeamCreate, TeamUpdate
from auth import get_current_user
from rbac import require_admin
from utils.dependencies import get_db

router = APIRouter()


@router.post("/teams", response_model=Team)
async def create_team(
    team_data: TeamCreate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only admins can create teams
    await require_admin(current_user_id)
    
    team = Team(**team_data.model_dump())
    team_dict = team.model_dump()
    team_dict['created_at'] = team_dict['created_at'].isoformat()
    team_dict['updated_at'] = team_dict['updated_at'].isoformat()
    
    await db.teams.insert_one(team_dict)
    return team


@router.get("/teams", response_model=List[Team])
async def get_teams(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    teams = await db.teams.find({}, {"_id": 0}).to_list(1000)
    
    for team in teams:
        if isinstance(team.get('created_at'), str):
            team['created_at'] = datetime.fromisoformat(team['created_at'])
        if isinstance(team.get('updated_at'), str):
            team['updated_at'] = datetime.fromisoformat(team['updated_at'])
    
    return teams


@router.get("/teams/{team_id}", response_model=Team)
async def get_team(
    team_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    team_doc = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team_doc:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if isinstance(team_doc.get('created_at'), str):
        team_doc['created_at'] = datetime.fromisoformat(team_doc['created_at'])
    if isinstance(team_doc.get('updated_at'), str):
        team_doc['updated_at'] = datetime.fromisoformat(team_doc['updated_at'])
    
    return Team(**team_doc)


@router.put("/teams/{team_id}", response_model=Team)
async def update_team(
    team_id: str,
    team_update: TeamUpdate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
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


@router.delete("/teams/{team_id}")
async def delete_team(
    team_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only admins can delete teams
    await require_admin(current_user_id)
    
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team deleted successfully"}


@router.post("/teams/{team_id}/members/{user_id}")
async def add_team_member(
    team_id: str,
    user_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
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


@router.delete("/teams/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: str,
    user_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
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
