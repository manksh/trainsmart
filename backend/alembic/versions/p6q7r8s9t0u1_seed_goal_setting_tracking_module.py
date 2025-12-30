"""Seed Goal Setting & Tracking training module

Revision ID: p6q7r8s9t0u1
Revises: n4o5p6q7r8s9
Create Date: 2025-12-30

"""
from typing import Sequence, Union
import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json


# revision identifiers, used by Alembic.
revision: str = 'p6q7r8s9t0u1'
down_revision: Union[str, None] = 'n4o5p6q7r8s9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


GOAL_SETTING_MODULE = {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "slug": "goal-setting-tracking",
    "name": "Goal Setting & Tracking",
    "description": "Learn to set effective goals, break them down into actionable steps, and track your progress.",
    "icon": "target",
    "color": "amber",
    "estimated_minutes": 20,
    "status": "active",
    "order_index": 4,
    "is_premium": False,
    "requires_assessment": False,
    "content": {
        "flow_type": "sequential_activities",
        "activities": [
            # ACTIVITY 1: Why Goals Matter
            {
                "id": "activity_1",
                "name": "Why Goals Matter",
                "description": "Understand the importance of goals and how they drive performance",
                "estimated_minutes": 4,
                "icon": "target",
                "screens": [
                    {
                        "id": "a1_s1_intro",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "When you think about your goals in sport, how do you feel?",
                            "options": [
                                {"id": "clear", "label": "Clear - I know exactly what I want"},
                                {"id": "vague", "label": "A bit vague - I have a general idea"},
                                {"id": "overwhelmed", "label": "Overwhelmed - too many things to work on"},
                                {"id": "unsure", "label": "Unsure - I haven't really thought about it"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s2_define",
                        "type": "static_card",
                        "content": {
                            "body": "Goals give your effort direction.",
                            "subtext": "Without goals, training can feel unfocused and progress can be hard to see.",
                            "follow_up": "With goals, you know what you're working toward and why."
                        }
                    },
                    {
                        "id": "a1_s3_benefits",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Goals help you in several ways:",
                            "items": [
                                {"id": "benefit_1", "text": "Focus - they tell you where to direct your energy"},
                                {"id": "benefit_2", "text": "Motivation - they give you something to work toward"},
                                {"id": "benefit_3", "text": "Confidence - achieving them builds belief in yourself"},
                                {"id": "benefit_4", "text": "Progress - they help you see how far you've come"}
                            ],
                            "subtext_after_reveal": "Goals turn effort into progress."
                        }
                    },
                    {
                        "id": "a1_s4_athletes",
                        "type": "static_card",
                        "content": {
                            "body": "Every great athlete sets goals.",
                            "subtext": "Not just big goals like championships - but daily, weekly, and seasonal goals.",
                            "follow_up": "These smaller goals are the steps that lead to bigger achievements."
                        }
                    },
                    {
                        "id": "a1_s5_challenge",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "But setting goals isn't always easy. Common challenges include:",
                            "items": [
                                {"id": "challenge_1", "text": "Goals that are too vague (\"get better\")"},
                                {"id": "challenge_2", "text": "Goals that are too big or too far away"},
                                {"id": "challenge_3", "text": "Not knowing how to break goals into steps"},
                                {"id": "challenge_4", "text": "Losing motivation when progress is slow"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s6_pack_overview",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "This pack will help you:",
                            "items": [
                                {"id": "learn_1", "text": "Understand the difference between outcome and process goals"},
                                {"id": "learn_2", "text": "Set goals that are clear and achievable"},
                                {"id": "learn_3", "text": "Break goals into actionable steps"},
                                {"id": "learn_4", "text": "Track your progress and stay motivated"}
                            ]
                        }
                    },
                    {
                        "id": "a1_s7_completion",
                        "type": "activity_completion",
                        "content": {
                            "title": "Goals matter.",
                            "message": "They give your effort meaning and your training direction. Let's learn how to set goals that actually work.",
                            "next_activity_hint": "Next: Outcome vs Process Goals"
                        }
                    }
                ]
            },
            # ACTIVITY 2: Outcome vs Process Goals
            {
                "id": "activity_2",
                "name": "Outcome vs Process Goals",
                "description": "Learn the difference between outcome and process goals and why both matter",
                "estimated_minutes": 5,
                "icon": "git-branch",
                "screens": [
                    {
                        "id": "a2_s1_intro",
                        "type": "static_card",
                        "content": {
                            "body": "Not all goals are the same.",
                            "subtext": "Understanding the different types helps you set better ones.",
                            "follow_up": "Let's look at two main types: outcome goals and process goals."
                        }
                    },
                    {
                        "id": "a2_s2_outcome_define",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Outcome goals focus on results:",
                            "items": [
                                {"id": "outcome_1", "text": "Win the championship"},
                                {"id": "outcome_2", "text": "Make the starting lineup"},
                                {"id": "outcome_3", "text": "Score 20 points in a game"},
                                {"id": "outcome_4", "text": "Get recruited to a college team"}
                            ],
                            "subtext_after_reveal": "These are about the end result - what you want to achieve."
                        }
                    },
                    {
                        "id": "a2_s3_process_define",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Process goals focus on actions:",
                            "items": [
                                {"id": "process_1", "text": "Practice free throws for 15 minutes daily"},
                                {"id": "process_2", "text": "Review game film twice a week"},
                                {"id": "process_3", "text": "Do my pre-game routine before every match"},
                                {"id": "process_4", "text": "Focus on my breathing when I feel nervous"}
                            ],
                            "subtext_after_reveal": "These are about what you do - the steps you take."
                        }
                    },
                    {
                        "id": "a2_s4_categorize",
                        "type": "category_toggle",
                        "content": {
                            "prompt": "Tap each goal to categorize it:",
                            "categories": [
                                {"id": "outcome", "label": "Outcome"},
                                {"id": "process", "label": "Process"}
                            ],
                            "items": [
                                {"id": "cat_1", "text": "Run a faster 40-yard dash", "correct_category": "outcome"},
                                {"id": "cat_2", "text": "Do sprint drills 3 times per week", "correct_category": "process"},
                                {"id": "cat_3", "text": "Make the All-Star team", "correct_category": "outcome"},
                                {"id": "cat_4", "text": "Study my opponent's tendencies before games", "correct_category": "process"},
                                {"id": "cat_5", "text": "Get a scholarship", "correct_category": "outcome"},
                                {"id": "cat_6", "text": "Take 100 shots after every practice", "correct_category": "process"}
                            ],
                            "show_feedback": True
                        }
                    },
                    {
                        "id": "a2_s5_difference",
                        "type": "static_card",
                        "content": {
                            "body": "Here's the key difference:",
                            "subtext": "Outcome goals are about things you want. Process goals are about things you do.",
                            "follow_up": "You need both - but they serve different purposes."
                        }
                    },
                    {
                        "id": "a2_s6_outcome_pros_cons",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Outcome goals are motivating but:",
                            "items": [
                                {"id": "oc_1", "text": "You can't always control them (opponents, judges, weather)"},
                                {"id": "oc_2", "text": "They can feel far away and overwhelming"},
                                {"id": "oc_3", "text": "Focusing only on outcomes can increase pressure"}
                            ],
                            "subtext_after_reveal": "If you only focus on outcomes, you might lose sight of what you need to do."
                        }
                    },
                    {
                        "id": "a2_s7_process_pros",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Process goals are powerful because:",
                            "items": [
                                {"id": "pc_1", "text": "You have full control over them"},
                                {"id": "pc_2", "text": "They keep you focused on the present"},
                                {"id": "pc_3", "text": "Small wins build momentum and confidence"},
                                {"id": "pc_4", "text": "They're the actual path to achieving outcomes"}
                            ]
                        }
                    },
                    {
                        "id": "a2_s8_balance",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "The best approach: Dream in outcomes. Work in process.",
                            "subtext": "Know what you want to achieve, but focus your daily energy on the steps that get you there.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a2_s9_completion",
                        "type": "activity_completion",
                        "content": {
                            "title": "Both types of goals matter.",
                            "message": "Outcomes give you direction. Process gives you action. Together, they help you improve.",
                            "next_activity_hint": "Next: Setting Effective Goals"
                        }
                    }
                ]
            },
            # ACTIVITY 3: Setting Effective Goals
            {
                "id": "activity_3",
                "name": "Setting Effective Goals",
                "description": "Learn how to set goals that are specific, measurable, and achievable",
                "estimated_minutes": 4,
                "icon": "check-circle",
                "screens": [
                    {
                        "id": "a3_s1_intro",
                        "type": "static_card",
                        "content": {
                            "body": "Knowing the types of goals is important.",
                            "subtext": "But how you set them matters just as much.",
                            "follow_up": "Vague goals lead to vague results."
                        }
                    },
                    {
                        "id": "a3_s2_vague_vs_clear",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Compare these goals:",
                            "items": [
                                {"id": "vague_1", "text": "Vague: \"I want to get better at shooting\""},
                                {"id": "clear_1", "text": "Clear: \"I will make 7 out of 10 free throws consistently\""},
                                {"id": "vague_2", "text": "Vague: \"I want to be faster\""},
                                {"id": "clear_2", "text": "Clear: \"I will improve my 40-yard dash time by 0.2 seconds\""}
                            ],
                            "subtext_after_reveal": "Clear goals give you something specific to work toward."
                        }
                    },
                    {
                        "id": "a3_s3_criteria",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Effective goals are:",
                            "items": [
                                {"id": "criteria_1", "text": "Specific - exactly what you want to achieve"},
                                {"id": "criteria_2", "text": "Measurable - you can track progress"},
                                {"id": "criteria_3", "text": "Achievable - challenging but realistic"},
                                {"id": "criteria_4", "text": "Relevant - connected to what matters to you"},
                                {"id": "criteria_5", "text": "Time-bound - with a target date or timeframe"}
                            ]
                        }
                    },
                    {
                        "id": "a3_s4_example",
                        "type": "static_card",
                        "content": {
                            "body": "Let's see this in action.",
                            "subtext": "Original: \"I want to be more confident\"",
                            "follow_up": "Better: \"I will complete my pre-game routine before every game this month to feel more prepared and confident\""
                        }
                    },
                    {
                        "id": "a3_s5_transform",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "Which is a better version of \"I want to improve my defense\"?",
                            "options": [
                                {"id": "a", "label": "I'll be better at defense"},
                                {"id": "b", "label": "I'll practice defense every day"},
                                {"id": "c", "label": "I'll do 20 minutes of defensive footwork drills 4 times per week for the next month"},
                                {"id": "d", "label": "I want to be the best defender on the team"}
                            ]
                        }
                    },
                    {
                        "id": "a3_s6_feedback",
                        "type": "static_card",
                        "content": {
                            "body": "Option C is the most effective.",
                            "subtext": "It's specific (defensive footwork drills), measurable (20 minutes, 4 times per week), and time-bound (this month).",
                            "follow_up": "This kind of clarity makes it easier to follow through."
                        }
                    },
                    {
                        "id": "a3_s7_stretch_zone",
                        "type": "static_card",
                        "content": {
                            "body": "Remember the stretch zone?",
                            "subtext": "Good goals should push you just outside your comfort zone - challenging enough to grow, but not so hard they feel impossible.",
                            "follow_up": "That's where real improvement happens."
                        }
                    },
                    {
                        "id": "a3_s8_completion",
                        "type": "activity_completion",
                        "content": {
                            "title": "Clarity creates focus.",
                            "message": "The more specific your goal, the easier it is to know what to do and whether you're making progress.",
                            "next_activity_hint": "Next: Setting Your Goal"
                        }
                    }
                ]
            },
            # ACTIVITY 4: Setting Your Goal
            {
                "id": "activity_4",
                "name": "Setting Your Goal",
                "description": "Apply what you've learned to set a real goal with action steps",
                "estimated_minutes": 4,
                "icon": "edit-3",
                "screens": [
                    {
                        "id": "a4_s1_intro",
                        "type": "static_card",
                        "content": {
                            "body": "Now it's your turn.",
                            "subtext": "Let's set a goal that you can actually work on.",
                            "follow_up": "We'll start with what you want to achieve, then break it into steps."
                        }
                    },
                    {
                        "id": "a4_s2_area",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "What area do you want to focus on?",
                            "options": [
                                {"id": "physical", "label": "Physical skills (speed, strength, technique)"},
                                {"id": "mental", "label": "Mental skills (focus, confidence, handling pressure)"},
                                {"id": "tactical", "label": "Tactical skills (decision-making, game awareness)"},
                                {"id": "consistency", "label": "Consistency (showing up, routines, habits)"}
                            ]
                        }
                    },
                    {
                        "id": "a4_s3_goal_input",
                        "type": "text_input",
                        "content": {
                            "prompt": "Write your goal. Be as specific as you can.",
                            "subtext": "What exactly do you want to achieve? Include how you'll measure it and a timeframe.",
                            "placeholder": "I want to..."
                        }
                    },
                    {
                        "id": "a4_s4_process_prompt",
                        "type": "static_card",
                        "content": {
                            "body": "Great. Now let's make it actionable.",
                            "subtext": "What are 2-3 specific things you can do to work toward this goal?",
                            "follow_up": "Think about actions you can control and do regularly."
                        }
                    },
                    {
                        "id": "a4_s5_actions_input",
                        "type": "text_input",
                        "content": {
                            "prompt": "What's one action you'll take to work toward this goal?",
                            "subtext": "Be specific about what, when, and how often.",
                            "placeholder": "I will..."
                        }
                    },
                    {
                        "id": "a4_s6_actions_input_2",
                        "type": "text_input",
                        "content": {
                            "prompt": "What's another action you'll take?",
                            "subtext": "This could be a different drill, habit, or routine.",
                            "placeholder": "I will also..."
                        }
                    },
                    {
                        "id": "a4_s7_obstacle",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "What might get in the way of working on this goal?",
                            "options": [
                                {"id": "time", "label": "Time - finding time to practice"},
                                {"id": "motivation", "label": "Motivation - staying committed"},
                                {"id": "confidence", "label": "Confidence - believing I can do it"},
                                {"id": "resources", "label": "Resources - access to equipment or coaching"},
                                {"id": "other", "label": "Something else"}
                            ]
                        }
                    },
                    {
                        "id": "a4_s8_obstacle_plan",
                        "type": "text_input",
                        "content": {
                            "prompt": "What's one thing you can do if that obstacle shows up?",
                            "subtext": "Having a plan for obstacles makes it easier to keep going.",
                            "placeholder": "If this happens, I will..."
                        }
                    },
                    {
                        "id": "a4_s9_summary",
                        "type": "confirmation_display",
                        "content": {
                            "title": "Your goal plan:",
                            "display_from_screens": ["a4_s3_goal_input", "a4_s5_actions_input", "a4_s6_actions_input_2"],
                            "subtext": "These are the building blocks of your improvement.",
                            "follow_up": "Small, consistent actions lead to big results over time."
                        }
                    },
                    {
                        "id": "a4_s10_completion",
                        "type": "activity_completion",
                        "content": {
                            "title": "You have a plan.",
                            "message": "A goal without action is just a wish. You've just created something you can actually work on.",
                            "next_activity_hint": "Next: Tracking Your Progress"
                        }
                    }
                ]
            },
            # ACTIVITY 5: Tracking Your Progress
            {
                "id": "activity_5",
                "name": "Tracking Your Progress",
                "description": "Learn how to track progress, stay motivated, and adjust when needed",
                "estimated_minutes": 4,
                "icon": "trending-up",
                "screens": [
                    {
                        "id": "a5_s1_intro",
                        "type": "static_card",
                        "content": {
                            "body": "Setting a goal is the first step.",
                            "subtext": "But tracking your progress is what keeps you moving forward.",
                            "follow_up": "Let's talk about how to stay on track."
                        }
                    },
                    {
                        "id": "a5_s2_why_track",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "Tracking progress helps you:",
                            "items": [
                                {"id": "track_1", "text": "See how far you've come (even small wins matter)"},
                                {"id": "track_2", "text": "Stay motivated when progress feels slow"},
                                {"id": "track_3", "text": "Identify what's working and what isn't"},
                                {"id": "track_4", "text": "Adjust your approach when needed"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s3_goal_reminder",
                        "type": "static_card",
                        "content": {
                            "context_display": {
                                "from_screen": "a4_s3_goal_input",
                                "label": "Your goal:",
                                "style": "card"
                            },
                            "body": "Let's think about how to track progress on this goal.",
                            "subtext": "What would tell you that you're making progress?"
                        }
                    },
                    {
                        "id": "a5_s4_tracking_method",
                        "type": "multi_select",
                        "content": {
                            "prompt": "How will you track your progress? Select all that apply:",
                            "options": [
                                {"id": "journal", "label": "Keep a training journal"},
                                {"id": "numbers", "label": "Track numbers (reps, times, scores)"},
                                {"id": "checklist", "label": "Use a checklist for daily/weekly actions"},
                                {"id": "coach", "label": "Check in with a coach or mentor"},
                                {"id": "video", "label": "Review video of my performance"},
                                {"id": "app", "label": "Use an app to track habits"}
                            ],
                            "include_other": True
                        }
                    },
                    {
                        "id": "a5_s5_review_frequency",
                        "type": "single_tap_reflection",
                        "content": {
                            "prompt": "How often will you review your progress?",
                            "options": [
                                {"id": "daily", "label": "Daily"},
                                {"id": "weekly", "label": "Weekly"},
                                {"id": "biweekly", "label": "Every two weeks"},
                                {"id": "monthly", "label": "Monthly"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s6_slow_progress",
                        "type": "static_card",
                        "content": {
                            "body": "Progress isn't always linear.",
                            "subtext": "Some weeks you'll feel like you're flying. Others will feel slow or stuck.",
                            "follow_up": "That's completely normal. It's part of the process."
                        }
                    },
                    {
                        "id": "a5_s7_when_stuck",
                        "type": "tap_reveal_list",
                        "content": {
                            "header": "When progress feels slow, try:",
                            "items": [
                                {"id": "stuck_1", "text": "Look back at where you started - you've probably come further than you think"},
                                {"id": "stuck_2", "text": "Focus on the process, not the outcome"},
                                {"id": "stuck_3", "text": "Break your goal into even smaller steps"},
                                {"id": "stuck_4", "text": "Ask for feedback from a coach or teammate"},
                                {"id": "stuck_5", "text": "Celebrate small wins along the way"}
                            ]
                        }
                    },
                    {
                        "id": "a5_s8_adjust",
                        "type": "static_card",
                        "content": {
                            "body": "It's okay to adjust your goals.",
                            "subtext": "If something isn't working, change your approach. If a goal no longer fits, set a new one.",
                            "follow_up": "Adjusting isn't quitting - it's being smart about your growth."
                        }
                    },
                    {
                        "id": "a5_s9_commitment",
                        "type": "micro_commitment",
                        "content": {
                            "prompt": "What's one thing you'll do this week to start working on your goal?",
                            "options": [
                                {"id": "action_1", "text": "Complete one of my action steps"},
                                {"id": "action_2", "text": "Set up a way to track my progress"},
                                {"id": "action_3", "text": "Share my goal with a coach or teammate"},
                                {"id": "action_4", "text": "Schedule time for goal-focused practice"}
                            ],
                            "allow_custom_input": True,
                            "follow_up_prompt": "Something else:"
                        }
                    },
                    {
                        "id": "a5_s10_commitment_confirm",
                        "type": "micro_commitment_confirmation",
                        "content": {
                            "title": "This week, you'll:",
                            "message_template": "",
                            "encouragement": "Remember: small steps add up. Consistency beats intensity."
                        }
                    },
                    {
                        "id": "a5_s11_final",
                        "type": "full_screen_statement",
                        "content": {
                            "statement": "Goals give your effort meaning.",
                            "subtext": "You now have a goal, a plan, and a way to track your progress. That's more than most athletes do. Now it's time to put it into action.",
                            "style": "insight"
                        }
                    },
                    {
                        "id": "a5_s12_completion",
                        "type": "activity_completion",
                        "content": {
                            "title": "You've completed Goal Setting & Tracking!",
                            "message": "You've learned how to set effective goals, break them into actions, and track your progress. The next step is doing the work. Your future self will thank you.",
                            "next_activity_hint": None
                        }
                    }
                ]
            }
        ]
    }
}


def upgrade() -> None:
    """Add the Goal Setting & Tracking training module."""
    module = GOAL_SETTING_MODULE
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
    """Remove the Goal Setting & Tracking training module."""
    op.execute(
        sa.text("DELETE FROM training_modules WHERE slug = 'goal-setting-tracking'")
    )
