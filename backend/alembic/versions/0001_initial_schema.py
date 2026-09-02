"""initial schema (users, projects, milestones, tasks, activity, chat, documents)

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

import app.models.chat  # noqa: F401
import app.models.document  # noqa: F401
import app.models.project  # noqa: F401
import app.models.user  # noqa: F401
from app.database.session import Base

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Bootstrap revision: create all tables from the current metadata.
    # Future changes: `alembic revision --autogenerate -m "describe change"`.
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
