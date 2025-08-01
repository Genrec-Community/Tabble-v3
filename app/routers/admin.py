from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime, timezone
from ..utils.pdf_generator import generate_bill_pdf, generate_multi_order_bill_pdf

from ..database import get_db, Order, Dish, OrderItem, Person, Settings, get_session_db, get_session_current_database
from ..models.order import Order as OrderModel
from ..models.dish import Dish as DishModel, DishCreate, DishUpdate
from ..middleware import get_session_id

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)


# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))


# Get all orders with customer information
@router.get("/orders", response_model=List[OrderModel])
def get_all_orders(request: Request, status: str = None, db: Session = Depends(get_session_database)):
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)

    # Order by most recent first
    orders = query.order_by(Order.created_at.desc()).all()

    # Load person information for each order
    for order in orders:
        if order.person_id:
            person = db.query(Person).filter(Person.id == order.person_id).first()
            if person:
                # Add person information to the order
                order.person_name = person.username
                order.visit_count = person.visit_count

        # Load dish information for each order item
        for item in order.items:
            if not hasattr(item, "dish") or item.dish is None:
                dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
                if dish:
                    item.dish = dish

    return orders


# Get all dishes (only visible ones)
@router.get("/api/dishes", response_model=List[DishModel])
def get_all_dishes(
    request: Request,
    is_offer: Optional[int] = None,
    is_special: Optional[int] = None,
    db: Session = Depends(get_session_database),
):
    query = db.query(Dish).filter(Dish.visibility == 1)  # Only visible dishes

    if is_offer is not None:
        query = query.filter(Dish.is_offer == is_offer)

    if is_special is not None:
        query = query.filter(Dish.is_special == is_special)

    dishes = query.all()
    return dishes


# Get offer dishes (only visible ones)
@router.get("/api/offers", response_model=List[DishModel])
def get_offer_dishes(request: Request, db: Session = Depends(get_session_database)):
    dishes = db.query(Dish).filter(Dish.is_offer == 1, Dish.visibility == 1).all()
    return dishes


# Get special dishes (only visible ones)
@router.get("/api/specials", response_model=List[DishModel])
def get_special_dishes(request: Request, db: Session = Depends(get_session_database)):
    dishes = db.query(Dish).filter(Dish.is_special == 1, Dish.visibility == 1).all()
    return dishes


# Get dish by ID (only if visible)
@router.get("/api/dishes/{dish_id}", response_model=DishModel)
def get_dish(dish_id: int, request: Request, db: Session = Depends(get_session_database)):
    dish = db.query(Dish).filter(Dish.id == dish_id, Dish.visibility == 1).first()
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish


# Get all categories
@router.get("/api/categories")
def get_all_categories(request: Request, db: Session = Depends(get_session_database)):
    categories = db.query(Dish.category).distinct().all()
    return [category[0] for category in categories]


# Create new category
@router.post("/api/categories")
def create_category(request: Request, category_name: str = Form(...), db: Session = Depends(get_session_database)):
    # Check if category already exists
    existing_category = (
        db.query(Dish.category).filter(Dish.category == category_name).first()
    )
    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")

    return {"message": "Category created successfully", "category": category_name}


# Create new dish
@router.post("/api/dishes", response_model=DishModel)
async def create_dish(
    request: Request,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form(...),
    new_category: Optional[str] = Form(None),  # New field for custom category
    price: float = Form(...),
    quantity: int = Form(...),
    discount: Optional[float] = Form(0),  # Discount amount (percentage)
    is_offer: Optional[int] = Form(0),  # Whether this dish is part of offers
    is_special: Optional[int] = Form(0),  # Whether this dish is today's special
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session_database),
):
    # Use new category if provided, otherwise use selected category
    final_category = new_category if new_category else category

    # Create dish object
    db_dish = Dish(
        name=name,
        description=description,
        category=final_category,
        price=price,
        quantity=quantity,
        discount=discount,
        is_offer=is_offer,
        is_special=is_special,
    )

    # Save dish to database
    db.add(db_dish)
    db.commit()
    db.refresh(db_dish)

    # Handle image upload if provided
    if image:
        # Get current database name for organizing images
        session_id = get_session_id(request)
        current_db = get_session_current_database(session_id)

        # Create directory structure: app/static/images/dishes/{db_name}
        db_images_dir = f"app/static/images/dishes/{current_db}"
        os.makedirs(db_images_dir, exist_ok=True)

        # Save image with database-specific path
        image_path = f"{db_images_dir}/{db_dish.id}_{image.filename}"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # Update dish with image path (URL path for serving)
        db_dish.image_path = f"/static/images/dishes/{current_db}/{db_dish.id}_{image.filename}"
        db.commit()
        db.refresh(db_dish)

    return db_dish


# Update dish
@router.put("/api/dishes/{dish_id}", response_model=DishModel)
async def update_dish(
    dish_id: int,
    request: Request,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    new_category: Optional[str] = Form(None),  # New field for custom category
    price: Optional[float] = Form(None),
    quantity: Optional[int] = Form(None),
    discount: Optional[float] = Form(None),  # Discount amount (percentage)
    is_offer: Optional[int] = Form(None),  # Whether this dish is part of offers
    is_special: Optional[int] = Form(None),  # Whether this dish is today's special
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session_database),
):
    # Get existing dish
    db_dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if db_dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")

    # Update fields if provided
    if name:
        db_dish.name = name
    if description:
        db_dish.description = description
    if new_category:  # Use new category if provided
        db_dish.category = new_category
    elif category:
        db_dish.category = category
    if price:
        db_dish.price = price
    if quantity:
        db_dish.quantity = quantity
    if discount is not None:
        db_dish.discount = discount
    if is_offer is not None:
        db_dish.is_offer = is_offer
    if is_special is not None:
        db_dish.is_special = is_special

    # Handle image upload if provided
    if image:
        # Get current database name for organizing images
        session_id = get_session_id(request)
        current_db = get_session_current_database(session_id)

        # Create directory structure: app/static/images/dishes/{db_name}
        db_images_dir = f"app/static/images/dishes/{current_db}"
        os.makedirs(db_images_dir, exist_ok=True)

        # Save image with database-specific path
        image_path = f"{db_images_dir}/{db_dish.id}_{image.filename}"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # Update dish with image path (URL path for serving)
        db_dish.image_path = f"/static/images/dishes/{current_db}/{db_dish.id}_{image.filename}"

    # Update timestamp
    db_dish.updated_at = datetime.now(timezone.utc)

    # Save changes
    db.commit()
    db.refresh(db_dish)

    return db_dish


# Soft delete dish (set visibility to 0)
@router.delete("/api/dishes/{dish_id}")
def delete_dish(dish_id: int, request: Request, db: Session = Depends(get_session_database)):
    db_dish = db.query(Dish).filter(Dish.id == dish_id, Dish.visibility == 1).first()
    if db_dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")

    # Soft delete: set visibility to 0 instead of actually deleting
    db_dish.visibility = 0
    db_dish.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Dish deleted successfully"}


# Get order statistics
@router.get("/stats/orders")
def get_order_stats(request: Request, db: Session = Depends(get_session_database)):
    from sqlalchemy import func, and_

    # Get today's date range (start and end of today in UTC)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=999999)

    # Overall statistics
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == "pending").count()
    completed_orders = db.query(Order).filter(Order.status == "completed").count()
    payment_requested = (
        db.query(Order).filter(Order.status == "payment_requested").count()
    )
    paid_orders = db.query(Order).filter(Order.status == "paid").count()

    # Today's statistics
    total_orders_today = db.query(Order).filter(
        and_(Order.created_at >= today_start, Order.created_at <= today_end)
    ).count()

    pending_orders_today = db.query(Order).filter(
        and_(
            Order.status == "pending",
            Order.created_at >= today_start,
            Order.created_at <= today_end
        )
    ).count()

    completed_orders_today = db.query(Order).filter(
        and_(
            Order.status == "completed",
            Order.created_at >= today_start,
            Order.created_at <= today_end
        )
    ).count()

    paid_orders_today = db.query(Order).filter(
        and_(
            Order.status == "paid",
            Order.created_at >= today_start,
            Order.created_at <= today_end
        )
    ).count()

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "payment_requested": payment_requested,
        "paid_orders": paid_orders,
        "total_orders_today": total_orders_today,
        "pending_orders_today": pending_orders_today,
        "completed_orders_today": completed_orders_today,
        "paid_orders_today": paid_orders_today,
    }


# Mark order as paid
@router.put("/orders/{order_id}/paid")
def mark_order_paid(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Allow marking as paid from any status
    db_order.status = "paid"
    db_order.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {"message": "Order marked as paid"}


# Generate bill PDF for a single order
@router.get("/orders/{order_id}/bill")
def generate_bill(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    # Get order with all details
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Load person information if available
    if db_order.person_id:
        person = db.query(Person).filter(Person.id == db_order.person_id).first()
        if person:
            db_order.person_name = person.username

    # Load dish information for each order item
    for item in db_order.items:
        if not hasattr(item, "dish") or item.dish is None:
            dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
            if dish:
                item.dish = dish

    # Get hotel settings
    settings = db.query(Settings).first()
    if not settings:
        # Create default settings if none exist
        settings = Settings(
            hotel_name="Tabble Hotel",
            address="123 Main Street, City",
            contact_number="+1 123-456-7890",
            email="info@tabblehotel.com",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Generate PDF
    pdf_buffer = generate_bill_pdf(db_order, settings)

    # Return PDF as a downloadable file
    filename = f"bill_order_{order_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# Generate bill PDF for multiple orders
@router.post("/orders/multi-bill")
def generate_multi_bill(order_ids: List[int], request: Request, db: Session = Depends(get_session_database)):
    if not order_ids:
        raise HTTPException(status_code=400, detail="No order IDs provided")

    orders = []

    # Get all orders with details
    for order_id in order_ids:
        db_order = db.query(Order).filter(Order.id == order_id).first()
        if db_order is None:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

        # Load person information if available
        if db_order.person_id:
            person = db.query(Person).filter(Person.id == db_order.person_id).first()
            if person:
                db_order.person_name = person.username

        # Load dish information for each order item
        for item in db_order.items:
            if not hasattr(item, "dish") or item.dish is None:
                dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
                if dish:
                    item.dish = dish

        orders.append(db_order)

    # Get hotel settings
    settings = db.query(Settings).first()
    if not settings:
        # Create default settings if none exist
        settings = Settings(
            hotel_name="Tabble Hotel",
            address="123 Main Street, City",
            contact_number="+1 123-456-7890",
            email="info@tabblehotel.com",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Generate PDF for multiple orders
    pdf_buffer = generate_multi_order_bill_pdf(orders, settings)

    # Create a filename with all order IDs
    order_ids_str = "-".join([str(order_id) for order_id in order_ids])
    filename = f"bill_orders_{order_ids_str}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# Merge two orders
@router.post("/orders/merge")
def merge_orders(source_order_id: int, target_order_id: int, request: Request, db: Session = Depends(get_session_database)):
    # Get both orders
    source_order = db.query(Order).filter(Order.id == source_order_id).first()
    target_order = db.query(Order).filter(Order.id == target_order_id).first()

    if not source_order:
        raise HTTPException(status_code=404, detail=f"Source order {source_order_id} not found")

    if not target_order:
        raise HTTPException(status_code=404, detail=f"Target order {target_order_id} not found")

    # Check if both orders are completed or paid
    valid_statuses = ["completed", "paid"]
    if source_order.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Source order must be completed or paid, current status: {source_order.status}")

    if target_order.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Target order must be completed or paid, current status: {target_order.status}")

    # Move all items from source order to target order
    for item in source_order.items:
        # Update the order_id to point to the target order
        item.order_id = target_order.id

    # Update the target order's updated_at timestamp
    target_order.updated_at = datetime.now(timezone.utc)

    # Delete the source order (but keep its items which now belong to the target order)
    db.delete(source_order)

    # Commit changes
    db.commit()

    # Refresh the target order to include the new items
    db.refresh(target_order)

    return {"message": f"Orders merged successfully. Items from order #{source_order_id} have been moved to order #{target_order_id}"}


# Get completed orders for billing (paid orders)
@router.get("/orders/completed-for-billing", response_model=List[OrderModel])
def get_completed_orders_for_billing(request: Request, db: Session = Depends(get_session_database)):
    # Get paid orders ordered by most recent first
    orders = db.query(Order).filter(Order.status == "paid").order_by(Order.created_at.desc()).all()

    # Load person information for each order
    for order in orders:
        if order.person_id:
            person = db.query(Person).filter(Person.id == order.person_id).first()
            if person:
                # Add person information to the order
                order.person_name = person.username
                order.visit_count = person.visit_count

        # Load dish information for each order item
        for item in order.items:
            if not hasattr(item, "dish") or item.dish is None:
                dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
                if dish:
                    item.dish = dish

    return orders
