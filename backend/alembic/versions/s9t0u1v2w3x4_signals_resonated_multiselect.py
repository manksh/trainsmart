"""Convert signal_resonated to signals_resonated for multi-select

Revision ID: s9t0u1v2w3x4
Revises: r8s9t0u1v2w3
Create Date: 2026-01-08

This migration changes the mood check-in signal field from a single string
(signal_resonated) to a JSONB array (signals_resonated) to support multi-select.

Existing data is migrated by wrapping single signals in an array.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 's9t0u1v2w3x4'
down_revision: Union[str, None] = 'r8s9t0u1v2w3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add new signals_resonated column (JSONB array)
    op.add_column('check_ins',
                  sa.Column('signals_resonated', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # Step 2: Migrate existing data from signal_resonated to signals_resonated
    # Convert single string to array, e.g., "Signal text" -> ["Signal text"]
    # NULL values remain NULL (empty arrays will be handled by application)
    op.execute("""
        UPDATE check_ins
        SET signals_resonated = jsonb_build_array(signal_resonated)
        WHERE signal_resonated IS NOT NULL
    """)

    # Step 3: Drop old signal_resonated column
    op.drop_column('check_ins', 'signal_resonated')


def downgrade() -> None:
    # Step 1: Add back signal_resonated column
    op.add_column('check_ins',
                  sa.Column('signal_resonated', sa.String(length=500), nullable=True))

    # Step 2: Migrate data back - take first element of array
    # If array has multiple elements, we lose data (this is expected for downgrade)
    op.execute("""
        UPDATE check_ins
        SET signal_resonated = signals_resonated->>0
        WHERE signals_resonated IS NOT NULL
          AND jsonb_array_length(signals_resonated) > 0
    """)

    # Step 3: Drop signals_resonated column
    op.drop_column('check_ins', 'signals_resonated')
