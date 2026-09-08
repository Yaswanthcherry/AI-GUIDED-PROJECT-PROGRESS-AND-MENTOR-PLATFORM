"""Progress Agent — recommendations after each progress update / on demand."""
from __future__ import annotations

import json
from typing import Any

from app.agents.llm import LLM, LLMUnavailableError, get_llm
from app.agents.prompts import PROGRESS_SYSTEM


def _offline(ctx: dict[str, Any]) -> list[str]:
    week = ctx.get("currentWeek", 1)
    total = max(ctx.get("durationWeeks", 12), 1)
    progress = ctx.get("progress", 0)
    planned = round((week / total) * 100)
    delayed = [t for t in ctx.get("tasks", []) if t.get("status") == "delayed"]
    risks = (ctx.get("blueprint") or {}).get("risks", [])
    recs: list[str] = []
    if progress < planned - 8:
        recs.append(
            f"Progress ({progress}%) is trailing the week-{week} plan ({planned}%). Drop one stretch feature and re-baseline the next two weeks."
        )
    if delayed:
        names = ", ".join(f'"{t.get("title", "")}"' for t in delayed)
        recs.append(
            f"{len(delayed)} delayed task(s) ({names}) — time-box {'them' if len(delayed) > 1 else 'it'} to this week or move to the v2 list."
        )
    if risks:
        recs.append(
            f'Top risk "{risks[0].get("risk", "").lower()}" is still open — schedule its mitigation as a task before week {min(total, week + 2)}.'
        )
    if week >= total * 0.6:
        recs.append("You are past the midpoint — start the report skeleton now; documentation weeks compress more than development weeks do.")
    else:
        recs.append("Keep Friday demos: a 10-minute weekly walkthrough keeps the guide aligned and surfaces scope drift early.")
    return recs[:4]


def recommend(ctx: dict[str, Any], llm: LLM | None = None) -> list[str]:
    """
    Generates progress recommendations based on current project status.
    Provides coaching advice for staying on track with timeline.
    """
    llm = llm or get_llm()
    try:
        user_prompt = "Project state (JSON):\n" + json.dumps(
            {k: ctx.get(k) for k in ("title", "progress", "phase", "currentWeek", "durationWeeks", "riskLevel", "nextTask", "tasks")},
            default=str,
        )[:6000]
        refined = llm.complete_json(PROGRESS_SYSTEM, user_prompt)
        recs = refined.get("recommendations")
        if isinstance(recs, list) and recs and all(isinstance(r, str) for r in recs):
            return [str(r) for r in recs[:4]]
    except LLMUnavailableError:
        pass
    return _offline(ctx)
