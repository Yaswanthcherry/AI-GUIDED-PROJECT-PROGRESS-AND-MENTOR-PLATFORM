"""
AI Orchestrator — the pipeline as a service:

    Project Idea -> Idea Agent -> Scope Agent -> Technology Agent
                 -> Timeline Agent -> Risk Agent -> Blueprint

Runs agents sequentially (each sees upstream output), records per-agent
provenance, and returns a frontend-ready blueprint dict (camelCase).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.agents import idea_agent, risk_agent, scope_agent, technology_agent, timeline_agent
from app.agents import knowledge as kb
from app.agents.llm import LLM, get_llm


def generate_blueprint(inp: dict[str, Any], llm: LLM | None = None) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    llm = llm or get_llm()
    provider = llm.provider
    logs: list[dict[str, Any]] = []

    def step(name: str, fn: Any, *args: Any) -> Any:
        out = fn(*args, llm)
        logs.append({"agent": name, "provider": provider, "ts": datetime.now(timezone.utc).isoformat()})
        return out

    evaluation = step("Idea Agent", idea_agent.run, inp)
    scope = step("Scope Agent", scope_agent.run, inp, evaluation)
    tech = step("Technology Agent", technology_agent.run, inp, scope)
    timeline = step("Timeline Agent", timeline_agent.run, inp)
    risks = step("Risk Agent", risk_agent.run, inp, timeline)

    # Normalise contract fields a model may omit, so serialization never fails.
    for t in tech["technology"]:
        t.setdefault("layer", "Stack")
        t.setdefault("rationale", "Recommended by the Technology Agent.")
        t.setdefault("alternative", "—")
    arch = tech["architecture"]
    arch.setdefault("dataFlow", [])
    for layer in arch.get("layers", []):
        layer.setdefault("components", [])
    for r in risks["risks"]:
        r.setdefault("id", kb.new_id())
        r.setdefault("category", "General")

    blueprint = {
        "evaluation": evaluation,
        "scope": scope,
        "technology": tech["technology"],
        "architecture": tech["architecture"],
        "timeline": timeline["timeline"],
        "risks": risks["risks"],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    return blueprint, logs
