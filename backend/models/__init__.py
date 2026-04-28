"""Models package for CRM application."""

from .user_models import (
    UserRole, UserStatus, CommissionSlab,
    UserBase, UserCreate, UserLogin, User, UserUpdate, Token
)
from .customer_models import CustomerCreate, Customer, CustomerUpdate
from .product_models import (
    ProductCategory, SerialNumberAssignment,
    ProductCreate, Product, ProductUpdate
)
from .activity_models import (
    ActivityType, ActivityStatus, ActivityPriority,
    ActivityCreate, Activity, ActivityUpdate
)
from .sales_models import LeadCreate, Lead, LeadUpdate, PaymentCreate, Payment, PaymentUpdate
from .location_models import (
    LocationType, AlertType,
    LocationCreate, Location,
    TeamCreate, Team, TeamUpdate,
    GeofenceCreate, Geofence, GeofenceUpdate, GeofenceAlert
)
from .company_models import CompanyBase, CompanyCreate, Company, CompanyUpdate
from .daily_task_models import DailyTaskCreate, DailyTask, DailyTaskUpdate, ProgressNote, ProgressNoteCreate

__all__ = [
    # User models
    'UserRole', 'UserStatus', 'CommissionSlab',
    'UserBase', 'UserCreate', 'UserLogin', 'User', 'UserUpdate', 'Token',
    
    # Customer models
    'CustomerCreate', 'Customer', 'CustomerUpdate',
    
    # Product models
    'ProductCategory', 'SerialNumberAssignment',
    'ProductCreate', 'Product', 'ProductUpdate',
    
    # Activity models
    'ActivityType', 'ActivityStatus', 'ActivityPriority',
    'ActivityCreate', 'Activity', 'ActivityUpdate',
    
    # Sales models
    'LeadCreate', 'Lead', 'LeadUpdate',
    'PaymentCreate', 'Payment', 'PaymentUpdate',
    
    # Location models
    'LocationType', 'AlertType',
    'LocationCreate', 'Location',
    'TeamCreate', 'Team', 'TeamUpdate',
    'GeofenceCreate', 'Geofence', 'GeofenceUpdate', 'GeofenceAlert',
    
    # Company models
    'CompanyBase', 'CompanyCreate', 'Company', 'CompanyUpdate',
    
    # Daily Task models
    'DailyTaskCreate', 'DailyTask', 'DailyTaskUpdate', 'ProgressNote', 'ProgressNoteCreate',
]
