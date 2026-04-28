# ⚖️ Curia — Decentralized AI Arbitration Protocol

> **Decentralized Justice, No Central Authority**

Curia is a multi-agent AI arbitration system where independent AI agents with distinct legal roles (Judge, Prosecution, Defense, Jury) communicate **peer-to-peer over [AXL](https://github.com/gensyn-ai/axl)** to deliberate on disputes and reach consensus verdicts — **without any central coordinator**.

Built for the **Gensyn AXL Hackathon**.

---

## 🏗️ Architecture

```
                            ┌─────────────────────────────────────┐
                            │        Next.js Dashboard            │
                            │   (Courtroom • Cases • Network)     │
                            └──────────────┬──────────────────────┘
                                           │ WebSocket + REST
                            ┌──────────────┴──────────────────────┐
                            │        FastAPI Server (:8000)        │
                            │   (Trial orchestration + state)      │
                            └──────────────┬──────────────────────┘
                                           │
              ┌────────────┬───────────────┼───────────────┬────────────┐
              │            │               │               │            │
        ┌─────┴─────┐ ┌───┴────┐   ┌──────┴──────┐  ┌────┴───┐  ┌────┴───┐
        │   Judge   │ │Prosecutor│  │  Defender   │  │ Juror1 │  │ Juror2 │
        │ AXL:9002  │ │AXL:9012 │  │  AXL:9022   │  │AXL:9032│  │AXL:9042│
        └─────┬─────┘ └───┬────┘   └──────┬──────┘  └────┬───┘  └────┬───┘
              │            │               │               │            │
              └────────────┴───────────────┴───────────────┴────────────┘
                                    AXL P2P Mesh
                              (Yggdrasil overlay network)
```

### 5 Agents, 5 AXL Nodes, Zero Central Coordinator

| Agent | Role | AXL Port | Behavior |
|-------|------|----------|----------|
| **Judge** | Chief Justice | 9002 | Orchestrates trial, rules on objections, delivers verdict |
| **Prosecutor** | Lead Prosecutor | 9012 | Argues FOR the plaintiff, cross-examines defense |
| **Defender** | Defense Counsel | 9022 | Argues AGAINST the claim, counters prosecution |
| **Juror 1** | Independent Evaluator | 9032 | Evaluates evidence, deliberates via encrypted P2P |
| **Juror 2** | Independent Evaluator | 9042 | Evaluates evidence, deliberates via encrypted P2P |

---

## 🔄 Trial Protocol

Every trial proceeds through 8 phases — all communication via AXL `/send` and `/recv`:

```
FILING → OPENING → PROSECUTION → DEFENSE → CROSS-EXAMINATION → REBUTTAL → DELIBERATION → VERDICT
```

1. **Filing** — User submits dispute via the dashboard
2. **Opening** — Judge broadcasts case brief to all agents
3. **Prosecution** — Prosecutor delivers opening argument (broadcast to all)
4. **Defense** — Defender delivers counter-argument (broadcast to all)
5. **Cross-Examination** — Prosecutor questions Defender P2P; Defender responds
6. **Rebuttal** — Both sides deliver closing arguments
7. **Deliberation** — Jurors exchange analysis via **private P2P channel** (encrypted, hidden from others)
8. **Verdict** — Jurors send sealed votes to Judge; Judge announces reasoned final verdict

### AXL Integration Highlights

- **Every message** uses AXL `/send` and `/recv` — no HTTP between agents
- **Jury deliberation** is P2P-only between juror nodes — demonstrating AXL's encrypted private channels
- **Topology** from `/topology` displayed in real-time on the network dashboard
- **5 separate processes** on 5 separate AXL nodes — true P2P architecture

---

## 🚀 Quick Start

### Option 1: Local Development (Simulation Mode)

No AXL binary needed — agents communicate via in-memory transport:

```bash
# Clone
git clone https://github.com/mrnetwork0001/Curia.git
cd curia

# Backend setup
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start API server
python -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal — Frontend
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000** → Go to **Cases** → Start a trial.

### Option 2: Docker (One-Click)

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=sk-xxx

# Start everything
docker-compose up --build
```

### Option 3: Full AXL Setup (VPS/Production)

```bash
# 1. Build AXL
git clone https://github.com/gensyn-ai/axl.git
cd axl && make build && cd ..

# 2. Generate keys
python scripts/generate_keys.py

# 3. Start all services
./scripts/start_all.sh
```

---

## 📁 Project Structure

```
Curia/
├── agents/                     # Python agent implementations
│   ├── base_agent.py          # Base class: AXL communication + simulation transport
│   ├── judge.py               # Judge agent — orchestrates trial, delivers verdict
│   ├── prosecutor.py          # Prosecutor — argues for plaintiff
│   ├── defender.py            # Defender — counters prosecution
│   ├── juror.py               # Juror — deliberates P2P, votes
│   ├── llm.py                 # LLM abstraction (OpenAI/Anthropic/Ollama/Mock)
│   ├── protocol.py            # Message schema, phase management
│   └── config.py              # Port mappings, role configs
├── orchestrator/               # Trial lifecycle management
│   ├── court.py               # CourtSession — manages all 5 agents
│   └── dispute_loader.py      # Loads sample cases
├── server/                     # FastAPI backend
│   ├── main.py                # App + WebSocket endpoint
│   ├── routes.py              # REST API endpoints
│   └── state.py               # WebSocket connection manager
├── frontend/                   # Next.js 14 dashboard
│   ├── app/                   # App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── court/page.tsx     # Live courtroom view ⭐
│   │   ├── cases/page.tsx     # Case listing + submission
│   │   └── network/page.tsx   # AXL topology visualization
│   ├── components/            # React components
│   └── lib/                   # API client, WebSocket hook, types
├── configs/                    # 5 AXL node config files
├── sample_cases/               # 3 pre-loaded example disputes
├── scripts/                    # Setup and start scripts
├── docker-compose.yml          # One-click deployment
└── README.md
```

---

## 🎨 Frontend

- **Dark courtroom aesthetic** — charcoal backgrounds with gold accents
- **Glassmorphism panels** — `backdrop-filter: blur(16px)` with subtle borders
- **Typography** — Playfair Display (serif headers = authority) + Inter (body)
- **Role-coded messages** — Gold (Judge), Red (Prosecutor), Blue (Defender), Green (Jurors)
- **Encrypted indicators** — Jury deliberation shows `[ENCRYPTED — Private Juror Channel]`
- **Verdict reveal** — dramatic animation when the final verdict drops
- **Network visualization** — canvas-based pentagon mesh with particle animations

---

## 🤖 LLM Configuration

Agents use an LLM to generate legal arguments. Configure in `.env`:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
LLM_MODEL=gpt-4o-mini
```

**Supported providers**: OpenAI, Anthropic, Ollama (local), Mock (for testing without API keys)

---

## 📋 Hackathon Requirements

| # | Requirement | ✅ How Met |
|---|---|---|
| 1 | Must use AXL for inter-agent communication | Every agent message uses `/send` + `/recv` |
| 2 | Separate AXL nodes | 5 nodes with unique ports + keys |
| 3 | No centralized message broker | Zero central server — all coordination via P2P |
| 4 | Built during hackathon | ✅ |

---

## 📜 License

MIT — see [LICENSE](./LICENSE)
