from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone

from auth import get_current_user
from rbac import block_employee
from utils.dependencies import get_db
from utils.dashboard_helpers import (
    get_user_counts,
    get_activity_counts,
    get_activities_value,
    get_leads_stats,
    get_active_users_count,
    get_system_counts
)

router = APIRouter(dependencies=[Depends(block_employee)])


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Get current user details to check role
    current_user = await db.users.find_one({"id": current_user_id}, {"_id": 0})
    user_role = current_user.get("role") if current_user else None
    
    # Get all statistics using helper functions
    user_stats = await get_user_counts(db)
    activity_stats = await get_activity_counts(db)
    activities_value = await get_activities_value(db)
    leads_stats = await get_leads_stats(db, user_role, current_user_id)
    active_users = await get_active_users_count(db)
    system_stats = await get_system_counts(db)
    
    return {
        **user_stats,
        "active_users": active_users,
        **activity_stats,
        "total_activities_value": activities_value,
        **system_stats,
        **leads_stats
    }
