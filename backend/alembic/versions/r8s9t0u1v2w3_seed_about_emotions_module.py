"""Seed About Emotions training module

Revision ID: r8s9t0u1v2w3
Revises: q7r8s9t0u1v2
Create Date: 2026-01-02

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers, used by Alembic.
revision: str = 'r8s9t0u1v2w3'
down_revision: Union[str, None] = 'q7r8s9t0u1v2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# All 17 emotions with their full details
EMOTIONS = [
    # Core emotions (5) - required before completion
    {
        "id": "joy",
        "emoji": "\U0001F60A",  # smiling face with smiling eyes
        "label": "Joy",
        "is_core": True,
        "detail": {
            "description": "A feeling of happiness, delight, or great pleasure. Joy often arises when something good happens or when you feel connected to others.",
            "body_feelings": [
                "Lightness in your chest",
                "Energy throughout your body",
                "Relaxed muscles",
                "Warmth spreading through you",
                "Wanting to smile or laugh"
            ],
            "similar_feelings": [
                "Happiness",
                "Delight",
                "Cheerfulness",
                "Elation",
                "Bliss"
            ],
            "when_helpful": [
                "Celebrating achievements",
                "Building connections with teammates",
                "Recovering from setbacks",
                "Maintaining motivation",
                "Creating positive memories"
            ],
            "when_challenging": [
                "When you need to stay focused and it becomes distracting",
                "When others aren't sharing in your joy",
                "When it leads to overconfidence"
            ]
        }
    },
    {
        "id": "sadness",
        "emoji": "\U0001F622",  # crying face
        "label": "Sadness",
        "is_core": True,
        "detail": {
            "description": "A feeling of unhappiness or sorrow. Sadness often comes after a loss, disappointment, or when things don't go as hoped.",
            "body_feelings": [
                "Heaviness in your chest",
                "Tiredness or low energy",
                "Tightness in your throat",
                "Slowed movements",
                "Tears or wanting to cry"
            ],
            "similar_feelings": [
                "Grief",
                "Sorrow",
                "Disappointment",
                "Loneliness",
                "Melancholy"
            ],
            "when_helpful": [
                "Processing a tough loss",
                "Connecting with others who understand",
                "Recognizing what matters to you",
                "Allowing yourself to rest and recover",
                "Building empathy"
            ],
            "when_challenging": [
                "When it lingers and affects your performance",
                "When you need to bounce back quickly",
                "When you isolate yourself from support"
            ]
        }
    },
    {
        "id": "anger",
        "emoji": "\U0001F620",  # angry face
        "label": "Anger",
        "is_core": True,
        "detail": {
            "description": "A strong feeling of displeasure or hostility. Anger often arises when you feel wronged, blocked, or when something feels unfair.",
            "body_feelings": [
                "Heat rising in your face or body",
                "Tension in your jaw or fists",
                "Faster heartbeat",
                "Tightness in your chest",
                "Surge of energy"
            ],
            "similar_feelings": [
                "Frustration",
                "Irritation",
                "Rage",
                "Annoyance",
                "Resentment"
            ],
            "when_helpful": [
                "Fueling determination after an unfair call",
                "Setting boundaries",
                "Fighting through adversity",
                "Standing up for teammates",
                "Pushing through difficult moments"
            ],
            "when_challenging": [
                "When it leads to poor decisions",
                "When it damages relationships",
                "When it takes you out of your game",
                "When it results in penalties or ejections"
            ]
        }
    },
    {
        "id": "fear",
        "emoji": "\U0001F628",  # fearful face
        "label": "Fear",
        "is_core": True,
        "detail": {
            "description": "A feeling of being afraid or anxious about something. Fear alerts you to potential threats or dangers.",
            "body_feelings": [
                "Racing heart",
                "Butterflies in your stomach",
                "Sweaty palms",
                "Tense muscles",
                "Feeling frozen or wanting to run"
            ],
            "similar_feelings": [
                "Anxiety",
                "Worry",
                "Nervousness",
                "Dread",
                "Panic"
            ],
            "when_helpful": [
                "Keeping you alert and focused",
                "Preparing your body for performance",
                "Protecting you from real danger",
                "Signaling that something matters to you",
                "Motivating preparation"
            ],
            "when_challenging": [
                "When it causes you to freeze up",
                "When it prevents you from taking risks",
                "When it becomes overwhelming",
                "When it leads to avoidance"
            ]
        }
    },
    {
        "id": "disgust",
        "emoji": "\U0001F922",  # nauseated face
        "label": "Disgust",
        "is_core": True,
        "detail": {
            "description": "A feeling of strong dislike or revulsion. Disgust helps you avoid things that could be harmful or go against your values.",
            "body_feelings": [
                "Nausea or upset stomach",
                "Wanting to turn away",
                "Curled lip or wrinkled nose",
                "Feeling of rejection",
                "Physical recoil"
            ],
            "similar_feelings": [
                "Revulsion",
                "Repulsion",
                "Aversion",
                "Loathing",
                "Contempt"
            ],
            "when_helpful": [
                "Protecting your values",
                "Identifying what's not right for you",
                "Maintaining standards",
                "Avoiding harmful situations",
                "Recognizing unfair play"
            ],
            "when_challenging": [
                "When it creates conflict with others",
                "When it prevents understanding different perspectives",
                "When it becomes judgmental"
            ]
        }
    },
    # Non-core emotions (12)
    {
        "id": "excitement",
        "emoji": "\U0001F929",  # star-struck face
        "label": "Excitement",
        "is_core": False,
        "detail": {
            "description": "A feeling of eager enthusiasm and anticipation. Excitement energizes you and creates positive momentum.",
            "body_feelings": [
                "Buzzing energy throughout your body",
                "Faster heartbeat",
                "Feeling like you can't sit still",
                "Heightened alertness",
                "Tingling sensation"
            ],
            "similar_feelings": [
                "Enthusiasm",
                "Eagerness",
                "Thrill",
                "Anticipation",
                "Exhilaration"
            ],
            "when_helpful": [
                "Starting a big game or competition",
                "Trying something new",
                "Building team energy",
                "Pushing through fatigue",
                "Embracing challenges"
            ],
            "when_challenging": [
                "When it leads to rushing or careless mistakes",
                "When it's hard to channel into focused action",
                "When it disrupts sleep before events"
            ]
        }
    },
    {
        "id": "pride",
        "emoji": "\U0001F60C",  # relieved face / proud
        "label": "Pride",
        "is_core": False,
        "detail": {
            "description": "A feeling of deep satisfaction from your own achievements or the achievements of those you care about.",
            "body_feelings": [
                "Standing taller",
                "Chest expanding",
                "Warmth in your core",
                "Feeling bigger or more powerful",
                "Head held high"
            ],
            "similar_feelings": [
                "Accomplishment",
                "Satisfaction",
                "Self-respect",
                "Honor",
                "Triumph"
            ],
            "when_helpful": [
                "Recognizing your hard work",
                "Building confidence",
                "Motivating continued effort",
                "Celebrating team success",
                "Reinforcing good habits"
            ],
            "when_challenging": [
                "When it becomes arrogance",
                "When it prevents learning from mistakes",
                "When it creates distance from teammates"
            ]
        }
    },
    {
        "id": "gratitude",
        "emoji": "\U0001F64F",  # folded hands / prayer
        "label": "Gratitude",
        "is_core": False,
        "detail": {
            "description": "A feeling of thankfulness and appreciation for what you have, who supports you, or opportunities you've been given.",
            "body_feelings": [
                "Warmth in your heart area",
                "Feeling of openness",
                "Relaxed body",
                "Sense of fullness",
                "Calm energy"
            ],
            "similar_feelings": [
                "Thankfulness",
                "Appreciation",
                "Gratefulness",
                "Recognition",
                "Acknowledgment"
            ],
            "when_helpful": [
                "Maintaining perspective after setbacks",
                "Building team bonds",
                "Staying motivated during hard times",
                "Appreciating coaches and support",
                "Finding meaning in your sport"
            ],
            "when_challenging": [
                "When it feels forced or inauthentic",
                "When it minimizes real struggles",
                "Rarely challenging when genuine"
            ]
        }
    },
    {
        "id": "love",
        "emoji": "\u2764\uFE0F",  # red heart
        "label": "Love",
        "is_core": False,
        "detail": {
            "description": "A deep feeling of affection and care for others, your sport, or what you do. Love creates connection and meaning.",
            "body_feelings": [
                "Warmth spreading through your body",
                "Feeling of expansion in your chest",
                "Relaxed and open posture",
                "Desire to be close or connected",
                "Peaceful energy"
            ],
            "similar_feelings": [
                "Affection",
                "Caring",
                "Devotion",
                "Passion",
                "Connection"
            ],
            "when_helpful": [
                "Staying committed through difficulties",
                "Building deep team bonds",
                "Finding joy in daily practice",
                "Recovering from injury with patience",
                "Playing for something bigger than yourself"
            ],
            "when_challenging": [
                "When fear of losing what you love creates pressure",
                "When attachment to outcomes causes suffering",
                "When it makes setbacks feel devastating"
            ]
        }
    },
    {
        "id": "contentment",
        "emoji": "\U0001F60C",  # relieved/content face
        "label": "Contentment",
        "is_core": False,
        "detail": {
            "description": "A peaceful feeling of satisfaction with how things are. Contentment is a calm, settled sense of being okay.",
            "body_feelings": [
                "Relaxed muscles",
                "Slow, deep breathing",
                "Feeling of settledness",
                "Warm and comfortable",
                "No tension or urgency"
            ],
            "similar_feelings": [
                "Satisfaction",
                "Peace",
                "Serenity",
                "Ease",
                "Fulfillment"
            ],
            "when_helpful": [
                "Recovering after intense effort",
                "Appreciating progress",
                "Maintaining balance",
                "Avoiding burnout",
                "Finding joy in the journey"
            ],
            "when_challenging": [
                "When it becomes complacency",
                "When it reduces motivation to improve",
                "When it's mistaken for giving up"
            ]
        }
    },
    {
        "id": "anxiety",
        "emoji": "\U0001F630",  # anxious face with sweat
        "label": "Anxiety",
        "is_core": False,
        "detail": {
            "description": "A feeling of worry, nervousness, or unease about something uncertain. Anxiety is your mind preparing for possible challenges.",
            "body_feelings": [
                "Tight chest",
                "Shallow breathing",
                "Restlessness",
                "Stomach butterflies or knots",
                "Racing thoughts"
            ],
            "similar_feelings": [
                "Worry",
                "Nervousness",
                "Unease",
                "Apprehension",
                "Stress"
            ],
            "when_helpful": [
                "Preparing thoroughly for competition",
                "Staying alert to important details",
                "Motivating practice and preparation",
                "Signaling that something matters",
                "Identifying areas that need attention"
            ],
            "when_challenging": [
                "When it becomes overwhelming",
                "When it interferes with sleep",
                "When it causes avoidance",
                "When it spirals into panic"
            ]
        }
    },
    {
        "id": "frustration",
        "emoji": "\U0001F624",  # face with steam from nose
        "label": "Frustration",
        "is_core": False,
        "detail": {
            "description": "A feeling of being upset or annoyed because you can't achieve something or things aren't going as expected.",
            "body_feelings": [
                "Tension in shoulders and neck",
                "Clenched jaw",
                "Sighing or groaning",
                "Restless energy",
                "Wanting to hit something"
            ],
            "similar_feelings": [
                "Irritation",
                "Annoyance",
                "Exasperation",
                "Impatience",
                "Agitation"
            ],
            "when_helpful": [
                "Signaling that you need to try a different approach",
                "Fueling determination to improve",
                "Identifying what's not working",
                "Pushing through plateaus",
                "Motivating change"
            ],
            "when_challenging": [
                "When it leads to giving up",
                "When it causes you to lose focus",
                "When it affects your relationships",
                "When it compounds into anger"
            ]
        }
    },
    {
        "id": "embarrassment",
        "emoji": "\U0001F633",  # flushed face
        "label": "Embarrassment",
        "is_core": False,
        "detail": {
            "description": "A feeling of self-consciousness or shame when you feel exposed or have made a mistake in front of others.",
            "body_feelings": [
                "Flushing or blushing",
                "Wanting to hide or disappear",
                "Heat in your face",
                "Avoiding eye contact",
                "Feeling small"
            ],
            "similar_feelings": [
                "Shame",
                "Self-consciousness",
                "Humiliation",
                "Awkwardness",
                "Mortification"
            ],
            "when_helpful": [
                "Learning from mistakes",
                "Developing humility",
                "Building awareness of social situations",
                "Motivating improvement",
                "Connecting with others through vulnerability"
            ],
            "when_challenging": [
                "When it prevents risk-taking",
                "When it lingers and affects confidence",
                "When it causes you to hold back",
                "When it leads to avoidance of challenges"
            ]
        }
    },
    {
        "id": "guilt",
        "emoji": "\U0001F614",  # pensive face
        "label": "Guilt",
        "is_core": False,
        "detail": {
            "description": "A feeling of having done something wrong or failing to meet expectations. Guilt points to your values and standards.",
            "body_feelings": [
                "Heavy feeling in your stomach",
                "Weight on your shoulders",
                "Difficulty looking others in the eye",
                "Tightness in chest",
                "Restlessness"
            ],
            "similar_feelings": [
                "Remorse",
                "Regret",
                "Shame",
                "Self-blame",
                "Contrition"
            ],
            "when_helpful": [
                "Recognizing when you've let yourself or others down",
                "Motivating you to make amends",
                "Reinforcing your values",
                "Building accountability",
                "Improving behavior"
            ],
            "when_challenging": [
                "When it becomes excessive self-criticism",
                "When it prevents moving forward",
                "When it's about things beyond your control",
                "When it damages self-worth"
            ]
        }
    },
    {
        "id": "jealousy",
        "emoji": "\U0001F611",  # expressionless face
        "label": "Jealousy",
        "is_core": False,
        "detail": {
            "description": "A feeling of resentment toward someone else's success, advantages, or possessions that you wish you had.",
            "body_feelings": [
                "Tightness in your stomach",
                "Tension throughout your body",
                "Heat or burning sensation",
                "Feeling closed off",
                "Restless energy"
            ],
            "similar_feelings": [
                "Envy",
                "Resentment",
                "Covetousness",
                "Bitterness",
                "Rivalry"
            ],
            "when_helpful": [
                "Identifying what you truly want",
                "Motivating you to work harder",
                "Clarifying your goals",
                "Recognizing where you want to grow",
                "Fueling competitive drive"
            ],
            "when_challenging": [
                "When it damages relationships",
                "When it leads to sabotaging others",
                "When it prevents celebrating others' success",
                "When it becomes consuming"
            ]
        }
    },
    {
        "id": "boredom",
        "emoji": "\U0001F971",  # yawning face
        "label": "Boredom",
        "is_core": False,
        "detail": {
            "description": "A feeling of being weary and restless due to lack of interest or challenge. Boredom signals a need for engagement.",
            "body_feelings": [
                "Low energy",
                "Restlessness",
                "Yawning or sighing",
                "Fidgeting",
                "Mind wandering"
            ],
            "similar_feelings": [
                "Disinterest",
                "Monotony",
                "Tedium",
                "Apathy",
                "Listlessness"
            ],
            "when_helpful": [
                "Signaling need for new challenges",
                "Motivating creativity and innovation",
                "Identifying that you're ready for more",
                "Prompting change in routine",
                "Finding what truly engages you"
            ],
            "when_challenging": [
                "When it leads to going through the motions",
                "When it affects practice quality",
                "When it causes you to disengage",
                "When it spreads to teammates"
            ]
        }
    },
    {
        "id": "surprise",
        "emoji": "\U0001F62E",  # face with open mouth
        "label": "Surprise",
        "is_core": False,
        "detail": {
            "description": "A brief feeling of being caught off guard by something unexpected. Surprise can be positive or negative depending on what caused it.",
            "body_feelings": [
                "Widened eyes",
                "Gasping or sharp intake of breath",
                "Momentary freeze",
                "Raised eyebrows",
                "Brief spike in alertness"
            ],
            "similar_feelings": [
                "Astonishment",
                "Amazement",
                "Shock",
                "Startled",
                "Wonder"
            ],
            "when_helpful": [
                "Staying adaptable and flexible",
                "Responding to unexpected opportunities",
                "Learning from the unexpected",
                "Staying present and alert",
                "Embracing spontaneity"
            ],
            "when_challenging": [
                "When it throws you off your game",
                "When negative surprises derail focus",
                "When you struggle to recover quickly",
                "When it leads to hesitation"
            ]
        }
    }
]

ABOUT_EMOTIONS_MODULE = {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "slug": "about-emotions",
    "name": "About Emotions",
    "description": "Explore the emotions you experience in sport and life. Learn to recognize, understand, and work with your feelings.",
    "icon": "heart",
    "color": "rose",
    "estimated_minutes": 15,
    "status": "active",
    "order_index": 5,
    "is_premium": False,
    "requires_assessment": False,
    "content": {
        "flow_type": "sequential_activities",
        "activities": [
            {
                "id": "activity_1",
                "name": "Emotions Exploration",
                "description": "Learn about the emotions you experience and how they show up in your body",
                "estimated_minutes": 15,
                "icon": "heart",
                "screens": [
                    # Screen 1: Introduction
                    {
                        "id": "intro_1",
                        "type": "static_card",
                        "content": {
                            "body": "Emotions are part of being human.",
                            "subtext": "Every athlete experiences a wide range of feelings - before, during, and after competition.",
                            "follow_up": "Understanding your emotions helps you work with them, not against them."
                        }
                    },
                    # Screen 2: Why emotions matter
                    {
                        "id": "intro_2",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Emotions influence everything:",
                            "items": [
                                {"id": "infl_1", "text": "How you perform under pressure"},
                                {"id": "infl_2", "text": "How you recover from setbacks"},
                                {"id": "infl_3", "text": "How you connect with teammates"},
                                {"id": "infl_4", "text": "How much you enjoy your sport"}
                            ],
                            "subtext_after_reveal": "The more you understand them, the better you can respond."
                        }
                    },
                    # Screen 3: No good or bad emotions
                    {
                        "id": "intro_3",
                        "type": "static_card",
                        "content": {
                            "body": "There are no 'good' or 'bad' emotions.",
                            "subtext": "Every emotion has a purpose. Even uncomfortable ones carry important information.",
                            "follow_up": "The goal isn't to avoid certain feelings - it's to understand what they're telling you.",
                            "emphasis": True
                        }
                    },
                    # Screen 4: Core emotions introduction
                    {
                        "id": "intro_4",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Psychologists often talk about 5 core emotions:",
                            "items": [
                                {"id": "core_1", "text": "Joy - the feeling of happiness and delight"},
                                {"id": "core_2", "text": "Sadness - the feeling of loss or disappointment"},
                                {"id": "core_3", "text": "Anger - the feeling of being wronged or blocked"},
                                {"id": "core_4", "text": "Fear - the feeling of threat or danger"},
                                {"id": "core_5", "text": "Disgust - the feeling of rejection or aversion"}
                            ],
                            "subtext_after_reveal": "Many other emotions are related to or built from these core five."
                        }
                    },
                    # Screen 5: What you'll do
                    {
                        "id": "intro_5",
                        "type": "static_card",
                        "content": {
                            "body": "In this module, you'll explore 17 emotions.",
                            "subtext": "Each one includes how it feels in your body, similar feelings, and when it can be helpful or challenging.",
                            "follow_up": "Tap on any emotion to learn more about it."
                        }
                    },
                    # Screen 6: Core emotions requirement
                    {
                        "id": "intro_6",
                        "type": "static_card",
                        "content": {
                            "body": "Make sure to explore all 5 core emotions.",
                            "subtext": "The core emotions are marked with a special border. You'll need to view all 5 before completing this module.",
                            "follow_up": "Feel free to explore any others that interest you too!"
                        }
                    },
                    # Screen 7: Emoji Grid - the main interactive screen
                    {
                        "id": "emoji_grid_1",
                        "type": "emoji_grid",
                        "content": {
                            "prompt": "Tap an emotion to explore it",
                            "subtext": "Core emotions are marked with a border",
                            "emotions": EMOTIONS,
                            "required_core_count": 5,
                            "total_count": 17
                        }
                    },
                    # Screen 8: Activity Completion
                    {
                        "id": "completion_1",
                        "type": "activity_completion",
                        "content": {
                            "title": "You've explored your emotions!",
                            "message": "Understanding your emotions is a skill. The more you notice and name what you're feeling, the better you can respond to it.",
                            "exploration_summary": True,
                            "exploration_screen_id": "emoji_grid_1",
                            "next_activity_hint": None
                        }
                    }
                ]
            }
        ]
    }
}


def upgrade() -> None:
    """Add the About Emotions training module."""
    module = ABOUT_EMOTIONS_MODULE
    now = datetime.utcnow().isoformat()

    op.execute(
        sa.text("""
            INSERT INTO training_modules (
                id, slug, name, description, icon, color,
                estimated_minutes, content, status, order_index,
                is_premium, requires_assessment, created_at, updated_at
            ) VALUES (
                CAST(:id AS uuid),
                :slug,
                :name,
                :description,
                :icon,
                :color,
                :estimated_minutes,
                CAST(:content AS jsonb),
                :status,
                :order_index,
                :is_premium,
                :requires_assessment,
                CAST(:created_at AS timestamp),
                CAST(:updated_at AS timestamp)
            )
        """).bindparams(
            id=module["id"],
            slug=module["slug"],
            name=module["name"],
            description=module["description"],
            icon=module["icon"],
            color=module["color"],
            estimated_minutes=module["estimated_minutes"],
            content=json.dumps(module["content"]),
            status=module["status"],
            order_index=module["order_index"],
            is_premium=module["is_premium"],
            requires_assessment=module["requires_assessment"],
            created_at=now,
            updated_at=now,
        )
    )


def downgrade() -> None:
    """Remove the About Emotions training module."""
    op.execute(
        sa.text("DELETE FROM training_modules WHERE slug = 'about-emotions'")
    )
