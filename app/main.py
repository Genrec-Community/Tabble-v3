from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import os

from .database import get_db, create_tables
from .routers import chef, customer, admin, feedback, loyalty, selection_offer, table, analytics, settings
from .middleware import SessionMiddleware

# Create FastAPI app
app = FastAPI(title="Tabble - Hotel Management App")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Add session middleware for database management
app.add_middleware(SessionMiddleware, require_database=True)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="templates")

# Include routers
app.include_router(chef.router, prefix="/api")
app.include_router(customer.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(loyalty.router, prefix="/api")
app.include_router(selection_offer.router, prefix="/api")
app.include_router(table.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(settings.router, prefix="/api")

# Create database tables
create_tables()

# Check if we have the React build folder
react_build_dir = "frontend/build"
has_react_build = os.path.isdir(react_build_dir)

if has_react_build:
    # Mount the React build folder
    app.mount("/", StaticFiles(directory=react_build_dir, html=True), name="react")


# Root route - serve React app in production, otherwise serve index.html template
@app.get("/api/", response_class=HTMLResponse)
async def root(request: Request):
    if has_react_build:
        return FileResponse(f"{react_build_dir}/index.html")
    return templates.TemplateResponse("index.html", {"request": request})


# Chef page
@app.get("/api/chef", response_class=HTMLResponse)
async def chef_page(request: Request):
    return templates.TemplateResponse("chef/index.html", {"request": request})


# Chef orders page
@app.get("/api/chef/orders", response_class=HTMLResponse)
async def chef_orders_page(request: Request):
    return templates.TemplateResponse("chef/orders.html", {"request": request})


# Customer login page
@app.get("/api/customer", response_class=HTMLResponse)
async def customer_login_page(request: Request):
    return templates.TemplateResponse("customer/login.html", {"request": request})


# Customer menu page
@app.get("/api/customer/menu", response_class=HTMLResponse)
async def customer_menu_page(request: Request, table_number: int, unique_id: str):
    return templates.TemplateResponse(
        "customer/menu.html",
        {"request": request, "table_number": table_number, "unique_id": unique_id},
    )


# Admin page
@app.get("/api/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse("admin/index.html", {"request": request})


# Admin dishes page
@app.get("/api/admin/dishes", response_class=HTMLResponse)
async def admin_dishes_page(request: Request):
    return templates.TemplateResponse("admin/dishes.html", {"request": request})


# Analysis page
@app.get("/api/analysis", response_class=HTMLResponse)
async def analysis_page(request: Request):
    return templates.TemplateResponse("analysis/index.html", {"request": request})


# Chef analysis page
@app.get("/api/analysis/chef", response_class=HTMLResponse)
async def chef_analysis_page(request: Request):
    return templates.TemplateResponse("analysis/chef.html", {"request": request})


# Customer analysis page
@app.get("/api/analysis/customer", response_class=HTMLResponse)
async def customer_analysis_page(request: Request):
    return templates.TemplateResponse("analysis/customer.html", {"request": request})


# Dish analysis page
@app.get("/api/analysis/dish", response_class=HTMLResponse)
async def dish_analysis_page(request: Request):
    return templates.TemplateResponse("analysis/dish.html", {"request": request})


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
