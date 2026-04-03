from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from enum import Enum

# Enums
class UserRole(str, Enum):
    admin = "admin"
    agent = "agent"
    client = "client"

class UserStatus(str, Enum):
    active = "active"
    inactive = "inactive"

class ActivityStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class ActivityPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class LocationType(str, Enum):
    auto = "auto"
    manual = "manual"
    checkin = "checkin"
    checkout = "checkout"

class AlertType(str, Enum):
    enter = "enter"
    exit = "exit"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.agent

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    avatar_url: Optional[str] = None
    status: UserStatus = UserStatus.active
    team_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    status: Optional[UserStatus] = None
    team_id: Optional[str] = None

# Location Models
class LocationCreate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    location_type: LocationType = LocationType.auto
    address: Optional[str] = None

class Location(LocationCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Activity Models
class ActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: str  # user_id
    client_id: Optional[str] = None
    customer_id: Optional[str] = None  # Customer reference
    product_ids: Optional[List[str]] = []  # Multiple products
    status: ActivityStatus = ActivityStatus.pending
    priority: ActivityPriority = ActivityPriority.medium
    due_date: Optional[datetime] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    maintenance_report: Optional[str] = None  # NEW: Maintenance work report after completion

class Activity(ActivityCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status_history: Optional[List[dict]] = []  # Track status changes with notes
    progress_updates: Optional[List[dict]] = []  # Track progress while in_progress
    completion_date: Optional[datetime] = None  # NEW: When activity was completed

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    client_id: Optional[str] = None
    customer_id: Optional[str] = None  # Customer reference
    product_ids: Optional[List[str]] = None  # Multiple products
    status: Optional[ActivityStatus] = None
    priority: Optional[ActivityPriority] = None
    due_date: Optional[datetime] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    notes: Optional[str] = None  # Status update notes
    maintenance_report: Optional[str] = None  # NEW: Maintenance work report

# Team Models
class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    team_lead_id: Optional[str] = None

class Team(TeamCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    team_lead_id: Optional[str] = None

# Geofence Models
class GeofenceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    center_lat: float
    center_lng: float
    radius: float  # in meters
    color: str = "#3B82F6"
    alert_on_enter: bool = True
    alert_on_exit: bool = True

class Geofence(GeofenceCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GeofenceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    radius: Optional[float] = None
    color: Optional[str] = None
    alert_on_enter: Optional[bool] = None
    alert_on_exit: Optional[bool] = None

# Geofence Alert Models
class GeofenceAlert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    geofence_id: str
    user_id: str
    alert_type: AlertType
    latitude: float
    longitude: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Customer Models
class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None
    business_vertical: Optional[str] = None
    contact_person: Optional[str] = None

class Customer(CustomerCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None
    business_vertical: Optional[str] = None
    contact_person: Optional[str] = None

# Product Models
class ProductCreate(BaseModel):
    name: str
    serial_number: str
    description: Optional[str] = None
    price: Optional[float] = None
    model: Optional[str] = None
    category: Optional[str] = None
    specifications: Optional[str] = None
    warranty_period: Optional[str] = None  # e.g., "12 months", "24 months"
    purchase_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    license_code: Optional[str] = None
    # Sales/Customer Linkage (NEW)
    customer_id: Optional[str] = None  # Linked customer after sale
    sale_date: Optional[datetime] = None
    invoice_number: Optional[str] = None
    sale_amount: Optional[float] = None
    sale_notes: Optional[str] = None

class Product(ProductCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    warranty_finished_date: Optional[datetime] = None  # Auto-calculated from warranty_period + purchase_date

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    model: Optional[str] = None
    category: Optional[str] = None
    specifications: Optional[str] = None
    warranty_period: Optional[str] = None
    purchase_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    license_code: Optional[str] = None
    # Sales/Customer Linkage (NEW)
    customer_id: Optional[str] = None
    sale_date: Optional[datetime] = None
    invoice_number: Optional[str] = None
    sale_amount: Optional[float] = None
    sale_notes: Optional[str] = None

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
