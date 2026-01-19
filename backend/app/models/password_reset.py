import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class PasswordResetToken(Base):
    """
    Stores password reset tokens for users.

    Security considerations:
    - Tokens are hashed before storage (never store plaintext)
    - Tokens expire after 30 minutes
    - Tokens can only be used once (used_at is set on consumption)
    """
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", lazy="selectin")

    def is_valid(self) -> bool:
        """Check if the token is still valid (not expired and not used)."""
        return self.used_at is None and datetime.utcnow() < self.expires_at

    def __repr__(self) -> str:
        return f"<PasswordResetToken {self.id} for user {self.user_id}>"
