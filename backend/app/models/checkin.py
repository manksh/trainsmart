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
    BREATHING = "breathing"
    CONFIDENCE = "confidence"
    ENERGY = "energy"


class BreathingExerciseType(str, Enum):
    """Types of breathing exercises available."""
    ENERGIZE = "energize"
    RELAX = "relax"
    RELAX_FAST = "relax_fast"
    FOCUS = "focus"


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


# Breathing exercise configuration
# Based on Confluence page: Breathing
BREATHING_CONFIG = {
    BreathingExerciseType.ENERGIZE: {
        "display_name": "Energize",
        "technique": "Cyclic Hyperventilation",
        "description": "Quick, powerful breaths to boost energy and alertness",
        "triggers": [
            "Feeling sluggish before training",
            "Need a quick energy boost",
            "Want to increase alertness",
            "Preparing for high-intensity activity",
        ],
        "timing": {
            "inhale": 2,  # seconds
            "hold_in": 0,
            "exhale": 1,
            "hold_out": 0,
        },
        "cycles": 12,  # 10-15 recommended, default to 12
        "instructions": [
            "Breathe in deeply through your nose",
            "Exhale quickly through your mouth",
            "Repeat with a steady rhythm",
            "Feel the energy building",
        ],
        "category": "activation",
    },
    BreathingExerciseType.RELAX: {
        "display_name": "Relax",
        "technique": "Box Breathing",
        "description": "Equal-length breaths to calm your nervous system",
        "triggers": [
            "Feeling anxious or stressed",
            "Need to calm down before competition",
            "Having trouble focusing",
            "Want to lower heart rate",
        ],
        "timing": {
            "inhale": 4,
            "hold_in": 4,
            "exhale": 4,
            "hold_out": 4,
        },
        "cycles": 4,
        "instructions": [
            "Breathe in slowly for 4 seconds",
            "Hold your breath for 4 seconds",
            "Exhale slowly for 4 seconds",
            "Hold empty for 4 seconds",
        ],
        "category": "calming",
    },
    BreathingExerciseType.RELAX_FAST: {
        "display_name": "Quick Calm",
        "technique": "Psychological Sigh",
        "description": "Fastest way to reduce stress in the moment",
        "triggers": [
            "Need immediate stress relief",
            "Feeling overwhelmed right now",
            "Quick reset between activities",
            "Pre-performance nerves",
        ],
        "timing": {
            "inhale": 1,
            "hold_in": 0,
            "second_inhale": 0.5,  # Short additional inhale
            "exhale": 3,
            "hold_out": 0,
        },
        "cycles": 3,
        "instructions": [
            "Take a deep breath in through your nose",
            "Take a second short breath to fully fill lungs",
            "Exhale slowly through your mouth",
            "Feel the tension release",
        ],
        "category": "calming",
    },
    BreathingExerciseType.FOCUS: {
        "display_name": "Focus",
        "technique": "Mindful Breathing",
        "description": "Count your breaths to sharpen concentration",
        "triggers": [
            "Mind is wandering",
            "Need to improve concentration",
            "Preparing for focused practice",
            "Want to be more present",
        ],
        "timing": {
            "inhale": 4,
            "hold_in": 0,
            "exhale": 4,
            "hold_out": 0,
        },
        "cycles": 10,  # Count 1-10
        "instructions": [
            "Breathe naturally and count each exhale",
            "Count from 1 to 10",
            "If you lose count, start again at 1",
            "Focus only on your breath and the count",
        ],
        "category": "focus",
    },
}


# Confidence check-in configuration
# Based on KAN-2: Confidence level (1-7), sources of confidence/doubt, level-based actions
CONFIDENCE_SOURCES = {
    "confidence": [
        {"key": "preparation", "label": "Good preparation", "description": "I've put in the work"},
        {"key": "past_success", "label": "Past successes", "description": "I've done this before"},
        {"key": "support", "label": "Support system", "description": "My team/coach believes in me"},
        {"key": "skills", "label": "My skills", "description": "I trust my abilities"},
        {"key": "physical", "label": "Physical readiness", "description": "My body feels ready"},
        {"key": "mental", "label": "Mental clarity", "description": "My mind is focused"},
        {"key": "routine", "label": "Pre-performance routine", "description": "I have my process"},
        {"key": "other", "label": "Something else", "description": "Another source"},
    ],
    "doubt": [
        {"key": "lack_preparation", "label": "Lack of preparation", "description": "I don't feel ready"},
        {"key": "past_failure", "label": "Past failures", "description": "I'm thinking about mistakes"},
        {"key": "comparison", "label": "Comparing to others", "description": "Others seem better"},
        {"key": "pressure", "label": "External pressure", "description": "Too much on the line"},
        {"key": "physical_issue", "label": "Physical issues", "description": "Body doesn't feel right"},
        {"key": "negative_thoughts", "label": "Negative thoughts", "description": "Self-doubt creeping in"},
        {"key": "uncertainty", "label": "Uncertainty", "description": "Don't know what to expect"},
        {"key": "other", "label": "Something else", "description": "Another source"},
    ],
}

# Level-based actions for confidence (1-7 scale)
CONFIDENCE_ACTIONS = {
    "low": {  # Levels 1-2
        "label": "Low confidence",
        "message": "It's okay to feel unsure. Let's build from here.",
        "actions": [
            "Remember a time you overcame doubt",
            "Talk to your coach or a supportive teammate",
            "Focus on one small thing you can control right now",
            "Do a quick wins review - list 3 recent accomplishments",
            "Use power posing for 2 minutes to shift your state",
        ],
    },
    "moderate": {  # Levels 3-4
        "label": "Moderate confidence",
        "message": "You're in a good place to build momentum.",
        "actions": [
            "Visualize yourself performing well",
            "Review your preparation and training",
            "Set one small achievable goal for today",
            "Use positive self-talk affirmations",
            "Connect with your pre-performance routine",
        ],
    },
    "high": {  # Levels 5-6
        "label": "High confidence",
        "message": "You're feeling ready. Channel this energy wisely.",
        "actions": [
            "Stay present - avoid getting ahead of yourself",
            "Trust your training and process",
            "Help a teammate who might need support",
            "Fine-tune your focus on key performance cues",
            "Embrace the challenge ahead",
        ],
    },
    "peak": {  # Level 7
        "label": "Peak confidence",
        "message": "You're in an optimal state. Maintain this balance.",
        "actions": [
            "Anchor this feeling for future recall",
            "Stay grounded and present",
            "Trust yourself completely",
            "Let go of overthinking - just perform",
            "Enjoy the moment",
        ],
    },
}


# Energy check-in configuration
# Based on KAN-3: Physical energy (1-7), Mental energy (1-7), influencing factors
ENERGY_FACTORS = {
    "physical": [
        {"key": "sleep", "label": "Sleep quality", "icon": "🌙"},
        {"key": "nutrition", "label": "Nutrition/hydration", "icon": "🍎"},
        {"key": "training_load", "label": "Training load", "icon": "🏋️"},
        {"key": "recovery", "label": "Recovery time", "icon": "🔄"},
        {"key": "illness", "label": "Illness/injury", "icon": "🤕"},
        {"key": "travel", "label": "Travel/jet lag", "icon": "✈️"},
        {"key": "other_physical", "label": "Other", "icon": "❓"},
    ],
    "mental": [
        {"key": "stress", "label": "Life stress", "icon": "😰"},
        {"key": "motivation", "label": "Motivation level", "icon": "🎯"},
        {"key": "focus", "label": "Ability to focus", "icon": "🧠"},
        {"key": "mood", "label": "Overall mood", "icon": "😊"},
        {"key": "school_work", "label": "School/work demands", "icon": "📚"},
        {"key": "relationships", "label": "Relationships", "icon": "💬"},
        {"key": "other_mental", "label": "Other", "icon": "❓"},
    ],
}

# Energy level actions based on combined physical/mental state
ENERGY_ACTIONS = {
    "low_low": {  # Both low (1-3)
        "label": "Rest and recover",
        "message": "Your body and mind need rest. Prioritize recovery today.",
        "actions": [
            "Consider a lighter training session or rest day",
            "Focus on sleep hygiene tonight",
            "Hydrate and eat nourishing food",
            "Do gentle stretching or yoga",
            "Talk to your coach about adjusting today's plan",
        ],
    },
    "low_high": {  # Physical low, mental high (P:1-3, M:5-7)
        "label": "Smart training",
        "message": "Your mind is sharp but body needs care. Use mental energy wisely.",
        "actions": [
            "Focus on technique and tactical work",
            "Watch game film or do mental rehearsal",
            "Work on strategy with your coach",
            "Do visualization exercises",
            "Plan your recovery for physical restoration",
        ],
    },
    "high_low": {  # Physical high, mental low (P:5-7, M:1-3)
        "label": "Physical release",
        "message": "Your body is ready but mind is tired. Move to shift your state.",
        "actions": [
            "Do a physical warm-up to energize your mind",
            "Keep training simple and routine-based",
            "Avoid complex decision-making tasks",
            "Use music to boost mental energy",
            "Take breaks between intense efforts",
        ],
    },
    "moderate": {  # Both moderate (4) or mixed moderate
        "label": "Steady state",
        "message": "You're in a balanced state. Build on this foundation.",
        "actions": [
            "Stick to your normal training plan",
            "Pay attention to energy fluctuations",
            "Use breathing exercises if needed",
            "Stay hydrated and fueled",
            "Check in with yourself mid-session",
        ],
    },
    "high_high": {  # Both high (5-7)
        "label": "Peak performance zone",
        "message": "You're in an optimal state! Make the most of this energy.",
        "actions": [
            "Challenge yourself with higher intensity",
            "Work on difficult skills or scenarios",
            "Push your comfort zone safely",
            "Anchor this feeling for future recall",
            "Enjoy and appreciate this state",
        ],
    },
}


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

    # === Mood Check-In Fields ===
    # Selected emotion (for mood check-ins)
    emotion: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Intensity rating (1-5, for mood check-ins)
    intensity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Body areas where emotion is felt (for mood check-ins)
    body_areas: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True, default=list)

    # Which signal resonated most (for mood check-ins)
    signal_resonated: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Action they committed to (for mood check-ins)
    selected_action: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Whether they completed the action (for follow-up)
    action_completed: Mapped[Optional[bool]] = mapped_column(default=None, nullable=True)

    # === Breathing Check-In Fields ===
    # Breathing exercise type (for breathing check-ins)
    breathing_exercise_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Number of cycles completed (for breathing check-ins)
    cycles_completed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Duration in seconds (for breathing check-ins)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Trigger that resonated (for breathing check-ins)
    trigger_selected: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Effectiveness rating (1-5, for breathing check-ins)
    effectiveness_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # === Confidence Check-In Fields ===
    # Confidence level (1-7 scale)
    confidence_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Sources of confidence (JSONB array of keys)
    confidence_sources: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True, default=list)

    # Sources of doubt (JSONB array of keys)
    doubt_sources: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True, default=list)

    # Commitment/lock-in statement
    confidence_commitment: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # === Energy Check-In Fields ===
    # Physical energy level (1-7 scale)
    physical_energy: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Mental energy level (1-7 scale)
    mental_energy: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Physical energy factors (JSONB array of keys)
    physical_factors: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True, default=list)

    # Mental energy factors (JSONB array of keys)
    mental_factors: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True, default=list)

    # Energy state category (calculated from physical/mental levels)
    energy_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # === Shared Fields ===
    # Optional notes/reflection
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="check_ins", lazy="selectin")

    def __repr__(self) -> str:
        return f"<CheckIn {self.user_id} - {self.emotion} ({self.created_at})>"
