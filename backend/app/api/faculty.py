"""
Faculty endpoints:
  GET /api/faculty/dashboard             — portfolio stats, rows, needs-attention list
  GET /api/faculty/insights/{project_id} — AI-generated monitoring insights
  GET /api/faculty/{project_id}/feedback — list feedback for a project
  POST /api/faculty/{project_id}/feedback — send feedback/recommendation/task suggestion
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.insights_agent import compose as compose_insights
from app.api.projects import _owned_or_404
from app.core.deps import get_db, require_faculty
from app.models.feedback import FacultyFeedback
from app.models.user import User
from app.schemas.base import CamelModel
from app.schemas.faculty import FacultyDashboardOut
from app.schemas.feedback import FacultyFeedbackIn, FacultyFeedbackListOut, FacultyFeedbackOut
from app.services import faculty_service, project_service as svc

router = APIRouter(prefix="/faculty", tags=["faculty"])


class InsightsOut(CamelModel):
    insights: list[str]


def _feedback_out(feedback: FacultyFeedback) -> FacultyFeedbackOut:
    return FacultyFeedbackOut(
        id=feedback.id,
        project_id=feedback.project_id,
        faculty_id=feedback.faculty_id,
        faculty_name=feedback.faculty.name,
        type=feedback.type,
        content=feedback.content,
        related_task_id=feedback.related_task_id,
        created_at=feedback.created_at,
    )


@router.get("/dashboard", response_model=FacultyDashboardOut)
def dashboard(db: Session = Depends(get_db), _: User = Depends(require_faculty)) -> FacultyDashboardOut:
    return faculty_service.dashboard(db)


@router.get("/insights/{project_id}", response_model=InsightsOut)
def insights(project_id: str, db: Session = Depends(get_db), user: User = Depends(require_faculty)) -> InsightsOut:
    project = _owned_or_404(db, project_id, user)
    try:
        return InsightsOut(insights=compose_insights(svc.to_context(project)))
    except Exception as exc:  # never break the monitoring view
        raise HTTPException(status_code=502, detail=f"Insight service failed: {exc}") from exc


@router.get("/{project_id}/feedback", response_model=FacultyFeedbackListOut)
def list_feedback(project_id: str, db: Session = Depends(get_db), user: User = Depends(require_faculty)) -> FacultyFeedbackListOut:
    _owned_or_404(db, project_id, user)
    feedback = db.query(FacultyFeedback).filter(FacultyFeedback.project_id == project_id).order_by(FacultyFeedback.created_at.desc()).all()
    return FacultyFeedbackListOut(feedback=[_feedback_out(f) for f in feedback])


@router.post("/{project_id}/feedback", response_model=FacultyFeedbackOut, status_code=201)
def send_feedback(project_id: str, body: FacultyFeedbackIn, db: Session = Depends(get_db), user: User = Depends(require_faculty)) -> FacultyFeedbackOut:
    _owned_or_404(db, project_id, user)
    feedback = FacultyFeedback(
        id=str(uuid.uuid4()),
        project_id=project_id,
        faculty_id=user.id,
        type=body.type,
        content=body.content,
        related_task_id=body.related_task_id,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return _feedback_out(feedback)
