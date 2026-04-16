"""
Dashboard statistics helper functions
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any


async def get_user_counts(db) -> Dict[str, int]:
    """Get user statistics"""
    total_users = await db.users.count_documents({})
    total_sales = await db.users.count_documents({"role": "sales"})
    total_support = await db.users.count_documents({"role": "support"})
    
    return {
        "total_users": total_users,
        "total_sales": total_sales,
        "total_support": total_support
    }


async def get_activity_counts(db) -> Dict[str, int]:
    """Get activity statistics"""
    total_activities = await db.activities.count_documents({})
    pending_activities = await db.activities.count_documents({"status": "pending"})
    in_progress_activities = await db.activities.count_documents({"status": "in_progress"})
    completed_activities = await db.activities.count_documents({"status": "completed"})
    
    return {
        "total_activities": total_activities,
        "pending_activities": pending_activities,
        "in_progress_activities": in_progress_activities,
        "completed_activities": completed_activities
    }


async def get_activities_value(db) -> float:
    """Calculate total value from completed activities"""
    pipeline = [
        {"$match": {"status": "completed", "total_amount": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": None, "total": {"$sum": {"$toDouble": "$total_amount"}}}}
    ]
    result = await db.activities.aggregate(pipeline).to_list(1)
    return result[0]['total'] if result else 0


async def get_leads_stats(db, user_role: str, current_user_id: str) -> Dict[str, Any]:
    """
    Get leads statistics based on user role
    
    Args:
        db: Database connection
        user_role: User's role (admin or sales)
        current_user_id: Current user's ID
    
    Returns:
        Dictionary with leads statistics
    """
    # For sales users, filter by created_by; Admin sees all leads
    leads_filter = {"created_by": current_user_id} if user_role == "sales" else {}
    
    total_leads = await db.leads.count_documents(leads_filter)
    closed_won_leads = await db.leads.count_documents({**leads_filter, "status": "closed_won"})
    
    # Calculate total project value from closed won leads
    pipeline = [
        {"$match": {**leads_filter, "status": "closed_won", "project_value": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": None, "total": {"$sum": "$project_value"}}}
    ]
    
    result = await db.leads.aggregate(pipeline).to_list(1)
    total_project_value = result[0]['total'] if result else 0
    
    return {
        "total_leads": total_leads,
        "closed_won_leads": closed_won_leads,
        "total_project_value": total_project_value
    }


async def get_active_users_count(db) -> int:
    """Get count of active users (with locations in last 24 hours)"""
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    pipeline = [
        {"$match": {"timestamp": {"$gte": yesterday}}},
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"}
    ]
    result = await db.locations.aggregate(pipeline).to_list(1)
    return result[0]['count'] if result else 0


async def get_system_counts(db) -> Dict[str, int]:
    """Get system-level statistics"""
    total_teams = await db.teams.count_documents({})
    total_geofences = await db.geofences.count_documents({})
    
    return {
        "total_teams": total_teams,
        "total_geofences": total_geofences
    }
