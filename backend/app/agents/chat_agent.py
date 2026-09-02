"""Mentor agent — conversational guidance grounded in the project's live JSON context."""
from __future__ import annotations

import json
import re
from typing import Any

from app.agents.llm import LLM, LLMUnavailableError, get_llm
from app.agents.prompts import MENTOR_SYSTEM


def _offline(ctx: dict[str, Any], question: str) -> dict[str, str]:
    q = question.lower()
    b = ctx.get("blueprint") or {}
    week = ctx.get("currentWeek", 1)
    total = ctx.get("durationWeeks", 12)
    progress = ctx.get("progress", 0)
    planned = round((week / max(total, 1)) * 100)
    tasks = ctx.get("tasks", [])
    week_tasks = [t for t in tasks if t.get("week") == week]
    done = [t for t in tasks if t.get("status") == "done"]
    delayed = [t for t in tasks if t.get("status") == "delayed"]
    risks = b.get("risks", [])
    tech = b.get("technology", [])
    scope = b.get("scope", {})
    arch = b.get("architecture", {"layers": [], "dataFlow": []})
    timeline = b.get("timeline", [])
    current = next((w for w in timeline if w.get("week") == week), {})
    on_track = progress >= planned - 5

    if re.search(r"(week|priority|work on|next|focus)", q):
        lines = "\n".join(
            f"- {'~~' if t['status']=='done' else ''}**{t['title']}**{'~~ _(done)_' if t['status']=='done' else ' _(in progress)_' if t['status']=='in-progress' else ''}"
            for t in week_tasks
        )
        return {
            "agent": "Planner Agent",
            "content": (
                f"You are in **Week {week} of {total}** ({current.get('phase', ctx.get('phase',''))}). This week's plan:\n\n{lines or '- (no tasks listed for this week)'}\n\n"
                f"Start with **{ctx.get('nextTask','the next pending task')}**. Overall you are at **{progress}%** ({len(done)}/{len(tasks)} tasks), "
                f"which is {'on track' if on_track else 'slightly behind schedule — close two pending tasks before Friday'}."
            ),
        }
    if re.search(r"(why|technology|tech|stack|framework|recommend)", q):
        picks = "\n".join(f"- **{t.get('layer','')}: {t.get('pick','')}** — {t.get('rationale','')}" for t in tech[:3])
        return {
            "agent": "Tech Scout",
            "content": (
                f"I optimised your stack for **a {ctx.get('teamSize',1)}-person team, {total} weeks, and evaluator reproducibility**.\n\n{picks}\n\n"
                "The full rationale (with alternatives) is in your **Technology Recommendation** tab."
            ),
        }
    if re.search(r"(risk|threat|issue|worry|danger)", q):
        lines = "\n".join(
            f"- **{r.get('risk','')}** ({r.get('severity','')} severity, {r.get('probability','')} probability) → {r.get('mitigation','')}"
            for r in risks[:3]
        )
        return {
            "agent": "Risk Analyst",
            "content": f"Your register holds **{len(risks)} risks**. Act on these this week:\n\n{lines}\n\nOverall exposure is **{ctx.get('riskLevel','low')}**.",
        }
    if re.search(r"(scope|improve|refine|feature|requirement)", q):
        return {
            "agent": "Scope Agent",
            "content": (
                f"Three ways to sharpen the scope of **{ctx['title']}**:\n\n"
                f"- **Cut to an MVP line.** Committed features: {'; '.join(scope.get('features', [])[:3])}… the rest are stretch.\n"
                "- **Make evaluation first-class.** A baseline comparison is what examiners grade.\n"
                f"- **Guard the boundary.** Out of scope: {'; '.join(scope.get('outOfScope', [])[:2]).lower()}."
            ),
        }
    if re.search(r"(document|report|synopsis|ppt|abstract|manual|literature)", q):
        return {
            "agent": "Doc Drafter",
            "content": (
                "I can draft any of the 11 standard documents from your live project data — synopsis, abstract, literature review, "
                "objectives, problem statement, architecture, UML, flowchart, report skeleton, PPT outline, or user manual.\n\n"
                "Open the **Documentation Generator** tab and pick one; each draft pulls your real scope, stack and risks."
            ),
        }
    if re.search(r"(architecture|design|diagram|uml|flow)", q):
        layers = "\n".join(f"- **{l.get('name','')}** — {', '.join(l.get('components', []))}" for l in arch.get("layers", []))
        return {
            "agent": "Architecture Planner",
            "content": f"Your system is organised in **{len(arch.get('layers', []))} layers**:\n\n{layers}\n\nRequest path: {(arch.get('dataFlow') or [''])[0]}",
        }
    if re.search(r"(timeline|schedule|deadline|delay|behind|exam)", q):
        phases = " → ".join(dict.fromkeys(w.get("phase", "") for w in timeline))
        note = (
            f"⚠ **{len(delayed)} delayed task(s)**: {'; '.join(t['title'] for t in delayed)}. Re-sequence them into this week."
            if delayed
            else "No delays recorded — keep the Friday demo habit and the plan will hold."
        )
        return {
            "agent": "Planner Agent",
            "content": f"The {total}-week plan runs: **{phases}**. You are in *{current.get('phase', ctx.get('phase',''))}* (week {week}).\n\n{note}",
        }
    if re.search(r"(progress|status|how am i|tracking)", q):
        return {
            "agent": "Mentor",
            "content": (
                f"**{ctx['title']}** is at **{progress}%** — {len(done)}/{len(tasks)} tasks done, in *{ctx.get('phase','')}* (week {week}/{total}).\n\n"
                f"Next: **{ctx.get('nextTask','')}**. Risk exposure: **{ctx.get('riskLevel','low')}**."
            ),
        }
    if re.search(r"^(hi|hello|hey|help|start)\b", q) and len(q) < 25:
        return {
            "agent": "Mentor",
            "content": (
                f"Hello — I have the full context of **{ctx['title']}** (blueprint, scope, stack, {len(risks)} risks, {len(tasks)} tasks).\n\n"
                "Ask me things like:\n- \"What should I work on this week?\"\n- \"Why did you recommend this technology?\"\n- \"What are the biggest risks right now?\""
            ),
        }
    return {
        "agent": "Mentor",
        "content": (
            f"Here is your situation for **{ctx['title']}**:\n\n- **Progress:** {progress}% ({len(done)}/{len(tasks)} tasks) — "
            f"{'on the planned curve' if on_track else 'slightly behind the curve'}.\n"
            f"- **Now:** week {week}, *{ctx.get('phase','')}*. Next task: **{ctx.get('nextTask','')}**.\n"
            f"- **Watch:** {(risks[0].get('risk','').lower() if risks else 'external dependencies')}.\n\n"
            "I work best with concrete questions — try \"What should I work on this week?\" or \"What are the risks in my project?\"."
        ),
    }


def reply(ctx: dict[str, Any], question: str, llm: LLM | None = None) -> dict[str, str]:
    """
    NOTEBOOK INTEGRATION POINT: replace the LLM call with the notebook's chat
    prompt/chain if it has one; the offline composer below guarantees an answer.
    """
    llm = llm or get_llm()
    try:
        user_prompt = (
            f"Student question: {question}\n\nLive project context (JSON):\n"
            + json.dumps(
                {k: ctx.get(k) for k in ("title", "domain", "progress", "phase", "currentWeek", "durationWeeks", "riskLevel", "nextTask", "tasks", "blueprint")},
                default=str,
            )[:7000]
        )
        refined = llm.complete_json(MENTOR_SYSTEM, user_prompt)
        if isinstance(refined.get("content"), str) and refined["content"].strip():
            return {"content": refined["content"], "agent": str(refined.get("agent", "Mentor"))}
    except LLMUnavailableError:
        pass
    return _offline(ctx, question)
