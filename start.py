#!/usr/bin/env python3
"""
Render deployment startup script for Tabble Backend
"""
import os
import uvicorn

if __name__ == "__main__":
    # Create static/images directory if it doesn't exist
    os.makedirs("app/static/images", exist_ok=True)
    
    # Get port from environment variable (Render provides this)
    port = int(os.environ.get("PORT", 8000))
    
    print(f"Starting Tabble Backend on port {port}")
    
    # Run the application
    # In production, we don't need reload and should bind to 0.0.0.0
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # No reload in production
        access_log=True,
        log_level="info"
    )
