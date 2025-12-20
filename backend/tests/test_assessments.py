"""
Tests for assessment API endpoints.

These tests verify:
- Assessment listing and retrieval
- Assessment submission and scoring
- Results retrieval
- Assessment status checking
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Organization, Assessment, AssessmentResponse
from tests.conftest import auth_headers


class TestListAssessments:
    """Tests for listing assessments."""

    @pytest.mark.asyncio
    async def test_list_assessments_authenticated(
        self,
        client: AsyncClient,
        athlete_token: str,
        assessment: Assessment,
    ):
        """Authenticated user should be able to list assessments."""
        response = await client.get(
            "/api/v1/assessments",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["name"] == "Test Mental Performance Assessment"

    @pytest.mark.asyncio
    async def test_list_assessments_unauthenticated(self, client: AsyncClient):
        """Unauthenticated request should return 401."""
        response = await client.get("/api/v1/assessments")

        assert response.status_code == 401


class TestGetAssessment:
    """Tests for getting a single assessment."""

    @pytest.mark.asyncio
    async def test_get_assessment_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        assessment: Assessment,
    ):
        """Should return assessment with questions."""
        response = await client.get(
            f"/api/v1/assessments/{assessment.id}",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(assessment.id)
        assert "questions" in data
        assert len(data["questions"]) == 6  # Our test fixture has 6 questions

    @pytest.mark.asyncio
    async def test_get_nonexistent_assessment(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return 404 for non-existent assessment."""
        import uuid

        fake_id = str(uuid.uuid4())
        response = await client.get(
            f"/api/v1/assessments/{fake_id}",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 404


class TestSubmitAssessment:
    """Tests for assessment submission."""

    @pytest.mark.asyncio
    async def test_submit_assessment_success(
        self,
        client: AsyncClient,
        athlete_token: str,
        athlete_user: User,
        organization: Organization,
        assessment: Assessment,
    ):
        """Valid submission should return scored results."""
        answers = [
            {"question_id": 1, "value": 5},
            {"question_id": 2, "value": 6},
            {"question_id": 3, "value": 2},
            {"question_id": 4, "value": 7},
            {"question_id": 5, "value": 3},
            {"question_id": 6, "value": 6},
        ]

        response = await client.post(
            "/api/v1/assessments/submit",
            headers=auth_headers(athlete_token),
            json={
                "assessment_id": str(assessment.id),
                "organization_id": str(organization.id),
                "answers": answers,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "pillar_scores" in data
        assert "strengths" in data
        assert "growth_areas" in data
        assert data["is_complete"] is True
        assert data["user_id"] == str(athlete_user.id)

    @pytest.mark.asyncio
    async def test_submit_incomplete_assessment(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
        assessment: Assessment,
    ):
        """Submitting with missing answers should return 400."""
        answers = [
            {"question_id": 1, "value": 5},
            {"question_id": 2, "value": 6},
            # Missing other 4 answers
        ]

        response = await client.post(
            "/api/v1/assessments/submit",
            headers=auth_headers(athlete_token),
            json={
                "assessment_id": str(assessment.id),
                "organization_id": str(organization.id),
                "answers": answers,
            },
        )

        assert response.status_code == 400
        assert "Expected" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_submit_without_membership(
        self,
        client: AsyncClient,
        superadmin_token: str,
        organization: Organization,
        assessment: Assessment,
    ):
        """User without org membership should get 403."""
        import uuid

        answers = [
            {"question_id": 1, "value": 5},
            {"question_id": 2, "value": 6},
            {"question_id": 3, "value": 2},
            {"question_id": 4, "value": 7},
            {"question_id": 5, "value": 3},
            {"question_id": 6, "value": 6},
        ]

        # Superadmin is not a member of the organization
        response = await client.post(
            "/api/v1/assessments/submit",
            headers=auth_headers(superadmin_token),
            json={
                "assessment_id": str(assessment.id),
                "organization_id": str(organization.id),
                "answers": answers,
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_submit_invalid_assessment_id(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Invalid assessment ID should return 404."""
        import uuid

        answers = [{"question_id": 1, "value": 5}]

        response = await client.post(
            "/api/v1/assessments/submit",
            headers=auth_headers(athlete_token),
            json={
                "assessment_id": str(uuid.uuid4()),
                "organization_id": str(organization.id),
                "answers": answers,
            },
        )

        assert response.status_code == 404


class TestAssessmentStatus:
    """Tests for checking assessment completion status."""

    @pytest.mark.asyncio
    async def test_status_no_assessment(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """New user should have no completed assessment."""
        response = await client.get(
            "/api/v1/assessments/me/status",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_completed"] is False
        assert data["response_id"] is None

    @pytest.mark.asyncio
    async def test_status_completed_assessment(
        self,
        client: AsyncClient,
        athlete_token: str,
        completed_assessment_response: AssessmentResponse,
    ):
        """User with completed assessment should show as completed."""
        response = await client.get(
            "/api/v1/assessments/me/status",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_completed"] is True
        assert data["response_id"] == str(completed_assessment_response.id)


class TestGetResults:
    """Tests for retrieving assessment results."""

    @pytest.mark.asyncio
    async def test_get_own_results(
        self,
        client: AsyncClient,
        athlete_token: str,
        completed_assessment_response: AssessmentResponse,
    ):
        """User should be able to get their own results."""
        response = await client.get(
            f"/api/v1/assessments/results/{completed_assessment_response.id}",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(completed_assessment_response.id)
        assert "pillar_scores" in data
        assert "strengths" in data

    @pytest.mark.asyncio
    async def test_get_latest_results(
        self,
        client: AsyncClient,
        athlete_token: str,
        completed_assessment_response: AssessmentResponse,
    ):
        """Should return most recent results."""
        response = await client.get(
            "/api/v1/assessments/results/me/latest",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(completed_assessment_response.id)

    @pytest.mark.asyncio
    async def test_get_results_no_assessment(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """User without assessment should get 404."""
        response = await client.get(
            "/api/v1/assessments/results/me/latest",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_cannot_access_others_results(
        self,
        client: AsyncClient,
        admin_token: str,
        completed_assessment_response: AssessmentResponse,
    ):
        """User should not be able to see another user's results."""
        response = await client.get(
            f"/api/v1/assessments/results/{completed_assessment_response.id}",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_superadmin_can_access_any_results(
        self,
        client: AsyncClient,
        superadmin_token: str,
        completed_assessment_response: AssessmentResponse,
    ):
        """Superadmin should be able to see any user's results."""
        response = await client.get(
            f"/api/v1/assessments/results/{completed_assessment_response.id}",
            headers=auth_headers(superadmin_token),
        )

        assert response.status_code == 200


class TestResetAssessment:
    """Tests for the assessment reset endpoint (testing only)."""

    @pytest.mark.asyncio
    async def test_reset_clears_responses(
        self,
        client: AsyncClient,
        athlete_token: str,
        completed_assessment_response: AssessmentResponse,
    ):
        """Reset should delete all user's assessment responses."""
        # First verify the response exists
        status_before = await client.get(
            "/api/v1/assessments/me/status",
            headers=auth_headers(athlete_token),
        )
        assert status_before.json()["has_completed"] is True

        # Reset
        response = await client.delete(
            "/api/v1/assessments/me/reset",
            headers=auth_headers(athlete_token),
        )
        assert response.status_code == 200
        assert "Deleted" in response.json()["message"]

        # Verify responses are gone
        status_after = await client.get(
            "/api/v1/assessments/me/status",
            headers=auth_headers(athlete_token),
        )
        assert status_after.json()["has_completed"] is False

    @pytest.mark.asyncio
    async def test_reset_no_responses(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """Reset with no responses should return success with 0 deleted."""
        response = await client.delete(
            "/api/v1/assessments/me/reset",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        assert "0" in response.json()["message"]


class TestScoresAccuracy:
    """Tests to verify scoring accuracy in submitted assessments."""

    @pytest.mark.asyncio
    async def test_reverse_scoring_applied_in_submission(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
        assessment: Assessment,
    ):
        """Reverse scoring should be correctly applied during submission."""
        # Question 1 is reverse scored (mindfulness, is_reverse=True)
        # Question 3 is reverse scored (attentional_focus, is_reverse=True)
        # Question 5 is reverse scored (arousal_control, is_reverse=True)
        answers = [
            {"question_id": 1, "value": 1},  # reverse: 7 for mindfulness
            {"question_id": 2, "value": 7},  # 7 for confidence
            {"question_id": 3, "value": 1},  # reverse: 7 for attentional_focus
            {"question_id": 4, "value": 7},  # 7 for motivation/resilience
            {"question_id": 5, "value": 1},  # reverse: 7 for arousal_control
            {"question_id": 6, "value": 7},  # 7 for resilience
        ]

        response = await client.post(
            "/api/v1/assessments/submit",
            headers=auth_headers(athlete_token),
            json={
                "assessment_id": str(assessment.id),
                "organization_id": str(organization.id),
                "answers": answers,
            },
        )

        assert response.status_code == 200
        data = response.json()
        scores = data["pillar_scores"]

        # All reverse-scored questions had value 1, which becomes 7
        # All non-reverse questions had value 7
        # So all scores should be 7.0
        assert scores["mindfulness"] == 7.0
        assert scores["confidence"] == 7.0
        assert scores["attentional_focus"] == 7.0
        assert scores["arousal_control"] == 7.0
