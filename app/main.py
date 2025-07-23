from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from .database import create_tables
from .routers import chef, customer, admin, feedback, loyalty, selection_offer, table, analytics, settings
from .middleware import SessionMiddleware

# Create FastAPI app
app = FastAPI(title="Tabble - API")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add session middleware for database management
app.add_middleware(SessionMiddleware, require_database=True)

# Mount static files (e.g., for dish images served via API)
# This is important for your app's images to work
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include all API routers with the /api prefix
# This ensures your frontend can reach them correctly
app.include_router(chef.router, prefix="/api")
app.include_router(customer.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(loyalty.router, prefix="/api")
app.include_router(selection_offer.router, prefix="/api")
app.include_router(table.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(settings.router, prefix="/api")

# Create database tables on startup
create_tables()

# This part is only for running the file directly for local development
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
