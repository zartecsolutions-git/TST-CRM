"""Product-related models for CRM application."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid


class ProductCategory(str, Enum):
    """Product category enumeration."""
    industrial = "industrial"
    retails = "retails"
    others = "others"


class SerialNumberAssignment(BaseModel):
    """Serial number assignment and tracking."""
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


class ProductCreate(BaseModel):
    """Model for creating a new product."""
    name: str
    part_number: Optional[str] = None
    category: Optional[str] = None
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
    serial_numbers: List[SerialNumberAssignment] = []


class Product(ProductCreate):
    """Complete product model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    warranty_finished_date: Optional[datetime] = None


class ProductUpdate(BaseModel):
    """Model for updating product information."""
    name: Optional[str] = None
    part_number: Optional[str] = None
    category: Optional[str] = None
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
