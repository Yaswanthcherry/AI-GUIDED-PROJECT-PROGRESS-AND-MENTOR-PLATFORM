"""Faculty aggregation services."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.project import Project, Task
from app.models.user import User
from app.schemas.faculty import FacultyDashboardOut, ProjectRow, RiskCounts, Totals


def _row(p: Project, delayed_tasks: int) -> ProjectRow:
    planned = round((p.current_week / max(p.duration_weeks, 1)) * 100)
    return ProjectRow(
        id=p.id,
        title=p.title,
        student_name=p.student.name if p.student else "",
        student_id=p.student_id,
        domain=p.domain,
        progress=p.progress,
        phase=p.phase,
        status=p.status,
        risk_level=p.risk_level,
        current_week=p.current_week,
        duration_weeks=p.duration_weeks,
        delayed_tasks=delayed_tasks,
        behind_plan=p.progress < planned - 5,
        last_update=p.last_update,
    )


def dashboard(db: Session) -> FacultyDashboardOut:
    projects = list(
        db.scalars(select(Project).options(selectinload(Project.student)).order_by(Project.created_at.desc()))
    )
    students = db.scalar(select(func.count()).select_from(User).where(User.role == "student")) or 0

    delayed_counts: dict[str, int] = dict(
        db.execute(select(Task.project_id, func.count()).where(Task.status == "delayed").group_by(Task.project_id)).all()
    )

    rows = [_row(p, delayed_counts.get(p.id, 0)) for p in projects]

    def severity(r: ProjectRow) -> int:
        score = 0
        if r.status == "delayed":
            score += 3
        if r.risk_level == "high":
            score += 2
        elif r.risk_level == "medium":
            score += 1
        if r.behind_plan:
            score += 1
        score += r.delayed_tasks
        return score

    attention = sorted([r for r in rows if severity(r) > 0], key=severity, reverse=True)[:6]

    return FacultyDashboardOut(
        totals=Totals(
            students=int(students),
            projects=len(rows),
            active=sum(1 for r in rows if r.status in ("active", "planning")),
            completed=sum(1 for r in rows if r.status == "completed"),
            delayed=sum(1 for r in rows if r.status == "delayed"),
            high_risk=sum(1 for r in rows if r.risk_level == "high"),
        ),
        risk_counts=RiskCounts(
            low=sum(1 for r in rows if r.risk_level == "low"),
            medium=sum(1 for r in rows if r.risk_level == "medium"),
            high=sum(1 for r in rows if r.risk_level == "high"),
        ),
        avg_progress=round(sum(r.progress for r in rows) / len(rows)) if rows else 0,
        projects=rows,
        attention=attention,
    )
