#!/usr/bin/env python3
"""
Migration script to convert from multiple hotel databases to unified Tabble.db
"""

import sqlite3
import csv
import os
import sys
from datetime import datetime, timezone
import shutil

def read_hotels_csv():
    """Read hotels configuration from CSV file"""
    hotels = []
    try:
        with open('hotels.csv', 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                hotels.append({
                    'id': int(row['hotel_id']),
                    'name': row['hotel_name'],
                    'password': row['password'],
                    'database_file': f"{row['hotel_name']}.db"
                })
        return hotels
    except FileNotFoundError:
        print("Error: hotels.csv not found!")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading hotels.csv: {e}")
        sys.exit(1)

def create_unified_schema(conn):
    """Create the unified database schema with hotel_id foreign keys"""
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
    
    # Create dishes table with hotel_id
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
    
    # Create persons table with hotel_id
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
    
    # Create unique indexes for persons
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_hotel_username 
        ON persons (hotel_id, username)
    ''')
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_hotel_phone 
        ON persons (hotel_id, phone_number) WHERE phone_number IS NOT NULL
    ''')
    
    # Create orders table with hotel_id
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
    
    # Create order_items table with hotel_id
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
    
    # Create tables table with hotel_id
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
    
    # Create unique index for tables
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_hotel_number 
        ON tables (hotel_id, table_number)
    ''')
    
    # Create settings table with hotel_id
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
    
    # Create unique index for settings
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_hotel 
        ON settings (hotel_id)
    ''')
    
    # Create feedback table with hotel_id
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
    
    # Create loyalty_tiers table with hotel_id
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
    
    # Create selection_offers table with hotel_id
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
    
    conn.commit()
    print("✓ Created unified database schema")

def populate_hotels_table(conn, hotels):
    """Populate the hotels table from hotels.csv data"""
    cursor = conn.cursor()
    
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
    print(f"✓ Populated hotels table with {len(hotels)} hotels")

def migrate_hotel_data(unified_conn, hotel_db_path, hotel_id):
    """Migrate data from individual hotel database to unified database"""
    if not os.path.exists(hotel_db_path):
        print(f"  - Database {hotel_db_path} not found, skipping...")
        return False

    print(f"  - Migrating data from {hotel_db_path}...")

    # Connect to hotel database
    hotel_conn = sqlite3.connect(hotel_db_path)
    hotel_cursor = hotel_conn.cursor()
    unified_cursor = unified_conn.cursor()

    migrated_records = 0

    # Get table names from hotel database
    hotel_cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in hotel_cursor.fetchall()]

    # Migrate each table
    for table in tables:
        if table == 'sqlite_sequence':
            continue

        try:
            # Get all data from hotel table
            hotel_cursor.execute(f"SELECT * FROM {table}")
            rows = hotel_cursor.fetchall()

            if not rows:
                continue

            # Get column names
            hotel_cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in hotel_cursor.fetchall()]

            # Insert data into unified database with hotel_id
            for row in rows:
                # Create column list with hotel_id
                insert_columns = ['hotel_id'] + columns
                insert_values = [hotel_id] + list(row)

                placeholders = ','.join(['?'] * len(insert_values))
                columns_str = ','.join(insert_columns)

                unified_cursor.execute(
                    f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})",
                    insert_values
                )
                migrated_records += 1

            print(f"    ✓ Migrated {len(rows)} records from {table}")

        except Exception as e:
            print(f"    ✗ Error migrating {table}: {e}")

    hotel_conn.close()
    unified_conn.commit()
    return migrated_records > 0

def initialize_sample_data(conn, hotel_id):
    """Initialize sample data for a hotel"""
    cursor = conn.cursor()

    # Sample dishes for the hotel
    sample_dishes = [
        (hotel_id, "Margherita Pizza", "Classic pizza with tomato sauce, mozzarella, and basil", "Main Course", 12.99, 20, "/static/images/default-dish.jpg", 0, 0, 0, 1),
        (hotel_id, "Caesar Salad", "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan", "Appetizer", 8.99, 15, "/static/images/default-dish.jpg", 0, 0, 0, 1),
        (hotel_id, "Chocolate Cake", "Rich chocolate cake with ganache frosting", "Dessert", 6.99, 10, "/static/images/default-dish.jpg", 0, 0, 0, 1),
        (hotel_id, "Iced Tea", "Refreshing iced tea with lemon", "Beverage", 3.99, 30, "/static/images/default-dish.jpg", 0, 0, 0, 1),
    ]

    for dish in sample_dishes:
        cursor.execute('''
            INSERT INTO dishes (hotel_id, name, description, category, price, quantity, image_path, discount, is_offer, is_special, visibility, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', dish + (datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()))

    # Sample tables
    for table_num in range(1, 9):
        cursor.execute('''
            INSERT INTO tables (hotel_id, table_number, is_occupied, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (hotel_id, table_num, False, datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()))

    # Sample loyalty tiers
    loyalty_tiers = [
        (hotel_id, 3, 5.0, True),
        (hotel_id, 5, 10.0, True),
        (hotel_id, 10, 15.0, True),
        (hotel_id, 20, 20.0, True),
    ]

    for tier in loyalty_tiers:
        cursor.execute('''
            INSERT INTO loyalty_tiers (hotel_id, visit_count, discount_percentage, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', tier + (datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()))

    # Sample selection offers
    selection_offers = [
        (hotel_id, 50.0, 5.0, True, "Spend $50, get $5 off"),
        (hotel_id, 100.0, 15.0, True, "Spend $100, get $15 off"),
        (hotel_id, 150.0, 25.0, True, "Spend $150, get $25 off"),
    ]

    for offer in selection_offers:
        cursor.execute('''
            INSERT INTO selection_offers (hotel_id, min_amount, discount_amount, is_active, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', offer + (datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()))

    conn.commit()
    print(f"  ✓ Initialized sample data for hotel_id {hotel_id}")

def main():
    """Main migration function"""
    print("🔄 Starting migration to unified database...")

    # Check command line arguments
    init_sample_data = "--init-sample" in sys.argv

    # Backup existing Tabble.db if it exists
    if os.path.exists('Tabble.db'):
        backup_name = f"Tabble.db.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2('Tabble.db', backup_name)
        print(f"✓ Backed up existing Tabble.db to {backup_name}")

    # Read hotels configuration
    hotels = read_hotels_csv()
    print(f"✓ Found {len(hotels)} hotels in configuration")

    # Create unified database
    conn = sqlite3.connect('Tabble.db')

    try:
        # Create schema
        create_unified_schema(conn)

        # Populate hotels table
        populate_hotels_table(conn, hotels)

        # Migrate data from individual hotel databases
        print("🔄 Migrating hotel data...")
        migrated_any = False
        for hotel in hotels:
            if migrate_hotel_data(conn, hotel['database_file'], hotel['id']):
                migrated_any = True

        # Initialize sample data if requested or no data was migrated
        if init_sample_data or not migrated_any:
            print("🔄 Initializing sample data...")
            for hotel in hotels:
                initialize_sample_data(conn, hotel['id'])

        print("✅ Migration completed successfully!")
        print(f"✓ Unified database created: Tabble.db")
        print(f"✓ Hotels registered: {len(hotels)}")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
