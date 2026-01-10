"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-01-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create foundation_type enum
    foundation_type_enum = postgresql.ENUM('SLAB', 'PIER_BEAM', 'UNKNOWN', name='foundationtype')
    foundation_type_enum.create(op.get_bind())

    # Create upload_status enum
    upload_status_enum = postgresql.ENUM('UPLOADED', 'PROCESSING', 'READY', 'FAILED', name='uploadstatus')
    upload_status_enum.create(op.get_bind())

    # Create page_status enum
    page_status_enum = postgresql.ENUM('READY', 'FAILED', name='pagestatus')
    page_status_enum.create(op.get_bind())

    # Create real_unit enum
    real_unit_enum = postgresql.ENUM('FT', 'IN', 'MM', name='realunit')
    real_unit_enum.create(op.get_bind())

    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('builder', sa.String(length=255), nullable=True),
        sa.Column('foundation_type', sa.Enum('SLAB', 'PIER_BEAM', 'UNKNOWN', name='foundationtype'), nullable=False),
        sa.Column('floors', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_created_at'), 'projects', ['created_at'], unique=False)

    # Create uploads table
    op.create_table(
        'uploads',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('original_filename', sa.String(length=500), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('storage_key_original', sa.String(length=1000), nullable=False),
        sa.Column('status', sa.Enum('UPLOADED', 'PROCESSING', 'READY', 'FAILED', name='uploadstatus'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('warnings', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('progress', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_uploads_project_id'), 'uploads', ['project_id'], unique=False)
    op.create_index(op.f('ix_uploads_status'), 'uploads', ['status'], unique=False)
    op.create_index(op.f('ix_uploads_created_at'), 'uploads', ['created_at'], unique=False)

    # Create pages table
    op.create_table(
        'pages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('upload_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('width_px', sa.Integer(), nullable=False),
        sa.Column('height_px', sa.Integer(), nullable=False),
        sa.Column('dpi_estimated', sa.Integer(), nullable=True),
        sa.Column('storage_key_page_png', sa.String(length=1000), nullable=False),
        sa.Column('storage_key_page_thumb', sa.String(length=1000), nullable=True),
        sa.Column('status', sa.Enum('READY', 'FAILED', name='pagestatus'), nullable=False),
        sa.Column('warnings', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['upload_id'], ['uploads.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pages_upload_id'), 'pages', ['upload_id'], unique=False)
    op.create_index(op.f('ix_pages_page_number'), 'pages', ['page_number'], unique=False)

    # Create calibrations table
    op.create_table(
        'calibrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('p1x', sa.Integer(), nullable=False),
        sa.Column('p1y', sa.Integer(), nullable=False),
        sa.Column('p2x', sa.Integer(), nullable=False),
        sa.Column('p2y', sa.Integer(), nullable=False),
        sa.Column('real_distance', sa.Float(), nullable=False),
        sa.Column('real_unit', sa.Enum('FT', 'IN', 'MM', name='realunit'), nullable=False),
        sa.Column('pixels_per_unit', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('page_id')
    )


def downgrade() -> None:
    op.drop_table('calibrations')
    op.drop_index(op.f('ix_pages_page_number'), table_name='pages')
    op.drop_index(op.f('ix_pages_upload_id'), table_name='pages')
    op.drop_table('pages')
    op.drop_index(op.f('ix_uploads_created_at'), table_name='uploads')
    op.drop_index(op.f('ix_uploads_status'), table_name='uploads')
    op.drop_index(op.f('ix_uploads_project_id'), table_name='uploads')
    op.drop_table('uploads')
    op.drop_index(op.f('ix_projects_created_at'), table_name='projects')
    op.drop_table('projects')

    # Drop enums
    sa.Enum(name='realunit').drop(op.get_bind())
    sa.Enum(name='pagestatus').drop(op.get_bind())
    sa.Enum(name='uploadstatus').drop(op.get_bind())
    sa.Enum(name='foundationtype').drop(op.get_bind())
