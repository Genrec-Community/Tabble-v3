#!/usr/bin/env python3
"""
Clear the database and initialize fresh structure with only hotels
"""

import os
import sqlite3
import csv
from datetime import datetime, timezone

def clear_database():
    """Clear all data from existing database"""
    if os.path.exists('Tabble.db'):
        conn = sqlite3.connect('Tabble.db')
        cursor = conn.cursor()

        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()

        # Clear all tables
        for table in tables:
            table_name = table[0]
            if table_name != 'sqlite_sequence':
                cursor.execute(f"DELETE FROM {table_name}")
                print(f"✓ Cleared table: {table_name}")

        conn.commit()
        conn.close()
        print("✓ Cleared all data from existing Tabble.db")
    else:
        print("✓ No existing database found")

def create_fresh_database():
    """Create fresh database with only hotels table"""
    conn = sqlite3.connect('Tabble.db')
    cursor = conn.cursor()
    
    # Create hotels table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hotels (
            id INTEGER PRIMARY KEY,
            hotel_name VARCHAR NOT NULL UNIQUE,
            password VARCHAR NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create all other tables with hotel_id but empty
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dishes (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            name VARCHAR,
            description TEXT,
            category VARCHAR,
            price FLOAT,
            quantity INTEGER DEFAULT 0,
            image_path VARCHAR,
            discount FLOAT DEFAULT 0,
            is_offer INTEGER DEFAULT 0,
            is_special INTEGER DEFAULT 0,
            visibility INTEGER DEFAULT 1,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS persons (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            username VARCHAR,
            password VARCHAR,
            phone_number VARCHAR,
            visit_count INTEGER DEFAULT 0,
            last_visit DATETIME,
            created_at DATETIME,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            person_id INTEGER,
            table_number INTEGER,
            total_amount FLOAT,
            status VARCHAR,
            unique_id VARCHAR,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id),
            FOREIGN KEY (person_id) REFERENCES persons (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            order_id INTEGER,
            dish_id INTEGER,
            quantity INTEGER,
            price FLOAT,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id),
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (dish_id) REFERENCES dishes (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tables (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            table_number INTEGER,
            is_occupied BOOLEAN DEFAULT FALSE,
            current_order_id INTEGER,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id),
            FOREIGN KEY (current_order_id) REFERENCES orders (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            hotel_name VARCHAR NOT NULL,
            address VARCHAR,
            contact_number VARCHAR,
            email VARCHAR,
            tax_id VARCHAR,
            logo_path VARCHAR,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            order_id INTEGER,
            person_id INTEGER,
            rating INTEGER,
            comment TEXT,
            created_at DATETIME,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id),
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (person_id) REFERENCES persons (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS loyalty_tiers (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            visit_count INTEGER,
            discount_percentage FLOAT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS selection_offers (
            id INTEGER PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            min_amount FLOAT,
            discount_amount FLOAT,
            is_active BOOLEAN DEFAULT TRUE,
            description VARCHAR,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id)
        )
    ''')
    
    # Create unique indexes
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_hotel_username 
        ON persons (hotel_id, username)
    ''')
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_hotel_phone 
        ON persons (hotel_id, phone_number) WHERE phone_number IS NOT NULL
    ''')
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_hotel_number 
        ON tables (hotel_id, table_number)
    ''')
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_hotel 
        ON settings (hotel_id)
    ''')
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_hotel_visits 
        ON loyalty_tiers (hotel_id, visit_count)
    ''')
    
    conn.commit()
    print("✓ Created fresh database schema")
    return conn

def populate_hotels_only():
    """Populate only the hotels table from CSV"""
    conn = sqlite3.connect('Tabble.db')
    cursor = conn.cursor()
    
    # Read hotels from CSV
    hotels = []
    with open('hotels.csv', 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            hotels.append({
                'id': int(row['hotel_id']),
                'name': row['hotel_name'],
                'password': row['password']
            })
    
    # Insert hotels
    for hotel in hotels:
        cursor.execute('''
            INSERT OR REPLACE INTO hotels (id, hotel_name, password, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            hotel['id'],
            hotel['name'],
            hotel['password'],
            datetime.now(timezone.utc).isoformat(),
            datetime.now(timezone.utc).isoformat()
        ))
    
    conn.commit()
    conn.close()
    print(f"✓ Populated hotels table with {len(hotels)} hotels")

def main():
    """Main function"""
    print("🔄 Clearing database and creating fresh structure...")
    
    # Clear existing database
    clear_database()
    
    # Create fresh database
    create_fresh_database()
    
    # Populate only hotels
    populate_hotels_only()
    
    print("✅ Database cleared and fresh structure created!")
    print("✓ Only hotels table is populated")
    print("✓ All other tables are empty and ready for new data")

if __name__ == "__main__":
    main()
