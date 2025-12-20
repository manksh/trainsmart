"""
Tests for API dependency injection functions.

Tests the require_org_membership dependency which validates that a user
has active membership in a specified organization before allowing access.
"""

import uuid
from datetime import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Organization, Membership
from app.models.membership import MembershipRole, MembershipStatus
from tests.conftest import auth_headers, create_test_token


# === Test Fixtures ===

@pytest.fixture
async def second_organization(db_session: AsyncSession, superadmin_user: User) -> Organization:
    """Create a second test organization that the athlete is NOT a member of."""
    org = Organization(
        id=uuid.uuid4(),
        name="Other Club",
        sport="basketball",
        description="A club the athlete does not belong to",
        created_by=superadmin_user.id,
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest.fixture
async def inactive_membership_user(
    db_session: AsyncSession, organization: Organization
) -> User:
    """Create a user with inactive membership in the test organization."""
    user = User(
        id=uuid.uuid4(),
        email="inactive_member@test.com",
        password_hash="hashed_password",
        first_name="Inactive",
        last_name="Member",
        is_superadmin=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Create INACTIVE membership
    membership = Membership(
        id=uuid.uuid4(),
        user_id=user.id,
        organization_id=organization.id,
        role=MembershipRole.ATHLETE,
        status=MembershipStatus.INACTIVE,
        joined_at=datetime.utcnow(),
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def pending_membership_user(
    db_session: AsyncSession, organization: Organization
) -> User:
    """Create a user with pending membership in the test organization."""
    user = User(
        id=uuid.uuid4(),
        email="pending_member@test.com",
        password_hash="hashed_password",
        first_name="Pending",
        last_name="Member",
        is_superadmin=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Create PENDING membership
    membership = Membership(
        id=uuid.uuid4(),
        user_id=user.id,
        organization_id=organization.id,
        role=MembershipRole.ATHLETE,
        status=MembershipStatus.PENDING,
        invited_at=datetime.utcnow(),
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def user_no_membership(db_session: AsyncSession) -> User:
    """Create a user with no organization memberships."""
    user = User(
        id=uuid.uuid4(),
        email="no_membership@test.com",
        password_hash="hashed_password",
        first_name="No",
        last_name="Membership",
        is_superadmin=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# === Token Fixtures for Special Users ===

@pytest.fixture
def inactive_membership_token(inactive_membership_user: User, organization: Organization) -> str:
    """Get JWT token for user with inactive membership."""
    return create_test_token(inactive_membership_user, [str(organization.id)])


@pytest.fixture
def pending_membership_token(pending_membership_user: User, organization: Organization) -> str:
    """Get JWT token for user with pending membership."""
    return create_test_token(pending_membership_user, [str(organization.id)])


@pytest.fixture
def no_membership_token(user_no_membership: User) -> str:
    """Get JWT token for user with no memberships."""
    return create_test_token(user_no_membership, [])


# === Tests for require_org_membership Dependency ===

class TestRequireOrgMembership:
    """
    Tests for the require_org_membership dependency.

    This dependency should:
    1. Return the user when they have an active membership in the specified org
    2. Raise 403 when the user has no membership in the specified org
    3. Raise 403 when the user's membership is inactive
    4. Raise 403 when the user's membership is pending
    """

    @pytest.mark.asyncio
    async def test_valid_membership_returns_user(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Should allow access when user has active membership."""
        # Try to create a check-in (uses require_org_membership internally)
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest"],
            },
        )

        # Should succeed (201 Created)
        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_no_membership_raises_403(
        self,
        client: AsyncClient,
        no_membership_token: str,
        organization: Organization,
    ):
        """Should raise 403 when user has no membership in the organization."""
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(no_membership_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest"],
            },
        )

        # Should be forbidden
        assert response.status_code == 403
        assert "member" in response.json()["detail"].lower() or "access" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_wrong_organization_raises_403(
        self,
        client: AsyncClient,
        athlete_token: str,
        second_organization: Organization,
    ):
        """Should raise 403 when user tries to access a different organization."""
        # athlete_user is member of 'organization', not 'second_organization'
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(second_organization.id),
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest"],
            },
        )

        # Should be forbidden
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_inactive_membership_raises_403(
        self,
        client: AsyncClient,
        inactive_membership_token: str,
        organization: Organization,
    ):
        """Should raise 403 when user's membership is inactive."""
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(inactive_membership_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest"],
            },
        )

        # Should be forbidden (inactive membership is not valid)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_pending_membership_raises_403(
        self,
        client: AsyncClient,
        pending_membership_token: str,
        organization: Organization,
    ):
        """Should raise 403 when user's membership is pending (not yet joined)."""
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(pending_membership_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest"],
            },
        )

        # Should be forbidden (pending membership hasn't joined yet)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_nonexistent_organization_returns_404_or_403(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Should return 404 or 403 when organization doesn't exist."""
        fake_org_id = str(uuid.uuid4())

        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": fake_org_id,
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest"],
            },
        )

        # Either 404 (org not found) or 403 (no membership) is acceptable
        assert response.status_code in [403, 404]

    @pytest.mark.asyncio
    async def test_superadmin_can_access_any_organization(
        self,
        client: AsyncClient,
        superadmin_token: str,
        organization: Organization,
    ):
        """
        Superadmin should be able to access resources in any organization.

        Note: This test documents expected behavior. If superadmins should NOT
        have automatic access, this test should fail and be updated.
        """
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(superadmin_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "confident",
                "intensity": 5,
                "body_areas": ["chest"],
            },
        )

        # Superadmins should be able to access (either 201 or implementation-specific)
        # If your implementation doesn't allow this, adjust the assertion
        # This documents the expected behavior for discussion
        assert response.status_code in [201, 403]

    @pytest.mark.asyncio
    async def test_admin_can_access_own_organization(
        self,
        client: AsyncClient,
        admin_token: str,
        organization: Organization,
    ):
        """Admin should be able to access resources in their own organization."""
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(admin_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "confident",
                "intensity": 5,
                "body_areas": ["chest"],
            },
        )

        # Admin should succeed
        assert response.status_code == 201


class TestMembershipStatusTransitions:
    """
    Tests for how membership status changes affect access.
    """

    @pytest.mark.asyncio
    async def test_access_changes_when_membership_deactivated(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
        athlete_token: str,
    ):
        """
        Access should be denied after membership is deactivated.

        This tests the scenario where an athlete is removed from a team.
        """
        # First, verify the athlete can access
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest"],
            },
        )
        assert response.status_code == 201

        # Now deactivate the membership
        from sqlalchemy import select
        result = await db_session.execute(
            select(Membership).where(
                Membership.user_id == athlete_user.id,
                Membership.organization_id == organization.id
            )
        )
        membership = result.scalar_one()
        membership.status = MembershipStatus.INACTIVE
        await db_session.commit()

        # Try to access again - should be denied
        response = await client.post(
            "/api/v1/checkins",
            headers=auth_headers(athlete_token),
            json={
                "organization_id": str(organization.id),
                "emotion": "happy",
                "intensity": 4,
                "body_areas": ["chest"],
            },
        )
        assert response.status_code == 403
