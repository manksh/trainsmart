"""
Check-in reminder notification service.

Sends daily check-in reminders to users who have opted in and haven't
checked in today. Designed to be called by Cloud Scheduler at 9 AM and 2 PM EST.
"""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from uuid import UUID
from dataclasses import dataclass

from sqlalchemy import select, and_, exists
from sqlalchemy.ext.asyncio import AsyncSession
from zoneinfo import ZoneInfo

from app.models.notification import (
    NotificationPreference,
    DeviceToken,
    NotificationLog,
    NotificationType,
)
from app.models.checkin import CheckIn
from app.models.user import User
from app.services.push_notification import push_notification_service
from app.schemas.notification import NotificationPayload

logger = logging.getLogger(__name__)

# Use Eastern Time for "today" calculation
EASTERN_TZ = ZoneInfo("America/New_York")

# Notification content
CHECKIN_REMINDER_TITLE = "Time for your check-in"
CHECKIN_REMINDER_BODY = "Take a moment to check in with yourself today."
CHECKIN_REMINDER_DATA = {"type": "daily_checkin", "url": "/checkin"}


@dataclass
class ReminderResult:
    """Result of sending reminders to all eligible users."""

    sent: int
    skipped: int
    failed: int
    errors: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "sent": self.sent,
            "skipped": self.skipped,
            "failed": self.failed,
            "errors": self.errors if self.errors else None,
        }


@dataclass
class EligibleUser:
    """A user eligible for a check-in reminder."""

    user_id: UUID
    email: str


class CheckinReminderService:
    """
    Service for sending check-in reminder notifications.

    Handles the logic for determining which users should receive reminders
    and orchestrating the notification delivery.
    """

    def _get_today_boundaries_utc(self) -> tuple[datetime, datetime]:
        """
        Get the start and end of "today" in EST, converted to UTC.

        Returns:
            Tuple of (start_of_day_utc, end_of_day_utc) as naive datetimes
            (matching how timestamps are stored in the database).
        """
        now_eastern = datetime.now(EASTERN_TZ)
        today = now_eastern.date()

        # Create timezone-aware boundaries in Eastern Time
        start_of_day_eastern = datetime.combine(
            today, datetime.min.time(), tzinfo=EASTERN_TZ
        )
        end_of_day_eastern = datetime.combine(
            today, datetime.max.time(), tzinfo=EASTERN_TZ
        )

        # Convert to UTC and strip timezone info for DB comparison
        start_of_day_utc = start_of_day_eastern.astimezone(timezone.utc).replace(
            tzinfo=None
        )
        end_of_day_utc = end_of_day_eastern.astimezone(timezone.utc).replace(
            tzinfo=None
        )

        return start_of_day_utc, end_of_day_utc

    async def get_users_needing_reminder(
        self, db: AsyncSession
    ) -> List[EligibleUser]:
        """
        Query users who are eligible for a check-in reminder.

        Eligibility criteria:
        1. User has daily_checkin_reminder = true in notification_preferences
        2. User has at least one active device in device_tokens
        3. User has NOT checked in today (based on EST timezone)
        4. User has NOT already received a daily_checkin notification today

        Args:
            db: Database session

        Returns:
            List of EligibleUser objects
        """
        start_of_day_utc, end_of_day_utc = self._get_today_boundaries_utc()

        # Subquery: users who have checked in today (any check-in type counts)
        checked_in_today_subq = (
            select(CheckIn.user_id)
            .where(
                and_(
                    CheckIn.created_at >= start_of_day_utc,
                    CheckIn.created_at <= end_of_day_utc,
                )
            )
            .distinct()
        ).subquery()

        # Subquery: users who have already received a daily_checkin notification today
        already_notified_subq = (
            select(NotificationLog.user_id)
            .where(
                and_(
                    NotificationLog.notification_type == NotificationType.DAILY_CHECKIN.value,
                    NotificationLog.created_at >= start_of_day_utc,
                    NotificationLog.created_at <= end_of_day_utc,
                )
            )
            .distinct()
        ).subquery()

        # Subquery: users with at least one active device
        has_active_device_subq = (
            select(DeviceToken.user_id)
            .where(DeviceToken.is_active == True)
            .distinct()
        ).subquery()

        # Main query: find eligible users
        query = (
            select(User.id, User.email)
            .join(
                NotificationPreference,
                NotificationPreference.user_id == User.id,
            )
            .where(
                and_(
                    # User is active
                    User.is_active == True,
                    # User has opted in for daily check-in reminders
                    NotificationPreference.daily_checkin_reminder == True,
                    # User has at least one active device
                    User.id.in_(select(has_active_device_subq.c.user_id)),
                    # User has NOT checked in today
                    ~User.id.in_(select(checked_in_today_subq.c.user_id)),
                    # User has NOT already received a reminder today
                    ~User.id.in_(select(already_notified_subq.c.user_id)),
                )
            )
        )

        result = await db.execute(query)
        rows = result.all()

        return [EligibleUser(user_id=row.id, email=row.email) for row in rows]

    async def send_checkin_reminders(self, db: AsyncSession) -> ReminderResult:
        """
        Send check-in reminders to all eligible users.

        This is the main entry point, designed to be called by Cloud Scheduler
        at 9 AM and 2 PM EST. It handles both time slots correctly because:
        - At 9 AM: Users who haven't checked in get a reminder
        - At 2 PM: Only users who STILL haven't checked in AND didn't get the
          9 AM reminder (due to duplicate prevention) get reminded

        Args:
            db: Database session

        Returns:
            ReminderResult with counts of sent, skipped, and failed notifications
        """
        logger.info("Starting check-in reminder job")

        # Get eligible users
        eligible_users = await self.get_users_needing_reminder(db)

        if not eligible_users:
            logger.info("No users eligible for check-in reminders")
            return ReminderResult(sent=0, skipped=0, failed=0, errors=[])

        logger.info(f"Found {len(eligible_users)} users eligible for reminders")

        # Prepare notification payload
        payload = NotificationPayload(
            title=CHECKIN_REMINDER_TITLE,
            body=CHECKIN_REMINDER_BODY,
            data=CHECKIN_REMINDER_DATA,
            tag="daily-checkin",  # Allows OS to group/replace similar notifications
        )

        sent = 0
        skipped = 0
        failed = 0
        errors: List[Dict[str, Any]] = []

        for user in eligible_users:
            try:
                result = await push_notification_service.send_to_user(
                    db=db,
                    user_id=user.user_id,
                    notification_type=NotificationType.DAILY_CHECKIN.value,
                    payload=payload,
                )

                if result.get("success"):
                    sent += 1
                    logger.info(
                        f"Sent check-in reminder to user {user.user_id} "
                        f"({result.get('devices_notified', 0)} devices)"
                    )
                elif result.get("message") == "No active devices":
                    # This shouldn't happen due to our query, but handle it gracefully
                    skipped += 1
                    logger.warning(
                        f"Skipped user {user.user_id}: no active devices "
                        "(edge case - device deactivated after query)"
                    )
                else:
                    failed += 1
                    error_detail = {
                        "user_id": str(user.user_id),
                        "email": user.email,
                        "error": result.get("message", "Unknown error"),
                    }
                    errors.append(error_detail)
                    logger.error(f"Failed to send reminder to {user.user_id}: {result}")

            except Exception as e:
                failed += 1
                error_detail = {
                    "user_id": str(user.user_id),
                    "email": user.email,
                    "error": str(e),
                }
                errors.append(error_detail)
                logger.exception(f"Exception sending reminder to {user.user_id}")

        logger.info(
            f"Check-in reminder job completed: sent={sent}, skipped={skipped}, failed={failed}"
        )

        return ReminderResult(sent=sent, skipped=skipped, failed=failed, errors=errors)


# Singleton instance for convenience
checkin_reminder_service = CheckinReminderService()
