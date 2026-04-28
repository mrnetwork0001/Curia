"""
Curia Base Agent - Abstract base class for all courtroom agents.
Handles AXL communication (real or simulated), message logging, and event callbacks.
"""

import requests
import json
import time
import threading
import logging
from abc import ABC, abstractmethod
from typing import Optional, Callable

from agents.protocol import CuriaMessage, create_message, Phase, MessageType
from agents.llm import LLMProvider

logger = logging.getLogger(__name__)


class SimulatedTransport:
    """
    In-memory message transport for development without AXL nodes.
    All agents share the same SimulatedTransport instance.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._queues = {}       # peer_id -> list[tuple[sender_id, message]]
                cls._instance._identities = {}   # role -> {"our_public_key": ..., "our_ipv6": ...}
                cls._instance._counter = 0
            return cls._instance

    def register_agent(self, role: str, peer_id: str):
        """Register an agent in the simulated mesh."""
        self._queues[peer_id] = []
        self._identities[role] = {
            "our_public_key": peer_id,
            "our_ipv6": f"200:curia:{role}",
            "peers": [],
            "tree": [],
        }

    def get_topology(self, role: str) -> dict:
        return self._identities.get(role, {})

    def send(self, from_peer_id: str, to_peer_id: str, message: dict):
        if to_peer_id in self._queues:
            self._queues[to_peer_id].append((from_peer_id, message))

    def recv(self, peer_id: str) -> Optional[tuple]:
        if peer_id in self._queues and self._queues[peer_id]:
            return self._queues[peer_id].pop(0)
        return None

    @classmethod
    def reset(cls):
        """Reset the singleton (for testing)."""
        with cls._lock:
            cls._instance = None


class BaseAgent(ABC):
    """
    Abstract base class for all Curia courtroom agents.
    Handles AXL P2P communication, peer registry, and message lifecycle.
    """

    def __init__(self, role: str, axl_port: int, llm: LLMProvider, simulation_mode: bool = True):
        self.role = role
        self.axl_port = axl_port
        self.axl_base = f"http://127.0.0.1:{axl_port}"
        self.llm = llm
        self.simulation_mode = simulation_mode

        # Peer registry: role -> peer_id (public key)
        self.peer_registry: dict[str, str] = {}

        # This agent's peer ID (public key)
        self.peer_id: str = ""

        # Message log for this agent
        self.message_log: list[dict] = []

        # Sequence counter
        self._sequence = 0

        # Event callback for real-time updates (used by FastAPI WebSocket)
        self.on_message_callback: Optional[Callable] = None

        # Background polling
        self.running = False
        self._poll_thread: Optional[threading.Thread] = None

        # In-process relay: peer_id -> handle_message callable
        # Used in real AXL mode so trial event-cascade works even if
        # AXL /recv polling is slow - messages are directly forwarded
        # between same-process agents while still sending via AXL /send.
        self.in_process_relay: dict[str, Callable] = {}

        # Simulated transport
        if simulation_mode:
            self._transport = SimulatedTransport()
            # Generate a deterministic fake peer_id for simulation
            self.peer_id = self._generate_sim_peer_id(role)
            self._transport.register_agent(role, self.peer_id)

    def _generate_sim_peer_id(self, role: str) -> str:
        """Generate a deterministic 64-char hex peer ID for simulation."""
        import hashlib
        h = hashlib.sha256(f"curia-{role}-sim".encode()).hexdigest()
        return h[:64]

    def get_identity(self) -> dict:
        """Get this node's public key and topology info."""
        if self.simulation_mode:
            return self._transport.get_topology(self.role)
        try:
            resp = requests.get(f"{self.axl_base}/topology", timeout=5)
            data = resp.json()
            self.peer_id = data.get("our_public_key", "")
            return data
        except Exception as e:
            logger.error(f"[{self.role}] Failed to get topology: {e}")
            return {}

    def register_peer(self, role: str, peer_id: str):
        """Register another agent's peer ID."""
        self.peer_registry[role] = peer_id
        logger.info(f"[{self.role}] Registered peer: {role} -> {peer_id[:16]}...")

    def send_to_peer(self, peer_id: str, message: dict, _fire_callback: bool = True):
        """Send a message to a specific peer via AXL."""
        # Stamp outgoing metadata
        message["from_role"] = self.role
        message["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self._sequence += 1
        message["sequence"] = self._sequence

        if self.simulation_mode:
            self._transport.send(self.peer_id, peer_id, message)
        else:
            try:
                requests.post(
                    f"{self.axl_base}/send",
                    headers={"X-Destination-Peer-Id": peer_id},
                    data=json.dumps(message).encode(),
                    timeout=10,
                )
            except Exception as e:
                logger.error(f"[{self.role}] Failed to send to {peer_id[:16]}: {e}")

            # In-process relay: deliver directly to recipient if same process
            relay_fn = self.in_process_relay.get(peer_id)
            if relay_fn:
                msg_copy = dict(message)  # shallow copy to avoid mutation races
                threading.Thread(
                    target=relay_fn, args=(self.role, msg_copy), daemon=True
                ).start()

        self.message_log.append(message)

        # Callback is fired by the caller (broadcast fires it once; direct sends fire it here)
        if _fire_callback and self.on_message_callback:
            try:
                self.on_message_callback(message)
            except Exception as e:
                logger.error(f"[{self.role}] Callback error: {e}")

    def broadcast(self, message: dict, exclude_roles: list = None):
        """Send a message to all registered peers, firing the event callback exactly once."""
        exclude = exclude_roles or []
        recipients = [
            peer_id for role, peer_id in self.peer_registry.items()
            if role not in exclude
        ]
        if not recipients:
            return

        # Send to the first recipient with a stamped sequence (sets from_role / timestamp)
        # then re-use the same stamped copy for remaining peers (no callback per send)
        first = True
        stamped_msg = message
        for role, peer_id in self.peer_registry.items():
            if role in exclude:
                continue
            if first:
                # First send stamps the message and adds to log; we fire callback after loop
                self.send_to_peer(peer_id, stamped_msg, _fire_callback=False)
                # send_to_peer mutates message in-place (adds from_role/timestamp/sequence)
                stamped_msg = self.message_log[-1]  # get the stamped copy back
                first = False
            else:
                # Direct transport send for remaining recipients - same message, no restamping
                if self.simulation_mode:
                    self._transport.send(self.peer_id, peer_id, stamped_msg)
                else:
                    try:
                        requests.post(
                            f"{self.axl_base}/send",
                            headers={"X-Destination-Peer-Id": peer_id},
                            data=json.dumps(stamped_msg).encode(),
                            timeout=10,
                        )
                    except Exception as e:
                        logger.error(f"[{self.role}] Broadcast send to {peer_id[:16]} failed: {e}")

                    # In-process relay for remaining peers
                    relay_fn = self.in_process_relay.get(peer_id)
                    if relay_fn:
                        msg_copy = dict(stamped_msg)
                        threading.Thread(
                            target=relay_fn, args=(self.role, msg_copy), daemon=True
                        ).start()

        # Fire event callback exactly once for the whole broadcast
        if self.on_message_callback:
            try:
                self.on_message_callback(stamped_msg)
            except Exception as e:
                logger.error(f"[{self.role}] Broadcast callback error: {e}")

    def poll_messages(self) -> Optional[tuple]:
        """Poll for one inbound message. Returns (sender_peer_id, message_dict) or None."""
        if self.simulation_mode:
            return self._transport.recv(self.peer_id)
        try:
            resp = requests.get(f"{self.axl_base}/recv", timeout=5)
            if resp.status_code == 204:
                return None
            sender = resp.headers.get("X-From-Peer-Id", "unknown")
            message = json.loads(resp.content)
            return sender, message
        except Exception as e:
            logger.error(f"[{self.role}] Poll error: {e}")
            return None

    def receive_message(self, sender: str, message: dict):
        """Receive a message, log it, and process it."""
        self.message_log.append(message)
        self.handle_message(sender, message)

    def start_listening(self, poll_interval: float = 0.5):
        """Start a background thread that polls for messages."""
        self.running = True

        # If in-process relay is wired (real AXL mode), skip the poll thread:
        # messages are delivered directly to receive_message() by the relay,
        # so polling /recv would cause duplicates.
        if not self.simulation_mode and self.in_process_relay:
            logger.info(f"[{self.role}] In-process relay active - AXL /recv poll skipped")
            return

        def loop():
            while self.running:
                try:
                    result = self.poll_messages()
                    if result:
                        sender, message = result
                        # NOTE: Do NOT fire on_message_callback here.
                        # The sender already fired it exactly once via send_to_peer / broadcast.
                        # Firing it again on receive would cause duplicates in the transcript.
                        self.receive_message(sender, message)
                except Exception as e:
                    logger.error(f"[{self.role}] Listener error: {e}")
                time.sleep(poll_interval)

        self._poll_thread = threading.Thread(target=loop, daemon=True)
        self._poll_thread.start()
        logger.info(f"[{self.role}] Listening for messages on port {self.axl_port}...")

    def stop_listening(self):
        """Stop the background polling thread."""
        self.running = False
        if self._poll_thread:
            self._poll_thread.join(timeout=2)

    def get_peer_id_for_role(self, role: str) -> Optional[str]:
        """Look up a peer's ID by their role."""
        return self.peer_registry.get(role)

    def send_to_role(self, target_role: str, message: dict):
        """Send a message to a specific role (convenience wrapper)."""
        peer_id = self.get_peer_id_for_role(target_role)
        if peer_id:
            message["to_role"] = target_role
            self.send_to_peer(peer_id, message)
        else:
            logger.warning(f"[{self.role}] Unknown peer role: {target_role}")

    def get_transcript_summary(self, last_n: int = 20) -> str:
        """Get a text summary of recent messages for LLM context."""
        recent = self.message_log[-last_n:] if len(self.message_log) > last_n else self.message_log
        lines = []
        for msg in recent:
            fr = msg.get("from_role", "unknown")
            mt = msg.get("message_type", "")
            content = msg.get("content", "")[:300]
            lines.append(f"[{fr}] ({mt}): {content}")
        return "\n".join(lines)

    @abstractmethod
    def handle_message(self, sender: str, message: dict):
        """Handle an incoming message - implemented by each agent role."""
        pass

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the LLM system prompt for this agent's role."""
        pass
