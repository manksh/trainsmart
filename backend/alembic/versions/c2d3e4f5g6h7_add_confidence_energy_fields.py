"""Add confidence and energy check-in fields

Revision ID: c2d3e4f5g6h7
Revises: b1e2f3a4d5c6
Create Date: 2025-12-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c2d3e4f5g6h7'
down_revision: Union[str, None] = 'b1e2f3a4d5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add confidence check-in fields
    op.add_column('check_ins',
                  sa.Column('confidence_level', sa.Integer(), nullable=True))
    op.add_column('check_ins',
                  sa.Column('confidence_sources', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('check_ins',
                  sa.Column('doubt_sources', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('check_ins',
                  sa.Column('confidence_commitment', sa.String(length=500), nullable=True))

    # Add energy check-in fields
    op.add_column('check_ins',
                  sa.Column('physical_energy', sa.Integer(), nullable=True))
    op.add_column('check_ins',
                  sa.Column('mental_energy', sa.Integer(), nullable=True))
    op.add_column('check_ins',
                  sa.Column('physical_factors', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('check_ins',
                  sa.Column('mental_factors', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('check_ins',
                  sa.Column('energy_state', sa.String(length=50), nullable=True))


def downgrade() -> None:
    # Remove energy check-in fields
    op.drop_column('check_ins', 'energy_state')
    op.drop_column('check_ins', 'mental_factors')
    op.drop_column('check_ins', 'physical_factors')
    op.drop_column('check_ins', 'mental_energy')
    op.drop_column('check_ins', 'physical_energy')

    # Remove confidence check-in fields
    op.drop_column('check_ins', 'confidence_commitment')
    op.drop_column('check_ins', 'doubt_sources')
    op.drop_column('check_ins', 'confidence_sources')
    op.drop_column('check_ins', 'confidence_level')
