"""
Assessment scoring service.

Handles:
- Reverse scoring for specific items
- Pillar score calculation
- Meta category aggregation (Thinking, Feeling, Action)
- Strengths and growth areas identification
"""

from typing import Any, Dict, List, Tuple

# Reverse scored question IDs (1-indexed from the MPA sheet)
REVERSE_SCORED_ITEMS = {1, 3, 5, 13, 15, 25, 27, 34, 37}

# Pillar configurations
CORE_PILLARS = [
    "mindfulness",
    "confidence",
    "motivation",
    "attentional_focus",
    "arousal_control",
    "resilience",
]

SUPPORTING_DIMENSIONS = [
    "knowledge",
    "self_awareness",
    "wellness",
    "deliberate_practice",
]

PILLAR_DISPLAY_NAMES = {
    "mindfulness": "Mindfulness",
    "confidence": "Confidence",
    "motivation": "Motivation",
    "attentional_focus": "Attentional Focus",
    "arousal_control": "Arousal Control",
    "resilience": "Resilience",
    "knowledge": "Knowledge",
    "self_awareness": "Self-Awareness",
    "wellness": "Wellness",
    "deliberate_practice": "Deliberate Practice",
}

PILLAR_DESCRIPTIONS = {
    "mindfulness": "Noticing thoughts and feelings without reactivity",
    "confidence": "Self-belief in your skills and ability to achieve goals",
    "motivation": "Drive, persistence, and commitment to improvement",
    "attentional_focus": "Concentration and focus under pressure",
    "arousal_control": "Managing energy levels - staying calm or getting energized",
    "resilience": "Bouncing back from setbacks and adversity",
    "knowledge": "Understanding mental processes and performance psychology",
    "self_awareness": "Recognizing patterns in your thoughts and behaviors",
    "wellness": "Maintaining healthy lifestyle habits",
    "deliberate_practice": "Quality and intentionality of training",
}

# Meta categories mapping
PILLAR_META_CATEGORIES = {
    "mindfulness": "thinking",
    "confidence": "feeling",
    "motivation": "feeling",
    "attentional_focus": "thinking",
    "arousal_control": "feeling",
    "resilience": "action",
    "knowledge": "thinking",
    "self_awareness": "thinking",
    "wellness": "action",
    "deliberate_practice": "action",
}


def reverse_score(value: int) -> int:
    """Reverse a Likert scale value (1-7)."""
    # 1 -> 7, 2 -> 6, 3 -> 5, 4 -> 4, 5 -> 3, 6 -> 2, 7 -> 1
    return 8 - value


def calculate_pillar_scores(
    answers: Dict[str, int],  # {question_id: value}
    questions: List[dict],
) -> Dict[str, float]:
    """
    Calculate average scores for each pillar.

    Args:
        answers: Dict mapping question_id (as string) to answer value (1-7)
        questions: List of question objects with pillar mappings

    Returns:
        Dict mapping pillar name to average score
    """
    pillar_scores: Dict[str, List[float]] = {}

    for question in questions:
        q_id = str(question["id"])
        if q_id not in answers:
            continue

        value = answers[q_id]

        # Apply reverse scoring if needed
        if question.get("is_reverse", False):
            value = reverse_score(value)

        # Add to primary pillar
        primary_pillar = question["pillar"].lower().replace(" ", "_")
        if primary_pillar not in pillar_scores:
            pillar_scores[primary_pillar] = []
        pillar_scores[primary_pillar].append(value)

        # Add to secondary pillar if exists (equal weighting)
        secondary = question.get("secondary_pillar")
        if secondary:
            secondary_pillar = secondary.lower().replace(" ", "_")
            if secondary_pillar not in pillar_scores:
                pillar_scores[secondary_pillar] = []
            pillar_scores[secondary_pillar].append(value)

    # Calculate averages
    return {
        pillar: round(sum(scores) / len(scores), 2) if scores else 0
        for pillar, scores in pillar_scores.items()
    }


def calculate_meta_scores(pillar_scores: Dict[str, float]) -> Dict[str, float]:
    """
    Calculate meta category scores (Thinking, Feeling, Action).

    Groups pillars by their meta category and averages them.
    """
    meta_scores: Dict[str, List[float]] = {
        "thinking": [],
        "feeling": [],
        "action": [],
    }

    for pillar, score in pillar_scores.items():
        category = PILLAR_META_CATEGORIES.get(pillar)
        if category and score > 0:
            meta_scores[category].append(score)

    return {
        category: round(sum(scores) / len(scores), 2) if scores else 0
        for category, scores in meta_scores.items()
    }


def identify_strengths_and_growth_areas(
    pillar_scores: Dict[str, float],
    top_n: int = 2,
) -> Tuple[List[str], List[str]]:
    """
    Identify top strengths and areas needing growth.

    Args:
        pillar_scores: Dict mapping pillar name to score
        top_n: Number of strengths/growth areas to identify

    Returns:
        Tuple of (strengths list, growth_areas list)
    """
    # Filter to core pillars only for strength/growth identification
    core_scores = {
        pillar: score
        for pillar, score in pillar_scores.items()
        if pillar in CORE_PILLARS
    }

    if not core_scores:
        return [], []

    # Sort by score
    sorted_pillars = sorted(core_scores.items(), key=lambda x: x[1], reverse=True)

    # Top scores are strengths, bottom scores are growth areas
    strengths = [pillar for pillar, _ in sorted_pillars[:top_n]]
    growth_areas = [pillar for pillar, _ in sorted_pillars[-top_n:]]

    # Don't include same pillar in both lists
    growth_areas = [p for p in growth_areas if p not in strengths]

    return strengths, growth_areas


def get_detailed_results(
    pillar_scores: Dict[str, float],
) -> List[Dict[str, Any]]:
    """
    Get detailed breakdown of all pillar scores for visualization.
    """
    results = []

    all_pillars = CORE_PILLARS + SUPPORTING_DIMENSIONS

    for pillar in all_pillars:
        score = pillar_scores.get(pillar, 0)
        results.append({
            "pillar": pillar,
            "display_name": PILLAR_DISPLAY_NAMES.get(pillar, pillar),
            "score": score,
            "max_score": 7.0,
            "percentage": round((score / 7.0) * 100, 1) if score else 0,
            "description": PILLAR_DESCRIPTIONS.get(pillar, ""),
            "category": "core" if pillar in CORE_PILLARS else "supporting",
            "meta_category": PILLAR_META_CATEGORIES.get(pillar, ""),
        })

    return results


def score_assessment(
    answers: Dict[str, int],
    questions: List[dict],
) -> Dict[str, Any]:
    """
    Complete assessment scoring.

    Returns all calculated scores and analysis.
    """
    pillar_scores = calculate_pillar_scores(answers, questions)
    meta_scores = calculate_meta_scores(pillar_scores)
    strengths, growth_areas = identify_strengths_and_growth_areas(pillar_scores)

    return {
        "pillar_scores": pillar_scores,
        "meta_scores": meta_scores,
        "strengths": strengths,
        "growth_areas": growth_areas,
        "detailed_results": get_detailed_results(pillar_scores),
    }
