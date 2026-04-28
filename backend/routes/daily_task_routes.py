"""Daily Tasks API Routes"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone, date
from uuid import uuid4
from models import DailyTaskCreate, DailyTask, DailyTaskUpdate, ProgressNoteCreate
from auth import get_current_user
from rbac import get_current_user_data
from utils.dependencies import db

router = APIRouter()


def _ensure_not_completed(task: dict):
    if task.get('status') == 'completed':
        raise HTTPException(
            status_code=409,
            detail="Task is closed/completed and cannot be modified"
        )


def _can_modify(task: dict, user_data: dict, user_id: str) -> bool:
    """Employees can modify only their own task; admins can modify any."""
    if user_data['role'] in ['admin', 'super_admin']:
        return True
    return task['user_id'] == user_id


@router.get("/daily-tasks/customers")
async def get_customer_dropdown(current_user_id: str = Depends(get_current_user)):
    """Lightweight customer list (id + name) for the Daily Tasks dropdown.
    Accessible to employees so they can link a task to a customer without
    having full customer-module permissions."""
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] not in ['employee', 'admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")

    customers = await db.customers.find(
        {}, {"_id": 0, "id": 1, "name": 1}
    ).sort("name", 1).to_list(2000)
    return [{"id": c.get("id"), "name": c.get("name")} for c in customers]


@router.post("/daily-tasks", response_model=DailyTask)
async def create_daily_task(
    task: DailyTaskCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new daily task (Employee role)"""
    user_data = await get_current_user_data(current_user_id)

    if user_data['role'] not in ['employee', 'admin']:
        raise HTTPException(status_code=403, detail="Only employees can log daily tasks")

    task_dict = task.model_dump()

    # If a customer_id was provided, hydrate customer_name from DB to keep them in sync
    if task_dict.get('customer_id'):
        cust = await db.customers.find_one(
            {"id": task_dict['customer_id']}, {"_id": 0, "name": 1}
        )
        if not cust:
            raise HTTPException(status_code=400, detail="Selected customer not found")
        task_dict['customer_name'] = cust.get('name')

    task_dict['id'] = str(uuid4())
    task_dict['user_id'] = current_user_id
    task_dict['user_name'] = user_data['name']
    task_dict['progress_notes'] = []
    task_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    task_dict['updated_at'] = datetime.now(timezone.utc).isoformat()

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
    if user_data['role'] == 'employee':
        query['user_id'] = current_user_id
    elif user_id:
        query['user_id'] = user_id

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
    task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] == 'employee' and task['user_id'] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")

    return DailyTask(**task)


@router.put("/daily-tasks/{task_id}", response_model=DailyTask)
async def update_daily_task(
    task_id: str,
    task_update: DailyTaskUpdate,
    current_user_id: str = Depends(get_current_user)
):
    task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    user_data = await get_current_user_data(current_user_id)
    if not _can_modify(task, user_data, current_user_id):
        raise HTTPException(status_code=403, detail="Not authorized to edit this task")

    _ensure_not_completed(task)

    update_data = task_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Re-hydrate customer_name if customer_id was changed
    if 'customer_id' in update_data and update_data['customer_id']:
        cust = await db.customers.find_one(
            {"id": update_data['customer_id']}, {"_id": 0, "name": 1}
        )
        if not cust:
            raise HTTPException(status_code=400, detail="Selected customer not found")
        update_data['customer_name'] = cust.get('name')
    elif 'customer_id' in update_data and update_data['customer_id'] in (None, ""):
        update_data['customer_name'] = None

    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    if 'task_date' in update_data and isinstance(update_data['task_date'], date):
        update_data['task_date'] = update_data['task_date'].isoformat()

    await db.daily_tasks.update_one({"id": task_id}, {"$set": update_data})
    updated_task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    return DailyTask(**updated_task)


@router.post("/daily-tasks/{task_id}/progress", response_model=DailyTask)
async def add_progress_note(
    task_id: str,
    payload: ProgressNoteCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Append a timestamped progress note to a task. Allowed only when task is not completed."""
    task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    user_data = await get_current_user_data(current_user_id)
    if not _can_modify(task, user_data, current_user_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    _ensure_not_completed(task)

    now_iso = datetime.now(timezone.utc).isoformat()
    note_doc = {"note": payload.note.strip(), "timestamp": now_iso}

    await db.daily_tasks.update_one(
        {"id": task_id},
        {
            "$push": {"progress_notes": note_doc},
            "$set": {"status": "in_progress", "updated_at": now_iso},
        },
    )
    updated_task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    return DailyTask(**updated_task)


@router.post("/daily-tasks/{task_id}/close", response_model=DailyTask)
async def close_daily_task(
    task_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Mark a task as completed. Once closed, the task can no longer be edited."""
    task = await db.daily_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    user_data = await get_current_user_data(current_user_id)
    if not _can_modify(task, user_data, current_user_id):
        raise HTTPException(status_code=403, detail="Not authorized to close this task")

    if task.get('status') == 'completed':
        return DailyTask(**task)

    now_iso = datetime.now(timezone.utc).isoformat()
    await db.daily_tasks.update_one(
        {"id": task_id},
        {"$set": {"status": "completed", "updated_at": now_iso}},
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

    pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": "$user_id",
                "user_name": {"$first": "$user_name"},
                "total_tasks": {"$sum": 1},
                "total_hours": {"$sum": "$hours_spent"},
            }
        },
        {"$sort": {"total_hours": -1}},
    ]
    summary = await db.daily_tasks.aggregate(pipeline).to_list(100)
    return {
        "employee_summary": summary,
        "total_employees": len(summary),
        "total_tasks": sum(s['total_tasks'] for s in summary),
        "total_hours": sum(s['total_hours'] for s in summary),
    }
