from fastapi import HTTPException, status
from auth import get_current_user
from models import UserRole

async def require_super_admin(current_user_id: str):
    """Middleware to check if user is super admin"""
    from server import db
    user = await db.users.find_one({"id": current_user_id}, {"_id": 0})
    if not user or user.get('role') != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return user

async def require_admin(current_user_id: str):
    """Middleware to check if user is admin or super admin"""
    from server import db
    user = await db.users.find_one({"id": current_user_id}, {"_id": 0})
    if not user or user.get('role') not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

async def require_admin_or_agent(current_user_id: str):
    """Middleware to check if user is admin or agent"""
    from server import db
    user = await db.users.find_one({"id": current_user_id}, {"_id": 0})
    if not user or user.get('role') not in [UserRole.admin, UserRole.agent]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Agent access required"
        )
    return user

async def get_current_user_data(current_user_id: str):
    """Get current user data"""
    from server import db
    user = await db.users.find_one({"id": current_user_id}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
