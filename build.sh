#!/bin/bash

# Create static directory if it doesn't exist
mkdir -p app/static/images

# Initialize database if it doesn't exist
if [ ! -f "tabble_new.db" ]; then
    echo "Initializing database..."
    python init_db.py
else
    echo "Database already exists, skipping initialization"
fi

echo "Build completed successfully"