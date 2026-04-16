from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
import csv
import io
import re

from models import ProductCreate, Product, ProductUpdate
from auth import get_current_user
from rbac import require_admin
from utils.dependencies import get_db
from utils.datetime_helpers import (
    convert_datetime_fields,
    convert_serial_numbers_dates,
    parse_datetime_fields,
    get_current_utc_iso
)
from utils.validation_helpers import validate_serial_number_uniqueness, validate_update_data
from utils.csv_helpers import export_products_to_csv

router = APIRouter()


def calculate_warranty_finished_date(purchase_date: datetime, warranty_period: str) -> Optional[datetime]:
    """Calculate warranty end date from purchase date and warranty period string"""
    if not purchase_date or not warranty_period:
        return None
    
    # Parse warranty period (e.g., "12 months", "24 months", "1 year", "2 years")
    warranty_period = warranty_period.lower().strip()
    
    # Extract number and unit
    match = re.match(r'(\d+)\s*(month|months|year|years)', warranty_period)
    if not match:
        return None
    
    value = int(match.group(1))
    unit = match.group(2)
    
    if 'month' in unit:
        return purchase_date + relativedelta(months=value)
    elif 'year' in unit:
        return purchase_date + relativedelta(years=value)
    
    return None


@router.post("/products", response_model=Product)
async def create_product(
    product_data: ProductCreate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only Admin can create products
    await require_admin(current_user_id)
    
    # Check if any serial numbers already exist
    if product_data.serial_numbers:
        for serial_obj in product_data.serial_numbers:
            existing = await db.products.find_one({
                "serial_numbers.serial_number": serial_obj.serial_number
            })
            if existing:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Serial number {serial_obj.serial_number} already exists"
                )
    
    # Create product instance
    product = Product(**product_data.model_dump(), created_by=current_user_id)
    
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    product_dict['updated_at'] = product_dict['updated_at'].isoformat()
    if product_dict.get('purchase_date'):
        product_dict['purchase_date'] = product_dict['purchase_date'].isoformat()
    if product_dict.get('installation_date'):
        product_dict['installation_date'] = product_dict['installation_date'].isoformat()
    
    # Convert serial_numbers datetime fields to ISO format
    if product_dict.get('serial_numbers'):
        for serial in product_dict['serial_numbers']:
            if serial.get('sale_date'):
                serial['sale_date'] = serial['sale_date'].isoformat()
            if serial.get('customer_warranty_end_date'):
                serial['customer_warranty_end_date'] = serial['customer_warranty_end_date'].isoformat()
            if serial.get('next_maintenance_date'):
                serial['next_maintenance_date'] = serial['next_maintenance_date'].isoformat()
    
    await db.products.insert_one(product_dict)
    return product


@router.get("/products", response_model=List[Product])
async def get_products(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product.get('updated_at'), str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
        if product.get('purchase_date') and isinstance(product['purchase_date'], str):
            product['purchase_date'] = datetime.fromisoformat(product['purchase_date'])
        if product.get('installation_date') and isinstance(product['installation_date'], str):
            product['installation_date'] = datetime.fromisoformat(product['installation_date'])
        if product.get('next_maintenance_date') and isinstance(product['next_maintenance_date'], str):
            product['next_maintenance_date'] = datetime.fromisoformat(product['next_maintenance_date'])
        if product.get('warranty_finished_date') and isinstance(product['warranty_finished_date'], str):
            product['warranty_finished_date'] = datetime.fromisoformat(product['warranty_finished_date'])
    
    return products


@router.get("/products/{product_id}", response_model=Product)
async def get_product(
    product_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    product_doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product_doc:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product_doc.get('created_at'), str):
        product_doc['created_at'] = datetime.fromisoformat(product_doc['created_at'])
    if isinstance(product_doc.get('updated_at'), str):
        product_doc['updated_at'] = datetime.fromisoformat(product_doc['updated_at'])
    if product_doc.get('purchase_date') and isinstance(product_doc['purchase_date'], str):
        product_doc['purchase_date'] = datetime.fromisoformat(product_doc['purchase_date'])
    if product_doc.get('installation_date') and isinstance(product_doc['installation_date'], str):
        product_doc['installation_date'] = datetime.fromisoformat(product_doc['installation_date'])
    
    return Product(**product_doc)


@router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only Admin can update products
    await require_admin(current_user_id)
    
    update_data = product_update.model_dump(exclude_unset=True)
    validate_update_data(update_data)
    
    # Validate serial number uniqueness
    if 'serial_numbers' in update_data and update_data['serial_numbers']:
        await validate_serial_number_uniqueness(db, update_data['serial_numbers'], product_id)
    
    # Convert datetime fields to ISO format
    update_data['updated_at'] = get_current_utc_iso()
    convert_datetime_fields(update_data, ['purchase_date', 'installation_date'])
    
    # Convert serial numbers datetime fields
    if update_data.get('serial_numbers'):
        convert_serial_numbers_dates(update_data['serial_numbers'])
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    # Parse datetime fields back to datetime objects
    parse_datetime_fields(product_doc, ['created_at', 'updated_at'])
    if product_doc.get('purchase_date') and isinstance(product_doc['purchase_date'], str):
        product_doc['purchase_date'] = datetime.fromisoformat(product_doc['purchase_date'])
    if product_doc.get('installation_date') and isinstance(product_doc['installation_date'], str):
        product_doc['installation_date'] = datetime.fromisoformat(product_doc['installation_date'])
    
    return Product(**product_doc)


@router.get("/products/alerts/warranty-expiring")
async def get_warranty_expiring_products(
    days: int = 30,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get products with warranty expiring within specified days"""
    now = datetime.now(timezone.utc)
    future_date = now + timedelta(days=days)
    
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    expiring_products = []
    
    for product in products:
        if product.get('warranty_finished_date'):
            warranty_date = product['warranty_finished_date']
            if isinstance(warranty_date, str):
                warranty_date = datetime.fromisoformat(warranty_date)
            
            # Check if warranty expires within the specified days
            if now <= warranty_date <= future_date:
                days_remaining = (warranty_date - now).days
                product['days_remaining'] = days_remaining
                expiring_products.append(product)
    
    return expiring_products


@router.get("/products/alerts/maintenance-due")
async def get_maintenance_due_products(
    days: int = 30,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get products with maintenance due within specified days"""
    now = datetime.now(timezone.utc)
    future_date = now + timedelta(days=days)
    
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    maintenance_due = []
    
    for product in products:
        if product.get('next_maintenance_date'):
            maintenance_date = product['next_maintenance_date']
            if isinstance(maintenance_date, str):
                maintenance_date = datetime.fromisoformat(maintenance_date)
            
            # Check if maintenance is due within the specified days
            if maintenance_date <= future_date:
                days_until = (maintenance_date - now).days
                product['days_until_maintenance'] = days_until
                maintenance_due.append(product)
    
    return maintenance_due


@router.get("/products/export/csv")
async def export_products_csv(
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Export all products to CSV with serial numbers and warranty status"""
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    customers = await db.customers.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    customer_map = {c['id']: c['name'] for c in customers}
    
    # Use helper function to generate CSV content
    csv_content = export_products_to_csv(products, customer_map)
    
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_export.csv"}
    )


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    # Only Admin can delete products
    await require_admin(current_user_id)
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


@router.post("/products/import/csv")
async def import_products_csv(
    file_content: str,
    current_user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Bulk import products from CSV with auto warranty calculation"""
    await require_admin(current_user_id)
    
    try:
        # Parse CSV
        csv_file = io.StringIO(file_content)
        reader = csv.DictReader(csv_file)
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Check if serial number exists
                existing = await db.products.find_one({"serial_number": row['serial_number']})
                if existing:
                    errors.append(f"Row {row_num}: Serial number {row['serial_number']} already exists")
                    continue
                
                # Create product
                product_data = {
                    "name": row['name'],
                    "serial_number": row['serial_number'],
                    "model": row.get('model', ''),
                    "category": row.get('category', ''),
                    "license_code": row.get('license_code', ''),
                    "price": float(row['price']) if row.get('price') else None,
                    "warranty_period": row.get('warranty_period', ''),
                    "description": row.get('description', ''),
                    "specifications": row.get('specifications', '')
                }
                
                # Parse dates if provided
                if row.get('purchase_date'):
                    product_data['purchase_date'] = datetime.fromisoformat(row['purchase_date'].replace('Z', '+00:00'))
                if row.get('next_maintenance_date'):
                    product_data['next_maintenance_date'] = datetime.fromisoformat(row['next_maintenance_date'].replace('Z', '+00:00'))
                
                product = Product(**product_data, created_by=current_user_id)
                
                # Calculate warranty_finished_date
                if product.purchase_date and product.warranty_period:
                    product.warranty_finished_date = calculate_warranty_finished_date(
                        product.purchase_date,
                        product.warranty_period
                    )
                
                # Save to database
                product_dict = product.model_dump()
                product_dict['created_at'] = product_dict['created_at'].isoformat()
                product_dict['updated_at'] = product_dict['updated_at'].isoformat()
                if product_dict.get('purchase_date'):
                    product_dict['purchase_date'] = product_dict['purchase_date'].isoformat()
                if product_dict.get('next_maintenance_date'):
                    product_dict['next_maintenance_date'] = product_dict['next_maintenance_date'].isoformat()
                if product_dict.get('warranty_finished_date'):
                    product_dict['warranty_finished_date'] = product_dict['warranty_finished_date'].isoformat()
                
                await db.products.insert_one(product_dict)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "imported": imported_count,
            "errors": errors,
            "total_rows": row_num - 1 if 'row_num' in locals() else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
