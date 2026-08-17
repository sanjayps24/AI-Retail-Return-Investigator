from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    purchase_date = Column(DateTime, nullable=False)
    product_name = Column(String, nullable=False)
    product_category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    status = Column(String, default="DELIVERED")  # DELIVERED, RETURNED, CANCELLED

class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    return_window_days = Column(Integer, nullable=True)

class InvestigationResult(Base):
    __tablename__ = "investigations"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    purchase_date = Column(String, nullable=True)
    return_reason = Column(String, nullable=False)
    customer_description = Column(Text, nullable=False)
    requested_resolution = Column(String, nullable=False)
    
    # Decisions output
    decision = Column(String, nullable=False)  # APPROVE, REJECT, REQUEST_INFORMATION, MANUAL_REVIEW
    confidence = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    policy_references = Column(JSON, nullable=True)
    reasoning_summary = Column(Text, nullable=False)
    missing_information = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=False)
    customer_response = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=func.now())
