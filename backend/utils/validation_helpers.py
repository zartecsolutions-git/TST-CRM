"""
Validation utility functions for data validation and authorization
"""
from typing import Any, Dict, List, Optional
from fastapi import HTTPException


async def validate_serial_number_uniqueness(
    db,
    serial_numbers: List[Any],
    product_id: str
) -> None:
    """
    Validate that serial numbers are unique across products
    
    Args:
        db: Database connection
        serial_numbers: List of serial number objects to validate
        product_id: ID of the product being updated (to exclude from check)
    
    Raises:
        HTTPException: If duplicate serial number is found
    """
    if not serial_numbers:
        return
    
    for serial_obj in serial_numbers:
        # Extract serial number from object or dict
        if isinstance(serial_obj, dict) and 'serial_number' in serial_obj:
            serial_num = serial_obj['serial_number']
        else:
            serial_num = serial_obj.serial_number if hasattr(serial_obj, 'serial_number') else None
        
        if serial_num:
            # Check if serial number exists in other products
            existing = await db.products.find_one({
                "serial_numbers.serial_number": serial_num,
                "id": {"$ne": product_id}
            })
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Serial number {serial_num} already exists in another product"
                )


def validate_update_data(update_data: Dict[str, Any]) -> None:
    """
    Validate that update data is not empty
    
    Args:
        update_data: Dictionary of fields to update
    
    Raises:
        HTTPException: If no fields to update
    """
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")


async def check_lead_ownership(
    db,
    lead: Dict[str, Any],
    current_user_id: str,
    user_data: Dict[str, Any]
) -> None:
    """
    Check if user has permission to update lead
    
    Args:
        db: Database connection
        lead: Lead document
        current_user_id: Current user ID
        user_data: Current user data
    
    Raises:
        HTTPException: If user doesn't have permission
    """
    if user_data['role'] == 'sales' and lead['created_by'] != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this lead"
        )


async def check_activity_edit_permission(
    activity: Dict[str, Any],
    current_user_id: str,
    user_data: Dict[str, Any]
) -> None:
    """
    Check if user has permission to edit activity
    
    Args:
        activity: Activity document
        current_user_id: Current user ID
        user_data: Current user data
    
    Raises:
        HTTPException: If user doesn't have permission
    """
    # Sales users cannot edit activities
    if user_data['role'] == 'sales':
        raise HTTPException(
            status_code=403,
            detail="Sales users have read-only access to activities"
        )
    
    # Admin, creator, or assignee can edit
    if (user_data['role'] != 'admin' and 
        activity.get('created_by') != current_user_id and 
        activity.get('assigned_to') != current_user_id):
        raise HTTPException(
            status_code=403,
            detail="You can only edit activities that you created or are assigned to"
        )
