"""DEMO_MODE seeding — creates demo accounts and one sample project at startup.

Idempotent: skips anything that already exists. Never runs unless DEMO_MODE=true.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.orchestrator import generate_blueprint
from app.core.security import hash_password
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectInput
from app.services import project_service as svc

logger = logging.getLogger("aapm.seed")

DEMO_USERS = [
    {"name": "Demo Student", "email": "student@campus.edu", "password": "demo1234", "role": "student", "level": "Undergraduate — Final Year"},
    {"name": "Dr. Demo Faculty", "email": "faculty@campus.edu", "password": "demo1234", "role": "faculty", "level": None},
]

DEMO_PROJECT = ProjectInput(
    title="AI Customer Support Chatbot",
    idea="A retrieval-augmented chatbot that answers campus support questions from an institutional knowledge base, with confidence scoring and human handoff.",
    problem_statement="Support staff answer the same questions repeatedly while students wait hours; existing keyword bots fail on paraphrased queries.",
    domain="AI / Machine Learning",
    technologies="Python, FastAPI, React",
    team_size=3,
    duration_weeks=14,
    level="Undergraduate — Final Year",
)


def seed_demo_data(db: Session) -> None:
    for u in DEMO_USERS:
        if db.scalar(select(User).where(User.email == u["email"])) is None:
            db.add(User(name=u["name"], email=u["email"], hashed_password=hash_password(u["password"]), role=u["role"], level=u["level"]))
            logger.info("Seeded demo user: %s (%s)", u["email"], u["role"])
    db.commit()

    student = db.scalar(select(User).where(User.email == "student@campus.edu"))
    has_project = db.scalar(select(Project.id).where(Project.student_id == student.id).limit(1)) if student else True
    if student and has_project is None:
        blueprint, logs = generate_blueprint(DEMO_PROJECT.model_dump(by_alias=True))
        svc.materialize_project(db, student, DEMO_PROJECT, blueprint, logs)
        logger.info("Seeded demo project: %s", DEMO_PROJECT.title)
