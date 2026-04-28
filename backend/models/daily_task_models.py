"""Daily Task models for employee task logging."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date, timezone
import uuid


class ProgressNote(BaseModel):
    """A timestamped progress note appended to a daily task."""
    note: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProgressNoteCreate(BaseModel):
    note: str = Field(min_length=1)


class DailyTaskBase(BaseModel):
    """Base daily task model."""
    task_date: date
    task_description: str
    hours_spent: float = Field(gt=0, le=24)  # Hours must be between 0 and 24
    status: str = Field(default="logged")  # logged | in_progress | completed
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None


class DailyTaskCreate(DailyTaskBase):
    """Model for creating a new daily task."""
    pass


class DailyTask(DailyTaskBase):
    """Complete daily task model."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Employee who logged the task
    user_name: str  # Employee name for easy display
    progress_notes: List[ProgressNote] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DailyTaskUpdate(BaseModel):
    """Model for updating a daily task."""
    task_date: Optional[date] = None
    task_description: Optional[str] = None
    hours_spent: Optional[float] = Field(None, gt=0, le=24)
    status: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
