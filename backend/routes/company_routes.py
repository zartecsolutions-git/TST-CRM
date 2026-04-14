from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timezone

from models import CompanyCreate, Company, CompanyUpdate
from auth import get_current_user
from rbac import require_admin, get_current_user_data
from utils.dependencies import get_db

router = APIRouter()


@router.post("/companies", response_model=Company)
async def create_company(
    company_data: CompanyCreate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new company (Admin only)"""
    await require_admin(current_user_id)
    company = Company(**company_data.model_dump())
    company_dict = company.model_dump()
    company_dict['created_at'] = company_dict['created_at'].isoformat()
    company_dict['updated_at'] = company_dict['updated_at'].isoformat()
    
    await db.companies.insert_one(company_dict)
    return company


@router.get("/companies", response_model=List[Company])
async def list_companies(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """List all companies (Admin only)"""
    await require_admin(current_user_id)
    
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    
    # Convert datetime strings back to datetime objects for pydantic
    for company in companies:
        if company.get('created_at') and isinstance(company.get('created_at'), str):
            company['created_at'] = datetime.fromisoformat(company['created_at'])
        if company.get('updated_at') and isinstance(company.get('updated_at'), str):
            company['updated_at'] = datetime.fromisoformat(company['updated_at'])
    
    return [Company(**company) for company in companies]


@router.get("/companies/{company_id}", response_model=Company)
async def get_company(
    company_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get a specific company"""
    # Get current user to check their company_id
    user_data = await get_current_user_data(current_user_id)
    
    # Admin can view any company, others can only view their own
    if user_data['role'] != 'admin' and user_data.get('company_id') != company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this company")
    
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Convert datetime strings
    if company.get('created_at') and isinstance(company.get('created_at'), str):
        company['created_at'] = datetime.fromisoformat(company['created_at'])
    if company.get('updated_at') and isinstance(company.get('updated_at'), str):
        company['updated_at'] = datetime.fromisoformat(company['updated_at'])
    
    return Company(**company)


@router.get("/companies/current/settings", response_model=Company)
async def get_current_company_settings(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get current user's company settings"""
    user_data = await get_current_user_data(current_user_id)
    company_id = user_data.get('company_id')
    
    if not company_id:
        raise HTTPException(status_code=404, detail="User not associated with any company")
    
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Convert datetime strings
    if company.get('created_at') and isinstance(company.get('created_at'), str):
        company['created_at'] = datetime.fromisoformat(company['created_at'])
    if company.get('updated_at') and isinstance(company.get('updated_at'), str):
        company['updated_at'] = datetime.fromisoformat(company['updated_at'])
    
    return Company(**company)


@router.get("/companies/default/branding")
async def get_default_company_branding(db = Depends(get_db)):
    """Get default company branding for login page (PUBLIC - no auth required)"""
    # Find the default company
    default_company = await db.companies.find_one({"is_default": True}, {"_id": 0})
    
    # If no default, get the first company
    if not default_company:
        default_company = await db.companies.find_one({}, {"_id": 0})
    
    if not default_company:
        # Return minimal fallback
        return {
            "name": "Sales & Service CRM",
            "logo_url": None,
            "country": None,
            "currency": "USD"
        }
    
    # Return only public branding info
    return {
        "name": default_company.get("name"),
        "logo_url": default_company.get("logo_url"),
        "country": default_company.get("country"),
        "currency": default_company.get("currency"),
        "tax_percentage": default_company.get("tax_percentage", 0)
    }


@router.put("/companies/{company_id}", response_model=Company)
async def update_company(
    company_id: str,
    company_update: CompanyUpdate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update a company (Admin only)"""
    await require_admin(current_user_id)
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = company_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # If setting this company as default, unset all other companies' default flag
    if update_data.get('is_default'):
        await db.companies.update_many(
            {"id": {"$ne": company_id}},
            {"$set": {"is_default": False}}
        )
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.companies.update_one(
        {"id": company_id},
        {"$set": update_data}
    )
    
    updated_company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    
    # Convert datetime strings
    if updated_company.get('created_at') and isinstance(updated_company.get('created_at'), str):
        updated_company['created_at'] = datetime.fromisoformat(updated_company['created_at'])
    if updated_company.get('updated_at') and isinstance(updated_company.get('updated_at'), str):
        updated_company['updated_at'] = datetime.fromisoformat(updated_company['updated_at'])
    
    return Company(**updated_company)


@router.post("/companies/{company_id}/set-default")
async def set_default_company(
    company_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Set a company as default (Admin only)"""
    await require_admin(current_user_id)
    
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Unset all other companies' default flag
    await db.companies.update_many(
        {"id": {"$ne": company_id}},
        {"$set": {"is_default": False}}
    )
    
    # Set this company as default
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {"is_default": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Default company set successfully", "company_id": company_id}


@router.delete("/companies/{company_id}")
async def delete_company(
    company_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete a company (Admin only)"""
    await require_admin(current_user_id)
    # Check if company has users
    user_count = await db.users.count_documents({"company_id": company_id})
    if user_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete company with {user_count} associated users. Remove users first."
        )
    
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {"message": "Company deleted successfully"}
