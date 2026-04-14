"""Activity-related models for CRM application."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid


class ActivityType(str, Enum):
    """Activity type enumeration."""
    demo_poc = "demo_poc"
    warranty = "warranty"
    service_call = "service_call"
    periodic_visit = "periodic_visit"
    new_installation = "new_installation"
    others = "others"


class ActivityStatus(str, Enum):
    """Activity status enumeration."""
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ActivityPriority(str, Enum):
    """Activity priority enumeration."""
    low = "low"
    medium = "medium"
    high = "high"


class ActivityCreate(BaseModel):
    """Model for creating a new activity."""
    title: str
    description: Optional[str] = None
    assigned_to: str  # user_id
    client_id: Optional[str] = None
    customer_id: Optional[str] = None
    product_id: Optional[str] = None
    serial_number: Optional[str] = None
    status: ActivityStatus = ActivityStatus.pending
    priority: ActivityPriority = ActivityPriority.medium
    activity_type: Optional[str] = "others"
    support_staff: Optional[str] = None
    due_date: Optional[datetime] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    maintenance_report: Optional[str] = None
    invoice_number: Optional[str] = None
    work_order_no: Optional[str] = None
    total_amount: Optional[float] = None
    next_maintenance_date: Optional[datetime] = None


class Activity(ActivityCreate):
    """Complete activity model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status_history: Optional[List[dict]] = []
    progress_updates: Optional[List[dict]] = []
    completion_date: Optional[datetime] = None


class ActivityUpdate(BaseModel):
    """Model for updating activity information."""
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    client_id: Optional[str] = None
    customer_id: Optional[str] = None
    product_ids: Optional[List[str]] = None
    status: Optional[ActivityStatus] = None
    priority: Optional[ActivityPriority] = None
    activity_type: Optional[str] = None
    support_staff: Optional[str] = None
    due_date: Optional[datetime] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    notes: Optional[str] = None
    maintenance_report: Optional[str] = None
    invoice_number: Optional[str] = None
    work_order_no: Optional[str] = None
    total_amount: Optional[float] = None
    next_maintenance_date: Optional[datetime] = None
