"""Restore conditional_content screens with correct format

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2025-12-29

The previous fix migration replaced conditional_content screens with guided_breathing
as a workaround. This migration restores them to conditional_content with the proper
branching format that matches the TypeScript interface.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers, used by Alembic.
revision: str = 'm3n4o5p6q7r8'
down_revision: Union[str, None] = 'l2m3n4o5p6q7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Correct conditional_content screens with proper branching format
CONDITIONAL_SCREENS = {
    # Activity 5, Screen 5 - Breathing technique choice
    'a5_s5': {
        'type': 'conditional_content',
        'content': {
            'condition_screen': 'a5_s4',
            'conditions': {
                'sigh': {
                    'type': 'guided_breathing',
                    'content': {
                        'title': 'Physiological Sigh',
                        'instruction': 'Take a deep breath in, then a quick second breath to fill your lungs, then exhale slowly.',
                        'timing': {
                            'inhale_seconds': 3,
                            'hold_seconds': 1,
                            'exhale_seconds': 5
                        },
                        'cycles': 3,
                        'skippable': True,
                        'audio_enabled': True
                    }
                },
                'exhale': {
                    'type': 'guided_breathing',
                    'content': {
                        'title': 'Extended Exhale Breathing',
                        'instruction': 'Breathe in through your nose, then slowly exhale through your mouth for longer than you inhaled.',
                        'timing': {
                            'inhale_seconds': 4,
                            'hold_seconds': 0,
                            'exhale_seconds': 6
                        },
                        'cycles': 4,
                        'skippable': True,
                        'audio_enabled': True
                    }
                }
            }
        }
    },
    # Activity 5, Screen 9 - Body regulation choice
    'a5_s9': {
        'type': 'conditional_content',
        'content': {
            'condition_screen': 'a5_s8',
            'conditions': {
                'tension': {
                    'type': 'guided_breathing',
                    'content': {
                        'title': 'Release Tension Scan',
                        'instruction': 'Notice where you are holding tension. As you breathe out, consciously relax that area.',
                        'timing': {
                            'inhale_seconds': 4,
                            'hold_seconds': 2,
                            'exhale_seconds': 6
                        },
                        'cycles': 3,
                        'skippable': True,
                        'audio_enabled': False
                    }
                },
                'posture': {
                    'type': 'guided_breathing',
                    'content': {
                        'title': 'Power Posture Reset',
                        'instruction': 'Stand tall, shoulders back, chest lifted. Hold this confident posture while breathing deeply.',
                        'timing': {
                            'inhale_seconds': 4,
                            'hold_seconds': 4,
                            'exhale_seconds': 4
                        },
                        'cycles': 2,
                        'skippable': True,
                        'audio_enabled': False
                    }
                }
            }
        }
    }
}


def upgrade() -> None:
    """Restore conditional_content screens with correct branching format."""
    conn = op.get_bind()

    # Get the managing-stress module
    result = conn.execute(
        sa.text("SELECT id, content FROM training_modules WHERE slug = 'managing-stress'")
    )
    row = result.fetchone()

    if not row:
        return

    module_id, content = row

    # Parse content
    if isinstance(content, str):
        content = json.loads(content)

    # Fix the specific screens
    for activity in content.get('activities', []):
        for screen in activity.get('screens', []):
            screen_id = screen.get('id')
            if screen_id in CONDITIONAL_SCREENS:
                # Replace with correct conditional_content
                screen['type'] = CONDITIONAL_SCREENS[screen_id]['type']
                screen['content'] = CONDITIONAL_SCREENS[screen_id]['content']

    # Update the module
    conn.execute(
        sa.text("UPDATE training_modules SET content = :content WHERE id = :id"),
        {'content': json.dumps(content), 'id': module_id}
    )


def downgrade() -> None:
    """Revert to guided_breathing screens (workaround)."""
    conn = op.get_bind()

    # Get the managing-stress module
    result = conn.execute(
        sa.text("SELECT id, content FROM training_modules WHERE slug = 'managing-stress'")
    )
    row = result.fetchone()

    if not row:
        return

    module_id, content = row

    # Parse content
    if isinstance(content, str):
        content = json.loads(content)

    # Revert to guided_breathing (simplified version)
    for activity in content.get('activities', []):
        for screen in activity.get('screens', []):
            screen_id = screen.get('id')
            if screen_id == 'a5_s5':
                screen['type'] = 'guided_breathing'
                screen['content'] = {
                    'title': "Let's practice calming your nervous system",
                    'instruction': "Follow along with this breathing exercise.",
                    'timing': {
                        'inhale_seconds': 4,
                        'hold_seconds': 0,
                        'exhale_seconds': 6
                    },
                    'cycles': 3,
                    'skippable': True,
                    'audio_enabled': True
                }
            elif screen_id == 'a5_s9':
                screen['type'] = 'guided_breathing'
                screen['content'] = {
                    'title': "Body Regulation Exercise",
                    'instruction': "Notice and release tension in your body.",
                    'timing': {
                        'inhale_seconds': 4,
                        'hold_seconds': 2,
                        'exhale_seconds': 6
                    },
                    'cycles': 2,
                    'skippable': True,
                    'audio_enabled': False
                }

    # Update the module
    conn.execute(
        sa.text("UPDATE training_modules SET content = :content WHERE id = :id"),
        {'content': json.dumps(content), 'id': module_id}
    )
