from sqlalchemy.orm import Session
from app.schemas import ReturnRequestSubmit, LLMStructuredOutput
from app.models import InvestigationResult, Order
from app.rag import retrieve_relevant_policies
from app.rules import evaluate_business_rules
from app.llm import get_llm_provider
import json

def execute_investigation_pipeline(
    request: ReturnRequestSubmit,
    db: Session
) -> InvestigationResult:
    """
    Coordinates the core investigation workflow:
    Customer Request -> Validation -> Extraction -> RAG Retrieval -> Risk Analysis -> Rules -> LLM -> DB Storage.
    """
    # 1. & 2. Validation & Info Extraction (Business Rules setup)
    rules_triggered = evaluate_business_rules(
        order_number=request.order_number,
        product_name=request.product_name,
        db=db
    )
    
    # 3. Policy Retrieval via RAG
    # We query policies based on product category & return reason
    search_query = f"{request.product_name} {request.return_reason} {request.customer_description}"
    retrieved_policies = retrieve_relevant_policies(query=search_query, db=db)
    
    # 4. & 5. Risk Analysis & Business Rule Evaluation
    # Determine default decisions based on hard deterministic rules
    hard_override_decision = None
    override_reason = None
    
    if not rules_triggered["order_found"]:
        hard_override_decision = "REJECT"
        override_reason = "Order number could not be found in our records."
    elif rules_triggered["product_mismatch"]:
        hard_override_decision = "MANUAL_REVIEW"
        override_reason = "Product mismatch detected. Submitted return product does not match the product listed in the original order."
    elif rules_triggered["return_window_expired"]:
        # Find if policy retrieved allows exceptions, otherwise hard reject
        # We check retrieved policies to see if return_window_days is set and days_since_purchase exceeds it
        applicable_window = 30
        for policy in retrieved_policies:
            if policy["return_window_days"] is not None:
                applicable_window = policy["return_window_days"]
                break
                
        if rules_triggered["days_since_purchase"] > applicable_window:
            hard_override_decision = "REJECT"
            override_reason = f"Return window of {applicable_window} days has been exceeded (purchase was {rules_triggered['days_since_purchase']} days ago)."
            
    # 6. LLM Decision Generation
    llm_provider = get_llm_provider()
    
    # Prepare standard input details for the LLM
    order_details = rules_triggered.get("order_details") or {}
    purchase_date_str = order_details.get("purchase_date", None)
    
    request_data = {
        "order_number": request.order_number,
        "product_name": request.product_name,
        "purchase_date": purchase_date_str,
        "return_reason": request.return_reason,
        "customer_description": request.customer_description,
        "requested_resolution": request.requested_resolution
    }
    
    # Execute structured generation
    llm_output: LLMStructuredOutput = llm_provider.generate_investigation(
        request_data=request_data,
        retrieved_policies=retrieved_policies,
        rules_triggered=rules_triggered
    )
    
    # 7. Decision Validation (Apply Hard Rules to override LLM if necessary)
    final_decision = llm_output.decision
    reasoning_summary = llm_output.reasoning_summary
    recommended_action = llm_output.recommended_action
    customer_response = llm_output.customer_response
    risk_score = max(llm_output.risk_score, rules_triggered["fraud_risk_score"])
    
    # Clamp risk score
    risk_score = min(risk_score, 100.0)
    final_risk_level = "LOW"
    if risk_score >= 60:
        final_risk_level = "HIGH"
    elif risk_score >= 30:
        final_risk_level = "MEDIUM"
        
    if hard_override_decision:
        final_decision = hard_override_decision
        reasoning_summary = f"[SYSTEM OVERRIDE]: {override_reason} (LLM proposed {llm_output.decision}). Original LLM justification: {llm_output.reasoning_summary}"
        recommended_action = f"System flagged override: {override_reason}"
        if final_decision == "REJECT":
            customer_response = f"Hello. Unfortunately, we are unable to process your return because: {override_reason}"
        else:
            customer_response = "Hello. Your return request requires manual inspection by our claims team. We will update you shortly."
            
    # 8. Store Result in DB
    db_result = InvestigationResult(
        order_number=request.order_number,
        product_name=request.product_name,
        purchase_date=purchase_date_str,
        return_reason=request.return_reason,
        customer_description=request.customer_description,
        requested_resolution=request.requested_resolution,
        decision=final_decision,
        confidence=llm_output.confidence,
        category=llm_output.category,
        risk_score=risk_score,
        risk_level=final_risk_level,
        policy_references=llm_output.policy_references,
        reasoning_summary=reasoning_summary,
        missing_information=llm_output.missing_information,
        recommended_action=recommended_action,
        customer_response=customer_response
    )
    
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    
    return db_result
