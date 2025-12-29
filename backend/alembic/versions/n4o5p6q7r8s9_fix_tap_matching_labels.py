"""Fix tap_matching target labels

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
Create Date: 2025-12-29

The previous fix migration set target labels to empty strings.
This migration sets them to the correct reframe text.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers, used by Alembic.
revision: str = 'n4o5p6q7r8s9'
down_revision: Union[str, None] = 'm3n4o5p6q7r8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Correct tap_matching targets with proper labels from original content
TAP_MATCHING_FIXES = {
    # Activity 4, Screen 7 - Stress sensation reframes
    'a4_s7': {
        'targets': [
            {'id': 'target_heart', 'label': 'My body is energized and ready'},
            {'id': 'target_muscles', 'label': 'My body is activated and stable'},
            {'id': 'target_thoughts', 'label': 'My brain is preparing and problem-solving'},
            {'id': 'target_butterflies', 'label': 'My body is mobilizing energy'},
        ]
    },
    # Activity 6, Screen 9 - Stressful thought reframes
    'a6_s9': {
        'targets': [
            {'id': 'target_fail', 'label': 'What if I learn something?'},
            {'id': 'target_stressed', 'label': 'Stress means I am activated and ready'},
            {'id': 'target_pressure', 'label': 'I have handled pressure before. I can do it again.'},
            {'id': 'target_watching', 'label': 'Everyone is focused on the game, not just me'},
        ]
    }
}


def upgrade() -> None:
    """Fix tap_matching target labels."""
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

    # Fix the tap_matching screens
    for activity in content.get('activities', []):
        for screen in activity.get('screens', []):
            screen_id = screen.get('id')
            if screen_id in TAP_MATCHING_FIXES and screen.get('type') == 'tap_matching':
                screen['content']['targets'] = TAP_MATCHING_FIXES[screen_id]['targets']

    # Update the module
    conn.execute(
        sa.text("UPDATE training_modules SET content = :content WHERE id = :id"),
        {'content': json.dumps(content), 'id': module_id}
    )


def downgrade() -> None:
    """Revert to empty labels (not recommended)."""
    pass
