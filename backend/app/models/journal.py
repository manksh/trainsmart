import uuid
from enum import Enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class JournalType(str, Enum):
    """Types of journal entries."""
    AFFIRMATIONS = "affirmations"
    DAILY_WINS = "daily_wins"
    GRATITUDE = "gratitude"
    OPEN_ENDED = "open_ended"


class AffirmationFocusArea(str, Enum):
    """Focus areas for affirmations."""
    CONFIDENCE = "confidence"
    FOCUS = "focus"
    EFFORT = "effort"
    STAYING_CALM = "staying_calm"
    RESILIENCE = "resilience"
    PATIENCE = "patience"
    TRUST = "trust"
    JOY = "joy"


# Predefined affirmations by focus area
AFFIRMATIONS_BY_FOCUS = {
    AffirmationFocusArea.CONFIDENCE: [
        "I trust my preparation",
        "I belong here",
        "I have done this before, I can do it again",
        "I am a good learner",
    ],
    AffirmationFocusArea.FOCUS: [
        "One thing at a time",
        "Stay present",
        "Right here. Right now.",
        "This moment is enough",
        "Reset. Refocus.",
        "Lock in.",
    ],
    AffirmationFocusArea.EFFORT: [
        "I control my effort",
        "I will give what I have today",
        "Showing up matters",
        "I can keep going",
        "I don't need to be perfect, I need to show up",
        "I choose effort over excuses",
        "I can do the work",
    ],
    AffirmationFocusArea.STAYING_CALM: [
        "Breathe.",
        "I can slow things down.",
        "One thing at a time.",
    ],
    AffirmationFocusArea.RESILIENCE: [
        "Mistakes don't define me",
        "I can recover and continue",
        "Failure isn't final",
        "Keep pushing, I can work through this",
    ],
    AffirmationFocusArea.PATIENCE: [
        "I don't need to rush",
        "Progress takes time",
        "I can stay ready",
        "Small steps count",
    ],
    AffirmationFocusArea.TRUST: [
        "I trust my preparation",
        "I trust the process",
        "I have done the work, now I get to show it",
        "I trust my body",
        "I know what I am capable of",
        "I can handle whatever happens",
        "I trust myself to adapt",
        "I can recover from mistakes",
    ],
    AffirmationFocusArea.JOY: [
        "I get to be here",
        "I love this sport",
        "I love learning",
        "Smile",
        "Joy and effort can exist together",
    ],
}

# When affirmations help most
AFFIRMATION_TIMING_OPTIONS = [
    "Before practice",
    "During practice",
    "Before competition",
    "During competition",
    "After mistakes",
    "When I feel nervous",
    "When I feel anxious",
    "When I am tired",
    "When I have negative self talk",
]

# What helped make a win happen
DAILY_WIN_FACTORS = [
    "Effort",
    "Preparation",
    "Support from others",
    "Focus",
    "Positive self-talk",
    "Rest and recovery",
    "Sticking with it",
]

# How emotions felt (for wins and gratitude)
EMOTION_OPTIONS = {
    "wins": [
        {"key": "proud", "label": "Proud", "emoji": "😊"},
        {"key": "calm", "label": "Calm", "emoji": "😌"},
        {"key": "confident", "label": "Confident", "emoji": "💪"},
        {"key": "relieved", "label": "Relieved", "emoji": "😮‍💨"},
        {"key": "motivated", "label": "Motivated", "emoji": "🔥"},
        {"key": "neutral", "label": "Neutral", "emoji": "😐"},
    ],
    "gratitude": [
        {"key": "calm", "label": "Calm", "emoji": "😌"},
        {"key": "grounded", "label": "Grounded", "emoji": "🌱"},
        {"key": "supported", "label": "Supported", "emoji": "🤝"},
        {"key": "joyful", "label": "Joyful", "emoji": "😊"},
        {"key": "relieved", "label": "Relieved", "emoji": "😮‍💨"},
        {"key": "motivated", "label": "Motivated", "emoji": "🔥"},
        {"key": "neutral", "label": "Neutral", "emoji": "😐"},
    ],
}

# Tags for open-ended journaling
OPEN_ENDED_TAGS = [
    "Life",
    "Sport",
    "School",
    "Emotions",
    "Planning",
    "Reflection",
]

# Optional prompts for open-ended journaling
OPEN_ENDED_PROMPTS = [
    "What's taking up space in my head?",
    "What do I want to remember from today?",
    "What feels unclear today?",
]


class JournalEntry(Base):
    """User journal entry."""
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # User who created the entry
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Organization context (for data isolation)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Type of journal entry
    journal_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )

    # === Affirmations Fields ===
    # Focus area (confidence, focus, effort, etc.)
    affirmation_focus_area: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Selected or custom affirmation text
    affirmation_text: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Is it a custom affirmation?
    affirmation_is_custom: Mapped[Optional[bool]] = mapped_column(default=False, nullable=True)
    # When does this affirmation help most? (JSONB array)
    affirmation_when_helpful: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    # === Daily Wins Fields ===
    # What was the win? (short description)
    win_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # What helped make it happen? (JSONB array of factors)
    win_factors: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    # How did it make you feel? (emotion key)
    win_feeling: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # === Gratitude Fields ===
    # What are you grateful for?
    gratitude_item: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # What made this meaningful?
    gratitude_why_meaningful: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # How did it make you feel? (emotion key)
    gratitude_feeling: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # === Open Ended Fields ===
    # Main content (for open-ended, can also store additional notes for guided)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Optional tags (JSONB array)
    tags: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True, default=list)
    # Prompt used (if any)
    prompt_used: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # === Shared Fields ===
    # Word count (for open-ended)
    word_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="journal_entries", lazy="selectin")

    def __repr__(self) -> str:
        return f"<JournalEntry {self.id} - {self.journal_type} ({self.created_at})>"
