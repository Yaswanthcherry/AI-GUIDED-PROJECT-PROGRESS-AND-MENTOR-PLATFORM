"""Monitoring analyst — AI-generated faculty insights for one project."""
from __future__ import annotations

import json
from typing import Any

from app.agents.llm import LLM, LLMUnavailableError, get_llm
from app.agents.prompts import INSIGHTS_SYSTEM


def compose(ctx: dict[str, Any], llm: LLM | None = None) -> list[str]:
    """
    NOTEBOOK INTEGRATION POINT: swap in the notebook's insight logic if present.
    """
    llm = llm or get_llm()
    try:
        user_prompt = "Project state (JSON):\n" + json.dumps(
            {k: ctx.get(k) for k in ("title", "studentName", "progress", "phase", "status", "currentWeek", "durationWeeks", "riskLevel", "tasks", "blueprint")},
            default=str,
        )[:6000]
        refined = llm.complete_json(INSIGHTS_SYSTEM, user_prompt)
        ins = refined.get("insights")
        if isinstance(ins, list) and len(ins) >= 3 and all(isinstance(i, str) for i in ins):
            return [str(i) for i in ins[:6]]
    except LLMUnavailableError:
        pass
    return _offline(ctx)


def _offline(ctx: dict[str, Any]) -> list[str]:
    week = ctx.get("currentWeek", 1)
    total = max(ctx.get("durationWeeks", 12), 1)
    progress = ctx.get("progress", 0)
    planned = round((week / total) * 100)
    tasks = ctx.get("tasks", [])
    delayed = [t for t in tasks if t.get("status") == "delayed"]
    risks = (ctx.get("blueprint") or {}).get("risks", [])
    high = [r for r in risks if r.get("severity") == "High"]
    out = [
        (
            f"On track: {progress}% delivered against a {planned}% plan at week {week}/{total}."
            if progress >= planned - 5
            else f"Behind plan: {progress}% delivered against {planned}% expected at week {week}/{total}. A re-baseline conversation is recommended within 7 days."
        )
    ]
    if delayed:
        out.append(
            f"{len(delayed)} task(s) currently delayed ({', '.join(t.get('title', '') for t in delayed[:3])}). "
            f"Pattern suggests under-estimation of integration work in the {ctx.get('phase', 'current')} phase."
        )
    if high:
        out.append("High-severity risks open: " + "; ".join(r.get("risk", "").lower() for r in high) + ". Verify mitigations are scheduled.")
    out.append(
        "Documentation readiness: student is past 60% — nudge report drafting now to avoid an end-semester crunch."
        if progress >= 60
        else "Documentation readiness: too early to press; ensure the synopsis and objectives are frozen first."
    )
    out.append(
        "Flagged delayed at portfolio level — consider a mid-week check-in rather than the usual weekly cadence."
        if ctx.get("status") == "delayed"
        else "Engagement signal healthy: activity log is current."
    )
    return out
