"""
Curia Judge Agent — Chief Justice of the decentralized arbitration court.
Orchestrates trial phases, rules on objections, and delivers final verdicts.
"""

import json
import time
import logging
from typing import Optional

from agents.base_agent import BaseAgent
from agents.protocol import Phase, MessageType
from agents.llm import LLMProvider

logger = logging.getLogger(__name__)


class JudgeAgent(BaseAgent):
    """
    The Judge orchestrates the trial, manages phase transitions,
    rules on objections, and delivers the final verdict.
    """

    def __init__(self, axl_port: int, llm: LLMProvider, simulation_mode: bool = True):
        super().__init__("judge", axl_port, llm, simulation_mode)
        self.current_phase = Phase.FILING
        self.current_case_id = ""
        self.votes: dict[str, str] = {}
        self.opening_statements_received: list[str] = []
        self.closing_statements_received: list[str] = []
        self.cross_exam_complete = False
        self._phase_callback: Optional[callable] = None

    def get_system_prompt(self) -> str:
        return """You are the Chief Justice of Curia, a decentralized AI arbitration system.

Your role and responsibilities:
- Maintain order, impartiality, and fairness in all proceedings
- Ensure both prosecution and defense have equal opportunity to present their case
- Rule on objections based on relevance, fairness, and procedural correctness
- Synthesize jury votes and trial evidence into a clear, reasoned final verdict
- Be measured, authoritative, and precise in tone

You are communicating via a peer-to-peer mesh network — there is no central server.
All your rulings carry the weight of the decentralized court.
Be concise but thorough. Address legal merits, not personal arguments."""

    def open_case(self, case: dict):
        """Broadcast the case brief to all agents to start the trial."""
        self.current_case_id = case.get("id", "case-unknown")
        self.current_phase = Phase.OPENING
        self.votes = {}
        self.opening_statements_received = []
        self.closing_statements_received = []
        self.cross_exam_complete = False

        logger.info(f"[Judge] Opening case: {self.current_case_id}")

        brief_msg = {
            "protocol": "curia",
            "version": "1.0",
            "case_id": self.current_case_id,
            "phase": Phase.OPENING.value,
            "message_type": MessageType.CASE_BRIEF.value,
            "content": json.dumps({
                "title": case.get("title", ""),
                "description": case.get("description", ""),
                "evidence": case.get("evidence", []),
                "plaintiff": case.get("plaintiff", "Plaintiff"),
                "defendant": case.get("defendant", "Defendant"),
            }),
            "to_role": "all",
        }
        self.broadcast(brief_msg)

    def _transition_phase(self, new_phase: Phase, announcement: str = ""):
        """Transition to a new trial phase and notify all agents."""
        self.current_phase = new_phase
        logger.info(f"[Judge] Phase transition -> {new_phase.value}")

        msg = {
            "protocol": "curia",
            "case_id": self.current_case_id,
            "phase": new_phase.value,
            "message_type": MessageType.PHASE_TRANSITION.value,
            "content": announcement or f"The court is now entering the {new_phase.value} phase.",
            "to_role": "all",
        }
        self.broadcast(msg)

        if self._phase_callback:
            self._phase_callback(new_phase.value)

    def handle_message(self, sender: str, message: dict):
        msg_type = message.get("message_type", "")
        from_role = message.get("from_role", "")

        if msg_type == MessageType.OPENING_STATEMENT.value:
            self._handle_opening_statement(from_role, message)

        elif msg_type == MessageType.OBJECTION.value:
            self._handle_objection(from_role, message)

        elif msg_type == MessageType.ANSWER.value and from_role == "defender":
            # Cross-examination answer received — check if we should transition
            self._handle_cross_exam_progress(message)

        elif msg_type == MessageType.CLOSING_STATEMENT.value:
            self._handle_closing_statement(from_role, message)

        elif msg_type == MessageType.VERDICT_VOTE.value:
            self._handle_verdict_vote(from_role, message)

    def _handle_opening_statement(self, from_role: str, message: dict):
        """Track opening statements from both sides."""
        if from_role not in self.opening_statements_received:
            self.opening_statements_received.append(from_role)
            logger.info(f"[Judge] Received opening statement from {from_role}")

        # When both prosecutor and defender have presented, move to cross-examination
        if "prosecutor" in self.opening_statements_received and "defender" in self.opening_statements_received:
            time.sleep(0.5)
            self._transition_phase(
                Phase.CROSS_EXAMINATION,
                "Both sides have presented their opening statements. "
                "The prosecution may now cross-examine the defense."
            )

    def _handle_objection(self, from_role: str, message: dict):
        """Use LLM to rule on an objection."""
        ruling_text = self.llm.complete(
            self.get_system_prompt(),
            f"An objection has been raised by the {from_role}:\n"
            f"\"{message.get('content', '')}\"\n\n"
            f"Trial context (recent exchanges):\n{self.get_transcript_summary(10)}\n\n"
            f"Rule on this objection. Respond with SUSTAINED or OVERRULED, then explain briefly."
        )

        ruling_msg = {
            "protocol": "curia",
            "case_id": self.current_case_id,
            "phase": self.current_phase.value,
            "message_type": MessageType.RULING.value,
            "content": ruling_text,
            "to_role": "all",
            "metadata": {"objection_from": from_role},
        }
        self.broadcast(ruling_msg)

    def _handle_cross_exam_progress(self, message: dict):
        """Track cross-examination progress and transition when complete."""
        # Count question/answer pairs in the log
        qa_count = sum(1 for m in self.message_log if m.get("message_type") == MessageType.ANSWER.value
                       and m.get("phase") == Phase.CROSS_EXAMINATION.value)

        if qa_count >= 2 and not self.cross_exam_complete:
            self.cross_exam_complete = True
            time.sleep(0.5)
            self._transition_phase(
                Phase.REBUTTAL,
                "Cross-examination is concluded. Both sides may now present their closing arguments."
            )

    def _handle_closing_statement(self, from_role: str, message: dict):
        """Track closing statements and trigger deliberation."""
        if from_role not in self.closing_statements_received:
            self.closing_statements_received.append(from_role)

        if "prosecutor" in self.closing_statements_received and "defender" in self.closing_statements_received:
            time.sleep(0.5)
            self._transition_phase(
                Phase.DELIBERATION,
                "Both sides have concluded their arguments. The jury will now deliberate. "
                "Jury deliberation is conducted over an encrypted private channel."
            )

    def _handle_verdict_vote(self, from_role: str, message: dict):
        """Collect jury votes and deliver verdict when all received."""
        self.votes[from_role] = message.get("content", "")
        logger.info(f"[Judge] Received verdict vote from {from_role}")

        # Need votes from both jurors
        if len(self.votes) >= 2:
            time.sleep(1)
            self.deliver_verdict()

    def deliver_verdict(self):
        """Compile jury votes + trial transcript into the final verdict."""
        verdict_prompt = (
            f"You are delivering the final verdict for case {self.current_case_id}.\n\n"
            f"Jury Vote from Juror 1:\n{self.votes.get('juror1', 'No vote')}\n\n"
            f"Jury Vote from Juror 2:\n{self.votes.get('juror2', 'No vote')}\n\n"
            f"Full trial transcript (last 20 messages):\n{self.get_transcript_summary(20)}\n\n"
            f"Deliver a comprehensive, reasoned final verdict. Include:\n"
            f"1. Summary of the case\n"
            f"2. Key arguments from both sides\n"
            f"3. Jury consensus analysis\n"
            f"4. Your ruling (IN FAVOR or AGAINST the plaintiff)\n"
            f"5. Conditions or remedies if applicable"
        )

        final_verdict = self.llm.complete(self.get_system_prompt(), verdict_prompt)

        self.current_phase = Phase.VERDICT

        verdict_msg = {
            "protocol": "curia",
            "case_id": self.current_case_id,
            "phase": Phase.VERDICT.value,
            "message_type": MessageType.FINAL_VERDICT.value,
            "content": final_verdict,
            "to_role": "all",
            "metadata": {
                "jury_votes": self.votes,
                "case_id": self.current_case_id,
            },
        }
        self.broadcast(verdict_msg)
        logger.info(f"[Judge] Final verdict delivered for {self.current_case_id}")

        # Mark trial as completed
        self.current_phase = Phase.COMPLETED
        if self._phase_callback:
            self._phase_callback(Phase.COMPLETED.value)
