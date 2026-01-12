"""rename nodes metadata column

Revision ID: 0005
Revises: 0004
Create Date: 2024-10-05 00:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("nodes", "metadata", new_column_name="metadata_json")


def downgrade():
    op.alter_column("nodes", "metadata_json", new_column_name="metadata")
