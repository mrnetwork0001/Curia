#!/bin/bash
CURIA_DIR="/opt/curia"
AXL_BIN="/opt/axl/node"
SESSION="curia"
cd "$CURIA_DIR"

tmux kill-session -t "$SESSION" 2>/dev/null || true
sleep 1

echo "🌐 Starting AXL mesh nodes..."
tmux new-session -d -s "$SESSION" -n judge "$AXL_BIN -config $CURIA_DIR/configs/judge.json"
sleep 1
tmux new-window -t "$SESSION" -n prosecutor "$AXL_BIN -config $CURIA_DIR/configs/prosecutor.json"
tmux new-window -t "$SESSION" -n defender   "$AXL_BIN -config $CURIA_DIR/configs/defender.json"
tmux new-window -t "$SESSION" -n juror1     "$AXL_BIN -config $CURIA_DIR/configs/juror1.json"
tmux new-window -t "$SESSION" -n juror2     "$AXL_BIN -config $CURIA_DIR/configs/juror2.json"

echo "  Waiting 5s for mesh to form..."
sleep 5

echo "  Verifying AXL nodes..."
for port in 9002 9012 9022 9032 9042; do
    if curl -sf "http://127.0.0.1:${port}/topology" > /dev/null 2>&1; then
        KEY=$(curl -s "http://127.0.0.1:${port}/topology" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('our_public_key','?')[:16]+'...')" 2>/dev/null)
        echo "  ✓ Port $port — Key: $KEY"
    else
        echo "  ✗ Port $port — NOT READY"
    fi
done

echo "🖥️  Starting Curia API server..."
tmux new-window -t "$SESSION" -n api "cd $CURIA_DIR && $CURIA_DIR/venv/bin/python -m uvicorn server.main:app --host 0.0.0.0 --port 8000"
sleep 3

echo ""
echo "================================================================"
echo "⚖️  Curia running! (Real AXL P2P — 5 separate nodes)"
echo "   API:      http://38.49.216.120:8000"
echo "   Topology: http://38.49.216.120:8000/api/topology"
echo "   Attach:   tmux attach -t curia"
echo "================================================================"
