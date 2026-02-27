"""add_analytics_goals

Revision ID: f4b2c8d9a6e1
Revises: e2a4f9d8c1b7
Create Date: 2026-02-27 19:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f4b2c8d9a6e1"
down_revision = "e2a4f9d8c1b7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_goals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("metric", sa.String(length=100), nullable=False),
        sa.Column("target_value", sa.Float(), nullable=False),
        sa.Column("period", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_analytics_goals_id"), "analytics_goals", ["id"], unique=False)
    op.create_index(op.f("ix_analytics_goals_metric"), "analytics_goals", ["metric"], unique=False)

    with op.batch_alter_table("analytics_goals", schema=None) as batch_op:
        batch_op.alter_column("is_active", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_analytics_goals_metric"), table_name="analytics_goals")
    op.drop_index(op.f("ix_analytics_goals_id"), table_name="analytics_goals")
    op.drop_table("analytics_goals")

