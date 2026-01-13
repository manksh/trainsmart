"""
Tests for authorization and organization-scoped access.

These tests verify:
- Role-based access control (SuperAdmin, Admin, Athlete)
- Organization data isolation
- Cross-organization access prevention
"""

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models import User, Organization, Membership
from app.models.membership import MembershipRole, MembershipStatus
from app.utils.security import hash_password
from tests.conftest import auth_headers, create_test_token


class TestSuperAdminAccess:
    """Tests for SuperAdmin-only endpoints."""

    @pytest.mark.asyncio
    async def test_superadmin_can_create_organization(
        self,
        client: AsyncClient,
        superadmin_token: str,
    ):
        """SuperAdmin should be able to create organizations."""
        response = await client.post(
            "/api/v1/organizations",
            headers=auth_headers(superadmin_token),
            json={
                "name": "New Test Club",
                "sport": "basketball",
                "description": "A new test club",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Test Club"
        assert data["sport"] == "basketball"

    @pytest.mark.asyncio
    async def test_admin_cannot_create_organization(
        self,
        client: AsyncClient,
        admin_token: str,
    ):
        """Admin should NOT be able to create organizations."""
        response = await client.post(
            "/api/v1/organizations",
            headers=auth_headers(admin_token),
            json={
                "name": "Unauthorized Club",
                "sport": "tennis",
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_athlete_cannot_create_organization(
        self,
        client: AsyncClient,
        athlete_token: str,
    ):
        """Athlete should NOT be able to create organizations."""
        response = await client.post(
            "/api/v1/organizations",
            headers=auth_headers(athlete_token),
            json={
                "name": "Unauthorized Club",
                "sport": "tennis",
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_superadmin_can_list_all_orgs(
        self,
        client: AsyncClient,
        superadmin_token: str,
        organization: Organization,
    ):
        """SuperAdmin should see all organizations."""
        response = await client.get(
            "/api/v1/organizations",
            headers=auth_headers(superadmin_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_superadmin_can_delete_organization(
        self,
        client: AsyncClient,
        superadmin_token: str,
        db_session: AsyncSession,
        superadmin_user: User,
    ):
        """SuperAdmin should be able to delete organizations."""
        # Create a temporary org to delete
        temp_org = Organization(
            id=uuid.uuid4(),
            name="To Delete",
            sport="golf",
            created_by=superadmin_user.id,
        )
        db_session.add(temp_org)
        await db_session.commit()

        response = await client.delete(
            f"/api/v1/organizations/{temp_org.id}",
            headers=auth_headers(superadmin_token),
        )

        assert response.status_code == 204


class TestOrganizationIsolation:
    """Tests for organization data isolation."""

    @pytest_asyncio.fixture
    async def second_organization(
        self, db_session: AsyncSession, superadmin_user: User
    ) -> Organization:
        """Create a second organization for isolation tests."""
        org = Organization(
            id=uuid.uuid4(),
            name="Second Club",
            sport="soccer",
            created_by=superadmin_user.id,
        )
        db_session.add(org)
        await db_session.commit()
        await db_session.refresh(org)
        return org

    @pytest_asyncio.fixture
    async def second_admin(
        self, db_session: AsyncSession, second_organization: Organization
    ) -> User:
        """Create admin for the second organization."""
        user = User(
            id=uuid.uuid4(),
            email="admin2@test.com",
            password_hash=hash_password("Admin2@1!"),
            first_name="Second",
            last_name="Admin",
            is_superadmin=False,
            is_active=True,
        )
        db_session.add(user)
        await db_session.flush()

        membership = Membership(
            id=uuid.uuid4(),
            user_id=user.id,
            organization_id=second_organization.id,
            role=MembershipRole.ADMIN,
            status=MembershipStatus.ACTIVE,
            joined_at=datetime.utcnow(),
        )
        db_session.add(membership)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    @pytest.fixture
    def second_admin_token(self, second_admin: User, second_organization: Organization) -> str:
        """Token for second organization's admin."""
        return create_test_token(second_admin, [str(second_organization.id)])

    @pytest.mark.asyncio
    async def test_admin_cannot_view_other_org(
        self,
        client: AsyncClient,
        admin_token: str,
        second_organization: Organization,
    ):
        """Admin should NOT be able to view other organizations."""
        response = await client.get(
            f"/api/v1/organizations/{second_organization.id}",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_can_view_own_org(
        self,
        client: AsyncClient,
        admin_token: str,
        organization: Organization,
    ):
        """Admin should be able to view their own organization."""
        response = await client.get(
            f"/api/v1/organizations/{organization.id}",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        assert response.json()["id"] == str(organization.id)

    @pytest.mark.asyncio
    async def test_admin_cannot_view_other_org_athletes(
        self,
        client: AsyncClient,
        admin_token: str,
        second_organization: Organization,
    ):
        """Admin should NOT be able to view athletes from other orgs."""
        response = await client.get(
            f"/api/v1/organizations/{second_organization.id}/athletes",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_can_view_own_org_athletes(
        self,
        client: AsyncClient,
        admin_token: str,
        organization: Organization,
        athlete_user: User,
    ):
        """Admin should be able to view their org's athletes."""
        response = await client.get(
            f"/api/v1/organizations/{organization.id}/athletes",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        data = response.json()
        emails = [a["email"] for a in data]
        assert "athlete@test.com" in emails


class TestAthleteAccess:
    """Tests for athlete access restrictions."""

    @pytest.mark.asyncio
    async def test_athlete_cannot_view_org_athletes(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Athlete should NOT be able to view organization's athlete list."""
        response = await client.get(
            f"/api/v1/organizations/{organization.id}/athletes",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_athlete_can_view_own_org(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Athlete should be able to view their organization."""
        response = await client.get(
            f"/api/v1/organizations/{organization.id}",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_athlete_can_access_own_data(
        self,
        client: AsyncClient,
        athlete_token: str,
        athlete_user: User,
    ):
        """Athlete should be able to access their own user data."""
        response = await client.get(
            "/api/v1/users/me",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 200
        assert response.json()["email"] == "athlete@test.com"


class TestInviteAuthorization:
    """Tests for invite system authorization."""

    @pytest.mark.asyncio
    async def test_admin_can_create_invite_for_own_org(
        self,
        client: AsyncClient,
        admin_token: str,
        organization: Organization,
    ):
        """Admin should be able to create invites for their organization."""
        response = await client.post(
            "/api/v1/invites",
            headers=auth_headers(admin_token),
            json={
                "email": "newathlete@test.com",
                "organization_id": str(organization.id),
                "role": "athlete",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newathlete@test.com"
        assert data["role"] == "athlete"

    @pytest.mark.asyncio
    async def test_athlete_cannot_create_invite(
        self,
        client: AsyncClient,
        athlete_token: str,
        organization: Organization,
    ):
        """Athlete should NOT be able to create invites."""
        response = await client.post(
            "/api/v1/invites",
            headers=auth_headers(athlete_token),
            json={
                "email": "unauthorized@test.com",
                "organization_id": str(organization.id),
                "role": "athlete",
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_superadmin_can_create_admin_invite(
        self,
        client: AsyncClient,
        superadmin_token: str,
        organization: Organization,
    ):
        """SuperAdmin should be able to create admin invites."""
        response = await client.post(
            "/api/v1/invites",
            headers=auth_headers(superadmin_token),
            json={
                "email": "newadmin@test.com",
                "organization_id": str(organization.id),
                "role": "admin",
            },
        )

        assert response.status_code == 201
        assert response.json()["role"] == "admin"


class TestMembershipRequired:
    """Tests that verify membership is required for org-scoped actions."""

    @pytest.mark.asyncio
    async def test_non_member_cannot_view_org(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        organization: Organization,
    ):
        """User without membership should not view organization."""
        # Create a user with no memberships
        user = User(
            id=uuid.uuid4(),
            email="nomember@test.com",
            password_hash=hash_password("NoMemb1!"),
            first_name="No",
            last_name="Member",
            is_superadmin=False,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()

        token = create_test_token(user, [])

        response = await client.get(
            f"/api/v1/organizations/{organization.id}",
            headers=auth_headers(token),
        )

        assert response.status_code == 403


class TestInactiveUserBlocked:
    """Tests that inactive users are blocked from API access."""

    @pytest.mark.asyncio
    async def test_inactive_user_blocked_from_api(
        self,
        client: AsyncClient,
        inactive_user: User,
    ):
        """Inactive user should be blocked from all API endpoints."""
        token = create_test_token(inactive_user)

        response = await client.get(
            "/api/v1/users/me",
            headers=auth_headers(token),
        )

        assert response.status_code == 400
        assert "Inactive" in response.json()["detail"]
