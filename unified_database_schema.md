# Unified Database Schema Design

## Overview
Refactor from multiple hotel-specific databases to a single unified `Tabble.db` with hotel_id discrimination.

## Current vs Target Architecture

### Current Architecture
- **Multiple Databases:** Each hotel has separate .db file
- **Authentication:** database_name + password
- **Data Isolation:** Separate database files
- **Connection Management:** DatabaseManager switches between databases per session

### Target Architecture
- **Single Database:** Tabble.db
- **Authentication:** hotel_name + password (from hotels.csv)
- **Data Isolation:** hotel_id foreign key filtering
- **Connection Management:** Single connection with hotel_id context

## Hotels Registry Table

```sql
CREATE TABLE hotels (
    id INTEGER PRIMARY KEY,
    hotel_name VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Data Migration from hotels.csv:**
```csv
hotel_name,password,hotel_id
tabble_new,myhotel,1
anifa,anifa123,2
hotelgood,hotelgood123,3
hotelmoon,moon123,4
shine,shine123,5
```

## Updated Table Schemas

### 1. Dishes Table
```sql
CREATE TABLE dishes (
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
);
```

### 2. Persons Table
```sql
CREATE TABLE persons (
    id INTEGER PRIMARY KEY,
    hotel_id INTEGER NOT NULL,
    username VARCHAR,
    password VARCHAR,
    phone_number VARCHAR,
    visit_count INTEGER DEFAULT 0,
    last_visit DATETIME,
    created_at DATETIME,
    FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    UNIQUE(hotel_id, username),
    UNIQUE(hotel_id, phone_number)
);
```

### 3. Orders Table
```sql
CREATE TABLE orders (
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
);
```

### 4. Order Items Table
```sql
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    hotel_id INTEGER NOT NULL,
    order_id INTEGER,
    dish_id INTEGER,
    quantity INTEGER,
    price FLOAT,
    FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (dish_id) REFERENCES dishes (id)
);
```

### 5. Tables Table
```sql
CREATE TABLE tables (
    id INTEGER PRIMARY KEY,
    hotel_id INTEGER NOT NULL,
    table_number INTEGER,
    is_occupied BOOLEAN DEFAULT FALSE,
    current_order_id INTEGER,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    FOREIGN KEY (current_order_id) REFERENCES orders (id),
    UNIQUE(hotel_id, table_number)
);
```

### 6. Settings Table
```sql
CREATE TABLE settings (
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
    FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    UNIQUE(hotel_id)
);
```

### 7. Feedback Table
```sql
CREATE TABLE feedback (
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
);
```

### 8. Loyalty Program Table
```sql
CREATE TABLE loyalty_tiers (
    id INTEGER PRIMARY KEY,
    hotel_id INTEGER NOT NULL,
    visit_count INTEGER,
    discount_percentage FLOAT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (hotel_id) REFERENCES hotels (id)
);
```

### 9. Selection Offers Table
```sql
CREATE TABLE selection_offers (
    id INTEGER PRIMARY KEY,
    hotel_id INTEGER NOT NULL,
    min_amount FLOAT,
    discount_amount FLOAT,
    is_active BOOLEAN DEFAULT TRUE,
    description VARCHAR,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (hotel_id) REFERENCES hotels (id)
);
```

## Key Changes Required

### 1. Database Models (SQLAlchemy)
- Add `hotel_id` column to all models
- Add foreign key relationships to hotels table
- Update unique constraints to include hotel_id

### 2. Authentication System
- Change from `database_name + password` to `hotel_name + password`
- Update middleware to validate against hotels table
- Modify frontend to use hotel names instead of database names

### 3. Database Manager
- Remove database switching logic
- Use single connection to Tabble.db
- Add hotel_id context to session management

### 4. Query Filtering
- Add `filter(Model.hotel_id == current_hotel_id)` to all queries
- Update all CRUD operations to include hotel_id
- Ensure data isolation through query filtering

### 5. Migration Strategy
- Create migration script to:
  1. Create new Tabble.db with unified schema
  2. Migrate data from existing hotel databases
  3. Populate hotels table from hotels.csv
  4. Add hotel_id to all migrated records

## Data Isolation Verification
- All queries must include hotel_id filtering
- No cross-hotel data access possible
- Maintain same security level as separate databases
