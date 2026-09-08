"""Risk Agent — severity × probability register with concrete mitigations."""
from __future__ import annotations

import json
from typing import Any

from app.agents import knowledge as kb
from app.agents.llm import LLM, LLMUnavailableError
from app.agents.prompts import RISK_SYSTEM

SEVERITIES = {"Low", "Medium", "High"}


def run(inp: dict[str, Any], timeline: dict[str, Any], llm: LLM) -> dict[str, Any]:
    """
    Analyzes project risks with severity and probability assessments.
    Returns {"risks": [ {"risk","category","severity","probability","mitigation"} ... ]}.
    """
    base = kb.offline_risks(inp)
    try:
        phases = sorted({w.get("phase") for w in timeline.get("timeline", [])})
        user_prompt = "Project input:\n" + json.dumps(
            {
                "title": inp.get("title"),
                "idea": inp.get("idea"),
                "domain": inp.get("domain"),
                "teamSize": inp.get("teamSize"),
                "durationWeeks": inp.get("durationWeeks"),
                "phases": phases,
                "notes": inp.get("notes"),
            },
            indent=2,
        )
        refined = llm.complete_json(RISK_SYSTEM, user_prompt)
        risks = refined.get("risks")
        if (
            isinstance(risks, list)
            and len(risks) >= 4
            and all(
                r.get("risk")
                and r.get("severity") in SEVERITIES
                and r.get("probability") in SEVERITIES
                and r.get("mitigation")
                for r in risks
            )
        ):
            base = {"risks": risks[:6]}
    except LLMUnavailableError:
        pass
    return base
