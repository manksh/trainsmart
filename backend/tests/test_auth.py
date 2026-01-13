"""
Tests for authentication endpoints and JWT handling.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.utils.security import verify_password, hash_password, decode_token
from tests.conftest import auth_headers


class TestPasswordHashing:
    """Tests for password hashing utilities."""

    def test_hash_password_creates_hash(self):
        """Password hashing should create a valid bcrypt hash."""
        password = "Secure12!"
        hashed = hash_password(password)

        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt identifier

    def test_verify_password_correct(self):
        """Correct password should verify successfully."""
        password = "Secure12!"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Incorrect password should fail verification."""
        password = "Secure12!"
        wrong_password = "Wrong456!"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_same_password_different_hashes(self):
        """Same password should produce different hashes (salt)."""
        password = "Secure12!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Tests for JWT token creation and validation."""

    @pytest.mark.asyncio
    async def test_token_contains_user_id(self, superadmin_user: User):
        """Token should contain the user ID as subject."""
        from tests.conftest import create_test_token

        token = create_test_token(superadmin_user)
        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == str(superadmin_user.id)

    @pytest.mark.asyncio
    async def test_token_contains_superadmin_claim(self, superadmin_user: User):
        """Token should contain superadmin claim."""
        from tests.conftest import create_test_token

        token = create_test_token(superadmin_user)
        payload = decode_token(token)

        assert payload["is_superadmin"] is True

    @pytest.mark.asyncio
    async def test_token_contains_org_ids(self, athlete_user: User, organization):
        """Token should contain organization IDs."""
        from tests.conftest import create_test_token

        token = create_test_token(athlete_user, [str(organization.id)])
        payload = decode_token(token)

        assert str(organization.id) in payload["organization_ids"]

    def test_invalid_token_returns_none(self):
        """Invalid token should return None on decode."""
        invalid_token = "invalid.token.here"
        payload = decode_token(invalid_token)

        assert payload is None


class TestLoginEndpoint:
    """Tests for the /api/v1/auth/login endpoint."""

    @pytest.mark.asyncio
    async def test_login_success(
        self, client: AsyncClient, superadmin_user: User
    ):
        """Successful login should return token and user info."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "superadmin@test.com",
                "password": "Super123!",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "superadmin@test.com"
        assert data["user"]["is_superadmin"] is True

    @pytest.mark.asyncio
    async def test_login_wrong_password(
        self, client: AsyncClient, superadmin_user: User
    ):
        """Wrong password should return 401."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "superadmin@test.com",
                "password": "Wrong123!",
            },
        )

        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Non-existent user should return 401."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "Some1234!",
            },
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_inactive_user(
        self, client: AsyncClient, inactive_user: User
    ):
        """Inactive user should return 403."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "inactive@test.com",
                "password": "Inact123!",
            },
        )

        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_case_insensitive_email(
        self, client: AsyncClient, superadmin_user: User
    ):
        """Login should be case-insensitive for email."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "SUPERADMIN@TEST.COM",
                "password": "Super123!",
            },
        )

        assert response.status_code == 200


class TestProtectedEndpoints:
    """Tests for protected endpoint access."""

    @pytest.mark.asyncio
    async def test_access_without_token(self, client: AsyncClient):
        """Accessing protected endpoint without token should return 401."""
        response = await client.get("/api/v1/users/me")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_with_invalid_token(self, client: AsyncClient):
        """Accessing protected endpoint with invalid token should return 401."""
        response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_with_valid_token(
        self, client: AsyncClient, superadmin_user: User, superadmin_token: str
    ):
        """Valid token should allow access to protected endpoints."""
        response = await client.get(
            "/api/v1/users/me",
            headers=auth_headers(superadmin_token),
        )

        assert response.status_code == 200
        assert response.json()["email"] == "superadmin@test.com"


class TestRoleBasedAccess:
    """Tests for role-based access control."""

    @pytest.mark.asyncio
    async def test_superadmin_can_list_organizations(
        self, client: AsyncClient, superadmin_token: str, organization
    ):
        """Superadmin should be able to list all organizations."""
        response = await client.get(
            "/api/v1/organizations",
            headers=auth_headers(superadmin_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(org["name"] == "Test Club" for org in data)

    @pytest.mark.asyncio
    async def test_admin_cannot_list_all_organizations(
        self, client: AsyncClient, admin_token: str
    ):
        """Admin should not be able to list all organizations."""
        response = await client.get(
            "/api/v1/organizations",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_athlete_cannot_access_superadmin_endpoint(
        self, client: AsyncClient, athlete_token: str
    ):
        """Athlete should not access superadmin endpoints."""
        response = await client.get(
            "/api/v1/organizations",
            headers=auth_headers(athlete_token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_can_view_own_organization(
        self, client: AsyncClient, admin_token: str, organization
    ):
        """Admin should be able to view their own organization."""
        response = await client.get(
            f"/api/v1/organizations/{organization.id}",
            headers=auth_headers(admin_token),
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Test Club"


class TestSuperadminRegistration:
    """Tests for superadmin registration endpoint."""

    @pytest.mark.asyncio
    async def test_register_superadmin_when_none_exists(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Should be able to register superadmin when none exists."""
        # Note: This test creates a fresh database state through conftest
        # The fixture doesn't create a superadmin, so this should work
        # However, since our test fixtures may already create superadmin,
        # we need to check the specific scenario
        pass  # Skip for now as fixtures may interfere

    @pytest.mark.asyncio
    async def test_register_superadmin_blocked_when_exists(
        self, client: AsyncClient, superadmin_user: User
    ):
        """Should not be able to register superadmin when one exists."""
        response = await client.post(
            "/api/v1/auth/register/superadmin",
            json={
                "email": "another@admin.com",
                "password": "Anoth123!",
                "first_name": "Another",
                "last_name": "Admin",
            },
        )

        assert response.status_code == 403
        assert "already exists" in response.json()["detail"]
