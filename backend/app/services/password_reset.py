"""
Password reset service.

Handles the forgot password and reset password flows with secure token generation.
"""

import logging
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, PasswordResetToken
from app.utils.security import hash_password
from app.services.email import email_service
from app.config import settings

logger = logging.getLogger(__name__)

# Token configuration
TOKEN_EXPIRY_MINUTES = 30
TOKEN_BYTES = 32  # 256 bits of entropy


def _hash_token(token: str) -> str:
    """Hash a reset token for secure storage using SHA-256."""
    return hashlib.sha256(token.encode()).hexdigest()


class PasswordResetService:
    """
    Service for managing password reset operations.

    Security features:
    - Tokens are cryptographically random (256 bits)
    - Tokens are hashed before storage (SHA-256)
    - Tokens expire after 30 minutes
    - Tokens are single-use
    - Generic responses prevent email enumeration
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def request_password_reset(
        self,
        email: str,
        frontend_url: str,
    ) -> bool:
        """
        Request a password reset for an email address.

        Always returns True regardless of whether the email exists,
        to prevent email enumeration attacks.

        Args:
            email: Email address to reset password for
            frontend_url: Base URL for the frontend (for constructing reset link)

        Returns:
            True (always, for security)
        """
        # Look up user by email
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        user = result.scalar_one_or_none()

        if not user:
            # Log but don't reveal that email doesn't exist
            logger.info(f"Password reset requested for non-existent email: {email}")
            return True

        if not user.is_active:
            logger.info(f"Password reset requested for inactive user: {email}")
            return True

        # Invalidate any existing unused tokens for this user
        await self._invalidate_existing_tokens(user.id)

        # Generate a new token
        token = secrets.token_urlsafe(TOKEN_BYTES)
        token_hash = _hash_token(token)
        expires_at = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRY_MINUTES)

        # Store the token
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(reset_token)
        await self.db.commit()

        # Build reset URL
        reset_url = f"{frontend_url}/reset-password?token={token}"

        # Send email
        user_name = user.first_name if user.first_name else None
        email_sent = await email_service.send_password_reset_email(
            to_email=user.email,
            reset_url=reset_url,
            user_name=user_name,
        )

        if email_sent:
            logger.info(f"Password reset email sent to {email}")
        else:
            logger.error(f"Failed to send password reset email to {email}")

        return True

    async def reset_password(
        self,
        token: str,
        new_password: str,
    ) -> bool:
        """
        Reset a user's password using a reset token.

        Args:
            token: The reset token from the email
            new_password: The new password to set

        Returns:
            True if password was reset successfully, False otherwise
        """
        # Hash the token to look it up
        token_hash = _hash_token(token)

        # Find the token record
        result = await self.db.execute(
            select(PasswordResetToken)
            .where(
                and_(
                    PasswordResetToken.token_hash == token_hash,
                    PasswordResetToken.used_at.is_(None),
                    PasswordResetToken.expires_at > datetime.utcnow(),
                )
            )
        )
        reset_token = result.scalar_one_or_none()

        if not reset_token:
            logger.warning("Invalid or expired password reset token used")
            return False

        # Get the user
        result = await self.db.execute(
            select(User).where(User.id == reset_token.user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.error(f"User not found for reset token: {reset_token.id}")
            return False

        if not user.is_active:
            logger.warning(f"Password reset attempted for inactive user: {user.id}")
            return False

        # Update the password
        user.password_hash = hash_password(new_password)
        user.updated_at = datetime.utcnow()

        # Mark the token as used
        reset_token.used_at = datetime.utcnow()

        await self.db.commit()

        logger.info(f"Password reset successful for user: {user.email}")
        return True

    async def validate_token(self, token: str) -> bool:
        """
        Check if a reset token is valid (for frontend validation).

        Args:
            token: The reset token to validate

        Returns:
            True if token is valid and unused, False otherwise
        """
        token_hash = _hash_token(token)

        result = await self.db.execute(
            select(PasswordResetToken)
            .where(
                and_(
                    PasswordResetToken.token_hash == token_hash,
                    PasswordResetToken.used_at.is_(None),
                    PasswordResetToken.expires_at > datetime.utcnow(),
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def _invalidate_existing_tokens(self, user_id: UUID) -> None:
        """
        Invalidate all unused tokens for a user.

        Called when a new reset is requested to ensure only
        the latest token is valid.

        Args:
            user_id: User ID to invalidate tokens for
        """
        result = await self.db.execute(
            select(PasswordResetToken)
            .where(
                and_(
                    PasswordResetToken.user_id == user_id,
                    PasswordResetToken.used_at.is_(None),
                )
            )
        )
        tokens = result.scalars().all()

        for token in tokens:
            token.used_at = datetime.utcnow()  # Mark as used/invalidated

        if tokens:
            await self.db.commit()
            logger.info(f"Invalidated {len(tokens)} existing reset tokens for user {user_id}")
