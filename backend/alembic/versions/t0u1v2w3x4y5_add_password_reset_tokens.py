"""Add password_reset_tokens table

Revision ID: t0u1v2w3x4y5
Revises: q1r2s3t4u5v6
Create Date: 2026-01-18

This migration adds the password_reset_tokens table for secure password reset flow.
Tokens are hashed before storage and have a 30-minute expiration.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 't0u1v2w3x4y5'
down_revision: Union[str, None] = 'q1r2s3t4u5v6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create password_reset_tokens table
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Indexes
    op.create_index('ix_password_reset_tokens_user_id', 'password_reset_tokens', ['user_id'])
    op.create_index('ix_password_reset_tokens_token_hash', 'password_reset_tokens', ['token_hash'])
    op.create_index('ix_password_reset_tokens_expires_at', 'password_reset_tokens', ['expires_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_password_reset_tokens_expires_at', 'password_reset_tokens')
    op.drop_index('ix_password_reset_tokens_token_hash', 'password_reset_tokens')
    op.drop_index('ix_password_reset_tokens_user_id', 'password_reset_tokens')
    # Drop table
    op.drop_table('password_reset_tokens')
