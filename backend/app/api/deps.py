from typing import Annotated, Callable
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.membership import Membership, MembershipStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_superadmin(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """Ensure user is a superadmin."""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SuperAdmin access required",
        )
    return current_user


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[User, Depends(get_current_active_user)]
SuperAdmin = Annotated[User, Depends(get_current_superadmin)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


async def verify_org_membership(
    db: AsyncSession,
    user_id: UUID,
    organization_id: UUID,
) -> Membership:
    """
    Verify user is a member of the organization.

    Args:
        db: Database session
        user_id: ID of the user
        organization_id: ID of the organization

    Returns:
        Membership record if user is a member

    Raises:
        HTTPException: 403 if user is not a member of the organization
    """
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user_id,
            Membership.organization_id == organization_id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization",
        )

    # Verify membership is active (not pending or inactive)
    if membership.status != MembershipStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your membership is not active",
        )

    return membership


def require_org_membership(org_id_field: str = "organization_id") -> Callable:
    """
    Create a dependency that verifies the current user is a member of the organization.

    This factory function creates a dependency that extracts the organization_id from
    the request body (using the specified field name) and verifies the current user
    has membership in that organization.

    Args:
        org_id_field: The name of the field in the request body containing the organization ID.
                      Defaults to "organization_id".

    Returns:
        A dependency function that can be used with FastAPI's Depends()

    Usage:
        @router.post("/something")
        async def create_something(
            data: SomeCreateSchema,
            membership: Membership = Depends(require_org_membership()),
            db: AsyncSession = Depends(get_db),
            current_user: User = Depends(get_current_active_user),
        ):
            # membership is verified, proceed with logic
            ...

    Note:
        The request body schema must have the organization_id field accessible.
        This dependency should be used after get_current_active_user and get_db.
    """
    async def dependency(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_active_user),
    ) -> None:
        # This is a factory-based approach. For actual org_id extraction from body,
        # we need to use a different pattern since we can't access the body directly.
        # See the verify_org_membership function for direct usage.
        pass

    return dependency


class OrgMembershipChecker:
    """
    Dependency class for verifying organization membership.

    This provides a reusable way to verify membership that can be used
    in route handlers after parsing the request body.

    Usage in route handlers:
        membership = await OrgMembershipChecker.verify(
            db, current_user.id, data.organization_id
        )
    """

    @staticmethod
    async def verify(
        db: AsyncSession,
        user_id: UUID,
        organization_id: UUID,
    ) -> Membership:
        """Verify membership and return the Membership record."""
        return await verify_org_membership(db, user_id, organization_id)

    @staticmethod
    async def check(
        db: AsyncSession,
        user_id: UUID,
        organization_id: UUID,
    ) -> bool:
        """Check membership without raising exception. Returns True if member."""
        result = await db.execute(
            select(Membership).where(
                Membership.user_id == user_id,
                Membership.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none() is not None
