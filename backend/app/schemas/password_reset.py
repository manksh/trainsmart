"""
Password reset schemas.

These schemas handle the forgot password and reset password flows.
"""

import re
from pydantic import BaseModel, EmailStr, field_validator

from app.schemas.user import PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_SPECIAL_CHARS


class ForgotPasswordRequest(BaseModel):
    """Request to initiate password reset."""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Response after requesting password reset.

    Note: Always returns the same message regardless of whether
    the email exists, to prevent email enumeration attacks.
    """
    message: str = "If an account exists with this email, a password reset link has been sent."


class ResetPasswordRequest(BaseModel):
    """Request to set a new password using a reset token."""
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        Validate password meets security requirements:
        - Minimum 8 characters
        - Maximum 12 characters
        - At least one letter (uppercase or lowercase)
        - At least one number
        - At least one special character
        """
        errors = []

        # Check minimum length
        if len(v) < PASSWORD_MIN_LENGTH:
            errors.append(f"Password must be at least {PASSWORD_MIN_LENGTH} characters")

        # Check maximum length
        if len(v) > PASSWORD_MAX_LENGTH:
            errors.append(f"Password must be at most {PASSWORD_MAX_LENGTH} characters")

        # Check for at least one letter
        if not re.search(r"[a-zA-Z]", v):
            errors.append("Password must contain at least one letter")

        # Check for at least one number
        if not re.search(r"\d", v):
            errors.append("Password must contain at least one number")

        # Check for at least one special character
        if not re.search(rf"[{re.escape(PASSWORD_SPECIAL_CHARS)}]", v):
            errors.append(
                f"Password must contain at least one special character ({PASSWORD_SPECIAL_CHARS})"
            )

        if errors:
            raise ValueError("; ".join(errors))

        return v


class ResetPasswordResponse(BaseModel):
    """Response after successfully resetting password."""
    message: str = "Your password has been reset successfully. You can now log in with your new password."
