from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from uuid import UUID


# Question schema
class QuestionSchema(BaseModel):
    id: int
    text: str
    pillar: str
    secondary_pillar: Optional[str] = None
    is_reverse: bool = False
    category: str  # thinking, feeling, action


# Assessment schemas
class AssessmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    sport: Optional[str] = None


class AssessmentCreate(AssessmentBase):
    questions: List[dict]
    pillar_config: dict


class AssessmentOut(AssessmentBase):
    id: UUID
    version: int
    questions: List[dict]
    pillar_config: dict
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AssessmentSummary(BaseModel):
    """Lightweight assessment info for listing."""
    id: UUID
    name: str
    description: Optional[str] = None
    sport: Optional[str] = None
    question_count: int
    is_active: bool

    class Config:
        from_attributes = True


# Assessment Response schemas
class AssessmentAnswerSubmit(BaseModel):
    """Single answer submission."""
    question_id: int
    value: int = Field(..., ge=1, le=7)


class AssessmentSubmission(BaseModel):
    """Submit completed assessment answers."""
    assessment_id: UUID
    organization_id: UUID
    answers: List[AssessmentAnswerSubmit]


class PillarScore(BaseModel):
    """Individual pillar score."""
    name: str
    score: float
    max_score: float = 7.0
    percentage: float
    question_count: int


class AssessmentResultOut(BaseModel):
    """Assessment results with scores."""
    id: UUID
    assessment_id: UUID
    user_id: UUID
    organization_id: UUID

    # Scores
    pillar_scores: Dict[str, float]
    meta_scores: Optional[Dict[str, float]] = None

    # Analysis
    strengths: List[str]
    growth_areas: List[str]

    # Status
    is_complete: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AssessmentStatusOut(BaseModel):
    """User's assessment completion status."""
    has_completed: bool
    response_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None


class DetailedPillarScore(BaseModel):
    """Detailed pillar breakdown for results visualization."""
    pillar: str
    display_name: str
    score: float
    max_score: float = 7.0
    percentage: float
    description: str
    category: str  # core or supporting
    meta_category: str  # thinking, feeling, action
