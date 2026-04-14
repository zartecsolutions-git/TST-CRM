"""Sales-related models (Leads and Payments) for CRM application."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class LeadCreate(BaseModel):
    """Model for creating a new lead."""
    customer_id: str
    lead_title: str
    description: Optional[str] = None
    lead_source: Optional[str] = None
    status: str = "new"
    priority: Optional[str] = "medium"
    estimated_value: Optional[float] = None
    quote_ref: Optional[str] = None
    quote_value: Optional[float] = None
    quote_date: Optional[str] = None
    expected_close_date: Optional[str] = None
    notes: Optional[str] = None
    project_value: Optional[float] = None


class Lead(LeadCreate):
    """Complete lead model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
    lost_reason: Optional[str] = None
    updates_history: Optional[List[dict]] = []


class LeadUpdate(BaseModel):
    """Model for updating lead information."""
    customer_id: Optional[str] = None
    lead_title: Optional[str] = None
    description: Optional[str] = None
    lead_source: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_value: Optional[float] = None
    quote_ref: Optional[str] = None
    quote_value: Optional[float] = None
    quote_date: Optional[str] = None
    expected_close_date: Optional[str] = None
    notes: Optional[str] = None
    project_value: Optional[float] = None
    lost_reason: Optional[str] = None
    update_note: Optional[str] = None
    update_date: Optional[str] = None


class PaymentCreate(BaseModel):
    """Model for creating a new payment."""
    invoice_number: str
    customer_name: str
    invoice_amount: float
    received_amount: float
    received_date: str  # YYYY-MM-DD format
    payment_mode: str  # Cash, Cheque, Bank Transfer
    payment_status: str  # Full, Partial
    balance_amount: float


class Payment(PaymentCreate):
    """Complete payment model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaymentUpdate(BaseModel):
    """Model for updating payment information."""
    received_amount: Optional[float] = None
    received_date: Optional[str] = None
    payment_mode: Optional[str] = None
    payment_status: Optional[str] = None
    balance_amount: Optional[float] = None
