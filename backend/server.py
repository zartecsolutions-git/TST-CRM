from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from typing import List

# Import route modules
from routes import (
    auth_routes,
    activity_routes,
    customer_routes,
    location_routes,
    product_routes,
    lead_routes,
    company_routes,
    user_routes,
    team_routes,
    geofence_routes,
    dashboard_routes,
    sales_routes,
    master_data_routes,
    payment_routes
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket("/ws/locations")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ============================================================================
# INCLUDE ALL ROUTE MODULES
# ============================================================================

app.include_router(auth_routes.router, prefix="/api")
app.include_router(activity_routes.router, prefix="/api")
app.include_router(customer_routes.router, prefix="/api")
app.include_router(location_routes.router, prefix="/api")
app.include_router(product_routes.router, prefix="/api")
app.include_router(lead_routes.router, prefix="/api")
app.include_router(company_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(team_routes.router, prefix="/api")
app.include_router(geofence_routes.router, prefix="/api")
app.include_router(dashboard_routes.router, prefix="/api")
app.include_router(sales_routes.router, prefix="/api")
app.include_router(master_data_routes.router, prefix="/api")
app.include_router(payment_routes.router, prefix="/api")

# ============================================================================
# MIDDLEWARE
# ============================================================================

# Add cache control middleware to prevent browser caching
@app.middleware("http")
async def add_cache_control_headers(request, call_next):
    response = await call_next(request)
    # Prevent caching of API responses and HTML pages
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# LOGGING
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# LIFECYCLE EVENTS
# ============================================================================

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
