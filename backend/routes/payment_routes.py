from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime, timezone
import os
from models import Payment, PaymentCreate, PaymentUpdate
from auth import get_current_user
from utils.dependencies import db

router = APIRouter()

@router.post("/payments", response_model=Payment)
async def create_payment(
    payment: PaymentCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new payment record"""
    try:
        payment_dict = payment.model_dump()
        payment_dict["created_by"] = current_user_id
        payment_dict["created_at"] = datetime.now(timezone.utc)
        payment_dict["updated_at"] = datetime.now(timezone.utc)
        
        # Generate unique ID
        from uuid import uuid4
        payment_dict["id"] = str(uuid4())
        
        await db.payments.insert_one(payment_dict)
        
        # Update invoice payment status based on balance
        invoice = await db.sales_invoices.find_one({"invoice_number": payment.invoice_number})
        if invoice:
            if payment.balance_amount <= 0:
                new_status = "Paid"
            elif payment.received_amount > 0:
                new_status = "Partially Paid"
            else:
                new_status = invoice.get("payment_status", "Pending")
            
            await db.sales_invoices.update_one(
                {"invoice_number": payment.invoice_number},
                {"$set": {"payment_status": new_status, "updated_at": datetime.now(timezone.utc)}}
            )
        
        return payment_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payments", response_model=List[Payment])
async def get_payments(
    current_user_id: str = Depends(get_current_user)
):
    """Get all payments"""
    try:
        payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
        return payments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payments/{payment_id}", response_model=Payment)
async def get_payment(
    payment_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get a specific payment"""
    try:
        payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/payments/{payment_id}", response_model=Payment)
async def update_payment(
    payment_id: str,
    payment_update: PaymentUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update a payment"""
    try:
        update_data = {k: v for k, v in payment_update.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.payments.update_one(
            {"id": payment_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        updated_payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
        
        # Update invoice status if balance changed
        if "balance_amount" in update_data:
            invoice_number = updated_payment.get("invoice_number")
            if updated_payment["balance_amount"] <= 0:
                new_status = "Paid"
            elif updated_payment["received_amount"] > 0:
                new_status = "Partially Paid"
            else:
                new_status = "Pending"
            
            await db.sales_invoices.update_one(
                {"invoice_number": invoice_number},
                {"$set": {"payment_status": new_status, "updated_at": datetime.now(timezone.utc)}}
            )
        
        return updated_payment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/payments/{payment_id}")
async def delete_payment(
    payment_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a payment"""
    try:
        result = await db.payments.delete_one({"id": payment_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found")
        return {"message": "Payment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
