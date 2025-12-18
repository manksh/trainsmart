import uuid
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class MembershipRole(str, Enum):
    ADMIN = "admin"
    ATHLETE = "athlete"


class MembershipStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"


class Membership(Base):
    __tablename__ = "memberships"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Role within the organization (admin or athlete)
    role: Mapped[MembershipRole] = mapped_column(
        SQLEnum(MembershipRole), nullable=False, default=MembershipRole.ATHLETE
    )

    # Status
    status: Mapped[MembershipStatus] = mapped_column(
        SQLEnum(MembershipStatus), nullable=False, default=MembershipStatus.PENDING
    )

    # Timestamps
    invited_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="memberships", lazy="selectin")
    organization = relationship("Organization", back_populates="memberships", lazy="selectin")

    @property
    def organization_name(self) -> Optional[str]:
        """Get organization name from relationship for Pydantic serialization."""
        return self.organization.name if self.organization else None

    def __repr__(self) -> str:
        return f"<Membership {self.user_id} in {self.organization_id} as {self.role}>"
