"""Add composite indexes for performance optimization

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2025-12-20

This migration adds composite indexes to optimize frequently executed queries:

1. check_ins(user_id, created_at): Optimizes "today's check-ins" queries and
   historical check-in lookups that filter by user and date range.

2. check_ins(user_id, check_in_type, created_at): Optimizes type-specific
   "today's check-ins" queries (mood, breathing, confidence, energy).

3. check_ins(user_id, organization_id): Optimizes queries that filter
   check-ins by both user and organization context.

4. module_progress(user_id, module_id): Optimizes lookups for a user's
   progress on a specific training module.

5. module_progress(user_id, organization_id): Optimizes queries that
   filter progress records by user within an organization.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'j0k1l2m3n4o5'
down_revision: Union[str, None] = 'i9j0k1l2m3n4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check-ins table composite indexes
    op.create_index(
        'ix_check_ins_user_id_created_at',
        'check_ins',
        ['user_id', 'created_at'],
        unique=False,
    )

    op.create_index(
        'ix_check_ins_user_id_check_in_type_created_at',
        'check_ins',
        ['user_id', 'check_in_type', 'created_at'],
        unique=False,
    )

    op.create_index(
        'ix_check_ins_user_id_organization_id',
        'check_ins',
        ['user_id', 'organization_id'],
        unique=False,
    )

    # Module progress table composite indexes
    op.create_index(
        'ix_module_progress_user_id_module_id',
        'module_progress',
        ['user_id', 'module_id'],
        unique=False,
    )

    op.create_index(
        'ix_module_progress_user_id_organization_id',
        'module_progress',
        ['user_id', 'organization_id'],
        unique=False,
    )


def downgrade() -> None:
    # Remove module_progress indexes
    op.drop_index('ix_module_progress_user_id_organization_id', table_name='module_progress')
    op.drop_index('ix_module_progress_user_id_module_id', table_name='module_progress')

    # Remove check_ins indexes
    op.drop_index('ix_check_ins_user_id_organization_id', table_name='check_ins')
    op.drop_index('ix_check_ins_user_id_check_in_type_created_at', table_name='check_ins')
    op.drop_index('ix_check_ins_user_id_created_at', table_name='check_ins')
