"""
Curia Juror Agent — Independent evaluator who deliberates and votes.
Listens to all trial arguments, exchanges analysis P2P with other jurors
(private channel), and delivers a verdict vote to the Judge.
"""

import json
import time
import logging

from agents.base_agent import BaseAgent
from agents.protocol import Phase, MessageType
from agents.llm import LLMProvider

logger = logging.getLogger(__name__)


class JurorAgent(BaseAgent):
    """
    A Juror listens to all arguments, deliberates privately with other jurors
    via P2P (demonstrating AXL private channels), and votes.
    """

    def __init__(self, axl_port: int, llm: LLMProvider, juror_number: int, simulation_mode: bool = True):
        role = f"juror{juror_number}"
        super().__init__(role, axl_port, llm, simulation_mode)
        self.juror_number = juror_number
        self.other_juror_role = f"juror{2 if juror_number == 1 else 1}"
        self.deliberation_rounds = 0
        self.max_deliberation_rounds = 2
        self.has_voted = False
        self.trial_notes: list[str] = []

    def get_system_prompt(self) -> str:
        return f"""You are Juror #{self.juror_number} in Curia, a decentralized AI arbitration system.

Your role and responsibilities:
- Listen carefully to ALL arguments from both prosecution and defense
- Evaluate evidence objectively and identify strengths/weaknesses in each side
- During deliberation, exchange your analysis with other jurors via private P2P channel
- Consider the other juror's perspective and refine your analysis
- Deliver a clear verdict vote with reasoning to the Judge

You must be INDEPENDENT and IMPARTIAL. Base your judgment solely on:
1. The evidence presented
2. The quality and logic of the arguments
3. The fairness of the proceedings

Your deliberation with other jurors is conducted over an ENCRYPTED private channel —
neither the prosecution, defense, nor the judge can see your deliberation messages.

Keep your analysis concise and structured. Under 200 words per message."""

    def handle_message(self, sender: str, message: dict):
        msg_type = message.get("message_type", "")
        from_role = message.get("from_role", "")

        if msg_type == MessageType.CASE_BRIEF.value:
            self._take_note("Case brief received", message.get("content", ""))

        elif msg_type == MessageType.OPENING_STATEMENT.value:
            self._take_note(f"Opening statement from {from_role}", message.get("content", ""))

        elif msg_type == MessageType.QUESTION.value:
            self._take_note(f"Cross-exam question from {from_role}", message.get("content", ""))

        elif msg_type == MessageType.ANSWER.value:
            self._take_note(f"Cross-exam answer from {from_role}", message.get("content", ""))

        elif msg_type == MessageType.RULING.value:
            self._take_note(f"Judge ruling", message.get("content", ""))

        elif msg_type == MessageType.CLOSING_STATEMENT.value:
            self._take_note(f"Closing statement from {from_role}", message.get("content", ""))

        elif msg_type == MessageType.PHASE_TRANSITION.value:
            new_phase = message.get("phase", "")
            if new_phase == Phase.DELIBERATION.value:
                time.sleep(1 + self.juror_number * 0.5)
                self._start_deliberation(message.get("case_id", ""))

        elif msg_type == MessageType.JURY_ANALYSIS.value and from_role == self.other_juror_role:
            self._handle_peer_deliberation(message)

    def _take_note(self, label: str, content: str):
        """Record a summary note about a trial event."""
        summary = content[:200] if len(content) > 200 else content
        self.trial_notes.append(f"[{label}]: {summary}")

    def _start_deliberation(self, case_id: str):
        """Begin private deliberation with the other juror."""
        self.deliberation_rounds = 0

        analysis_prompt = (
            f"You have heard all arguments in this trial. Here are your notes:\n\n"
            + "\n".join(self.trial_notes[-15:]) + "\n\n"
            f"Provide your initial analysis for deliberation with the other juror. Cover:\n"
            f"1. Prosecution's strongest points\n"
            f"2. Defense's strongest points\n"
            f"3. Your initial leaning and why\n"
            f"Keep it under 200 words."
        )

        analysis = self.llm.complete(self.get_system_prompt(), analysis_prompt)
        self.deliberation_rounds += 1

        # Send ONLY to the other juror — private P2P channel
        analysis_msg = {
            "protocol": "curia",
            "case_id": case_id,
            "phase": Phase.DELIBERATION.value,
            "message_type": MessageType.JURY_ANALYSIS.value,
            "content": analysis,
            "to_role": self.other_juror_role,
            "metadata": {"round": self.deliberation_rounds, "encrypted": True},
        }

        other_peer_id = self.get_peer_id_for_role(self.other_juror_role)
        if other_peer_id:
            self.send_to_peer(other_peer_id, analysis_msg)
            logger.info(f"[{self.role}] Sent deliberation analysis (round {self.deliberation_rounds}) to {self.other_juror_role}")

        # Also send a redacted version to other roles (for frontend display)
        redacted_msg = {
            "protocol": "curia",
            "case_id": case_id,
            "phase": Phase.DELIBERATION.value,
            "message_type": MessageType.JURY_ANALYSIS.value,
            "content": "[ENCRYPTED — Private Juror Deliberation Channel]",
            "to_role": "all",
            "metadata": {"encrypted": True, "round": self.deliberation_rounds},
        }
        self.broadcast(redacted_msg, exclude_roles=[self.other_juror_role])

    def _handle_peer_deliberation(self, message: dict):
        """Handle the other juror's analysis and potentially continue deliberation."""
        other_analysis = message.get("content", "")
        round_num = message.get("metadata", {}).get("round", 1)

        if self.deliberation_rounds < self.max_deliberation_rounds:
            self.deliberation_rounds += 1
            time.sleep(1.5)

            response_prompt = (
                f"The other juror shared their analysis:\n"
                f"\"{other_analysis}\"\n\n"
                f"Your previous notes:\n" + "\n".join(self.trial_notes[-10:]) + "\n\n"
                f"This is deliberation round {self.deliberation_rounds}. "
                f"Respond with your updated analysis, considering the other juror's perspective. "
                f"Note any points of agreement or disagreement. Keep it under 200 words."
            )

            response = self.llm.complete(self.get_system_prompt(), response_prompt)

            response_msg = {
                "protocol": "curia",
                "case_id": message.get("case_id", ""),
                "phase": Phase.DELIBERATION.value,
                "message_type": MessageType.JURY_ANALYSIS.value,
                "content": response,
                "to_role": self.other_juror_role,
                "metadata": {"round": self.deliberation_rounds, "encrypted": True},
            }
            other_peer_id = self.get_peer_id_for_role(self.other_juror_role)
            if other_peer_id:
                self.send_to_peer(other_peer_id, response_msg)

            # Broadcast redacted
            redacted_msg = response_msg.copy()
            redacted_msg["content"] = "[ENCRYPTED — Private Juror Deliberation Channel]"
            redacted_msg["to_role"] = "all"
            self.broadcast(redacted_msg, exclude_roles=[self.other_juror_role])

        else:
            # Deliberation complete — cast vote
            time.sleep(1)
            self._cast_vote(message.get("case_id", ""), other_analysis)

    def _cast_vote(self, case_id: str, last_peer_analysis: str = ""):
        """Deliver final verdict vote to the Judge."""
        if self.has_voted:
            return
        self.has_voted = True

        vote_prompt = (
            f"Deliberation is complete. It is time to cast your verdict vote.\n\n"
            f"Your trial notes:\n" + "\n".join(self.trial_notes[-10:]) + "\n\n"
            f"Last peer analysis:\n{last_peer_analysis}\n\n"
            f"Cast your vote. Format your response as:\n"
            f"VOTE: [IN FAVOR OF PLAINTIFF / IN FAVOR OF DEFENDANT]\n"
            f"REASONING: [Your reasoning in 2-3 sentences]\n"
            f"CONFIDENCE: [HIGH / MEDIUM / LOW]"
        )

        vote = self.llm.complete(self.get_system_prompt(), vote_prompt)

        vote_msg = {
            "protocol": "curia",
            "case_id": case_id,
            "phase": Phase.VERDICT.value,
            "message_type": MessageType.VERDICT_VOTE.value,
            "content": vote,
            "to_role": "judge",
        }
        # Send to Judge only
        judge_peer_id = self.get_peer_id_for_role("judge")
        if judge_peer_id:
            self.send_to_peer(judge_peer_id, vote_msg)
            logger.info(f"[{self.role}] Verdict vote sent to Judge")

        # Broadcast notification (redacted vote)
        notify_msg = {
            "protocol": "curia",
            "case_id": case_id,
            "phase": Phase.VERDICT.value,
            "message_type": MessageType.VERDICT_VOTE.value,
            "content": f"[{self.role.upper()} has cast their vote — sealed and delivered to the Judge]",
            "to_role": "all",
            "metadata": {"voter": self.role},
        }
        self.broadcast(notify_msg, exclude_roles=["judge"])
