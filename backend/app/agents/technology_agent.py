"""Technology Agent — layer-by-layer stack picks plus the layered architecture."""
from __future__ import annotations

import json
from typing import Any

from app.agents import knowledge as kb
from app.agents.llm import LLM, LLMUnavailableError
from app.agents.prompts import TECH_SYSTEM

_REQUIRED = {"technology", "architecture"}


def run(inp: dict[str, Any], scope: dict[str, Any], llm: LLM) -> dict[str, Any]:
    """
    NOTEBOOK INTEGRATION POINT: swap in the notebook's stack-selection logic here.
    Returns {"technology": [...], "architecture": {"layers": [...], "dataFlow": [...]}}.
    """
    base = kb.offline_technology(inp)
    try:
        user_prompt = "Project input:\n" + json.dumps(
            {
                "title": inp.get("title"),
                "domain": inp.get("domain"),
                "currentTechnologies": inp.get("technologies"),
                "teamSize": inp.get("teamSize"),
                "durationWeeks": inp.get("durationWeeks"),
                "features": scope.get("features", [])[:6],
                "nonFunctional": scope.get("nonFunctional", [])[:3],
            },
            indent=2,
        )
        refined = llm.complete_json(TECH_SYSTEM, user_prompt)
        if _REQUIRED.issubset(refined.keys()):
            tech, arch = refined["technology"], refined["architecture"]
            if isinstance(tech, list) and tech and isinstance(arch, dict) and arch.get("layers"):
                base = {"technology": tech, "architecture": arch}
    except LLMUnavailableError:
        pass
    return base
