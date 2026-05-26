"""service price column

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "services",
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("services", "price")
