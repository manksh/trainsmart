"""Training Module models - templates and user progress tracking."""
import uuid
from enum import Enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class ModuleStatus(str, Enum):
    """Status of a training module."""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class TrainingModule(Base):
    """Training module template - contains module definition and content."""
    __tablename__ = "training_modules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # URL-friendly identifier (e.g., "being-human")
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    # Display name (e.g., "Being Human")
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Short description for cards/lists
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Icon identifier for frontend (e.g., "brain", "heart")
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="book")

    # Color theme (tailwind color name, e.g., "emerald", "purple")
    color: Mapped[str] = mapped_column(String(50), nullable=False, default="emerald")

    # Estimated completion time in minutes
    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)

    # Full module content as JSONB
    # Structure: {
    #   "sections": [
    #     {"id": "intro_cards", "type": "card_deck", "cards": [...]},
    #     {"id": "examples", "type": "example_screens", "examples": [...]},
    #     {"id": "activities", "type": "activity_sequence", "activities": [...]}
    #   ]
    # }
    content: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Module status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ModuleStatus.DRAFT.value
    )

    # Display order (lower = first)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Premium flag (for future monetization)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)

    # Requires assessment completion before starting?
    requires_assessment: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    progress_records = relationship("ModuleProgress", back_populates="module", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TrainingModule {self.slug} - {self.name}>"


class ModuleProgress(Base):
    """User's progress through a training module."""
    __tablename__ = "module_progress"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # User tracking progress
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Organization context (for data isolation)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Which module
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("training_modules.id"), nullable=False, index=True
    )

    # Progress tracking as JSONB
    # Structure: {
    #   "cards_viewed": ["card_1", "card_2", ...],
    #   "sections_completed": ["intro_cards", "examples"],
    #   "examples_viewed": ["example_1", "example_2"]
    # }
    progress_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Current location in module
    current_section: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_step: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)

    # Status flags
    is_started: Mapped[bool] = mapped_column(Boolean, default=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Activity responses as JSONB
    # Structure: {
    #   "activity_1": {"response": "...", "completed_at": "..."},
    #   "activity_2": {"chain": {...}, "completed_at": "..."}
    # }
    activity_responses: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Personal selections (e.g., "Which chain type do you see most in yourself?")
    # Structure: {"chain_type": "hard_unhelpful", ...}
    personal_selections: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Time tracking
    total_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="module_progress", lazy="selectin")
    module = relationship("TrainingModule", back_populates="progress_records", lazy="selectin")

    def __repr__(self) -> str:
        return f"<ModuleProgress {self.user_id} - {self.module_id}>"


# === Being Human Module Content ===
# This will be seeded into the database

BEING_HUMAN_CONTENT = {
    "sections": [
        {
            "id": "intro_cards",
            "type": "card_deck",
            "title": "Understanding Your Reactions",
            "cards": [
                {
                    "id": "card_1",
                    "title": "Why Reactions Feel Automatic",
                    "content": "Have you ever reacted to something — maybe a bad call, a mistake, a comment from a coach — and later thought, 'Why did I do that?'\n\nYou're not alone. These reactions feel automatic because, in a way, they are. But they're not random. There's a process happening in your mind — one that you can learn to recognize and, eventually, guide."
                },
                {
                    "id": "card_2",
                    "title": "The Chain Reaction",
                    "content": "Every emotional or behavioral response you have follows a chain:\n\n**Event → Thought → Emotion → Action**\n\nSomething happens. You interpret it. That interpretation creates a feeling. And that feeling drives what you do next."
                },
                {
                    "id": "card_3",
                    "title": "Why This Matters",
                    "content": "The chain matters because **thoughts happen fast** — so fast that most people skip right over them. They think the event caused the emotion. But it didn't.\n\nYour **thought** about the event caused the emotion. And that thought is something you can learn to shape."
                },
                {
                    "id": "card_4",
                    "title": "The Chain in Action",
                    "content": "Let's say a coach pulls you aside during practice.\n\n**Event:** Coach calls you over\n**Thought:** \"I must have done something wrong\"\n**Emotion:** Anxiety, dread\n**Action:** You tense up, avoid eye contact\n\nBut if the same event triggers a different thought?"
                },
                {
                    "id": "card_5",
                    "title": "Same Event, Different Chain",
                    "content": "**Event:** Coach calls you over\n**Thought:** \"Maybe they saw something good\"\n**Emotion:** Curiosity, openness\n**Action:** You approach confidently, ready to listen\n\nSame event. Totally different experience."
                },
                {
                    "id": "card_6",
                    "title": "It's Not About Positivity",
                    "content": "This isn't about forcing yourself to think positively. It's about **awareness**.\n\nOnce you start noticing the thought that sits between the event and the emotion, you gain options. You can ask yourself: Is this thought accurate? Is it helpful?"
                },
                {
                    "id": "card_7",
                    "title": "Your Brain Protects You",
                    "content": "Your brain's first job is to keep you safe. So it often defaults to threat-detection mode — especially under pressure.\n\nThat's why stressful situations often trigger unhelpful thoughts first. Your brain is trying to protect you, even when protection isn't needed."
                },
                {
                    "id": "card_8",
                    "title": "Patterns Over Time",
                    "content": "Over time, certain thoughts become habits. Your brain creates shortcuts: \"When X happens, think Y.\"\n\nSome of these shortcuts serve you well. Others don't. The goal is to identify which patterns help and which ones hold you back."
                },
                {
                    "id": "card_9",
                    "title": "The Skill of Noticing",
                    "content": "Noticing your thoughts is a skill — and like any skill, it gets better with practice.\n\nYou won't catch every thought at first. That's okay. Even catching one or two during a practice or game is progress."
                },
                {
                    "id": "card_10",
                    "title": "What's Next",
                    "content": "In the next section, you'll explore different types of chain reactions — both helpful and unhelpful.\n\nYou'll start to see your own patterns more clearly. And from there, you'll learn how to work with them — not against them."
                }
            ]
        },
        {
            "id": "chain_types",
            "type": "grid_selection",
            "title": "Types of Chain Reactions",
            "description": "Chain reactions fall into four categories based on the event type and whether the chain is helpful or unhelpful.",
            "items": [
                {
                    "id": "hard_unhelpful",
                    "title": "Hard Event → Unhelpful Chain",
                    "subtitle": "When challenges spiral",
                    "color": "red",
                    "icon": "alert-triangle"
                },
                {
                    "id": "hard_helpful",
                    "title": "Hard Event → Helpful Chain",
                    "subtitle": "When challenges build resilience",
                    "color": "green",
                    "icon": "shield-check"
                },
                {
                    "id": "positive_unhelpful",
                    "title": "Positive Event → Unhelpful Chain",
                    "subtitle": "When good things go wrong",
                    "color": "orange",
                    "icon": "alert-circle"
                },
                {
                    "id": "positive_helpful",
                    "title": "Positive Event → Helpful Chain",
                    "subtitle": "When success fuels growth",
                    "color": "emerald",
                    "icon": "trending-up"
                }
            ]
        },
        {
            "id": "examples",
            "type": "example_screens",
            "title": "See It In Action",
            "examples": [
                {
                    "id": "example_hard_unhelpful",
                    "chain_type": "hard_unhelpful",
                    "title": "Missing the Game-Winner",
                    "event": "You miss a crucial shot at the end of the game",
                    "thought": "\"I always choke under pressure. Everyone's going to blame me.\"",
                    "emotion": "Shame, embarrassment, dread",
                    "action": "You avoid teammates, replay the miss over and over, struggle to sleep",
                    "outcome": "The negative spiral affects your confidence in the next game",
                    "is_helpful": False
                },
                {
                    "id": "example_hard_helpful",
                    "chain_type": "hard_helpful",
                    "title": "Missing the Game-Winner",
                    "event": "You miss a crucial shot at the end of the game",
                    "thought": "\"That hurts. But I was in the right position and took my shot. I can learn from this.\"",
                    "emotion": "Disappointment, but also resolve",
                    "action": "You acknowledge the miss, then focus on what you'll work on in practice",
                    "outcome": "You build resilience and prepare better for the next opportunity",
                    "is_helpful": True
                },
                {
                    "id": "example_positive_unhelpful",
                    "chain_type": "positive_unhelpful",
                    "title": "Scoring the Game-Winner",
                    "event": "You score the winning goal in a big game",
                    "thought": "\"I got lucky. I hope nobody realizes I was just in the right place.\"",
                    "emotion": "Anxiety, imposter feelings, unease",
                    "action": "You deflect compliments, downplay your role, worry about the next game",
                    "outcome": "You can't enjoy the success and enter the next game feeling pressure",
                    "is_helpful": False
                },
                {
                    "id": "example_positive_helpful",
                    "chain_type": "positive_helpful",
                    "title": "Scoring the Game-Winner",
                    "event": "You score the winning goal in a big game",
                    "thought": "\"I've worked hard for moments like this. I trusted my training and it paid off.\"",
                    "emotion": "Pride, confidence, gratitude",
                    "action": "You celebrate with teammates, thank those who helped, reflect on what worked",
                    "outcome": "You build confidence that carries into future performances",
                    "is_helpful": True
                }
            ]
        },
        {
            "id": "personal_bridge",
            "type": "personal_selection",
            "title": "Your Patterns",
            "question": "Which chain type do you see most in yourself?",
            "description": "There's no wrong answer — just an honest starting point.",
            "options": [
                {
                    "id": "hard_unhelpful",
                    "label": "Hard Event → Unhelpful Chain",
                    "description": "I tend to spiral after challenges"
                },
                {
                    "id": "hard_helpful",
                    "label": "Hard Event → Helpful Chain",
                    "description": "I usually bounce back from setbacks"
                },
                {
                    "id": "positive_unhelpful",
                    "label": "Positive Event → Unhelpful Chain",
                    "description": "I struggle to accept success"
                },
                {
                    "id": "positive_helpful",
                    "label": "Positive Event → Helpful Chain",
                    "description": "I build on my wins"
                }
            ]
        },
        {
            "id": "activities",
            "type": "activity_sequence",
            "title": "Practice Activities",
            "description": "Apply what you've learned with these guided exercises.",
            "activities": [
                {
                    "id": "activity_1",
                    "name": "Find Your Event",
                    "description": "Identify a recent situation that triggered a strong reaction",
                    "type": "single_input",
                    "estimated_minutes": 3,
                    "prompt": "Think of a recent moment when you had a strong emotional reaction — positive or negative. What was the event?",
                    "placeholder": "e.g., Coach gave feedback on my form during practice...",
                    "icon": "search"
                },
                {
                    "id": "activity_2",
                    "name": "Build Your Chain",
                    "description": "Map out the full chain reaction from your event",
                    "type": "chain_builder",
                    "estimated_minutes": 5,
                    "prompts": {
                        "event": "What happened? (Use the event from Activity 1 or pick a new one)",
                        "thought": "What thought came to mind first?",
                        "emotion": "What emotion(s) did you feel?",
                        "action": "What did you do next?"
                    },
                    "icon": "git-branch"
                },
                {
                    "id": "activity_3",
                    "name": "Try a Different Outcome",
                    "description": "Explore how a different thought changes the chain",
                    "type": "chain_modifier",
                    "estimated_minutes": 5,
                    "instruction": "Using the same event from before, imagine a different thought. How might that change the emotion and action?",
                    "prompts": {
                        "event": "What was the event? (Use the same event from your previous activity)",
                        "alternative_thought": "What's a different, more helpful thought you could have?",
                        "new_emotion": "How might you feel with this new thought?",
                        "new_action": "What might you do differently?"
                    },
                    "icon": "refresh-cw"
                },
                {
                    "id": "activity_4",
                    "name": "Practice with Good Moments",
                    "description": "Apply the chain to a positive event",
                    "type": "guided_reflection",
                    "estimated_minutes": 4,
                    "steps": [
                        "Think of a recent positive moment in your sport",
                        "What was your first thought?",
                        "Did that thought help you enjoy and build on the success?",
                        "If not, what thought would have been more helpful?"
                    ],
                    "icon": "sun"
                },
                {
                    "id": "activity_5",
                    "name": "Chain Challenge",
                    "description": "Notice one chain reaction in your next practice",
                    "type": "daily_challenge",
                    "estimated_minutes": 2,
                    "challenge": "During your next practice or game, try to catch one chain reaction as it happens. Notice the event, thought, emotion, and action. Write it down afterward.",
                    "icon": "zap"
                }
            ]
        }
    ]
}
