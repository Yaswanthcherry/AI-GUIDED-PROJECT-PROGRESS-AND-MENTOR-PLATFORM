"""
Agent layer.

Pipeline: Orchestrator -> Idea Agent -> Scope Agent -> Technology Agent
        -> Timeline Agent -> Risk Agent -> Blueprint
Plus: Doc Drafter, Mentor (chat), Progress Agent, Insights Agent.

Each agent tries the configured LLM (OpenAI via LangChain, or Hugging Face),
validates the JSON shape, and falls back to the deterministic composer in
knowledge.py — so the API always returns a valid blueprint.
"""
