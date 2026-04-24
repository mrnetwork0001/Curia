"""
Curia Prosecutor Agent — Lead Prosecutor arguing FOR the plaintiff.
Builds the strongest case, cross-examines the defense, and delivers closing arguments.
"""

import json
import time
import logging

from agents.base_agent import BaseAgent
from agents.protocol import Phase, MessageType
from agents.llm import LLMProvider

logger = logging.getLogger(__name__)


class ProsecutorAgent(BaseAgent):
    """
    The Prosecutor builds and presents the case for the plaintiff.
    Generates opening statements, cross-examination questions, and closing arguments.
    """

    def __init__(self, axl_port: int, llm: LLMProvider, simulation_mode: bool = True):
        super().__init__("prosecutor", axl_port, llm, simulation_mode)
        self.case_data: dict = {}
        self.questions_asked: int = 0
        self.max_questions: int = 2
        self.has_given_opening: bool = False
        self.has_given_closing: bool = False

    def get_system_prompt(self) -> str:
        return """You are the Lead Prosecutor in Curia, a decentralized AI arbitration system.

Your role and responsibilities:
- Build the strongest possible case FOR the plaintiff/claimant
- Present clear, logical arguments supported by evidence
- Cross-examine the defense to expose weaknesses and contradictions
- Be assertive, rigorous, and persuasive — but never fabricate evidence
- Object to irrelevant or misleading defense arguments when warranted
- Deliver compelling opening and closing statements

You communicate via a peer-to-peer mesh network. Be concise, factual, and relentless in pursuit of justice for your client.
Keep responses under 300 words for individual arguments."""

    def handle_message(self, sender: str, message: dict):
        msg_type = message.get("message_type", "")
        from_role = message.get("from_role", "")

        if msg_type == MessageType.CASE_BRIEF.value:
            self._handle_case_brief(message)

        elif msg_type == MessageType.PHASE_TRANSITION.value:
            self._handle_phase_transition(message)

        elif msg_type == MessageType.ANSWER.value and from_role == "defender":
            self._handle_defense_answer(message)

        elif msg_type == MessageType.RULING.value:
            # Note the judge's ruling but don't respond
            pass

    def _handle_case_brief(self, message: dict):
        """Receive the case brief and prepare opening statement."""
        try:
            self.case_data = json.loads(message.get("content", "{}"))
        except (json.JSONDecodeError, TypeError):
            self.case_data = {"description": message.get("content", "")}

        if self.has_given_opening:
            return
        self.has_given_opening = True

        case_desc = self.case_data.get("description", "")
        evidence = self.case_data.get("evidence", [])
        plaintiff = self.case_data.get("plaintiff", "the plaintiff")

        opening_prompt = (
            f"Prepare your opening statement for this case.\n\n"
            f"You represent: {plaintiff}\n"
            f"Case description: {case_desc}\n"
            f"Evidence available:\n" + "\n".join(f"- {e}" for e in evidence) + "\n\n"
            f"Deliver a compelling opening statement that outlines your key arguments "
            f"and previews the evidence you will present. Keep it under 250 words."
        )

        time.sleep(1)  # Brief delay for natural pacing
        opening = self.llm.complete(self.get_system_prompt(), opening_prompt)

        opening_msg = {
            "protocol": "curia",
            "case_id": message.get("case_id", ""),
            "phase": Phase.PROSECUTION.value,
            "message_type": MessageType.OPENING_STATEMENT.value,
            "content": opening,
            "to_role": "all",
        }
        self.broadcast(opening_msg)
        logger.info("[Prosecutor] Opening statement delivered")

    def _handle_phase_transition(self, message: dict):
        """React to phase transitions."""
        new_phase = message.get("phase", "")

        if new_phase == Phase.CROSS_EXAMINATION.value:
            self.questions_asked = 0
            time.sleep(1)
            self._ask_cross_exam_question(message.get("case_id", ""))

        elif new_phase == Phase.REBUTTAL.value and not self.has_given_closing:
            time.sleep(1)
            self._deliver_closing(message.get("case_id", ""))

    def _ask_cross_exam_question(self, case_id: str):
        """Generate and send a cross-examination question to the defense."""
        if self.questions_asked >= self.max_questions:
            return

        self.questions_asked += 1

        q_prompt = (
            f"You are cross-examining the defense counsel. This is question {self.questions_asked} "
            f"of {self.max_questions}.\n\n"
            f"Trial transcript so far:\n{self.get_transcript_summary(10)}\n\n"
            f"Ask a pointed, strategic question that exposes a weakness in the defense's position. "
            f"Be specific and reference evidence or contradictions. Keep it to 1-2 sentences."
        )

        question = self.llm.complete(self.get_system_prompt(), q_prompt)

        q_msg = {
            "protocol": "curia",
            "case_id": case_id,
            "phase": Phase.CROSS_EXAMINATION.value,
            "message_type": MessageType.QUESTION.value,
            "content": question,
            "to_role": "defender",
        }
        # Send question P2P to defender AND broadcast so others can observe
        self.broadcast(q_msg)
        logger.info(f"[Prosecutor] Cross-exam question {self.questions_asked} sent")

    def _handle_defense_answer(self, message: dict):
        """Handle the defense's answer and potentially ask follow-up."""
        if self.questions_asked < self.max_questions:
            time.sleep(1.5)
            self._ask_cross_exam_question(message.get("case_id", ""))

    def _deliver_closing(self, case_id: str):
        """Generate and broadcast closing statement."""
        if self.has_given_closing:
            return
        self.has_given_closing = True

        closing_prompt = (
            f"Deliver your closing statement for the prosecution.\n\n"
            f"Trial transcript:\n{self.get_transcript_summary(15)}\n\n"
            f"Summarize the key evidence, highlight the defense's failures during cross-examination, "
            f"and make a compelling final argument for why the court should rule in favor of your client. "
            f"Keep it under 250 words."
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
        logger.info("[Prosecutor] Closing statement delivered")
