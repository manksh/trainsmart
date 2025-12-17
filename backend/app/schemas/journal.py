"""Journal Pydantic schemas."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


# === Config Schemas ===

class JournalTypeInfo(BaseModel):
    """Information about a journal type."""
    key: str
    label: str
    description: str
    icon: str


class AffirmationFocusInfo(BaseModel):
    """Information about an affirmation focus area."""
    key: str
    label: str
    affirmations: List[str]


class JournalConfigOut(BaseModel):
    """Response schema for journal configuration."""
    journal_types: List[JournalTypeInfo]
    affirmations: Dict[str, AffirmationFocusInfo]
    affirmation_timing_options: List[str]
    daily_win_factors: List[str]
    emotion_options: Dict[str, List[Dict[str, str]]]
    open_ended_tags: List[str]
    open_ended_prompts: List[str]


# === Journal Entry Schemas ===

class JournalEntryBase(BaseModel):
    """Base schema for journal entries."""
    journal_type: str

    # Affirmations fields
    affirmation_focus_area: Optional[str] = None
    affirmation_text: Optional[str] = Field(None, max_length=500)
    affirmation_is_custom: Optional[bool] = False
    affirmation_when_helpful: Optional[List[str]] = None

    # Daily wins fields
    win_description: Optional[str] = Field(None, max_length=500)
    win_factors: Optional[List[str]] = None
    win_feeling: Optional[str] = None

    # Gratitude fields
    gratitude_item: Optional[str] = Field(None, max_length=500)
    gratitude_why_meaningful: Optional[str] = Field(None, max_length=500)
    gratitude_feeling: Optional[str] = None

    # Open-ended fields
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    prompt_used: Optional[str] = Field(None, max_length=500)


class JournalEntryCreate(JournalEntryBase):
    """Schema for creating a journal entry."""
    organization_id: UUID


class JournalEntryUpdate(BaseModel):
    """Schema for updating a journal entry."""
    # Affirmations fields
    affirmation_focus_area: Optional[str] = None
    affirmation_text: Optional[str] = Field(None, max_length=500)
    affirmation_is_custom: Optional[bool] = None
    affirmation_when_helpful: Optional[List[str]] = None

    # Daily wins fields
    win_description: Optional[str] = Field(None, max_length=500)
    win_factors: Optional[List[str]] = None
    win_feeling: Optional[str] = None

    # Gratitude fields
    gratitude_item: Optional[str] = Field(None, max_length=500)
    gratitude_why_meaningful: Optional[str] = Field(None, max_length=500)
    gratitude_feeling: Optional[str] = None

    # Open-ended fields
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    prompt_used: Optional[str] = Field(None, max_length=500)


class JournalEntryOut(BaseModel):
    """Schema for journal entry response."""
    id: UUID
    user_id: UUID
    organization_id: UUID
    journal_type: str

    # Affirmations fields
    affirmation_focus_area: Optional[str] = None
    affirmation_text: Optional[str] = None
    affirmation_is_custom: Optional[bool] = None
    affirmation_when_helpful: Optional[List[str]] = None

    # Daily wins fields
    win_description: Optional[str] = None
    win_factors: Optional[List[str]] = None
    win_feeling: Optional[str] = None

    # Gratitude fields
    gratitude_item: Optional[str] = None
    gratitude_why_meaningful: Optional[str] = None
    gratitude_feeling: Optional[str] = None

    # Open-ended fields
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    prompt_used: Optional[str] = None

    # Shared fields
    word_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JournalEntryListOut(BaseModel):
    """Schema for paginated journal entry list."""
    entries: List[JournalEntryOut]
    total: int
    limit: int
    offset: int


# === Calendar Schema ===

class CalendarDateEntry(BaseModel):
    """Entry data for a calendar date."""
    date: str
    entry_count: int
    types: List[str]
    entries: List[JournalEntryOut]


class JournalCalendarOut(BaseModel):
    """Schema for journal calendar response."""
    year: int
    month: int
    dates_with_entries: List[CalendarDateEntry]
    total_entries: int
