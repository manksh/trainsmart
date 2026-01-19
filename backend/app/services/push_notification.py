"""
Push notification service.

Provides high-level operations for managing device registrations,
user preferences, and sending notifications.
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import (
    DeviceToken,
    NotificationPreference,
    NotificationLog,
    Platform,
    NotificationStatus,
    NotificationType,
)
from app.models.user import User
from app.services.push_providers import WebPushProvider, PushResult
from app.schemas.notification import NotificationPayload
from app.config import settings

logger = logging.getLogger(__name__)


class PushNotificationService:
    """
    Service for managing push notifications.

    Handles device registration, preference management, and notification delivery
    across different platforms (web, iOS, Android).
    """

    def __init__(self):
        """Initialize the service with configured providers."""
        self._web_provider = WebPushProvider()
        # Future: Add iOS and Android providers here

    @property
    def web_provider(self) -> WebPushProvider:
        """Get the web push provider."""
        return self._web_provider

    # === Device Registration ===

    async def register_device(
        self,
        db: AsyncSession,
        user_id: UUID,
        platform: str,
        endpoint: str,
        p256dh_key: Optional[str] = None,
        auth_key: Optional[str] = None,
        device_name: Optional[str] = None,
    ) -> DeviceToken:
        """
        Register a device for push notifications.

        If a device with the same endpoint already exists, it will be updated
        and reactivated if it was previously deactivated.

        Args:
            db: Database session
            user_id: ID of the user registering the device
            platform: Platform type (web, ios, android)
            endpoint: Push service endpoint URL
            p256dh_key: Web push encryption key (required for web)
            auth_key: Web push auth secret (required for web)
            device_name: Optional user-friendly device name

        Returns:
            The created or updated DeviceToken record
        """
        # Check if device already exists (by endpoint)
        result = await db.execute(
            select(DeviceToken).where(DeviceToken.endpoint == endpoint)
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing device
            existing.user_id = user_id
            existing.platform = platform
            existing.p256dh_key = p256dh_key
            existing.auth_key = auth_key
            existing.device_name = device_name
            existing.is_active = True  # Reactivate if was deactivated
            existing.updated_at = datetime.utcnow()

            await db.commit()
            await db.refresh(existing)
            logger.info(f"Updated device token for user {user_id}")
            return existing

        # Create new device token
        device_token = DeviceToken(
            user_id=user_id,
            platform=platform,
            endpoint=endpoint,
            p256dh_key=p256dh_key,
            auth_key=auth_key,
            device_name=device_name,
            is_active=True,
        )

        db.add(device_token)
        await db.commit()
        await db.refresh(device_token)

        logger.info(f"Registered new device for user {user_id}")
        return device_token

    async def unregister_device(
        self,
        db: AsyncSession,
        device_id: UUID,
        user_id: UUID,
    ) -> bool:
        """
        Unregister (delete) a device.

        Args:
            db: Database session
            device_id: ID of the device to unregister
            user_id: ID of the user (for authorization)

        Returns:
            True if device was deleted, False if not found or unauthorized
        """
        result = await db.execute(
            select(DeviceToken).where(
                and_(
                    DeviceToken.id == device_id,
                    DeviceToken.user_id == user_id,
                )
            )
        )
        device = result.scalar_one_or_none()

        if not device:
            return False

        await db.delete(device)
        await db.commit()

        logger.info(f"Unregistered device {device_id} for user {user_id}")
        return True

    async def deactivate_device(
        self,
        db: AsyncSession,
        device_id: UUID,
    ) -> None:
        """
        Mark a device as inactive (e.g., after subscription expiry).

        Args:
            db: Database session
            device_id: ID of the device to deactivate
        """
        result = await db.execute(
            select(DeviceToken).where(DeviceToken.id == device_id)
        )
        device = result.scalar_one_or_none()

        if device:
            device.is_active = False
            device.updated_at = datetime.utcnow()
            await db.commit()
            logger.info(f"Deactivated device {device_id}")

    async def get_user_devices(
        self,
        db: AsyncSession,
        user_id: UUID,
        active_only: bool = True,
    ) -> List[DeviceToken]:
        """
        Get all devices registered for a user.

        Args:
            db: Database session
            user_id: ID of the user
            active_only: If True, only return active devices

        Returns:
            List of DeviceToken records
        """
        query = select(DeviceToken).where(DeviceToken.user_id == user_id)

        if active_only:
            query = query.where(DeviceToken.is_active == True)

        query = query.order_by(DeviceToken.created_at.desc())

        result = await db.execute(query)
        return list(result.scalars().all())

    # === Notification Preferences ===

    async def get_or_create_preferences(
        self,
        db: AsyncSession,
        user_id: UUID,
    ) -> NotificationPreference:
        """
        Get or create notification preferences for a user.

        Args:
            db: Database session
            user_id: ID of the user

        Returns:
            NotificationPreference record (existing or newly created)
        """
        result = await db.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == user_id
            )
        )
        preferences = result.scalar_one_or_none()

        if preferences:
            return preferences

        # Create default preferences
        preferences = NotificationPreference(
            user_id=user_id,
            daily_checkin_reminder=True,
            timezone="America/New_York",
        )

        db.add(preferences)
        await db.commit()
        await db.refresh(preferences)

        logger.info(f"Created default notification preferences for user {user_id}")
        return preferences

    async def update_preferences(
        self,
        db: AsyncSession,
        user_id: UUID,
        daily_checkin_reminder: Optional[bool] = None,
        reminder_time: Optional[Any] = None,
        timezone: Optional[str] = None,
    ) -> NotificationPreference:
        """
        Update notification preferences for a user.

        Args:
            db: Database session
            user_id: ID of the user
            daily_checkin_reminder: Enable/disable daily reminders
            reminder_time: Preferred reminder time
            timezone: User's timezone

        Returns:
            Updated NotificationPreference record
        """
        preferences = await self.get_or_create_preferences(db, user_id)

        if daily_checkin_reminder is not None:
            preferences.daily_checkin_reminder = daily_checkin_reminder

        if reminder_time is not None:
            preferences.reminder_time = reminder_time

        if timezone is not None:
            preferences.timezone = timezone

        preferences.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(preferences)

        logger.info(f"Updated notification preferences for user {user_id}")
        return preferences

    # === Sending Notifications ===

    async def send_to_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        notification_type: str,
        payload: NotificationPayload,
    ) -> Dict[str, Any]:
        """
        Send a notification to all of a user's active devices.

        Args:
            db: Database session
            user_id: ID of the user to notify
            notification_type: Type of notification (for logging)
            payload: Notification content

        Returns:
            Dict with results summary (devices_notified, failures, etc.)
        """
        devices = await self.get_user_devices(db, user_id, active_only=True)

        if not devices:
            logger.info(f"No active devices for user {user_id}")
            return {
                "success": False,
                "message": "No active devices",
                "devices_notified": 0,
                "failures": 0,
            }

        results = {
            "success": True,
            "devices_notified": 0,
            "failures": 0,
            "errors": [],
        }

        for device in devices:
            result = await self.send_to_device(
                db=db,
                device=device,
                notification_type=notification_type,
                payload=payload,
            )

            if result.is_success:
                results["devices_notified"] += 1
            else:
                results["failures"] += 1
                results["errors"].append({
                    "device_id": str(device.id),
                    "error": result.message,
                })

        results["success"] = results["devices_notified"] > 0
        results["message"] = f"Sent to {results['devices_notified']} devices"

        return results

    async def send_to_device(
        self,
        db: AsyncSession,
        device: DeviceToken,
        notification_type: str,
        payload: NotificationPayload,
    ) -> PushResult:
        """
        Send a notification to a specific device.

        Creates a log entry and handles delivery status updates.

        Args:
            db: Database session
            device: DeviceToken to send to
            notification_type: Type of notification
            payload: Notification content

        Returns:
            PushResult indicating delivery status
        """
        # Create log entry
        log_entry = NotificationLog(
            user_id=device.user_id,
            device_token_id=device.id,
            notification_type=notification_type,
            title=payload.title,
            body=payload.body,
            data=payload.data,
            status=NotificationStatus.PENDING.value,
        )
        db.add(log_entry)
        await db.commit()

        # Send based on platform
        if device.platform == Platform.WEB.value:
            result = await self._send_web_push(device, payload)
        else:
            # Future: Handle iOS and Android
            result = PushResult.failed(f"Platform {device.platform} not supported")

        # Update log entry with result
        if result.is_success:
            log_entry.mark_sent()
            device.last_used_at = datetime.utcnow()
        else:
            log_entry.mark_failed(result.message)

        # Handle expired subscriptions
        if result.should_deactivate:
            await self.deactivate_device(db, device.id)

        await db.commit()

        return result

    async def _send_web_push(
        self,
        device: DeviceToken,
        payload: NotificationPayload,
    ) -> PushResult:
        """
        Send a web push notification.

        Args:
            device: DeviceToken with web push subscription info
            payload: Notification content

        Returns:
            PushResult from the web push provider
        """
        return await self._web_provider.send(
            endpoint=device.endpoint,
            payload=payload.to_web_push_payload(),
            p256dh_key=device.p256dh_key,
            auth_key=device.auth_key,
        )

    # === Testing ===

    async def send_test_notification(
        self,
        db: AsyncSession,
        user_id: UUID,
        title: str = "Test Notification",
        body: str = "This is a test notification from TrainSmart!",
        device_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Send a test notification to a user or specific device.

        Args:
            db: Database session
            user_id: ID of the user
            title: Notification title
            body: Notification body
            device_id: Optional specific device ID

        Returns:
            Dict with results
        """
        payload = NotificationPayload(
            title=title,
            body=body,
            data={
                "type": "test",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

        if device_id:
            # Send to specific device
            result = await db.execute(
                select(DeviceToken).where(
                    and_(
                        DeviceToken.id == device_id,
                        DeviceToken.user_id == user_id,
                    )
                )
            )
            device = result.scalar_one_or_none()

            if not device:
                return {
                    "success": False,
                    "message": "Device not found",
                    "devices_notified": 0,
                }

            push_result = await self.send_to_device(
                db=db,
                device=device,
                notification_type=NotificationType.TEST.value,
                payload=payload,
            )

            return {
                "success": push_result.is_success,
                "message": push_result.message,
                "devices_notified": 1 if push_result.is_success else 0,
            }

        # Send to all devices
        return await self.send_to_user(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.TEST.value,
            payload=payload,
        )


# Singleton instance for convenience
push_notification_service = PushNotificationService()
