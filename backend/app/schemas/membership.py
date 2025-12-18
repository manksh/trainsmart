from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from app.models.membership import MembershipRole, MembershipStatus


class MembershipBase(BaseModel):
    role: MembershipRole
    status: MembershipStatus = MembershipStatus.PENDING


class MembershipCreate(MembershipBase):
    user_id: UUID
    organization_id: UUID


class MembershipResponse(MembershipBase):
    id: UUID
    user_id: UUID
    organization_id: UUID
    invited_at: datetime
    joined_at: Optional[datetime]
    created_at: datetime
    organization_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MembershipWithOrg(MembershipResponse):
    organization_name: Optional[str] = None


class MembershipWithUser(MembershipResponse):
    user_email: Optional[str] = None
    user_first_name: Optional[str] = None
    user_last_name: Optional[str] = None
