from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.rate_limiter import limiter
from app.schemas import (
    LoginRequest,
    LoginResponse,
    UserCreate,
    UserCreateWithInvite,
    UserResponse,
)
from app.services.auth import AuthService

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user and return JWT token."""
    auth_service = AuthService(db)

    user = await auth_service.authenticate_user(
        email=login_data.email,
        password=login_data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Load memberships for token
    user = await auth_service.get_user_with_memberships(user.id)
    token = auth_service.create_token_for_user(user)

    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register_with_invite(
    request: Request,
    user_data: UserCreateWithInvite,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user using an invite code."""
    auth_service = AuthService(db)

    # Check if user already exists
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    try:
        user = await auth_service.create_user_with_invite(user_data)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/register/superadmin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("1/minute")
async def register_superadmin(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register the first superadmin user.
    This endpoint only works if no superadmin exists yet.
    """
    auth_service = AuthService(db)

    # Check if any superadmin exists
    from sqlalchemy import select, func
    from app.models import User

    result = await db.execute(
        select(func.count(User.id)).where(User.is_superadmin == True)
    )
    superadmin_count = result.scalar()

    if superadmin_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin already exists. Use invite system for new admins.",
        )

    # Check if email already exists
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = await auth_service.create_user(user_data, is_superadmin=True)
    return UserResponse.model_validate(user)
