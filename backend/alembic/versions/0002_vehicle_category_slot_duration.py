"""vehicle size_category and slot_duration_minutes

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "capacity_slots",
        sa.Column("slot_duration_minutes", sa.Integer(), nullable=False, server_default="60"),
    )
    op.add_column(
        "vehicles",
        sa.Column("size_category", sa.String(20), nullable=False, server_default="small"),
    )


def downgrade() -> None:
    op.drop_column("capacity_slots", "slot_duration_minutes")
    op.drop_column("vehicles", "size_category")
