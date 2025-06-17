from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import uuid
from typing import Callable
from ..database import db_manager


class SessionMiddleware(BaseHTTPMiddleware):
    """Middleware to handle session-based database management"""
    
    def __init__(self, app, require_database: bool = True):
        super().__init__(app)
        self.require_database = require_database
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip validation for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            response = await call_next(request)
            return response

        # Get or generate session ID
        session_id = request.headers.get('x-session-id')
        if not session_id:
            session_id = str(uuid.uuid4())

        # Add session ID to request state
        request.state.session_id = session_id

        # Check if this is a database-related endpoint
        path = request.url.path
        is_database_endpoint = (
            path.startswith('/settings/') or
            path.startswith('/customer/api/') or
            path.startswith('/chef/') or
            path.startswith('/admin/') or
            path.startswith('/analytics/') or
            path.startswith('/tables/') or
            path.startswith('/feedback/') or
            path.startswith('/loyalty/') or
            path.startswith('/selection-offers/')
        )

        # Skip session validation for certain endpoints
        skip_validation_endpoints = [
            '/settings/databases',
            '/settings/switch-database',
            '/settings/current-database'
        ]

        # Skip validation for admin and chef routes - they handle their own database selection
        skip_validation_paths = [
            '/admin/',
            '/chef/'
        ]

        # Check if path should skip validation
        should_skip_path = any(path.startswith(skip_path) for skip_path in skip_validation_paths)

        should_validate = (
            is_database_endpoint and
            path not in skip_validation_endpoints and
            not should_skip_path and
            self.require_database
        )
        
        if should_validate:
            # Check if session has a valid database connection
            current_db = db_manager.get_current_database(session_id)
            if not current_db or current_db == db_manager.default_database:
                # Check if there's a stored database in headers
                stored_database = request.headers.get('x-database-name')
                stored_password = request.headers.get('x-database-password')
                
                if stored_database and stored_password:
                    # Try to verify and switch to stored database
                    try:
                        # Import here to avoid circular imports
                        import csv
                        import os
                        
                        # Verify database credentials
                        if os.path.exists("hotels.csv"):
                            with open("hotels.csv", "r") as file:
                                reader = csv.DictReader(file)
                                for row in reader:
                                    if (row["hotel_database"] == stored_database and 
                                        row["password"] == stored_password):
                                        # Valid credentials, switch database
                                        db_manager.switch_database(session_id, stored_database)
                                        break
                                else:
                                    # Invalid credentials
                                    return JSONResponse(
                                        status_code=401,
                                        content={
                                            "detail": "Invalid database credentials",
                                            "error_code": "DATABASE_AUTH_FAILED"
                                        }
                                    )
                        else:
                            return JSONResponse(
                                status_code=500,
                                content={
                                    "detail": "Database configuration not found",
                                    "error_code": "DATABASE_CONFIG_MISSING"
                                }
                            )
                    except Exception as e:
                        return JSONResponse(
                            status_code=500,
                            content={
                                "detail": f"Database verification failed: {str(e)}",
                                "error_code": "DATABASE_VERIFICATION_ERROR"
                            }
                        )
                else:
                    # No database selected
                    return JSONResponse(
                        status_code=400,
                        content={
                            "detail": "No database selected. Please select a database first.",
                            "error_code": "DATABASE_NOT_SELECTED"
                        }
                    )
        
        # Process the request
        response = await call_next(request)
        
        # Add session ID to response headers
        response.headers["x-session-id"] = session_id
        
        return response


def get_session_id(request: Request) -> str:
    """Helper function to get session ID from request"""
    return getattr(request.state, 'session_id', str(uuid.uuid4()))
