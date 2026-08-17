# AI Retail Return Investigator

An educational, AI-powered retail return and refund investigation system designed to combine probabilistic LLM reasoning with deterministic business rules and RAG-retrieved policy documents.

---

## 1. Project Overview & Problem Statement

### Problem Statement
In retail commerce, return fraud and policy abuse account for billions of dollars in losses annually. Customer support agents are forced to manually review claims, verify order dates, cross-reference complex, category-specific return windows, and evaluate historical return velocities. This manual process is slow, error-prone, and inconsistent.

While Large Language Models (LLMs) excel at extracting intent and drafting customer replies, they cannot be blindly trusted to make financial decision approvals due to hallucination risks, inability to check database records reliably, and safety concerns.

### Solution
**AI Retail Return Investigator** provides a hybrid decision architecture:
- **Deterministic Business Rules**: Verifies order presence, validates purchase windows, and checks return frequencies.
- **RAG-Retrieved Policies**: Matches items dynamically against product category rules.
- **Probabilistic LLM**: Extracts context-aware sentiments, determines return categories, and drafts polite, personalized customer replies.
- **Decision Validation**: Enforces hard programmatic overrides that override LLM decisions in case of policy violations (e.g. expired return window or order mismatch).

---

## 2. Features

- **Automated Claims Investigation**: Validates claim details against live database orders.
- **Hybrid Decision Engine**: Integrates LLM structured outputs with deterministic database safeguards.
- **RAG Knowledge Base**: Retrieves contextual return parameters (e.g. electronics restocking fees, clothing hygiene criteria).
- **Security & Fraud Evaluation**: Analyzes customer velocity metrics and transaction value to calculate a fraud risk score.
- **Professional Dashboard**: Dark-mode glassmorphic workspace featuring tabs for dashboard analytics, claim submissions, audit trails, and policy lookup.
- **Safety-First Sandbox Design**: Built strictly for educational simulation using synthetic datasets. It does not initiate actual banking API actions or card refunds.

---

## 3. Architecture & AI Pipeline

For visual sequence diagrams, see [`docs/architecture.md`](docs/architecture.md).

### Core Workflow
1. **Customer Request**: Submit claim (Order Code, Product Name, Reason, Description, Resolution).
2. **Request Validation**: Programmatic checks on data inputs.
3. **Information Extraction**: Matches claim details to historical orders inside the relational DB.
4. **Policy Retrieval (RAG)**: Keyword and similarity indexes search the Policy database to query matching documents.
5. **Risk Analysis**: Checks recent return rates and product price tiers.
6. **LLM Structured Generation**: Prompts a configured LLM provider (or Mock) to synthesize parameters into a structured JSON schema.
7. **Deterministic Decision Validation**: Ensures the decision does not violate hard corporate policies (e.g., overriding LLM approvals if the purchase date exceeds return windows).
8. **Store Result**: Commits the audit records to SQL database.
9. **Return Response**: Returns full explanation details to client.

---

## 4. Risk Scoring Methodology

The baseline risk score is computed programmatically by checking:
1. **Order Exists**: If order is not found, adds `+40.0` points.
2. **Product Mismatch**: If product requested is not in the order, adds `+35.0` points.
3. **High Return Velocity**: Checks rolling 30-day approved returns for the client. If client has $\ge 3$ past approvals, adds `+15` points per past return (capped at `+50.0`).
4. **High Value Item**: Adds `+15.0` points if price exceeds `$500.0`.

**Risk Classification**:
- **LOW**: Score $< 30$
- **MEDIUM**: Score $30 \le \text{Score} < 60$
- **HIGH**: Score $\ge 60$ (Forces automated recommendation to `MANUAL_REVIEW` status).

---

## 5. API Documentation

### POST `/api/investigate`
Submit a new return request for automated analysis.
- **Request Body**:
```json
{
  "order_number": "ORD-98721",
  "product_name": "UltraSound Wireless Headphones",
  "return_reason": "Defective",
  "customer_description": "Left earbud has static sound.",
  "requested_resolution": "REFUND"
}
```
- **Response**:
```json
{
  "id": 1,
  "order_number": "ORD-98721",
  "product_name": "UltraSound Wireless Headphones",
  "purchase_date": "2026-08-10T00:00:00",
  "return_reason": "Defective",
  "customer_description": "Left earbud has static sound.",
  "requested_resolution": "REFUND",
  "decision": "APPROVE",
  "confidence": 0.92,
  "category": "Defective Product",
  "risk_score": 15.0,
  "risk_level": "LOW",
  "policy_references": ["GENERAL", "ELECTRONICS"],
  "reasoning_summary": "Item returned within 15-day electronics window due to defective hardware. Approved for full refund without restocking fees.",
  "missing_information": "",
  "recommended_action": "Generate prepaid return label and process refund upon receipt.",
  "customer_response": "We have approved your request. We've sent a return shipping label...",
  "created_at": "2026-08-17T11:42:00"
}
```

### GET `/api/analytics`
Fetch high-level statistics for the dashboard panels.
- **Response**:
```json
{
  "total_requests": 5,
  "total_orders": 8,
  "decisions": {
    "APPROVE": 2,
    "REJECT": 2,
    "MANUAL_REVIEW": 1
  },
  "risks": {
    "LOW": 2,
    "MEDIUM": 2,
    "HIGH": 1
  },
  "avg_confidence": 0.91
}
```

---

## 6. Local Setup & Execution

### Environment Variables
Configure these variables in `backend/.env` to swap provider implementations:
```env
LLM_PROVIDER=mock          # Options: "gemini" or "mock"
GEMINI_API_KEY=YOUR_KEY    # Required if LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL=sqlite:///./retail_investigator.db
```

### Manual Execution

1. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Seed and Run Backend**:
   ```bash
   python seed_data.py
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. **Install and Run Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev -- --port 5173
   ```

### Quick-Start (PowerShell)
You can launch both server windows simultaneously using the root launcher:
```powershell
./run.ps1
```

---

## 7. Docker Deployment

To containerize the application, you can build and start the services using Docker:

### `backend/Dockerfile`
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build & Run
```bash
# Build backend image
docker build -t retail-investigator-backend ./backend
# Run backend container
docker run -p 8000:8000 --env-file ./backend/.env retail-investigator-backend
```

---

## 8. Safety & Compliance Controls

> [!IMPORTANT]
> **Scam-Prevention Educational Constraints**:
> 1. This application operates entirely on **synthetic, mock transaction data** (populated via `seed_data.py`).
> 2. It **does not** integrate with real banking payment gateways, card processors, or corporate emails.
> 3. It **does not** click outbound links, initiate automated wire transfers, or collect actual customer credit card credentials.
> 4. All URLs and email description strings are sanitized and evaluated as read-only text blobs.

---

## 9. Testing & Postman Instructions

### Automated Verification
Run the pipeline suite locally:
```bash
cd backend
python test_pipeline.py
```

### Postman Instructions
1. Import the collection or create a new request.
2. Set method to `POST` and URL to `http://localhost:8000/api/investigate`.
3. Go to the **Body** tab, select **raw**, choose **JSON** format, and paste the payload:
   ```json
   {
     "order_number": "ORD-98721",
     "product_name": "UltraSound Wireless Headphones",
     "return_reason": "Defective",
     "customer_description": "Left earbud has static sound.",
     "requested_resolution": "REFUND"
   }
   ```
4. Click **Send** to view the structured analysis output.

---

## 10. Limitations & Future Improvements

### Current Limitations
- **Fallback Keyword RAG**: The current similarity engine is a local TF-IDF overlap model to prevent binary dependency compilation errors on local systems.
- **SQLite Database**: Uses SQLite for single-file configuration; PostgreSQL is supported via setting the `DATABASE_URL` env variable.

### Future Improvements
- **True Vector Store Integration**: Swap RAG lookup to PGVector or ChromaDB for high-dimensional semantic search.
- **Multimodal Defect Verification**: Allow users to upload photos of claims and use Gemini Vision models to inspect physical package damage claims.
- **Expanded Audit History**: Track step-by-step user-agent approvals and adjustments.

