import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.database.types import JSONType


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    domain: Mapped[str] = mapped_column(String(80), nullable=False)
    level: Mapped[str] = mapped_column(String(120), nullable=False)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    team_size: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=False, default=12)
    current_week: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 0..100
    phase: Mapped[str] = mapped_column(String(80), nullable=False, default="Planning & Design")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="planning")  # planning|active|completed|delayed
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False, default="low")  # low|medium|high
    next_task: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Original student form (ProjectInput) — camelCase JSON matching the frontend contract
    input: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    # AI blueprint (evaluation/scope/technology/architecture/timeline/risks) — camelCase JSON
    blueprint: Mapped[dict[str, Any] | None] = mapped_column(JSONType, nullable=True)
    # Raw per-agent outputs from the orchestrator run (traceability)
    agent_logs: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONType, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    last_update: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    student = relationship("User", back_populates="projects")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan", order_by="Milestone.order")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan", order_by="Task.order")
    activity = relationship("Activity", back_populates="project", cascade="all, delete-orphan", order_by="Activity.ts.desc()")
    messages = relationship("ChatMessage", back_populates="project", cascade="all, delete-orphan", order_by="ChatMessage.ts")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    week_start: Mapped[int] = mapped_column(Integer, nullable=False)
    week_end: Mapped[int] = mapped_column(Integer, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    project = relationship("Project", back_populates="milestones")
    tasks = relationship("Task", back_populates="milestone")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    milestone_id: Mapped[str] = mapped_column(String(36), ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    week: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")  # pending|in-progress|done|delayed
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    project = relationship("Project", back_populates="tasks")
    milestone = relationship("Milestone", back_populates="tasks")


class Activity(Base):
    __tablename__ = "activity_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(String(12), nullable=False, default="system")  # ai | user | system
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    project = relationship("Project", back_populates="activity")
