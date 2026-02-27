"""add_case_studies_and_blog_i18n

Revision ID: 9e6f3b2c4d1a
Revises: 78599cf52c0c
Create Date: 2026-02-27 11:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9e6f3b2c4d1a"
down_revision = "78599cf52c0c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "case_studies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("title_ru", sa.String(length=255), nullable=False),
        sa.Column("title_en", sa.String(length=255), nullable=False),
        sa.Column("industry_ru", sa.String(length=255), nullable=False),
        sa.Column("industry_en", sa.String(length=255), nullable=False),
        sa.Column("challenge_ru", sa.Text(), nullable=False),
        sa.Column("challenge_en", sa.Text(), nullable=False),
        sa.Column("solution_ru", sa.Text(), nullable=False),
        sa.Column("solution_en", sa.Text(), nullable=False),
        sa.Column("testimonial_ru", sa.Text(), nullable=True),
        sa.Column("testimonial_en", sa.Text(), nullable=True),
        sa.Column("client_company", sa.String(length=255), nullable=True),
        sa.Column("results", sa.JSON(), nullable=False),
        sa.Column("roi", sa.String(length=100), nullable=True),
        sa.Column("time_saved", sa.String(length=100), nullable=True),
        sa.Column("featured_image", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("is_featured", sa.Boolean(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_case_studies_id"), "case_studies", ["id"], unique=False)
    op.create_index(op.f("ix_case_studies_slug"), "case_studies", ["slug"], unique=True)
    op.create_index(op.f("ix_case_studies_status"), "case_studies", ["status"], unique=False)

    with op.batch_alter_table("blog_posts", schema=None) as batch_op:
        batch_op.add_column(sa.Column("title_ru", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("title_en", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("excerpt_ru", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("excerpt_en", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("content_ru", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("content_en", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("blog_posts", schema=None) as batch_op:
        batch_op.drop_column("content_en")
        batch_op.drop_column("content_ru")
        batch_op.drop_column("excerpt_en")
        batch_op.drop_column("excerpt_ru")
        batch_op.drop_column("title_en")
        batch_op.drop_column("title_ru")

    op.drop_index(op.f("ix_case_studies_status"), table_name="case_studies")
    op.drop_index(op.f("ix_case_studies_slug"), table_name="case_studies")
    op.drop_index(op.f("ix_case_studies_id"), table_name="case_studies")
    op.drop_table("case_studies")
