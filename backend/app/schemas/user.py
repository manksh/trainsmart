import re
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from uuid import UUID


# Password policy constants
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 12
# Extended special characters to match frontend validation
PASSWORD_SPECIAL_CHARS = r'!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?'


# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(UserBase):
    password: str

    @field_validator("password")
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


class UserCreateWithInvite(UserCreate):
    invite_code: str


# Response schemas
class UserResponse(UserBase):
    id: UUID
    is_superadmin: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserWithMemberships(UserResponse):
    memberships: List["MembershipResponse"] = []


# Auth schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: str  # user_id
    exp: datetime
    is_superadmin: bool = False
    organization_ids: List[str] = []


class AthleteWithAssessmentStatus(UserResponse):
    """Athlete info with assessment completion status for admin views."""
    joined_at: Optional[datetime] = None
    has_completed_assessment: bool = False
    assessment_completed_at: Optional[datetime] = None
    pillar_scores: Optional[dict] = None
    meta_scores: Optional[dict] = None  # {thinking, feeling, action}
    strengths: Optional[List[str]] = None
    growth_areas: Optional[List[str]] = None


# Import at the end to avoid circular imports
from app.schemas.membership import MembershipResponse  # noqa: E402

UserWithMemberships.model_rebuild()
