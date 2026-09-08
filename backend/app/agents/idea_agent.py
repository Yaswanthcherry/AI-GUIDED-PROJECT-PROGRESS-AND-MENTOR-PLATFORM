"""Idea Agent — feasibility / innovation / academic-fit scoring and verdict."""
from __future__ import annotations

import json
from typing import Any

from app.agents import knowledge as kb
from app.agents.llm import LLM, LLMUnavailableError
from app.agents.prompts import IDEA_SYSTEM

_REQUIRED = {"scores", "difficulty", "estimatedDuration", "verdict", "recommendation", "strengths", "concerns"}


def run(inp: dict[str, Any], llm: LLM) -> dict[str, Any]:
    """
    Evaluates project idea feasibility, innovation, and academic fit.
    Returns structured scores and recommendations for the project.
    """
    base = kb.offline_evaluation(inp)
    try:
        user_prompt = "Project idea:\n" + json.dumps(
            {
                "title": inp.get("title"),
                "idea": inp.get("idea"),
                "problemStatement": inp.get("problemStatement"),
                "domain": inp.get("domain"),
                "teamSize": inp.get("teamSize"),
                "durationWeeks": inp.get("durationWeeks"),
                "academicLevel": inp.get("level"),
                "currentTechnologies": inp.get("technologies"),
            },
            indent=2,
        )
        refined = llm.complete_json(IDEA_SYSTEM, user_prompt)
        if (
            _REQUIRED.issubset(refined.keys())
            and isinstance(refined.get("scores"), dict)
            and refined.get("difficulty") in {"Low", "Moderate", "High"}
            and refined.get("verdict") in {"Strong Go", "Go", "Go with caution", "Revise"}
            and isinstance(refined.get("strengths"), list)
            and isinstance(refined.get("concerns"), list)
        ):
            scores = refined["scores"]
            if all(k in scores for k in ("feasibility", "innovation", "academicSuitability")):
                base = refined  # accept the model's full evaluation
    except LLMUnavailableError:
        pass
    return base
