"""Fix activity_3 missing prompts

Revision ID: g6h7i8j9k0l1
Revises: f5g6h7i8j9k0
Create Date: 2025-12-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers, used by Alembic.
revision: str = 'g6h7i8j9k0l1'
down_revision: Union[str, None] = 'f5g6h7i8j9k0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add prompts to activity_3 (Try a Different Outcome)."""
    conn = op.get_bind()

    # Get the current module content
    result = conn.execute(
        sa.text("SELECT id, content FROM training_modules WHERE slug = 'being-human'")
    )
    row = result.fetchone()

    if row:
        module_id, content = row

        # Find and update activity_3
        for section in content.get('sections', []):
            if section.get('type') == 'activity_sequence':
                for activity in section.get('activities', []):
                    if activity.get('id') == 'activity_3':
                        activity['prompts'] = {
                            "event": "What was the event? (Use the same event from your previous activity)",
                            "alternative_thought": "What's a different, more helpful thought you could have?",
                            "new_emotion": "How might you feel with this new thought?",
                            "new_action": "What might you do differently?"
                        }
                        activity['instruction'] = "Using the same event from before, imagine a different thought. How might that change the emotion and action?"

        # Update the module content
        conn.execute(
            sa.text("UPDATE training_modules SET content = CAST(:content AS jsonb) WHERE id = CAST(:module_id AS uuid)"),
            {"content": json.dumps(content), "module_id": str(module_id)}
        )


def downgrade() -> None:
    """Remove prompts from activity_3."""
    conn = op.get_bind()

    result = conn.execute(
        sa.text("SELECT id, content FROM training_modules WHERE slug = 'being-human'")
    )
    row = result.fetchone()

    if row:
        module_id, content = row

        for section in content.get('sections', []):
            if section.get('type') == 'activity_sequence':
                for activity in section.get('activities', []):
                    if activity.get('id') == 'activity_3':
                        if 'prompts' in activity:
                            del activity['prompts']

        conn.execute(
            sa.text("UPDATE training_modules SET content = CAST(:content AS jsonb) WHERE id = CAST(:module_id AS uuid)"),
            {"content": json.dumps(content), "module_id": str(module_id)}
        )
