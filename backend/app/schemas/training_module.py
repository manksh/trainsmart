"""Training Module Pydantic schemas."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


# === Module List/Config Schemas ===

class ModuleListItem(BaseModel):
    """Summary info for module listing."""
    slug: str
    name: str
    description: str
    icon: str
    color: str
    estimated_minutes: int
    is_premium: bool
    requires_assessment: bool


class ModulesConfigOut(BaseModel):
    """Response schema for available modules."""
    modules: List[ModuleListItem]


# === Module Content Schemas ===

class CardContent(BaseModel):
    """A single card in a card deck."""
    id: str
    title: str
    content: str


class CardDeckSection(BaseModel):
    """Card deck section."""
    id: str
    type: str = "card_deck"
    title: str
    cards: List[CardContent]


class ChainTypeItem(BaseModel):
    """Item in the chain types grid."""
    id: str
    title: str
    subtitle: str
    color: str
    icon: str


class GridSelectionSection(BaseModel):
    """Grid selection section."""
    id: str
    type: str = "grid_selection"
    title: str
    description: str
    items: List[ChainTypeItem]


class ChainExample(BaseModel):
    """A chain reaction example."""
    id: str
    chain_type: str
    title: str
    event: str
    thought: str
    emotion: str
    action: str
    outcome: str
    is_helpful: bool


class ExamplesSection(BaseModel):
    """Examples section."""
    id: str
    type: str = "example_screens"
    title: str
    examples: List[ChainExample]


class SelectionOption(BaseModel):
    """Option for personal selection."""
    id: str
    label: str
    description: str


class PersonalSelectionSection(BaseModel):
    """Personal selection section."""
    id: str
    type: str = "personal_selection"
    title: str
    question: str
    description: str
    options: List[SelectionOption]


class ActivityItem(BaseModel):
    """An activity in the sequence."""
    id: str
    name: str
    description: str
    type: str
    estimated_minutes: int
    icon: str
    # Additional fields depending on activity type
    prompt: Optional[str] = None
    placeholder: Optional[str] = None
    prompts: Optional[Dict[str, str]] = None
    instruction: Optional[str] = None
    steps: Optional[List[str]] = None
    challenge: Optional[str] = None


class ActivitiesSection(BaseModel):
    """Activities section."""
    id: str
    type: str = "activity_sequence"
    title: str
    description: str
    activities: List[ActivityItem]


class ModuleContentOut(BaseModel):
    """Full module content for viewing."""
    id: UUID
    slug: str
    name: str
    description: str
    icon: str
    color: str
    estimated_minutes: int
    content: Dict[str, Any]  # Full JSONB content
    is_premium: bool
    requires_assessment: bool

    class Config:
        from_attributes = True


# === Progress Schemas ===

class ModuleProgressCreate(BaseModel):
    """Schema for starting a module (creating progress record)."""
    organization_id: UUID
    module_slug: str


class ModuleProgressUpdate(BaseModel):
    """Schema for updating progress."""
    # Progress tracking (sections-based flow)
    cards_viewed: Optional[List[str]] = None
    sections_completed: Optional[List[str]] = None
    examples_viewed: Optional[List[str]] = None

    # Location tracking (sections-based flow)
    current_section: Optional[str] = None
    current_step: Optional[int] = None

    # Activity responses (partial update) - for Being Human style activities
    activity_response: Optional[Dict[str, Any]] = Field(
        None,
        description="Single activity response to add: {activity_id: response_data}"
    )

    # Personal selections (partial update)
    personal_selection: Optional[Dict[str, str]] = Field(
        None,
        description="Personal selection to add: {question_id: selected_option_id}"
    )

    # Time tracking
    time_spent_seconds: Optional[int] = Field(
        None, ge=0,
        description="Additional time to add to total"
    )

    # Full progress_data update (for sequential activities flow - About Performance)
    progress_data: Optional[Dict[str, Any]] = Field(
        None,
        description="Full progress_data object for sequential activities flow"
    )


class ModuleProgressOut(BaseModel):
    """Schema for progress response."""
    id: UUID
    user_id: UUID
    organization_id: UUID
    module_id: UUID
    module_slug: str

    progress_data: Dict[str, Any]
    current_section: Optional[str] = None
    current_step: Optional[int] = None

    is_started: bool
    is_completed: bool
    completed_at: Optional[datetime] = None

    activity_responses: Dict[str, Any]
    personal_selections: Dict[str, str]

    total_time_seconds: int
    progress_percentage: int = 0  # 0-100, calculated from progress_data

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# === Status Schemas ===

class ModuleStatusItem(BaseModel):
    """Status of a single module for a user."""
    module_slug: str
    module_name: str
    is_started: bool
    is_completed: bool
    progress_percentage: int  # 0-100
    completed_at: Optional[datetime] = None


class AllModulesStatusOut(BaseModel):
    """Status of all modules for current user."""
    modules: List[ModuleStatusItem]
    total_modules: int
    completed_count: int
    in_progress_count: int
