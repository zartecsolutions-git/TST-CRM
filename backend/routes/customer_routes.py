"""Customer Management API Routes"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from models import Customer, CustomerCreate, CustomerUpdate
from auth import get_current_user
from rbac import require_admin, require_admin_or_data_entry, get_current_user_data, block_employee
from utils.dependencies import db

router = APIRouter(prefix="/customers", tags=["customers"], dependencies=[Depends(block_employee)])

@router.post("", response_model=Customer)
async def create_customer(
    customer_data: CustomerCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new customer"""
    # Sales and Support can create customers
    user_data = await get_current_user_data(current_user_id)
    if user_data['role'] not in ['admin', 'sales', 'support']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if customer email already exists
    existing = await db.customers.find_one({"email": customer_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    
    customer = Customer(**customer_data.model_dump(), created_by=current_user_id)
    customer_dict = customer.model_dump()
    customer_dict['created_at'] = customer_dict['created_at'].isoformat()
    customer_dict['updated_at'] = customer_dict['updated_at'].isoformat()
    
    await db.customers.insert_one(customer_dict)
    return customer

@router.get("", response_model=List[Customer])
async def get_customers(current_user_id: str = Depends(get_current_user)):
    """Get all customers"""
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    
    for customer in customers:
        if isinstance(customer.get('created_at'), str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
        if isinstance(customer.get('updated_at'), str):
            customer['updated_at'] = datetime.fromisoformat(customer['updated_at'])
    
    return customers

@router.get("/{customer_id}", response_model=Customer)
async def get_customer(
    customer_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get a single customer by ID"""
    customer_doc = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer_doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if isinstance(customer_doc.get('created_at'), str):
        customer_doc['created_at'] = datetime.fromisoformat(customer_doc['created_at'])
    if isinstance(customer_doc.get('updated_at'), str):
        customer_doc['updated_at'] = datetime.fromisoformat(customer_doc['updated_at'])
    
    return Customer(**customer_doc)

@router.put("/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update a customer (admin and data_entry)"""
    await require_admin_or_data_entry(current_user_id)
    
    update_data = customer_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer_doc = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    
    if isinstance(customer_doc.get('created_at'), str):
        customer_doc['created_at'] = datetime.fromisoformat(customer_doc['created_at'])
    if isinstance(customer_doc.get('updated_at'), str):
        customer_doc['updated_at'] = datetime.fromisoformat(customer_doc['updated_at'])
    
    return Customer(**customer_doc)

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a customer (admin and data_entry)"""
    await require_admin_or_data_entry(current_user_id)
    
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}
