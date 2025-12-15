import uuid
from typing import Optional, List, Dict
import secrets
from datetime import datetime, timedelta
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.models.membership import MembershipRole


def generate_invite_code() -> str:
    """Generate a unique invite code."""
    return secrets.token_urlsafe(16)


def default_expiry() -> datetime:
    """Default invite expiry is 7 days from now."""
    return datetime.utcnow() + timedelta(days=7)


class Invite(Base):
    __tablename__ = "invites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Unique invite code for redemption
    code: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False, default=generate_invite_code
    )

    # Email of the person being invited
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Organization the invite is for
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Role the invitee will have (admin or athlete)
    role: Mapped[MembershipRole] = mapped_column(
        SQLEnum(MembershipRole), nullable=False, default=MembershipRole.ATHLETE
    )

    # Who created the invite
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Expiry
    expires_at: Mapped[datetime] = mapped_column(DateTime, default=default_expiry)

    # Usage tracking
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    used_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="invites", lazy="selectin")
    created_by_user = relationship(
        "User", foreign_keys=[created_by], back_populates="invites_sent", lazy="selectin"
    )

    @property
    def is_valid(self) -> bool:
        """Check if invite is still valid (not used and not expired)."""
        return self.used_at is None and datetime.utcnow() < self.expires_at

    def __repr__(self) -> str:
        return f"<Invite {self.code} for {self.email}>"
