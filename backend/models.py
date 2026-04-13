from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from enum import Enum

# Enums
class UserRole(str, Enum):
    super_admin = "super_admin"
    admin = "admin"
    sales = "sales"
    support = "support"

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

# Commission Slab Model
class CommissionSlab(BaseModel):
    from_value: float = 0.0
    to_value: float
    commission_percentage: float

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.sales
    monthly_sales_target: Optional[float] = None  # Monthly sales target
    commission_slabs: Optional[List[CommissionSlab]] = None  # Tiered commission structure
    commission_percentage: Optional[float] = 5.0  # Fallback for legacy/simple commission

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
    role: Optional[UserRole] = None
    team_id: Optional[str] = None
    company_id: Optional[str] = None
    monthly_sales_target: Optional[float] = None
    commission_slabs: Optional[List[CommissionSlab]] = None
    commission_percentage: Optional[float] = None

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

class ActivityType(str, Enum):
    demo_poc = "demo_poc"
    warranty = "warranty"
    service_call = "service_call"
    periodic_visit = "periodic_visit"
    new_installation = "new_installation"
    others = "others"

# Activity Models
class ActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: str  # user_id
    client_id: Optional[str] = None
    customer_id: Optional[str] = None  # Customer reference
    product_id: Optional[str] = None  # Single product
    serial_number: Optional[str] = None  # Product serial number
    status: ActivityStatus = ActivityStatus.pending
    priority: ActivityPriority = ActivityPriority.medium
    activity_type: Optional[str] = "others"  # New field
    support_staff: Optional[str] = None  # Support staff user_id
    due_date: Optional[datetime] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    maintenance_report: Optional[str] = None
    invoice_number: Optional[str] = None  # For completed activities
    work_order_no: Optional[str] = None  # For completed activities
    total_amount: Optional[float] = None  # For completed activities
    next_maintenance_date: Optional[datetime] = None  # Next maintenance due

class Activity(ActivityCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: Optional[str] = None
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
    activity_type: Optional[str] = None  # New field
    support_staff: Optional[str] = None  # Support staff user_id
    due_date: Optional[datetime] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    notes: Optional[str] = None  # Status update notes
    maintenance_report: Optional[str] = None  # NEW: Maintenance work report
    invoice_number: Optional[str] = None  # For completed activities
    work_order_no: Optional[str] = None  # For completed activities
    total_amount: Optional[float] = None  # For completed activities
    next_maintenance_date: Optional[datetime] = None  # Next maintenance due date

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
    vat_reg_no: Optional[str] = None  # NEW: VAT Registration Number
    cr_no: Optional[str] = None  # NEW: Commercial Registration Number
    division: Optional[str] = None  # NEW: Customer Division (linked to master data)

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
    vat_reg_no: Optional[str] = None  # NEW
    cr_no: Optional[str] = None  # NEW
    division: Optional[str] = None  # NEW

class ProductCategory(str, Enum):
    industrial = "industrial"
    retails = "retails"
    others = "others"

class SerialNumberAssignment(BaseModel):
    serial_number: str
    purchase_date: Optional[datetime] = None
    supplier_warranty_period: Optional[int] = None  # in months
    supplier_warranty_expiry: Optional[datetime] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    sale_date: Optional[datetime] = None
    customer_warranty_period: Optional[int] = None  # in months
    customer_warranty_end_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    license_code: Optional[str] = None
    status: str = "in_stock"  # in_stock, sold

# Product Models
class ProductCreate(BaseModel):
    name: str
    part_number: Optional[str] = None  # Part Number for product identification
    category: Optional[str] = None  # Changed from enum to string for master data
    sub_category: Optional[str] = None
    brand: Optional[str] = None
    division: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    model: Optional[str] = None
    specifications: Optional[str] = None
    supplier_warranty_period: Optional[str] = None  # e.g., "12 months", "24 months"
    purchase_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    license_code: Optional[str] = None
    # Multiple serial numbers with customer assignments
    serial_numbers: List[SerialNumberAssignment] = []

class Product(ProductCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    warranty_finished_date: Optional[datetime] = None  # Auto-calculated from warranty_period + purchase_date

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    part_number: Optional[str] = None
    category: Optional[str] = None  # Changed from enum to string for master data
    sub_category: Optional[str] = None
    brand: Optional[str] = None
    division: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    model: Optional[str] = None
    specifications: Optional[str] = None
    supplier_warranty_period: Optional[str] = None
    purchase_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    license_code: Optional[str] = None
    serial_numbers: Optional[List[SerialNumberAssignment]] = None
    sale_date: Optional[datetime] = None
    invoice_number: Optional[str] = None
    sale_amount: Optional[float] = None
    sale_notes: Optional[str] = None

# Leads Models (Sales Feature)
class LeadCreate(BaseModel):
    customer_id: str
    lead_title: str
    description: Optional[str] = None
    lead_source: Optional[str] = None  # e.g., "Website", "Referral", "Cold Call", "Trade Show"
    status: str = "new"  # new, contacted, qualified, proposal, negotiation, closed_won, closed_lost
    priority: Optional[str] = "medium"  # low, medium, high
    estimated_value: Optional[float] = None
    quote_ref: Optional[str] = None
    quote_value: Optional[float] = None
    quote_date: Optional[str] = None  # Accept as string, convert to datetime in endpoint
    expected_close_date: Optional[str] = None  # Accept as string
    notes: Optional[str] = None
    project_value: Optional[float] = None  # Actual project value when closed_won

class Lead(LeadCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
    lost_reason: Optional[str] = None
    updates_history: Optional[List[dict]] = []  # Track all updates

class LeadUpdate(BaseModel):
    customer_id: Optional[str] = None
    lead_title: Optional[str] = None
    description: Optional[str] = None
    lead_source: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_value: Optional[float] = None
    quote_ref: Optional[str] = None
    quote_value: Optional[float] = None
    quote_date: Optional[str] = None  # Accept as string
    expected_close_date: Optional[str] = None  # Accept as string
    notes: Optional[str] = None
    project_value: Optional[float] = None  # Actual project value when closed_won
    lost_reason: Optional[str] = None
    update_note: Optional[str] = None  # Note for this specific update
    update_date: Optional[str] = None  # Date when this update was made

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

# Company Models
class CompanyBase(BaseModel):
    name: str
    country: str
    currency: str
    tax_id: Optional[str] = None
    tax_percentage: float = 0.0
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    timezone: str = "UTC"
    is_default: bool = False

class CompanyCreate(CompanyBase):
    logo_url: Optional[str] = None

class Company(CompanyBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    tax_id: Optional[str] = None
    tax_percentage: Optional[float] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = None
    timezone: Optional[str] = None
    is_default: Optional[bool] = None
