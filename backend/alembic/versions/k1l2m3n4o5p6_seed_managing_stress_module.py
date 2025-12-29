"""Seed Managing Stress training module

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2025-12-29

"""
from typing import Sequence, Union
import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json


# revision identifiers, used by Alembic.
revision: str = 'k1l2m3n4o5p6'
down_revision: Union[str, None] = 'j0k1l2m3n4o5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


MANAGING_STRESS_MODULE = {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "slug": "managing-stress",
    "name": "Managing Stress",
    "description": "Understand what stress is, recognize how it impacts you mentally and physically, learn that stress isn't inherently bad, and practice techniques to manage it effectively.",
    "icon": "heart-pulse",
    "color": "cyan",
    "estimated_minutes": 30,
    "status": "active",
    "order_index": 3,
    "is_premium": False,
    "requires_assessment": False,
    "content": {
        "flow_type": "sequential_activities",
        "activities": [
            # ACTIVITY 1: What is Stress?
            {
                "id": "activity_1",
                "name": "What is Stress?",
                "description": "Define stress, normalize it, establish that it's not inherently bad",
                "estimated_minutes": 4,
                "icon": "help-circle",
                "screens": [
                    {
                        "id": "a1_s1",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "Have you ever felt nervous, tense, or worried before a game or performance?",
                            "options": [
                                {"id": "often", "label": "Yes, often"},
                                {"id": "sometimes", "label": "Yes, sometimes"},
                                {"id": "rarely", "label": "Rarely"},
                                {"id": "not_really", "label": "Not really"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s2",
                        "type": "static_card",
                        "content": {
                            "body": "That feeling? That's stress.",
                            "subtext": "And it's completely normal.",
                            "follow_up": "Every athlete experiences it."
                        }
                    },
                    {
                        "id": "a1_s3",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Stress is your body and mind's natural response to demands, pressure, or challenges.",
                            "items": [
                                {"id": "stress_1", "text": "Especially when something feels important and uncertain."},
                                {"id": "stress_2", "text": "In simple terms: Stress happens when you care about an outcome and your brain isn't sure you're fully ready or in control."}
                            ]
                        }
                    },
                    {
                        "id": "a1_s4",
                        "type": "static_card",
                        "content": {
                            "body": "Here's something important:",
                            "subtext": "Stress is not automatically bad.",
                            "follow_up": "It's your system trying to help you prepare."
                        }
                    },
                    {
                        "id": "a1_s5",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Stress shows up when:",
                            "items": [
                                {"id": "when_1", "text": "The situation matters to you (competition, selection, expectations)"},
                                {"id": "when_2", "text": "You're not sure of the outcome"},
                                {"id": "when_3", "text": "You want to do well"},
                                {"id": "when_4", "text": "There's pressure or evaluation"}
                            ],
                            "subtext_after_reveal": "If you didn't care, you wouldn't feel stressed."
                        }
                    },
                    {
                        "id": "a1_s6",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Stress involves three things happening at once:",
                            "items": [
                                {"id": "part_1", "text": "Thoughts: \"What if I mess up?\""},
                                {"id": "part_2", "text": "Emotions: Nerves, tension, worry"},
                                {"id": "part_3", "text": "Body reactions: Faster heartbeat, tight muscles, butterflies"}
                            ],
                            "subtext_after_reveal": "All three are connected."
                        }
                    },
                    {
                        "id": "a1_s7",
                        "type": "static_card",
                        "content": {
                            "body": "Remember the event-thinking-feeling-action chain?",
                            "subtext": "Event -> Thoughts -> Feelings -> Actions",
                            "follow_up": "Stress is what happens when an event triggers your thoughts and feelings about whether you can handle it."
                        }
                    },
                    {
                        "id": "a1_s8",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Stress isn't a sign something is wrong.",
                            "subtext": "It's a sign that something matters to you. And while stress is uncomfortable, it's necessary for growth.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a1_s9",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "This pack will help you understand:",
                            "items": [
                                {"id": "learn_1", "text": "What stress is and why it happens"},
                                {"id": "learn_2", "text": "How it shows up in your body and mind"},
                                {"id": "learn_3", "text": "How to manage it so it works for you"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s10",
                        "type": "activity_completion",
                        "content": {
                            "title": "Stress is normal. It's human.",
                            "message": "Learning to work with it - instead of against it - is a performance skill.",
                            "next_activity_hint": "Next: How Stress Shows Up Physically"
                        }
                    }
                ]
            },
            # ACTIVITY 2: How Stress Shows Up Physically
            {
                "id": "activity_2",
                "name": "How Stress Shows Up Physically",
                "description": "Recognize physical signs of stress and understand they're not inherently bad",
                "estimated_minutes": 5,
                "icon": "activity",
                "screens": [
                    {
                        "id": "a2_s1",
                        "type": "static_card",
                        "content": {
                            "body": "Stress doesn't just happen in your mind.",
                            "subtext": "It shows up in your body first.",
                            "follow_up": "Let's explore what that looks like."
                        }
                    },
                    {
                        "id": "a2_s2",
                        "type": "tap_reveal_categories",
                        "content": {
                            "header": "Here are the most common physical signs of stress:",
                            "categories": [
                                {
                                    "id": "heart_breathing",
                                    "title": "Heart & Breathing",
                                    "items": [
                                        "Faster heart rate",
                                        "Shallow or quicker breathing",
                                        "Tight chest"
                                    ]
                                },
                                {
                                    "id": "muscles",
                                    "title": "Muscles",
                                    "items": [
                                        "Tight shoulders, jaw, neck, or fists",
                                        "Feeling stiff or shaky"
                                    ]
                                },
                                {
                                    "id": "stomach",
                                    "title": "Stomach",
                                    "items": [
                                        "Butterflies",
                                        "Nausea or cramps"
                                    ]
                                },
                                {
                                    "id": "energy_temp",
                                    "title": "Energy & Temperature",
                                    "items": [
                                        "Feeling wired or restless",
                                        "Sudden fatigue",
                                        "Sweaty palms"
                                    ]
                                },
                                {
                                    "id": "focus_coord",
                                    "title": "Focus & Coordination",
                                    "items": [
                                        "Tunnel vision",
                                        "Feeling clumsy or out of sync",
                                        "Harder to move smoothly"
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        "id": "a2_s3",
                        "type": "multi_select",
                        "content": {
                            "prompt": "Which physical signs do you notice most when you're stressed?",
                            "options": [
                                {"id": "heartbeat", "label": "Faster heartbeat or breathing"},
                                {"id": "muscles", "label": "Tight or tense muscles"},
                                {"id": "stomach", "label": "Butterflies or stomach issues"},
                                {"id": "energy", "label": "Feeling wired or tired"},
                                {"id": "focus", "label": "Harder to focus or coordinate"},
                                {"id": "other", "label": "Something else"}
                            ],
                            "include_other": True
                        }
                    },
                    {
                        "id": "a2_s4",
                        "type": "static_card",
                        "content": {
                            "body": "Your body isn't doing this randomly.",
                            "subtext": "It's activating your fight-or-flight response.",
                            "follow_up": "This is an ancient survival system designed to help you respond to danger."
                        }
                    },
                    {
                        "id": "a2_s5",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Here's what happens:",
                            "items": [
                                {"id": "step_1", "text": "Your brain perceives a challenge or threat"},
                                {"id": "step_2", "text": "The amygdala (your alarm center) activates"},
                                {"id": "step_3", "text": "Stress hormones (adrenaline, cortisol) are released"},
                                {"id": "step_4", "text": "Your body prepares for action: heart rate up, muscles tense, breathing quickens, focus narrows"}
                            ],
                            "subtext_after_reveal": "This response helped humans survive dangerous situations."
                        }
                    },
                    {
                        "id": "a2_s6",
                        "type": "static_card",
                        "content": {
                            "body": "Your brain still uses this system - even though you're not facing physical danger.",
                            "subtext": "It activates when something feels important and uncertain.",
                            "follow_up": "Like a big game, a tryout, or a high-pressure moment."
                        }
                    },
                    {
                        "id": "a2_s7",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Physical stress can be helpful when:",
                            "items": [
                                {"id": "helpful_1", "text": "You need quick energy and strength"},
                                {"id": "helpful_2", "text": "You need sharp focus and fast reactions"},
                                {"id": "helpful_3", "text": "You need your body activated and ready"}
                            ],
                            "subtext_after_reveal": "This is why you might perform better under pressure than in practice."
                        }
                    },
                    {
                        "id": "a2_s8",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Physical stress becomes unhelpful when:",
                            "items": [
                                {"id": "unhelpful_1", "text": "It's too intense for the situation"},
                                {"id": "unhelpful_2", "text": "It lasts too long without recovery"},
                                {"id": "unhelpful_3", "text": "You interpret it as 'something is wrong with me'"}
                            ],
                            "subtext_after_reveal": "The response is the same - but how you interpret it changes everything."
                        }
                    },
                    {
                        "id": "a2_s9",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Your body isn't betraying you when it feels stressed.",
                            "subtext": "It's trying to help you perform. The skill is learning to regulate that response so it works for you.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a2_s10",
                        "type": "activity_completion",
                        "content": {
                            "title": "Physical stress is your body's way of saying: 'This matters. Get ready.'",
                            "message": "Understanding what's happening helps you work with it instead of fighting it.",
                            "next_activity_hint": "Next: How Stress Shows Up Mentally"
                        }
                    }
                ]
            },
            # ACTIVITY 3: How Stress Shows Up Mentally
            {
                "id": "activity_3",
                "name": "How Stress Shows Up Mentally",
                "description": "Recognize mental impacts of stress with both challenge and threat framings",
                "estimated_minutes": 5,
                "icon": "brain",
                "screens": [
                    {
                        "id": "a3_s1",
                        "type": "static_card",
                        "content": {
                            "body": "Stress affects your mind, too.",
                            "subtext": "Often before you even notice it in your body.",
                            "follow_up": "Let's look at what that feels like."
                        }
                    },
                    {
                        "id": "a3_s2",
                        "type": "tap_reveal_categories",
                        "content": {
                            "header": "Here's how stress can show up mentally:",
                            "categories": [
                                {
                                    "id": "attention_focus",
                                    "title": "Attention & Focus",
                                    "items": [
                                        "Harder to concentrate on the present",
                                        "Getting stuck on mistakes or worried about outcomes",
                                        "Narrowed or scattered attention"
                                    ]
                                },
                                {
                                    "id": "thinking",
                                    "title": "Thinking Patterns",
                                    "items": [
                                        "Increased negative self-talk",
                                        "\"What if\" thoughts",
                                        "Overthinking simple skills"
                                    ]
                                },
                                {
                                    "id": "decisions",
                                    "title": "Decision-Making",
                                    "items": [
                                        "Slower reactions",
                                        "Second-guessing yourself",
                                        "Playing it safe instead of trusting instincts"
                                    ]
                                },
                                {
                                    "id": "emotions",
                                    "title": "Emotions",
                                    "items": [
                                        "Irritability or frustration",
                                        "Feeling overwhelmed",
                                        "Sudden drops in confidence"
                                    ]
                                },
                                {
                                    "id": "memory",
                                    "title": "Memory",
                                    "items": [
                                        "Difficulty remembering cues or plays",
                                        "Trouble adapting on the fly"
                                    ],
                                    "subtext": "This isn't because you forgot - stress temporarily reduces access to what you already know."
                                }
                            ]
                        }
                    },
                    {
                        "id": "a3_s3",
                        "type": "multi_select",
                        "content": {
                            "prompt": "Which mental signs do you notice most when you're stressed?",
                            "options": [
                                {"id": "focus", "label": "Hard to focus or stay present"},
                                {"id": "self_talk", "label": "Negative self-talk or \"what if\" thoughts"},
                                {"id": "overthinking", "label": "Overthinking or second-guessing"},
                                {"id": "overwhelmed", "label": "Feeling irritable or overwhelmed"},
                                {"id": "memory", "label": "Trouble remembering things I know"},
                                {"id": "other", "label": "Something else"}
                            ],
                            "include_other": True
                        }
                    },
                    {
                        "id": "a3_s4",
                        "type": "static_card",
                        "content": {
                            "body": "These mental changes aren't random.",
                            "subtext": "They're part of how your brain responds to pressure.",
                            "follow_up": "And how you interpret them matters."
                        }
                    },
                    {
                        "id": "a3_s5",
                        "type": "static_card",
                        "content": {
                            "body": "The same mental response can feel completely different depending on how you perceive it.",
                            "subtext": "Let's look at both sides."
                        }
                    },
                    {
                        "id": "a3_s6",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "When you see stress as helpful, these mental responses mean:",
                            "items": [
                                {"id": "help_1", "text": "Heightened focus -> \"My brain is locking in on what matters\""},
                                {"id": "help_2", "text": "Increased thinking -> \"My brain is preparing me and scanning for solutions\""},
                                {"id": "help_3", "text": "Self-awareness -> \"I care about doing this well\""},
                                {"id": "help_4", "text": "Emotional intensity -> \"I'm motivated and energized\""},
                                {"id": "help_5", "text": "Caution -> \"I'm being thoughtful under pressure\""}
                            ]
                        }
                    },
                    {
                        "id": "a3_s7",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "When you see stress as harmful, these same responses feel like:",
                            "items": [
                                {"id": "harm_1", "text": "Heightened focus -> \"I can't stop thinking about this\""},
                                {"id": "harm_2", "text": "Increased thinking -> \"I'm overthinking everything\""},
                                {"id": "harm_3", "text": "Self-awareness -> \"I'm too in my head\""},
                                {"id": "harm_4", "text": "Emotional intensity -> \"I'm panicking\""},
                                {"id": "harm_5", "text": "Caution -> \"I'm too scared to commit\""}
                            ]
                        }
                    },
                    {
                        "id": "a3_s8",
                        "type": "static_card",
                        "content": {
                            "body": "The mental response is the same.",
                            "subtext": "What changes is how you interpret what's happening.",
                            "follow_up": "And that interpretation shapes whether stress helps you or holds you back."
                        }
                    },
                    {
                        "id": "a3_s9",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Stress doesn't mean 'I'm not confident' or 'I can't handle pressure.'",
                            "subtext": "Stress means: 'This matters. My brain is preparing me.' The skill is learning to interpret stress as a performance signal, not a threat.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a3_s10",
                        "type": "activity_completion",
                        "content": {
                            "title": "Your mind under stress isn't broken.",
                            "message": "It's doing exactly what it's designed to do. Learning to work with it - instead of against it - is what makes the difference.",
                            "next_activity_hint": "Next: Perception Shapes Impact"
                        }
                    }
                ]
            },
            # ACTIVITY 4: Perception Shapes Impact
            {
                "id": "activity_4",
                "name": "Perception Shapes Impact",
                "description": "Learn that how we perceive stress determines whether it helps or harms us",
                "estimated_minutes": 4,
                "icon": "eye",
                "screens": [
                    {
                        "id": "a4_s1",
                        "type": "static_card",
                        "content": {
                            "body": "Here's one of the most important things to understand about stress:",
                            "subtext": "Stress is not inherently good or bad.",
                            "follow_up": "The impact of stress is shaped by how you perceive it."
                        }
                    },
                    {
                        "id": "a4_s2",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "When you perceive stress as helpful:",
                            "items": [
                                {"id": "helpful", "text": "It can enhance performance, focus, and energy."}
                            ]
                        }
                    },
                    {
                        "id": "a4_s2b",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "When you perceive stress as harmful:",
                            "items": [
                                {"id": "harmful", "text": "It can lead to overwhelm, anxiety, and shutdown."}
                            ]
                        }
                    },
                    {
                        "id": "a4_s3",
                        "type": "static_card",
                        "content": {
                            "body": "The same physical response - like a faster heartbeat - can feel totally different depending on what you tell yourself.",
                            "subtext": "Helpful interpretation: \"My body is getting ready. I'm activated.\"\nHarmful interpretation: \"Something is wrong. I'm panicking.\"",
                            "follow_up": "The sensation is the same. The meaning you give it changes everything."
                        }
                    },
                    {
                        "id": "a4_s4",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "When you feel stressed before a game or performance, what do you usually think?",
                            "options": [
                                {"id": "helpful", "label": "This is helpful - I'm getting ready"},
                                {"id": "bad", "label": "This is bad - something is wrong"},
                                {"id": "depends", "label": "It depends on the situation"},
                                {"id": "not_sure", "label": "I'm not sure"}
                            ]
                        }
                    },
                    {
                        "id": "a4_s5",
                        "type": "static_card",
                        "content": {
                            "body": "There's no right or wrong answer.",
                            "subtext": "Most people see stress as negative because that's what we've been taught.",
                            "follow_up": "But you can learn to see it differently."
                        }
                    },
                    {
                        "id": "a4_s6",
                        "type": "static_card",
                        "content": {
                            "body": "Reframing doesn't mean lying to yourself or pretending stress doesn't exist.",
                            "subtext": "It means choosing to interpret stress as your body and mind preparing you - not threatening you."
                        }
                    },
                    {
                        "id": "a4_s7",
                        "type": "tap_matching",
                        "content": {
                            "prompt": "Match the stress sensation with a helpful reframe:",
                            "items": [
                                {"id": "heart", "text": "Faster heartbeat", "match": "My body is energized and ready"},
                                {"id": "muscles", "text": "Tight muscles", "match": "My body is activated and stable"},
                                {"id": "thoughts", "text": "Racing thoughts", "match": "My brain is preparing and problem-solving"},
                                {"id": "butterflies", "text": "Butterflies", "match": "My body is mobilizing energy"}
                            ],
                            "show_feedback": True
                        }
                    },
                    {
                        "id": "a4_s8",
                        "type": "static_card",
                        "content": {
                            "body": "Changing how you see stress doesn't happen instantly.",
                            "subtext": "But the more you practice reframing, the more natural it becomes.",
                            "follow_up": "And the more stress starts working for you."
                        }
                    },
                    {
                        "id": "a4_s9",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "Next time you notice stress, what will you try to tell yourself?",
                            "options": [
                                {"id": "ready", "text": "My body is getting ready"},
                                {"id": "care", "text": "This means I care"},
                                {"id": "preparing", "text": "Stress is preparing me, not threatening me"},
                                {"id": "handle", "text": "I can handle this"}
                            ],
                            "allow_custom_input": True,
                            "follow_up_prompt": "Something else:"
                        }
                    },
                    {
                        "id": "a4_s10",
                        "type": "activity_completion",
                        "content": {
                            "title": "Perception shapes impact.",
                            "message": "When you see stress as preparation instead of panic, it becomes a tool. That shift is one of the most powerful performance skills you can build.",
                            "next_activity_hint": "Next: Managing Stress - Breathing & Body"
                        }
                    }
                ]
            },
            # ACTIVITY 5: Managing Stress - Breathing & Body
            {
                "id": "activity_5",
                "name": "Managing Stress - Breathing & Body",
                "description": "Practice breathing techniques and body regulation tools",
                "estimated_minutes": 5,
                "icon": "wind",
                "screens": [
                    {
                        "id": "a5_s1",
                        "type": "static_card",
                        "content": {
                            "body": "Now that you understand what stress is and how it works, let's practice managing it.",
                            "subtext": "Managing stress doesn't mean getting rid of it.",
                            "follow_up": "It means regulating it so it works for you instead of against you."
                        }
                    },
                    {
                        "id": "a5_s2",
                        "type": "static_card",
                        "content": {
                            "body": "You don't need more tools - you need the right tool at the right time.",
                            "subtext": "Today, we'll focus on two powerful tools: breathing and body regulation."
                        }
                    },
                    {
                        "id": "a5_s3",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "When you're stressed, your breathing gets faster and shallower.",
                            "items": [
                                {"id": "breath_1", "text": "This tells your brain: 'Keep the alarm on. There's danger.'"},
                                {"id": "breath_2", "text": "When you slow your breathing down, it sends a different signal: 'It's safe. You can calm down.'"}
                            ],
                            "subtext_after_reveal": "Breathing is one of the fastest ways to regulate your nervous system."
                        }
                    },
                    {
                        "id": "a5_s4",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "We're going to practice a breathing technique. Which one sounds most helpful to you?",
                            "options": [
                                {"id": "sigh", "label": "Physiological Sigh (quick reset - 2 inhales, long exhale)"},
                                {"id": "exhale", "label": "Extended Exhale (calm and steady - breathe in for 4, out for 6)"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s5",
                        "type": "conditional_content",
                        "content": {
                            "condition_screen": "a5_s4",
                            "conditions": {
                                "sigh": {
                                    "type": "guided_breathing",
                                    "content": {
                                        "title": "Let's practice the Physiological Sigh together.",
                                        "technique": "physiological_sigh",
                                        "steps": [
                                            "Take a deep breath in through your nose (fill your lungs)",
                                            "Take one more quick breath in (top up your lungs)",
                                            "Exhale slowly and fully through your mouth",
                                            "Repeat 1-3 times"
                                        ],
                                        "subtext": "This technique quickly reduces stress and resets your nervous system.",
                                        "skippable": True,
                                        "audio_option": True
                                    }
                                },
                                "exhale": {
                                    "type": "guided_breathing",
                                    "content": {
                                        "title": "Let's practice Extended Exhale breathing together.",
                                        "technique": "extended_exhale",
                                        "inhale_duration": 4,
                                        "exhale_duration": 6,
                                        "cycles": 4,
                                        "steps": [
                                            "Breathe in through your nose for 4 counts (1...2...3...4)",
                                            "Breathe out through your mouth for 6 counts (1...2...3...4...5...6)",
                                            "Repeat 3-4 times"
                                        ],
                                        "subtext": "Longer exhales activate your body's calm-down system.",
                                        "skippable": True,
                                        "audio_option": True
                                    }
                                }
                            }
                        }
                    },
                    {
                        "id": "a5_s6",
                        "type": "emoji_select",
                        "content": {
                            "prompt": "After that breathing practice, how do you feel?",
                            "options": [
                                {"id": "calmer", "emoji": "calm", "label": "Calmer"},
                                {"id": "relieved", "emoji": "exhale", "label": "Relieved"},
                                {"id": "same", "emoji": "neutral", "label": "About the same"},
                                {"id": "unsure", "emoji": "thinking", "label": "Not sure yet"},
                                {"id": "control", "emoji": "strong", "label": "More in control"}
                            ],
                            "allow_multiple": True
                        }
                    },
                    {
                        "id": "a5_s7",
                        "type": "static_card",
                        "content": {
                            "body": "Breathing isn't the only way to manage stress.",
                            "subtext": "Your body position and muscle tension also send signals to your brain.",
                            "follow_up": "Let's try a quick body regulation tool."
                        }
                    },
                    {
                        "id": "a5_s8",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "Which tool would you like to try?",
                            "options": [
                                {"id": "tension", "label": "Release Tension Scan (notice and release tight muscles)"},
                                {"id": "posture", "label": "Power Posture Reset (stand tall, shoulders back - signal confidence to your brain)"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s9",
                        "type": "conditional_content",
                        "content": {
                            "condition_screen": "a5_s8",
                            "conditions": {
                                "tension": {
                                    "type": "guided_breathing",
                                    "content": {
                                        "title": "Let's practice a Release Tension Scan.",
                                        "technique": "tension_release",
                                        "steps": [
                                            "Notice where you're holding tension (jaw, shoulders, fists, stomach)",
                                            "Take a deep breath in",
                                            "As you breathe out, consciously relax that area",
                                            "Repeat for any other tight spots"
                                        ],
                                        "subtext": "Releasing tension tells your brain: 'You're safe. You can let go.'",
                                        "skippable": True
                                    }
                                },
                                "posture": {
                                    "type": "guided_breathing",
                                    "content": {
                                        "title": "Let's practice a Power Posture Reset.",
                                        "technique": "power_posture",
                                        "steps": [
                                            "Stand or sit up tall",
                                            "Roll your shoulders back and down",
                                            "Lift your chest slightly",
                                            "Take a deep breath and hold this posture for 10 seconds"
                                        ],
                                        "subtext": "Your posture sends signals to your brain. Standing tall can help you feel more confident and in control.",
                                        "skippable": True
                                    }
                                }
                            }
                        }
                    },
                    {
                        "id": "a5_s10",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Use these tools when:",
                            "items": [
                                {"id": "use_1", "text": "You feel overwhelmed or your stress is too intense"},
                                {"id": "use_2", "text": "You notice your body is tight or tense"},
                                {"id": "use_3", "text": "You need a quick reset before or during performance"},
                                {"id": "use_4", "text": "You want to bring your stress level down to a helpful range"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s11",
                        "type": "confirmation_display",
                        "content": {
                            "title": "This week, you'll practice:",
                            "display_from_screens": ["a5_s4", "a5_s8"],
                            "subtext": "Try them when you notice stress building. See what works for you."
                        }
                    },
                    {
                        "id": "a5_s12",
                        "type": "activity_completion",
                        "content": {
                            "title": "Breathing and body regulation are some of the fastest ways to manage stress.",
                            "message": "The more you practice, the easier it becomes to use them when you need them most.",
                            "next_activity_hint": "Next: Managing Stress - Mind Tools"
                        }
                    }
                ]
            },
            # ACTIVITY 6: Managing Stress - Mind Tools
            {
                "id": "activity_6",
                "name": "Managing Stress - Mind Tools",
                "description": "Learn thought labeling and reframing as mental stress management tools",
                "estimated_minutes": 5,
                "icon": "lightbulb",
                "screens": [
                    {
                        "id": "a6_s1",
                        "type": "static_card",
                        "content": {
                            "body": "You've practiced breathing and body regulation.",
                            "subtext": "Now let's explore tools for managing stress in your mind.",
                            "follow_up": "Because sometimes stress shows up as thoughts that feel loud or overwhelming."
                        }
                    },
                    {
                        "id": "a6_s2",
                        "type": "static_card",
                        "content": {
                            "body": "Today, you'll learn two mental tools:",
                            "subtext": "Thought labeling and reframing.",
                            "follow_up": "Both help you manage stress by changing how you relate to your thoughts."
                        }
                    },
                    {
                        "id": "a6_s3",
                        "type": "static_card",
                        "content": {
                            "body": "Thought labeling is a way to create distance between you and your thoughts.",
                            "subtext": "Instead of getting stuck in a thought, you notice it and name it.",
                            "follow_up": "This helps reduce its power over you."
                        }
                    },
                    {
                        "id": "a6_s4",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Here's how it works:",
                            "items": [
                                {"id": "label_1", "text": "Notice the thought: 'What if I mess up?'"},
                                {"id": "label_2", "text": "Label it: 'That's a worry thought' or 'That's my brain being cautious'"},
                                {"id": "label_3", "text": "Let it pass without getting stuck on it"}
                            ],
                            "subtext_after_reveal": "Labeling creates space. It reminds you: you are not your thoughts."
                        }
                    },
                    {
                        "id": "a6_s5",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "Let's practice. If this thought shows up: 'I'm not good enough for this,' how would you label it?",
                            "options": [
                                {"id": "doubt", "label": "That's a doubt thought"},
                                {"id": "critic", "label": "That's my inner critic"},
                                {"id": "fear", "label": "That's fear talking"},
                                {"id": "comparison", "label": "That's a comparison thought"}
                            ],
                            "description": "There's no wrong answer - labeling is personal."
                        }
                    },
                    {
                        "id": "a6_s6",
                        "type": "static_card",
                        "content": {
                            "body": "Use thought labeling when:",
                            "subtext": "You're overthinking or getting stuck in negative thoughts.",
                            "follow_up": "Labeling helps you notice thoughts without being controlled by them."
                        }
                    },
                    {
                        "id": "a6_s7",
                        "type": "static_card",
                        "content": {
                            "body": "Reframing is about changing how you interpret a thought or situation.",
                            "subtext": "You don't ignore stress - you choose to see it differently.",
                            "follow_up": "This can shift stress from feeling threatening to feeling manageable."
                        }
                    },
                    {
                        "id": "a6_s8",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Here's how reframing works:",
                            "items": [
                                {"id": "ex1_orig", "text": "Original thought: \"I'm so nervous - I'm going to mess up\""},
                                {"id": "ex1_reframe", "text": "Reframed: \"I'm nervous because I care. My body is getting ready.\""},
                                {"id": "ex2_orig", "text": "Original thought: \"Everyone is better than me\""},
                                {"id": "ex2_reframe", "text": "Reframed: \"I'm still learning. This is a chance to grow.\""}
                            ],
                            "subtext_after_reveal": "Reframing doesn't eliminate stress - it changes your relationship to it."
                        }
                    },
                    {
                        "id": "a6_s9",
                        "type": "tap_matching",
                        "content": {
                            "prompt": "Match the stressful thought with a helpful reframe:",
                            "items": [
                                {"id": "fail", "text": "What if I fail?", "match": "What if I learn something?"},
                                {"id": "stressed", "text": "I'm too stressed to perform", "match": "Stress means I'm activated and ready"},
                                {"id": "pressure", "text": "I can't handle this pressure", "match": "I've handled pressure before. I can do it again."},
                                {"id": "watching", "text": "Everyone is watching me mess up", "match": "Everyone is focused on the game, not just me"}
                            ],
                            "show_feedback": True
                        }
                    },
                    {
                        "id": "a6_s10",
                        "type": "static_card",
                        "content": {
                            "body": "Use reframing when:",
                            "subtext": "Your thoughts are making stress feel bigger or more threatening than it needs to be.",
                            "follow_up": "Reframing helps you see stress as a tool instead of a problem."
                        }
                    },
                    {
                        "id": "a6_s11",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "Which mental tool will you experiment with this week?",
                            "options": [
                                {"id": "labeling", "label": "Thought Labeling (notice and name my thoughts)"},
                                {"id": "reframing", "label": "Reframing (change how I interpret stress)"},
                                {"id": "both", "label": "Both"}
                            ]
                        }
                    },
                    {
                        "id": "a6_s12",
                        "type": "confirmation_display",
                        "content": {
                            "title": "This week, you'll practice:",
                            "display_from_screens": ["a6_s11"],
                            "subtext": "Try it when stressful thoughts show up. See what helps you manage them."
                        }
                    },
                    {
                        "id": "a6_s13",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Remember: You don't need all the tools all the time. You need the right tool at the right time.",
                            "items": [
                                {"id": "tool_1", "text": "Overwhelmed -> breathing"},
                                {"id": "tool_2", "text": "Tight/tense -> body regulation"},
                                {"id": "tool_3", "text": "Overthinking -> labeling or reframing"}
                            ]
                        }
                    },
                    {
                        "id": "a6_s14",
                        "type": "activity_completion",
                        "content": {
                            "title": "Managing stress is a skill.",
                            "message": "The more you practice these tools, the more control you have over how stress affects you. And that makes all the difference in performance.",
                            "next_activity_hint": None
                        }
                    }
                ]
            }
        ]
    }
}


def upgrade() -> None:
    """Add the Managing Stress training module."""
    module = MANAGING_STRESS_MODULE
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
    """Remove the Managing Stress training module."""
    op.execute(
        sa.text("DELETE FROM training_modules WHERE slug = 'managing-stress'")
    )
