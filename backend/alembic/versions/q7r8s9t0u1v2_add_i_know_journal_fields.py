"""Add I Know journal type fields

Revision ID: q7r8s9t0u1v2
Revises: p6q7r8s9t0u1
Create Date: 2025-12-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'q7r8s9t0u1v2'
down_revision: Union[str, None] = 'p6q7r8s9t0u1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add I Know journal type columns to journal_entries table
    op.add_column('journal_entries', sa.Column('i_know_statement', sa.String(500), nullable=True))
    op.add_column('journal_entries', sa.Column('i_know_why_matters', sa.String(500), nullable=True))
    op.add_column('journal_entries', sa.Column('i_know_feeling', sa.String(50), nullable=True))


def downgrade() -> None:
    # Remove I Know journal type columns
    op.drop_column('journal_entries', 'i_know_feeling')
    op.drop_column('journal_entries', 'i_know_why_matters')
    op.drop_column('journal_entries', 'i_know_statement')
