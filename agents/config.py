"""
Curia Agent Configuration
Port mappings, role definitions, and agent settings.
"""

from dataclasses import dataclass, field
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()


# ----- Role Definitions -----

ROLES = ["judge", "prosecutor", "defender", "juror1", "juror2"]

# AXL port mapping for each agent role
AXL_PORTS = {
    "judge": 9002,
    "prosecutor": 9012,
    "defender": 9022,
    "juror1": 9032,
    "juror2": 9042,
}

# Display colors for the frontend (CSS hex values)
ROLE_COLORS = {
    "judge": "#D4A84B",       # Gold - authority
    "prosecutor": "#E74C3C",  # Crimson - prosecution
    "defender": "#4A90D9",    # Blue - defense
    "juror1": "#2ECC71",      # Emerald - juror
    "juror2": "#27AE60",      # Green - juror
}

ROLE_LABELS = {
    "judge": "Chief Justice",
    "prosecutor": "Lead Prosecutor",
    "defender": "Defense Counsel",
    "juror1": "Juror #1",
    "juror2": "Juror #2",
}

ROLE_ICONS = {
    "judge": "⚖️",
    "prosecutor": "🔴",
    "defender": "🛡️",
    "juror1": "👤",
    "juror2": "👤",
}


@dataclass
class AgentConfig:
    """Configuration for a single Curia agent."""
    role: str
    axl_port: int
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o-mini"
    api_key: Optional[str] = None
    simulation_mode: bool = True

    @classmethod
    def from_env(cls, role: str) -> "AgentConfig":
        """Create config from environment variables."""
        return cls(
            role=role,
            axl_port=AXL_PORTS[role],
            llm_provider=os.getenv("LLM_PROVIDER", "openai"),
            llm_model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            api_key=os.getenv("OPENAI_API_KEY", ""),
            simulation_mode=os.getenv("SIMULATION_MODE", "true").lower() == "true",
        )


@dataclass
class TrialConfig:
    """Configuration for a full trial session."""
    cross_exam_rounds: int = 2     # Number of question/answer exchanges
    deliberation_rounds: int = 2   # Number of juror P2P exchanges
    poll_interval: float = 0.5     # Seconds between message polls
    phase_delay: float = 1.0       # Seconds to wait between phase transitions
