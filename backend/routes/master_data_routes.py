from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'crm_db')]

# Pydantic Models
class MasterDataItem(BaseModel):
    name: str
    description: Optional[str] = ""
    active: bool = True

class MasterDataUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None


# Categories CRUD
@router.get("/master-data/categories")
async def get_categories():
    try:
        categories = await db.categories.find({"_id": 0}).to_list(1000)
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/master-data/categories")
async def create_category(item: MasterDataItem):
    try:
        # Check if already exists
        existing = await db.categories.find_one({"name": item.name}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")
        
        item_dict = item.dict()
        item_dict["created_at"] = datetime.utcnow().isoformat()
        
        await db.categories.insert_one(item_dict)
        return {"message": "Category created successfully", "category": item_dict}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/master-data/categories/{name}")
async def update_category(name: str, update: MasterDataUpdate):
    try:
        existing = await db.categories.find_one({"name": name}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")
        
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        await db.categories.update_one({"name": name}, {"$set": update_data})
        updated = await db.categories.find_one({"name": update.name or name}, {"_id": 0})
        
        return {"message": "Category updated successfully", "category": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/master-data/categories/{name}")
async def delete_category(name: str):
    try:
        result = await db.categories.delete_one({"name": name})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Brands CRUD
@router.get("/master-data/brands")
async def get_brands():
    try:
        brands = await db.brands.find({"_id": 0}).to_list(1000)
        return brands
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/master-data/brands")
async def create_brand(item: MasterDataItem):
    try:
        existing = await db.brands.find_one({"name": item.name}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Brand already exists")
        
        item_dict = item.dict()
        item_dict["created_at"] = datetime.utcnow().isoformat()
        
        await db.brands.insert_one(item_dict)
        return {"message": "Brand created successfully", "brand": item_dict}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/master-data/brands/{name}")
async def update_brand(name: str, update: MasterDataUpdate):
    try:
        existing = await db.brands.find_one({"name": name}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        await db.brands.update_one({"name": name}, {"$set": update_data})
        updated = await db.brands.find_one({"name": update.name or name}, {"_id": 0})
        
        return {"message": "Brand updated successfully", "brand": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/master-data/brands/{name}")
async def delete_brand(name: str):
    try:
        result = await db.brands.delete_one({"name": name})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Brand not found")
        return {"message": "Brand deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Divisions CRUD
@router.get("/master-data/divisions")
async def get_divisions():
    try:
        divisions = await db.divisions.find({"_id": 0}).to_list(1000)
        return divisions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/master-data/divisions")
async def create_division(item: MasterDataItem):
    try:
        existing = await db.divisions.find_one({"name": item.name}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Division already exists")
        
        item_dict = item.dict()
        item_dict["created_at"] = datetime.utcnow().isoformat()
        
        await db.divisions.insert_one(item_dict)
        return {"message": "Division created successfully", "division": item_dict}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/master-data/divisions/{name}")
async def update_division(name: str, update: MasterDataUpdate):
    try:
        existing = await db.divisions.find_one({"name": name}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Division not found")
        
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        await db.divisions.update_one({"name": name}, {"$set": update_data})
        updated = await db.divisions.find_one({"name": update.name or name}, {"_id": 0})
        
        return {"message": "Division updated successfully", "division": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/master-data/divisions/{name}")
async def delete_division(name: str):
    try:
        result = await db.divisions.delete_one({"name": name})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Division not found")
        return {"message": "Division deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
