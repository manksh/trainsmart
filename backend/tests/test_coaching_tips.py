"""
Tests for coaching tips endpoint.

These tests verify the GET /api/v1/coaching-tips endpoint that provides
sport psychologist-curated tips for coaches based on athlete pillar scores.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers


class TestCoachingTipsEndpoint:
    """Tests for GET /api/v1/coaching-tips endpoint."""

    @pytest.mark.asyncio
    async def test_get_coaching_tips_returns_200(
        self, client: AsyncClient, admin_token: str
    ):
        """GET /coaching-tips returns 200 with valid structure."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "tips" in data

    @pytest.mark.asyncio
    async def test_get_coaching_tips_returns_all_pillars(
        self, client: AsyncClient, admin_token: str
    ):
        """Response contains all 10 pillars."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "tips" in data
        assert len(data["tips"]) == 10

        # Verify all expected pillars are present
        # 6 core competencies + 4 supporting attributes
        expected_pillars = {
            # Core competencies
            "mindfulness",
            "confidence",
            "attentional_focus",
            "motivation",
            "arousal_control",
            "resilience",
            # Supporting attributes
            "deliberate_practice",
            "knowledge",
            "wellness",
            "self_awareness",
        }
        actual_pillars = set(data["tips"].keys())
        assert actual_pillars == expected_pillars

    @pytest.mark.asyncio
    async def test_get_coaching_tips_structure(
        self, client: AsyncClient, admin_token: str
    ):
        """Each pillar has required fields."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        data = response.json()

        for pillar_key, pillar_data in data["tips"].items():
            # Check required top-level fields
            assert "pillar" in pillar_data, f"Missing 'pillar' in {pillar_key}"
            assert "display_name" in pillar_data, f"Missing 'display_name' in {pillar_key}"
            assert "strength_tips" in pillar_data, f"Missing 'strength_tips' in {pillar_key}"
            assert "growth_tips" in pillar_data, f"Missing 'growth_tips' in {pillar_key}"

            # Check strength_tips structure
            strength_tips = pillar_data["strength_tips"]
            assert "practice" in strength_tips, f"Missing 'practice' in strength_tips for {pillar_key}"
            assert "game_day" in strength_tips, f"Missing 'game_day' in strength_tips for {pillar_key}"

            # Check growth_tips structure
            growth_tips = pillar_data["growth_tips"]
            assert "practice" in growth_tips, f"Missing 'practice' in growth_tips for {pillar_key}"
            assert "game_day" in growth_tips, f"Missing 'game_day' in growth_tips for {pillar_key}"

            # Verify tips are non-empty strings
            assert isinstance(strength_tips["practice"], str) and len(strength_tips["practice"]) > 0
            assert isinstance(strength_tips["game_day"], str) and len(strength_tips["game_day"]) > 0
            assert isinstance(growth_tips["practice"], str) and len(growth_tips["practice"]) > 0
            assert isinstance(growth_tips["game_day"], str) and len(growth_tips["game_day"]) > 0

    @pytest.mark.asyncio
    async def test_get_coaching_tips_includes_thresholds(
        self, client: AsyncClient, admin_token: str
    ):
        """Response includes threshold values for strength and growth classification."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        data = response.json()

        assert "thresholds" in data
        assert "strength" in data["thresholds"]
        assert "growth" in data["thresholds"]

        # Verify threshold values
        assert data["thresholds"]["strength"] == 5.5
        assert data["thresholds"]["growth"] == 3.5

    @pytest.mark.asyncio
    async def test_get_coaching_tips_cache_headers(
        self, client: AsyncClient, admin_token: str
    ):
        """Response has proper cache headers for static content."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200

        # Verify cache control header exists and has appropriate max-age
        assert "Cache-Control" in response.headers
        cache_control = response.headers["Cache-Control"]
        assert "max-age=86400" in cache_control  # 24 hours

    @pytest.mark.asyncio
    async def test_get_coaching_tips_requires_auth(self, client: AsyncClient):
        """Unauthenticated request returns 401."""
        response = await client.get("/api/v1/coaching-tips")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_coaching_tips_trailing_slash_404(
        self, client: AsyncClient, admin_token: str
    ):
        """Trailing slash returns 404 per project pattern.

        This test verifies the project's redirect_slashes=False setting.
        The backend defines routes WITHOUT trailing slashes, so requests
        WITH trailing slashes should return 404.
        """
        response = await client.get(
            "/api/v1/coaching-tips/",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_coaching_tips_athlete_can_access(
        self, client: AsyncClient, athlete_token: str
    ):
        """Athletes can also access coaching tips (useful for self-reflection)."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(athlete_token),
        )

        # Should be accessible - tips are read-only reference data
        assert response.status_code == 200
        data = response.json()
        assert "tips" in data


class TestCoachingTipsPillarContent:
    """Tests verifying the content quality of coaching tips."""

    @pytest.mark.asyncio
    async def test_confidence_tips_are_appropriate(
        self, client: AsyncClient, admin_token: str
    ):
        """Confidence pillar has appropriate strength and growth tips."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        data = response.json()
        confidence = data["tips"]["confidence"]

        assert confidence["display_name"] == "Confidence"

        # Strength tips should help leverage existing confidence
        assert "practice" in confidence["strength_tips"]
        assert "game_day" in confidence["strength_tips"]

        # Growth tips should help build confidence
        assert "practice" in confidence["growth_tips"]
        assert "game_day" in confidence["growth_tips"]

    @pytest.mark.asyncio
    async def test_arousal_control_tips_are_appropriate(
        self, client: AsyncClient, admin_token: str
    ):
        """Arousal Control pillar has appropriate tips for managing nerves."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        data = response.json()
        arousal = data["tips"]["arousal_control"]

        assert arousal["display_name"] == "Arousal Control"

        # Verify structure exists
        assert "strength_tips" in arousal
        assert "growth_tips" in arousal

    @pytest.mark.asyncio
    async def test_all_display_names_are_human_readable(
        self, client: AsyncClient, admin_token: str
    ):
        """All pillar display names are properly formatted for UI display."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        data = response.json()

        expected_display_names = {
            # Core competencies
            "mindfulness": "Mindfulness",
            "confidence": "Confidence",
            "attentional_focus": "Attentional Focus",
            "motivation": "Motivation",
            "arousal_control": "Arousal Control",
            "resilience": "Resilience",
            # Supporting attributes
            "deliberate_practice": "Deliberate Practice",
            "knowledge": "Knowledge",
            "wellness": "Wellness",
            "self_awareness": "Self-Awareness",
        }

        for pillar_key, expected_name in expected_display_names.items():
            assert pillar_key in data["tips"], f"Missing pillar: {pillar_key}"
            assert data["tips"][pillar_key]["display_name"] == expected_name, \
                f"Display name mismatch for {pillar_key}"


class TestCoachingTipsEdgeCases:
    """Edge case and boundary tests for coaching tips endpoint."""

    @pytest.mark.asyncio
    async def test_get_coaching_tips_method_not_allowed(
        self, client: AsyncClient, admin_token: str
    ):
        """POST to coaching-tips returns 405 Method Not Allowed."""
        response = await client.post(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
            json={},
        )

        assert response.status_code == 405

    @pytest.mark.asyncio
    async def test_get_coaching_tips_accepts_get_only(
        self, client: AsyncClient, admin_token: str
    ):
        """PUT to coaching-tips returns 405 Method Not Allowed."""
        response = await client.put(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
            json={},
        )

        assert response.status_code == 405

    @pytest.mark.asyncio
    async def test_get_coaching_tips_delete_not_allowed(
        self, client: AsyncClient, admin_token: str
    ):
        """DELETE to coaching-tips returns 405 Method Not Allowed."""
        response = await client.delete(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 405

    @pytest.mark.asyncio
    async def test_get_coaching_tips_consistent_responses(
        self, client: AsyncClient, admin_token: str
    ):
        """Multiple requests return identical data (static content)."""
        response1 = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )
        response2 = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json() == response2.json()

    @pytest.mark.asyncio
    async def test_get_coaching_tips_superadmin_access(
        self, client: AsyncClient, superadmin_token: str
    ):
        """Superadmin can access coaching tips."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(superadmin_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "tips" in data
        assert len(data["tips"]) == 10


class TestCoachingTipsThresholdLogic:
    """Tests for threshold values and their intended usage."""

    @pytest.mark.asyncio
    async def test_thresholds_are_logical(
        self, client: AsyncClient, admin_token: str
    ):
        """Strength threshold > growth threshold (logical ordering)."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        data = response.json()
        thresholds = data["thresholds"]

        # Strength threshold should be higher than growth threshold
        assert thresholds["strength"] > thresholds["growth"]

        # There should be a gap (middle range) between them
        gap = thresholds["strength"] - thresholds["growth"]
        assert gap >= 1.5, "Expected meaningful gap between thresholds"

    @pytest.mark.asyncio
    async def test_thresholds_within_valid_score_range(
        self, client: AsyncClient, admin_token: str
    ):
        """Thresholds are within valid pillar score range (1-7)."""
        response = await client.get(
            "/api/v1/coaching-tips",
            headers=auth_headers(admin_token),
        )

        data = response.json()
        thresholds = data["thresholds"]

        # Assuming pillar scores range from 1 to 7
        min_score = 1.0
        max_score = 7.0

        assert thresholds["strength"] >= min_score
        assert thresholds["strength"] <= max_score
        assert thresholds["growth"] >= min_score
        assert thresholds["growth"] <= max_score
