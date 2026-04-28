"""Daily Tasks API Routes"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone, date
from models import DailyTaskCreate, DailyTask, DailyTaskUpdate
from auth import get_current_user
from rbac import get_current_user_data
from utils.dependencies import db

router = APIRouter()


@router.post("/daily-tasks", response_model=DailyTask)
async def create_daily_task(
    task: DailyTaskCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new daily task (Employee role)"""
    user_data = await get_current_user_data(current_user_id)
    
    # Only employees and admins can create daily tasks
    if user_data['role'] not in ['employee', 'admin']:
        raise HTTPException(status_code=403, detail="Only employees can log daily tasks")
    
    task_dict = task.model_dump()
    task_dict['id'] = str(uuid4())
    task_dict['user_id'] = current_user_id
    task_dict['user_name'] = user_data['name']
    task_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    task_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Convert date to ISO format string
    if isinstance(task_dict['task_date'], date):
        task_dict['task_date'] = task_dict['task_date'].isoformat()
    
    await db.daily_tasks.insert_one(task_dict)
    
    return DailyTask(**task_dict)


@router.get("/daily-tasks", response_model=List[DailyTask])
async def get_daily_tasks(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user_id: str = Depends(get_current_user)
):
    """Get daily tasks (Employees see their own, Admins see all)"""
    user_data = await get_current_user_data(current_user_id)
    
    query = {}
    
    # Employees can only see their own tasks
    if user_data['role'] == 'employee':
        query['user_id'] = current_user_id
    elif user_id:
        # Admins can filter by specific user
        query['user_id'] = user_id
    
    # Date range filter
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query['$gte'] = start_date
        if end_date:
            date_query['$lte'] = end_date
        if date_query:
            query['task_date'] = date_query
    
    tasks = await db.daily_tasks.find(query, {"_id": 0}).sort("task_date", -1).to_list(1000)
    
    return [DailyTask(**task) for task in tasks]


@router.get("/daily-tasks/{task_id}", response_model=DailyTask)
async def get_daily_task(
    task_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get a specific daily task"""
    task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    user_data = await get_current_user_data(current_user_id)
    
    # Employees can only view their own tasks
    if user_data['role'] == 'employee' and task['user_id'] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    return DailyTask(**task)


@router.put("/daily-tasks/{task_id}", response_model=DailyTask)
async def update_daily_task(
    task_id: str,
    task_update: DailyTaskUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update a daily task (employees can edit their own)"""
    task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    user_data = await get_current_user_data(current_user_id)
    
    # Employees can only edit their own tasks
    if user_data['role'] == 'employee' and task['user_id'] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this task")
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Convert date to ISO format string
    if 'task_date' in update_data and isinstance(update_data['task_date'], date):
        update_data['task_date'] = update_data['task_date'].isoformat()
    
    await db.daily_tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    updated_task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    
    return DailyTask(**updated_task)


@router.get("/daily-tasks/summary/stats")
async def get_daily_tasks_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user_id: str = Depends(get_current_user)
):
    """Get summary statistics of daily tasks (Admin only)"""
    user_data = await get_current_user_data(current_user_id)
    
    if user_data['role'] not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query['$gte'] = start_date
        if end_date:
            date_query['$lte'] = end_date
        if date_query:
            query['task_date'] = date_query
    
    # Aggregate by user
    pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": "$user_id",
                "user_name": {"$first": "$user_name"},
                "total_tasks": {"$sum": 1},
                "total_hours": {"$sum": "$hours_spent"}
            }
        },
        {"$sort": {"total_hours": -1}}
    ]
    
    summary = await db.daily_tasks.aggregate(pipeline).to_list(100)
    
    return {
        "employee_summary": summary,
        "total_employees": len(summary),
        "total_tasks": sum(s['total_tasks'] for s in summary),
        "total_hours": sum(s['total_hours'] for s in summary)
    }


from uuid import uuid4
