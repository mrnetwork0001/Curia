"""
Curia Defender Agent - Defense Counsel arguing AGAINST the claim.
Identifies weaknesses in the prosecution, presents counter-arguments, and rebuts.
"""

import json
import time
import logging

from agents.base_agent import BaseAgent
from agents.protocol import Phase, MessageType
from agents.llm import LLMProvider

logger = logging.getLogger(__name__)


class DefenderAgent(BaseAgent):
    """
    The Defender represents the defendant, countering the prosecution's arguments.
    Responds to cross-examination, raises objections, and delivers closing arguments.
    """

    def __init__(self, axl_port: int, llm: LLMProvider, simulation_mode: bool = True):
        super().__init__("defender", axl_port, llm, simulation_mode)
        self.case_data: dict = {}
        self.has_given_opening: bool = False
        self.has_given_closing: bool = False

    def get_system_prompt(self) -> str:
        return """You are the Defense Counsel in Curia, a decentralized AI arbitration system.

Your role and responsibilities:
- Defend your client against the prosecution's claims
- Identify weaknesses, logical fallacies, and gaps in the prosecution's arguments
- Present strong counter-arguments supported by evidence and legal reasoning
- Answer cross-examination questions strategically - concede minor points, defend major ones
- Raise objections when the prosecution's arguments are irrelevant or misleading
- Deliver a compelling defense that highlights reasonable doubt

You communicate via a peer-to-peer mesh network. Be measured, strategic, and analytical.
Keep responses under 300 words for individual arguments."""

    def handle_message(self, sender: str, message: dict):
        msg_type = message.get("message_type", "")
        from_role = message.get("from_role", "")

        if msg_type == MessageType.CASE_BRIEF.value:
            self._handle_case_brief(message)

        elif msg_type == MessageType.OPENING_STATEMENT.value and from_role == "prosecutor":
            self._handle_prosecution_opening(message)

        elif msg_type == MessageType.QUESTION.value and from_role == "prosecutor":
            self._handle_cross_exam_question(message)

        elif msg_type == MessageType.PHASE_TRANSITION.value:
            self._handle_phase_transition(message)

        elif msg_type == MessageType.RULING.value:
            # Note the ruling
            pass

    def _handle_case_brief(self, message: dict):
        """Store case data for reference."""
        try:
            self.case_data = json.loads(message.get("content", "{}"))
        except (json.JSONDecodeError, TypeError):
            self.case_data = {"description": message.get("content", "")}

    def _handle_prosecution_opening(self, message: dict):
        """After hearing prosecution's opening, deliver defense opening statement."""
        if self.has_given_opening:
            return
        self.has_given_opening = True

        case_desc = self.case_data.get("description", "")
        defendant = self.case_data.get("defendant", "the defendant")
        prosecution_opening = message.get("content", "")

        opening_prompt = (
            f"The prosecution has delivered their opening statement:\n"
            f"\"{prosecution_opening}\"\n\n"
            f"You represent: {defendant}\n"
            f"Case description: {case_desc}\n\n"
            f"Deliver your opening statement for the defense. Counter the prosecution's key points, "
            f"preview your defense strategy, and highlight the weaknesses in their case. "
            f"Keep it under 250 words."
        )

        time.sleep(1.5)
        opening = self.llm.complete(self.get_system_prompt(), opening_prompt)

        opening_msg = {
            "protocol": "curia",
            "case_id": message.get("case_id", ""),
            "phase": Phase.DEFENSE.value,
            "message_type": MessageType.OPENING_STATEMENT.value,
            "content": opening,
            "to_role": "all",
        }
        self.broadcast(opening_msg)
        logger.info("[Defender] Opening statement delivered")

    def _handle_cross_exam_question(self, message: dict):
        """Answer a cross-examination question from the prosecution."""
        question = message.get("content", "")

        answer_prompt = (
            f"The prosecution asks during cross-examination:\n"
            f"\"{question}\"\n\n"
            f"Trial context:\n{self.get_transcript_summary(10)}\n\n"
            f"Answer strategically. Concede minor points if necessary, but defend your core position. "
            f"Be direct and confident. Keep it under 150 words."
        )

        time.sleep(1.5)
        answer = self.llm.complete(self.get_system_prompt(), answer_prompt)

        answer_msg = {
            "protocol": "curia",
            "case_id": message.get("case_id", ""),
            "phase": Phase.CROSS_EXAMINATION.value,
            "message_type": MessageType.ANSWER.value,
            "content": answer,
            "to_role": "all",  # Broadcast so judge and jurors can observe
        }
        self.broadcast(answer_msg)
        logger.info("[Defender] Cross-exam answer delivered")

    def _handle_phase_transition(self, message: dict):
        """React to phase transitions."""
        new_phase = message.get("phase", "")

        if new_phase == Phase.REBUTTAL.value and not self.has_given_closing:
            time.sleep(2)
            self._deliver_closing(message.get("case_id", ""))

    def _deliver_closing(self, case_id: str):
        """Generate and broadcast closing statement."""
        if self.has_given_closing:
            return
        self.has_given_closing = True

        closing_prompt = (
            f"Deliver your closing statement for the defense.\n\n"
            f"Trial transcript:\n{self.get_transcript_summary(15)}\n\n"
            f"Summarize your strongest defense points, address the prosecution's key arguments, "
            f"and make a compelling final plea for why the court should rule in favor of your client. "
            f"Highlight any reasonable doubt. Keep it under 250 words."
        )

        closing = self.llm.complete(self.get_system_prompt(), closing_prompt)

        closing_msg = {
            "protocol": "curia",
            "case_id": case_id,
            "phase": Phase.REBUTTAL.value,
            "message_type": MessageType.CLOSING_STATEMENT.value,
            "content": closing,
            "to_role": "all",
        }
        self.broadcast(closing_msg)
        logger.info("[Defender] Closing statement delivered")
