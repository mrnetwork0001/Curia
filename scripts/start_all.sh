#!/bin/bash
# ============================================================
# Curia — Start All Services
# Starts 5 AXL nodes, the FastAPI server, and all 5 agents
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
AXL_BIN="${AXL_BIN:-../axl/node}"

cd "$PROJECT_DIR"

echo "⚖️  Starting Curia — Decentralized AI Arbitration Protocol"
echo "============================================================"

# Generate keys if they don't exist
if [ ! -f "keys/judge.pem" ]; then
  echo "🔑 Generating agent keys..."
  python3 scripts/generate_keys.py
fi

# Start AXL nodes (if binary exists)
if [ -f "$AXL_BIN" ]; then
  echo "🌐 Starting AXL mesh nodes..."
  for config in configs/*.json; do
    role=$(basename "$config" .json)
    $AXL_BIN -config "$config" > "logs/axl-${role}.log" 2>&1 &
    echo "  ✓ AXL node: $role (PID: $!)"
  done
  sleep 3  # Wait for mesh to form
else
  echo "⚠️  AXL binary not found at $AXL_BIN"
  echo "   Running in SIMULATION MODE (no real AXL nodes)"
  export SIMULATION_MODE=true
fi

# Start FastAPI server
echo "🖥️  Starting API server..."
mkdir -p logs
python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8000 > logs/api-server.log 2>&1 &
API_PID=$!
echo "  ✓ API server (PID: $API_PID)"
sleep 2

echo ""
echo "============================================================"
echo "⚖️  Curia is running!"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "  WebSocket: ws://localhost:8000/ws"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "============================================================"

# Wait for Ctrl+C
trap "echo '  Stopping...'; kill 0; exit 0" SIGINT SIGTERM
wait
