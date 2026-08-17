from app.database import SessionLocal
from app.schemas import ReturnRequestSubmit
from app.investigator import execute_investigation_pipeline

def run_tests():
    db = SessionLocal()
    
    test_cases = [
        {
            "name": "Case 1: Standard Valid Electronics Return within window",
            "req": ReturnRequestSubmit(
                order_number="ORD-98721",
                product_name="UltraSound Wireless Headphones",
                return_reason="Wrong color",
                customer_description="I ordered grey but they look much more silver in person. I would like to return them please.",
                requested_resolution="REFUND"
            )
        },
        {
            "name": "Case 2: Return window expired (Sarah Jenkins pajamas)",
            "req": ReturnRequestSubmit(
                order_number="ORD-45210",
                product_name="Designer Silk Pajamas",
                return_reason="Wrong size",
                customer_description="These pajamas are too tight. Requesting exchange.",
                requested_resolution="REPLACEMENT"
            )
        },
        {
            "name": "Case 3: High Risk Fraud Score alert (Suspicious Sam)",
            "req": ReturnRequestSubmit(
                order_number="ORD-77788",
                product_name="Smart OLED 4K TV",
                return_reason="Defective",
                customer_description="TV does not turn on. Screen is pitch black.",
                requested_resolution="REFUND"
            )
        },
        {
            "name": "Case 4: Order not found error",
            "req": ReturnRequestSubmit(
                order_number="ORD-00000",
                product_name="Some non-existent item",
                return_reason="Changed mind",
                customer_description="Decided I didn't want it.",
                requested_resolution="REFUND"
            )
        },
        {
            "name": "Case 5: Defective product but vague description (requests info)",
            "req": ReturnRequestSubmit(
                order_number="ORD-12345",
                product_name="Premium Leather Running Shoes",
                return_reason="Defective",
                customer_description="broken",
                requested_resolution="REPLACEMENT"
            )
        }
    ]
    
    print("--- STARTING PIPELINE TESTS ---")
    for tc in test_cases:
        print(f"\nRunning: {tc['name']}")
        try:
            res = execute_investigation_pipeline(tc["req"], db)
            print(f"  Decision: {res.decision}")
            print(f"  Risk Level: {res.risk_level} (Score: {res.risk_score})")
            print(f"  Category: {res.category}")
            print(f"  Confidence: {res.confidence}")
            print(f"  Policies Referenced: {res.policy_references}")
            print(f"  Reasoning Summary: {res.reasoning_summary[:120]}...")
            print(f"  Customer Response: {res.customer_response[:120]}...")
        except Exception as e:
            print(f"  Failed: {e}")
            
    db.close()

if __name__ == "__main__":
    run_tests()
