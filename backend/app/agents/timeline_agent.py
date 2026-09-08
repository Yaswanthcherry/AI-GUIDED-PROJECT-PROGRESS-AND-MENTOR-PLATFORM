"""Timeline Agent — week-by-week plan with phases, milestones and tasks."""
from __future__ import annotations

import json
from typing import Any

from app.agents import knowledge as kb
from app.agents.llm import LLM, LLMUnavailableError
from app.agents.prompts import TIMELINE_SYSTEM

VALID_PHASES = {"Planning & Design", "Core Development", "Integration & Testing", "Documentation", "Submission & Demo"}


def run(inp: dict[str, Any], llm: LLM) -> dict[str, Any]:
    """
    Generates a week-by-week timeline plan with phases and milestones.
    Returns {"timeline": [ {"week","phase","milestone","tasks":[...]} ... ]}.
    """
    base = kb.offline_timeline(inp)
    weeks_total = int(inp.get("durationWeeks", 12))
    try:
        user_prompt = "Project input:\n" + json.dumps(
            {
                "title": inp.get("title"),
                "domain": inp.get("domain"),
                "teamSize": inp.get("teamSize"),
                "durationWeeks": weeks_total,
                "academicLevel": inp.get("level"),
            },
            indent=2,
        )
        refined = llm.complete_json(TIMELINE_SYSTEM, user_prompt)
        timeline = refined.get("timeline")
        if (
            isinstance(timeline, list)
            and len(timeline) == weeks_total
            and all(
                isinstance(w, dict)
                and w.get("phase") in VALID_PHASES
                and isinstance(w.get("tasks"), list)
                and w.get("tasks")
                and w.get("milestone")
                for w in timeline
            )
        ):
            base = {
                "timeline": [
                    dict(w, week=i + 1, tasks=[str(t) for t in w.get("tasks", [])], milestone=str(w.get("milestone")))
                    for i, w in enumerate(timeline)
                ]
            }
    except LLMUnavailableError:
        pass
    return base
