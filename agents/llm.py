"""
Curia LLM Interface — Abstraction layer for LLM providers.
Supports OpenAI (default), Anthropic, and Ollama.
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Optional

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    def complete(self, system_prompt: str, user_prompt: str) -> str:
        """Generate a completion given system and user prompts."""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model = model

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=1024,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return f"[LLM Error: {str(e)}]"


class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider."""

    def __init__(self, api_key: str, model: str = "claude-3-haiku-20240307"):
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return response.content[0].text.strip()
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return f"[LLM Error: {str(e)}]"


class OllamaProvider(LLMProvider):
    """Ollama local model provider."""

    def __init__(self, host: str = "http://localhost:11434", model: str = "llama3"):
        import requests
        self.host = host
        self.model = model
        self._requests = requests

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = self._requests.post(
                f"{self.host}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "stream": False,
                },
                timeout=60,
            )
            data = response.json()
            return data.get("message", {}).get("content", "[No response from Ollama]")
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            return f"[LLM Error: {str(e)}]"


class MockProvider(LLMProvider):
    """Mock provider for testing without API keys."""

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        # Return contextual mock responses based on the prompt content
        prompt_lower = user_prompt.lower()

        if "opening statement" in prompt_lower:
            return ("After careful analysis of the evidence presented, I submit to this court "
                    "that the facts clearly support my client's position. The evidence demonstrates "
                    "a pattern that cannot be ignored, and I will show through rigorous argumentation "
                    "that justice demands a ruling in our favor.")

        if "cross-exam" in prompt_lower or "question" in prompt_lower:
            return ("Can you explain the apparent contradiction between your stated position "
                    "and the documented evidence in the record? Specifically, how do you reconcile "
                    "the timeline discrepancies?")

        if "answer" in prompt_lower or "respond" in prompt_lower:
            return ("The apparent contradiction is resolved when you consider the full context. "
                    "The timeline in question has been mischaracterized. When properly sequenced, "
                    "the evidence actually strengthens our position.")

        if "rebutt" in prompt_lower or "closing" in prompt_lower:
            return ("In closing, the evidence speaks for itself. Despite the defense's attempts "
                    "to reframe the narrative, the core facts remain undisputed. I urge this court "
                    "to consider the weight of evidence and deliver a just verdict.")

        if "objection" in prompt_lower or "ruling" in prompt_lower:
            return ("After careful consideration, the objection is overruled. The line of questioning "
                    "is relevant to the matter at hand and the evidence is admissible.")

        if "deliberat" in prompt_lower or "analysis" in prompt_lower:
            return ("Having reviewed all arguments and evidence presented by both sides, I find "
                    "the prosecution's case to be more compelling on key factual points, though "
                    "the defense raised valid procedural concerns. My assessment weighs toward "
                    "the plaintiff's position with conditions.")

        if "verdict" in prompt_lower or "vote" in prompt_lower:
            return ("VERDICT: After thorough deliberation, considering all evidence, arguments, "
                    "and jury analysis, this court finds in FAVOR OF THE PLAINTIFF with the following "
                    "conditions: 1) The remedy shall be proportional to demonstrated damages. "
                    "2) Both parties shall bear their own procedural costs. "
                    "3) The ruling takes effect immediately. "
                    "This verdict reflects the consensus of the jury and the judgment of this court.")

        return ("I have carefully considered the matter before me and provide my analysis "
                "based on the evidence and arguments presented.")


def create_llm_provider(
    provider: str = "openai",
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> LLMProvider:
    """Factory function to create the appropriate LLM provider."""

    provider = provider.lower()

    if provider == "openai":
        key = api_key or os.getenv("OPENAI_API_KEY", "")
        mdl = model or os.getenv("LLM_MODEL", "gpt-4o-mini")
        if not key or key == "sk-xxx":
            logger.warning("No valid OpenAI API key — falling back to MockProvider")
            return MockProvider()
        return OpenAIProvider(api_key=key, model=mdl)

    elif provider == "anthropic":
        key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
        mdl = model or os.getenv("LLM_MODEL", "claude-3-haiku-20240307")
        if not key:
            logger.warning("No Anthropic API key — falling back to MockProvider")
            return MockProvider()
        return AnthropicProvider(api_key=key, model=mdl)

    elif provider == "ollama":
        host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        mdl = model or os.getenv("LLM_MODEL", "llama3")
        return OllamaProvider(host=host, model=mdl)

    else:
        logger.warning(f"Unknown provider '{provider}' — using MockProvider")
        return MockProvider()
