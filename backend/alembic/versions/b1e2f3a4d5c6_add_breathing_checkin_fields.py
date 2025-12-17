"""Add breathing check-in fields

Revision ID: b1e2f3a4d5c6
Revises: acc43947c0ac
Create Date: 2025-12-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1e2f3a4d5c6'
down_revision: Union[str, None] = 'acc43947c0ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make mood-specific fields nullable to support other check-in types
    op.alter_column('check_ins', 'emotion',
                    existing_type=sa.String(length=50),
                    nullable=True)
    op.alter_column('check_ins', 'intensity',
                    existing_type=sa.Integer(),
                    nullable=True)
    op.alter_column('check_ins', 'body_areas',
                    existing_type=sa.dialects.postgresql.JSONB(astext_type=sa.Text()),
                    nullable=True)

    # Add breathing check-in fields
    op.add_column('check_ins',
                  sa.Column('breathing_exercise_type', sa.String(length=50), nullable=True))
    op.add_column('check_ins',
                  sa.Column('cycles_completed', sa.Integer(), nullable=True))
    op.add_column('check_ins',
                  sa.Column('duration_seconds', sa.Integer(), nullable=True))
    op.add_column('check_ins',
                  sa.Column('trigger_selected', sa.String(length=500), nullable=True))
    op.add_column('check_ins',
                  sa.Column('effectiveness_rating', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove breathing check-in fields
    op.drop_column('check_ins', 'effectiveness_rating')
    op.drop_column('check_ins', 'trigger_selected')
    op.drop_column('check_ins', 'duration_seconds')
    op.drop_column('check_ins', 'cycles_completed')
    op.drop_column('check_ins', 'breathing_exercise_type')

    # Revert mood-specific fields to not nullable
    # Note: This may fail if there are breathing check-ins in the database
    op.alter_column('check_ins', 'body_areas',
                    existing_type=sa.dialects.postgresql.JSONB(astext_type=sa.Text()),
                    nullable=False)
    op.alter_column('check_ins', 'intensity',
                    existing_type=sa.Integer(),
                    nullable=False)
    op.alter_column('check_ins', 'emotion',
                    existing_type=sa.String(length=50),
                    nullable=False)
