"""
LLM provider abstraction.

Priority (LLM_PROVIDER=auto): OpenAI (LangChain) -> Hugging Face -> offline.
`complete_json` always asks the model for strict JSON and parses it; any
failure raises LLMUnavailableError so agents can fall back to their
deterministic composers. API keys come from the environment only.
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from typing import Any

from app.core.config import settings


class LLMUnavailableError(RuntimeError):
    """Raised when no provider is configured or the provider call/parse fails."""


def _extract_json(text: str) -> dict[str, Any]:
    """Pull the first JSON object out of a model response (handles code fences)."""
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1)
    else:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise LLMUnavailableError("Model response contained no JSON object")
        cleaned = cleaned[start : end + 1]
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise LLMUnavailableError(f"Model JSON could not be parsed: {exc}") from exc
    if not isinstance(data, dict):
        raise LLMUnavailableError("Model JSON was not an object")
    return data


class LLM:
    def __init__(self, provider: str) -> None:
        self.provider = provider
        self._client: Any = None

    def _openai(self) -> Any:
        if self._client is None:
            from langchain_openai import ChatOpenAI

            self._client = ChatOpenAI(
                model=settings.openai_model,
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
                api_key=settings.openai_api_key,
            )
        return self._client

    def _hf(self) -> Any:
        if self._client is None:
            from langchain_community.llms import HuggingFaceEndpoint

            self._client = HuggingFaceEndpoint(
                repo_id=settings.hf_model,
                huggingfacehub_api_token=settings.huggingface_api_key,
                temperature=settings.llm_temperature,
                max_new_tokens=settings.llm_max_tokens,
            )
        return self._client

    def complete_json(self, system: str, user: str) -> dict[str, Any]:
        """Send system+user prompts, expect a JSON object back."""
        if self.provider == "offline":
            raise LLMUnavailableError("LLM provider is 'offline'")
        try:
            if self.provider == "openai":
                from langchain_core.messages import HumanMessage, SystemMessage

                resp = self._openai().invoke([SystemMessage(content=system), HumanMessage(content=user)])
                text = resp.content if isinstance(resp.content, str) else str(resp.content)
            else:  # huggingface
                prompt = f"<s>[INST] {system}\n\n{user}\n\nRespond with ONLY a valid JSON object. [/INST]"
                text = self._hf().invoke(prompt)
        except LLMUnavailableError:
            raise
        except Exception as exc:  # network / auth / quota / model errors
            raise LLMUnavailableError(f"{self.provider} provider failed: {exc}") from exc
        return _extract_json(text)


@lru_cache
def get_llm() -> LLM:
    return LLM(settings.resolved_llm_provider)
