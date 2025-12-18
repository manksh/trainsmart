"""Seed About Performance training module

Revision ID: h8i9j0k1l2m3
Revises: g6h7i8j9k0l1
Create Date: 2025-12-18

"""
from typing import Sequence, Union
import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json


# revision identifiers, used by Alembic.
revision: str = 'h8i9j0k1l2m3'
down_revision: Union[str, None] = 'g6h7i8j9k0l1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ABOUT_PERFORMANCE_MODULE = {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "slug": "about-performance",
    "name": "About Performance",
    "description": "Understand why performance feels hard and learn to work with discomfort.",
    "icon": "target",
    "color": "purple",
    "estimated_minutes": 25,
    "status": "active",
    "order_index": 1,
    "is_premium": False,
    "requires_assessment": False,
    "content": {
        "flow_type": "sequential_activities",
        "activities": [
            {
                "id": "activity_1",
                "name": "Why Performance Feels Hard",
                "description": "Orientation and normalization",
                "estimated_minutes": 4,
                "icon": "target",
                "screens": [
                    {
                        "id": "a1_s1",
                        "type": "swipe_card",
                        "content": {
                            "body": "Pursuing high performance often feels uncomfortable, frustrating, or mentally hard."
                        }
                    },
                    {
                        "id": "a1_s2",
                        "type": "swipe_card",
                        "content": {
                            "body": "This happens even for skilled, motivated athletes.",
                            "subtext": "It's not a flaw."
                        }
                    },
                    {
                        "id": "a1_s3",
                        "type": "swipe_card",
                        "content": {
                            "body": "And it's not a lack of toughness."
                        }
                    },
                    {
                        "id": "a1_s4",
                        "type": "swipe_card",
                        "content": {
                            "body": "It's the result of how the human brain is wired.",
                            "subtext": "Your brain wasn't designed for constant improvement. It was designed for survival."
                        }
                    },
                    {
                        "id": "a1_s5",
                        "type": "swipe_card",
                        "content": {
                            "body": "This pack helps you understand why performance feels hard, what's happening in your brain, and how to work with it instead of fighting it."
                        }
                    },
                    {
                        "id": "a1_s6",
                        "type": "swipe_card",
                        "content": {
                            "body": "The goal isn't to push harder or ignore discomfort.",
                            "follow_up": "It's to build sustainable high performance — grounded in awareness, skills, and overall well-being."
                        }
                    },
                    {
                        "id": "a1_s7",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "So what's actually going on?",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a1_s8",
                        "type": "tap_reveal_columns",
                        "content": {
                            "header": "How your brain is wired — and what performance asks of you",
                            "left_column": {
                                "title": "Your Brain",
                                "items": [
                                    "Seeks comfort",
                                    "Watches for risk",
                                    "Wants to fit in"
                                ]
                            },
                            "right_column": {
                                "title": "Performance Requires",
                                "items": [
                                    {"id": "r1", "text": "Growth often feels uncomfortable"},
                                    {"id": "r2", "text": "Learning requires mistakes"},
                                    {"id": "r3", "text": "Progress sometimes means standing out"}
                                ]
                            }
                        }
                    },
                    {
                        "id": "a1_s9",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "This tension is normal.",
                            "subtext": "It's why getting better often feels hard.",
                            "style": "reassurance"
                        }
                    },
                    {
                        "id": "a1_s10",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "Which of these do you notice most?",
                            "options": [
                                {"id": "opt_comfort", "label": "Avoiding discomfort"},
                                {"id": "opt_mistakes", "label": "Fixating on mistakes"},
                                {"id": "opt_safe", "label": "Playing it safe"},
                                {"id": "opt_unsure", "label": "Not sure yet"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s11",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "What you're experiencing is normal.",
                            "subtext": "It's part of learning how to perform at your best.",
                            "style": "reassurance"
                        }
                    },
                    {
                        "id": "a1_s12",
                        "type": "swipe_card",
                        "content": {
                            "body": "Next, we'll look at the first tension more closely:",
                            "follow_up": "Why discomfort shows up — and how athletes learn to work with it."
                        }
                    }
                ]
            },
            {
                "id": "activity_2",
                "name": "Working With Discomfort",
                "description": "Comfort-seeking and growth",
                "estimated_minutes": 5,
                "icon": "layers",
                "screens": [
                    {
                        "id": "a2_s1",
                        "type": "swipe_card",
                        "content": {
                            "body": "One reason performance feels hard is because your brain seeks comfort.",
                            "subtext": "Comfort feels safe, familiar, and predictable."
                        }
                    },
                    {
                        "id": "a2_s2",
                        "type": "swipe_card",
                        "content": {
                            "body": "Comfort isn't bad.",
                            "follow_up": "It helps you recover, stay regulated, and feel secure.",
                            "subtext": "We need comfort — just not all the time."
                        }
                    },
                    {
                        "id": "a2_s3",
                        "type": "swipe_card",
                        "content": {
                            "body": "But staying comfortable too often can slow improvement.",
                            "subtext": "Getting better usually means doing things you're not great at yet."
                        }
                    },
                    {
                        "id": "a2_s4",
                        "type": "zone_diagram",
                        "content": {
                            "title": "The Comfort–Stretch–Danger Zones",
                            "instruction": "Tap each zone to learn more",
                            "zones": [
                                {
                                    "id": "comfort",
                                    "label": "Comfort Zone",
                                    "description": "You know what you're doing. Helpful for recovery and confidence.",
                                    "color": "green"
                                },
                                {
                                    "id": "stretch",
                                    "label": "Stretch Zone",
                                    "description": "You're learning something new. It feels uncomfortable, but doable.",
                                    "color": "blue"
                                },
                                {
                                    "id": "danger",
                                    "label": "Danger Zone",
                                    "description": "The challenge is too big or too fast. This can lead to overwhelm or shutdown.",
                                    "color": "red"
                                }
                            ]
                        }
                    },
                    {
                        "id": "a2_s5",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "Thinking about your training right now, where do you feel you are most often?",
                            "options": [
                                {"id": "zone_comfort", "label": "Comfort zone"},
                                {"id": "zone_stretch", "label": "Stretch zone"},
                                {"id": "zone_danger", "label": "Danger zone"},
                                {"id": "zone_mix", "label": "A mix"}
                            ]
                        }
                    },
                    {
                        "id": "a2_s6",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Most improvement happens in the stretch zone.",
                            "subtext": "Not easy. Not overwhelming. Just challenging enough.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a2_s7",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "What's one small way you could nudge yourself into the stretch zone?",
                            "options": [
                                {"id": "mc_skill", "text": "Try a small new skill"},
                                {"id": "mc_avoid", "text": "Practice something I usually avoid"},
                                {"id": "mc_feedback", "text": "Ask for feedback"},
                                {"id": "mc_stay", "text": "Stay with discomfort a little longer"}
                            ],
                            "follow_up_prompt": "Let's get specific for you:",
                            "allow_custom_input": True
                        }
                    },
                    {
                        "id": "a2_s8",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Stretching often feels uncomfortable.",
                            "subtext": "But that stretch zone is where magic happens!",
                            "follow_up": "Improvement usually requires nudging into this zone on purpose.",
                            "style": "reassurance"
                        }
                    },
                    {
                        "id": "a2_s9",
                        "type": "micro_commitment_confirmation",
                        "content": {
                            "title": "Your Stretch Commitment",
                            "message_template": "This week, you're choosing to stretch by:",
                            "encouragement": "Small, intentional steps add up."
                        }
                    }
                ]
            },
            {
                "id": "activity_3",
                "name": "Why Your Brain Zooms in on Negatives",
                "description": "Negativity bias",
                "estimated_minutes": 5,
                "icon": "alert-circle",
                "screens": [
                    {
                        "id": "a3_s1",
                        "type": "swipe_card",
                        "content": {
                            "body": "Another reason performance feels hard is because your brain focuses on negatives.",
                            "subtext": "Mistakes, risks, and what could go wrong grab your attention fast."
                        }
                    },
                    {
                        "id": "a3_s2",
                        "type": "swipe_card",
                        "content": {
                            "body": "This isn't pessimism.",
                            "follow_up": "It's survival wiring.",
                            "subtext": "Your brain is doing what it was designed to do."
                        }
                    },
                    {
                        "id": "a3_s3",
                        "type": "swipe_card",
                        "content": {
                            "body": "Thousands of years ago, paying attention to danger kept humans alive.",
                            "follow_up": "If you missed a threat — like a sabre-tooth tiger — the consequences were serious."
                        }
                    },
                    {
                        "id": "a3_s4",
                        "type": "swipe_card",
                        "content": {
                            "body": "Today, the threats are different.",
                            "subtext": "But your brain still reacts like danger is right around the corner."
                        }
                    },
                    {
                        "id": "a3_s5",
                        "type": "recognition_list",
                        "content": {
                            "title": "This can show up as:",
                            "instruction": "Tap any that feel familiar",
                            "items": [
                                {"id": "neg_fixate", "text": "Fixating on one mistake"},
                                {"id": "neg_replay", "text": "Replaying errors in your head"},
                                {"id": "neg_forget", "text": "Forgetting what you're doing well"},
                                {"id": "neg_wrong", "text": "Feeling like everything is going wrong"}
                            ]
                        }
                    },
                    {
                        "id": "a3_s6",
                        "type": "swipe_card",
                        "content": {
                            "body": "When your brain zooms in on a mistake, it doesn't stop there.",
                            "subtext": "That alarm can quickly affect what you think, how you feel, and what you do next.",
                            "follow_up": "If the alarm is too loud, it can pull the whole chain off track — even when a lot is going right."
                        }
                    },
                    {
                        "id": "a3_s7",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "After a practice or game, what does your mental highlight reel usually show you?",
                            "options": [
                                {"id": "reel_mistakes", "label": "Mostly mistakes"},
                                {"id": "reel_few", "label": "A few mistakes on repeat"},
                                {"id": "reel_mix", "label": "A mix of good and bad"},
                                {"id": "reel_good", "label": "Mostly what went well"}
                            ]
                        }
                    },
                    {
                        "id": "a3_s8",
                        "type": "swipe_card",
                        "content": {
                            "body": "Mistakes are information.",
                            "subtext": "Your brain treats them like an emergency instead of data.",
                            "follow_up": "The goal isn't to ignore mistakes. It's to put them in context. Data helps you adjust. Panic doesn't."
                        }
                    },
                    {
                        "id": "a3_s9",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "What's one way you could help your brain see the full picture?",
                            "options": [
                                {"id": "mc_well", "text": "Name one thing that went well"},
                                {"id": "mc_limit", "text": "Limit how long I replay mistakes"},
                                {"id": "mc_refocus", "text": "Refocus on the next action"},
                                {"id": "mc_write", "text": "Write down one learning, then move on"}
                            ]
                        }
                    },
                    {
                        "id": "a3_s10",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "When you make a mistake, your brain sounds an alarm.",
                            "subtext": "That alarm is natural — it's your brain trying to protect you.",
                            "follow_up": "Learning to balance that response is a skill that helps you perform.",
                            "style": "reassurance"
                        }
                    },
                    {
                        "id": "a3_s11",
                        "type": "micro_commitment_confirmation",
                        "content": {
                            "title": "Your Balance Strategy",
                            "message_template": "Next time, you'll try to:",
                            "encouragement": "Small shifts in attention can change how performance feels."
                        }
                    }
                ]
            },
            {
                "id": "activity_4",
                "name": "Belonging, Standing Out, and Performance",
                "description": "The need to fit in vs. the courage to grow",
                "estimated_minutes": 5,
                "icon": "users",
                "screens": [
                    {
                        "id": "a4_s1",
                        "type": "swipe_card",
                        "content": {
                            "body": "Another reason performance feels hard is because your brain wants you to fit in.",
                            "follow_up": "Belonging matters to humans — especially when something feels important."
                        }
                    },
                    {
                        "id": "a4_s2",
                        "type": "swipe_card",
                        "content": {
                            "body": "Wanting to belong isn't weakness.",
                            "subtext": "It's part of being human.",
                            "follow_up": "Standing out doesn't always mean being loud or bold. Sometimes it's quietly committing to your process — even when it feels uncomfortable."
                        }
                    },
                    {
                        "id": "a4_s3",
                        "type": "swipe_card",
                        "content": {
                            "body": "Standing out can feel uncomfortable.",
                            "subtext": "Your brain may read it as a safety signal.",
                            "follow_up": "That doesn't mean something is wrong — it means your brain is paying attention."
                        }
                    },
                    {
                        "id": "a4_s4",
                        "type": "recognition_list",
                        "content": {
                            "title": "This can show up as:",
                            "instruction": "Tap any that feel familiar",
                            "items": [
                                {"id": "belong_hold", "text": "Holding back instead of fully committing"},
                                {"id": "belong_avoid", "text": "Avoiding mistakes in front of others"},
                                {"id": "belong_safe", "text": "Playing it safe instead of trying something new"},
                                {"id": "belong_worry", "text": "Worrying about how you look"},
                                {"id": "belong_tense", "text": "Tension in your body"},
                                {"id": "belong_racing", "text": "Racing thoughts"}
                            ]
                        }
                    },
                    {
                        "id": "a4_s5",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Wanting to fit in is natural.",
                            "subtext": "It can make stepping outside your comfort zone feel harder than it needs to.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a4_s6",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "When you start to worry about fitting in, how does it usually show up for you?",
                            "options": [
                                {"id": "fit_hesitate", "label": "I hesitate or hold back"},
                                {"id": "fit_tense", "label": "My body feels tense"},
                                {"id": "fit_overthink", "label": "I overthink what I'm doing"},
                                {"id": "fit_blend", "label": "I try to blend in"},
                                {"id": "fit_none", "label": "I don't notice it much"}
                            ]
                        }
                    },
                    {
                        "id": "a4_s7",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "What's one small way you could commit more fully, even if it feels uncomfortable?",
                            "options": [
                                {"id": "mc_breath", "text": "Take a breath and stay with it"},
                                {"id": "mc_next", "text": "Focus on the next action"},
                                {"id": "mc_prep", "text": "Remind myself of my preparation"},
                                {"id": "mc_progress", "text": "Focus on progress rather than perfection"},
                                {"id": "mc_ask", "text": "Ask a question or for feedback"}
                            ]
                        }
                    },
                    {
                        "id": "a4_s8",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Wanting to fit in is part of being human.",
                            "subtext": "Feeling uncomfortable when you step outside that doesn't mean you're doing it wrong.",
                            "follow_up": "It means you're noticing something important.",
                            "style": "reassurance"
                        }
                    },
                    {
                        "id": "a4_s9",
                        "type": "micro_commitment_confirmation",
                        "content": {
                            "title": "Your Commitment",
                            "message_template": "You've chosen to practice:",
                            "encouragement": "Small steps are how confidence grows."
                        }
                    },
                    {
                        "id": "a4_s10",
                        "type": "swipe_card",
                        "content": {
                            "body": "Belonging will always matter.",
                            "subtext": "So will growth.",
                            "follow_up": "Learning to notice this tension — and choose intentionally — helps you show up more fully over time."
                        }
                    }
                ]
            },
            {
                "id": "activity_5",
                "name": "Working With What's Hard",
                "description": "Integration and capstone",
                "estimated_minutes": 5,
                "icon": "award",
                "screens": [
                    {
                        "id": "a5_s1",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Getting better feels hard for a few common reasons.",
                            "subtext": "Not because you're doing it wrong — but because you're human.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a5_s2",
                        "type": "recognition_list",
                        "content": {
                            "title": "Most challenges in performance come from one of these:",
                            "instruction": "Review the three tensions",
                            "items": [
                                {"id": "tension_comfort", "text": "Comfort — avoiding discomfort"},
                                {"id": "tension_negatives", "text": "Negatives — fixating on mistakes"},
                                {"id": "tension_belonging", "text": "Belonging — holding back to fit in"}
                            ],
                            "footer": "These often overlap."
                        }
                    },
                    {
                        "id": "a5_s3",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "Which one shows up most for you when things feel hard?",
                            "options": [
                                {"id": "main_comfort", "label": "Comfort", "description": "Avoiding what feels uncomfortable"},
                                {"id": "main_negatives", "label": "Negatives", "description": "Getting stuck on mistakes"},
                                {"id": "main_belonging", "label": "Belonging", "description": "Worrying about fitting in"},
                                {"id": "main_depends", "label": "It depends on the situation"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s4",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "There's no 'best' or 'worst' answer here.",
                            "subtext": "Everyone experiences all three at different times.",
                            "follow_up": "What matters is noticing which one is driving the moment.",
                            "style": "reassurance"
                        }
                    },
                    {
                        "id": "a5_s5",
                        "type": "swipe_card",
                        "content": {
                            "body": "When one of these tensions takes over, it can shape your reaction.",
                            "subtext": "Your thoughts, emotions, and actions often follow.",
                            "follow_up": "Awareness gives you options."
                        }
                    },
                    {
                        "id": "a5_s6",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "When things feel hard, what helps you respond more intentionally?",
                            "options": [
                                {"id": "mc_pause", "text": "Pause and breathe"},
                                {"id": "mc_refocus", "text": "Refocus on the next action"},
                                {"id": "mc_reframe", "text": "Reframe the situation"},
                                {"id": "mc_present", "text": "Stay present with discomfort"},
                                {"id": "mc_support", "text": "Ask for support or feedback"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s7",
                        "type": "micro_commitment_confirmation",
                        "content": {
                            "title": "Your Go-To Response",
                            "message_template": "One thing I want to practice when this shows up is:",
                            "encouragement": "You don't need to eliminate discomfort to perform well. You just need to learn how to work with it."
                        }
                    },
                    {
                        "id": "a5_s8",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Performance isn't about feeling comfortable all the time.",
                            "subtext": "It's about staying engaged — even when things feel hard.",
                            "follow_up": "That's a skill. And skills can be learned.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a5_s9",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "You've completed About Performance!",
                            "subtext": "Keep practicing. Small steps lead to big changes.",
                            "style": "reassurance"
                        }
                    }
                ]
            }
        ]
    }
}


def upgrade() -> None:
    """Add the About Performance training module."""
    module = ABOUT_PERFORMANCE_MODULE
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
    """Remove the About Performance training module."""
    op.execute(
        sa.text("DELETE FROM training_modules WHERE slug = 'about-performance'")
    )
