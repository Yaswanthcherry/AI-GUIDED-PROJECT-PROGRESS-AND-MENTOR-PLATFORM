"""Doc Drafter — composes the 11 standard academic documents from live project data."""
from __future__ import annotations

import json
from typing import Any

from app.agents.llm import LLM, LLMUnavailableError, get_llm
from app.agents.prompts import DOC_SYSTEM
from app.schemas.document import DOC_TITLES


def _offline(ctx: dict[str, Any], doc_type: str) -> str:
    """Deterministic composer — grounds every section in the project's real blueprint."""
    b = ctx.get("blueprint") or {}
    ev, sc = b.get("evaluation", {}), b.get("scope", {})
    tech, arch = b.get("technology", []), b.get("architecture", {"layers": [], "dataFlow": []})
    risks = b.get("risks", [])
    inp = ctx.get("input", {})
    idea = inp.get("idea", "")
    ps = str(inp.get("problemStatement", "")).rstrip(".")
    features = sc.get("features", [])
    weeks, team = ctx.get("durationWeeks", 12), ctx.get("teamSize", 1)
    title = ctx.get("title", "the project")
    nl = "\n"

    if doc_type == "synopsis":
        return (
            f"### 1. Title\n{title}\n\n### 2. Introduction\n{idea}\n\n### 3. Problem Definition\n{ps}.\n\n"
            f"### 4. Objectives\n{nl.join(f'{i+1}. {o}' for i, o in enumerate(sc.get('objectives', [])))}\n\n"
            f"### 5. Methodology\nThe system follows a {len(arch.get('layers', []))}-layer architecture "
            f"({' → '.join(l.get('name', '') for l in arch.get('layers', []))}), implemented with "
            f"{' and '.join(t.get('pick', '') for t in tech[:2])}. Development proceeds in {weeks} weeks across planning, "
            "core development, integration and documentation phases.\n\n"
            f"### 6. Expected Outcomes\n{nl.join('- ' + d for d in sc.get('deliverables', [])[:4])}\n\n"
            f"### 7. Tools & Technologies\n{nl.join(f'- **{t.get(\"layer\",\"\")}:** {t.get(\"pick\",\"\")}' for t in tech)}"
        )
    if doc_type == "abstract":
        kw = ", ".join(t.get("pick", "").split(" ")[0] for t in tech[:3])
        return (
            f"### Abstract\n\n{ps}. This project presents **{title}**, a {ctx.get('domain','').lower()} system designed and "
            f"implemented within a {weeks}-week academic timeline by a {team}-member team.\n\nThe proposed system "
            f"{'; '.join(f.lower() for f in features[:3])}. It is built on {tech[0].get('pick','') if tech else 'the recommended stack'} "
            f"and {tech[1].get('pick','') if len(tech) > 1 else 'supporting services'}, organised as a "
            f"{len(arch.get('layers', []))}-layer architecture, and evaluated through a structured baseline comparison.\n\n"
            f"Preliminary planning indicates a feasibility score of {ev.get('scores', {}).get('feasibility', 'n/a')}/100 with "
            f"{str(ev.get('difficulty', 'moderate')).lower()} implementation difficulty. Key risks — including "
            f"{risks[0].get('risk', '').lower() if risks else 'external dependencies'} — are tracked with documented mitigations. "
            f"The outcome is a working prototype, complete documentation, and a reproducible evaluation.\n\n**Keywords:** {ctx.get('domain','')}, {kw}, academic project, prototype evaluation."
        )
    if doc_type == "literature-review":
        rows = nl.join(
            f"| {i+1} | [Cite {i+1}] — prior {ctx.get('domain','').lower()} systems | Establishes feasibility of {f.lower()[:60]}… | None evaluated in a campus context with this stack |"
            for i, f in enumerate(features[:4])
        )
        return (
            "### Literature Review (draft)\n\n**2.1 Related work**\n\n"
            "| # | Work / System | Relevance | Gap addressed by this project |\n|---|---|---|---|\n"
            f"{rows}\n\n**2.2 Research gap**\nExisting systems address the problem partially, but none combine "
            f"{' with '.join(f.lower() for f in features[:2])} under the constraints of an academic deployment (cost, "
            f"reproducibility, {weeks}-week delivery). This project fills that gap.\n\n"
            f"**2.3 Positioning**\nThe proposed system reuses proven components ({', '.join(t.get('pick','').split(' ')[0] for t in tech[:3])}) "
            "and contributes an integrated, evaluated prototype with open documentation.\n\n"
            "_Note: replace bracketed citations with 8–10 real references from IEEE Xplore / Google Scholar._"
        )
    if doc_type == "objectives":
        objs = sc.get("objectives", [])
        return (
            f"### Project Objectives\n\n**Primary objective**\n{objs[0] if objs else title}\n\n**Supporting objectives**\n"
            f"{nl.join(f'{i+2}. {o}' for i, o in enumerate(objs[1:]))}\n\n**Success criteria (measurable)**\n"
            f"{nl.join(f'- SC{i+1}: {n}' for i, n in enumerate(sc.get('nonFunctional', [])[:4]))}\n\n"
            f"**Stretch objectives (only if ahead of plan by week {round(weeks * 0.5)})**\n"
            f"{nl.join('- ' + f for f in features[4:6])}"
        )
    if doc_type == "problem-statement":
        return (
            f"### Problem Statement\n\n**Context.** {idea}\n\n**Problem.** {ps}.\n\n"
            "**Why it matters.** Without a systematic solution, the process remains manual, inconsistent and unmeasurable.\n\n"
            f"**Constraints.** Academic delivery within {weeks} weeks, team of {team}, {ctx.get('level','').lower()} scope, and:\n"
            f"{nl.join('- ' + n for n in sc.get('nonFunctional', [])[:3])}\n\n"
            f"**Deliverable response.** A prototype implementing: {'; '.join(f.lower() for f in features[:3])}."
        )
    if doc_type == "architecture":
        layers = nl.join(
            f"**Layer {i+1} — {l.get('name','')}.** Components: {', '.join(l.get('components', []))}."
            for i, l in enumerate(arch.get("layers", []))
        )
        flow = nl.join(f"{i+1}. {d}" for i, d in enumerate(arch.get("dataFlow", [])))
        t1 = tech[1] if len(tech) > 1 else {}
        t3 = tech[3] if len(tech) > 3 else {}
        return (
            f"### System Architecture\n\nThe system is organised as a **{len(arch.get('layers', []))}-layer architecture**.\n\n"
            f"{layers}\n\n**Request / data flow**\n{flow}\n\n**Key architectural decisions**\n"
            f"- {t1.get('pick','the backend pick')} chosen because: {t1.get('rationale','—')}\n"
            f"- {t3.get('pick','the data pick')} chosen because: {t3.get('rationale','—')}\n\n"
            "_Diagrams: generate the *UML* and *Flowchart* documents for the visual companion._"
        )
    if doc_type == "uml":
        comps = [c for l in arch.get("layers", []) for c in l.get("components", [])[:2]][:6]
        seq = nl.join(f"{i+1}. {d}" for i, d in enumerate(arch.get("dataFlow", [])))
        return (
            "### UML Views\n\n**Component view** — rendered above from the live architecture model.\n\n**Classes / modules (principal)**\n"
            f"{nl.join(f'- «component» **{c}**' for c in comps)}\n\n**Sequence (primary flow)**\n{seq}\n\n"
            "_Relationships: components communicate downward through well-defined interfaces; no cyclic dependencies between layers._"
        )
    if doc_type == "flowchart":
        gw = arch.get("layers", [{}])
        return (
            "### Process Flowchart\n\n**Primary flow rendered above.** Decision points:\n\n"
            f"- **D1** — input valid? No → return validation errors (Layer: {gw[1].get('name','API') if len(gw) > 1 else 'API'}).\n"
            "- **D2** — result acceptable? No → fallback path documented in risk mitigations.\n"
            "- **D3** — persist successful outcome and notify the user.\n\n"
            "**Entry conditions:** authenticated user, required fields present.\n**Exit conditions:** state persisted, response ≤ 2s (NFR-1)."
        )
    if doc_type == "report":
        return (
            "### Project Report — Skeleton\n\n"
            f"**1. Introduction** — context, motivation, {ps[:120]}…\n"
            "**2. Literature Review** — see *Literature Review* document (8–10 citations).\n"
            "**3. Objectives & Scope** — objectives (this pack), in-scope features:\n"
            f"{nl.join('   - ' + f for f in features)}\n"
            "**4. System Design** — architecture narrative + UML + flowchart (attached documents).\n"
            f"**5. Implementation** — stack: {'; '.join(f'{t.get(\"layer\",\"\")}: {t.get(\"pick\",\"\")}' for t in tech)}.\n"
            "**6. Testing & Results** — test matrix mapped to:\n"
            f"{nl.join('   - ' + n for n in sc.get('nonFunctional', [])[:3])}\n"
            f"**7. Risks & Limitations** — top risks: {'; '.join(r.get('risk','').lower() for r in risks[:2])}.\n"
            "**8. Conclusion & Future Work** — stretch features as future work.\n"
            "**References / Appendix A: Weekly log** — auto-filled from your Progress tab."
        )
    if doc_type == "ppt":
        return (
            "### Defence Presentation — 12 Slides\n\n"
            f"1. **Title** — {title} · {ctx.get('studentName','')} · guide & programme\n"
            f"2. **Problem** — one sentence: {ps[:110]}…\n"
            "3. **Why now / gap** — the research gap in one diagram\n"
            "4. **Objectives** — max 4, measurable\n"
            "5. **Solution overview** — the 30-second narrative\n"
            f"6. **Architecture** — {len(arch.get('layers', []))}-layer diagram\n"
            f"7. **Key tech decisions** — {' · '.join(t.get('pick','').split(' ')[0] for t in tech[:3])} and *why*\n"
            "8. **Live demo** — 3 minutes, happy path only\n"
            "9. **Results / evaluation** — the numbers that prove it works\n"
            "10. **Risks faced & mitigations** — honesty scores points\n"
            "11. **Limitations & future work** — the stretch features\n"
            "12. **Thank you / Q&A** — anticipate: feasibility, originality, personal contribution"
        )
    # user-manual
    t4 = tech[4] if len(tech) > 4 else {}
    docker = "docker" in t4.get("pick", "").lower()
    return (
        "### User Manual\n\n**1. System requirements**\n- Modern browser (Chrome/Firefox/Edge, last 2 versions)\n"
        f"- {tech[3].get('pick','Database') if len(tech) > 3 else 'Database'} reachable; see deployment notes\n\n"
        "**2. Installation (evaluator quick-start)**\n1. Clone the repository\n"
        f"2. `{('docker compose up' if docker else 'npm install && npm run dev')}`\n3. Load seed data (provided script)\n4. Open the printed URL\n\n"
        "**3. First steps**\n"
        f"{nl.join(f'{i+1}. {f} — available from the main navigation' for i, f in enumerate(features[:3]))}\n\n"
        "**4. Common tasks**\n"
        f"{nl.join(f'- Task {i+1}: {d}' for i, d in enumerate(arch.get('dataFlow', [])[:3]))}\n\n"
        "**5. Troubleshooting**\n- Service does not start → verify ports & environment variables in README\n"
        "- Slow responses → expected cold start < 5s on first request\n\n"
        "**6. Support** — repository issue tracker; response within 48h during the evaluation window."
    )


def generate(ctx: dict[str, Any], doc_type: str, llm: LLM | None = None) -> dict[str, Any]:
    """
    NOTEBOOK INTEGRATION POINT: swap in the notebook's document-generation
    prompt/chain here if it has one; the offline composer guarantees output.
    Returns {"title", "content", "diagram"?}.
    """
    llm = llm or get_llm()
    base_title = DOC_TITLES.get(doc_type, doc_type)
    title = f"{base_title} — {ctx.get('title', '')}".strip(" —")
    content = _offline(ctx, doc_type)
    try:
        user_prompt = (
            f"Document type: {base_title} ({doc_type}).\nProject JSON context:\n"
            + json.dumps({k: ctx.get(k) for k in ("title", "domain", "level", "teamSize", "durationWeeks", "input", "blueprint")}, default=str)[:7000]
        )
        refined = llm.complete_json(DOC_SYSTEM, user_prompt)
        if isinstance(refined.get("content"), str) and len(refined["content"]) > 200:
            content = refined["content"]
    except LLMUnavailableError:
        pass
    return {"title": title, "content": content, "diagram": doc_type if doc_type in ("flowchart", "uml") else None}
