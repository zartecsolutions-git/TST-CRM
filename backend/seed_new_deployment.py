"""
Seed script for a fresh white-label deployment.

Run this ONCE after the first deploy to bootstrap:
  - Default company profile (name, currency, tax, branding)
  - Admin user
  - Master data (divisions, categories, brands, models, etc.) copied from Zartec

Usage:
    cd /app/backend
    python seed_new_deployment.py

Idempotent — re-running will NOT duplicate docs. Any existing company/user with
the same email/name is left untouched.
"""
import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# ---------------------------------------------------------------------------
# EDIT THESE VALUES PER DEPLOYMENT
# ---------------------------------------------------------------------------
COMPANY_NAME = os.environ.get("SEED_COMPANY_NAME", "Third Step Trading Est.")
COMPANY_COUNTRY = os.environ.get("SEED_COMPANY_COUNTRY", "Saudi Arabia")
COMPANY_CURRENCY = os.environ.get("SEED_COMPANY_CURRENCY", "SAR")
COMPANY_TAX_PCT = float(os.environ.get("SEED_COMPANY_TAX_PCT", "15.0"))
COMPANY_ADDRESS = os.environ.get("SEED_COMPANY_ADDRESS", "Saudi Arabia")
COMPANY_PHONE = os.environ.get("SEED_COMPANY_PHONE", "")
COMPANY_EMAIL = os.environ.get("SEED_COMPANY_EMAIL", "shaiju@tsgce-sa.com")
COMPANY_TIMEZONE = os.environ.get("SEED_COMPANY_TIMEZONE", "Asia/Riyadh")
COMPANY_TAGLINE = os.environ.get("SEED_COMPANY_TAGLINE", "Your trusted business partner")

ADMIN_NAME = os.environ.get("SEED_ADMIN_NAME", "Shaiju Puthukkat")
ADMIN_EMAIL = os.environ.get("SEED_ADMIN_EMAIL", "shaiju@tsgce-sa.com")
ADMIN_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "shaiju123")

MASTER_DATA_FILE = Path(__file__).parent / "seed_data" / "master_data.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


async def seed_company(db) -> str:
    """Create the default company doc if none exists. Returns company_id."""
    existing = await db.companies.find_one({"name": COMPANY_NAME}, {"_id": 0, "id": 1})
    if existing:
        print(f"[skip] Company '{COMPANY_NAME}' already exists (id={existing.get('id')})")
        return existing["id"]

    now = _now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        "name": COMPANY_NAME,
        "country": COMPANY_COUNTRY,
        "currency": COMPANY_CURRENCY,
        "tax_percentage": COMPANY_TAX_PCT,
        "tax_id": "",
        "address": COMPANY_ADDRESS,
        "phone": COMPANY_PHONE,
        "email": COMPANY_EMAIL,
        "timezone": COMPANY_TIMEZONE,
        "tagline": COMPANY_TAGLINE,
        "logo_url": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.companies.insert_one(doc)
    print(f"[OK]   Created company '{COMPANY_NAME}' (id={doc['id']})")
    return doc["id"]


async def seed_admin(db) -> None:
    """Create the initial admin user if not already present."""
    existing = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0, "id": 1})
    if existing:
        print(f"[skip] Admin user '{ADMIN_EMAIL}' already exists")
        return

    now = _now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        "email": ADMIN_EMAIL,
        "name": ADMIN_NAME,
        "role": "admin",
        "phone": None,
        "password_hash": _hash(ADMIN_PASSWORD),
        "avatar_url": None,
        "status": "active",
        "team_id": None,
        "monthly_sales_target": None,
        "commission_slabs": None,
        "commission_percentage": 5.0,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(doc)
    print(f"[OK]   Created admin '{ADMIN_EMAIL}' (password set)")


async def seed_master_data(db) -> None:
    """Bulk-insert master data (divisions, categories, brands, ...) from JSON.
    Skips documents whose `name` already exists — so this is safe to re-run."""
    if not MASTER_DATA_FILE.exists():
        print(f"[skip] Master-data file not found: {MASTER_DATA_FILE}")
        return

    with open(MASTER_DATA_FILE, "r") as f:
        bundle = json.load(f)

    for collection, docs in bundle.items():
        if not docs:
            continue
        # Dedupe by `name` (master data rows are unique by name within a collection)
        existing_names = set()
        async for d in db[collection].find({}, {"_id": 0, "name": 1}):
            if d.get("name"):
                existing_names.add(d["name"])

        to_insert = []
        for d in docs:
            if not d.get("name") or d["name"] in existing_names:
                continue
            # Generate a stable id if the source doc doesn't have one
            if not d.get("id"):
                d["id"] = str(uuid.uuid4())
            to_insert.append(d)

        if to_insert:
            await db[collection].insert_many(to_insert)
            print(f"[OK]   {collection}: inserted {len(to_insert)} (skipped {len(docs) - len(to_insert)})")
        else:
            print(f"[skip] {collection}: all {len(docs)} already present")


async def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    print(f"Seeding deployment → {db_name}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    await seed_company(db)
    await seed_admin(db)
    await seed_master_data(db)

    print("\nDone. Login with:")
    print(f"  email:    {ADMIN_EMAIL}")
    print(f"  password: {ADMIN_PASSWORD}")
    print(f"  company:  {COMPANY_NAME}")


if __name__ == "__main__":
    asyncio.run(main())
