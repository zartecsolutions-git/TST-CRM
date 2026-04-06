from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone

from auth import get_current_user
from utils.dependencies import get_db

router = APIRouter()


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Get current user details to check role
    current_user = await db.users.find_one({"id": current_user_id}, {"_id": 0})
    user_role = current_user.get("role") if current_user else None
    
    total_users = await db.users.count_documents({})
    total_sales = await db.users.count_documents({"role": "sales"})
    total_support = await db.users.count_documents({"role": "support"})
    total_activities = await db.activities.count_documents({})
    pending_activities = await db.activities.count_documents({"status": "pending"})
    in_progress_activities = await db.activities.count_documents({"status": "in_progress"})
    completed_activities = await db.activities.count_documents({"status": "completed"})
    total_teams = await db.teams.count_documents({})
    total_geofences = await db.geofences.count_documents({})
    
    # For sales users, filter leads by created_by (sales rep)
    # For admin, show all leads
    if user_role == "sales":
        # Sales users see only their leads (leads they created)
        leads_filter = {"created_by": current_user_id}
        total_leads = await db.leads.count_documents(leads_filter)
        closed_won_leads = await db.leads.count_documents({**leads_filter, "status": "closed_won"})
        
        # Calculate total project value for sales user's closed won leads
        closed_won_pipeline = [
            {"$match": {**leads_filter, "status": "closed_won", "project_value": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": None, "total": {"$sum": "$project_value"}}}
        ]
    else:
        # Admin sees all leads
        total_leads = await db.leads.count_documents({})
        closed_won_leads = await db.leads.count_documents({"status": "closed_won"})
        
        # Calculate total project value from all closed won leads
        closed_won_pipeline = [
            {"$match": {"status": "closed_won", "project_value": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": None, "total": {"$sum": "$project_value"}}}
        ]
    
    project_value_result = await db.leads.aggregate(closed_won_pipeline).to_list(1)
    total_project_value = project_value_result[0]['total'] if project_value_result else 0
    
    # Calculate total value from completed activities
    completed_activities_pipeline = [
        {"$match": {"status": "completed", "total_amount": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": None, "total": {"$sum": {"$toDouble": "$total_amount"}}}}
    ]
    activities_value_result = await db.activities.aggregate(completed_activities_pipeline).to_list(1)
    total_activities_value = activities_value_result[0]['total'] if activities_value_result else 0
    
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
        "in_progress_activities": in_progress_activities,
        "completed_activities": completed_activities,
        "total_activities_value": total_activities_value,
        "total_teams": total_teams,
        "total_geofences": total_geofences,
        "total_leads": total_leads,
        "closed_won_leads": closed_won_leads,
        "total_project_value": total_project_value
    }
