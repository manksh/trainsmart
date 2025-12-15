from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.api.deps import CurrentUser
from app.schemas import UserResponse, UserWithMemberships
from app.models import User, Membership

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: CurrentUser):
    """Get current authenticated user."""
    return UserResponse.model_validate(current_user)


@router.get("/me/full", response_model=UserWithMemberships)
async def get_current_user_with_memberships(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get current user with all memberships."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.memberships).selectinload(Membership.organization))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one()
    return UserWithMemberships.model_validate(user)
