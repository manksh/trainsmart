"""
Tests for check-in endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models import User, Organization, CheckIn
from tests.conftest import auth_headers


class TestEmotionsConfig:
    """Tests for emotions configuration endpoint."""

    @pytest.mark.asyncio
    async def test_get_emotions_config(
        self, client: AsyncClient, athlete_token: str
    ):
        """Should return all emotions with signals and actions."""
        response = await client.get(
            "/api/v1/checkins/emotions",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "emotions" in data
        assert "body_areas" in data

        # Check we have all 14 emotions
        assert len(data["emotions"]) == 14

        # Check emotion structure
        emotion = data["emotions"][0]
        assert "key" in emotion
        assert "display_name" in emotion
        assert "category" in emotion
        assert "signals" in emotion
        assert "actions" in emotion
        assert len(emotion["signals"]) > 0
        assert len(emotion["actions"]) > 0

        # Check body areas
        assert len(data["body_areas"]) == 8

    @pytest.mark.asyncio
    async def test_emotions_config_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/checkins/emotions")
        assert response.status_code == 401


class TestCreateCheckIn:
    """Tests for creating check-ins."""

    @pytest.mark.asyncio
    async def test_create_checkin_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a check-in successfully."""
        response = await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "check_in_type": "mood",
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest", "head"],
                "signal_resonated": "Smiling or laughing easily",
                "selected_action": "Share your happiness with a teammate",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["emotion"] == "happy"
        assert data["intensity"] == 4
        assert data["body_areas"] == ["chest", "head"]
        assert data["signal_resonated"] == "Smiling or laughing easily"
        assert data["selected_action"] == "Share your happiness with a teammate"

    @pytest.mark.asyncio
    async def test_create_checkin_minimal(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a check-in with minimal required fields."""
        response = await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "calm",
                "intensity": 3,
                "body_areas": ["not_sure"],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["emotion"] == "calm"
        assert data["intensity"] == 3

    @pytest.mark.asyncio
    async def test_create_checkin_invalid_emotion(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject invalid emotion."""
        response = await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "invalid_emotion",
                "intensity": 3,
                "body_areas": ["head"],
            },
        )

        assert response.status_code == 400
        assert "Invalid emotion" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_checkin_invalid_intensity(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject intensity outside 1-5 range."""
        response = await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 10,
                "body_areas": ["head"],
            },
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_checkin_invalid_body_area(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject invalid body area."""
        response = await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 3,
                "body_areas": ["invalid_area"],
            },
        )

        assert response.status_code == 400
        assert "Invalid body area" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_checkin_requires_membership(
        self,
        client: AsyncClient,
        athlete_token: str,
        db_session: AsyncSession,
        superadmin_user: User,
    ):
        """Should reject check-in for organization user is not a member of."""
        # Create a different organization
        from app.models import Organization
        import uuid

        other_org = Organization(
            id=uuid.uuid4(),
            name="Other Org",
            sport="tennis",
            created_by=superadmin_user.id,
        )
        db_session.add(other_org)
        await db_session.commit()

        response = await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(other_org.id),
                "emotion": "happy",
                "intensity": 3,
                "body_areas": ["head"],
            },
        )

        assert response.status_code == 403


class TestGetCheckIns:
    """Tests for retrieving check-ins."""

    @pytest.mark.asyncio
    async def test_get_my_checkins(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return user's check-in history."""
        # Create a check-in first
        await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "nervous",
                "intensity": 3,
                "body_areas": ["stomach"],
            },
        )

        response = await client.get(
            "/api/v1/checkins/me",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "check_ins" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert len(data["check_ins"]) >= 1

    @pytest.mark.asyncio
    async def test_get_today_status_no_checkin(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should indicate no check-in today when none exists."""
        response = await client.get(
            "/api/v1/checkins/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is False
        assert data["check_in"] is None

    @pytest.mark.asyncio
    async def test_get_today_status_with_checkin(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should indicate check-in exists when one was made today."""
        # Create a check-in
        await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "confident",
                "intensity": 5,
                "body_areas": ["chest"],
            },
        )

        response = await client.get(
            "/api/v1/checkins/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is True
        assert data["check_in"] is not None
        assert data["check_in"]["emotion"] == "confident"


class TestActionCompletion:
    """Tests for updating action completion status."""

    @pytest.mark.asyncio
    async def test_update_action_completed(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should update action completion status."""
        # Create a check-in with an action
        create_response = await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "stressed",
                "intensity": 4,
                "body_areas": ["shoulders"],
                "selected_action": "Take a 5-minute break",
            },
        )

        checkin_id = create_response.json()["id"]

        # Update action completion
        response = await client.patch(
            f"/api/v1/checkins/{checkin_id}/action",
            headers=auth_headers(athlete_token),
            json={"action_completed": True},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["action_completed"] is True


class TestWeeklyStats:
    """Tests for weekly statistics endpoint."""

    @pytest.mark.asyncio
    async def test_get_weekly_stats(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return weekly check-in statistics."""
        # Create a few check-ins
        for emotion in ["happy", "calm", "happy"]:
            await client.post(
                "/api/v1/checkins/",
                headers=auth_headers(athlete_token),
                json={
                    "organization_id": str(organization.id),
                    "emotion": emotion,
                    "intensity": 4,
                    "body_areas": ["head"],
                },
            )

        response = await client.get(
            "/api/v1/checkins/me/stats/week",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_checkins" in data
        assert "emotions_breakdown" in data
        assert "average_intensity" in data
        assert data["total_checkins"] >= 3
        assert "happy" in data["emotions_breakdown"]
