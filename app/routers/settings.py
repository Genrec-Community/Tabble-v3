from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import shutil
import csv
from datetime import datetime, timezone

from ..database import (
    get_db, Settings, switch_database, get_current_database,
    get_session_db, switch_session_database, get_session_current_database
)
from ..models.settings import Settings as SettingsModel, SettingsUpdate
from ..models.database_config import DatabaseEntry, DatabaseList, DatabaseSelectRequest, DatabaseSelectResponse
from ..middleware import get_session_id

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)


# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))


# Get available databases from hotels.csv
@router.get("/databases", response_model=DatabaseList)
def get_databases():
    try:
        databases = []
        with open("hotels.csv", "r") as file:
            reader = csv.DictReader(file)
            for row in reader:
                databases.append(DatabaseEntry(
                    database_name=row["hotel_database"],
                    password=row["password"]
                ))

        # Return only database names, not passwords
        return {"databases": [{"database_name": db.database_name, "password": "********"} for db in databases]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading database configuration: {str(e)}")


# Get current database name
@router.get("/current-database")
def get_current_db(request: Request):
    session_id = get_session_id(request)
    return {"database_name": get_session_current_database(session_id)}


# Switch database
@router.post("/switch-database", response_model=DatabaseSelectResponse)
def select_database(request_data: DatabaseSelectRequest, request: Request):
    try:
        session_id = get_session_id(request)

        # Verify database exists and password is correct
        with open("hotels.csv", "r") as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row["hotel_database"] == request_data.database_name:
                    if row["password"] == request_data.password:
                        # Switch database for this session
                        success = switch_session_database(session_id, request_data.database_name)
                        if success:
                            return {
                                "success": True,
                                "message": f"Successfully switched to database: {request_data.database_name}"
                            }
                        else:
                            raise HTTPException(status_code=500, detail="Failed to switch database")
                    else:
                        raise HTTPException(status_code=401, detail="Invalid password")

        raise HTTPException(status_code=404, detail=f"Database '{request_data.database_name}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error switching database: {str(e)}")


# Get hotel settings
@router.get("/", response_model=SettingsModel)
def get_settings(request: Request, db: Session = Depends(get_session_database)):
    # Get the first settings record or create one if it doesn't exist
    settings = db.query(Settings).first()

    if not settings:
        # Create default settings
        settings = Settings(
            hotel_name="Tabble Hotel",
            address="123 Main Street, City",
            contact_number="+1 123-456-7890",
            email="info@tabblehotel.com",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


# Update hotel settings
@router.put("/", response_model=SettingsModel)
async def update_settings(
    request: Request,
    hotel_name: str = Form(...),
    address: Optional[str] = Form(None),
    contact_number: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    tax_id: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session_database)
):
    # Get existing settings or create new
    settings = db.query(Settings).first()

    if not settings:
        settings = Settings(
            hotel_name=hotel_name,
            address=address,
            contact_number=contact_number,
            email=email,
            tax_id=tax_id,
        )
        db.add(settings)
    else:
        # Update fields
        settings.hotel_name = hotel_name
        settings.address = address
        settings.contact_number = contact_number
        settings.email = email
        settings.tax_id = tax_id

    # Handle logo upload if provided
    if logo:
        # Get current database name for organizing logos
        session_id = get_session_id(request)
        current_db = get_session_current_database(session_id)

        # Create directory structure: app/static/images/logo/{db_name}
        db_logo_dir = f"app/static/images/logo/{current_db}"
        os.makedirs(db_logo_dir, exist_ok=True)

        # Save logo with database-specific path
        logo_path = f"{db_logo_dir}/hotel_logo_{logo.filename}"
        with open(logo_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)

        # Update settings with logo path (URL path for serving)
        settings.logo_path = f"/static/images/logo/{current_db}/hotel_logo_{logo.filename}"

    # Update timestamp
    settings.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(settings)

    return settings
