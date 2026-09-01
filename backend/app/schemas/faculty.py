from datetime import datetime

from app.schemas.base import CamelModel


class ProjectRow(CamelModel):
    id: str
    title: str
    student_name: str
    student_id: str
    domain: str
    progress: int
    phase: str
    status: str
    risk_level: str
    current_week: int
    duration_weeks: int
    delayed_tasks: int
    behind_plan: bool
    last_update: datetime


class Totals(CamelModel):
    students: int
    projects: int
    active: int
    completed: int
    delayed: int
    high_risk: int


class RiskCounts(CamelModel):
    low: int
    medium: int
    high: int


class FacultyDashboardOut(CamelModel):
    totals: Totals
    risk_counts: RiskCounts
    avg_progress: int
    projects: list[ProjectRow]
    attention: list[ProjectRow]
