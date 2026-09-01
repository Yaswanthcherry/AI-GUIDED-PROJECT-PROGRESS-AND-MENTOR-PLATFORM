"""Project + blueprint schemas. Field names mirror src/types/index.ts in the frontend."""
from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from app.schemas.base import CamelModel

Severity = Literal["Low", "Medium", "High"]
TaskStatus = Literal["pending", "in-progress", "done", "delayed"]
ProjectStatus = Literal["planning", "active", "completed", "delayed"]
RiskLevel = Literal["low", "medium", "high"]


# ---------------- input ----------------

class ProjectInput(CamelModel):
    title: str = Field(min_length=6, max_length=200)
    idea: str = Field(min_length=30)
    problem_statement: str = Field(min_length=20)
    domain: str
    technologies: str = ""
    team_size: int = Field(ge=1, le=8)
    duration_weeks: int = Field(ge=4, le=24)
    level: str
    notes: str | None = None


# ---------------- blueprint ----------------

class Scores(CamelModel):
    feasibility: int
    innovation: int
    academic_suitability: int


class IdeaEvaluation(CamelModel):
    scores: Scores
    difficulty: Literal["Low", "Moderate", "High"]
    estimated_duration: str
    verdict: Literal["Strong Go", "Go", "Go with caution", "Revise"]
    recommendation: str
    strengths: list[str]
    concerns: list[str]


class ScopeDefinition(CamelModel):
    objectives: list[str]
    deliverables: list[str]
    features: list[str]
    functional: list[str]
    non_functional: list[str]
    out_of_scope: list[str]


class TechPick(CamelModel):
    layer: str
    pick: str
    rationale: str
    alternative: str


class ArchLayer(CamelModel):
    name: str
    components: list[str]


class Architecture(CamelModel):
    layers: list[ArchLayer]
    data_flow: list[str]


class WeekPlan(CamelModel):
    week: int
    phase: str
    milestone: str
    tasks: list[str]


class RiskItem(CamelModel):
    id: str
    risk: str
    category: str
    severity: Severity
    probability: Severity
    mitigation: str


class Blueprint(CamelModel):
    evaluation: IdeaEvaluation
    scope: ScopeDefinition
    technology: list[TechPick]
    architecture: Architecture
    timeline: list[WeekPlan]
    risks: list[RiskItem]
    generated_at: datetime


# ---------------- tracked execution ----------------

class MilestoneOut(CamelModel):
    id: str
    title: str
    weeks: list[int]


class TaskOut(CamelModel):
    id: str
    title: str
    week: int
    milestone_id: str
    status: TaskStatus


class ActivityOut(CamelModel):
    id: str
    text: str
    ts: datetime
    kind: str


class TaskUpdate(CamelModel):
    status: TaskStatus


class ProjectOut(CamelModel):
    id: str
    title: str
    domain: str
    level: str
    student_name: str
    student_id: str
    team_size: int
    duration_weeks: int
    current_week: int
    progress: int
    phase: str
    status: ProjectStatus
    risk_level: RiskLevel
    next_task: str
    created_at: datetime
    last_update: datetime
    input: dict[str, Any]
    blueprint: Blueprint | None
    milestones: list[MilestoneOut]
    tasks: list[TaskOut]
    activity: list[ActivityOut]
