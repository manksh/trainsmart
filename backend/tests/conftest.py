"""
Pytest configuration and fixtures for TrainSmart tests.
"""

import asyncio
import os
import uuid
from datetime import datetime
from typing import AsyncGenerator, Dict, Any

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.database import Base, get_db
from app.main import app
from app.models import User, Organization, Membership, Assessment, AssessmentResponse
from app.models.membership import MembershipRole, MembershipStatus
from app.utils.security import hash_password, create_access_token


# Use PostgreSQL for testing (supports UUID types)
# Uses the same database server but a separate test database
# Falls back to same credentials as main app via DATABASE_URL parsing
_main_db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://trainsmart:trainsmart_dev@db:5432/trainsmart")
# Replace database name with test database
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL") or _main_db_url.rsplit("/", 1)[0] + "/trainsmart_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session_maker() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client with database override."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# --- User Fixtures ---

@pytest_asyncio.fixture
async def superadmin_user(db_session: AsyncSession) -> User:
    """Create a superadmin user."""
    user = User(
        id=uuid.uuid4(),
        email="superadmin@test.com",
        password_hash=hash_password("Super123!"),
        first_name="Super",
        last_name="Admin",
        is_superadmin=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def organization(db_session: AsyncSession, superadmin_user: User) -> Organization:
    """Create a test organization."""
    org = Organization(
        id=uuid.uuid4(),
        name="Test Club",
        sport="volleyball",
        description="A test volleyball club",
        created_by=superadmin_user.id,
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession, organization: Organization) -> User:
    """Create an admin user with organization membership."""
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        password_hash=hash_password("Admin123!"),
        first_name="Club",
        last_name="Admin",
        is_superadmin=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Create admin membership
    membership = Membership(
        id=uuid.uuid4(),
        user_id=user.id,
        organization_id=organization.id,
        role=MembershipRole.ADMIN,
        status=MembershipStatus.ACTIVE,
        joined_at=datetime.utcnow(),
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def athlete_user(db_session: AsyncSession, organization: Organization) -> User:
    """Create an athlete user with organization membership."""
    user = User(
        id=uuid.uuid4(),
        email="athlete@test.com",
        password_hash=hash_password("Athlet123!"),
        first_name="Test",
        last_name="Athlete",
        is_superadmin=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    # Create athlete membership
    membership = Membership(
        id=uuid.uuid4(),
        user_id=user.id,
        organization_id=organization.id,
        role=MembershipRole.ATHLETE,
        status=MembershipStatus.ACTIVE,
        joined_at=datetime.utcnow(),
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def inactive_user(db_session: AsyncSession) -> User:
    """Create an inactive user."""
    user = User(
        id=uuid.uuid4(),
        email="inactive@test.com",
        password_hash=hash_password("Inact123!"),
        first_name="Inactive",
        last_name="User",
        is_superadmin=False,
        is_active=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# --- Token Fixtures ---

def create_test_token(user: User, org_ids: list = None) -> str:
    """Create a JWT token for a test user."""
    return create_access_token(
        subject=str(user.id),
        additional_claims={
            "is_superadmin": user.is_superadmin,
            "organization_ids": org_ids or [],
        }
    )


@pytest.fixture
def superadmin_token(superadmin_user: User) -> str:
    """Get JWT token for superadmin."""
    return create_test_token(superadmin_user)


@pytest.fixture
def admin_token(admin_user: User, organization: Organization) -> str:
    """Get JWT token for admin."""
    return create_test_token(admin_user, [str(organization.id)])


@pytest.fixture
def athlete_token(athlete_user: User, organization: Organization) -> str:
    """Get JWT token for athlete."""
    return create_test_token(athlete_user, [str(organization.id)])


def auth_headers(token: str) -> Dict[str, str]:
    """Create authorization headers."""
    return {"Authorization": f"Bearer {token}"}


# --- Assessment Fixtures ---

@pytest_asyncio.fixture
async def assessment(db_session: AsyncSession) -> Assessment:
    """Create a test assessment with sample questions."""
    questions = [
        {
            "id": 1,
            "text": "I am aware of my thoughts during competition.",
            "pillar": "Mindfulness",
            "secondary_pillar": "Self-Awareness",
            "is_reverse": True,
        },
        {
            "id": 2,
            "text": "I believe I can achieve my goals.",
            "pillar": "Confidence",
            "secondary_pillar": None,
            "is_reverse": False,
        },
        {
            "id": 3,
            "text": "I get distracted easily during training.",
            "pillar": "Attentional Focus",
            "secondary_pillar": None,
            "is_reverse": True,
        },
        {
            "id": 4,
            "text": "I stay motivated even when things are difficult.",
            "pillar": "Motivation",
            "secondary_pillar": "Resilience",
            "is_reverse": False,
        },
        {
            "id": 5,
            "text": "I struggle to control my nerves before competition.",
            "pillar": "Arousal Control",
            "secondary_pillar": None,
            "is_reverse": True,
        },
        {
            "id": 6,
            "text": "I bounce back quickly from setbacks.",
            "pillar": "Resilience",
            "secondary_pillar": None,
            "is_reverse": False,
        },
    ]

    assessment = Assessment(
        id=uuid.uuid4(),
        name="Test Mental Performance Assessment",
        description="A test assessment for unit tests",
        sport="volleyball",
        version=1,
        questions=questions,
        is_active=True,
    )
    db_session.add(assessment)
    await db_session.commit()
    await db_session.refresh(assessment)
    return assessment


@pytest_asyncio.fixture
async def completed_assessment_response(
    db_session: AsyncSession,
    athlete_user: User,
    organization: Organization,
    assessment: Assessment,
) -> AssessmentResponse:
    """Create a completed assessment response for the athlete."""
    response = AssessmentResponse(
        id=uuid.uuid4(),
        user_id=athlete_user.id,
        assessment_id=assessment.id,
        organization_id=organization.id,
        answers={"1": 5, "2": 6, "3": 2, "4": 7, "5": 3, "6": 6},
        pillar_scores={
            "mindfulness": 4.0,
            "confidence": 6.0,
            "attentional_focus": 6.0,
            "motivation": 6.5,
            "arousal_control": 5.0,
            "resilience": 6.5,
        },
        meta_scores={"thinking": 5.0, "feeling": 5.83, "action": 6.5},
        strengths=["motivation", "resilience"],
        growth_areas=["mindfulness", "arousal_control"],
        is_complete=True,
        completed_at=datetime.utcnow(),
    )
    db_session.add(response)
    await db_session.commit()
    await db_session.refresh(response)
    return response
