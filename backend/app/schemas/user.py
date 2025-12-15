from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from uuid import UUID


# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(UserBase):
    password: str


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
    strengths: Optional[List[str]] = None
    growth_areas: Optional[List[str]] = None


# Import at the end to avoid circular imports
from app.schemas.membership import MembershipResponse  # noqa: E402

UserWithMemberships.model_rebuild()
