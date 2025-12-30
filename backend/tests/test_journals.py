"""
Tests for journal endpoints.
"""

import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Organization, JournalEntry
from tests.conftest import auth_headers


class TestJournalConfig:
    """Tests for journal configuration endpoint."""

    @pytest.mark.asyncio
    async def test_get_journal_config(
        self, client: AsyncClient, athlete_token: str
    ):
        """Should return all journal types and configuration."""
        response = await client.get(
            "/api/v1/journals/config",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "journal_types" in data
        assert "affirmations" in data
        assert "affirmation_timing_options" in data
        assert "daily_win_factors" in data
        assert "emotion_options" in data
        assert "open_ended_tags" in data
        assert "open_ended_prompts" in data

        # Check we have all 5 journal types
        assert len(data["journal_types"]) == 5
        journal_keys = [jt["key"] for jt in data["journal_types"]]
        assert "affirmations" in journal_keys
        assert "daily_wins" in journal_keys
        assert "gratitude" in journal_keys
        assert "open_ended" in journal_keys
        assert "i_know" in journal_keys

        # Check i_know prompts are included
        assert "i_know_prompts" in data
        assert len(data["i_know_prompts"]) > 0

        # Check i_know emotion options are included
        assert "i_know" in data["emotion_options"]
        assert len(data["emotion_options"]["i_know"]) > 0

        # Check journal type structure
        journal_type = data["journal_types"][0]
        assert "key" in journal_type
        assert "label" in journal_type
        assert "description" in journal_type
        assert "icon" in journal_type

        # Check affirmations config
        assert len(data["affirmations"]) > 0
        focus_area = list(data["affirmations"].values())[0]
        assert "key" in focus_area
        assert "label" in focus_area
        assert "affirmations" in focus_area
        assert len(focus_area["affirmations"]) > 0

    @pytest.mark.asyncio
    async def test_journal_config_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/journals/config")
        assert response.status_code == 401


class TestCreateJournalEntry:
    """Tests for creating journal entries."""

    @pytest.mark.asyncio
    async def test_create_journal_no_trailing_slash(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create journal entry at /journals (no trailing slash).

        This test ensures the endpoint works without trailing slash.
        The backend has redirect_slashes=False, so the frontend must use
        the exact path. This test will catch URL mismatches.
        """
        response = await client.post(
            "/api/v1/journals",  # No trailing slash - matches backend route
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "affirmations",
                "affirmation_focus_area": "confidence",
                "affirmation_text": "Test affirmation",
            },
        )

        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_create_journal_trailing_slash_returns_404(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Trailing slash should return 404 since redirect_slashes=False.

        This test documents the expected behavior and will catch if
        someone accidentally enables redirect_slashes or changes routing.
        """
        response = await client.post(
            "/api/v1/journals/",  # WITH trailing slash - should fail
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "affirmations",
                "affirmation_focus_area": "confidence",
                "affirmation_text": "Test affirmation",
            },
        )

        # With redirect_slashes=False, trailing slash returns 404
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_affirmation_entry_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an affirmation journal entry successfully."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "affirmations",
                "affirmation_focus_area": "confidence",
                "affirmation_text": "I trust my training and preparation",
                "affirmation_is_custom": False,
                "affirmation_when_helpful": ["pre_competition", "during_training"],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["journal_type"] == "affirmations"
        assert data["affirmation_focus_area"] == "confidence"
        assert data["affirmation_text"] == "I trust my training and preparation"
        assert data["affirmation_is_custom"] is False
        assert data["affirmation_when_helpful"] == ["pre_competition", "during_training"]

    @pytest.mark.asyncio
    async def test_create_custom_affirmation_entry(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a custom affirmation entry."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "affirmations",
                "affirmation_focus_area": "focus",
                "affirmation_text": "I am fully present in every moment",
                "affirmation_is_custom": True,
                "affirmation_when_helpful": ["morning_routine"],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["affirmation_is_custom"] is True

    @pytest.mark.asyncio
    async def test_create_daily_wins_entry_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a daily wins journal entry successfully."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "daily_wins",
                "win_description": "I completed all my drills with perfect form",
                "win_factors": ["preparation", "focus", "hard_work"],
                "win_feeling": "proud",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["journal_type"] == "daily_wins"
        assert data["win_description"] == "I completed all my drills with perfect form"
        assert data["win_factors"] == ["preparation", "focus", "hard_work"]
        assert data["win_feeling"] == "proud"

    @pytest.mark.asyncio
    async def test_create_gratitude_entry_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create a gratitude journal entry successfully."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "My supportive coach",
                "gratitude_why_meaningful": "They believe in me even when I doubt myself",
                "gratitude_feeling": "grateful",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["journal_type"] == "gratitude"
        assert data["gratitude_item"] == "My supportive coach"
        assert data["gratitude_why_meaningful"] == "They believe in me even when I doubt myself"
        assert data["gratitude_feeling"] == "grateful"

    @pytest.mark.asyncio
    async def test_create_open_ended_entry_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an open-ended journal entry successfully."""
        content = "Today was a challenging day. I struggled with my serve but managed to stay focused throughout the match. I'm proud of how I handled the pressure."
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "open_ended",
                "content": content,
                "tags": ["competition", "resilience"],
                "prompt_used": "What challenged you today and how did you respond?",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["journal_type"] == "open_ended"
        assert data["content"] == content
        assert data["tags"] == ["competition", "resilience"]
        assert data["prompt_used"] == "What challenged you today and how did you respond?"
        # Check word count is calculated
        assert data["word_count"] == len(content.split())

    @pytest.mark.asyncio
    async def test_create_open_ended_entry_without_prompt(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an open-ended entry without a prompt."""
        content = "Just wanted to write down some thoughts about today's practice."
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "open_ended",
                "content": content,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["content"] == content
        assert data["prompt_used"] is None
        assert data["tags"] is None

    @pytest.mark.asyncio
    async def test_create_i_know_entry_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an I Know journal entry with all fields."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "i_know",
                "i_know_statement": "I know I can handle pressure because I have trained for this",
                "i_know_why_matters": "It reminds me that I am prepared and capable",
                "i_know_feeling": "grounded",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["journal_type"] == "i_know"
        assert data["i_know_statement"] == "I know I can handle pressure because I have trained for this"
        assert data["i_know_why_matters"] == "It reminds me that I am prepared and capable"
        assert data["i_know_feeling"] == "grounded"

    @pytest.mark.asyncio
    async def test_create_i_know_entry_required_fields_only(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should create an I Know entry with only required fields."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "i_know",
                "i_know_statement": "I know my effort matters",
                "i_know_feeling": "motivated",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["journal_type"] == "i_know"
        assert data["i_know_statement"] == "I know my effort matters"
        assert data["i_know_why_matters"] is None
        assert data["i_know_feeling"] == "motivated"

    @pytest.mark.asyncio
    async def test_create_i_know_entry_missing_statement(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject I Know entry without statement."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "i_know",
                "i_know_feeling": "grounded",
            },
        )

        assert response.status_code == 400
        assert "i_know_statement is required" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_i_know_entry_missing_feeling(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject I Know entry without feeling."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "i_know",
                "i_know_statement": "I know I can do this",
            },
        )

        assert response.status_code == 400
        assert "i_know_feeling is required" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_entry_invalid_journal_type(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should reject invalid journal type."""
        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "invalid_type",
                "content": "Some content",
            },
        )

        assert response.status_code == 400
        assert "Invalid journal type" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_entry_requires_membership(
        self,
        client: AsyncClient,
        athlete_token: str,
        db_session: AsyncSession,
        superadmin_user: User,
    ):
        """Should reject entry for organization user is not a member of."""
        other_org = Organization(
            id=uuid.uuid4(),
            name="Other Org",
            sport="tennis",
            created_by=superadmin_user.id,
        )
        db_session.add(other_org)
        await db_session.commit()

        response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(other_org.id),
                "journal_type": "gratitude",
                "gratitude_item": "Something",
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_entry_requires_auth(
        self, client: AsyncClient, organization: Organization
    ):
        """Should require authentication."""
        response = await client.post(
            "/api/v1/journals",
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Something",
            },
        )
        assert response.status_code == 401


class TestGetJournalEntries:
    """Tests for retrieving journal entries."""

    @pytest.mark.asyncio
    async def test_get_my_entries(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return user's journal entries."""
        # Create some entries first
        await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Test gratitude item",
            },
        )
        await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "daily_wins",
                "win_description": "Test win",
            },
        )

        response = await client.get(
            "/api/v1/journals/me",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert len(data["entries"]) >= 2

    @pytest.mark.asyncio
    async def test_get_my_entries_filter_by_type(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should filter entries by journal type."""
        # Create entries of different types
        await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Gratitude entry",
            },
        )
        await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "affirmations",
                "affirmation_text": "Affirmation entry",
            },
        )

        response = await client.get(
            "/api/v1/journals/me?journal_type=gratitude",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        # All entries should be of type gratitude
        for entry in data["entries"]:
            assert entry["journal_type"] == "gratitude"

    @pytest.mark.asyncio
    async def test_get_my_entries_filter_by_tag(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should filter entries by tag."""
        # Create entries with different tags
        await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "open_ended",
                "content": "Entry with competition tag",
                "tags": ["competition", "focus"],
            },
        )
        await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "open_ended",
                "content": "Entry with practice tag",
                "tags": ["practice"],
            },
        )

        response = await client.get(
            "/api/v1/journals/me?tag=competition",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        # All entries should have the competition tag
        for entry in data["entries"]:
            if entry["tags"]:
                assert "competition" in entry["tags"]

    @pytest.mark.asyncio
    async def test_get_my_entries_pagination(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should paginate entries correctly."""
        # Create multiple entries
        for i in range(5):
            await client.post(
                "/api/v1/journals",
                headers=auth_headers(athlete_token),
                json={
                    "organization_id": str(organization.id),
                    "journal_type": "gratitude",
                    "gratitude_item": f"Gratitude item {i}",
                },
            )

        # Get first page
        response = await client.get(
            "/api/v1/journals/me?limit=2&offset=0",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 2
        assert data["limit"] == 2
        assert data["offset"] == 0
        assert data["total"] >= 5

        # Get second page
        response = await client.get(
            "/api/v1/journals/me?limit=2&offset=2",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 2
        assert data["offset"] == 2

    @pytest.mark.asyncio
    async def test_get_my_entries_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/journals/me")
        assert response.status_code == 401


class TestGetJournalCalendar:
    """Tests for journal calendar endpoint."""

    @pytest.mark.asyncio
    async def test_get_calendar(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return calendar data for a month."""
        # Create an entry
        await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Test item",
            },
        )

        response = await client.get(
            "/api/v1/journals/me/calendar?year=2025&month=12",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["year"] == 2025
        assert data["month"] == 12
        assert "dates_with_entries" in data
        assert "total_entries" in data

    @pytest.mark.asyncio
    async def test_get_calendar_entry_structure(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return correct structure for calendar entries."""
        # Create an entry
        await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Calendar test item",
            },
        )

        from datetime import datetime
        now = datetime.now()

        response = await client.get(
            f"/api/v1/journals/me/calendar?year={now.year}&month={now.month}",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()

        # Find today's entry in dates_with_entries
        if data["dates_with_entries"]:
            date_entry = data["dates_with_entries"][0]
            assert "date" in date_entry
            assert "entry_count" in date_entry
            assert "types" in date_entry
            assert "entries" in date_entry

    @pytest.mark.asyncio
    async def test_get_calendar_invalid_month(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should reject invalid month."""
        response = await client.get(
            "/api/v1/journals/me/calendar?year=2025&month=13",
            headers=auth_headers(athlete_token),
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_calendar_requires_auth(self, client: AsyncClient):
        """Should require authentication."""
        response = await client.get("/api/v1/journals/me/calendar?year=2025&month=12")
        assert response.status_code == 401


class TestGetJournalEntry:
    """Tests for getting a specific journal entry."""

    @pytest.mark.asyncio
    async def test_get_entry_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should return a specific journal entry."""
        # Create an entry
        create_response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "daily_wins",
                "win_description": "Great win today",
                "win_factors": ["focus"],
            },
        )
        entry_id = create_response.json()["id"]

        # Get the entry
        response = await client.get(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == entry_id
        assert data["journal_type"] == "daily_wins"
        assert data["win_description"] == "Great win today"

    @pytest.mark.asyncio
    async def test_get_entry_not_found(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return 404 for non-existent entry."""
        response = await client.get(
            f"/api/v1/journals/{uuid.uuid4()}",
            headers=auth_headers(athlete_token),
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_entry_other_user_forbidden(
        self,
        client: AsyncClient,
        athlete_token: str,
        admin_token: str,
        organization: Organization,
    ):
        """Should not return another user's entry."""
        # Create entry as athlete
        create_response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Private gratitude",
            },
        )
        entry_id = create_response.json()["id"]

        # Try to get it as admin (different user)
        response = await client.get(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(admin_token),
        )
        # Should return 404 (entry not found for that user)
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_entry_requires_auth(
        self, client: AsyncClient
    ):
        """Should require authentication."""
        response = await client.get(f"/api/v1/journals/{uuid.uuid4()}")
        assert response.status_code == 401


class TestUpdateJournalEntry:
    """Tests for updating journal entries."""

    @pytest.mark.asyncio
    async def test_update_entry_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should update a journal entry successfully."""
        # Create an entry
        create_response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Original item",
                "gratitude_why_meaningful": "Original reason",
            },
        )
        entry_id = create_response.json()["id"]

        # Update the entry
        response = await client.put(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(athlete_token),
            json={
                "gratitude_item": "Updated item",
                "gratitude_why_meaningful": "Updated reason",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["gratitude_item"] == "Updated item"
        assert data["gratitude_why_meaningful"] == "Updated reason"

    @pytest.mark.asyncio
    async def test_update_open_ended_recalculates_word_count(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should recalculate word count when content is updated."""
        # Create an entry
        create_response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "open_ended",
                "content": "Short content",
            },
        )
        entry_id = create_response.json()["id"]
        original_word_count = create_response.json()["word_count"]

        # Update with longer content
        new_content = "This is a much longer piece of content that should have more words"
        response = await client.put(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(athlete_token),
            json={
                "content": new_content,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["word_count"] == len(new_content.split())
        assert data["word_count"] > original_word_count

    @pytest.mark.asyncio
    async def test_update_entry_not_found(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return 404 for non-existent entry."""
        response = await client.put(
            f"/api/v1/journals/{uuid.uuid4()}",
            headers=auth_headers(athlete_token),
            json={"gratitude_item": "Updated"},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_entry_other_user_forbidden(
        self,
        client: AsyncClient,
        athlete_token: str,
        admin_token: str,
        organization: Organization,
    ):
        """Should not allow updating another user's entry."""
        # Create entry as athlete
        create_response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Private",
            },
        )
        entry_id = create_response.json()["id"]

        # Try to update as admin (different user)
        response = await client.put(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(admin_token),
            json={"gratitude_item": "Hacked"},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_entry_requires_auth(
        self, client: AsyncClient
    ):
        """Should require authentication."""
        response = await client.put(
            f"/api/v1/journals/{uuid.uuid4()}",
            json={"gratitude_item": "Updated"},
        )
        assert response.status_code == 401


class TestDeleteJournalEntry:
    """Tests for deleting journal entries."""

    @pytest.mark.asyncio
    async def test_delete_entry_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should delete a journal entry successfully."""
        # Create an entry
        create_response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "To be deleted",
            },
        )
        entry_id = create_response.json()["id"]

        # Delete the entry
        response = await client.delete(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(athlete_token),
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_entry_not_found(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return 404 for non-existent entry."""
        response = await client.delete(
            f"/api/v1/journals/{uuid.uuid4()}",
            headers=auth_headers(athlete_token),
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_entry_other_user_forbidden(
        self,
        client: AsyncClient,
        athlete_token: str,
        admin_token: str,
        organization: Organization,
    ):
        """Should not allow deleting another user's entry."""
        # Create entry as athlete
        create_response = await client.post(
            "/api/v1/journals",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "journal_type": "gratitude",
                "gratitude_item": "Private",
            },
        )
        entry_id = create_response.json()["id"]

        # Try to delete as admin (different user)
        response = await client.delete(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 404

        # Verify it still exists for the athlete
        get_response = await client.get(
            f"/api/v1/journals/{entry_id}",
            headers=auth_headers(athlete_token),
        )
        assert get_response.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_entry_requires_auth(
        self, client: AsyncClient
    ):
        """Should require authentication."""
        response = await client.delete(f"/api/v1/journals/{uuid.uuid4()}")
        assert response.status_code == 401
