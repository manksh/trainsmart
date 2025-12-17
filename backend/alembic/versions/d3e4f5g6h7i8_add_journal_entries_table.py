"""Add journal_entries table

Revision ID: d3e4f5g6h7i8
Revises: c2d3e4f5g6h7
Create Date: 2025-12-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd3e4f5g6h7i8'
down_revision: Union[str, None] = 'c2d3e4f5g6h7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('journal_entries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('journal_type', sa.String(length=50), nullable=False),

        # Affirmations fields
        sa.Column('affirmation_focus_area', sa.String(length=50), nullable=True),
        sa.Column('affirmation_text', sa.String(length=500), nullable=True),
        sa.Column('affirmation_is_custom', sa.Boolean(), nullable=True, default=False),
        sa.Column('affirmation_when_helpful', postgresql.JSONB(astext_type=sa.Text()), nullable=True),

        # Daily wins fields
        sa.Column('win_description', sa.String(length=500), nullable=True),
        sa.Column('win_factors', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('win_feeling', sa.String(length=50), nullable=True),

        # Gratitude fields
        sa.Column('gratitude_item', sa.String(length=500), nullable=True),
        sa.Column('gratitude_why_meaningful', sa.String(length=500), nullable=True),
        sa.Column('gratitude_feeling', sa.String(length=50), nullable=True),

        # Open-ended fields
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('prompt_used', sa.String(length=500), nullable=True),

        # Shared fields
        sa.Column('word_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),

        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for common queries
    op.create_index('ix_journal_entries_user_id', 'journal_entries', ['user_id'])
    op.create_index('ix_journal_entries_journal_type', 'journal_entries', ['journal_type'])
    op.create_index('ix_journal_entries_created_at', 'journal_entries', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_journal_entries_created_at', 'journal_entries')
    op.drop_index('ix_journal_entries_journal_type', 'journal_entries')
    op.drop_index('ix_journal_entries_user_id', 'journal_entries')
    op.drop_table('journal_entries')
