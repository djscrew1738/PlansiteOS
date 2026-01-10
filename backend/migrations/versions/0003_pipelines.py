"""pipelines and routing

Revision ID: 0003
Revises: 0002
Create Date: 2024-10-03 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    pipeline_system = sa.Enum("WATER_COLD", "WATER_HOT", "SEWER", "VENT", "GAS", name="pipelinesystem")
    pipeline_phase = sa.Enum("UNDERGROUND", "TOP_OUT", "TRIM", name="pipelinephase")
    node_type = sa.Enum("FIXTURE", "JUNCTION", "STACK", "CLEANOUT", "TIE_IN", name="nodetype")

    pipeline_system.create(op.get_bind(), checkfirst=True)
    pipeline_phase.create(op.get_bind(), checkfirst=True)
    node_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "pipelines",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pages.id"), nullable=False),
        sa.Column("system_type", pipeline_system, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("phase", pipeline_phase, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "nodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pipeline_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pipelines.id"), nullable=False),
        sa.Column("node_type", node_type, nullable=False),
        sa.Column("x", sa.Float(), nullable=False),
        sa.Column("y", sa.Float(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "segments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pipeline_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pipelines.id"), nullable=False),
        sa.Column("points", sa.JSON(), nullable=False),
        sa.Column("diameter", sa.String(), nullable=False),
        sa.Column("material", sa.String(), nullable=False),
        sa.Column("slope", sa.Float(), nullable=True),
        sa.Column("depth", sa.Float(), nullable=True),
        sa.Column("phase", pipeline_phase, nullable=False),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table("segments")
    op.drop_table("nodes")
    op.drop_table("pipelines")
    op.execute("DROP TYPE nodetype")
    op.execute("DROP TYPE pipelinephase")
    op.execute("DROP TYPE pipelinesystem")
