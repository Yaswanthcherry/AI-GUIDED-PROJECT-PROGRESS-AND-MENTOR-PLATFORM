"""add faculty feedback table

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-07 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

import app.models.feedback  # noqa: F401

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "faculty_feedback",
        op.Column("id", op.String(36), primary_key=True),
        op.Column("project_id", op.String(36), op.ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False),
        op.Column("faculty_id", op.String(36), op.ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False),
        op.Column("type", op.String(24), nullable=False),
        op.Column("content", op.Text, nullable=False),
        op.Column("related_task_id", op.String(36), nullable=True),
        op.Column("created_at", op.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("faculty_feedback")