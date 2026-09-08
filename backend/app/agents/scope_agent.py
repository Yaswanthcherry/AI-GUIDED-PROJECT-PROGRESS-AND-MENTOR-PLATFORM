"""Scope Agent — objectives, deliverables, features, FR/NFR, out-of-scope."""
from __future__ import annotations

import json
from typing import Any

from app.agents import knowledge as kb
from app.agents.llm import LLM, LLMUnavailableError
from app.agents.prompts import SCOPE_SYSTEM

_REQUIRED = {"objectives", "deliverables", "features", "functional", "nonFunctional", "outOfScope"}


def run(inp: dict[str, Any], evaluation: dict[str, Any], llm: LLM) -> dict[str, Any]:
    """
    Defines project scope including objectives, deliverables, and requirements.
    Returns structured scope data with functional and non-functional specs.
    """
    base = kb.offline_scope(inp)
    try:
        user_prompt = "Project input:\n" + json.dumps(
            {
                "title": inp.get("title"),
                "idea": inp.get("idea"),
                "problemStatement": inp.get("problemStatement"),
                "domain": inp.get("domain"),
                "teamSize": inp.get("teamSize"),
                "durationWeeks": inp.get("durationWeeks"),
                "academicLevel": inp.get("level"),
                "evaluationVerdict": evaluation.get("verdict"),
                "evaluationConcerns": evaluation.get("concerns"),
            },
            indent=2,
        )
        refined = llm.complete_json(SCOPE_SYSTEM, user_prompt)
        if _REQUIRED.issubset(refined.keys()) and all(isinstance(refined[k], list) and refined[k] for k in _REQUIRED):
            base = refined
    except LLMUnavailableError:
        pass
    return base
