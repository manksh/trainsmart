"""
Tests for push notification system.

This module tests:
- API endpoints for device registration, preferences, and test notifications
- Notification service layer for sending push notifications
- Web push provider with proper error handling and token invalidation
"""

import pytest
import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Organization
from tests.conftest import auth_headers


# =============================================================================
# API ENDPOINT TESTS
# =============================================================================


class TestVapidPublicKey:
    """Tests for VAPID public key endpoint."""

    @pytest.mark.asyncio
    async def test_get_vapid_public_key_unauthenticated(
        self, client: AsyncClient
    ):
        """Should return VAPID public key without authentication."""
        response = await client.get("/api/v1/notifications/vapid-public-key")

        assert response.status_code == 200
        data = response.json()
        assert "public_key" in data
        assert len(data["public_key"]) >= 40

    @pytest.mark.asyncio
    async def test_get_vapid_public_key_authenticated(
        self, client: AsyncClient, athlete_token: str
    ):
        """Should also work when authenticated."""
        response = await client.get(
            "/api/v1/notifications/vapid-public-key",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "public_key" in data


class TestCreateDeviceToken:
    """Tests for device token registration."""

    @pytest.mark.asyncio
    async def test_create_device_token(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should create a new device token with valid web push subscription."""
        subscription_data = {
            "platform": "web",
            "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
            "p256dh_key": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
            "auth_key": "tBHItJI5svbpez7KI4CCXg",
            "device_name": "Chrome on MacBook"
        }

        response = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
            json=subscription_data,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["platform"] == "web"
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_create_device_token_duplicate_updates_existing(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should update existing device token instead of creating duplicate."""
        subscription_data = {
            "platform": "web",
            "endpoint": "https://fcm.googleapis.com/fcm/send/same-endpoint-123",
            "p256dh_key": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
            "auth_key": "tBHItJI5svbpez7KI4CCXg",
        }

        # First registration
        response1 = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
            json=subscription_data,
        )
        assert response1.status_code == 201
        device_id_1 = response1.json()["id"]

        # Second registration with same endpoint but updated keys
        updated_subscription = {
            "platform": "web",
            "endpoint": "https://fcm.googleapis.com/fcm/send/same-endpoint-123",
            "p256dh_key": "BNewKeyNewKeyNewKeyNewKeyNewKeyNewKeyNewKeyNewKeyNewKeyNewKeyNewKey",
            "auth_key": "newAuthKey123",
        }

        response2 = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
            json=updated_subscription,
        )

        # Should succeed - either 200 (update) or 201 (create is also acceptable)
        assert response2.status_code in [200, 201]
        device_id_2 = response2.json()["id"]

        # Should be the same device record
        assert device_id_1 == device_id_2

    @pytest.mark.asyncio
    async def test_create_device_token_requires_auth(
        self, client: AsyncClient
    ):
        """Should require authentication."""
        response = await client.post(
            "/api/v1/notifications/devices",
            json={
                "platform": "web",
                "endpoint": "https://example.com/push",
                "p256dh_key": "key",
                "auth_key": "auth"
            },
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_device_token_invalid_platform(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should reject invalid platform."""
        response = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
            json={
                "platform": "invalid_platform",
                "endpoint": "https://example.com/push",
                "p256dh_key": "key",
                "auth_key": "auth"
            },
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_create_device_token_missing_keys(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should reject web subscription without required keys."""
        response = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
            json={
                "platform": "web",
                "endpoint": "https://example.com/push",
                # Missing p256dh_key and auth_key
            },
        )

        assert response.status_code == 400


class TestListDevices:
    """Tests for listing user's devices."""

    @pytest.mark.asyncio
    async def test_list_devices_empty(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return empty list when user has no devices."""
        response = await client.get(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "devices" in data
        assert data["devices"] == []
        assert data["count"] == 0

    @pytest.mark.asyncio
    async def test_list_devices_returns_user_devices_only(
        self,
        client: AsyncClient,
        athlete_token: str,
        admin_token: str,
    ):
        """Should only return devices belonging to the authenticated user."""
        # Register device for athlete
        athlete_subscription = {
            "platform": "web",
            "endpoint": "https://fcm.googleapis.com/fcm/send/athlete-device",
            "p256dh_key": "athleteKeyathleteKeyathleteKeyathleteKeyathleteKeyathleteKeyathleteKey",
            "auth_key": "athleteAuth12345",
        }
        await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
            json=athlete_subscription,
        )

        # Register device for admin
        admin_subscription = {
            "platform": "web",
            "endpoint": "https://fcm.googleapis.com/fcm/send/admin-device",
            "p256dh_key": "adminKeyadminKeyadminKeyadminKeyadminKeyadminKeyadminKeyadminKeyadmin",
            "auth_key": "adminAuth1234567",
        }
        await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(admin_token),
            json=admin_subscription,
        )

        # Athlete should only see their own device
        response = await client.get(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert len(data["devices"]) == 1
        assert "athlete-device" in data["devices"][0]["endpoint"]

    @pytest.mark.asyncio
    async def test_list_devices_requires_auth(
        self, client: AsyncClient
    ):
        """Should require authentication."""
        response = await client.get("/api/v1/notifications/devices")
        assert response.status_code == 401


class TestDeleteDevice:
    """Tests for deleting/deactivating devices."""

    @pytest.mark.asyncio
    async def test_delete_device(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should deactivate the device token."""
        # First create a device
        subscription_data = {
            "platform": "web",
            "endpoint": "https://fcm.googleapis.com/fcm/send/to-delete",
            "p256dh_key": "keykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykey",
            "auth_key": "authauthauthauth",
        }
        create_response = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
            json=subscription_data,
        )
        assert create_response.status_code == 201
        device_id = create_response.json()["id"]

        # Delete the device
        delete_response = await client.delete(
            f"/api/v1/notifications/devices/{device_id}",
            headers=auth_headers(athlete_token),
        )

        assert delete_response.status_code == 204

        # Verify device is no longer listed
        list_response = await client.get(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
        )
        assert list_response.json()["count"] == 0

    @pytest.mark.asyncio
    async def test_delete_device_not_found(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return 404 for non-existent device."""
        fake_id = str(uuid.uuid4())
        response = await client.delete(
            f"/api/v1/notifications/devices/{fake_id}",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_device_other_user(
        self,
        client: AsyncClient,
        athlete_token: str,
        admin_token: str,
    ):
        """Should return 404 when trying to delete another user's device."""
        # Create device for admin
        subscription_data = {
            "platform": "web",
            "endpoint": "https://fcm.googleapis.com/fcm/send/admin-only",
            "p256dh_key": "keykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykey",
            "auth_key": "authauthauthauth",
        }
        create_response = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(admin_token),
            json=subscription_data,
        )
        assert create_response.status_code == 201
        admin_device_id = create_response.json()["id"]

        # Athlete tries to delete admin's device
        delete_response = await client.delete(
            f"/api/v1/notifications/devices/{admin_device_id}",
            headers=auth_headers(athlete_token),
        )

        # Should return 404 (not 403) to avoid information leakage
        assert delete_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_device_requires_auth(
        self, client: AsyncClient
    ):
        """Should require authentication."""
        fake_id = str(uuid.uuid4())
        response = await client.delete(
            f"/api/v1/notifications/devices/{fake_id}"
        )
        assert response.status_code == 401


class TestNotificationPreferences:
    """Tests for notification preferences endpoints."""

    @pytest.mark.asyncio
    async def test_get_preferences_creates_default(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should create default preferences if none exist."""
        response = await client.get(
            "/api/v1/notifications/preferences",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Check default values
        assert data["daily_checkin_reminder"] is True
        assert "id" in data
        assert "user_id" in data

    @pytest.mark.asyncio
    async def test_get_preferences_returns_existing(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return existing preferences without modification."""
        # First get to create defaults
        await client.get(
            "/api/v1/notifications/preferences",
            headers=auth_headers(athlete_token),
        )

        # Update a preference
        await client.patch(
            "/api/v1/notifications/preferences",
            headers=auth_headers(athlete_token),
            json={"daily_checkin_reminder": False},
        )

        # Get again - should reflect update
        response = await client.get(
            "/api/v1/notifications/preferences",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["daily_checkin_reminder"] is False

    @pytest.mark.asyncio
    async def test_update_preferences(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should update notification preferences."""
        updates = {
            "daily_checkin_reminder": False,
            "reminder_time": "09:00:00",
            "timezone": "America/New_York",
        }

        response = await client.patch(
            "/api/v1/notifications/preferences",
            headers=auth_headers(athlete_token),
            json=updates,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["daily_checkin_reminder"] is False
        assert data["timezone"] == "America/New_York"

    @pytest.mark.asyncio
    async def test_update_preferences_partial(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should only update provided fields."""
        # Set initial state
        await client.patch(
            "/api/v1/notifications/preferences",
            headers=auth_headers(athlete_token),
            json={"daily_checkin_reminder": True, "timezone": "UTC"},
        )

        # Partial update - only timezone
        response = await client.patch(
            "/api/v1/notifications/preferences",
            headers=auth_headers(athlete_token),
            json={"timezone": "America/Los_Angeles"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["daily_checkin_reminder"] is True  # Unchanged
        assert data["timezone"] == "America/Los_Angeles"  # Updated

    @pytest.mark.asyncio
    async def test_update_preferences_invalid_time_format(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should reject invalid time format."""
        response = await client.patch(
            "/api/v1/notifications/preferences",
            headers=auth_headers(athlete_token),
            json={"reminder_time": "25:00"},  # Invalid hour
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_preferences_requires_auth(
        self, client: AsyncClient
    ):
        """Should require authentication."""
        get_response = await client.get("/api/v1/notifications/preferences")
        assert get_response.status_code == 401

        patch_response = await client.patch(
            "/api/v1/notifications/preferences",
            json={"daily_checkin_reminder": False},
        )
        assert patch_response.status_code == 401


class TestSendTestNotification:
    """Tests for sending test notifications."""

    @pytest.mark.asyncio
    async def test_send_test_notification_no_devices(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return appropriate response when user has no devices."""
        response = await client.post(
            "/api/v1/notifications/test",
            headers=auth_headers(athlete_token),
            json={"title": "Test", "body": "Test body"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["devices_notified"] == 0

    @pytest.mark.asyncio
    async def test_send_test_notification_requires_auth(
        self, client: AsyncClient
    ):
        """Should require authentication."""
        response = await client.post(
            "/api/v1/notifications/test",
            json={"title": "Test"},
        )
        assert response.status_code == 401


class TestNotificationEdgeCases:
    """Tests for edge cases and error handling."""

    @pytest.mark.asyncio
    async def test_create_device_with_device_name(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should handle device name field."""
        response = await client.post(
            "/api/v1/notifications/devices",
            headers=auth_headers(athlete_token),
            json={
                "platform": "web",
                "endpoint": "https://fcm.googleapis.com/fcm/send/named-device",
                "p256dh_key": "keykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykeykey",
                "auth_key": "authauthauthauth",
                "device_name": "My Chrome Browser",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["device_name"] == "My Chrome Browser"

    @pytest.mark.asyncio
    async def test_preferences_with_valid_timezones(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should accept common valid timezones."""
        valid_timezones = [
            "America/New_York",
            "America/Los_Angeles",
            "Europe/London",
            "Asia/Tokyo",
            "UTC",
        ]

        for tz in valid_timezones:
            response = await client.patch(
                "/api/v1/notifications/preferences",
                headers=auth_headers(athlete_token),
                json={"timezone": tz},
            )
            assert response.status_code == 200, f"Failed for timezone: {tz}"
