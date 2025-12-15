import uuid
from enum import Enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class CheckInType(str, Enum):
    """Types of check-ins available."""
    MOOD = "mood"
    # Future types can be added here
    # CONFIDENCE = "confidence"
    # ENERGY = "energy"


class Emotion(str, Enum):
    """Available emotions for mood check-ins."""
    HAPPY = "happy"
    EXCITED = "excited"
    CALM = "calm"
    CONFIDENT = "confident"
    GRATEFUL = "grateful"
    NERVOUS = "nervous"
    STRESSED = "stressed"
    ANGRY = "angry"
    SAD = "sad"
    TIRED = "tired"
    BORED = "bored"
    INDIFFERENT = "indifferent"
    FEARFUL = "fearful"
    DISGUSTED = "disgusted"


# Emotion configuration with signals and suggested actions
# Based on Training Modules Outline document
EMOTION_CONFIG = {
    Emotion.HAPPY: {
        "display_name": "Happy",
        "category": "positive",
        "signals": [
            "Smiling or laughing easily",
            "Feeling light and energetic",
            "Wanting to connect with others",
            "Seeing the positive in situations",
        ],
        "actions": [
            "Share your happiness with a teammate",
            "Write down what made you happy",
            "Use this energy in your next training session",
            "Practice gratitude for this moment",
        ],
    },
    Emotion.EXCITED: {
        "display_name": "Excited",
        "category": "positive",
        "signals": [
            "Heart beating faster",
            "Feeling energized and ready",
            "Difficulty sitting still",
            "Thinking about what's coming next",
        ],
        "actions": [
            "Channel this energy into focused preparation",
            "Take 3 deep breaths to center yourself",
            "Visualize success in your upcoming activity",
            "Share your excitement with someone supportive",
        ],
    },
    Emotion.CALM: {
        "display_name": "Calm",
        "category": "positive",
        "signals": [
            "Relaxed muscles",
            "Steady breathing",
            "Clear thinking",
            "Feeling present in the moment",
        ],
        "actions": [
            "Notice and appreciate this feeling",
            "Use this state for focused practice",
            "Practice a skill that requires precision",
            "Help a teammate who might be stressed",
        ],
    },
    Emotion.CONFIDENT: {
        "display_name": "Confident",
        "category": "positive",
        "signals": [
            "Standing tall",
            "Making eye contact easily",
            "Trusting your abilities",
            "Ready to take on challenges",
        ],
        "actions": [
            "Set a challenging goal for today",
            "Help or mentor a teammate",
            "Try something new in practice",
            "Remember what built this confidence",
        ],
    },
    Emotion.GRATEFUL: {
        "display_name": "Grateful",
        "category": "positive",
        "signals": [
            "Appreciating what you have",
            "Feeling connected to others",
            "Noticing small positive things",
            "Wanting to give back",
        ],
        "actions": [
            "Thank someone who has helped you",
            "Write down 3 things you're grateful for",
            "Pay it forward with a kind action",
            "Reflect on your journey so far",
        ],
    },
    Emotion.NERVOUS: {
        "display_name": "Nervous",
        "category": "challenging",
        "signals": [
            "Butterflies in your stomach",
            "Racing thoughts",
            "Sweaty palms",
            "Feeling restless",
        ],
        "actions": [
            "Take 5 slow, deep breaths",
            "Focus on what you can control",
            "Remember times you've succeeded before",
            "Talk to a coach or trusted teammate",
        ],
    },
    Emotion.STRESSED: {
        "display_name": "Stressed",
        "category": "challenging",
        "signals": [
            "Tight shoulders or neck",
            "Feeling overwhelmed",
            "Difficulty focusing",
            "Irritability",
        ],
        "actions": [
            "Take a 5-minute break",
            "Do a quick body scan and release tension",
            "Write down what's causing stress",
            "Break tasks into smaller steps",
        ],
    },
    Emotion.ANGRY: {
        "display_name": "Angry",
        "category": "challenging",
        "signals": [
            "Clenched jaw or fists",
            "Feeling hot",
            "Quick to react",
            "Wanting to lash out",
        ],
        "actions": [
            "Step away and count to 10",
            "Do physical activity to release energy",
            "Write down what triggered you",
            "Talk to someone you trust",
        ],
    },
    Emotion.SAD: {
        "display_name": "Sad",
        "category": "challenging",
        "signals": [
            "Low energy",
            "Wanting to be alone",
            "Difficulty finding motivation",
            "Feeling heavy",
        ],
        "actions": [
            "Allow yourself to feel this emotion",
            "Reach out to someone you trust",
            "Do something small that brings comfort",
            "Remember this feeling will pass",
        ],
    },
    Emotion.TIRED: {
        "display_name": "Tired",
        "category": "challenging",
        "signals": [
            "Heavy eyelids",
            "Difficulty concentrating",
            "Slower reactions",
            "Low motivation",
        ],
        "actions": [
            "Take a short rest if possible",
            "Do some light stretching",
            "Have a healthy snack and water",
            "Adjust your training intensity today",
        ],
    },
    Emotion.BORED: {
        "display_name": "Bored",
        "category": "neutral",
        "signals": [
            "Restlessness",
            "Lack of interest",
            "Mind wandering",
            "Feeling unchallenged",
        ],
        "actions": [
            "Set a new mini-challenge for yourself",
            "Try a different approach to your routine",
            "Help coach or support a teammate",
            "Reflect on your bigger goals",
        ],
    },
    Emotion.INDIFFERENT: {
        "display_name": "Indifferent",
        "category": "neutral",
        "signals": [
            "Lack of strong feelings",
            "Going through the motions",
            "Disconnected",
            "Neither happy nor sad",
        ],
        "actions": [
            "Check in with yourself - what do you need?",
            "Reconnect with why you started",
            "Do something that usually brings joy",
            "Talk to someone about how you're feeling",
        ],
    },
    Emotion.FEARFUL: {
        "display_name": "Fearful",
        "category": "challenging",
        "signals": [
            "Heart racing",
            "Wanting to avoid something",
            "Imagining worst-case scenarios",
            "Feeling frozen",
        ],
        "actions": [
            "Name your fear out loud or in writing",
            "Ask: What's the worst that could happen?",
            "Focus on the present moment",
            "Take small steps toward what scares you",
        ],
    },
    Emotion.DISGUSTED: {
        "display_name": "Disgusted",
        "category": "challenging",
        "signals": [
            "Strong aversion",
            "Wanting to distance yourself",
            "Feeling repelled",
            "Physical discomfort",
        ],
        "actions": [
            "Identify what's causing this feeling",
            "Set a boundary if needed",
            "Redirect your focus",
            "Talk to someone about the situation",
        ],
    },
}


# Body areas for body check
BODY_AREAS = [
    "head",
    "chest",
    "stomach",
    "shoulders",
    "arms",
    "legs",
    "all_over",
    "not_sure",
]


class CheckIn(Base):
    """User check-in record."""
    __tablename__ = "check_ins"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # User who did the check-in
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Organization context (for data isolation)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Type of check-in
    check_in_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default=CheckInType.MOOD.value
    )

    # Selected emotion
    emotion: Mapped[str] = mapped_column(String(50), nullable=False)

    # Intensity rating (1-5)
    intensity: Mapped[int] = mapped_column(Integer, nullable=False)

    # Body areas where emotion is felt (array of strings)
    body_areas: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Which signal resonated most (optional)
    signal_resonated: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Action they committed to
    selected_action: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Whether they completed the action (for follow-up)
    action_completed: Mapped[Optional[bool]] = mapped_column(default=None, nullable=True)

    # Optional notes/reflection
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="check_ins", lazy="selectin")

    def __repr__(self) -> str:
        return f"<CheckIn {self.user_id} - {self.emotion} ({self.created_at})>"
