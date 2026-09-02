"""
Faculty endpoints:
  GET /api/faculty/dashboard             — portfolio stats, rows, needs-attention list
  GET /api/faculty/insights/{project_id} — AI-generated monitoring insights
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.insights_agent import compose as compose_insights
from app.api.projects import _owned_or_404
from app.core.deps import get_db, require_faculty
from app.models.user import User
from app.schemas.base import CamelModel
from app.schemas.faculty import FacultyDashboardOut
from app.services import faculty_service, project_service as svc

router = APIRouter(prefix="/faculty", tags=["faculty"])


class InsightsOut(CamelModel):
    insights: list[str]


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
