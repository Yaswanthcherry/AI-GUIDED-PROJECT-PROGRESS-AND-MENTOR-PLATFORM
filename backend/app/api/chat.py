"""
Mentor chat:
  GET  /api/projects/{id}/mentor/messages   — history (frontend)
  POST /api/projects/{id}/mentor/messages   — send a message (frontend)
  POST /api/projects/{id}/chat              — spec alias, same handler
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.chat_agent import reply as mentor_reply
from app.api.projects import _owned_or_404
from app.core.deps import get_current_user, get_db
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatMessageOut, ChatRequest
from app.services import project_service as svc

router = APIRouter(prefix="/projects", tags=["mentor-chat"])


def _out(m: ChatMessage) -> ChatMessageOut:
    return ChatMessageOut(id=m.id, role=m.role, content=m.content, ts=m.ts, agent=m.agent)


def _welcome(project) -> ChatMessage:
    risks = (project.blueprint or {}).get("risks", [])
    return ChatMessage(
        id=str(uuid.uuid4()),
        project_id=project.id,
        role="mentor",
        agent="Mentor",
        content=(
            f"Welcome back — I have been watching **{project.title}**. You are at **{project.progress}%** in "
            f"*{project.phase}* (week {project.current_week}/{project.duration_weeks}), and the next task is "
            f"**{project.next_task}**. Everything in your blueprint — scope, stack, timeline and "
            f"{len(risks)} tracked risks — is attached to this conversation. Ask me anything."
        ),
    )


@router.get("/{project_id}/mentor/messages", response_model=list[ChatMessageOut])
def history(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[ChatMessageOut]:
    project = _owned_or_404(db, project_id, user)
    messages = list(project.messages)
    if not messages:
        welcome = _welcome(project)
        db.add(welcome)
        db.commit()
        db.refresh(welcome)
        messages = [welcome]
    return [_out(m) for m in messages]


def _send(project_id: str, body: ChatRequest, db: Session, user: User) -> ChatMessageOut:
    project = _owned_or_404(db, project_id, user)

    user_msg = ChatMessage(id=str(uuid.uuid4()), project_id=project.id, role="user", content=body.content)
    db.add(user_msg)
    db.commit()

    # Mentor answers with the project's live context (blueprint, tasks, risks).
    result = mentor_reply(svc.to_context(project), body.content)
    mentor_msg = ChatMessage(
        id=str(uuid.uuid4()),
        project_id=project.id,
        role="mentor",
        content=result["content"],
        agent=result.get("agent", "Mentor"),
    )
    db.add(mentor_msg)
    db.commit()
    db.refresh(mentor_msg)
    return _out(mentor_msg)


@router.post("/{project_id}/mentor/messages", response_model=ChatMessageOut, status_code=201)
def send_message(project_id: str, body: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChatMessageOut:
    return _send(project_id, body, db, user)


@router.post("/{project_id}/chat", response_model=ChatMessageOut, status_code=201)
def chat(project_id: str, body: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChatMessageOut:
    """Spec alias — identical to POST /projects/{id}/mentor/messages."""
    return _send(project_id, body, db, user)
