"""
Curia API Server — FastAPI application with WebSocket support.
Connects the Next.js frontend to the agent trial system.
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from server.routes import router, set_court
from server.state import manager
from orchestrator.court import CourtSession

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Global court session
court: CourtSession = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the court session on startup."""
    global court

    simulation_mode = os.getenv("SIMULATION_MODE", "true").lower() == "true"
    logger.info(f"Starting Curia server (simulation_mode={simulation_mode})")

    # Set the event loop on the connection manager
    loop = asyncio.get_event_loop()
    manager.set_event_loop(loop)

    # Initialize court session with WebSocket broadcasting
    court = CourtSession(
        simulation_mode=simulation_mode,
        on_event=manager.broadcast_sync,
    )

    # Register court with routes
    set_court(court)

    logger.info("Curia court session initialized with 5 agents")
    yield

    logger.info("Shutting down Curia server")


app = FastAPI(
    title="Curia — Decentralized AI Arbitration Protocol",
    description="P2P courtroom where AI agents debate disputes and reach consensus verdicts via AXL",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST routes
app.include_router(router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time trial event streaming.
    Clients connect here to receive live messages, phase changes, and verdicts.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client can send messages too
            data = await websocket.receive_text()
            # Echo or handle client messages if needed
            logger.debug(f"WS received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("server.main:app", host=host, port=port, reload=True)
