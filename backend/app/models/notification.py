"""
Push notification models for PWA support.

Includes:
- DeviceToken: Stores push subscription information for web/mobile devices
- NotificationPreference: User-level notification settings
- NotificationLog: Audit log of all sent notifications
"""

import uuid
from enum import Enum
from datetime import datetime, time
from typing import Optional, Dict, Any

from sqlalchemy import String, Text, DateTime, Time, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class Platform(str, Enum):
    """Supported push notification platforms."""
    WEB = "web"
    IOS = "ios"
    ANDROID = "android"


class NotificationStatus(str, Enum):
    """Status of a notification delivery attempt."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class NotificationType(str, Enum):
    """Types of notifications the system can send."""
    DAILY_CHECKIN = "daily_checkin"
    MODULE_REMINDER = "module_reminder"
    COACHING_TIP = "coaching_tip"
    SYSTEM = "system"
    TEST = "test"


class DeviceToken(Base):
    """
    Stores push notification subscription information for a user's device.

    For web push, this includes the endpoint URL and encryption keys (p256dh, auth).
    For mobile platforms, this would store the device token/registration ID.
    """
    __tablename__ = "device_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # User who owns this device
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Platform type (web, ios, android)
    platform: Mapped[str] = mapped_column(String(20), nullable=False, default=Platform.WEB.value)

    # Push service endpoint URL (required for all platforms)
    endpoint: Mapped[str] = mapped_column(Text, nullable=False, unique=True)

    # Web push specific: User's public key for payload encryption
    p256dh_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Web push specific: Auth secret for payload encryption
    auth_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optional user-friendly device name (e.g., "Chrome on MacBook")
    device_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Whether this subscription is still valid (set to False on 410/404 errors)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Last time a notification was successfully sent to this device
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="device_tokens", lazy="selectin")
    notification_logs = relationship(
        "NotificationLog", back_populates="device_token", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<DeviceToken {self.id} user={self.user_id} platform={self.platform}>"

    @property
    def is_web_push(self) -> bool:
        """Check if this is a web push subscription."""
        return self.platform == Platform.WEB.value

    def to_web_push_subscription(self) -> dict:
        """
        Convert to the format expected by pywebpush.

        Returns dict with 'endpoint' and 'keys' for web push subscriptions.
        """
        if not self.is_web_push:
            raise ValueError("Cannot convert non-web subscription to web push format")

        return {
            "endpoint": self.endpoint,
            "keys": {
                "p256dh": self.p256dh_key,
                "auth": self.auth_key,
            }
        }


class NotificationPreference(Base):
    """
    User-level notification preferences.

    Controls what notifications a user receives and when.
    One record per user (unique constraint on user_id).
    """
    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # User these preferences belong to (unique - one record per user)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    # Whether to send daily check-in reminders
    daily_checkin_reminder: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Preferred time for reminders (in user's timezone)
    reminder_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)

    # User's timezone for scheduling notifications
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="America/New_York")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="notification_preferences", lazy="selectin")

    def __repr__(self) -> str:
        return f"<NotificationPreference {self.id} user={self.user_id}>"


class NotificationLog(Base):
    """
    Audit log of all notification delivery attempts.

    Tracks what notifications were sent, to which devices, and their delivery status.
    Useful for debugging, analytics, and retry logic.
    """
    __tablename__ = "notification_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # User this notification was sent to
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Specific device (NULL if sent to all user's devices)
    device_token_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("device_tokens.id", ondelete="SET NULL"), nullable=True
    )

    # Type of notification (daily_checkin, module_reminder, etc.)
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Notification content
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Additional payload data (e.g., deep link URL, action buttons)
    data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Delivery status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=NotificationStatus.PENDING.value
    )

    # Error message if delivery failed
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # When the notification was actually sent (NULL if pending/failed before send)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Record creation time (when notification was queued)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notification_logs", lazy="selectin")
    device_token = relationship("DeviceToken", back_populates="notification_logs", lazy="selectin")

    def __repr__(self) -> str:
        return f"<NotificationLog {self.id} type={self.notification_type} status={self.status}>"

    def mark_sent(self) -> None:
        """Mark this notification as successfully sent."""
        self.status = NotificationStatus.SENT.value
        self.sent_at = datetime.utcnow()
        self.error_message = None

    def mark_failed(self, error: str) -> None:
        """Mark this notification as failed with an error message."""
        self.status = NotificationStatus.FAILED.value
        self.error_message = error
