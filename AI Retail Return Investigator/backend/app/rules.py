from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import Order, InvestigationResult
from typing import Dict, Any, Optional

def evaluate_business_rules(
    order_number: str,
    product_name: str,
    db: Session
) -> Dict[str, Any]:
    """
    Evaluates deterministic business rules.
    Returns a dictionary of boolean flags and numeric risk values.
    """
    rules_triggered = {
        "order_found": False,
        "return_window_expired": False,
        "product_mismatch": False,
        "customer_has_high_returns": False,
        "fraud_risk_score": 0.0,
        "order_details": None
    }
    
    # 1. Verify Order Exists
    order: Optional[Order] = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        rules_triggered["fraud_risk_score"] += 40.0
        return rules_triggered
    
    rules_triggered["order_found"] = True
    rules_triggered["order_details"] = {
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "purchase_date": order.purchase_date.isoformat(),
        "product_name": order.product_name,
        "product_category": order.product_category,
        "price": order.price,
        "status": order.status
    }
    
    # 2. Verify Product Name Matches Order
    # Simple case-insensitive substring search or equality
    if product_name.lower().strip() not in order.product_name.lower().strip() and order.product_name.lower().strip() not in product_name.lower().strip():
        rules_triggered["product_mismatch"] = True
        rules_triggered["fraud_risk_score"] += 35.0
        
    # 3. Check Return Window (assume standard policy window is 30 days unless specified otherwise by retrieved policy)
    # For simulation, compare purchase_date with current date
    # Let's say current date is 2026-08-17 (as in metadata)
    now = datetime(2026, 8, 17, tzinfo=timezone.utc)
    # Ensure order.purchase_date is timezone aware
    p_date = order.purchase_date
    if p_date.tzinfo is None:
        p_date = p_date.replace(tzinfo=timezone.utc)
        
    days_since_purchase = (now - p_date).days
    rules_triggered["days_since_purchase"] = days_since_purchase
    
    # We default return window to 30 days
    if days_since_purchase > 30:
        rules_triggered["return_window_expired"] = True
        
    # 4. Check historical customer return frequency
    # Find past investigation requests for this customer email that were APPROVED
    customer_email = order.customer_email
    past_orders = db.query(Order).filter(Order.customer_email == customer_email).all()
    past_order_nums = [o.order_number for o in past_orders]
    
    past_approvals = db.query(InvestigationResult).filter(
        InvestigationResult.order_number.in_(past_order_nums),
        InvestigationResult.decision == "APPROVE"
    ).count()
    
    rules_triggered["past_approved_returns"] = past_approvals
    
    if past_approvals >= 3:
        rules_triggered["customer_has_high_returns"] = True
        rules_triggered["fraud_risk_score"] += min(past_approvals * 15.0, 50.0)
        
    # Add score based on high value items
    if order.price > 500.0:
        rules_triggered["fraud_risk_score"] += 15.0
        
    return rules_triggered
