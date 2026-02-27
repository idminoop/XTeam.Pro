"""add_extended_crm_entities

Revision ID: e2a4f9d8c1b7
Revises: b3f8a2d1c7e4
Create Date: 2026-02-27 16:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e2a4f9d8c1b7"
down_revision = "b3f8a2d1c7e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("contact_inquiries", schema=None) as batch_op:
        batch_op.add_column(sa.Column("tags", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("score", sa.Integer(), server_default=sa.text("0"), nullable=False))
        batch_op.add_column(
            sa.Column("pipeline_stage", sa.String(length=50), server_default=sa.text("'new'"), nullable=False)
        )

    op.execute(
        sa.text(
            """
            UPDATE contact_inquiries
            SET pipeline_stage = CASE
                WHEN status IN ('new','contacted','qualified','converted','closed') THEN status
                ELSE 'new'
            END
            """
        )
    )

    with op.batch_alter_table("contact_inquiries", schema=None) as batch_op:
        batch_op.alter_column("score", server_default=None)
        batch_op.alter_column("pipeline_stage", server_default=None)

    op.create_table(
        "contact_notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("contact_id", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_by", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["contact_id"], ["contact_inquiries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contact_notes_id"), "contact_notes", ["id"], unique=False)
    op.create_index(op.f("ix_contact_notes_contact_id"), "contact_notes", ["contact_id"], unique=False)

    op.create_table(
        "contact_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("contact_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=True),
        sa.Column("assigned_to", sa.String(length=255), nullable=True),
        sa.Column("created_by", sa.String(length=100), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["contact_id"], ["contact_inquiries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contact_tasks_id"), "contact_tasks", ["id"], unique=False)
    op.create_index(op.f("ix_contact_tasks_contact_id"), "contact_tasks", ["contact_id"], unique=False)

    op.create_table(
        "contact_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("contact_id", sa.Integer(), nullable=False),
        sa.Column("activity_type", sa.String(length=50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_by", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["contact_id"], ["contact_inquiries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contact_activities_id"), "contact_activities", ["id"], unique=False)
    op.create_index(op.f("ix_contact_activities_contact_id"), "contact_activities", ["contact_id"], unique=False)

    op.create_table(
        "email_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_templates_id"), "email_templates", ["id"], unique=False)
    op.create_index(op.f("ix_email_templates_name"), "email_templates", ["name"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_email_templates_name"), table_name="email_templates")
    op.drop_index(op.f("ix_email_templates_id"), table_name="email_templates")
    op.drop_table("email_templates")

    op.drop_index(op.f("ix_contact_activities_contact_id"), table_name="contact_activities")
    op.drop_index(op.f("ix_contact_activities_id"), table_name="contact_activities")
    op.drop_table("contact_activities")

    op.drop_index(op.f("ix_contact_tasks_contact_id"), table_name="contact_tasks")
    op.drop_index(op.f("ix_contact_tasks_id"), table_name="contact_tasks")
    op.drop_table("contact_tasks")

    op.drop_index(op.f("ix_contact_notes_contact_id"), table_name="contact_notes")
    op.drop_index(op.f("ix_contact_notes_id"), table_name="contact_notes")
    op.drop_table("contact_notes")

    with op.batch_alter_table("contact_inquiries", schema=None) as batch_op:
        batch_op.drop_column("pipeline_stage")
        batch_op.drop_column("score")
        batch_op.drop_column("tags")
