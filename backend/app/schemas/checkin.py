from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID


class EmotionSignal(BaseModel):
    """Signal for an emotion."""
    text: str


class EmotionAction(BaseModel):
    """Suggested action for an emotion."""
    text: str


class EmotionConfig(BaseModel):
    """Configuration for a single emotion."""
    key: str
    display_name: str
    category: str  # positive, challenging, neutral
    signals: List[str]
    actions: List[str]


class EmotionsConfigOut(BaseModel):
    """All emotions configuration for frontend."""
    emotions: List[EmotionConfig]
    body_areas: List[dict]


class CheckInCreate(BaseModel):
    """Create a new check-in."""
    organization_id: UUID
    check_in_type: str = "mood"
    emotion: str
    intensity: int = Field(..., ge=1, le=5)
    body_areas: List[str]
    signal_resonated: Optional[str] = None
    selected_action: Optional[str] = None
    notes: Optional[str] = None


class CheckInOut(BaseModel):
    """Check-in response."""
    id: UUID
    user_id: UUID
    organization_id: UUID
    check_in_type: str
    emotion: str
    intensity: int
    body_areas: List[str]
    signal_resonated: Optional[str] = None
    selected_action: Optional[str] = None
    action_completed: Optional[bool] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CheckInSummary(BaseModel):
    """Summary of a check-in for history views."""
    id: UUID
    emotion: str
    intensity: int
    created_at: datetime

    class Config:
        from_attributes = True


class TodayCheckInStatus(BaseModel):
    """Status of today's check-in."""
    has_checked_in_today: bool
    check_in: Optional[CheckInOut] = None


class CheckInHistory(BaseModel):
    """Paginated check-in history."""
    check_ins: List[CheckInOut]
    total: int
    page: int
    page_size: int


class ActionCompletionUpdate(BaseModel):
    """Update action completion status."""
    action_completed: bool
