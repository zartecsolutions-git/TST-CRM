"""User-related models for CRM application."""

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid


class UserRole(str, Enum):
    """User role enumeration."""
    super_admin = "super_admin"
    admin = "admin"
    sales = "sales"
    support = "support"


class UserStatus(str, Enum):
    """User status enumeration."""
    active = "active"
    inactive = "inactive"


class CommissionSlab(BaseModel):
    """Commission slab for tiered commission structure."""
    from_value: float = 0.0
    to_value: float
    commission_percentage: float


class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.sales
    monthly_sales_target: Optional[float] = None
    commission_slabs: Optional[List[CommissionSlab]] = None
    commission_percentage: Optional[float] = 5.0


class UserCreate(UserBase):
    """Model for creating a new user."""
    password: str


class UserLogin(BaseModel):
    """Model for user login."""
    email: EmailStr
    password: str


class User(UserBase):
    """Complete user model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    avatar_url: Optional[str] = None
    status: UserStatus = UserStatus.active
    team_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserUpdate(BaseModel):
    """Model for updating user information."""
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


class Token(BaseModel):
    """JWT token model."""
    access_token: str
    token_type: str = "bearer"
    user: User
