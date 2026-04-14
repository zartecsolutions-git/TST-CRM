"""Company settings models for CRM application."""

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class CompanyBase(BaseModel):
    """Base company model with common fields."""
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
    """Model for creating a new company."""
    logo_url: Optional[str] = None


class Company(CompanyBase):
    """Complete company model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CompanyUpdate(BaseModel):
    """Model for updating company information."""
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
