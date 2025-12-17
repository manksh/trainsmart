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


class TestWeeklyActivity:
    """Tests for weekly activity endpoint."""

    @pytest.mark.asyncio
    async def test_get_weekly_activity_empty(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return weekly activity structure even with no check-ins."""
        response = await client.get(
            "/api/v1/checkins/me/activity/week",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "week_start" in data
        assert "week_end" in data
        assert "daily_activity" in data
        assert "active_days" in data
        assert "total_days" in data

        # Check daily activity structure
        assert len(data["daily_activity"]) == 7
        day = data["daily_activity"][0]
        assert "date" in day
        assert "day_name" in day
        assert "has_activity" in day
        assert "is_today" in day
        assert "is_past" in day

        # Check totals
        assert data["total_days"] == 7
        assert data["active_days"] == 0  # No check-ins

    @pytest.mark.asyncio
    async def test_get_weekly_activity_with_checkins(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should show activity for days with check-ins."""
        # Create a mood check-in (today)
        await client.post(
            "/api/v1/checkins/",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["head"],
            },
        )

        response = await client.get(
            "/api/v1/checkins/me/activity/week",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Should have at least 1 active day (today)
        assert data["active_days"] >= 1

        # Find today in the daily_activity array
        today_activity = next(
            (d for d in data["daily_activity"] if d["is_today"]),
            None
        )
        assert today_activity is not None
        assert today_activity["has_activity"] is True

    @pytest.mark.asyncio
    async def test_get_weekly_activity_multiple_checkin_types(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should count any check-in type as activity."""
        # Create different types of check-ins (all today)
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

        await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
            },
        )

        await client.post(
            "/api/v1/checkins/confidence",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "confidence_level": 6,
            },
        )

        await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 5,
                "mental_energy": 5,
            },
        )

        response = await client.get(
            "/api/v1/checkins/me/activity/week",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Should still count as 1 active day (all on same day)
        # But has_activity should be True for today
        today_activity = next(
            (d for d in data["daily_activity"] if d["is_today"]),
            None
        )
        assert today_activity is not None
        assert today_activity["has_activity"] is True

    @pytest.mark.asyncio
    async def test_get_weekly_activity_day_names(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return correct day names (Mon, Tue, etc.)."""
        response = await client.get(
            "/api/v1/checkins/me/activity/week",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        day_names = [d["day_name"] for d in data["daily_activity"]]
        expected_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        assert day_names == expected_names

    @pytest.mark.asyncio
    async def test_weekly_activity_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/checkins/me/activity/week")
        assert response.status_code == 401


class TestConfidenceConfig:
    """Tests for confidence configuration endpoint."""

    @pytest.mark.asyncio
    async def test_get_confidence_config(
        self, client: AsyncClient, athlete_token: str
    ):
        """Should return confidence check-in configuration."""
        response = await client.get(
            "/api/v1/checkins/confidence/config",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "confidence_sources" in data
        assert "doubt_sources" in data
        assert "level_actions" in data

        # Check confidence sources have proper structure
        assert len(data["confidence_sources"]) > 0
        source = data["confidence_sources"][0]
        assert "key" in source
        assert "label" in source
        assert "description" in source

        # Check doubt sources have proper structure
        assert len(data["doubt_sources"]) > 0
        doubt = data["doubt_sources"][0]
        assert "key" in doubt
        assert "label" in doubt

        # Check level actions have categories
        assert "low" in data["level_actions"]
        assert "moderate" in data["level_actions"]
        assert "high" in data["level_actions"]
        assert "peak" in data["level_actions"]

        # Check action structure
        low_actions = data["level_actions"]["low"]
        assert "label" in low_actions
        assert "message" in low_actions
        assert "actions" in low_actions
        assert len(low_actions["actions"]) > 0

    @pytest.mark.asyncio
    async def test_confidence_config_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/checkins/confidence/config")
        assert response.status_code == 401


class TestCreateConfidenceCheckIn:
    """Tests for creating confidence check-ins."""

    @pytest.mark.asyncio
    async def test_create_confidence_checkin_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a confidence check-in successfully."""
        response = await client.post(
            "/api/v1/checkins/confidence",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "confidence_level": 5,
                "confidence_sources": ["preparation", "past_success"],
                "doubt_sources": [],
                "confidence_commitment": "I will trust my training",
                "selected_action": "Visualize a past success",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["confidence_level"] == 5
        assert data["confidence_sources"] == ["preparation", "past_success"]
        assert data["doubt_sources"] == []
        assert data["confidence_commitment"] == "I will trust my training"
        assert data["selected_action"] == "Visualize a past success"
        assert data["check_in_type"] == "confidence"

    @pytest.mark.asyncio
    async def test_create_confidence_checkin_low_confidence(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a confidence check-in with low confidence level."""
        response = await client.post(
            "/api/v1/checkins/confidence",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "confidence_level": 2,
                "confidence_sources": [],
                "doubt_sources": ["fear_of_failure", "comparison"],
                "selected_action": "Review past accomplishments",
                "notes": "Feeling nervous before the big game",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["confidence_level"] == 2
        assert data["doubt_sources"] == ["fear_of_failure", "comparison"]
        assert data["notes"] == "Feeling nervous before the big game"

    @pytest.mark.asyncio
    async def test_create_confidence_checkin_minimal(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a confidence check-in with minimal required fields."""
        response = await client.post(
            "/api/v1/checkins/confidence",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "confidence_level": 4,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["confidence_level"] == 4
        assert data["check_in_type"] == "confidence"

    @pytest.mark.asyncio
    async def test_create_confidence_checkin_invalid_level_too_low(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject confidence level below 1."""
        response = await client.post(
            "/api/v1/checkins/confidence",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "confidence_level": 0,
            },
        )

        # 422 from Pydantic validation (ge=1 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_confidence_checkin_invalid_level_too_high(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject confidence level above 7."""
        response = await client.post(
            "/api/v1/checkins/confidence",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "confidence_level": 10,
            },
        )

        # 422 from Pydantic validation (le=7 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_confidence_checkin_requires_membership(
        self,
        client: AsyncClient,
        athlete_token: str,
        db_session: AsyncSession,
        superadmin_user: User,
    ):
        """Should reject check-in for organization user is not a member of."""
        import uuid

        other_org = Organization(
            id=uuid.uuid4(),
            name="Other Org for Confidence",
            sport="tennis",
            created_by=superadmin_user.id,
        )
        db_session.add(other_org)
        await db_session.commit()

        response = await client.post(
            "/api/v1/checkins/confidence",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(other_org.id),
                "confidence_level": 5,
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_confidence_checkin_requires_auth(
        self, client: AsyncClient, organization: Organization
    ):
        """Should require authentication."""
        response = await client.post(
            "/api/v1/checkins/confidence",
            json={
                "organization_id": str(organization.id),
                "confidence_level": 5,
            },
        )
        assert response.status_code == 401


class TestConfidenceTodayStatus:
    """Tests for confidence check-in today status endpoint."""

    @pytest.mark.asyncio
    async def test_get_confidence_today_no_checkin(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should indicate no confidence check-in today when none exists."""
        response = await client.get(
            "/api/v1/checkins/confidence/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is False
        assert data["count_today"] == 0
        assert data["check_ins"] == []

    @pytest.mark.asyncio
    async def test_get_confidence_today_with_checkin(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return today's confidence check-ins."""
        # Create a confidence check-in
        await client.post(
            "/api/v1/checkins/confidence",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "confidence_level": 6,
                "confidence_sources": ["physical_state"],
            },
        )

        response = await client.get(
            "/api/v1/checkins/confidence/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is True
        assert data["count_today"] >= 1
        assert len(data["check_ins"]) >= 1
        assert data["check_ins"][0]["confidence_level"] == 6

    @pytest.mark.asyncio
    async def test_confidence_today_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/checkins/confidence/me/today")
        assert response.status_code == 401


class TestEnergyConfig:
    """Tests for energy configuration endpoint."""

    @pytest.mark.asyncio
    async def test_get_energy_config(
        self, client: AsyncClient, athlete_token: str
    ):
        """Should return energy check-in configuration."""
        response = await client.get(
            "/api/v1/checkins/energy/config",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "physical_factors" in data
        assert "mental_factors" in data
        assert "state_actions" in data

        # Check physical factors have proper structure
        assert len(data["physical_factors"]) > 0
        factor = data["physical_factors"][0]
        assert "key" in factor
        assert "label" in factor
        assert "icon" in factor

        # Check mental factors have proper structure
        assert len(data["mental_factors"]) > 0
        mental = data["mental_factors"][0]
        assert "key" in mental
        assert "label" in mental

        # Check state actions have energy state categories
        assert "low_low" in data["state_actions"]
        assert "low_high" in data["state_actions"]
        assert "high_low" in data["state_actions"]
        assert "high_high" in data["state_actions"]
        assert "moderate" in data["state_actions"]

        # Check action structure
        state_action = data["state_actions"]["low_low"]
        assert "label" in state_action
        assert "message" in state_action
        assert "actions" in state_action

    @pytest.mark.asyncio
    async def test_energy_config_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/checkins/energy/config")
        assert response.status_code == 401


class TestCreateEnergyCheckIn:
    """Tests for creating energy check-ins."""

    @pytest.mark.asyncio
    async def test_create_energy_checkin_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an energy check-in successfully."""
        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 5,
                "mental_energy": 6,
                "physical_factors": ["sleep_quality", "nutrition"],
                "mental_factors": ["motivation", "focus"],
                "selected_action": "Take a short power nap",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["physical_energy"] == 5
        assert data["mental_energy"] == 6
        assert data["physical_factors"] == ["sleep_quality", "nutrition"]
        assert data["mental_factors"] == ["motivation", "focus"]
        assert data["selected_action"] == "Take a short power nap"
        assert data["check_in_type"] == "energy"
        assert data["energy_state"] == "high_high"  # Both 5+ are high

    @pytest.mark.asyncio
    async def test_create_energy_checkin_low_energy(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an energy check-in with low energy levels."""
        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 2,
                "mental_energy": 2,
                "physical_factors": ["poor_sleep"],
                "mental_factors": ["stress"],
                "selected_action": "Get some rest",
                "notes": "Didn't sleep well last night",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["physical_energy"] == 2
        assert data["mental_energy"] == 2
        assert data["energy_state"] == "low_low"
        assert data["notes"] == "Didn't sleep well last night"

    @pytest.mark.asyncio
    async def test_create_energy_checkin_mixed_energy(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should calculate correct energy state for mixed levels."""
        # Low physical, high mental
        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 2,
                "mental_energy": 6,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["energy_state"] == "low_high"

    @pytest.mark.asyncio
    async def test_create_energy_checkin_minimal(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an energy check-in with minimal required fields."""
        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 4,
                "mental_energy": 4,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["physical_energy"] == 4
        assert data["mental_energy"] == 4
        assert data["check_in_type"] == "energy"
        assert data["energy_state"] == "moderate"

    @pytest.mark.asyncio
    async def test_create_energy_checkin_invalid_physical_too_low(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject physical energy level below 1."""
        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 0,
                "mental_energy": 4,
            },
        )

        # 422 from Pydantic validation (ge=1 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_energy_checkin_invalid_physical_too_high(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject physical energy level above 7."""
        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 10,
                "mental_energy": 4,
            },
        )

        # 422 from Pydantic validation (le=7 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_energy_checkin_invalid_mental_too_low(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject mental energy level below 1."""
        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 4,
                "mental_energy": 0,
            },
        )

        # 422 from Pydantic validation (ge=1 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_energy_checkin_invalid_mental_too_high(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject mental energy level above 7."""
        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 4,
                "mental_energy": 10,
            },
        )

        # 422 from Pydantic validation (le=7 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_energy_checkin_requires_membership(
        self,
        client: AsyncClient,
        athlete_token: str,
        db_session: AsyncSession,
        superadmin_user: User,
    ):
        """Should reject check-in for organization user is not a member of."""
        import uuid

        other_org = Organization(
            id=uuid.uuid4(),
            name="Other Org for Energy",
            sport="swimming",
            created_by=superadmin_user.id,
        )
        db_session.add(other_org)
        await db_session.commit()

        response = await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(other_org.id),
                "physical_energy": 5,
                "mental_energy": 5,
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_energy_checkin_requires_auth(
        self, client: AsyncClient, organization: Organization
    ):
        """Should require authentication."""
        response = await client.post(
            "/api/v1/checkins/energy",
            json={
                "organization_id": str(organization.id),
                "physical_energy": 5,
                "mental_energy": 5,
            },
        )
        assert response.status_code == 401


class TestEnergyTodayStatus:
    """Tests for energy check-in today status endpoint."""

    @pytest.mark.asyncio
    async def test_get_energy_today_no_checkin(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should indicate no energy check-in today when none exists."""
        response = await client.get(
            "/api/v1/checkins/energy/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is False
        assert data["count_today"] == 0
        assert data["check_ins"] == []

    @pytest.mark.asyncio
    async def test_get_energy_today_with_checkin(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return today's energy check-ins."""
        # Create an energy check-in
        await client.post(
            "/api/v1/checkins/energy",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "physical_energy": 5,
                "mental_energy": 4,
            },
        )

        response = await client.get(
            "/api/v1/checkins/energy/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is True
        assert data["count_today"] >= 1
        assert len(data["check_ins"]) >= 1
        assert data["check_ins"][0]["physical_energy"] == 5
        assert data["check_ins"][0]["mental_energy"] == 4

    @pytest.mark.asyncio
    async def test_energy_today_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/checkins/energy/me/today")
        assert response.status_code == 401


class TestBreathingExercisesConfig:
    """Tests for breathing exercises configuration endpoint."""

    @pytest.mark.asyncio
    async def test_get_breathing_exercises_config(
        self, client: AsyncClient, athlete_token: str
    ):
        """Should return all breathing exercises with configurations."""
        response = await client.get(
            "/api/v1/checkins/breathing/exercises",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "exercises" in data

        # Check we have all 4 breathing exercises
        assert len(data["exercises"]) == 4

        # Check exercise structure
        exercise = data["exercises"][0]
        assert "key" in exercise
        assert "display_name" in exercise
        assert "technique" in exercise
        assert "description" in exercise
        assert "triggers" in exercise
        assert "timing" in exercise
        assert "cycles" in exercise
        assert "instructions" in exercise
        assert "category" in exercise

        # Check timing structure
        timing = exercise["timing"]
        assert "inhale" in timing
        assert "hold_in" in timing
        assert "exhale" in timing
        assert "hold_out" in timing

        # Check triggers and instructions are lists
        assert isinstance(exercise["triggers"], list)
        assert len(exercise["triggers"]) > 0
        assert isinstance(exercise["instructions"], list)
        assert len(exercise["instructions"]) > 0

    @pytest.mark.asyncio
    async def test_breathing_exercises_has_all_types(
        self, client: AsyncClient, athlete_token: str
    ):
        """Should include all breathing exercise types."""
        response = await client.get(
            "/api/v1/checkins/breathing/exercises",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        exercise_keys = [e["key"] for e in data["exercises"]]
        assert "energize" in exercise_keys
        assert "relax" in exercise_keys
        assert "relax_fast" in exercise_keys
        assert "focus" in exercise_keys

    @pytest.mark.asyncio
    async def test_breathing_exercises_has_categories(
        self, client: AsyncClient, athlete_token: str
    ):
        """Should have correct categories for each exercise."""
        response = await client.get(
            "/api/v1/checkins/breathing/exercises",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        categories = {e["key"]: e["category"] for e in data["exercises"]}
        assert categories["energize"] == "activation"
        assert categories["relax"] == "calming"
        assert categories["relax_fast"] == "calming"
        assert categories["focus"] == "focus"

    @pytest.mark.asyncio
    async def test_breathing_exercises_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/checkins/breathing/exercises")
        assert response.status_code == 401


class TestCreateBreathingCheckIn:
    """Tests for creating breathing check-ins."""

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a breathing check-in successfully."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
                "duration_seconds": 120,
                "trigger_selected": "Feeling anxious or stressed",
                "effectiveness_rating": 4,
                "notes": "Felt much calmer after",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["breathing_exercise_type"] == "relax"
        assert data["cycles_completed"] == 4
        assert data["duration_seconds"] == 120
        assert data["trigger_selected"] == "Feeling anxious or stressed"
        assert data["effectiveness_rating"] == 4
        assert data["notes"] == "Felt much calmer after"
        assert data["check_in_type"] == "breathing"

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_energize(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an energize breathing check-in."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "energize",
                "cycles_completed": 12,
                "duration_seconds": 60,
                "trigger_selected": "Feeling sluggish before training",
                "effectiveness_rating": 5,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["breathing_exercise_type"] == "energize"
        assert data["cycles_completed"] == 12
        assert data["effectiveness_rating"] == 5

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_focus(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a focus breathing check-in."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "focus",
                "cycles_completed": 10,
                "duration_seconds": 180,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["breathing_exercise_type"] == "focus"
        assert data["cycles_completed"] == 10

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_quick_calm(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a quick calm (psychological sigh) breathing check-in."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax_fast",
                "cycles_completed": 3,
                "duration_seconds": 30,
                "trigger_selected": "Pre-performance nerves",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["breathing_exercise_type"] == "relax_fast"
        assert data["cycles_completed"] == 3

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_minimal(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a breathing check-in with minimal required fields."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["breathing_exercise_type"] == "relax"
        assert data["cycles_completed"] == 4
        assert data["check_in_type"] == "breathing"
        # Optional fields should be None
        assert data["duration_seconds"] is None
        assert data["trigger_selected"] is None
        assert data["effectiveness_rating"] is None
        assert data["notes"] is None

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_invalid_exercise_type(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject invalid breathing exercise type."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "invalid_type",
                "cycles_completed": 4,
            },
        )

        assert response.status_code == 400
        assert "Invalid breathing exercise type" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_invalid_cycles_zero(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject zero cycles completed."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 0,
            },
        )

        # 422 from Pydantic validation (ge=1 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_invalid_cycles_negative(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject negative cycles completed."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": -5,
            },
        )

        # 422 from Pydantic validation (ge=1 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_invalid_effectiveness_too_low(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject effectiveness rating below 1."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
                "effectiveness_rating": 0,
            },
        )

        # 422 from Pydantic validation (ge=1 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_invalid_effectiveness_too_high(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject effectiveness rating above 5."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
                "effectiveness_rating": 10,
            },
        )

        # 422 from Pydantic validation (le=5 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_invalid_duration_negative(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject negative duration."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
                "duration_seconds": -60,
            },
        )

        # 422 from Pydantic validation (ge=0 constraint)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_requires_membership(
        self,
        client: AsyncClient,
        athlete_token: str,
        db_session: AsyncSession,
        superadmin_user: User,
    ):
        """Should reject check-in for organization user is not a member of."""
        import uuid

        other_org = Organization(
            id=uuid.uuid4(),
            name="Other Org for Breathing",
            sport="yoga",
            created_by=superadmin_user.id,
        )
        db_session.add(other_org)
        await db_session.commit()

        response = await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(other_org.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_breathing_checkin_requires_auth(
        self, client: AsyncClient, organization: Organization
    ):
        """Should require authentication."""
        response = await client.post(
            "/api/v1/checkins/breathing",
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
            },
        )
        assert response.status_code == 401


class TestBreathingTodayStatus:
    """Tests for breathing check-in today status endpoint."""

    @pytest.mark.asyncio
    async def test_get_breathing_today_no_checkin(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should indicate no breathing check-in today when none exists."""
        response = await client.get(
            "/api/v1/checkins/breathing/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is False
        assert data["count_today"] == 0
        assert data["check_ins"] == []

    @pytest.mark.asyncio
    async def test_get_breathing_today_with_single_checkin(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return today's breathing check-in."""
        # Create a breathing check-in
        await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "focus",
                "cycles_completed": 10,
                "effectiveness_rating": 4,
            },
        )

        response = await client.get(
            "/api/v1/checkins/breathing/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is True
        assert data["count_today"] >= 1
        assert len(data["check_ins"]) >= 1
        assert data["check_ins"][0]["breathing_exercise_type"] == "focus"
        assert data["check_ins"][0]["cycles_completed"] == 10

    @pytest.mark.asyncio
    async def test_get_breathing_today_with_multiple_checkins(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return all of today's breathing check-ins."""
        # Create multiple breathing check-ins
        await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "energize",
                "cycles_completed": 12,
            },
        )

        await client.post(
            "/api/v1/checkins/breathing",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "breathing_exercise_type": "relax",
                "cycles_completed": 4,
            },
        )

        response = await client.get(
            "/api/v1/checkins/breathing/me/today",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_checked_in_today"] is True
        assert data["count_today"] >= 2
        assert len(data["check_ins"]) >= 2

    @pytest.mark.asyncio
    async def test_breathing_today_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/checkins/breathing/me/today")
        assert response.status_code == 401
