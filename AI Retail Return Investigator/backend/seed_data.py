from datetime import datetime, timedelta, timezone
from app.database import SessionLocal, Base, engine
from app.models import Order, Policy, InvestigationResult

def seed_database():
    db = SessionLocal()
    
    # Recreate tables to start clean
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("Database tables initialized. Seeding data...")
    
    # 1. Seed Policies
    policies = [
        Policy(
            code="GENERAL",
            title="General Return Policy",
            content="Standard return period is 30 days from delivery. Items must be in original condition, unused, with all tags attached. Full refunds are processed to the original payment method, or store credit can be selected.",
            return_window_days=30
        ),
        Policy(
            code="ELECTRONICS",
            title="Electronics and Gadgets Policy",
            content="Electronics are subject to a strict 15-day return window. Items must be returned with all original packaging, manuals, accessories, and warranty cards. Return reasons involving defective hardware are fully covered for free shipping. Buyer remorse returns (e.g. wrong color, changed mind) are subject to a 15% restocking fee.",
            return_window_days=15
        ),
        Policy(
            code="HYGIENE",
            title="Hygiene and Personal Care Policy",
            content="For hygiene and safety reasons, intimate apparel, swimwear, cosmetics, earrings, and personal care products are strictly non-returnable once opened. If the item is claimed as defective or damaged upon delivery, clear photo evidence of the unopened outer packaging and the defect must be provided prior to return approval.",
            return_window_days=14
        ),
        Policy(
            code="CLEARANCE",
            title="Clearance and Final Sale Policy",
            content="All purchases of items marked as 'Clearance', 'Final Sale', or bought during special warehouse liquidation events are strictly non-refundable and non-exchangeable. No exceptions apply.",
            return_window_days=0
        ),
        Policy(
            code="FRAUD_PREVENTION",
            title="Fraud and Abuse Prevention Guidelines",
            content="Any customer profile exhibiting more than 3 return approvals within a rolling 30-day period will trigger high-risk security review. These claims must be routed for manual inspection. Serial numbers must be verified against original purchase logs prior to final credit release.",
            return_window_days=None
        )
    ]
    
    for p in policies:
        db.add(p)
        
    # 2. Seed Orders (Reference date for "current" is 2026-08-17)
    base_date = datetime(2026, 8, 17)
    
    orders = [
        Order(
            order_number="ORD-98721",
            customer_name="John Doe",
            customer_email="john.doe@example.com",
            purchase_date=base_date - timedelta(days=7),  # Active electronics return
            product_name="UltraSound Wireless Headphones",
            product_category="Electronics",
            price=199.99,
            status="DELIVERED"
        ),
        Order(
            order_number="ORD-45210",
            customer_name="Sarah Jenkins",
            customer_email="sarah.j@example.com",
            purchase_date=base_date - timedelta(days=45),  # Expired order
            product_name="Designer Silk Pajamas",
            product_category="Apparel",
            price=89.50,
            status="DELIVERED"
        ),
        Order(
            order_number="ORD-12345",
            customer_name="Marcus Vance",
            customer_email="marcus.v@example.com",
            purchase_date=base_date - timedelta(days=12),  # Valid standard return
            product_name="Premium Leather Running Shoes",
            product_category="Footwear",
            price=150.00,
            status="DELIVERED"
        ),
        Order(
            order_number="ORD-77788",
            customer_name="Suspicious Sam",
            customer_email="sam.fraud@example.com",
            purchase_date=base_date - timedelta(days=3),  # High value, high frequency fraud simulation
            product_name="Smart OLED 4K TV",
            product_category="Electronics",
            price=1299.00,
            status="DELIVERED"
        ),
        Order(
            order_number="ORD-55555",
            customer_name="Suspicious Sam",
            customer_email="sam.fraud@example.com",
            purchase_date=base_date - timedelta(days=20),
            product_name="Wireless Keyboard Pro",
            product_category="Electronics",
            price=79.99,
            status="DELIVERED"
        ),
        Order(
            order_number="ORD-44444",
            customer_name="Suspicious Sam",
            customer_email="sam.fraud@example.com",
            purchase_date=base_date - timedelta(days=22),
            product_name="Gaming Mouse",
            product_category="Electronics",
            price=59.99,
            status="DELIVERED"
        ),
        Order(
            order_number="ORD-33333",
            customer_name="Suspicious Sam",
            customer_email="sam.fraud@example.com",
            purchase_date=base_date - timedelta(days=25),
            product_name="RGB Desk Mat",
            product_category="Electronics",
            price=29.99,
            status="DELIVERED"
        ),
        Order(
            order_number="ORD-22222",
            customer_name="Elena Rostova",
            customer_email="elena.r@example.com",
            purchase_date=base_date - timedelta(days=5),
            product_name="Gold Hoop Earrings",
            product_category="Jewelry",
            price=249.99,
            status="DELIVERED"
        )
    ]
    
    for o in orders:
        db.add(o)
        
    db.commit()
    
    # 3. Seed some historical investigations for Suspicious Sam to trigger fraud rules
    sam_history = [
        InvestigationResult(
            order_number="ORD-55555",
            product_name="Wireless Keyboard Pro",
            purchase_date=(base_date - timedelta(days=20)).isoformat(),
            return_reason="Wrong color",
            customer_description="It's not as dark as the picture.",
            requested_resolution="REFUND",
            decision="APPROVE",
            confidence=0.98,
            category="Buyer Remorse",
            risk_score=10.0,
            risk_level="LOW",
            policy_references=["GENERAL"],
            reasoning_summary="Standard approved refund.",
            recommended_action="Refund to customer card.",
            customer_response="Your refund has been processed."
        ),
        InvestigationResult(
            order_number="ORD-44444",
            product_name="Gaming Mouse",
            purchase_date=(base_date - timedelta(days=22)).isoformat(),
            return_reason="Defective",
            customer_description="Scroll wheel acts funny.",
            requested_resolution="REFUND",
            decision="APPROVE",
            confidence=0.94,
            category="Defective Product",
            risk_score=20.0,
            risk_level="LOW",
            policy_references=["GENERAL", "ELECTRONICS"],
            reasoning_summary="Approved replacement.",
            recommended_action="Ship replacement unit.",
            customer_response="Replacement unit shipped."
        ),
        InvestigationResult(
            order_number="ORD-33333",
            product_name="RGB Desk Mat",
            purchase_date=(base_date - timedelta(days=25)).isoformat(),
            return_reason="Incorrect item received",
            customer_description="Got a black desk mat instead of RGB.",
            requested_resolution="REFUND",
            decision="APPROVE",
            confidence=0.96,
            category="Incorrect Shipment",
            risk_score=15.0,
            risk_level="LOW",
            policy_references=["GENERAL"],
            reasoning_summary="Shipment correction approved.",
            recommended_action="Refunded.",
            customer_response="Refund applied."
        )
    ]
    
    for hist in sam_history:
        db.add(hist)
        
    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
