"""Seed Building Confidence training module

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2025-12-20

"""
from typing import Sequence, Union
import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json


# revision identifiers, used by Alembic.
revision: str = 'i9j0k1l2m3n4'
down_revision: Union[str, None] = 'h8i9j0k1l2m3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


BUILDING_CONFIDENCE_MODULE = {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "slug": "building-confidence",
    "name": "Building Confidence",
    "description": "Understand what confidence is, recognize what challenges it, and learn techniques to build self-belief.",
    "icon": "award",
    "color": "amber",
    "estimated_minutes": 20,
    "status": "active",
    "order_index": 2,
    "is_premium": False,
    "requires_assessment": False,
    "content": {
        "flow_type": "sequential_activities",
        "activities": [
            {
                "id": "activity_1",
                "name": "What is Confidence?",
                "description": "Define confidence, normalize doubt, introduce the pack",
                "estimated_minutes": 4,
                "icon": "sparkles",
                "screens": [
                    {
                        "id": "a1_s1",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "What is confidence?",
                            "items": [
                                {"id": "conf_1", "text": "Confidence is believing in yourself, your skills, and your ability to handle what comes next."},
                                {"id": "conf_2", "text": "In sport, it's the feeling of 'I've got this' — even when things feel uncertain."}
                            ],
                            "header2": "What confidence isn't:",
                            "header2_after_item": 2,
                            "subtext_after_reveal": None
                        }
                    },
                    {
                        "id": "a1_s1b",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "What confidence isn't:",
                            "items": [
                                {"id": "not_1", "text": "It's not about being perfect"},
                                {"id": "not_2", "text": "It's not about never doubting yourself"},
                                {"id": "not_3", "text": "It's about trusting your preparation and your ability to figure things out"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s2",
                        "type": "static_card",
                        "content": {
                            "body": "Even confident athletes experience doubt.",
                            "subtext": "Doubt is normal. It doesn't mean you lack confidence.",
                            "follow_up": "It means you care about what you're doing."
                        }
                    },
                    {
                        "id": "a1_s3",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "When doubt shows up for you, what does it usually sound like?",
                            "options": [
                                {"id": "doubt_mess", "label": "What if I mess up?"},
                                {"id": "doubt_enough", "label": "I'm not good enough"},
                                {"id": "doubt_compare", "label": "Everyone is better than me"},
                                {"id": "doubt_cant", "label": "I can't do this"},
                                {"id": "doubt_other", "label": "Something else"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s4",
                        "type": "emoji_select",
                        "content": {
                            "prompt": "When you feel confident, what does it feel like?",
                            "options": [
                                {"id": "feel_strong", "emoji": "💪", "label": "Strong"},
                                {"id": "feel_calm", "emoji": "😌", "label": "Calm"},
                                {"id": "feel_energized", "emoji": "🔥", "label": "Energized"},
                                {"id": "feel_happy", "emoji": "😊", "label": "Happy"},
                                {"id": "feel_focused", "emoji": "🎯", "label": "Focused"},
                                {"id": "feel_ready", "emoji": "✨", "label": "Ready"}
                            ],
                            "allow_multiple": True,
                            "optional_text_prompt": "Or describe it in your own words:"
                        }
                    },
                    {
                        "id": "a1_s5",
                        "type": "multi_select",
                        "content": {
                            "prompt": "When you feel confident, what does it sound like in your head?",
                            "options": [
                                {"id": "sound_got", "label": "I've got this"},
                                {"id": "sound_go", "label": "Let's go"},
                                {"id": "sound_ready", "label": "I'm ready"},
                                {"id": "sound_can", "label": "I can do this"},
                                {"id": "sound_trust", "label": "Trust yourself"}
                            ],
                            "include_other": True
                        }
                    },
                    {
                        "id": "a1_s6",
                        "type": "static_card",
                        "content": {
                            "body": "Remember how your brain is wired?",
                            "subtext": "It seeks comfort, watches for negatives, and wants you to fit in.",
                            "follow_up": "These patterns can make doubt louder than it needs to be."
                        }
                    },
                    {
                        "id": "a1_s7",
                        "type": "static_card",
                        "content": {
                            "body": "Confidence is a skill.",
                            "subtext": "Just like any other skill in sport, it can be practiced and strengthened.",
                            "emphasis": True
                        }
                    },
                    {
                        "id": "a1_s8",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "This pack will help you understand:",
                            "items": [
                                {"id": "learn_1", "text": "What confidence is"},
                                {"id": "learn_2", "text": "What challenges it"},
                                {"id": "learn_3", "text": "A few ways to build it"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s9",
                        "type": "activity_completion",
                        "content": {
                            "title": "Great start!",
                            "message": "Confidence isn't something you either have or don't have. It's something you build — one small step at a time.",
                            "next_activity_hint": "Next: What Challenges Your Confidence?"
                        }
                    }
                ]
            },
            {
                "id": "activity_2",
                "name": "What Challenges Your Confidence?",
                "description": "Identify internal and external factors that shake confidence",
                "estimated_minutes": 5,
                "icon": "alert-triangle",
                "screens": [
                    {
                        "id": "a2_s1",
                        "type": "static_card",
                        "content": {
                            "body": "Confidence doesn't stay the same all the time.",
                            "subtext": "It can shift — sometimes quickly.",
                            "follow_up": "Understanding what challenges your confidence helps you prepare for it."
                        }
                    },
                    {
                        "id": "a2_s2",
                        "type": "static_card",
                        "content": {
                            "body": "Confidence gets challenged in two main ways:",
                            "subtext": "Internal factors — things happening inside your mind and body",
                            "follow_up": "External factors — things happening outside of you"
                        }
                    },
                    {
                        "id": "a2_s3",
                        "type": "category_toggle",
                        "content": {
                            "prompt": "Tap each item to categorize it:",
                            "categories": [
                                {"id": "internal", "label": "Internal"},
                                {"id": "external", "label": "External"}
                            ],
                            "items": [
                                {"id": "cat_doubt", "text": "Doubt and uncertainty", "correct_category": "internal"},
                                {"id": "cat_criticism", "text": "Criticism from coaches or teammates", "correct_category": "external"},
                                {"id": "cat_selftalk", "text": "Negative self-talk", "correct_category": "internal"},
                                {"id": "cat_past", "text": "A past mistake or tough performance", "correct_category": "external"},
                                {"id": "cat_replay", "text": "Replaying mistakes", "correct_category": "internal"},
                                {"id": "cat_pressure", "text": "Pressure situations (big games, tryouts)", "correct_category": "external"},
                                {"id": "cat_compare", "text": "Comparing yourself to others", "correct_category": "internal"},
                                {"id": "cat_watched", "text": "Being watched or evaluated", "correct_category": "external"},
                                {"id": "cat_fear", "text": "Fear of failure or judgment", "correct_category": "internal"},
                                {"id": "cat_setbacks", "text": "Unexpected setbacks or challenges", "correct_category": "external"}
                            ],
                            "show_feedback": True
                        }
                    },
                    {
                        "id": "a2_s4",
                        "type": "static_card",
                        "content": {
                            "body": "Remember: your brain is wired to focus on negatives.",
                            "subtext": "When doubt shows up, your brain can zoom in on it fast.",
                            "follow_up": "This is why internal challenges can feel so loud."
                        }
                    },
                    {
                        "id": "a2_s5",
                        "type": "static_card",
                        "content": {
                            "body": "Every athlete experiences these challenges.",
                            "subtext": "What matters is recognizing them and knowing you can respond."
                        }
                    },
                    {
                        "id": "a2_s6",
                        "type": "multi_select",
                        "content": {
                            "prompt": "Which internal factors challenge your confidence most?",
                            "options": [
                                {"id": "int_doubt", "label": "Doubt and uncertainty"},
                                {"id": "int_selftalk", "label": "Negative self-talk"},
                                {"id": "int_replay", "label": "Replaying mistakes"},
                                {"id": "int_compare", "label": "Comparing myself to others"},
                                {"id": "int_fear", "label": "Fear of judgment"}
                            ],
                            "include_other": True
                        }
                    },
                    {
                        "id": "a2_s7",
                        "type": "multi_select",
                        "content": {
                            "prompt": "Which external factors challenge your confidence most?",
                            "options": [
                                {"id": "ext_criticism", "label": "Criticism from others"},
                                {"id": "ext_past", "label": "Past mistakes or performances"},
                                {"id": "ext_pressure", "label": "Pressure situations"},
                                {"id": "ext_challenges", "label": "Unexpected challenges"},
                                {"id": "ext_watched", "label": "Being watched or evaluated"}
                            ],
                            "include_other": True
                        }
                    },
                    {
                        "id": "a2_s8",
                        "type": "static_card",
                        "content": {
                            "body": "When something challenges your confidence, it becomes an event.",
                            "subtext": "That event triggers thoughts and feelings, which shape what you do next.",
                            "follow_up": "Recognizing the challenge is the first step to responding differently."
                        }
                    },
                    {
                        "id": "a2_s9",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "When a challenge to confidence happens...",
                            "items": [
                                {"id": "chain_thoughts", "text": "Thoughts might sound like: 'I'm going to mess this up' or 'Everyone is watching me fail'"},
                                {"id": "chain_feelings", "text": "Feelings might be: tight chest, tense muscles, heart racing, or feeling heavy"},
                                {"id": "chain_actions", "text": "Actions might look like: hesitating, avoiding the challenge, or rushing through it"}
                            ],
                            "subtext_after_reveal": "The good news? You can learn to respond differently."
                        }
                    },
                    {
                        "id": "a2_s10",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Challenges to confidence are normal.",
                            "subtext": "They don't mean you're not confident. They're just signals that it's time to use a strategy.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a2_s11",
                        "type": "activity_completion",
                        "content": {
                            "title": "Nice work!",
                            "message": "You've started to recognize what challenges your confidence. Next, you'll learn some strategies to rebuild it.",
                            "next_activity_hint": "Next: Building Confidence with Your Words"
                        }
                    }
                ]
            },
            {
                "id": "activity_3",
                "name": "Building Confidence with Your Words",
                "description": "Using affirmations and keywords to build confidence",
                "estimated_minutes": 5,
                "icon": "message-circle",
                "screens": [
                    {
                        "id": "a3_s1",
                        "type": "static_card",
                        "content": {
                            "body": "You've recognized what challenges your confidence.",
                            "subtext": "Now, let's explore ways to build it back up.",
                            "follow_up": "One way to build confidence is by using your words."
                        }
                    },
                    {
                        "id": "a3_s2",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Doubt often sounds like:",
                            "items": [
                                {"id": "doubt_1", "text": "I don't know if I can do this..."},
                                {"id": "doubt_2", "text": "I'm not sure I'm ready..."},
                                {"id": "doubt_3", "text": "What if I mess up?"}
                            ],
                            "subtext_after_reveal": "These thoughts focus on uncertainty."
                        }
                    },
                    {
                        "id": "a3_s3",
                        "type": "static_card",
                        "content": {
                            "body": "A great way to counter doubt is to remind yourself what you do know.",
                            "subtext": "What is certain. What is true.",
                            "follow_up": "These are called 'I know' statements."
                        }
                    },
                    {
                        "id": "a3_s4",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Here are some examples:",
                            "items": [
                                {"id": "ex_1", "text": "I know I've trained hard for this"},
                                {"id": "ex_2", "text": "I know I've done this before"},
                                {"id": "ex_3", "text": "I know I can handle mistakes"},
                                {"id": "ex_4", "text": "I know my teammates have my back"},
                                {"id": "ex_5", "text": "I know I'm prepared"}
                            ]
                        }
                    },
                    {
                        "id": "a3_s5",
                        "type": "text_input",
                        "content": {
                            "prompt": "What's one thing you know to be true about your preparation or skills?",
                            "subtext": "Start with 'I know...'",
                            "prefix": "I know ",
                            "placeholder": "I've worked hard on..."
                        }
                    },
                    {
                        "id": "a3_s6",
                        "type": "text_input",
                        "content": {
                            "prompt": "What's one thing you know to be true about a time you performed well or overcame a challenge?",
                            "subtext": "Start with 'I know...'",
                            "prefix": "I know ",
                            "placeholder": "I can handle..."
                        }
                    },
                    {
                        "id": "a3_s7",
                        "type": "confirmation_display",
                        "content": {
                            "title": "Here's what you know:",
                            "display_from_screens": ["a3_s5", "a3_s6"],
                            "subtext": "These are truths you can return to when doubt shows up.",
                            "follow_up": "Try keeping a journal of 'I know' statements. You can add to it whenever you notice something you're certain about."
                        }
                    },
                    {
                        "id": "a3_s8",
                        "type": "static_card",
                        "content": {
                            "body": "Another way to use your words is through keywords.",
                            "subtext": "Keywords are short phrases that remind you what matters most.",
                            "follow_up": "They help you refocus when doubt creeps in."
                        }
                    },
                    {
                        "id": "a3_s9",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Here are some examples:",
                            "items": [
                                {"id": "kw_1", "text": "Commit"},
                                {"id": "kw_2", "text": "Stay present"},
                                {"id": "kw_3", "text": "Trust the process"},
                                {"id": "kw_4", "text": "One play at a time"},
                                {"id": "kw_5", "text": "I can do hard things"}
                            ]
                        }
                    },
                    {
                        "id": "a3_s10",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "What's a keyword or phrase that helps you stay focused and confident?",
                            "options": [
                                {"id": "kw_commit", "text": "Commit"},
                                {"id": "kw_present", "text": "Stay present"},
                                {"id": "kw_trust", "text": "Trust myself"},
                                {"id": "kw_going", "text": "Keep going"},
                                {"id": "kw_step", "text": "One step at a time"}
                            ],
                            "allow_custom_input": True,
                            "follow_up_prompt": "Write your own:"
                        }
                    },
                    {
                        "id": "a3_s11",
                        "type": "micro_commitment_confirmation",
                        "content": {
                            "title": "Your confidence keyword is:",
                            "message_template": "",
                            "encouragement": "Try saying this to yourself the next time doubt shows up."
                        }
                    },
                    {
                        "id": "a3_s12",
                        "type": "activity_completion",
                        "content": {
                            "title": "Your words have power.",
                            "message": "Using 'I know' statements and keywords can help you shift from doubt to belief. Small reminders can make a big difference.",
                            "next_activity_hint": "Next: Building Confidence with Your Imagination"
                        }
                    }
                ]
            },
            {
                "id": "activity_4",
                "name": "Building Confidence with Your Imagination",
                "description": "Using imagery to revisit successes and rewrite mistakes",
                "estimated_minutes": 5,
                "icon": "image",
                "screens": [
                    {
                        "id": "a4_s1",
                        "type": "static_card",
                        "content": {
                            "body": "We're going to keep working on different ways to build confidence.",
                            "subtext": "Today, you'll learn to use your imagination.",
                            "follow_up": "Your mind is powerful — what you imagine can shape how you feel."
                        }
                    },
                    {
                        "id": "a4_s2",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "After a mistake, it's common to replay it over and over in your mind.",
                            "items": [
                                {"id": "replay_1", "text": "Your brain zooms in on what went wrong."},
                                {"id": "replay_2", "text": "This can chip away at your confidence."}
                            ]
                        }
                    },
                    {
                        "id": "a4_s3",
                        "type": "static_card",
                        "content": {
                            "body": "Remember: your brain is wired to focus on negatives.",
                            "subtext": "Replaying mistakes is your brain trying to learn from danger.",
                            "follow_up": "But replaying them without a solution doesn't help you perform better."
                        }
                    },
                    {
                        "id": "a4_s4",
                        "type": "static_card",
                        "content": {
                            "body": "Instead of just replaying the mistake, you can rewrite it.",
                            "subtext": "This means imagining what it would look, sound, and feel like to do it better.",
                            "follow_up": "This builds confidence by training your mind to see success, not just failure."
                        }
                    },
                    {
                        "id": "a4_s5",
                        "type": "text_input",
                        "content": {
                            "prompt": "Think of a recent moment when something didn't go as planned. What happened?",
                            "subtext": "It doesn't have to be huge — just something you'd like to do better next time.",
                            "placeholder": "Describe what went wrong..."
                        }
                    },
                    {
                        "id": "a4_s6",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Now, imagine doing it differently. As you picture success, notice:",
                            "items": [
                                {"id": "img_see", "text": "What do you see?"},
                                {"id": "img_hear", "text": "What do you hear?"},
                                {"id": "img_feel", "text": "What does it feel like in your body?"},
                                {"id": "img_think", "text": "What are you thinking?"}
                            ],
                            "subtext_after_reveal": "Take a moment to really imagine this version."
                        }
                    },
                    {
                        "id": "a4_s7",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "How does imagining that version feel?",
                            "options": [
                                {"id": "img_confident", "label": "More confident"},
                                {"id": "img_clear", "label": "Clearer on what to do next"},
                                {"id": "img_possible", "label": "Like it's possible"},
                                {"id": "img_working", "label": "Still working on it"}
                            ]
                        }
                    },
                    {
                        "id": "a4_s8",
                        "type": "static_card",
                        "content": {
                            "body": "You can also use your imagination to recall great moments.",
                            "subtext": "Remembering when you performed well builds confidence too.",
                            "follow_up": "It reminds your brain what success feels like."
                        }
                    },
                    {
                        "id": "a4_s9",
                        "type": "text_input",
                        "content": {
                            "prompt": "Think of a moment when you performed well or felt really confident.",
                            "subtext": "What was it? What made it great?",
                            "placeholder": "Describe the moment..."
                        }
                    },
                    {
                        "id": "a4_s10",
                        "type": "emoji_select",
                        "content": {
                            "prompt": "When you recall that moment, what does it feel like?",
                            "options": [
                                {"id": "recall_strong", "emoji": "💪", "label": "Strong"},
                                {"id": "recall_calm", "emoji": "😌", "label": "Calm"},
                                {"id": "recall_energized", "emoji": "🔥", "label": "Energized"},
                                {"id": "recall_happy", "emoji": "😊", "label": "Happy"},
                                {"id": "recall_focused", "emoji": "🎯", "label": "Focused"},
                                {"id": "recall_powerful", "emoji": "⚡", "label": "Powerful"},
                                {"id": "recall_unstoppable", "emoji": "✨", "label": "Unstoppable"}
                            ],
                            "allow_multiple": True
                        }
                    },
                    {
                        "id": "a4_s11",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "This week, which will you practice?",
                            "options": [
                                {"id": "practice_rewrite", "text": "Rewriting a mistake in my mind"},
                                {"id": "practice_recall", "text": "Recalling a moment when I performed well"},
                                {"id": "practice_both", "text": "Both"}
                            ]
                        }
                    },
                    {
                        "id": "a4_s12",
                        "type": "micro_commitment_confirmation",
                        "content": {
                            "title": "Your imagination practice:",
                            "message_template": "",
                            "encouragement": "Your imagination is a tool. Use it to rewrite mistakes and remember successes."
                        }
                    },
                    {
                        "id": "a4_s13",
                        "type": "activity_completion",
                        "content": {
                            "title": "Your imagination is a tool.",
                            "message": "You can use it to rewrite mistakes and remember successes. Both help build confidence from the inside out.",
                            "next_activity_hint": "Next: Acting Your Way to Confidence"
                        }
                    }
                ]
            },
            {
                "id": "activity_5",
                "name": "Acting Your Way to Confidence",
                "description": "How actions can shape thoughts and feelings",
                "estimated_minutes": 4,
                "icon": "activity",
                "screens": [
                    {
                        "id": "a5_s1",
                        "type": "static_card",
                        "content": {
                            "body": "Today, we're exploring another way to build confidence:",
                            "subtext": "Using your actions to change how you think and feel.",
                            "follow_up": "Sometimes the fastest way to feel confident is to act confident — even if you don't feel it yet."
                        }
                    },
                    {
                        "id": "a5_s2",
                        "type": "static_card",
                        "content": {
                            "body": "Remember the chain?",
                            "subtext": "Events lead to thoughts, which lead to feelings, which lead to actions.",
                            "follow_up": "Event → Thoughts → Feelings → Actions"
                        }
                    },
                    {
                        "id": "a5_s3",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Here's something powerful:",
                            "items": [
                                {"id": "chain_1", "text": "The chain also works in reverse."},
                                {"id": "chain_2", "text": "What you do can change how you feel and what you think."},
                                {"id": "chain_3", "text": "Actions → Feelings → Thoughts"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s4",
                        "type": "static_card",
                        "content": {
                            "body": "One of the fastest ways to build confidence is to act confident.",
                            "subtext": "Even if you don't feel it yet.",
                            "follow_up": "Your body and actions send signals to your brain."
                        }
                    },
                    {
                        "id": "a5_s5",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "When athletes act confidently, it can look like:",
                            "items": [
                                {"id": "look_1", "text": "Standing tall, shoulders back"},
                                {"id": "look_2", "text": "Making eye contact"},
                                {"id": "look_3", "text": "Speaking clearly and decisively"},
                                {"id": "look_4", "text": "Moving with purpose"},
                                {"id": "look_5", "text": "Taking up space"},
                                {"id": "look_6", "text": "Staying engaged, even after a mistake"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s6",
                        "type": "emoji_select",
                        "content": {
                            "prompt": "When you act confident (even if you don't fully feel it yet), what does it feel like in your body?",
                            "options": [
                                {"id": "act_strong", "emoji": "💪", "label": "Strong"},
                                {"id": "act_uncomf", "emoji": "😬", "label": "Uncomfortable"},
                                {"id": "act_energized", "emoji": "⚡", "label": "Energized"},
                                {"id": "act_nervous", "emoji": "😰", "label": "Nervous"},
                                {"id": "act_focused", "emoji": "🎯", "label": "Focused"},
                                {"id": "act_powerful", "emoji": "🔥", "label": "Powerful"},
                                {"id": "act_awkward", "emoji": "😅", "label": "Awkward at first"}
                            ],
                            "allow_multiple": True
                        }
                    },
                    {
                        "id": "a5_s7",
                        "type": "static_card",
                        "content": {
                            "body": "All of those feelings are normal.",
                            "subtext": "Confidence grows with practice.",
                            "emphasis": True
                        }
                    },
                    {
                        "id": "a5_s8",
                        "type": "static_card",
                        "content": {
                            "body": "You don't need to make huge changes.",
                            "subtext": "Even small adjustments to how you carry yourself can shift how you feel.",
                            "follow_up": "Confidence builds through action, not just thought."
                        }
                    },
                    {
                        "id": "a5_s9",
                        "type": "static_card",
                        "content": {
                            "body": "Acting confident can feel uncomfortable at first.",
                            "subtext": "Especially if it means standing out or doing something unfamiliar.",
                            "follow_up": "That discomfort is normal. It's your brain in stretch zone."
                        }
                    },
                    {
                        "id": "a5_s10",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "What's one small way you can act more confident this week?",
                            "options": [
                                {"id": "act_posture", "text": "Stand taller or adjust my posture"},
                                {"id": "act_speak", "text": "Speak up or communicate more"},
                                {"id": "act_engaged", "text": "Stay engaged after a mistake"},
                                {"id": "act_purpose", "text": "Move with more purpose"},
                                {"id": "act_encourage", "text": "Encourage my teammates"}
                            ],
                            "allow_custom_input": True,
                            "follow_up_prompt": "Try something else:"
                        }
                    },
                    {
                        "id": "a5_s11",
                        "type": "micro_commitment_confirmation",
                        "content": {
                            "title": "You're going to practice:",
                            "message_template": "",
                            "encouragement": "Remember: acting confident helps you feel confident. Small steps count."
                        }
                    },
                    {
                        "id": "a5_s12",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "You've completed Building Confidence!",
                            "subtext": "Confidence isn't just something you feel. It's something you do. And the more you practice confident actions, the more natural they become.",
                            "style": "reassurance"
                        }
                    }
                ]
            }
        ]
    }
}


def upgrade() -> None:
    """Add the Building Confidence training module."""
    module = BUILDING_CONFIDENCE_MODULE
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
    """Remove the Building Confidence training module."""
    op.execute(
        sa.text("DELETE FROM training_modules WHERE slug = 'building-confidence'")
    )
