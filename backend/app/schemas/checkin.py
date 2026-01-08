from datetime import datetime, date
from typing import List, Optional, Dict, Any, Union
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


# === Mood Check-In Schemas ===

class MoodCheckInCreate(BaseModel):
    """Create a new mood check-in."""
    organization_id: UUID
    emotion: str
    intensity: int = Field(..., ge=1, le=5)
    body_areas: List[str]
    signals_resonated: Optional[List[str]] = []
    selected_action: Optional[str] = None
    notes: Optional[str] = None


# Keep for backwards compatibility
class CheckInCreate(BaseModel):
    """Create a new check-in (legacy - use MoodCheckInCreate or BreathingCheckInCreate)."""
    organization_id: UUID
    check_in_type: str = "mood"
    emotion: str
    intensity: int = Field(..., ge=1, le=5)
    body_areas: List[str]
    signals_resonated: Optional[List[str]] = []
    selected_action: Optional[str] = None
    notes: Optional[str] = None


# === Breathing Check-In Schemas ===

class BreathingTimingConfig(BaseModel):
    """Timing configuration for a breathing exercise."""
    inhale: float
    hold_in: float
    exhale: float
    hold_out: float
    second_inhale: Optional[float] = None  # For psychological sigh


class BreathingExerciseConfig(BaseModel):
    """Configuration for a single breathing exercise."""
    key: str
    display_name: str
    technique: str
    description: str
    triggers: List[str]
    timing: BreathingTimingConfig
    cycles: int
    instructions: List[str]
    category: str  # activation, calming, focus


class BreathingConfigOut(BaseModel):
    """All breathing exercises configuration for frontend."""
    exercises: List[BreathingExerciseConfig]


class BreathingCheckInCreate(BaseModel):
    """Create a new breathing check-in."""
    organization_id: UUID
    breathing_exercise_type: str
    cycles_completed: int = Field(..., ge=1)
    duration_seconds: Optional[int] = Field(None, ge=0)
    trigger_selected: Optional[str] = None
    effectiveness_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class BreathingCheckInOut(BaseModel):
    """Breathing check-in response."""
    id: UUID
    user_id: UUID
    organization_id: UUID
    check_in_type: str
    breathing_exercise_type: str
    cycles_completed: int
    duration_seconds: Optional[int] = None
    trigger_selected: Optional[str] = None
    effectiveness_rating: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# === Confidence Check-In Schemas ===

class ConfidenceSourceItem(BaseModel):
    """Single confidence/doubt source item."""
    key: str
    label: str
    description: str


class ConfidenceLevelActions(BaseModel):
    """Actions for a confidence level range."""
    label: str
    message: str
    actions: List[str]


class ConfidenceConfigOut(BaseModel):
    """Confidence check-in configuration for frontend."""
    confidence_sources: List[ConfidenceSourceItem]
    doubt_sources: List[ConfidenceSourceItem]
    level_actions: Dict[str, ConfidenceLevelActions]


class ConfidenceCheckInCreate(BaseModel):
    """Create a new confidence check-in."""
    organization_id: UUID
    confidence_level: int = Field(..., ge=1, le=7)
    confidence_sources: List[str] = []  # List of source keys
    doubt_sources: List[str] = []  # List of doubt keys
    confidence_commitment: Optional[str] = None
    selected_action: Optional[str] = None
    notes: Optional[str] = None


class ConfidenceCheckInOut(BaseModel):
    """Confidence check-in response."""
    id: UUID
    user_id: UUID
    organization_id: UUID
    check_in_type: str
    confidence_level: int
    confidence_sources: List[str] = []
    doubt_sources: List[str] = []
    confidence_commitment: Optional[str] = None
    selected_action: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# === Energy Check-In Schemas ===

class EnergyFactorItem(BaseModel):
    """Single energy factor item."""
    key: str
    label: str
    icon: str


class EnergyStateActions(BaseModel):
    """Actions for an energy state."""
    label: str
    message: str
    actions: List[str]


class EnergyConfigOut(BaseModel):
    """Energy check-in configuration for frontend."""
    physical_factors: List[EnergyFactorItem]
    mental_factors: List[EnergyFactorItem]
    state_actions: Dict[str, EnergyStateActions]


class EnergyCheckInCreate(BaseModel):
    """Create a new energy check-in."""
    organization_id: UUID
    physical_energy: int = Field(..., ge=1, le=7)
    mental_energy: int = Field(..., ge=1, le=7)
    physical_factors: List[str] = []  # List of factor keys
    mental_factors: List[str] = []  # List of factor keys
    selected_action: Optional[str] = None
    notes: Optional[str] = None


class EnergyCheckInOut(BaseModel):
    """Energy check-in response."""
    id: UUID
    user_id: UUID
    organization_id: UUID
    check_in_type: str
    physical_energy: int
    mental_energy: int
    physical_factors: List[str] = []
    mental_factors: List[str] = []
    energy_state: Optional[str] = None
    selected_action: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# === Generic Check-In Schemas ===

class CheckInOut(BaseModel):
    """Check-in response (supports mood, breathing, confidence, and energy)."""
    id: UUID
    user_id: UUID
    organization_id: UUID
    check_in_type: str
    # Mood fields
    emotion: Optional[str] = None
    intensity: Optional[int] = None
    body_areas: Optional[List[str]] = None
    signals_resonated: Optional[List[str]] = None
    selected_action: Optional[str] = None
    action_completed: Optional[bool] = None
    # Breathing fields
    breathing_exercise_type: Optional[str] = None
    cycles_completed: Optional[int] = None
    duration_seconds: Optional[int] = None
    trigger_selected: Optional[str] = None
    effectiveness_rating: Optional[int] = None
    # Confidence fields
    confidence_level: Optional[int] = None
    confidence_sources: Optional[List[str]] = None
    doubt_sources: Optional[List[str]] = None
    confidence_commitment: Optional[str] = None
    # Energy fields
    physical_energy: Optional[int] = None
    mental_energy: Optional[int] = None
    physical_factors: Optional[List[str]] = None
    mental_factors: Optional[List[str]] = None
    energy_state: Optional[str] = None
    # Shared fields
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
