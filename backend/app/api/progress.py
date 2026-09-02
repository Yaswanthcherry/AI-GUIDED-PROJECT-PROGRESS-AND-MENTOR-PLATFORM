"""
Progress tracking:
  GET  /api/projects/{id}/progress          — summary (percent, counts, week load, milestones, recommendations)
  POST /api/projects/{id}/progress          — update one task {taskId, status}
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.projects import _owned_or_404
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.base import CamelModel
from app.schemas.project import ProjectOut, TaskStatus
from app.schemas.progress import ProgressOut
from app.services import project_service as svc

router = APIRouter(prefix="/projects", tags=["progress"])


class ProgressUpdateRequest(CamelModel):
    task_id: str
    status: TaskStatus


@router.get("/{project_id}/progress", response_model=ProgressOut)
def get_progress(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ProgressOut:
    project = _owned_or_404(db, project_id, user)
    return svc.progress_summary(project)


@router.post("/{project_id}/progress", response_model=ProjectOut)
def update_progress(
    project_id: str,
    body: ProgressUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProjectOut:
    project = _owned_or_404(db, project_id, user)
    if user.role != "student" or project.student_id != user.id:
        raise HTTPException(status_code=403, detail="Only the owning student can update progress")
    try:
        project = svc.update_task_status(db, project, body.task_id, body.status)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return svc.to_out(project)
