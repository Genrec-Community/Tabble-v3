import sqlite3
import os

def create_database_schema():
    """Define the database schema"""
    schema = {
        'dishes': '''
            CREATE TABLE dishes (
                id INTEGER NOT NULL,
                name VARCHAR,
                description TEXT,
                category VARCHAR,
                price FLOAT,
                quantity INTEGER,
                image_path VARCHAR,
                discount FLOAT,
                is_offer INTEGER,
                is_special INTEGER,
                visibility INTEGER,
                created_at DATETIME,
                updated_at DATETIME,
                PRIMARY KEY (id)
            )
        ''',
        'persons': '''
            CREATE TABLE persons (
                id INTEGER NOT NULL,
                username VARCHAR,
                password VARCHAR,
                phone_number VARCHAR,
                visit_count INTEGER,
                last_visit DATETIME,
                created_at DATETIME,
                PRIMARY KEY (id)
            )
        ''',
        'loyalty_program': '''
            CREATE TABLE loyalty_program (
                id INTEGER NOT NULL,
                visit_count INTEGER,
                discount_percentage FLOAT,
                is_active BOOLEAN,
                created_at DATETIME,
                updated_at DATETIME,
                PRIMARY KEY (id),
                UNIQUE (visit_count)
            )
        ''',
        'selection_offers': '''
            CREATE TABLE selection_offers (
                id INTEGER NOT NULL,
                min_amount FLOAT,
                discount_amount FLOAT,
                is_active BOOLEAN,
                description VARCHAR,
                created_at DATETIME,
                updated_at DATETIME,
                PRIMARY KEY (id)
            )
        ''',
        'settings': '''
            CREATE TABLE settings (
                id INTEGER NOT NULL,
                hotel_name VARCHAR NOT NULL,
                address VARCHAR,
                contact_number VARCHAR,
                email VARCHAR,
                tax_id VARCHAR,
                logo_path VARCHAR,
                created_at DATETIME,
                updated_at DATETIME,
                PRIMARY KEY (id)
            )
        ''',
        'orders': '''
            CREATE TABLE orders (
                id INTEGER NOT NULL,
                table_number INTEGER,
                unique_id VARCHAR,
                person_id INTEGER,
                status VARCHAR,
                created_at DATETIME,
                updated_at DATETIME,
                PRIMARY KEY (id),
                FOREIGN KEY(person_id) REFERENCES persons (id)
            )
        ''',
        'order_items': '''
            CREATE TABLE order_items (
                id INTEGER NOT NULL,
                order_id INTEGER,
                dish_id INTEGER,
                quantity INTEGER,
                remarks TEXT,
                created_at DATETIME,
                PRIMARY KEY (id),
                FOREIGN KEY(order_id) REFERENCES orders (id),
                FOREIGN KEY(dish_id) REFERENCES dishes (id)
            )
        ''',
        'feedback': '''
            CREATE TABLE feedback (
                id INTEGER NOT NULL,
                order_id INTEGER,
                person_id INTEGER,
                rating INTEGER,
                comment TEXT,
                created_at DATETIME,
                PRIMARY KEY (id),
                FOREIGN KEY(order_id) REFERENCES orders (id),
                FOREIGN KEY(person_id) REFERENCES persons (id)
            )
        ''',
        'tables': '''
            CREATE TABLE tables (
                id INTEGER NOT NULL,
                table_number INTEGER,
                is_occupied BOOLEAN,
                current_order_id INTEGER,
                created_at DATETIME,
                updated_at DATETIME,
                PRIMARY KEY (id),
                UNIQUE (table_number),
                FOREIGN KEY(current_order_id) REFERENCES orders (id)
            )
        '''
    }
    return schema

def create_empty_database(new_db_name):
    """Create new database with schema but no data"""
    if not new_db_name.endswith('.db'):
        new_db_name += '.db'
        
    try:
        # Check if database already exists
        if os.path.exists(new_db_name):
            raise FileExistsError(f"Database {new_db_name} already exists!")
            
        # Create new database
        new_conn = sqlite3.connect(new_db_name)
        new_cursor = new_conn.cursor()
        
        # Get schema and create all tables
        schema = create_database_schema()
        for table_name, create_statement in schema.items():
            new_cursor.execute(create_statement)
            
        new_conn.commit()
        new_conn.close()
        print(f"\nSuccess! Created empty database '{new_db_name}' with the proper schema")
        
    except sqlite3.Error as e:
        print(f"Error creating new database: {e}")
    except FileExistsError as e:
        print(f"Error: {e}")

def main():
    # Get new database name from user
    print("\nCreating a new empty database with the proper schema")
    new_db_name = input("Enter name for the new database (without .db extension): ").strip()
    
    # Create new empty database
    create_empty_database(new_db_name)

if __name__ == "__main__":
    main()