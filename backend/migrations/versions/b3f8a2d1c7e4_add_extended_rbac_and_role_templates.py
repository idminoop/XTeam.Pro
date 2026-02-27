"""add_extended_rbac_and_role_templates

Revision ID: b3f8a2d1c7e4
Revises: 9e6f3b2c4d1a
Create Date: 2026-02-27 14:40:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b3f8a2d1c7e4"
down_revision = "9e6f3b2c4d1a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("admin_users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("can_read_audits", sa.Boolean(), server_default=sa.text("1"), nullable=False))
        batch_op.add_column(sa.Column("can_write_audits", sa.Boolean(), server_default=sa.text("1"), nullable=False))
        batch_op.add_column(sa.Column("can_delete_audits", sa.Boolean(), server_default=sa.text("0"), nullable=False))
        batch_op.add_column(sa.Column("can_read_contacts", sa.Boolean(), server_default=sa.text("1"), nullable=False))
        batch_op.add_column(sa.Column("can_write_contacts", sa.Boolean(), server_default=sa.text("1"), nullable=False))
        batch_op.add_column(sa.Column("can_delete_contacts", sa.Boolean(), server_default=sa.text("0"), nullable=False))
        batch_op.add_column(sa.Column("can_publish_content", sa.Boolean(), server_default=sa.text("0"), nullable=False))
        batch_op.add_column(sa.Column("can_manage_cases", sa.Boolean(), server_default=sa.text("0"), nullable=False))
        batch_op.add_column(sa.Column("skip_email_verification", sa.Boolean(), server_default=sa.text("0"), nullable=False))

    # Backfill new permission columns from legacy flags to preserve behavior.
    op.execute(
        sa.text(
            """
            UPDATE admin_users
            SET
                can_read_audits = COALESCE(can_manage_audits, 0),
                can_write_audits = COALESCE(can_manage_audits, 0),
                can_delete_audits = 0,
                can_read_contacts = COALESCE(can_manage_audits, 0),
                can_write_contacts = COALESCE(can_manage_audits, 0),
                can_delete_contacts = 0,
                can_publish_content = COALESCE(can_manage_content, 0),
                can_manage_cases = COALESCE(can_manage_content, 0),
                skip_email_verification = 0
            """
        )
    )

    with op.batch_alter_table("admin_users", schema=None) as batch_op:
        batch_op.alter_column("can_read_audits", server_default=None)
        batch_op.alter_column("can_write_audits", server_default=None)
        batch_op.alter_column("can_delete_audits", server_default=None)
        batch_op.alter_column("can_read_contacts", server_default=None)
        batch_op.alter_column("can_write_contacts", server_default=None)
        batch_op.alter_column("can_delete_contacts", server_default=None)
        batch_op.alter_column("can_publish_content", server_default=None)
        batch_op.alter_column("can_manage_cases", server_default=None)
        batch_op.alter_column("skip_email_verification", server_default=None)

    op.create_table(
        "role_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("role", sa.String(length=50), nullable=True),
        sa.Column("is_system", sa.Boolean(), nullable=True),
        sa.Column("can_manage_audits", sa.Boolean(), nullable=True),
        sa.Column("can_manage_users", sa.Boolean(), nullable=True),
        sa.Column("can_view_analytics", sa.Boolean(), nullable=True),
        sa.Column("can_export_data", sa.Boolean(), nullable=True),
        sa.Column("can_manage_content", sa.Boolean(), nullable=True),
        sa.Column("can_read_audits", sa.Boolean(), nullable=True),
        sa.Column("can_write_audits", sa.Boolean(), nullable=True),
        sa.Column("can_delete_audits", sa.Boolean(), nullable=True),
        sa.Column("can_read_contacts", sa.Boolean(), nullable=True),
        sa.Column("can_write_contacts", sa.Boolean(), nullable=True),
        sa.Column("can_delete_contacts", sa.Boolean(), nullable=True),
        sa.Column("can_publish_content", sa.Boolean(), nullable=True),
        sa.Column("can_manage_cases", sa.Boolean(), nullable=True),
        sa.Column("skip_email_verification", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_role_templates_id"), "role_templates", ["id"], unique=False)
    op.create_index(op.f("ix_role_templates_name"), "role_templates", ["name"], unique=True)

    role_templates = sa.table(
        "role_templates",
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("role", sa.String),
        sa.column("is_system", sa.Boolean),
        sa.column("can_manage_audits", sa.Boolean),
        sa.column("can_manage_users", sa.Boolean),
        sa.column("can_view_analytics", sa.Boolean),
        sa.column("can_export_data", sa.Boolean),
        sa.column("can_manage_content", sa.Boolean),
        sa.column("can_read_audits", sa.Boolean),
        sa.column("can_write_audits", sa.Boolean),
        sa.column("can_delete_audits", sa.Boolean),
        sa.column("can_read_contacts", sa.Boolean),
        sa.column("can_write_contacts", sa.Boolean),
        sa.column("can_delete_contacts", sa.Boolean),
        sa.column("can_publish_content", sa.Boolean),
        sa.column("can_manage_cases", sa.Boolean),
        sa.column("skip_email_verification", sa.Boolean),
    )

    op.bulk_insert(
        role_templates,
        [
            {
                "name": "editor",
                "description": "Creates and publishes blog and case-study content",
                "role": "editor",
                "is_system": True,
                "can_manage_audits": False,
                "can_manage_users": False,
                "can_view_analytics": True,
                "can_export_data": False,
                "can_manage_content": True,
                "can_read_audits": False,
                "can_write_audits": False,
                "can_delete_audits": False,
                "can_read_contacts": False,
                "can_write_contacts": False,
                "can_delete_contacts": False,
                "can_publish_content": True,
                "can_manage_cases": True,
                "skip_email_verification": True,
            },
            {
                "name": "author",
                "description": "Creates and edits draft content without publishing",
                "role": "author",
                "is_system": True,
                "can_manage_audits": False,
                "can_manage_users": False,
                "can_view_analytics": False,
                "can_export_data": False,
                "can_manage_content": True,
                "can_read_audits": False,
                "can_write_audits": False,
                "can_delete_audits": False,
                "can_read_contacts": False,
                "can_write_contacts": False,
                "can_delete_contacts": False,
                "can_publish_content": False,
                "can_manage_cases": False,
                "skip_email_verification": True,
            },
            {
                "name": "moderator",
                "description": "Works with CRM contacts and pipelines",
                "role": "moderator",
                "is_system": True,
                "can_manage_audits": False,
                "can_manage_users": False,
                "can_view_analytics": True,
                "can_export_data": True,
                "can_manage_content": False,
                "can_read_audits": False,
                "can_write_audits": False,
                "can_delete_audits": False,
                "can_read_contacts": True,
                "can_write_contacts": True,
                "can_delete_contacts": True,
                "can_publish_content": False,
                "can_manage_cases": False,
                "skip_email_verification": True,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_role_templates_name"), table_name="role_templates")
    op.drop_index(op.f("ix_role_templates_id"), table_name="role_templates")
    op.drop_table("role_templates")

    with op.batch_alter_table("admin_users", schema=None) as batch_op:
        batch_op.drop_column("skip_email_verification")
        batch_op.drop_column("can_manage_cases")
        batch_op.drop_column("can_publish_content")
        batch_op.drop_column("can_delete_contacts")
        batch_op.drop_column("can_write_contacts")
        batch_op.drop_column("can_read_contacts")
        batch_op.drop_column("can_delete_audits")
        batch_op.drop_column("can_write_audits")
        batch_op.drop_column("can_read_audits")
