# ============================================================
# Curia — Start All Services (Windows PowerShell)
# Starts the FastAPI server in simulation mode
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot

Set-Location $ProjectDir

Write-Host ""
Write-Host "  Curia — Decentralized AI Arbitration Protocol" -ForegroundColor Yellow
Write-Host "  ============================================================" -ForegroundColor DarkGray
Write-Host ""

# Ensure .env exists
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  Created .env from .env.example" -ForegroundColor Cyan
    }
}

# Set simulation mode
$env:SIMULATION_MODE = "true"

# Create logs directory
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Start API server
Write-Host "  Starting API server..." -ForegroundColor Cyan
$apiJob = Start-Process -FilePath "python" -ArgumentList "-m uvicorn server.main:app --host 0.0.0.0 --port 8000" -PassThru -NoNewWindow
Write-Host "  API server started (PID: $($apiJob.Id))" -ForegroundColor Green

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor DarkGray
Write-Host "  Curia is running!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  API:       http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  WebSocket: ws://localhost:8000/ws" -ForegroundColor White
Write-Host ""
Write-Host "  Mode: SIMULATION (no AXL nodes required)" -ForegroundColor DarkYellow
Write-Host "  ============================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray

try {
    Wait-Process -Id $apiJob.Id
} catch {
    Write-Host "  Stopping..." -ForegroundColor Red
    Stop-Process -Id $apiJob.Id -Force -ErrorAction SilentlyContinue
}
