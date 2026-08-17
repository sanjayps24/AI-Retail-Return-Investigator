from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db, engine, Base
from app.schemas import ReturnRequestSubmit, InvestigationResponse, OrderSchema, PolicySchema
from app.models import Order, Policy, InvestigationResult
from app.investigator import execute_investigation_pipeline

# Initialize database schemas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Retail Return Investigator API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "app": "AI Retail Return Investigator"}

@app.post("/api/investigate", response_model=InvestigationResponse)
def submit_investigation(request: ReturnRequestSubmit, db: Session = Depends(get_db)):
    try:
        result = execute_investigation_pipeline(request, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/investigations", response_model=List[InvestigationResponse])
def get_investigations(db: Session = Depends(get_db)):
    return db.query(InvestigationResult).order_by(InvestigationResult.created_at.desc()).all()

@app.get("/api/orders", response_model=List[OrderSchema])
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

@app.get("/api/policies", response_model=List[PolicySchema])
def get_policies(db: Session = Depends(get_db)):
    return db.query(Policy).all()

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    investigations = db.query(InvestigationResult).all()
    orders = db.query(Order).all()
    
    total = len(investigations)
    decisions = {"APPROVE": 0, "REJECT": 0, "REQUEST_INFORMATION": 0, "MANUAL_REVIEW": 0}
    risks = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    categories = {}
    total_confidence = 0.0
    
    for inv in investigations:
        decisions[inv.decision] = decisions.get(inv.decision, 0) + 1
        risks[inv.risk_level] = risks.get(inv.risk_level, 0) + 1
        categories[inv.category] = categories.get(inv.category, 0) + 1
        total_confidence += inv.confidence
        
    avg_confidence = (total_confidence / total) if total > 0 else 0.0
    
    return {
        "total_requests": total,
        "total_orders": len(orders),
        "decisions": decisions,
        "risks": risks,
        "categories": categories,
        "avg_confidence": round(avg_confidence, 2)
    }
