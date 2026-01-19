import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Role flags
    is_superadmin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Avatar configuration (JSON string for now)
    avatar_config: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    memberships = relationship("Membership", back_populates="user", lazy="selectin")
    assessment_responses = relationship("AssessmentResponse", back_populates="user", lazy="selectin")
    invites_sent = relationship("Invite", back_populates="created_by_user", foreign_keys="[Invite.created_by]", lazy="selectin")
    check_ins = relationship("CheckIn", back_populates="user", lazy="selectin")
    journal_entries = relationship("JournalEntry", back_populates="user", lazy="selectin")
    module_progress = relationship("ModuleProgress", back_populates="user", lazy="selectin")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<User {self.email}>"
