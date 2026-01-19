"""Add push notification tables

Revision ID: q1r2s3t4u5v6
Revises: s9t0u1v2w3x4
Create Date: 2026-01-18

This migration adds tables for PWA push notification support:
- device_tokens: Stores device push subscription information
- notification_preferences: User notification settings
- notification_logs: Audit log of sent notifications
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'q1r2s3t4u5v6'
down_revision: Union[str, None] = 's9t0u1v2w3x4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create device_tokens table
    op.create_table(
        'device_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('platform', sa.String(length=20), nullable=False),  # web, ios, android
        sa.Column('endpoint', sa.Text(), nullable=False),  # Push service endpoint URL
        sa.Column('p256dh_key', sa.Text(), nullable=True),  # Web push: user public key
        sa.Column('auth_key', sa.Text(), nullable=True),  # Web push: auth secret
        sa.Column('device_name', sa.String(length=255), nullable=True),  # User-friendly device name
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Indexes for device_tokens
    op.create_index('ix_device_tokens_user_id', 'device_tokens', ['user_id'])
    op.create_index('ix_device_tokens_platform', 'device_tokens', ['platform'])
    op.create_index('ix_device_tokens_is_active', 'device_tokens', ['is_active'])
    # Unique constraint on endpoint to prevent duplicate registrations
    op.create_index('ix_device_tokens_endpoint', 'device_tokens', ['endpoint'], unique=True)

    # Create notification_preferences table
    op.create_table(
        'notification_preferences',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('daily_checkin_reminder', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('reminder_time', sa.Time(), nullable=True),  # User's preferred reminder time
        sa.Column('timezone', sa.String(length=50), nullable=True, server_default='America/New_York'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Unique constraint: one preference record per user
    op.create_index('ix_notification_preferences_user_id', 'notification_preferences', ['user_id'], unique=True)

    # Create notification_logs table
    op.create_table(
        'notification_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('device_token_id', sa.UUID(), nullable=True),  # NULL if sent to all devices
        sa.Column('notification_type', sa.String(length=50), nullable=False),  # daily_checkin, module_reminder, etc.
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),  # Additional payload data
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),  # pending, sent, failed
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['device_token_id'], ['device_tokens.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Indexes for notification_logs
    op.create_index('ix_notification_logs_user_id', 'notification_logs', ['user_id'])
    op.create_index('ix_notification_logs_device_token_id', 'notification_logs', ['device_token_id'])
    op.create_index('ix_notification_logs_notification_type', 'notification_logs', ['notification_type'])
    op.create_index('ix_notification_logs_status', 'notification_logs', ['status'])
    op.create_index('ix_notification_logs_created_at', 'notification_logs', ['created_at'])
    # Composite index for querying user notifications by type and date
    op.create_index(
        'ix_notification_logs_user_type_created',
        'notification_logs',
        ['user_id', 'notification_type', 'created_at']
    )


def downgrade() -> None:
    # Drop notification_logs indexes and table
    op.drop_index('ix_notification_logs_user_type_created', 'notification_logs')
    op.drop_index('ix_notification_logs_created_at', 'notification_logs')
    op.drop_index('ix_notification_logs_status', 'notification_logs')
    op.drop_index('ix_notification_logs_notification_type', 'notification_logs')
    op.drop_index('ix_notification_logs_device_token_id', 'notification_logs')
    op.drop_index('ix_notification_logs_user_id', 'notification_logs')
    op.drop_table('notification_logs')

    # Drop notification_preferences index and table
    op.drop_index('ix_notification_preferences_user_id', 'notification_preferences')
    op.drop_table('notification_preferences')

    # Drop device_tokens indexes and table
    op.drop_index('ix_device_tokens_endpoint', 'device_tokens')
    op.drop_index('ix_device_tokens_is_active', 'device_tokens')
    op.drop_index('ix_device_tokens_platform', 'device_tokens')
    op.drop_index('ix_device_tokens_user_id', 'device_tokens')
    op.drop_table('device_tokens')
