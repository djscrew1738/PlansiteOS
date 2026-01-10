"""init

Revision ID: 0001
Revises: 
Create Date: 2024-10-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("builder", sa.String(), nullable=True),
        sa.Column("foundation_type", sa.Enum("SLAB", "PIER_BEAM", "UNKNOWN", name="foundationtype"), nullable=False),
        sa.Column("floors", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "uploads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("original_filename", sa.String(), nullable=False),
        sa.Column("mime_type", sa.String(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("storage_key_original", sa.String(), nullable=False),
        sa.Column("status", sa.Enum("UPLOADED", "PROCESSING", "READY", "FAILED", name="uploadstatus"), nullable=False),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("warnings", sa.JSON(), nullable=True),
        sa.Column("progress", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "pages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("upload_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("uploads.id"), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("width_px", sa.Integer(), nullable=False),
        sa.Column("height_px", sa.Integer(), nullable=False),
        sa.Column("dpi_estimated", sa.Integer(), nullable=True),
        sa.Column("storage_key_page_png", sa.String(), nullable=False),
        sa.Column("storage_key_page_thumb", sa.String(), nullable=True),
        sa.Column("status", sa.Enum("READY", "FAILED", name="pagestatus"), nullable=False),
        sa.Column("warnings", sa.JSON(), nullable=True),
    )
    op.create_table(
        "calibrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pages.id"), nullable=False),
        sa.Column("p1x", sa.Integer(), nullable=False),
        sa.Column("p1y", sa.Integer(), nullable=False),
        sa.Column("p2x", sa.Integer(), nullable=False),
        sa.Column("p2y", sa.Integer(), nullable=False),
        sa.Column("real_distance", sa.Float(), nullable=False),
        sa.Column("real_unit", sa.Enum("FT", "IN", "MM", name="realunit"), nullable=False),
        sa.Column("pixels_per_unit", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_unique_constraint("uniq_calibration_page", "calibrations", ["page_id"])


def downgrade():
    op.drop_constraint("uniq_calibration_page", "calibrations", type_="unique")
    op.drop_table("calibrations")
    op.drop_table("pages")
    op.drop_table("uploads")
    op.drop_table("projects")
    op.execute("DROP TYPE realunit")
    op.execute("DROP TYPE pagestatus")
    op.execute("DROP TYPE uploadstatus")
    op.execute("DROP TYPE foundationtype")
