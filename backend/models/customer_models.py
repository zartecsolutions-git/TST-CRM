"""Customer-related models for CRM application."""

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class CustomerCreate(BaseModel):
    """Model for creating a new customer."""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None
    business_vertical: Optional[str] = None
    contact_person: Optional[str] = None
    vat_reg_no: Optional[str] = None
    cr_no: Optional[str] = None
    division: Optional[str] = None


class Customer(CustomerCreate):
    """Complete customer model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CustomerUpdate(BaseModel):
    """Model for updating customer information."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None
    business_vertical: Optional[str] = None
    contact_person: Optional[str] = None
    vat_reg_no: Optional[str] = None
    cr_no: Optional[str] = None
    division: Optional[str] = None
