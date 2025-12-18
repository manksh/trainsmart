"""Add training_modules and module_progress tables

Revision ID: e4f5g6h7i8j9
Revises: d3e4f5g6h7i8
Create Date: 2025-12-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e4f5g6h7i8j9'
down_revision: Union[str, None] = 'd3e4f5g6h7i8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create training_modules table
    op.create_table('training_modules',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=False, server_default='book'),
        sa.Column('color', sa.String(length=50), nullable=False, server_default='emerald'),
        sa.Column('estimated_minutes', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('content', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_premium', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('requires_assessment', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create unique index on slug
    op.create_index('ix_training_modules_slug', 'training_modules', ['slug'], unique=True)

    # Create module_progress table
    op.create_table('module_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('module_id', sa.UUID(), nullable=False),
        sa.Column('progress_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('current_section', sa.String(length=100), nullable=True),
        sa.Column('current_step', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('is_started', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('activity_responses', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('personal_selections', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('total_time_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['module_id'], ['training_modules.id'], ),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for common queries
    op.create_index('ix_module_progress_user_id', 'module_progress', ['user_id'])
    op.create_index('ix_module_progress_module_id', 'module_progress', ['module_id'])
    op.create_index('ix_module_progress_created_at', 'module_progress', ['created_at'])

    # Create unique constraint to prevent duplicate progress records
    op.create_index(
        'ix_module_progress_user_module_org',
        'module_progress',
        ['user_id', 'module_id', 'organization_id'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index('ix_module_progress_user_module_org', 'module_progress')
    op.drop_index('ix_module_progress_created_at', 'module_progress')
    op.drop_index('ix_module_progress_module_id', 'module_progress')
    op.drop_index('ix_module_progress_user_id', 'module_progress')
    op.drop_table('module_progress')

    op.drop_index('ix_training_modules_slug', 'training_modules')
    op.drop_table('training_modules')
