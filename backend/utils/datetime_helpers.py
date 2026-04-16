"""
Datetime utility functions for consistent datetime handling across the application
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def convert_to_iso_format(value: Any) -> str:
    """Convert datetime object to ISO format string"""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, str):
        return value
    return str(value)


def parse_iso_to_datetime(value: Any) -> Optional[datetime]:
    """Parse ISO format string to datetime object"""
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except (ValueError, TypeError):
            return None
    if isinstance(value, datetime):
        return value
    return None


def format_date_for_display(value: Any, format_str: str = '%Y-%m-%d') -> str:
    """Format datetime/string to specified display format"""
    if not value:
        return ''
    
    dt = parse_iso_to_datetime(value)
    if dt:
        return dt.strftime(format_str)
    return ''


def convert_datetime_fields(data: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
    """
    Convert specified datetime fields in a dictionary to ISO format strings
    
    Args:
        data: Dictionary containing the data
        fields: List of field names to convert
    
    Returns:
        Modified data dictionary (in-place modification)
    """
    for field in fields:
        if field in data and data[field] is not None:
            data[field] = convert_to_iso_format(data[field])
    return data


def convert_serial_numbers_dates(serial_numbers: List[Any]) -> List[Dict]:
    """
    Convert datetime fields in serial numbers to ISO format
    
    Args:
        serial_numbers: List of serial number objects/dicts
    
    Returns:
        List of serial numbers with converted dates
    """
    date_fields = ['sale_date', 'customer_warranty_end_date', 'next_maintenance_date']
    
    for serial in serial_numbers:
        if isinstance(serial, dict):
            convert_datetime_fields(serial, date_fields)
    
    return serial_numbers


def parse_datetime_fields(data: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
    """
    Parse ISO string fields back to datetime objects
    
    Args:
        data: Dictionary containing the data
        fields: List of field names to parse
    
    Returns:
        Modified data dictionary (in-place modification)
    """
    for field in fields:
        if field in data and isinstance(data[field], str):
            parsed = parse_iso_to_datetime(data[field])
            if parsed:
                data[field] = parsed
    return data


def get_current_utc_iso() -> str:
    """Get current UTC time as ISO format string"""
    return datetime.now(timezone.utc).isoformat()


def get_current_date_string() -> str:
    """Get current date as YYYY-MM-DD string"""
    return datetime.now(timezone.utc).isoformat().split('T')[0]
