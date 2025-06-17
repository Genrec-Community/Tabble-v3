from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta

from ..database import get_db, Dish, Order, OrderItem, Person, get_session_db
from ..models.dish import Dish as DishModel
from ..models.order import OrderCreate, Order as OrderModel
from ..models.user import (
    PersonCreate,
    PersonLogin,
    Person as PersonModel,
    PhoneAuthRequest,
    PhoneVerifyRequest,
    UsernameRequest
)
from ..services import firebase_auth
from ..middleware import get_session_id

router = APIRouter(
    prefix="/customer",
    tags=["customer"],
    responses={404: {"description": "Not found"}},
)


# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))


# Get all dishes for menu (only visible ones)
@router.get("/api/menu", response_model=List[DishModel])
def get_menu(request: Request, category: str = None, db: Session = Depends(get_session_database)):
    if category:
        dishes = db.query(Dish).filter(Dish.category == category, Dish.visibility == 1).all()
    else:
        dishes = db.query(Dish).filter(Dish.visibility == 1).all()
    return dishes


# Get offer dishes (only visible ones)
@router.get("/api/offers", response_model=List[DishModel])
def get_offers(request: Request, db: Session = Depends(get_session_database)):
    dishes = db.query(Dish).filter(Dish.is_offer == 1, Dish.visibility == 1).all()
    return dishes


# Get special dishes (only visible ones)
@router.get("/api/specials", response_model=List[DishModel])
def get_specials(request: Request, db: Session = Depends(get_session_database)):
    dishes = db.query(Dish).filter(Dish.is_special == 1, Dish.visibility == 1).all()
    return dishes


# Get all dish categories (only from visible dishes)
@router.get("/api/categories")
def get_categories(request: Request, db: Session = Depends(get_session_database)):
    categories = db.query(Dish.category).filter(Dish.visibility == 1).distinct().all()
    return [category[0] for category in categories]


# Register a new user or update existing user
@router.post("/api/register", response_model=PersonModel)
def register_user(user: PersonCreate, request: Request, db: Session = Depends(get_session_database)):
    # Check if user already exists
    db_user = db.query(Person).filter(Person.username == user.username).first()

    if db_user:
        # Update existing user's last visit time (visit count updated only when order is placed)
        db_user.last_visit = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_user)
        return db_user
    else:
        # Create new user (visit count will be incremented when first order is placed)
        db_user = Person(
            username=user.username,
            password=user.password,  # In a real app, you should hash this password
            visit_count=0,
            last_visit=datetime.now(timezone.utc),
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


# Login user
@router.post("/api/login", response_model=Dict[str, Any])
def login_user(user_data: PersonLogin, request: Request, db: Session = Depends(get_session_database)):
    # Find user by username
    db_user = db.query(Person).filter(Person.username == user_data.username).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username"
        )

    # Check password (in a real app, you would verify hashed passwords)
    if db_user.password != user_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password"
        )

    # Update last visit time (but not visit count - that's only updated when order is placed)
    db_user.last_visit = datetime.now(timezone.utc)
    db.commit()

    # Return user info and a success message
    return {
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "visit_count": db_user.visit_count,
        },
        "message": "Login successful",
    }


# Create new order
@router.post("/api/orders", response_model=OrderModel)
def create_order(
    order: OrderCreate, request: Request, person_id: int = None, db: Session = Depends(get_session_database)
):
    # If person_id is not provided but we have a username/password, try to find or create the user
    if not person_id and hasattr(order, "username") and hasattr(order, "password"):
        # Check if user exists
        db_user = db.query(Person).filter(Person.username == order.username).first()

        if db_user:
            # Update existing user's visit count
            db_user.visit_count += 1
            db_user.last_visit = datetime.now(timezone.utc)
            db.commit()
            person_id = db_user.id
        else:
            # Create new user (visit count starts at 1 since they're placing their first order)
            db_user = Person(
                username=order.username,
                password=order.password,
                visit_count=1,
                last_visit=datetime.now(timezone.utc),
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            person_id = db_user.id
    elif person_id:
        # If person_id is provided (normal flow), increment visit count for that user
        db_user = db.query(Person).filter(Person.id == person_id).first()
        if db_user:
            db_user.visit_count += 1
            db_user.last_visit = datetime.now(timezone.utc)
            db.commit()

    # Create order
    db_order = Order(
        table_number=order.table_number,
        unique_id=order.unique_id,
        person_id=person_id,  # Link order to person if provided
        status="pending",
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Mark the table as occupied
    from ..database import Table

    db_table = db.query(Table).filter(Table.table_number == order.table_number).first()
    if db_table:
        db_table.is_occupied = True
        db_table.current_order_id = db_order.id
        db.commit()

    # Create order items
    for item in order.items:
        # Get the dish to include its information
        dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
        if not dish:
            continue  # Skip if dish doesn't exist

        db_item = OrderItem(
            order_id=db_order.id,
            dish_id=item.dish_id,
            quantity=item.quantity,
            remarks=item.remarks,
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)

    return db_order


# Get order status
@router.get("/api/orders/{order_id}", response_model=OrderModel)
def get_order(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    # Use joinedload to load the dish relationship for each order item
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Explicitly load dish information for each order item
    for item in order.items:
        if not hasattr(item, "dish") or item.dish is None:
            dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
            if dish:
                item.dish = dish

    return order


# Get orders by person_id
@router.get("/api/person/{person_id}/orders", response_model=List[OrderModel])
def get_person_orders(person_id: int, request: Request, db: Session = Depends(get_session_database)):
    # Get all orders for a specific person
    orders = (
        db.query(Order)
        .filter(Order.person_id == person_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    # Explicitly load dish information for each order item
    for order in orders:
        for item in order.items:
            if not hasattr(item, "dish") or item.dish is None:
                dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
                if dish:
                    item.dish = dish

    return orders


# Request payment for order
@router.put("/api/orders/{order_id}/payment")
def request_payment(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    try:
        # Check if order exists and is not already paid
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if db_order is None:
            raise HTTPException(status_code=404, detail="Order not found")

        # Check if order is already paid
        if db_order.status == "paid":
            return {"message": "Order is already paid"}

        # Check if order is completed (ready for payment)
        if db_order.status != "completed":
            raise HTTPException(
                status_code=400,
                detail="Order must be completed before payment can be processed"
            )

        # Update order status to paid
        db_order.status = "paid"
        db_order.updated_at = datetime.now(timezone.utc)

        # Check if this is the last unpaid order for this table
        from ..database import Table

        # Get all orders for this table that are not paid
        table_unpaid_orders = db.query(Order).filter(
            Order.table_number == db_order.table_number,
            Order.status != "paid",
            Order.status != "cancelled"
        ).all()

        # If this is the only unpaid order, mark table as free
        if len(table_unpaid_orders) == 1 and table_unpaid_orders[0].id == order_id:
            db_table = db.query(Table).filter(Table.table_number == db_order.table_number).first()
            if db_table:
                db_table.is_occupied = False
                db_table.current_order_id = None
                db_table.updated_at = datetime.now(timezone.utc)

        # Commit the transaction
        db.commit()
        db.refresh(db_order)

        return {"message": "Payment completed successfully", "order_id": order_id}

    except HTTPException:
        # Re-raise HTTP exceptions
        db.rollback()
        raise
    except Exception as e:
        # Handle any other exceptions
        db.rollback()
        print(f"Error processing payment for order {order_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing payment: {str(e)}"
        )


# Cancel order
@router.put("/api/orders/{order_id}/cancel")
def cancel_order(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order is in pending status (not accepted or completed)
    if db_order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending orders can be cancelled. Orders that have been accepted by the chef cannot be cancelled."
        )

    # Update order status to cancelled
    current_time = datetime.now(timezone.utc)
    db_order.status = "cancelled"
    db_order.updated_at = current_time

    # Mark the table as free if this was the current order
    from ..database import Table

    db_table = db.query(Table).filter(Table.table_number == db_order.table_number).first()
    if db_table and db_table.current_order_id == db_order.id:
        db_table.is_occupied = False
        db_table.current_order_id = None
        db_table.updated_at = current_time

    db.commit()

    return {"message": "Order cancelled successfully"}


# Get person details
@router.get("/api/person/{person_id}", response_model=PersonModel)
def get_person(person_id: int, request: Request, db: Session = Depends(get_session_database)):
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


# Phone authentication endpoints
@router.post("/api/phone-auth", response_model=Dict[str, Any])
def phone_auth(auth_request: PhoneAuthRequest, request: Request, db: Session = Depends(get_session_database)):
    """
    Initiate phone authentication by sending OTP
    """
    try:
        # Validate phone number format
        if not auth_request.phone_number.startswith("+91"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number must start with +91"
            )

        # Send OTP via Firebase
        result = firebase_auth.verify_phone_number(auth_request.phone_number)

        print(f"Phone auth initiated for: {auth_request.phone_number}, table: {auth_request.table_number}")

        return {
            "success": True,
            "message": "Verification code sent successfully",
            "session_info": result.get("sessionInfo", "firebase-verification-token")
        }
    except HTTPException as e:
        print(f"HTTP Exception in phone_auth: {e.detail}")
        raise e
    except Exception as e:
        print(f"Exception in phone_auth: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification code: {str(e)}"
        )


@router.post("/api/verify-otp", response_model=Dict[str, Any])
def verify_otp(verify_request: PhoneVerifyRequest, request: Request, db: Session = Depends(get_session_database)):
    """
    Verify OTP and authenticate user
    """
    try:
        print(f"Verifying OTP for phone: {verify_request.phone_number}")

        # Verify OTP via Firebase
        # Note: The actual OTP verification is done on the client side with Firebase
        # This is just a validation step
        firebase_auth.verify_otp(
            verify_request.phone_number,
            verify_request.verification_code
        )

        # Check if user exists in database
        user = db.query(Person).filter(Person.phone_number == verify_request.phone_number).first()

        if user:
            print(f"Existing user found: {user.username}")
            # Existing user - update last visit time (visit count updated only when order is placed)
            user.last_visit = datetime.now(timezone.utc)
            db.commit()
            db.refresh(user)

            return {
                "success": True,
                "message": "Authentication successful",
                "user_exists": True,
                "user_id": user.id,
                "username": user.username
            }
        else:
            print(f"New user with phone: {verify_request.phone_number}")
            # New user - return flag to collect username
            return {
                "success": True,
                "message": "Authentication successful, but user not found",
                "user_exists": False
            }

    except HTTPException as e:
        print(f"HTTP Exception in verify_otp: {e.detail}")
        raise e
    except Exception as e:
        print(f"Exception in verify_otp: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify OTP: {str(e)}"
        )


@router.post("/api/register-phone-user", response_model=Dict[str, Any])
def register_phone_user(user_request: UsernameRequest, request: Request, db: Session = Depends(get_session_database)):
    """
    Register a new user after phone authentication
    """
    try:
        print(f"Registering new user with phone: {user_request.phone_number}, username: {user_request.username}")

        # Check if username already exists
        existing_user = db.query(Person).filter(Person.username == user_request.username).first()
        if existing_user:
            print(f"Username already exists: {user_request.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )

        # Check if phone number already exists
        phone_user = db.query(Person).filter(Person.phone_number == user_request.phone_number).first()
        if phone_user:
            print(f"Phone number already registered: {user_request.phone_number}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )

        # Create new user (visit count will be incremented when first order is placed)
        new_user = Person(
            username=user_request.username,
            password="",  # No password needed for phone auth
            phone_number=user_request.phone_number,
            visit_count=0,
            last_visit=datetime.now(timezone.utc)
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print(f"User registered successfully: {new_user.id}, {new_user.username}")

        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": new_user.id,
            "username": new_user.username
        }

    except HTTPException as e:
        print(f"HTTP Exception in register_phone_user: {e.detail}")
        raise e
    except Exception as e:
        print(f"Exception in register_phone_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}"
        )
