"""Location, Team, and Geofence models for CRM application."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid


class LocationType(str, Enum):
    """Location type enumeration."""
    auto = "auto"
    manual = "manual"
    checkin = "checkin"
    checkout = "checkout"


class AlertType(str, Enum):
    """Alert type enumeration."""
    enter = "enter"
    exit = "exit"


class LocationCreate(BaseModel):
    """Model for creating a new location."""
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    location_type: LocationType = LocationType.auto
    address: Optional[str] = None


class Location(LocationCreate):
    """Complete location model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TeamCreate(BaseModel):
    """Model for creating a new team."""
    name: str
    description: Optional[str] = None
    manager_id: str


class Team(TeamCreate):
    """Complete team model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TeamUpdate(BaseModel):
    """Model for updating team information."""
    name: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[str] = None


class GeofenceCreate(BaseModel):
    """Model for creating a new geofence."""
    name: str
    latitude: float
    longitude: float
    radius: float  # in meters
    description: Optional[str] = None
    address: Optional[str] = None
    trigger_on_enter: bool = True
    trigger_on_exit: bool = True


class Geofence(GeofenceCreate):
    """Complete geofence model with all fields."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GeofenceUpdate(BaseModel):
    """Model for updating geofence information."""
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[float] = None
    description: Optional[str] = None
    address: Optional[str] = None
    trigger_on_enter: Optional[bool] = None
    trigger_on_exit: Optional[bool] = None


class GeofenceAlert(BaseModel):
    """Model for geofence alerts."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    geofence_id: str
    user_id: str
    alert_type: AlertType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    latitude: float
    longitude: float
