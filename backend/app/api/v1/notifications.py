"""
Push notification API endpoints.

Provides endpoints for:
- Getting the VAPID public key for web push subscriptions
- Device registration/unregistration
- Notification preferences management
- Sending test notifications
- Batch check-in reminder sending (for Cloud Scheduler)
"""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.notification import Platform
from app.services.push_notification import push_notification_service
from app.services.checkin_reminder import checkin_reminder_service
from app.schemas.notification import (
    DeviceTokenCreate,
    DeviceTokenOut,
    DeviceTokenList,
    NotificationPreferenceOut,
    NotificationPreferenceUpdate,
    VapidPublicKeyOut,
    TestNotificationRequest,
    TestNotificationResponse,
    CheckinReminderResponse,
)
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# === Public Endpoints ===

@router.get("/vapid-public-key", response_model=VapidPublicKeyOut)
async def get_vapid_public_key():
    """
    Get the VAPID public key for web push subscriptions.

    This endpoint is public and returns the application's VAPID public key
    which is needed by the frontend to create push subscriptions.

    The key is base64url-encoded and ready to use with the Push API.
    """
    if not settings.vapid_public_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Push notifications are not configured"
        )

    return VapidPublicKeyOut(public_key=settings.vapid_public_key)


# === Device Management Endpoints ===

@router.post("/devices", response_model=DeviceTokenOut, status_code=status.HTTP_201_CREATED)
async def register_device(
    device: DeviceTokenCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Register a device for push notifications.

    For web push subscriptions, provide:
    - platform: "web"
    - endpoint: The push service endpoint URL from PushSubscription
    - p256dh_key: The p256dh key from PushSubscription.keys
    - auth_key: The auth key from PushSubscription.keys
    - device_name: Optional friendly name (e.g., "Chrome on MacBook")

    If a device with the same endpoint already exists, it will be updated
    and reactivated if it was previously deactivated.
    """
    # Validate platform
    valid_platforms = [p.value for p in Platform]
    if device.platform not in valid_platforms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid platform. Must be one of: {', '.join(valid_platforms)}"
        )

    # Validate web push specific fields
    if device.platform == Platform.WEB.value:
        if not device.p256dh_key or not device.auth_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Web push subscriptions require p256dh_key and auth_key"
            )

        # Validate using provider
        if not push_notification_service.web_provider.validate_subscription(
            endpoint=device.endpoint,
            p256dh_key=device.p256dh_key,
            auth_key=device.auth_key,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid web push subscription data"
            )

    device_token = await push_notification_service.register_device(
        db=db,
        user_id=current_user.id,
        platform=device.platform,
        endpoint=device.endpoint,
        p256dh_key=device.p256dh_key,
        auth_key=device.auth_key,
        device_name=device.device_name,
    )

    return device_token


@router.get("/devices", response_model=DeviceTokenList)
async def get_my_devices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all registered devices for the current user.

    Returns only active devices by default. Inactive devices (expired subscriptions)
    are not included.
    """
    devices = await push_notification_service.get_user_devices(
        db=db,
        user_id=current_user.id,
        active_only=True,
    )

    return DeviceTokenList(
        devices=[DeviceTokenOut.model_validate(d) for d in devices],
        count=len(devices),
    )


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unregister_device(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Unregister (delete) a device.

    Users can only delete their own devices. Returns 204 on success,
    404 if device not found or doesn't belong to the user.
    """
    success = await push_notification_service.unregister_device(
        db=db,
        device_id=device_id,
        user_id=current_user.id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )


# === Preference Management Endpoints ===

@router.get("/preferences", response_model=NotificationPreferenceOut)
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get notification preferences for the current user.

    If no preferences exist, default preferences are created and returned.
    """
    preferences = await push_notification_service.get_or_create_preferences(
        db=db,
        user_id=current_user.id,
    )

    return preferences


@router.patch("/preferences", response_model=NotificationPreferenceOut)
async def update_preferences(
    updates: NotificationPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update notification preferences for the current user.

    Only provided fields are updated. Omitted fields remain unchanged.

    Fields:
    - daily_checkin_reminder: Enable/disable daily check-in reminders
    - reminder_time: Preferred time for reminders (HH:MM:SS format)
    - timezone: User's timezone (e.g., "America/New_York")
    """
    preferences = await push_notification_service.update_preferences(
        db=db,
        user_id=current_user.id,
        daily_checkin_reminder=updates.daily_checkin_reminder,
        reminder_time=updates.reminder_time,
        timezone=updates.timezone,
    )

    return preferences


# === Test Notification Endpoint ===

@router.post("/test", response_model=TestNotificationResponse)
async def send_test_notification(
    request: TestNotificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Send a test notification to the current user.

    By default, sends to all of the user's registered devices.
    Optionally specify a device_id to send to a specific device only.

    This is useful for verifying that push notifications are working correctly.
    """
    if not settings.vapid_private_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Push notifications are not configured"
        )

    result = await push_notification_service.send_test_notification(
        db=db,
        user_id=current_user.id,
        title=request.title or "Test Notification",
        body=request.body or "This is a test notification from TrainSmart!",
        device_id=request.device_id,
    )

    return TestNotificationResponse(
        success=result["success"],
        message=result["message"],
        devices_notified=result["devices_notified"],
    )


# === Scheduled Notification Endpoints (Internal) ===

@router.post("/send-checkin-reminders", response_model=CheckinReminderResponse)
async def send_checkin_reminders(
    db: AsyncSession = Depends(get_db),
    x_scheduler_api_key: Optional[str] = Header(None, alias="X-Scheduler-API-Key"),
):
    """
    Send check-in reminders to all eligible users.

    This endpoint is designed to be called by Cloud Scheduler at 9 AM and 2 PM EST.
    It will be secured with OIDC authentication in production.

    **Eligibility criteria:**
    - User has daily_checkin_reminder = true in notification_preferences
    - User has at least one active device in device_tokens
    - User has NOT checked in today (based on EST timezone)
    - User has NOT already received a daily_checkin notification today

    **Authentication:**
    For now, this endpoint accepts an optional X-Scheduler-API-Key header.
    In production, this will be replaced with Cloud Scheduler OIDC token validation.
    If SCHEDULER_API_KEY is configured and the header doesn't match, returns 401.

    **Response:**
    - sent: Number of users who received reminders successfully
    - skipped: Number of users skipped (e.g., device deactivated mid-process)
    - failed: Number of users where notification delivery failed
    - errors: Details of failures (only present if failed > 0)
    """
    # Simple API key auth (will be replaced with OIDC in production)
    # If SCHEDULER_API_KEY is set in config, require it
    expected_key = getattr(settings, "scheduler_api_key", None)
    if expected_key and x_scheduler_api_key != expected_key:
        logger.warning("Unauthorized attempt to call send-checkin-reminders")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing scheduler API key",
        )

    if not settings.vapid_private_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Push notifications are not configured",
        )

    logger.info("Check-in reminder endpoint called")

    result = await checkin_reminder_service.send_checkin_reminders(db)

    return CheckinReminderResponse(
        sent=result.sent,
        skipped=result.skipped,
        failed=result.failed,
        errors=result.errors if result.errors else None,
    )


@router.get("/debug-eligibility")
async def debug_reminder_eligibility(
    db: AsyncSession = Depends(get_db),
):
    """
    Debug endpoint to check why users aren't eligible for reminders.
    Returns counts at each stage of the eligibility query.
    """
    from sqlalchemy import select, func
    from app.models.notification import NotificationPreference, DeviceToken, NotificationLog, NotificationType
    from app.models.checkin import CheckIn
    from app.models.user import User
    from datetime import datetime
    from zoneinfo import ZoneInfo

    # Get today boundaries in EST -> UTC
    EASTERN_TZ = ZoneInfo("America/New_York")
    now_eastern = datetime.now(EASTERN_TZ)
    today = now_eastern.date()
    from datetime import timezone
    start_of_day_eastern = datetime.combine(today, datetime.min.time(), tzinfo=EASTERN_TZ)
    end_of_day_eastern = datetime.combine(today, datetime.max.time(), tzinfo=EASTERN_TZ)
    start_of_day_utc = start_of_day_eastern.astimezone(timezone.utc).replace(tzinfo=None)
    end_of_day_utc = end_of_day_eastern.astimezone(timezone.utc).replace(tzinfo=None)

    # Count total users
    total_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar()

    # Count users with notification preferences
    users_with_prefs = (await db.execute(
        select(func.count(NotificationPreference.id))
    )).scalar()

    # Count users with daily_checkin_reminder = true
    users_with_reminders_on = (await db.execute(
        select(func.count(NotificationPreference.id))
        .where(NotificationPreference.daily_checkin_reminder == True)
    )).scalar()

    # Count users with active devices
    users_with_devices = (await db.execute(
        select(func.count(func.distinct(DeviceToken.user_id)))
        .where(DeviceToken.is_active == True)
    )).scalar()

    # Count users who checked in today
    users_checked_in_today = (await db.execute(
        select(func.count(func.distinct(CheckIn.user_id)))
        .where(CheckIn.created_at >= start_of_day_utc)
        .where(CheckIn.created_at <= end_of_day_utc)
    )).scalar()

    # Count users already notified today
    users_notified_today = (await db.execute(
        select(func.count(func.distinct(NotificationLog.user_id)))
        .where(NotificationLog.notification_type == NotificationType.DAILY_CHECKIN.value)
        .where(NotificationLog.created_at >= start_of_day_utc)
        .where(NotificationLog.created_at <= end_of_day_utc)
    )).scalar()

    # Get eligible users count using the actual service
    eligible = await checkin_reminder_service.get_users_needing_reminder(db)

    return {
        "today_est": str(today),
        "start_utc": str(start_of_day_utc),
        "end_utc": str(end_of_day_utc),
        "counts": {
            "total_active_users": total_users,
            "users_with_notification_prefs": users_with_prefs,
            "users_with_reminders_enabled": users_with_reminders_on,
            "users_with_active_devices": users_with_devices,
            "users_checked_in_today": users_checked_in_today,
            "users_already_notified_today": users_notified_today,
            "eligible_for_reminder": len(eligible),
        },
        "eligible_users": [{"id": str(u.user_id), "email": u.email} for u in eligible],
    }
