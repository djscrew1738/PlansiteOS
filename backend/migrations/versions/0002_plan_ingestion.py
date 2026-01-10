"""plan ingestion fields

Revision ID: 0002
Revises: 0001
Create Date: 2024-10-02 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    page_label = sa.Enum("FLOOR_PLAN", "PLUMBING", "ELEVATION", "SITE", "OTHER", name="pagelabel")
    page_label.create(op.get_bind(), checkfirst=True)

    op.add_column("uploads", sa.Column("revision_label", sa.String(), nullable=True))
    op.add_column("pages", sa.Column("label", page_label, nullable=False, server_default="OTHER"))
    op.add_column("pages", sa.Column("is_selected", sa.Boolean(), nullable=False, server_default=sa.text("true")))


def downgrade():
    op.drop_column("pages", "is_selected")
    op.drop_column("pages", "label")
    op.drop_column("uploads", "revision_label")
    op.execute("DROP TYPE pagelabel")
