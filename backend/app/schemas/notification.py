"""
Pydantic schemas for push notifications.

Includes schemas for device registration, preferences, and notification payloads.
"""

from datetime import datetime, time
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, Field


# === Device Token Schemas ===

class DeviceTokenCreate(BaseModel):
    """
    Schema for registering a new device for push notifications.

    For web push, all fields are required.
    For mobile platforms, only endpoint is required.
    """
    platform: str = Field(
        default="web",
        description="Platform type: web, ios, or android"
    )
    endpoint: str = Field(
        ...,
        description="Push service endpoint URL"
    )
    p256dh_key: Optional[str] = Field(
        None,
        description="Web push: User's public key for payload encryption"
    )
    auth_key: Optional[str] = Field(
        None,
        description="Web push: Auth secret for payload encryption"
    )
    device_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional user-friendly device name"
    )


class DeviceTokenOut(BaseModel):
    """Response schema for a registered device token."""
    id: UUID
    user_id: UUID
    platform: str
    endpoint: str
    device_name: Optional[str] = None
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeviceTokenList(BaseModel):
    """List of user's registered devices."""
    devices: List[DeviceTokenOut]
    count: int


# === Notification Preference Schemas ===

class NotificationPreferenceOut(BaseModel):
    """Response schema for notification preferences."""
    id: UUID
    user_id: UUID
    daily_checkin_reminder: bool
    reminder_time: Optional[time] = None
    timezone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    """Schema for updating notification preferences."""
    daily_checkin_reminder: Optional[bool] = Field(
        None,
        description="Whether to send daily check-in reminders"
    )
    reminder_time: Optional[time] = Field(
        None,
        description="Preferred time for reminders (HH:MM:SS format)"
    )
    timezone: Optional[str] = Field(
        None,
        max_length=50,
        description="User's timezone (e.g., 'America/New_York')"
    )


# === VAPID Key Schema ===

class VapidPublicKeyOut(BaseModel):
    """Response schema for the public VAPID key."""
    public_key: str = Field(
        ...,
        description="Base64url-encoded VAPID public key for web push subscription"
    )


# === Test Notification Schema ===

class TestNotificationRequest(BaseModel):
    """Schema for sending a test notification."""
    title: Optional[str] = Field(
        default="Test Notification",
        max_length=255,
        description="Notification title"
    )
    body: Optional[str] = Field(
        default="This is a test notification from TrainSmart!",
        description="Notification body text"
    )
    device_id: Optional[UUID] = Field(
        None,
        description="Specific device to send to (optional, defaults to all devices)"
    )


class TestNotificationResponse(BaseModel):
    """Response schema for test notification."""
    success: bool
    message: str
    devices_notified: int


# === Check-in Reminder Schemas ===

class CheckinReminderResponse(BaseModel):
    """Response schema for check-in reminder batch send."""
    sent: int = Field(
        ...,
        description="Number of users who received reminders successfully"
    )
    skipped: int = Field(
        ...,
        description="Number of users skipped (e.g., device deactivated mid-process)"
    )
    failed: int = Field(
        ...,
        description="Number of users where notification delivery failed"
    )
    errors: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Details of failures (only present if failed > 0)"
    )


# === Notification Log Schemas ===

class NotificationLogOut(BaseModel):
    """Response schema for a notification log entry."""
    id: UUID
    user_id: UUID
    device_token_id: Optional[UUID] = None
    notification_type: str
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# === Internal Notification Payload Schema ===

class NotificationPayload(BaseModel):
    """
    Internal schema for notification content.

    Used by PushNotificationService to structure notification data.
    """
    title: str = Field(..., max_length=255)
    body: str
    icon: Optional[str] = Field(
        default="/icons/icon-192x192.png",
        description="URL to notification icon"
    )
    badge: Optional[str] = Field(
        default="/icons/badge-72x72.png",
        description="URL to notification badge"
    )
    tag: Optional[str] = Field(
        None,
        description="Tag for notification grouping/replacement"
    )
    data: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Custom data payload for the notification"
    )
    actions: Optional[List[Dict[str, str]]] = Field(
        None,
        description="Action buttons for the notification"
    )
    require_interaction: bool = Field(
        default=False,
        description="Whether notification should remain until user interacts"
    )
    silent: bool = Field(
        default=False,
        description="Whether to suppress sound/vibration"
    )

    def to_web_push_payload(self) -> dict:
        """Convert to the format expected by service workers."""
        payload = {
            "title": self.title,
            "body": self.body,
            "icon": self.icon,
            "badge": self.badge,
            "data": self.data or {},
        }

        if self.tag:
            payload["tag"] = self.tag
        if self.actions:
            payload["actions"] = self.actions
        if self.require_interaction:
            payload["requireInteraction"] = True
        if self.silent:
            payload["silent"] = True

        return payload
