from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import User, Membership, Invite, Organization
from app.models.membership import MembershipRole, MembershipStatus
from app.schemas import UserCreate, UserCreateWithInvite, LoginRequest
from app.utils.security import hash_password, verify_password, create_access_token
from app.config import settings


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID with memberships loaded."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.memberships))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def authenticate_user(self, email: str, password: str) -> User | None:
        """Authenticate user with email and password."""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    async def create_user(self, user_data: UserCreate, is_superadmin: bool = False) -> User:
        """Create a new user."""
        user = User(
            email=user_data.email.lower(),
            password_hash=hash_password(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_superadmin=is_superadmin,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def create_user_with_invite(self, user_data: UserCreateWithInvite) -> User:
        """Create user via invite code and link to organization."""
        # Get and validate invite
        result = await self.db.execute(
            select(Invite)
            .options(selectinload(Invite.organization))
            .where(Invite.code == user_data.invite_code)
        )
        invite = result.scalar_one_or_none()

        if not invite or not invite.is_valid:
            raise ValueError("Invalid or expired invite code")

        if invite.email.lower() != user_data.email.lower():
            raise ValueError("Email does not match invite")

        # Create user
        user = User(
            email=user_data.email.lower(),
            password_hash=hash_password(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_superadmin=False,
        )
        self.db.add(user)
        await self.db.flush()

        # Create membership
        membership = Membership(
            user_id=user.id,
            organization_id=invite.organization_id,
            role=invite.role,
            status=MembershipStatus.ACTIVE,
            joined_at=datetime.utcnow(),
        )
        self.db.add(membership)

        # Mark invite as used
        invite.used_at = datetime.utcnow()
        invite.used_by = user.id

        await self.db.commit()
        await self.db.refresh(user)
        return user

    def create_token_for_user(self, user: User) -> str:
        """Create JWT token for user."""
        # Get organization IDs from memberships
        org_ids = []
        if hasattr(user, 'memberships') and user.memberships:
            org_ids = [str(m.organization_id) for m in user.memberships]

        additional_claims = {
            "is_superadmin": user.is_superadmin,
            "organization_ids": org_ids,
        }

        return create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
            additional_claims=additional_claims,
        )

    async def get_user_with_memberships(self, user_id: UUID) -> User | None:
        """Get user with all memberships and organizations loaded."""
        result = await self.db.execute(
            select(User)
            .options(
                selectinload(User.memberships).selectinload(Membership.organization)
            )
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()
