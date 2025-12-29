"""Fix tap_reveal_categories, tap_matching, and conditional_content data format

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2025-12-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers, used by Alembic.
revision: str = 'l2m3n4o5p6q7'
down_revision: Union[str, None] = 'k1l2m3n4o5p6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Mapping of technique names to proper GuidedBreathingContent timing
TECHNIQUE_TIMING = {
    "physiological_sigh": {
        "title": "Physiological Sigh",
        "instruction": "Take a deep breath in, then a quick second breath to fill your lungs, then exhale slowly.",
        "timing": {
            "inhale_seconds": 3,
            "hold_seconds": 1,
            "exhale_seconds": 5
        },
        "cycles": 3,
        "skippable": True,
        "audio_enabled": True
    },
    "extended_exhale": {
        "title": "Extended Exhale Breathing",
        "instruction": "Breathe in through your nose, then slowly exhale through your mouth for longer than you inhaled.",
        "timing": {
            "inhale_seconds": 4,
            "hold_seconds": 0,
            "exhale_seconds": 6
        },
        "cycles": 4,
        "skippable": True,
        "audio_enabled": True
    },
    "tension_release": {
        "title": "Release Tension Scan",
        "instruction": "Notice where you're holding tension. As you breathe out, consciously relax that area.",
        "timing": {
            "inhale_seconds": 4,
            "hold_seconds": 2,
            "exhale_seconds": 6
        },
        "cycles": 3,
        "skippable": True,
        "audio_enabled": False
    },
    "power_posture": {
        "title": "Power Posture Reset",
        "instruction": "Stand tall, shoulders back, chest lifted. Hold this confident posture while breathing deeply.",
        "timing": {
            "inhale_seconds": 4,
            "hold_seconds": 4,
            "exhale_seconds": 4
        },
        "cycles": 2,
        "skippable": True,
        "audio_enabled": False
    }
}


def fix_guided_breathing_content(content: dict) -> dict:
    """Convert old guided_breathing format to new format."""
    technique = content.get('technique', 'extended_exhale')

    # Use pre-defined timing if technique is known
    if technique in TECHNIQUE_TIMING:
        return TECHNIQUE_TIMING[technique]

    # Otherwise, try to extract from old format
    return {
        "title": content.get('title', 'Breathing Exercise'),
        "instruction": content.get('subtext', ''),
        "timing": {
            "inhale_seconds": content.get('inhale_duration', 4),
            "hold_seconds": 0,
            "exhale_seconds": content.get('exhale_duration', 6)
        },
        "cycles": content.get('cycles', 3),
        "skippable": content.get('skippable', True),
        "audio_enabled": content.get('audio_option', True)
    }


def upgrade() -> None:
    """Fix screen data formats for tap_reveal_categories, tap_matching, and conditional_content."""
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

    # Fix screens
    for activity in content.get('activities', []):
        for screen in activity.get('screens', []):
            screen_type = screen.get('type')
            screen_content = screen.get('content', {})

            if screen_type == 'tap_reveal_categories':
                # Add reveal_mode if missing
                if 'reveal_mode' not in screen_content:
                    screen_content['reveal_mode'] = 'sequential'

                # Fix categories items format - convert strings to objects
                for category in screen_content.get('categories', []):
                    items = category.get('items', [])
                    fixed_items = []
                    for i, item in enumerate(items):
                        if isinstance(item, str):
                            # Convert string to object format
                            fixed_items.append({
                                'id': f"{category['id']}_{i+1}",
                                'text': item
                            })
                        else:
                            # Already in correct format
                            fixed_items.append(item)
                    category['items'] = fixed_items

            elif screen_type == 'tap_matching':
                # Fix tap_matching format:
                # - items have 'match' but need 'correct_match' referencing target id
                # - missing 'targets' array
                items = screen_content.get('items', [])

                # Check if already fixed
                if 'targets' in screen_content:
                    continue

                targets = []
                fixed_items = []

                for item in items:
                    match_text = item.get('match', '')
                    target_id = f"target_{item['id']}"

                    # Create target
                    targets.append({
                        'id': target_id,
                        'label': match_text
                    })

                    # Fix item to reference target
                    fixed_items.append({
                        'id': item['id'],
                        'text': item['text'],
                        'correct_match': target_id
                    })

                screen_content['items'] = fixed_items
                screen_content['targets'] = targets

            elif screen_type == 'conditional_content':
                # Fix conditional_content: convert old guided_breathing format in branches
                conditions = screen_content.get('conditions', {})

                for key, branch in conditions.items():
                    if branch.get('type') == 'guided_breathing':
                        branch_content = branch.get('content', {})
                        # Fix the GuidedBreathingContent format
                        branch['content'] = fix_guided_breathing_content(branch_content)

    # Update the module
    conn.execute(
        sa.text("UPDATE training_modules SET content = :content WHERE id = :id"),
        {'content': json.dumps(content), 'id': module_id}
    )


def downgrade() -> None:
    """Revert format changes."""
    # No need to revert - both formats could work if component handles them
    pass
