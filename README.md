#  Curia - Decentralized AI Arbitration Protocol

<img width="1459" height="713" alt="28 04 2026_16 41 15_REC" src="https://github.com/user-attachments/assets/800faf73-112b-46b9-9b3f-aa0c615fcf9d" />


> **Decentralized Justice, No Central Authority. Powered by Gensyn AXL.**

 **[Watch the 4-Minute Demo Video Here](https://youtube.com/link-to-your-video)**

**Curia** is a multi-agent AI arbitration system designed to resolve complex real-world disputes in minutes. By utilizing independent AI agents with distinct legal roles (Judge, Prosecution, Defense, Jury) communicating **strictly peer-to-peer over the [Gensyn AXL](https://github.com/gensyn-ai/axl)** mesh network, Curia achieves consensus verdicts **without relying on any central coordinating server.** 

Built exclusively for the **Gensyn AXL Hackathon**, Curia proves that sophisticated, adversarial AI reasoning can be executed entirely over a decentralized, encrypted peer-to-peer network.

---

##  Why Curia Wins

Current AI systems operate as black boxes, making them dangerous for dispute resolution. Curia solves this by forcing AI agents into a rigid, adversarial legal protocol. 

By heavily utilizing the **Gensyn AXL network**, Curia achieves what traditional APIs cannot:
1. **Unfakeable Decentralization:** 5 fully independent agents, running on 5 separate AXL nodes, with unique `ed25519` cryptographic keys. No single "god script" dictates the trial.
2. **Encrypted Private Channels:** Jurors deliberate in absolute secrecy. Because AXL enforces end-to-end encryption based on recipient public keys, the Jurors can freely share their analysis without the Judge, Defense, or Prosecution spying on the packets.
3. **True P2P Network Topology:** The system forms a resilient mesh network (via Yggdrasil overlay) allowing any agent to broadcast, cross-examine, and rule seamlessly. 
4. **Premium Visualization:** A gorgeous Next.js dashboard visualizes the live AXL mesh topology and trial transcripts in real-time.

---

##  AI Attribution & Spec-Driven Development

In strict compliance with hackathon rules, we are completely transparent about our use of AI:
- **AI Agents**: The core logic of Curia is driven by 5 autonomous LLM instances executing role-based behaviors (Judge, Prosecutor, Defender, Jurors).
- **AI Coding Assistants**: We utilized AI coding tools (Claude/Copilot) to accelerate the development of boilerplate UI components and the Python WebSocket integration.
- **Spec-Driven Workflow**: Curia was developed using a rigorous spec-driven workflow. You can view our complete architectural spec, planning artifacts, and agent prompts in the [neuralcourt_master_prompt.md](./neuralcourt_master_prompt.md) file included in this repository. All code and assets were generated *after* the hackathon officially began.

---

##  Architecture & Network Flow

```text
                            ┌─────────────────────────────────────┐
                            │        Next.js Dashboard            │
                            │   (Courtroom • Cases • Network)     │
                            └──────────────┬──────────────────────┘
                                           │ WebSocket + REST Stream
                            ┌──────────────┴──────────────────────┐
                            │        FastAPI Server               │
                            │   (UI Bridge: Only Observes)        │
                            └──────────────┬──────────────────────┘
                                           │
              ┌────────────┬───────────────┼───────────────┬────────────┐
              │            │               │               │            │
        ┌─────┴─────┐ ┌───┴────┐   ┌──────┴──────┐  ┌────┴───┐  ┌────┴───┐
        │   JUDGE   │ │PROSECUTOR │  │  DEFENDER   │  │ JUROR 1│  │ JUROR 2│
        │ AXL:9002  │ │ AXL:9012  │  │  AXL:9022   │  │AXL:9032│  │AXL:9042│
        └─────┬─────┘ └───┬────┘   └──────┬──────┘  └────┬───┘  └────┬───┘
              │            │               │               │            │
              └────────────┴───────────────┴───────────────┴────────────┘
                            GENSYN AXL P2P ENCRYPTED MESH 
```

### 5 Independent Entities, Zero Coordination Servers

| Agent | Role in P2P Mesh | AXL Node Port | Network Behavior |
|-------|------|----------|----------|
| **Judge** | Chief Justice | `9002` | Tracks phase state, broadcasts `PHASE_TRANSITION` to mesh, outputs `FINAL_VERDICT`. |
| **Prosecutor** | Claimant | `9012` | Listens to Judge broadcasts. Sends P2P `QUESTION` directly to Defender. |
| **Defender** | Defense Counsel | `9022` | Counter-argues via broadcast. Responds to direct P2P Prosecution cross-examination. |
| **Juror 1** | Evaluator | `9032` | Uses encrypted P2P channels for private `JURY_ANALYSIS`. |
| **Juror 2** | Evaluator | `9042` | Consults with Juror 1 before transmitting `VERDICT_VOTE` back to Judge. |

---

## The P2P Trial Protocol

Every trial proceeds through a rigorous mathematical sequence. The "API Server" merely observes; the trial is driven purely by agents firing REST `POST` calls to their local AXL `/send` endpoints, addressed to the other agents' cryptographic public keys.

1. **Filing** - Dispute is seeded to the network.
2. **Opening** - Judge broadcasts case brief (`message_type: CASE_BRIEF`).
3. **Prosecution & Defense** - Both sides present arguments.
4. **Cross-Examination (P2P Ping-Pong)** - Prosecutor fires direct `QUESTION` payloads to Defender. Defender fires back `ANSWER` payloads. 
5. **Rebuttal** - Closing arguments are broadcast.
6. **Deliberation (Encrypted Secret P2P)** - Jurors exchange analysis via private AXL channels, hidden from all others.
7. **Verdict** - Jurors transmit sealed cryptographic votes to the Judge. The Judge calculates consensus and outputs the verdict.

---

## Live Demo / Setup

The backend has been heavily battle-tested on a live Debian VPS, establishing a true overlay network. 

### Quick Local Deployment

If you are a judge running this locally to grade the application:

```bash
# 1. Clone repository
git clone https://github.com/mrnetwork0001/Curia.git
cd Curia

# 2. Start all 5 AXL Nodes, Python backend, and Frontend with Docker
export OPENAI_API_KEY="your-sk-api-key"
docker-compose up --build
```
> Wait approximately 10 seconds for all 5 AXL nodes to initialize and form the mesh.
> Go to **http://localhost:3000** 
> * Navigate to **Network** to verify the AXL nodes have successfully performed peer discovery.
> * Navigate to **Cases**, pick a sample case, and click **Start Trial**.

### Production VPS Scripts
For production, the `/scripts` directory contains everything needed to spin up an automated mesh network:
- `scripts/setup_vps.sh`: End-to-end Debian deployment script. Installs Go, compiles Gensyn AXL, creates Python venvs, bypasses PEP668, sets up tmux sessions, and mounts ports.
- `scripts/start_curia.sh`: Automates the spinning up of 5 distinct AXL processes via multiplexing, binds their identities, and initiates peer handshake discovery.

---

## Frontend

- **Dark courtroom aesthetic** - charcoal backgrounds with gold accents
- **Glassmorphism panels** - `backdrop-filter: blur(16px)` with subtle borders
- **Typography & Markdown** - dynamic real-time parsing of LLM-generated typography (bolding/formatting) into clean UI elements. Playfair Display (serif headers = authority) + Inter (body).
- **Native PDF Export** - one-click generation of beautifully formatted, watermarked PDF verdicts for official records using native browser printing APIs.
- **Role-coded messages** - Gold (Judge), Red (Prosecutor), Blue (Defender), Green (Jurors)
- **Encrypted indicators** - Jury deliberation shows `[ENCRYPTED - Private Juror Channel]`
- **Verdict reveal** - dramatic animation when the final verdict drops
- **Network visualization** - canvas-based pentagon mesh with particle animations

---

## Alignment with Gensyn Judging Criteria

1. **Meaningful Use of AXL (Max Points):** Curia doesn’t just use AXL as a simple message queue. It uses **broadcasts** for public court records, **point-to-point** for cross-examination, and relies heavily on AXL's **inherent encryption** for secret jury deliberation. Without AXL, this architecture would require complex central databases and permission layers.
2. **Technical Complexity:** Managing state across 5 independent processes communicating asynchronously over an unreliable overlay mesh network is deeply complex. Curia implements a resilient event-cascade, and uses a dual WebSocket + REST polling frontend strategy to ensure network latency never drops the UI state.
3. **UI/UX Aesthetics:** The dashboard is built with Next.js 14, employing a premium, glassmorphic dark-mode design (charcoal & gold). The live courtroom transcript, status trackers, and live particle-mesh topology viewer are designed to WOW end-users.
4. **Real World Utility:** Decentralized Autonomous Organizations (DAOs), smart contracts, and web3 communities currently have zero reliable, decentralized arbitration mechanisms for subjective disputes. Curia proves AI can solve this trustlessly.

---

## License
MIT License. Built for the Gensyn AXL Hackathon 2026.
