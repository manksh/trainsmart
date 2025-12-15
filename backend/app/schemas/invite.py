from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from uuid import UUID
from app.models.membership import MembershipRole


class InviteBase(BaseModel):
    email: EmailStr
    role: MembershipRole = MembershipRole.ATHLETE


class InviteCreate(InviteBase):
    organization_id: UUID


class InviteResponse(InviteBase):
    id: UUID
    code: str
    organization_id: UUID
    created_by: UUID
    expires_at: datetime
    used_at: Optional[datetime]
    created_at: datetime
    is_valid: bool

    model_config = ConfigDict(from_attributes=True)


class InviteWithOrg(InviteResponse):
    organization_name: Optional[str] = None


class InviteValidation(BaseModel):
    """Response when validating an invite code"""
    is_valid: bool
    email: Optional[str] = None
    organization_name: Optional[str] = None
    role: Optional[MembershipRole] = None
    message: Optional[str] = None
