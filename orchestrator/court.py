"""
Curia Court Session - Manages the full trial lifecycle.
Initializes all 5 agents, handles peer discovery, and runs trials.
"""

import time
import json
import uuid
import logging
import threading
from typing import Optional, Callable
from datetime import datetime, timezone

from agents.config import AgentConfig, AXL_PORTS, TrialConfig
from agents.llm import create_llm_provider
from agents.judge import JudgeAgent
from agents.prosecutor import ProsecutorAgent
from agents.defender import DefenderAgent
from agents.juror import JurorAgent
from agents.protocol import Phase, CaseRecord
from agents.base_agent import SimulatedTransport

logger = logging.getLogger(__name__)


class CourtSession:
    """
    Manages a complete trial session with all 5 agents.
    Handles agent initialization, peer discovery, and trial execution.
    """

    def __init__(self, simulation_mode: bool = True, on_event: Optional[Callable] = None):
        self.simulation_mode = simulation_mode
        self.on_event = on_event  # Callback for WebSocket streaming
        self.trial_config = TrialConfig()

        # Reset simulation transport for fresh session
        if simulation_mode:
            SimulatedTransport.reset()

        # Create LLM provider (shared across all agents)
        config = AgentConfig.from_env("judge")
        self.llm = create_llm_provider(
            provider=config.llm_provider,
            api_key=config.api_key,
            model=config.llm_model,
        )

        # Initialize all 5 agents
        self.judge = JudgeAgent(AXL_PORTS["judge"], self.llm, simulation_mode)
        self.prosecutor = ProsecutorAgent(AXL_PORTS["prosecutor"], self.llm, simulation_mode)
        self.defender = DefenderAgent(AXL_PORTS["defender"], self.llm, simulation_mode)
        self.juror1 = JurorAgent(AXL_PORTS["juror1"], self.llm, 1, simulation_mode)
        self.juror2 = JurorAgent(AXL_PORTS["juror2"], self.llm, 2, simulation_mode)

        self.agents = {
            "judge": self.judge,
            "prosecutor": self.prosecutor,
            "defender": self.defender,
            "juror1": self.juror1,
            "juror2": self.juror2,
        }

        # Set up event callbacks on all agents
        for agent in self.agents.values():
            agent.on_message_callback = self._handle_agent_message

        # Set up judge phase callback
        self.judge._phase_callback = self._handle_phase_change

        # Trial state
        self.active_case: Optional[CaseRecord] = None
        self.case_history: list[CaseRecord] = []
        self.all_messages: list[dict] = []
        self._trial_running = False

        # Perform peer discovery
        self._discover_peers()

        # In real AXL mode, wire in-process relay so the trial event-cascade
        # works immediately without waiting for AXL /recv polling.
        # Messages are still sent via AXL /send for the P2P demo.
        if not simulation_mode:
            self._wire_in_process_relay()

    def _discover_peers(self):
        """Register all agent peer IDs with each other."""
        # Collect all peer IDs
        peer_map = {}
        for role, agent in self.agents.items():
            if self.simulation_mode:
                peer_map[role] = agent.peer_id
            else:
                identity = agent.get_identity()
                peer_map[role] = identity.get("our_public_key", "")

        # Register each agent with all others
        for role, agent in self.agents.items():
            for other_role, peer_id in peer_map.items():
                if other_role != role:
                    agent.register_peer(other_role, peer_id)

        logger.info(f"Peer discovery complete: {list(peer_map.keys())}")

    def _wire_in_process_relay(self):
        """Wire direct in-process message delivery between all same-process agents.

        In real AXL mode, messages are sent via AXL /send (proving P2P usage)
        but also forwarded directly to each other agent's handle_message() so
        trial orchestration is not blocked by AXL /recv polling latency.
        """
        for role, agent in self.agents.items():
            for other_role, other_agent in self.agents.items():
                if other_role != role:
                    peer_key = agent.peer_registry.get(other_role)
                    if peer_key:
                        agent.in_process_relay[peer_key] = other_agent.receive_message
        logger.info("In-process relay wired for all agents (real AXL mode)")

    def _handle_agent_message(self, message: dict):
        """Callback fired whenever any agent sends or receives a message."""
        self.all_messages.append(message)

        # Update active case transcript
        if self.active_case:
            self.active_case.transcript.append(message)

        # Forward to WebSocket
        if self.on_event:
            try:
                self.on_event({
                    "type": "message",
                    "data": message,
                })
            except Exception as e:
                logger.error(f"Event callback error: {e}")

    def _handle_phase_change(self, phase: str):
        """Callback for judge phase transitions."""
        if self.active_case:
            self.active_case.current_phase = phase
            if phase == Phase.COMPLETED.value:
                self.active_case.status = "completed"
                self.active_case.completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                self._trial_running = False

                # Capture verdict
                for msg in reversed(self.all_messages):
                    if msg.get("message_type") == "final_verdict":
                        self.active_case.verdict = msg.get("content", "")
                        self.active_case.jury_votes = msg.get("metadata", {}).get("jury_votes", {})
                        break

        if self.on_event:
            try:
                self.on_event({
                    "type": "phase_change",
                    "data": {"phase": phase},
                })
            except Exception:
                pass

    def start_trial(self, case_data: dict) -> CaseRecord:
        """
        Start a new trial with the given case data.
        Runs the agents in a background thread.
        """
        # Create case record
        case_id = case_data.get("id", f"case-{uuid.uuid4().hex[:8]}")
        case = CaseRecord(
            id=case_id,
            title=case_data.get("title", "Untitled Case"),
            category=case_data.get("category", "custom"),
            description=case_data.get("description", ""),
            evidence=case_data.get("evidence", []),
            plaintiff=case_data.get("plaintiff", "Plaintiff"),
            defendant=case_data.get("defendant", "Defendant"),
            status="active",
            current_phase=Phase.OPENING.value,
        )

        self.active_case = case
        # Remove any previous case with the same ID from history so it doesn't conflict
        self.case_history = [c for c in self.case_history if c.id != case_id]
        self.case_history.append(case)
        self.all_messages = []
        self._trial_running = True

        # Reset agent state
        self.judge.current_phase = Phase.FILING
        self.judge.votes = {}
        self.judge.opening_statements_received = []
        self.judge.closing_statements_received = []
        self.judge.cross_exam_complete = False
        self.prosecutor.has_given_opening = False
        self.prosecutor.has_given_closing = False
        self.prosecutor.questions_asked = 0
        self.defender.has_given_opening = False
        self.defender.has_given_closing = False
        self.juror1.deliberation_rounds = 0
        self.juror1.has_voted = False
        self.juror1.trial_notes = []
        self.juror2.deliberation_rounds = 0
        self.juror2.has_voted = False
        self.juror2.trial_notes = []

        # Clear message logs
        for agent in self.agents.values():
            agent.message_log = []

        # Start all agents listening
        for agent in self.agents.values():
            agent.start_listening(poll_interval=self.trial_config.poll_interval)

        # Notify frontend
        if self.on_event:
            self.on_event({
                "type": "trial_start",
                "data": {
                    "case_id": case_id,
                    "title": case.title,
                    "description": case.description,
                },
            })

        # Open the case (Judge broadcasts to all agents)
        def run_trial():
            time.sleep(1)  # Let listeners spin up
            self.judge.open_case(case_data)

            # Wait for trial to complete (verdict delivered) or timeout
            timeout = 300  # 5 minutes max
            start = time.time()
            while self._trial_running and (time.time() - start) < timeout:
                time.sleep(1)

            # Stop all listeners
            for agent in self.agents.values():
                agent.stop_listening()

            if self._trial_running:
                # Timed out
                logger.warning(f"Trial {case_id} timed out")
                self._trial_running = False
                if self.active_case:
                    self.active_case.status = "timeout"

        thread = threading.Thread(target=run_trial, daemon=True)
        thread.start()

        return case

    def get_topology(self) -> dict:
        """Get the mesh topology of all agents."""
        topology = {}
        for role, agent in self.agents.items():
            topology[role] = {
                "peer_id": agent.peer_id,
                "role": role,
                "axl_port": agent.axl_port,
                "peers": list(agent.peer_registry.keys()),
                "message_count": len(agent.message_log),
                "status": "active" if self._trial_running else "idle",
            }
        return topology

    def get_agents_status(self) -> list[dict]:
        """Get status of all agents for the frontend."""
        from agents.config import ROLE_LABELS, ROLE_COLORS, ROLE_ICONS
        statuses = []
        for role, agent in self.agents.items():
            statuses.append({
                "role": role,
                "label": ROLE_LABELS.get(role, role),
                "color": ROLE_COLORS.get(role, "#888"),
                "icon": ROLE_ICONS.get(role, "⚙️"),
                "peer_id": agent.peer_id,
                "axl_port": agent.axl_port,
                "message_count": len(agent.message_log),
                "status": "listening" if agent.running else "idle",
            })
        return statuses
