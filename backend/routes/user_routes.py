from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone

from models import User, UserUpdate, UserRole
from auth import get_current_user
from rbac import require_admin, get_current_user_data
from utils.dependencies import get_db

router = APIRouter()


@router.get("/users", response_model=List[User])
async def get_users(
    role: Optional[UserRole] = None,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
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


@router.get("/users/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('updated_at'), str):
        user_doc['updated_at'] = datetime.fromisoformat(user_doc['updated_at'])
    
    return User(**user_doc)


@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
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


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only admins can delete users
    await require_admin(current_user_id)
    
    # Cannot delete yourself
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}



@router.put("/users/{user_id}/password")
async def change_user_password(
    user_id: str,
    password_data: dict,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Admin endpoint to change any user's password"""
    # Only admins can change other users' passwords
    await require_admin(current_user_id)
    
    new_password = password_data.get('new_password')
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check if user exists
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash the new password
    from auth import get_password_hash
    hashed_password = get_password_hash(new_password)
    
    # Update password
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "password_hash": hashed_password,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"Password updated successfully for user {user_doc.get('name', user_id)}"}
