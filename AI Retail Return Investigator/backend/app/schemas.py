from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

# Input Schema for return request
class ReturnRequestSubmit(BaseModel):
    order_number: str = Field(..., description="Unique Order Identifier")
    product_name: str = Field(..., description="Name of the product being returned")
    return_reason: str = Field(..., description="E.g. Defective, Wrong Size, Buyer Remorse")
    customer_description: str = Field(..., description="Customer's description of the problem")
    requested_resolution: str = Field(..., description="REFUND, REPLACEMENT, or STORE_CREDIT")

# Schema for Order
class OrderSchema(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_email: str
    purchase_date: datetime
    product_name: str
    product_category: str
    price: float
    status: str

    class Config:
        from_attributes = True

# Schema for Policy
class PolicySchema(BaseModel):
    id: int
    code: str
    title: str
    content: str
    return_window_days: Optional[int] = None

    class Config:
        from_attributes = True

# Structured Output schema from LLM
class LLMStructuredOutput(BaseModel):
    decision: Literal["APPROVE", "REJECT", "REQUEST_INFORMATION", "MANUAL_REVIEW"]
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    category: str = Field(..., description="Return classification category")
    risk_score: float = Field(..., description="Risk score from 0 to 100")
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    policy_references: List[str] = Field(..., description="List of policy codes referenced")
    reasoning_summary: str = Field(..., description="Detailed internal reasoning breakdown")
    missing_information: Optional[str] = Field("", description="Information required from customer if decision is REQUEST_INFORMATION")
    recommended_action: str = Field(..., description="Internal next action step for support agents")
    customer_response: str = Field(..., description="Polite draft response to be sent to the customer")

# Final API response schema matching the DB investigation result
class InvestigationResponse(BaseModel):
    id: int
    order_number: str
    product_name: str
    purchase_date: Optional[str] = None
    return_reason: str
    customer_description: str
    requested_resolution: str
    
    decision: str
    confidence: float
    category: str
    risk_score: float
    risk_level: str
    policy_references: Optional[List[str]] = None
    reasoning_summary: str
    missing_information: Optional[str] = None
    recommended_action: str
    customer_response: str
    created_at: datetime

    class Config:
        from_attributes = True
