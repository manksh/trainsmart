"""
Tests for check-in reminder notification service.

This module tests:
- CheckinReminderService for identifying eligible users
- Duplicate prevention logic
- API endpoint for triggering reminders
"""

import pytest
import pytest_asyncio
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from zoneinfo import ZoneInfo

from app.models import User, Organization
from app.models.notification import (
    NotificationPreference,
    DeviceToken,
    NotificationLog,
    NotificationType,
    NotificationStatus,
    Platform,
)
from app.models.checkin import CheckIn, CheckInType
from app.services.checkin_reminder import (
    checkin_reminder_service,
    CheckinReminderService,
    EASTERN_TZ,
)
from tests.conftest import auth_headers


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def mock_push_service():
    """Mock push notification service."""
    with patch(
        "app.services.checkin_reminder.push_notification_service"
    ) as mock:
        mock.send_to_user = AsyncMock(
            return_value={
                "success": True,
                "message": "Sent to 1 devices",
                "devices_notified": 1,
                "failures": 0,
            }
        )
        yield mock


@pytest_asyncio.fixture
async def user_with_preferences(
    db_session: AsyncSession,
    organization: Organization,
) -> User:
    """Create a user with notification preferences enabled."""
    from app.models.membership import Membership, MembershipRole, MembershipStatus
    from app.utils.security import hash_password

    user = User(
        id=uuid.uuid4(),
        email="reminder_test@test.com",
        password_hash=hash_password("Test123!"),
        first_name="Reminder",
        last_name="Test",
        is_superadmin=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Create membership
    membership = Membership(
        id=uuid.uuid4(),
        user_id=user.id,
        organization_id=organization.id,
        role=MembershipRole.ATHLETE,
        status=MembershipStatus.ACTIVE,
        joined_at=datetime.utcnow(),
    )
    db_session.add(membership)

    # Create notification preferences with reminders enabled
    prefs = NotificationPreference(
        id=uuid.uuid4(),
        user_id=user.id,
        daily_checkin_reminder=True,
        timezone="America/New_York",
    )
    db_session.add(prefs)

    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def user_with_device(
    db_session: AsyncSession,
    user_with_preferences: User,
) -> User:
    """User with preferences and an active device."""
    device = DeviceToken(
        id=uuid.uuid4(),
        user_id=user_with_preferences.id,
        platform=Platform.WEB.value,
        endpoint="https://fcm.googleapis.com/fcm/send/reminder-test-user",
        p256dh_key="test_p256dh_key_for_reminder_user_testing_reminder_user",
        auth_key="test_auth_key_123",
        is_active=True,
    )
    db_session.add(device)
    await db_session.commit()
    return user_with_preferences


@pytest_asyncio.fixture
async def user_opted_out(
    db_session: AsyncSession,
    organization: Organization,
) -> User:
    """User with reminders disabled."""
    from app.models.membership import Membership, MembershipRole, MembershipStatus
    from app.utils.security import hash_password

    user = User(
        id=uuid.uuid4(),
        email="opted_out@test.com",
        password_hash=hash_password("Test123!"),
        first_name="OptedOut",
        last_name="User",
        is_superadmin=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    membership = Membership(
        id=uuid.uuid4(),
        user_id=user.id,
        organization_id=organization.id,
        role=MembershipRole.ATHLETE,
        status=MembershipStatus.ACTIVE,
        joined_at=datetime.utcnow(),
    )
    db_session.add(membership)

    prefs = NotificationPreference(
        id=uuid.uuid4(),
        user_id=user.id,
        daily_checkin_reminder=False,  # Opted out
        timezone="America/New_York",
    )
    db_session.add(prefs)

    # Also add a device to ensure the only filter is the preference
    device = DeviceToken(
        id=uuid.uuid4(),
        user_id=user.id,
        platform=Platform.WEB.value,
        endpoint="https://fcm.googleapis.com/fcm/send/opted-out-user",
        p256dh_key="test_p256dh_key_for_opted_out_user_testing_opted_out",
        auth_key="test_auth_key_456",
        is_active=True,
    )
    db_session.add(device)

    await db_session.commit()
    await db_session.refresh(user)
    return user


# =============================================================================
# SERVICE TESTS: get_users_needing_reminder
# =============================================================================


class TestGetUsersNeedingReminder:
    """Tests for querying eligible users."""

    @pytest.mark.asyncio
    async def test_returns_eligible_user(
        self,
        db_session: AsyncSession,
        user_with_device: User,
    ):
        """Should return user with preferences enabled, active device, no check-in today."""
        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        assert len(eligible) == 1
        assert eligible[0].user_id == user_with_device.id
        assert eligible[0].email == user_with_device.email

    @pytest.mark.asyncio
    async def test_excludes_user_without_preferences(
        self,
        db_session: AsyncSession,
        athlete_user: User,
    ):
        """Should exclude users without notification preference records."""
        # athlete_user has no NotificationPreference record
        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        user_ids = [u.user_id for u in eligible]
        assert athlete_user.id not in user_ids

    @pytest.mark.asyncio
    async def test_excludes_user_with_reminders_disabled(
        self,
        db_session: AsyncSession,
        user_opted_out: User,
    ):
        """Should exclude users who have disabled check-in reminders."""
        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        user_ids = [u.user_id for u in eligible]
        assert user_opted_out.id not in user_ids

    @pytest.mark.asyncio
    async def test_excludes_user_without_active_device(
        self,
        db_session: AsyncSession,
        user_with_preferences: User,
    ):
        """Should exclude users with no active devices."""
        # user_with_preferences has preferences but no device token
        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        user_ids = [u.user_id for u in eligible]
        assert user_with_preferences.id not in user_ids

    @pytest.mark.asyncio
    async def test_excludes_user_with_inactive_device(
        self,
        db_session: AsyncSession,
        user_with_preferences: User,
    ):
        """Should exclude users whose only device is inactive."""
        # Add an inactive device
        device = DeviceToken(
            id=uuid.uuid4(),
            user_id=user_with_preferences.id,
            platform=Platform.WEB.value,
            endpoint="https://fcm.googleapis.com/fcm/send/inactive-device",
            p256dh_key="test_key_inactive_device_testing_inactive_device_key",
            auth_key="test_auth_789",
            is_active=False,  # Inactive
        )
        db_session.add(device)
        await db_session.commit()

        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        user_ids = [u.user_id for u in eligible]
        assert user_with_preferences.id not in user_ids

    @pytest.mark.asyncio
    async def test_excludes_user_who_checked_in_today(
        self,
        db_session: AsyncSession,
        user_with_device: User,
        organization: Organization,
    ):
        """Should exclude users who have already checked in today."""
        # Create a check-in for today
        checkin = CheckIn(
            id=uuid.uuid4(),
            user_id=user_with_device.id,
            organization_id=organization.id,
            check_in_type=CheckInType.MOOD.value,
            emotion="happy",
            intensity=4,
            created_at=datetime.utcnow(),
        )
        db_session.add(checkin)
        await db_session.commit()

        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        user_ids = [u.user_id for u in eligible]
        assert user_with_device.id not in user_ids

    @pytest.mark.asyncio
    async def test_excludes_user_already_notified_today(
        self,
        db_session: AsyncSession,
        user_with_device: User,
    ):
        """Should exclude users who already received a reminder today."""
        # Create a notification log for today
        log = NotificationLog(
            id=uuid.uuid4(),
            user_id=user_with_device.id,
            notification_type=NotificationType.DAILY_CHECKIN.value,
            title="Time for your check-in",
            body="Take a moment to check in.",
            status=NotificationStatus.SENT.value,
            created_at=datetime.utcnow(),
        )
        db_session.add(log)
        await db_session.commit()

        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        user_ids = [u.user_id for u in eligible]
        assert user_with_device.id not in user_ids

    @pytest.mark.asyncio
    async def test_includes_user_with_yesterday_checkin(
        self,
        db_session: AsyncSession,
        user_with_device: User,
        organization: Organization,
    ):
        """Should include users whose last check-in was yesterday."""
        # Create a check-in for yesterday
        yesterday = datetime.utcnow() - timedelta(days=1)
        checkin = CheckIn(
            id=uuid.uuid4(),
            user_id=user_with_device.id,
            organization_id=organization.id,
            check_in_type=CheckInType.MOOD.value,
            emotion="calm",
            intensity=3,
            created_at=yesterday,
        )
        db_session.add(checkin)
        await db_session.commit()

        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        user_ids = [u.user_id for u in eligible]
        assert user_with_device.id in user_ids

    @pytest.mark.asyncio
    async def test_excludes_inactive_users(
        self,
        db_session: AsyncSession,
        organization: Organization,
    ):
        """Should exclude users with is_active=False."""
        from app.utils.security import hash_password

        user = User(
            id=uuid.uuid4(),
            email="inactive_reminder@test.com",
            password_hash=hash_password("Test123!"),
            first_name="Inactive",
            last_name="Reminder",
            is_superadmin=False,
            is_active=False,  # Inactive user
        )
        db_session.add(user)
        await db_session.flush()

        prefs = NotificationPreference(
            id=uuid.uuid4(),
            user_id=user.id,
            daily_checkin_reminder=True,
        )
        db_session.add(prefs)

        device = DeviceToken(
            id=uuid.uuid4(),
            user_id=user.id,
            platform=Platform.WEB.value,
            endpoint="https://fcm.googleapis.com/fcm/send/inactive-user",
            p256dh_key="test_key_for_inactive_user_testing_inactive_key",
            auth_key="test_auth_inactive",
            is_active=True,
        )
        db_session.add(device)
        await db_session.commit()

        service = CheckinReminderService()
        eligible = await service.get_users_needing_reminder(db_session)

        user_ids = [u.user_id for u in eligible]
        assert user.id not in user_ids


# =============================================================================
# SERVICE TESTS: send_checkin_reminders
# =============================================================================


class TestSendCheckinReminders:
    """Tests for sending reminders to eligible users."""

    @pytest.mark.asyncio
    async def test_sends_to_eligible_users(
        self,
        db_session: AsyncSession,
        user_with_device: User,
        mock_push_service,
    ):
        """Should send notifications to all eligible users."""
        service = CheckinReminderService()
        result = await service.send_checkin_reminders(db_session)

        assert result.sent == 1
        assert result.skipped == 0
        assert result.failed == 0
        assert result.errors == []

        # Verify push service was called
        mock_push_service.send_to_user.assert_called_once()
        call_kwargs = mock_push_service.send_to_user.call_args.kwargs
        assert call_kwargs["user_id"] == user_with_device.id
        assert call_kwargs["notification_type"] == NotificationType.DAILY_CHECKIN.value

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_eligible_users(
        self,
        db_session: AsyncSession,
        mock_push_service,
    ):
        """Should return zeros when no users are eligible."""
        service = CheckinReminderService()
        result = await service.send_checkin_reminders(db_session)

        assert result.sent == 0
        assert result.skipped == 0
        assert result.failed == 0

        # Push service should not be called
        mock_push_service.send_to_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_handles_push_failure(
        self,
        db_session: AsyncSession,
        user_with_device: User,
        mock_push_service,
    ):
        """Should count failures when push service fails."""
        mock_push_service.send_to_user.return_value = {
            "success": False,
            "message": "Push failed",
            "devices_notified": 0,
            "failures": 1,
        }

        service = CheckinReminderService()
        result = await service.send_checkin_reminders(db_session)

        assert result.sent == 0
        assert result.failed == 1
        assert len(result.errors) == 1
        assert result.errors[0]["user_id"] == str(user_with_device.id)

    @pytest.mark.asyncio
    async def test_handles_push_exception(
        self,
        db_session: AsyncSession,
        user_with_device: User,
        mock_push_service,
    ):
        """Should handle exceptions from push service gracefully."""
        mock_push_service.send_to_user.side_effect = Exception("Connection error")

        service = CheckinReminderService()
        result = await service.send_checkin_reminders(db_session)

        assert result.sent == 0
        assert result.failed == 1
        assert len(result.errors) == 1
        assert "Connection error" in result.errors[0]["error"]

    @pytest.mark.asyncio
    async def test_handles_no_active_devices_edge_case(
        self,
        db_session: AsyncSession,
        user_with_device: User,
        mock_push_service,
    ):
        """Should count as skipped when device deactivated mid-process."""
        mock_push_service.send_to_user.return_value = {
            "success": False,
            "message": "No active devices",
            "devices_notified": 0,
        }

        service = CheckinReminderService()
        result = await service.send_checkin_reminders(db_session)

        assert result.sent == 0
        assert result.skipped == 1
        assert result.failed == 0


# =============================================================================
# API ENDPOINT TESTS
# =============================================================================


class TestSendCheckinRemindersEndpoint:
    """Tests for POST /notifications/send-checkin-reminders endpoint."""

    @pytest.mark.asyncio
    async def test_endpoint_returns_summary(
        self,
        client: AsyncClient,
        user_with_device: User,
        mock_push_service,
    ):
        """Should return summary of sent/skipped/failed."""
        response = await client.post(
            "/api/v1/notifications/send-checkin-reminders"
        )

        assert response.status_code == 200
        data = response.json()
        assert "sent" in data
        assert "skipped" in data
        assert "failed" in data
        # With mock, should succeed
        assert data["sent"] == 1

    @pytest.mark.asyncio
    async def test_endpoint_no_trailing_slash(
        self,
        client: AsyncClient,
    ):
        """Should NOT accept trailing slash (consistent with project convention)."""
        response = await client.post(
            "/api/v1/notifications/send-checkin-reminders/"
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_endpoint_requires_api_key_when_configured(
        self,
        client: AsyncClient,
    ):
        """Should require API key when SCHEDULER_API_KEY is set."""
        with patch("app.api.v1.notifications.settings") as mock_settings:
            # Configure mock settings
            mock_settings.scheduler_api_key = "test-scheduler-key-123"
            mock_settings.vapid_private_key = "test-vapid-key"

            # Without API key header
            response = await client.post(
                "/api/v1/notifications/send-checkin-reminders"
            )

            assert response.status_code == 401
            assert "scheduler" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_endpoint_accepts_valid_api_key(
        self,
        client: AsyncClient,
        user_with_device: User,
        mock_push_service,
    ):
        """Should accept request with valid API key."""
        with patch("app.api.v1.notifications.settings") as mock_settings:
            mock_settings.scheduler_api_key = "valid-key-123"
            mock_settings.vapid_private_key = "test-vapid-key"

            response = await client.post(
                "/api/v1/notifications/send-checkin-reminders",
                headers={"X-Scheduler-API-Key": "valid-key-123"},
            )

            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_endpoint_rejects_invalid_api_key(
        self,
        client: AsyncClient,
    ):
        """Should reject request with invalid API key."""
        with patch("app.api.v1.notifications.settings") as mock_settings:
            mock_settings.scheduler_api_key = "correct-key"
            mock_settings.vapid_private_key = "test-vapid-key"

            response = await client.post(
                "/api/v1/notifications/send-checkin-reminders",
                headers={"X-Scheduler-API-Key": "wrong-key"},
            )

            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_endpoint_works_without_api_key_when_not_configured(
        self,
        client: AsyncClient,
        mock_push_service,
    ):
        """Should work without API key when SCHEDULER_API_KEY is not set."""
        # Default settings don't have scheduler_api_key set
        response = await client.post(
            "/api/v1/notifications/send-checkin-reminders"
        )

        assert response.status_code == 200


# =============================================================================
# TIMEZONE TESTS
# =============================================================================


class TestTimezoneHandling:
    """Tests for EST timezone handling in 'today' calculation."""

    def test_get_today_boundaries_returns_utc(self):
        """Should return UTC boundaries for the EST day."""
        service = CheckinReminderService()
        start_utc, end_utc = service._get_today_boundaries_utc()

        # Boundaries should be naive datetimes (no tzinfo)
        assert start_utc.tzinfo is None
        assert end_utc.tzinfo is None

        # End should be after start
        assert end_utc > start_utc

        # Should span approximately 24 hours
        diff = end_utc - start_utc
        assert 23 <= diff.total_seconds() / 3600 <= 25

    def test_boundaries_are_for_eastern_day(self):
        """Should calculate boundaries based on Eastern time, not UTC."""
        service = CheckinReminderService()

        # Get current time in Eastern
        now_eastern = datetime.now(EASTERN_TZ)
        today_eastern = now_eastern.date()

        # Get boundaries from service
        start_utc, end_utc = service._get_today_boundaries_utc()

        # Convert boundaries back to Eastern to verify
        start_eastern = start_utc.replace(tzinfo=timezone.utc).astimezone(EASTERN_TZ)
        end_eastern = end_utc.replace(tzinfo=timezone.utc).astimezone(EASTERN_TZ)

        # The dates should match the Eastern date
        assert start_eastern.date() == today_eastern
        assert end_eastern.date() == today_eastern

        # Start should be midnight
        assert start_eastern.hour == 0
        assert start_eastern.minute == 0

        # End should be 23:59:59
        assert end_eastern.hour == 23
        assert end_eastern.minute == 59


