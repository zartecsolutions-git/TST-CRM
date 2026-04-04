"""
Seed script to create a super admin user
Run with: python seed_super_admin.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import bcrypt
from datetime import datetime, timezone
import uuid

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME', 'crm_db')

async def create_super_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Check if super admin already exists
    existing = await db.users.find_one({"role": "super_admin"})
    if existing:
        print(f"✅ Super Admin already exists: {existing['email']}")
        return
    
    # Create super admin
    hashed_password = bcrypt.hashpw("superadmin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    super_admin = {
        "id": str(uuid.uuid4()),
        "name": "Super Administrator",
        "email": "superadmin@test.com",
        "password_hash": hashed_password,
        "phone": "+1-000-000-0000",
        "role": "super_admin",
        "avatar_url": None,
        "status": "active",
        "team_id": None,
        "company_id": None,  # Super admin doesn't belong to any specific company
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(super_admin)
    print("✅ Super Admin created successfully!")
    print(f"   Email: superadmin@test.com")
    print(f"   Password: superadmin123")
    print(f"   Role: super_admin")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_super_admin())
