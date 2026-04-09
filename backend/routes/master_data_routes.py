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
    parent_division: Optional[str] = ""  # For categories - link to division
    description: Optional[str] = ""
    active: bool = True

class SubCategoryItem(BaseModel):
    name: str
    parent_category: str
    description: Optional[str] = ""
    active: bool = True

class MasterDataUpdate(BaseModel):
    name: Optional[str] = None
    parent_division: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class SubCategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_category: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None


# Categories CRUD
@router.get("/master-data/categories")
async def get_categories():
    try:
        categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
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
        created_item = await db.categories.find_one({"name": item.name}, {"_id": 0})
        return {"message": "Category created successfully", "category": created_item}
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
        brands = await db.brands.find({}, {"_id": 0}).to_list(1000)
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
        created_item = await db.brands.find_one({"name": item.name}, {"_id": 0})
        return {"message": "Brand created successfully", "brand": created_item}
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
        divisions = await db.divisions.find({}, {"_id": 0}).to_list(1000)
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
        created_item = await db.divisions.find_one({"name": item.name}, {"_id": 0})
        return {"message": "Division created successfully", "division": created_item}
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


# Sub-Categories CRUD
@router.get("/master-data/subcategories")
async def get_subcategories():
    try:
        subcategories = await db.subcategories.find({}, {"_id": 0}).to_list(1000)
        return subcategories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/master-data/subcategories")
async def create_subcategory(item: SubCategoryItem):
    try:
        # Check if already exists
        existing = await db.subcategories.find_one({"name": item.name}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Sub-Category already exists")
        
        # Verify parent category exists
        parent = await db.categories.find_one({"name": item.parent_category}, {"_id": 0})
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")
        
        item_dict = item.dict()
        item_dict["created_at"] = datetime.utcnow().isoformat()
        
        await db.subcategories.insert_one(item_dict)
        created_item = await db.subcategories.find_one({"name": item.name}, {"_id": 0})
        return {"message": "Sub-Category created successfully", "subcategory": created_item}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/master-data/subcategories/{name}")
async def update_subcategory(name: str, update: SubCategoryUpdate):
    try:
        existing = await db.subcategories.find_one({"name": name}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Sub-Category not found")
        
        # If parent_category is being updated, verify it exists
        if update.parent_category:
            parent = await db.categories.find_one({"name": update.parent_category}, {"_id": 0})
            if not parent:
                raise HTTPException(status_code=404, detail="Parent category not found")
        
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        await db.subcategories.update_one({"name": name}, {"$set": update_data})
        updated = await db.subcategories.find_one({"name": update.name or name}, {"_id": 0})
        
        return {"message": "Sub-Category updated successfully", "subcategory": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/master-data/subcategories/{name}")
async def delete_subcategory(name: str):
    try:
        result = await db.subcategories.delete_one({"name": name})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Sub-Category not found")
        return {"message": "Sub-Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Division not found")
        return {"message": "Division deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Models CRUD
@router.get("/master-data/models")
async def get_models():
    try:
        models = await db.models.find({}, {"_id": 0}).to_list(1000)
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/master-data/models")
async def create_model(item: MasterDataItem):
    try:
        existing = await db.models.find_one({"name": item.name}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Model already exists")
        
        item_dict = item.dict()
        item_dict["created_at"] = datetime.utcnow().isoformat()
        
        await db.models.insert_one(item_dict)
        created_item = await db.models.find_one({"name": item.name}, {"_id": 0})
        return {"message": "Model created successfully", "model": created_item}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/master-data/models/{name}")
async def update_model(name: str, update: MasterDataUpdate):
    try:
        existing = await db.models.find_one({"name": name}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Model not found")
        
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        await db.models.update_one({"name": name}, {"$set": update_data})
        updated = await db.models.find_one({"name": update.name or name}, {"_id": 0})
        
        return {"message": "Model updated successfully", "model": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/master-data/models/{name}")
async def delete_model(name: str):
    try:
        result = await db.models.delete_one({"name": name})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Model not found")
        return {"message": "Model deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

