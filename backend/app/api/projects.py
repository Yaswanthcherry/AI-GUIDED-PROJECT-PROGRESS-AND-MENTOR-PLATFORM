"""
Project endpoints:
  POST   /api/projects                        — create + run the agent pipeline
  GET    /api/projects?scope=mine|all         — list
  GET    /api/projects/{id}                   — detail (full frontend shape)
  POST   /api/projects/{id}/blueprint/generate— re-run the orchestrator
  GET    /api/projects/{id}/blueprint         — blueprint only
  PATCH  /api/projects/{id}/tasks/{task_id}   — update a task status
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.agents.orchestrator import generate_blueprint
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.project import Blueprint, ProjectInput, ProjectOut, TaskUpdate
from app.services import project_service as svc

router = APIRouter(prefix="/projects", tags=["projects"])


def _owned_or_404(db: Session, project_id: str, user: User):
    project = svc.load_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role != "faculty" and project.student_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this project")
    return project


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(body: ProjectInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ProjectOut:
    """Student Project Idea -> Orchestrator -> specialist agents -> Blueprint -> tracked plan."""
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can create projects")
    input_json = body.model_dump(by_alias=True)
    blueprint, logs = generate_blueprint(input_json)
    project = svc.materialize_project(db, user, body, blueprint, logs)
    return svc.to_out(project)


@router.get("", response_model=list[ProjectOut])
def list_projects(
    scope: str = Query(default="mine", pattern="^(mine|all)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ProjectOut]:
    # 'all' is faculty-only; students always see only their own projects.
    if scope == "all" and user.role != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can list all projects")
    return [svc.to_out(p) for p in svc.list_projects(db, user)]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ProjectOut:
    return svc.to_out(_owned_or_404(db, project_id, user))


@router.post("/{project_id}/blueprint/generate", response_model=ProjectOut)
def regenerate_blueprint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ProjectOut:
    project = _owned_or_404(db, project_id, user)
    blueprint, logs = generate_blueprint(project.input)
    project.blueprint = blueprint
    project.agent_logs = logs
    project.generated_at = datetime.now(timezone.utc)
    project.risk_level = svc.risk_level_from(blueprint)
    svc.log_activity(db, project, "Blueprint regenerated — agent scores refreshed", kind="ai")
    return svc.to_out(project)


@router.get("/{project_id}/blueprint", response_model=Blueprint)
def get_blueprint(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Blueprint:
    project = _owned_or_404(db, project_id, user)
    if not project.blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not generated yet")
    return Blueprint.model_validate(project.blueprint)


@router.patch("/{project_id}/tasks/{task_id}", response_model=ProjectOut)
def update_task(
    project_id: str,
    task_id: str,
    body: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProjectOut:
    project = _owned_or_404(db, project_id, user)
    if user.role != "student" or project.student_id != user.id:
        raise HTTPException(status_code=403, detail="Only the owning student can update tasks")
    try:
        project = svc.update_task_status(db, project, task_id, body.status)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return svc.to_out(project)
