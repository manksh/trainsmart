from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID


class OrganizationBase(BaseModel):
    name: str
    sport: Optional[str] = None
    description: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    sport: Optional[str] = None
    description: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationWithStats(OrganizationResponse):
    admin_count: int = 0
    athlete_count: int = 0
