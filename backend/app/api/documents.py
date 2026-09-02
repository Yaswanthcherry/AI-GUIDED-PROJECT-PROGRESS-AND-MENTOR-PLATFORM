"""
Documentation generator:
  GET  /api/projects/{id}/docs                  — list generated docs (frontend)
  POST /api/projects/{id}/docs                  — generate one doc type (frontend)
  POST /api/projects/{id}/documents/generate    — spec alias, same handler
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.doc_agent import generate as doc_generate
from app.api.projects import _owned_or_404
from app.core.deps import get_current_user, get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocGenerateRequest, DocOut
from app.services import project_service as svc

router = APIRouter(prefix="/projects", tags=["documents"])


def _out(d: Document) -> DocOut:
    return DocOut(id=d.id, type=d.type, title=d.title, content=d.content, diagram=d.diagram, generated_at=d.generated_at)


@router.get("/{project_id}/docs", response_model=list[DocOut])
def list_docs(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[DocOut]:
    project = _owned_or_404(db, project_id, user)
    return [_out(d) for d in project.documents]


def _generate(project_id: str, body: DocGenerateRequest, db: Session, user: User) -> DocOut:
    project = _owned_or_404(db, project_id, user)
    result = doc_generate(svc.to_context(project), body.type)

    # Upsert: regenerating a type replaces the previous draft.
    existing = next((d for d in project.documents if d.type == body.type), None)
    now = datetime.now(timezone.utc)
    if existing is not None:
        existing.title = result["title"]
        existing.content = result["content"]
        existing.diagram = result.get("diagram")
        existing.generated_at = now
        doc = existing
    else:
        doc = Document(
            id=str(uuid.uuid4()),
            project_id=project.id,
            type=body.type,
            title=result["title"],
            content=result["content"],
            diagram=result.get("diagram"),
            generated_at=now,
        )
        db.add(doc)
    svc.log_activity(db, project, f"Doc Drafter generated: {result['title']}", kind="ai")
    db.refresh(doc)
    return _out(doc)


@router.post("/{project_id}/docs", response_model=DocOut, status_code=201)
def generate_doc(project_id: str, body: DocGenerateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> DocOut:
    return _generate(project_id, body, db, user)


@router.post("/{project_id}/documents/generate", response_model=DocOut, status_code=201)
def generate_doc_alias(project_id: str, body: DocGenerateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> DocOut:
    """Spec alias — identical to POST /projects/{id}/docs."""
    return _generate(project_id, body, db, user)
