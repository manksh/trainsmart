import uuid
from typing import Optional, List, Dict
from datetime import datetime
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sport: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Settings stored as JSON string
    settings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Created by SuperAdmin
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    memberships = relationship("Membership", back_populates="organization", lazy="selectin")
    invites = relationship("Invite", back_populates="organization", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")

    def __repr__(self) -> str:
        return f"<Organization {self.name}>"
