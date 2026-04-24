"""
Curia Protocol — Message types, phase management, and schema definitions.
Every message between agents follows the CuriaMessage schema.
"""

from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class Phase(str, Enum):
    """Trial phases — executed in order."""
    FILING = "filing"
    OPENING = "opening"
    PROSECUTION = "prosecution"
    DEFENSE = "defense"
    CROSS_EXAMINATION = "cross_examination"
    REBUTTAL = "rebuttal"
    DELIBERATION = "deliberation"
    VERDICT = "verdict"
    COMPLETED = "completed"


# Ordered list for phase progression
PHASE_ORDER = [
    Phase.FILING,
    Phase.OPENING,
    Phase.PROSECUTION,
    Phase.DEFENSE,
    Phase.CROSS_EXAMINATION,
    Phase.REBUTTAL,
    Phase.DELIBERATION,
    Phase.VERDICT,
    Phase.COMPLETED,
]


class MessageType(str, Enum):
    """All message types in the Curia protocol."""
    # Trial management
    CASE_BRIEF = "case_brief"
    PHASE_TRANSITION = "phase_transition"

    # Arguments
    OPENING_STATEMENT = "opening_statement"
    CLOSING_STATEMENT = "closing_statement"

    # Cross-examination
    QUESTION = "question"
    ANSWER = "answer"

    # Objections
    OBJECTION = "objection"
    RULING = "ruling"

    # Jury
    JURY_ANALYSIS = "jury_analysis"
    VERDICT_VOTE = "verdict_vote"

    # Final
    FINAL_VERDICT = "final_verdict"

    # System
    PEER_ANNOUNCE = "peer_announce"
    ACK = "ack"


class CuriaMessage(BaseModel):
    """Standard message format for all agent communication."""
    protocol: str = "curia"
    version: str = "1.0"
    case_id: str = ""
    phase: str = ""
    from_role: str = ""
    to_role: str = "all"  # "all" for broadcast, or specific role
    message_type: str = ""
    content: str = ""
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    )
    sequence: int = 0
    metadata: dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> dict:
        return self.model_dump()

    @classmethod
    def from_dict(cls, data: dict) -> "CuriaMessage":
        return cls(**data)


class CaseSubmission(BaseModel):
    """Schema for submitting a new dispute."""
    title: str
    category: str = "custom"
    description: str
    evidence: list[str] = Field(default_factory=list)
    plaintiff: str = "Plaintiff"
    defendant: str = "Defendant"


class CaseRecord(BaseModel):
    """Full case record with trial state."""
    id: str
    title: str
    category: str
    description: str
    evidence: list[str] = Field(default_factory=list)
    plaintiff: str = "Plaintiff"
    defendant: str = "Defendant"
    status: str = "pending"  # pending, active, completed
    current_phase: str = Phase.FILING.value
    transcript: list[dict] = Field(default_factory=list)
    verdict: Optional[str] = None
    jury_votes: dict[str, str] = Field(default_factory=dict)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    )
    completed_at: Optional[str] = None


def create_message(
    case_id: str,
    phase: Phase,
    from_role: str,
    message_type: MessageType,
    content: str,
    to_role: str = "all",
    sequence: int = 0,
    metadata: dict = None,
) -> CuriaMessage:
    """Factory function to create a properly formatted Curia message."""
    return CuriaMessage(
        case_id=case_id,
        phase=phase.value,
        from_role=from_role,
        to_role=to_role,
        message_type=message_type.value,
        content=content,
        sequence=sequence,
        metadata=metadata or {},
    )
