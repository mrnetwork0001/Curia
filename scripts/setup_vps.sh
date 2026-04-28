#!/bin/bash
# =============================================================
# Curia VPS Setup — Installs AXL + Deploys Full Stack
# Run as root on: 38.49.216.120
# Usage: bash setup_vps.sh
# =============================================================

set -e

VPS_IP="38.49.216.120"
CURIA_DIR="/opt/curia"
AXL_DIR="/opt/axl"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
info() { echo -e "${BLUE}→${NC}  $1"; }
err()  { echo -e "${RED}✗${NC}  $1"; exit 1; }

echo ""
echo "⚖️  Curia VPS Setup — Decentralized AI Arbitration Protocol"
echo "============================================================"
echo ""

# ---------------------------------------------------------------
# 1. System packages
# ---------------------------------------------------------------
info "Installing system packages..."
apt-get update -qq
apt-get install -y -qq git python3 python3-pip python3-venv tmux openssl curl wget build-essential
log "System packages ready"

# ---------------------------------------------------------------
# 2. Go installation (try apt first, fall back to manual)
# ---------------------------------------------------------------
info "Checking Go installation..."
if ! command -v go &>/dev/null; then
    info "Installing Go via apt..."
    apt-get install -y -qq golang-go 2>/dev/null || true
fi

if ! command -v go &>/dev/null; then
    info "Apt Go not found — installing Go 1.24.2 manually..."
    wget -q "https://go.dev/dl/go1.24.2.linux-amd64.tar.gz" -O /tmp/go.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz
    export PATH=$PATH:/usr/local/go/bin
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /root/.bashrc
fi

export PATH=$PATH:/usr/local/go/bin
GO_VER=$(go version 2>/dev/null | awk '{print $3}')
log "Go version: $GO_VER"

# ---------------------------------------------------------------
# 3. Clone and build AXL binary
# ---------------------------------------------------------------
if [ -f "$AXL_DIR/node" ]; then
    log "AXL binary already built at $AXL_DIR/node"
else
    info "Cloning AXL repository..."
    rm -rf "$AXL_DIR"
    git clone --depth=1 https://github.com/gensyn-ai/axl.git "$AXL_DIR"

    info "Building AXL binary (this may take 2-3 minutes)..."
    cd "$AXL_DIR"
    # Try with GOTOOLCHAIN env var to handle Go 1.26 + gvisor compatibility
    GOTOOLCHAIN=go1.25.5 go build -o node ./cmd/node/ 2>/dev/null || \
    go build -o node ./cmd/node/ || \
    err "Failed to build AXL binary. Check Go version."

    log "AXL binary built: $(du -sh $AXL_DIR/node | cut -f1)"
fi

# ---------------------------------------------------------------
# 4. Clone Curia project
# ---------------------------------------------------------------
if [ -d "$CURIA_DIR/.git" ]; then
    info "Updating existing Curia installation..."
    cd "$CURIA_DIR" && git pull
else
    info "Cloning Curia project..."
    git clone https://github.com/mrnetwork0001/Curia.git "$CURIA_DIR"
fi
log "Curia project ready at $CURIA_DIR"

# ---------------------------------------------------------------
# 5. Generate ed25519 keys for each AXL node
# ---------------------------------------------------------------
mkdir -p "$CURIA_DIR/keys"
cd "$CURIA_DIR"

for role in judge prosecutor defender juror1 juror2; do
    if [ ! -f "keys/$role.pem" ]; then
        openssl genpkey -algorithm ed25519 -out "keys/$role.pem" 2>/dev/null
        log "Generated key: keys/$role.pem"
    else
        warn "Key already exists: keys/$role.pem (skipping)"
    fi
done

# ---------------------------------------------------------------
# 6. Write AXL node configs (all on localhost, judge is bootstrap)
# ---------------------------------------------------------------
info "Writing AXL node configs..."

cat > "$CURIA_DIR/configs/judge.json" << 'EOF'
{
  "PrivateKeyPath": "/opt/curia/keys/judge.pem",
  "Listen": ["tls://0.0.0.0:9001"],
  "Peers": [],
  "api_port": 9002,
  "bridge_addr": "127.0.0.1",
  "tcp_port": 7000,
  "max_message_size": 16777216
}
EOF

cat > "$CURIA_DIR/configs/prosecutor.json" << 'EOF'
{
  "PrivateKeyPath": "/opt/curia/keys/prosecutor.pem",
  "Listen": ["tls://0.0.0.0:9011"],
  "Peers": ["tls://127.0.0.1:9001"],
  "api_port": 9012,
  "bridge_addr": "127.0.0.1",
  "tcp_port": 7010,
  "max_message_size": 16777216
}
EOF

cat > "$CURIA_DIR/configs/defender.json" << 'EOF'
{
  "PrivateKeyPath": "/opt/curia/keys/defender.pem",
  "Listen": ["tls://0.0.0.0:9021"],
  "Peers": ["tls://127.0.0.1:9001"],
  "api_port": 9022,
  "bridge_addr": "127.0.0.1",
  "tcp_port": 7020,
  "max_message_size": 16777216
}
EOF

cat > "$CURIA_DIR/configs/juror1.json" << 'EOF'
{
  "PrivateKeyPath": "/opt/curia/keys/juror1.pem",
  "Listen": ["tls://0.0.0.0:9031"],
  "Peers": ["tls://127.0.0.1:9001"],
  "api_port": 9032,
  "bridge_addr": "127.0.0.1",
  "tcp_port": 7030,
  "max_message_size": 16777216
}
EOF

cat > "$CURIA_DIR/configs/juror2.json" << 'EOF'
{
  "PrivateKeyPath": "/opt/curia/keys/juror2.pem",
  "Listen": ["tls://0.0.0.0:9041"],
  "Peers": ["tls://127.0.0.1:9001"],
  "api_port": 9042,
  "bridge_addr": "127.0.0.1",
  "tcp_port": 7040,
  "max_message_size": 16777216
}
EOF
log "AXL configs written"

# ---------------------------------------------------------------
# 7. Write .env (EDIT YOUR API KEY BELOW BEFORE RUNNING)
# ---------------------------------------------------------------
cat > "$CURIA_DIR/.env" << EOF
LLM_PROVIDER=openai
OPENAI_API_KEY=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
LLM_MODEL=gpt-4o-mini
SIMULATION_MODE=false
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URL=http://${VPS_IP}:3000
EOF
log ".env written (SIMULATION_MODE=false)"

# ---------------------------------------------------------------
# 8. Install Python dependencies
# ---------------------------------------------------------------
info "Installing Python dependencies..."
cd "$CURIA_DIR"
pip3 install -q -r requirements.txt
# Ensure correct openai version
pip3 install -q "openai>=2.0.0"
log "Python deps installed"

# ---------------------------------------------------------------
# 9. Open firewall ports (ufw if available)
# ---------------------------------------------------------------
if command -v ufw &>/dev/null; then
    info "Configuring firewall..."
    ufw allow 8000/tcp comment "Curia API" 2>/dev/null || true
    ufw allow 9001/tcp comment "AXL Judge listen" 2>/dev/null || true
    ufw allow 9011/tcp comment "AXL Prosecutor listen" 2>/dev/null || true
    ufw allow 9021/tcp comment "AXL Defender listen" 2>/dev/null || true
    ufw allow 9031/tcp comment "AXL Juror1 listen" 2>/dev/null || true
    ufw allow 9041/tcp comment "AXL Juror2 listen" 2>/dev/null || true
    log "Firewall ports opened"
fi

# ---------------------------------------------------------------
# 10. Write the start script
# ---------------------------------------------------------------
cat > "$CURIA_DIR/scripts/start_curia.sh" << 'STARTSCRIPT'
#!/bin/bash
# Starts all 5 AXL nodes + FastAPI server in a tmux session named "curia"
# Usage: bash /opt/curia/scripts/start_curia.sh

CURIA_DIR="/opt/curia"
AXL_BIN="/opt/axl/node"
SESSION="curia"

cd "$CURIA_DIR"

# Kill any existing session
tmux kill-session -t "$SESSION" 2>/dev/null || true
sleep 1

echo "🌐 Starting AXL mesh nodes..."

# Window 0: Judge AXL node (bootstrap)
tmux new-session -d -s "$SESSION" -n judge "$AXL_BIN -config $CURIA_DIR/configs/judge.json"

sleep 1  # Let judge start first so others can peer to it

# Windows 1-4: Other AXL nodes
for role in prosecutor defender juror1 juror2; do
    tmux new-window -t "$SESSION" -n "$role" "$AXL_BIN -config $CURIA_DIR/configs/${role}.json"
    sleep 0.5
done

echo "  Waiting 4s for AXL mesh to form..."
sleep 4

# Verify all nodes are up
echo "  Verifying AXL nodes..."
for port in 9002 9012 9022 9032 9042; do
    if curl -sf "http://127.0.0.1:${port}/topology" > /dev/null 2>&1; then
        KEY=$(curl -s "http://127.0.0.1:${port}/topology" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('our_public_key','?')[:16]+'...')" 2>/dev/null)
        echo "    ✓ Port $port — Key: $KEY"
    else
        echo "    ✗ Port $port — NOT READY"
    fi
done

# Window 5: FastAPI server
echo "🖥️  Starting Curia API server..."
tmux new-window -t "$SESSION" -n api "cd $CURIA_DIR && python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8000"
sleep 3

echo ""
echo "============================================================"
echo "⚖️  Curia is running! (Session: tmux attach -t curia)"
echo ""
echo "  API:       http://$(hostname -I | awk '{print $1}'):8000"
echo "  API Docs:  http://$(hostname -I | awk '{print $1}'):8000/docs"
echo "  WebSocket: ws://$(hostname -I | awk '{print $1}'):8000/ws"
echo "  Health:    http://$(hostname -I | awk '{print $1}'):8000/api/health"
echo ""
echo "  tmux windows:"
echo "    curia:judge      — Judge AXL node (port 9002)"
echo "    curia:prosecutor — Prosecutor AXL node (port 9012)"
echo "    curia:defender   — Defender AXL node (port 9022)"
echo "    curia:juror1     — Juror1 AXL node (port 9032)"
echo "    curia:juror2     — Juror2 AXL node (port 9042)"
echo "    curia:api        — FastAPI server (port 8000)"
echo ""
echo "  To view a window: tmux select-window -t curia:<name>"
echo "  To attach:        tmux attach -t curia"
echo "============================================================"
STARTSCRIPT

chmod +x "$CURIA_DIR/scripts/start_curia.sh"

# ---------------------------------------------------------------
# Done!
# ---------------------------------------------------------------
echo ""
echo "============================================================"
log "Setup complete! To start Curia:"
echo ""
echo "    bash /opt/curia/scripts/start_curia.sh"
echo ""
echo "Then on your Windows machine, restart the Next.js frontend:"
echo "    (it already points to http://38.49.216.120:8000)"
echo ""
echo "Disk used:"
du -sh /opt/axl /opt/curia --exclude /opt/curia/.git 2>/dev/null | sort -h
echo "============================================================"
