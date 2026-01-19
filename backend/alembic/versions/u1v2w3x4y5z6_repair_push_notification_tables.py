"""Repair: Create push notification tables if missing

Revision ID: u1v2w3x4y5z6
Revises: t0u1v2w3x4y5
Create Date: 2026-01-19

This migration repairs the database state when push notification tables were
accidentally skipped due to a migration branch issue.

The original migration q1r2s3t4u5v6 created these tables, but due to a
migration chain fork, some environments may be missing them while alembic
thinks they're at the head revision.

This migration is idempotent - it only creates tables if they don't exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = 'u1v2w3x4y5z6'
down_revision: Union[str, None] = 't0u1v2w3x4y5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    return table_name in inspector.get_table_names()


def index_exists(table_name: str, index_name: str) -> bool:
    """Check if an index exists on a table."""
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    if table_name not in inspector.get_table_names():
        return False
    indexes = inspector.get_indexes(table_name)
    return any(idx['name'] == index_name for idx in indexes)


def upgrade() -> None:
    # Create device_tokens table if it doesn't exist
    if not table_exists('device_tokens'):
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
        op.create_index('ix_device_tokens_endpoint', 'device_tokens', ['endpoint'], unique=True)

        print("Created device_tokens table and indexes")
    else:
        print("device_tokens table already exists, skipping")

    # Create notification_preferences table if it doesn't exist
    if not table_exists('notification_preferences'):
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

        print("Created notification_preferences table and index")
    else:
        print("notification_preferences table already exists, skipping")

    # Create notification_logs table if it doesn't exist
    if not table_exists('notification_logs'):
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
        op.create_index(
            'ix_notification_logs_user_type_created',
            'notification_logs',
            ['user_id', 'notification_type', 'created_at']
        )

        print("Created notification_logs table and indexes")
    else:
        print("notification_logs table already exists, skipping")


def downgrade() -> None:
    # Drop tables in reverse order (due to foreign key constraints)
    if table_exists('notification_logs'):
        op.drop_index('ix_notification_logs_user_type_created', 'notification_logs')
        op.drop_index('ix_notification_logs_created_at', 'notification_logs')
        op.drop_index('ix_notification_logs_status', 'notification_logs')
        op.drop_index('ix_notification_logs_notification_type', 'notification_logs')
        op.drop_index('ix_notification_logs_device_token_id', 'notification_logs')
        op.drop_index('ix_notification_logs_user_id', 'notification_logs')
        op.drop_table('notification_logs')

    if table_exists('notification_preferences'):
        op.drop_index('ix_notification_preferences_user_id', 'notification_preferences')
        op.drop_table('notification_preferences')

    if table_exists('device_tokens'):
        op.drop_index('ix_device_tokens_endpoint', 'device_tokens')
        op.drop_index('ix_device_tokens_is_active', 'device_tokens')
        op.drop_index('ix_device_tokens_platform', 'device_tokens')
        op.drop_index('ix_device_tokens_user_id', 'device_tokens')
        op.drop_table('device_tokens')
