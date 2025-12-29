"""
Seed script for the Mental Performance Assessment.

Based on the MPA - Sheet1.csv data file.
Run with: python -m app.seeds.assessment_seed
"""

import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.assessment import Assessment


# 48-question Mental Performance Assessment
VOLLEYBALL_ASSESSMENT_QUESTIONS = [
    {"id": 1, "text": "It's hard for me to notice my thoughts.", "pillar": "Mindfulness", "secondary_pillar": None, "is_reverse": True, "category": "thinking"},
    {"id": 2, "text": "I'm good at noticing my feelings and emotions.", "pillar": "Mindfulness", "secondary_pillar": None, "is_reverse": False, "category": "feeling"},
    {"id": 3, "text": "I notice myself doing things without paying attention to them.", "pillar": "Mindfulness", "secondary_pillar": None, "is_reverse": True, "category": "acting"},
    {"id": 4, "text": "I can notice my thoughts without letting them affect how I feel.", "pillar": "Mindfulness", "secondary_pillar": None, "is_reverse": False, "category": "thinking"},
    {"id": 5, "text": "It's hard for me notice my feelings without letting them control what I do.", "pillar": "Mindfulness", "secondary_pillar": None, "is_reverse": True, "category": "feeling"},
    {"id": 6, "text": "I don't get very frustrated or upset when I make mistakes.", "pillar": "Mindfulness", "secondary_pillar": None, "is_reverse": False, "category": "acting"},
    {"id": 7, "text": "It's common that thoughts get stuck in my head.", "pillar": "Mindfulness", "secondary_pillar": None, "is_reverse": False, "category": "thinking"},
    {"id": 8, "text": "When I have strong feelings, they only last a short period of time.", "pillar": "Mindfulness", "secondary_pillar": None, "is_reverse": False, "category": "feeling"},
    {"id": 9, "text": "I can boost my confidence when I need to.", "pillar": "Confidence", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 10, "text": "I'm aware of the situations that challenge my confidence.", "pillar": "Confidence", "secondary_pillar": "Self-Awareness", "is_reverse": False, "category": None},
    {"id": 11, "text": "I'm confident in my skills and abilities as an athlete.", "pillar": "Confidence", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 12, "text": "I'm confident I will achieve my goals.", "pillar": "Confidence", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 13, "text": "I lose confidence after a disappointing performance.", "pillar": "Confidence", "secondary_pillar": None, "is_reverse": True, "category": None},
    {"id": 14, "text": "I'm driven to learn and master new things.", "pillar": "Motivation", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 15, "text": "I care a lot about what others think of me.", "pillar": "Motivation", "secondary_pillar": None, "is_reverse": True, "category": None},
    {"id": 16, "text": "I do hard things even when I don't feel like it.", "pillar": "Motivation", "secondary_pillar": None, "is_reverse": False, "category": "acting"},
    {"id": 17, "text": "I know what situations challenge my motivation.", "pillar": "Motivation", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 18, "text": "I'm aware of my strengths.", "pillar": "Self-Awareness", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 19, "text": "I'm aware of my weaknesses.", "pillar": "Self-Awareness", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 20, "text": "I'm aware of how I typically think in different situations (i.e., my thinking patterns).", "pillar": "Self-Awareness", "secondary_pillar": None, "is_reverse": False, "category": "thinking"},
    {"id": 21, "text": "I'm aware of how I typically feel in different situations (i.e., my patterns of emotions)", "pillar": "Self-Awareness", "secondary_pillar": None, "is_reverse": False, "category": "feeling"},
    {"id": 22, "text": "I'm aware of how I typically act in different situations (i.e., my patterns of behaviour).", "pillar": "Self-Awareness", "secondary_pillar": None, "is_reverse": False, "category": "acting"},
    {"id": 23, "text": "I have a clear idea of the values that shape who I am.", "pillar": "Self-Awareness", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 24, "text": "I know what I need to do to feel healthy.", "pillar": "Self-Awareness", "secondary_pillar": "Wellness", "is_reverse": False, "category": "acting"},
    {"id": 25, "text": "I often reflect on my thoughts.", "pillar": "Self-Awareness", "secondary_pillar": None, "is_reverse": True, "category": "thinking"},
    {"id": 26, "text": "It's hard for me to stay focused under pressure.", "pillar": "Attentional Focus", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 27, "text": "I can direct my attention to the things I need to focus on.", "pillar": "Attentional Focus", "secondary_pillar": None, "is_reverse": True, "category": None},
    {"id": 28, "text": "It's hard for me to regain focus when I get distracted.", "pillar": "Attentional Focus", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 29, "text": "I know where my attention needs to be when I'm performing.", "pillar": "Attentional Focus", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 30, "text": "I can keep my attention on a task for the time it needs without getting too distracted.", "pillar": "Attentional Focus", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 31, "text": "I can energize myself when I need a boost.", "pillar": "Arousal Control", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 32, "text": "I can calm myself down when I need to.", "pillar": "Arousal Control", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 33, "text": "I know what state I need to be in to perform at my best.", "pillar": "Arousal Control", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 34, "text": "My performance is negatively affected by stress.", "pillar": "Arousal Control", "secondary_pillar": None, "is_reverse": True, "category": None},
    {"id": 35, "text": "I can bounce back quickly when things go wrong.", "pillar": "Resilience", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 36, "text": "I find ways to get better after I fail.", "pillar": "Resilience", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 37, "text": "I struggle to maintain a positive mindset when things get tough.", "pillar": "Resilience", "secondary_pillar": None, "is_reverse": True, "category": "thinking"},
    {"id": 38, "text": "I adapt well to change.", "pillar": "Resilience", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 39, "text": "I understand how thoughts work and how they impact us.", "pillar": "Knowledge", "secondary_pillar": None, "is_reverse": False, "category": "thinking"},
    {"id": 40, "text": "I understand what emotions are, how they work, and how they impact us.", "pillar": "Knowledge", "secondary_pillar": None, "is_reverse": False, "category": "feeling"},
    {"id": 41, "text": "I understand what habits are, how they work, and how they impact us.", "pillar": "Knowledge", "secondary_pillar": None, "is_reverse": False, "category": "acting"},
    {"id": 42, "text": "I understand what's within and outside of people's control.", "pillar": "Knowledge", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 43, "text": "I understand what goes into living a healthy lifestyle.", "pillar": "Knowledge", "secondary_pillar": "Wellness", "is_reverse": False, "category": None},
    {"id": 44, "text": "I have a lot of motivation and desire to bring my best to practice.", "pillar": "Deliberate Practice", "secondary_pillar": "Motivation", "is_reverse": False, "category": None},
    {"id": 45, "text": "I set specific goals for practice.", "pillar": "Deliberate Practice", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 46, "text": "I consistently bring high levels of effort to practice.", "pillar": "Deliberate Practice", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 47, "text": "I get a lot of good feedback in practice.", "pillar": "Deliberate Practice", "secondary_pillar": None, "is_reverse": False, "category": None},
    {"id": 48, "text": "I generally feel good and healthy.", "pillar": "Wellness", "secondary_pillar": None, "is_reverse": False, "category": None},
]

PILLAR_CONFIG = {
    "core_pillars": [
        {"name": "mindfulness", "display_name": "Mindfulness", "description": "Noticing thoughts and feelings without reactivity"},
        {"name": "confidence", "display_name": "Confidence", "description": "Self-belief in your skills and ability to achieve goals"},
        {"name": "motivation", "display_name": "Motivation", "description": "Drive, persistence, and commitment to improvement"},
        {"name": "attentional_focus", "display_name": "Attentional Focus", "description": "Concentration and focus under pressure"},
        {"name": "arousal_control", "display_name": "Arousal Control", "description": "Managing energy levels - staying calm or getting energized"},
        {"name": "resilience", "display_name": "Resilience", "description": "Bouncing back from setbacks and adversity"},
    ],
    "supporting_dimensions": [
        {"name": "knowledge", "display_name": "Knowledge", "description": "Understanding mental processes and performance psychology"},
        {"name": "self_awareness", "display_name": "Self-Awareness", "description": "Recognizing patterns in your thoughts and behaviors"},
        {"name": "wellness", "display_name": "Wellness", "description": "Maintaining healthy lifestyle habits"},
        {"name": "deliberate_practice", "display_name": "Deliberate Practice", "description": "Quality and intentionality of training"},
    ],
    "scale": {"min": 1, "max": 7},
    "reverse_scored_items": [1, 3, 5, 13, 15, 25, 27, 34, 37],
}


async def seed_assessment():
    """Create or update the volleyball assessment."""
    async with async_session_maker() as session:
        # Check if assessment already exists
        result = await session.execute(
            select(Assessment).where(Assessment.name == "Mental Performance Assessment")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"Assessment already exists with ID: {existing.id}")
            print("Updating questions and config...")
            existing.questions = VOLLEYBALL_ASSESSMENT_QUESTIONS
            existing.pillar_config = PILLAR_CONFIG
            existing.version = existing.version + 1
            await session.commit()
            print(f"Updated to version {existing.version}")
            return existing.id
        else:
            # Create new assessment
            assessment = Assessment(
                name="Mental Performance Assessment",
                description="A 48-question assessment to evaluate your mental performance across 10 key dimensions. Takes approximately 10 minutes to complete.",
                sport="General",  # Can be used for any sport
                questions=VOLLEYBALL_ASSESSMENT_QUESTIONS,
                pillar_config=PILLAR_CONFIG,
                is_active=True,
            )
            session.add(assessment)
            await session.commit()
            await session.refresh(assessment)
            print(f"Created assessment with ID: {assessment.id}")
            return assessment.id


if __name__ == "__main__":
    asyncio.run(seed_assessment())
