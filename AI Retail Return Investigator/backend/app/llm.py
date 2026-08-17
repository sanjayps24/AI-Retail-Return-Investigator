import json
from typing import Dict, Any, List
from app.config import settings
from app.schemas import LLMStructuredOutput

class BaseLLMProvider:
    def generate_investigation(
        self,
        request_data: Dict[str, Any],
        retrieved_policies: List[Dict[str, Any]],
        rules_triggered: Dict[str, Any]
    ) -> LLMStructuredOutput:
        raise NotImplementedError

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name
        
    def generate_investigation(
        self,
        request_data: Dict[str, Any],
        retrieved_policies: List[Dict[str, Any]],
        rules_triggered: Dict[str, Any]
    ) -> LLMStructuredOutput:
        # Import dynamically to avoid errors if packages aren't loaded in mock mode
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=self.api_key)
        
        prompt = f"""
        You are an AI Retail Return Investigator. Analyze this customer return request.
        
        CUSTOMER REQUEST:
        - Order ID: {request_data.get('order_number')}
        - Product Name: {request_data.get('product_name')}
        - Purchase Date: {request_data.get('purchase_date')}
        - Return Reason: {request_data.get('return_reason')}
        - Customer Description: {request_data.get('customer_description')}
        - Requested Resolution: {request_data.get('requested_resolution')}
        
        RETRIEVED COMPANY POLICIES:
        {json.dumps(retrieved_policies, indent=2)}
        
        DETERMINISTIC BUSINESS RULES EVALUATION:
        {json.dumps(rules_triggered, indent=2)}
        
        Decide on the request based on these guidelines:
        1. APPROVE if return reason and description are valid, request meets policy conditions, and risk is low.
        2. REJECT if policies are violated (e.g. return window expired, product category excluded, damage by customer).
        3. REQUEST_INFORMATION if critical detail is missing (e.g. customer claims broken but gives no detail, need photos).
        4. MANUAL_REVIEW if there's high risk score, suspicious activity flags, or logic is complex.
        
        Be sure to output the response matching the required structured output schema.
        """
        
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=LLMStructuredOutput,
                temperature=0.1,
            )
        )
        
        return LLMStructuredOutput.model_validate_json(response.text)

class MockProvider(BaseLLMProvider):
    def generate_investigation(
        self,
        request_data: Dict[str, Any],
        retrieved_policies: List[Dict[str, Any]],
        rules_triggered: Dict[str, Any]
    ) -> LLMStructuredOutput:
        # Generate smart mock outputs based on input characteristics to act realistically
        reason = request_data.get("return_reason", "").lower()
        desc = request_data.get("customer_description", "").lower()
        order_num = request_data.get("order_number", "")
        
        decision = "APPROVE"
        confidence = 0.92
        category = "Standard Return"
        risk_score = 15.0
        risk_level = "LOW"
        missing_info = ""
        reasoning = "The return request is fully valid. Order verification passed, items are within the policy return window, and no suspicious flags were detected."
        customer_resp = f"Hello, we have approved your return request for the {request_data.get('product_name')}. We've sent a return shipping label to your email."
        recommended_action = "Generate return shipping label and process refund upon item receipt."
        
        # Scenario 1: High return history / Fraud risk
        if rules_triggered.get("fraud_risk_score", 0) >= 60:
            decision = "MANUAL_REVIEW"
            confidence = 0.90
            category = "High Risk Account Activity"
            risk_score = rules_triggered.get("fraud_risk_score")
            risk_level = "HIGH"
            reasoning = "This account has triggered multiple return frequency flags. High velocity of recent returns indicates potential return fraud/abuse."
            customer_resp = "Your return request has been received and is currently being processed by our customer experience review team. We will get back to you within 24-48 hours."
            recommended_action = "Route to internal security team for audit."
            
        # Scenario 2: Return window expired
        elif rules_triggered.get("return_window_expired"):
            decision = "REJECT"
            confidence = 0.98
            category = "Policy Violation: Expired Window"
            risk_score = 45.0
            risk_level = "MEDIUM"
            reasoning = "The return request was submitted after the allowed policy return window. According to company policy, items must be returned within the allowed timeframe."
            customer_resp = "We are unable to accept this return as the return window has expired."
            recommended_action = "Reject return request and close ticket."
            
        # Scenario 3: Defective item but vague details
        elif "broken" in reason or "defective" in reason or "damaged" in reason:
            category = "Defective/Damaged Item"
            if len(desc) < 15:
                decision = "REQUEST_INFORMATION"
                confidence = 0.85
                risk_score = 25.0
                risk_level = "LOW"
                missing_info = "Clear photos of the defect and damage."
                reasoning = "Customer claims the item is damaged or defective, but provided insufficient description. Additional information is required."
                customer_resp = "We are sorry to hear that your item is damaged. Could you please provide photos of the damage so we can proceed?"
                recommended_action = "Suspend approval and request product defect photos."
                
        # Scenario 4: Buyer remorse on clearance/special items
        elif "wrong size" in reason or "changed mind" in reason:
            category = "Buyer Remorse"
            if "clearance" in desc or "sale" in desc:
                decision = "REJECT"
                confidence = 0.95
                risk_score = 30.0
                risk_level = "LOW"
                reasoning = "Items marked as clearance or purchased on final sale are non-returnable under company policy."
                customer_resp = "Unfortunately, we do not accept returns for items bought on clearance or final sale."
                recommended_action = "Reject request based on clearance policy."

        return LLMStructuredOutput(
            decision=decision,
            confidence=confidence,
            category=category,
            risk_score=risk_score,
            risk_level=risk_level,
            policy_references=[p["code"] for p in retrieved_policies],
            reasoning_summary=reasoning,
            missing_information=missing_info,
            recommended_action=recommended_action,
            customer_response=customer_resp
        )

def get_llm_provider() -> BaseLLMProvider:
    if settings.LLM_PROVIDER.lower() == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model_name=settings.GEMINI_MODEL)
    return MockProvider()
