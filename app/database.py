from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Text,
    Boolean,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, scoped_session
from datetime import datetime, timezone
import os
import threading
from typing import Dict, Optional
import uuid

# Base declarative class
Base = declarative_base()

# Session-based database manager
class DatabaseManager:
    def __init__(self):
        self.sessions: Dict[str, dict] = {}
        self.lock = threading.Lock()
        self.default_database = "tabble_new.db"
        
        # Set up Render-specific database path
        if os.environ.get('RENDER'):
            self.render_data_path = "/tabble-data"
            os.makedirs(self.render_data_path, exist_ok=True)

    def get_session_id(self, request_headers: dict) -> str:
        """Generate or retrieve session ID from request headers"""
        session_id = request_headers.get('x-session-id')
        if not session_id:
            session_id = str(uuid.uuid4())
        return session_id

    def get_database_connection(self, session_id: str, database_name: Optional[str] = None) -> dict:
        """Get or create database connection for session"""
        with self.lock:
            if session_id not in self.sessions:
                # Create new session with default database
                db_name = database_name or self.default_database
                self.sessions[session_id] = self._create_connection(db_name)
            elif database_name and self.sessions[session_id]['database_name'] != database_name:
                # Switch database for existing session
                self._dispose_connection(session_id)
                self.sessions[session_id] = self._create_connection(database_name)

            return self.sessions[session_id]

    def _create_connection(self, database_name: str) -> dict:
        """Create a new database connection"""
        database_url = f"sqlite:///./tabble_new.db" if database_name == "tabble_new.db" else f"sqlite:///./{database_name}"
        
        # Ensure database directory exists and is writable
        db_path = database_url.replace("sqlite:///", "")
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)
        
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
        session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session_local = scoped_session(session_factory)

        # Create tables in the database if they don't exist
        Base.metadata.create_all(bind=engine)

        return {
            'database_name': database_name,
            'database_url': database_url,
            'engine': engine,
            'session_local': session_local
        }

    def _dispose_connection(self, session_id: str):
        """Dispose of database connection for session"""
        if session_id in self.sessions:
            connection = self.sessions[session_id]
            connection['session_local'].remove()
            connection['engine'].dispose()

    def switch_database(self, session_id: str, database_name: str) -> bool:
        """Switch database for a specific session"""
        try:
            self.get_database_connection(session_id, database_name)
            print(f"Session {session_id} switched to database: {database_name}")
            return True
        except Exception as e:
            print(f"Error switching database for session {session_id}: {e}")
            return False

    def get_current_database(self, session_id: str) -> str:
        """Get current database name for session"""
        if session_id in self.sessions:
            return self.sessions[session_id]['database_name']
        return self.default_database

    def cleanup_session(self, session_id: str):
        """Clean up session resources"""
        with self.lock:
            if session_id in self.sessions:
                self._dispose_connection(session_id)
                del self.sessions[session_id]

# Global database manager instance
db_manager = DatabaseManager()

# Global variables for database connection (legacy support)
CURRENT_DATABASE = "tabble_new.db"

# Set up database URL based on environment
if os.environ.get('RENDER'):
    DATABASE_URL = f"sqlite:////tabble-data/tabble_new.db"
else:
    DATABASE_URL = f"sqlite:///./tabble_new.db"  # Using the new database with offers feature

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = scoped_session(session_factory)

# Lock for thread safety when switching databases
db_lock = threading.Lock()


# Database models
class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    category = Column(String, index=True)
    price = Column(Float)
    quantity = Column(Integer, default=0)
    image_path = Column(String, nullable=True)
    discount = Column(Float, default=0)  # Discount amount (percentage)
    is_offer = Column(Integer, default=0)  # 0 = not an offer, 1 = is an offer
    is_special = Column(Integer, default=0)  # 0 = not special, 1 = today's special
    visibility = Column(Integer, default=1)  # 1 = visible, 0 = hidden (soft delete)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship with OrderItem
    order_items = relationship("OrderItem", back_populates="dish")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(Integer)
    unique_id = Column(String, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=True)
    status = Column(String, default="pending")  # pending, accepted, completed, paid
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    items = relationship("OrderItem", back_populates="order")
    person = relationship("Person", back_populates="orders")


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    phone_number = Column(String, unique=True, index=True, nullable=True)  # Added phone number field
    visit_count = Column(Integer, default=0)
    last_visit = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship with Order
    orders = relationship("Order", back_populates="person")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    dish_id = Column(Integer, ForeignKey("dishes.id"))
    quantity = Column(Integer, default=1)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    order = relationship("Order", back_populates="items")
    dish = relationship("Dish", back_populates="order_items")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=True)
    rating = Column(Integer)  # 1-5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    order = relationship("Order")
    person = relationship("Person")


class LoyaltyProgram(Base):
    __tablename__ = "loyalty_program"

    id = Column(Integer, primary_key=True, index=True)
    visit_count = Column(Integer, unique=True)  # Number of visits required
    discount_percentage = Column(Float)  # Discount percentage
    is_active = Column(Boolean, default=True)  # Whether this loyalty tier is active
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class SelectionOffer(Base):
    __tablename__ = "selection_offers"

    id = Column(Integer, primary_key=True, index=True)
    min_amount = Column(Float)  # Minimum order amount to qualify
    discount_amount = Column(Float)  # Fixed discount amount to apply
    is_active = Column(Boolean, default=True)  # Whether this offer is active
    description = Column(String, nullable=True)  # Optional description of the offer
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(Integer, unique=True)  # Table number
    is_occupied = Column(
        Boolean, default=False
    )  # Whether the table is currently occupied
    current_order_id = Column(
        Integer, ForeignKey("orders.id"), nullable=True
    )  # Current active order
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship to current order
    current_order = relationship("Order", foreign_keys=[current_order_id])


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    hotel_name = Column(String, nullable=False, default="Tabble Hotel")
    address = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    tax_id = Column(String, nullable=True)
    logo_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


# Function to switch database
def switch_database(database_name):
    global CURRENT_DATABASE, DATABASE_URL, engine, SessionLocal

    with db_lock:
        if database_name == CURRENT_DATABASE:
            return  # Already using this database

        # Update global variables
        CURRENT_DATABASE = database_name
        
        # Set up database URL based on environment
        if os.environ.get('RENDER'):
            if database_name == "tabble_new.db":
                DATABASE_URL = f"sqlite:////tabble-data/tabble_new.db"
            else:
                DATABASE_URL = f"sqlite:////tabble-data/{database_name}"
        else:
            DATABASE_URL = f"sqlite:///./tabble_new.db" if database_name == "tabble_new.db" else f"sqlite:///./{database_name}"

        # Dispose of the old engine and create a new one
        engine.dispose()
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

        # Create a new session factory and scoped session
        session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        SessionLocal.remove()
        SessionLocal = scoped_session(session_factory)

        # Create tables in the new database if they don't exist
        create_tables()

        print(f"Switched to database: {database_name}")


# Get current database name
def get_current_database():
    return CURRENT_DATABASE


# Create tables
def create_tables():
    # Create all tables (only creates tables that don't exist)
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified successfully")


# Get database session (legacy)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Session-aware database functions
def get_session_db(session_id: str, database_name: Optional[str] = None):
    """Get database session for a specific session ID"""
    connection = db_manager.get_database_connection(session_id, database_name)
    db = connection['session_local']()
    try:
        yield db
    finally:
        db.close()


def switch_session_database(session_id: str, database_name: str) -> bool:
    """Switch database for a specific session"""
    return db_manager.switch_database(session_id, database_name)


def get_session_current_database(session_id: str) -> str:
    """Get current database name for a session"""
    return db_manager.get_current_database(session_id)


def cleanup_session_db(session_id: str):
    """Clean up database resources for a session"""
    db_manager.cleanup_session(session_id)
