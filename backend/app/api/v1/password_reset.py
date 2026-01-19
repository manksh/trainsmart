"""
Password reset API endpoints.

Provides forgot-password and reset-password functionality.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.rate_limiter import limiter
from app.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
from app.services.password_reset import PasswordResetService

router = APIRouter()


def _get_frontend_url(origin: Optional[str] = None, referer: Optional[str] = None) -> str:
    """
    Determine the frontend URL from request headers.

    Priority: Origin header > Referer header > fallback to localhost

    Args:
        origin: Origin header value
        referer: Referer header value

    Returns:
        Frontend base URL without trailing slash
    """
    if origin:
        return origin.rstrip("/")

    if referer:
        # Extract origin from referer (e.g., "https://example.com/page" -> "https://example.com")
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"

    # Fallback for local development
    return "http://localhost:3000"


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit("3/hour")  # Strict rate limiting to prevent abuse
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
    origin: Optional[str] = Header(None),
    referer: Optional[str] = Header(None),
):
    """
    Request a password reset email.

    Sends a password reset link to the user's email if the account exists.
    Always returns success to prevent email enumeration attacks.

    Rate limited to 3 requests per hour per IP address.
    """
    service = PasswordResetService(db)
    frontend_url = _get_frontend_url(origin, referer)

    await service.request_password_reset(
        email=data.email,
        frontend_url=frontend_url,
    )

    # Always return the same response regardless of whether email exists
    return ForgotPasswordResponse()


@router.post("/reset-password", response_model=ResetPasswordResponse)
@limiter.limit("5/minute")  # Allow retries for typos
async def reset_password(
    request: Request,
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Reset password using a valid reset token.

    The token must be valid, unused, and not expired (30 minute expiry).
    Password must meet security requirements.
    """
    service = PasswordResetService(db)

    success = await service.reset_password(
        token=data.token,
        new_password=data.new_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token. Please request a new password reset.",
        )

    return ResetPasswordResponse()


@router.get("/validate-token/{token}")
@limiter.limit("10/minute")  # Allow checking token validity
async def validate_reset_token(
    request: Request,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Check if a password reset token is valid.

    Used by the frontend to verify the token before showing the reset form.
    """
    service = PasswordResetService(db)

    is_valid = await service.validate_token(token)

    return {"valid": is_valid}
