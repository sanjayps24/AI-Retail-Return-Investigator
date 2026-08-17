# AI Retail Return Investigator Start Helper
# Run this script to spin up both servers!

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Starting AI Retail Return Investigator" -ForegroundColor Indigo
Write-Host "=============================================" -ForegroundColor Cyan

# Start Backend Server
Write-Host "[1/2] Launching FastAPI backend server on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python seed_data.py; uvicorn app.main:app --host 0.0.0.0 --port 8000"

# Wait for backend initialization
Start-Sleep -Seconds 3

# Start Frontend Dev Server
Write-Host "[2/2] Launching Vite React frontend server on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --port 5173 --host 0.0.0.0"

Write-Host "---------------------------------------------" -ForegroundColor Gray
Write-Host "Both servers are launching in background shell windows." -ForegroundColor Green
Write-Host "Backend API:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Dashboard UI:   http://localhost:5173/" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
