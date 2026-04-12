from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'crm_db')]

# Pydantic Models
class InvoiceItem(BaseModel):
    product_name: str
    category: Optional[str] = ""
    brand: Optional[str] = ""
    division: Optional[str] = ""
    quantity: float
    unit_price: float
    total: float

class SalesInvoice(BaseModel):
    invoice_number: str
    invoice_date: str
    customer_id: str
    customer_name: str
    sales_rep_id: str
    sales_rep_name: str
    items: List[InvoiceItem]
    subtotal: float
    vat_percentage: float = 10.0
    vat_amount: float
    total_amount: float
    payment_status: str = "Pending"
    notes: Optional[str] = ""

class SalesInvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    sales_rep_id: Optional[str] = None
    sales_rep_name: Optional[str] = None
    items: Optional[List[InvoiceItem]] = None
    subtotal: Optional[float] = None
    vat_percentage: Optional[float] = None
    vat_amount: Optional[float] = None
    total_amount: Optional[float] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


# Create Invoice
@router.post("/sales/invoices")
async def create_invoice(invoice: SalesInvoice):
    try:
        # Check if invoice number already exists
        existing = await db.sales_invoices.find_one({"invoice_number": invoice.invoice_number}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Invoice number already exists")
        
        invoice_dict = invoice.dict()
        invoice_dict["created_at"] = datetime.utcnow().isoformat()
        invoice_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = await db.sales_invoices.insert_one(invoice_dict)
        
        created_invoice = await db.sales_invoices.find_one({"_id": result.inserted_id}, {"_id": 0})
        return {"message": "Invoice created successfully", "invoice": created_invoice}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get All Invoices
@router.get("/sales/invoices")
async def get_invoices(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    customer_id: Optional[str] = None,
    sales_rep_id: Optional[str] = None,
    payment_status: Optional[str] = None
):
    try:
        query = {}
        
        # Date range filter
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["invoice_date"] = date_query
        
        # Other filters
        if customer_id:
            query["customer_id"] = customer_id
        if sales_rep_id:
            query["sales_rep_id"] = sales_rep_id
        if payment_status:
            query["payment_status"] = payment_status
        
        invoices = await db.sales_invoices.find(query, {"_id": 0}).sort("invoice_date", -1).to_list(1000)
        return invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get Single Invoice
@router.get("/sales/invoices/{invoice_number}")
async def get_invoice(invoice_number: str):
    try:
        invoice = await db.sales_invoices.find_one({"invoice_number": invoice_number}, {"_id": 0})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update Invoice
@router.put("/sales/invoices/{invoice_number}")
async def update_invoice(invoice_number: str, invoice_update: SalesInvoiceUpdate):
    try:
        existing = await db.sales_invoices.find_one({"invoice_number": invoice_number}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        update_data = {k: v for k, v in invoice_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        await db.sales_invoices.update_one(
            {"invoice_number": invoice_number},
            {"$set": update_data}
        )
        
        updated_invoice = await db.sales_invoices.find_one({"invoice_number": invoice_number}, {"_id": 0})
        return {"message": "Invoice updated successfully", "invoice": updated_invoice}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete Invoice
@router.delete("/sales/invoices/{invoice_number}")
async def delete_invoice(invoice_number: str):
    try:
        result = await db.sales_invoices.delete_one({"invoice_number": invoice_number})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return {"message": "Invoice deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# REPORTS ENDPOINTS

# Monthly Sales Report
@router.get("/sales/reports/monthly")
async def get_monthly_sales_report(year: Optional[int] = None, sales_rep_id: Optional[str] = None):
    try:
        if not year:
            year = datetime.now().year
        
        # Build match stage for sales_rep filter
        match_stage = {}
        if sales_rep_id:
            match_stage["sales_rep_id"] = sales_rep_id
        
        pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {
                "$addFields": {
                    # Handle both string dates and Excel serial numbers
                    "parsed_date": {
                        "$cond": {
                            "if": {"$regexMatch": {"input": "$invoice_date", "regex": "^[0-9]{5}$"}},
                            # Excel serial date: convert from Excel epoch (1900-01-01)
                            "then": {
                                "$dateAdd": {
                                    "startDate": {"$dateFromString": {"dateString": "1900-01-01"}},
                                    "unit": "day",
                                    "amount": {"$subtract": [{"$toInt": "$invoice_date"}, 2]}
                                }
                            },
                            # Regular date string
                            "else": {"$dateFromString": {"dateString": "$invoice_date"}}
                        }
                    }
                }
            },
            {
                "$addFields": {
                    "year": {"$year": "$parsed_date"},
                    "month": {"$month": "$parsed_date"}
                }
            },
            {"$match": {"year": year}},
            {
                "$group": {
                    "_id": "$month",
                    "sales_value": {"$sum": "$subtotal"},
                    "vat_amount": {"$sum": "$vat_amount"},
                    "net_sales": {"$sum": "$total_amount"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        results = await db.sales_invoices.aggregate(pipeline).to_list(12)
        
        # Format month names
        month_names = ["", "January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"]
        
        formatted_results = []
        for r in results:
            formatted_results.append({
                "month": month_names[r["_id"]],
                "month_number": r["_id"],
                "sales_value": round(r["sales_value"], 2),
                "vat_amount": round(r["vat_amount"], 2),
                "net_sales": round(r["net_sales"], 2)
            })
        
        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Customer Sales Report
@router.get("/sales/reports/customers")
async def get_customer_sales_report(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    sales_rep_id: Optional[str] = None
):
    try:
        match_stage = {}
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            match_stage["invoice_date"] = date_query
        
        if sales_rep_id:
            match_stage["sales_rep_id"] = sales_rep_id
        
        pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {
                "$group": {
                    "_id": "$customer_id",
                    "customer_name": {"$first": "$customer_name"},
                    "total_sales": {"$sum": "$total_amount"},
                    "invoice_count": {"$sum": 1}
                }
            },
            {"$sort": {"total_sales": -1}}
        ]
        
        results = await db.sales_invoices.aggregate(pipeline).to_list(1000)
        
        formatted_results = []
        for r in results:
            formatted_results.append({
                "customer_id": r["_id"],
                "customer_name": r["customer_name"],
                "total_sales": round(r["total_sales"], 2),
                "invoice_count": r["invoice_count"]
            })
        
        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Product/Item Sales Report
@router.get("/sales/reports/products")
async def get_product_sales_report(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    sales_rep_id: Optional[str] = None
):
    try:
        match_stage = {}
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            match_stage["invoice_date"] = date_query
        
        if sales_rep_id:
            match_stage["sales_rep_id"] = sales_rep_id
        
        pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": "$items.product_name",
                    "category": {"$first": "$items.category"},
                    "brand": {"$first": "$items.brand"},
                    "division": {"$first": "$items.division"},
                    "total_qty": {"$sum": "$items.quantity"},
                    "total_sales": {"$sum": "$items.total"}
                }
            },
            {"$sort": {"total_sales": -1}}
        ]
        
        results = await db.sales_invoices.aggregate(pipeline).to_list(1000)
        
        formatted_results = []
        for r in results:
            formatted_results.append({
                "product_name": r["_id"],
                "category": r.get("category", ""),
                "brand": r.get("brand", ""),
                "division": r.get("division", ""),
                "total_qty": r["total_qty"],
                "total_sales": round(r["total_sales"], 2)
            })
        
        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Salesperson Performance Report
@router.get("/sales/reports/salesreps")
async def get_salesrep_performance_report(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    sales_rep_id: Optional[str] = None
):
    try:
        match_stage = {}
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            match_stage["invoice_date"] = date_query
        
        # Filter by sales_rep_id if provided
        if sales_rep_id:
            match_stage["sales_rep_id"] = sales_rep_id
        
        pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {
                "$group": {
                    "_id": "$sales_rep_id",
                    "sales_rep_name": {"$first": "$sales_rep_name"},
                    "total_sales": {"$sum": "$total_amount"},
                    "invoice_count": {"$sum": 1}
                }
            },
            {"$sort": {"total_sales": -1}}
        ]
        
        results = await db.sales_invoices.aggregate(pipeline).to_list(1000)
        
        # Get user data (commission slabs, targets, etc.)
        user_ids = [r["_id"] for r in results]
        users = await db.users.find(
            {"id": {"$in": user_ids}}, 
            {"_id": 0, "id": 1, "name": 1, "commission_slabs": 1, "commission_percentage": 1, "monthly_sales_target": 1}
        ).to_list(1000)
        
        # Create a map of user_id to user data
        user_map = {u["id"]: u for u in users}
        
        formatted_results = []
        for r in results:
            user_data = user_map.get(r["_id"], {})
            total_sales = r["total_sales"]
            
            # Calculate commission using slabs if available
            commission_slabs = user_data.get("commission_slabs")
            fallback_pct = user_data.get("commission_percentage", 5.0)
            
            # Simple slab calculation
            if commission_slabs and len(commission_slabs) > 0:
                commission = 0.0
                for slab in sorted(commission_slabs, key=lambda x: x.get('from_value', 0)):
                    from_val = slab.get('from_value', 0)
                    to_val = slab.get('to_value', float('inf'))
                    comm_pct = slab.get('commission_percentage', 0)
                    if total_sales > from_val:
                        sales_in_slab = min(total_sales, to_val) - from_val
                        if sales_in_slab > 0:
                            commission += sales_in_slab * (comm_pct / 100)
                commission = round(commission, 2)
            else:
                commission = round(total_sales * (fallback_pct / 100), 2)
            
            # Get monthly target
            monthly_target = user_data.get("monthly_sales_target", 0)
            achievement_pct = round((total_sales / monthly_target * 100), 2) if monthly_target and monthly_target > 0 else None
            
            formatted_results.append({
                "sales_rep_id": r["_id"],
                "sales_rep_name": r["sales_rep_name"],
                "total_sales": round(total_sales, 2),
                "invoice_count": r["invoice_count"],
                "monthly_target": monthly_target,
                "achievement_percentage": achievement_pct,
                "commission": commission
            })
        
        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Category/Brand/Division Analysis
@router.get("/sales/reports/analysis")
async def get_sales_analysis(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    sales_rep_id: Optional[str] = None
):
    try:
        match_stage = {}
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            match_stage["invoice_date"] = date_query
        
        if sales_rep_id:
            match_stage["sales_rep_id"] = sales_rep_id
        
        base_pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {"$unwind": "$items"}
        ]
        
        # Sales by Category
        category_pipeline = base_pipeline + [
            {
                "$group": {
                    "_id": "$items.category",
                    "total_sales": {"$sum": "$items.total"}
                }
            },
            {"$sort": {"total_sales": -1}}
        ]
        
        # Sales by Brand
        brand_pipeline = base_pipeline + [
            {
                "$group": {
                    "_id": "$items.brand",
                    "total_sales": {"$sum": "$items.total"}
                }
            },
            {"$sort": {"total_sales": -1}}
        ]
        
        # Sales by Division
        division_pipeline = base_pipeline + [
            {
                "$group": {
                    "_id": "$items.division",
                    "total_sales": {"$sum": "$items.total"}
                }
            },
            {"$sort": {"total_sales": -1}}
        ]
        
        categories = await db.sales_invoices.aggregate(category_pipeline).to_list(100)
        brands = await db.sales_invoices.aggregate(brand_pipeline).to_list(100)
        divisions = await db.sales_invoices.aggregate(division_pipeline).to_list(100)
        
        return {
            "by_category": [{"name": c["_id"] or "Other", "total_sales": round(c["total_sales"], 2)} for c in categories],
            "by_brand": [{"name": b["_id"] or "Other", "total_sales": round(b["total_sales"], 2)} for b in brands],
            "by_division": [{"name": d["_id"] or "Other", "total_sales": round(d["total_sales"], 2)} for d in divisions]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
