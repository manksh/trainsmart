import uuid
from typing import Optional, List, Dict
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class Assessment(Base):
    """Assessment template - contains questions and pillar mappings."""
    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sport: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)

    # Questions stored as JSONB array
    # Each question: {id, text, pillar, secondary_pillar?, is_reverse, category}
    questions: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)

    # Pillar mappings and scoring rules
    pillar_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Active status
    is_active: Mapped[bool] = mapped_column(default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    responses = relationship("AssessmentResponse", back_populates="assessment", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Assessment {self.name} v{self.version}>"


class AssessmentResponse(Base):
    """User's response to an assessment."""
    __tablename__ = "assessment_responses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # User who took the assessment
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Which assessment
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False
    )

    # Organization context (for data isolation)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Raw answers: {question_id: answer_value (1-7)}
    answers: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Calculated pillar scores: {pillar_name: score}
    pillar_scores: Mapped[dict] = mapped_column(JSONB, nullable=True)

    # Meta scores: {thinking: score, feeling: score, action: score}
    meta_scores: Mapped[dict] = mapped_column(JSONB, nullable=True)

    # Identified strengths and growth areas
    strengths: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    growth_areas: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)

    # Completion status
    is_complete: Mapped[bool] = mapped_column(default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="assessment_responses", lazy="selectin")
    assessment = relationship("Assessment", back_populates="responses", lazy="selectin")

    def __repr__(self) -> str:
        return f"<AssessmentResponse {self.user_id} - {self.assessment_id}>"
