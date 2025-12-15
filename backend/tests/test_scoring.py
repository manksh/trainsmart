"""
Tests for the assessment scoring service.

These tests verify:
- Reverse scoring logic
- Pillar score calculations
- Meta category aggregation
- Strengths and growth areas identification
"""

import pytest
from app.services.scoring import (
    reverse_score,
    calculate_pillar_scores,
    calculate_meta_scores,
    identify_strengths_and_growth_areas,
    score_assessment,
    CORE_PILLARS,
    REVERSE_SCORED_ITEMS,
)


class TestReverseScoring:
    """Tests for the reverse scoring function."""

    def test_reverse_score_1_to_7(self):
        """Score of 1 should become 7."""
        assert reverse_score(1) == 7

    def test_reverse_score_7_to_1(self):
        """Score of 7 should become 1."""
        assert reverse_score(7) == 1

    def test_reverse_score_4_stays_4(self):
        """Neutral score of 4 should remain 4."""
        assert reverse_score(4) == 4

    def test_reverse_score_2_to_6(self):
        """Score of 2 should become 6."""
        assert reverse_score(2) == 6

    def test_reverse_score_3_to_5(self):
        """Score of 3 should become 5."""
        assert reverse_score(3) == 5

    def test_all_reverse_scores(self):
        """Verify all possible reverse score mappings."""
        expected = {1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1}
        for original, expected_reversed in expected.items():
            assert reverse_score(original) == expected_reversed


class TestPillarScoreCalculation:
    """Tests for pillar score calculation."""

    def test_single_question_per_pillar(self):
        """Single question should give exact score for pillar."""
        questions = [
            {"id": 1, "text": "Test", "pillar": "Confidence", "is_reverse": False},
        ]
        answers = {"1": 5}

        scores = calculate_pillar_scores(answers, questions)

        assert scores["confidence"] == 5.0

    def test_multiple_questions_averaged(self):
        """Multiple questions for same pillar should be averaged."""
        questions = [
            {"id": 1, "text": "Test 1", "pillar": "Confidence", "is_reverse": False},
            {"id": 2, "text": "Test 2", "pillar": "Confidence", "is_reverse": False},
        ]
        answers = {"1": 5, "2": 7}

        scores = calculate_pillar_scores(answers, questions)

        assert scores["confidence"] == 6.0  # (5 + 7) / 2

    def test_reverse_scoring_applied(self):
        """Reverse scored questions should have values inverted."""
        questions = [
            {"id": 1, "text": "Test", "pillar": "Mindfulness", "is_reverse": True},
        ]
        answers = {"1": 2}  # Low score on reverse = high actual score

        scores = calculate_pillar_scores(answers, questions)

        assert scores["mindfulness"] == 6.0  # reverse_score(2) = 6

    def test_secondary_pillar_counted(self):
        """Secondary pillar should also receive the score."""
        questions = [
            {
                "id": 1,
                "text": "Test",
                "pillar": "Motivation",
                "secondary_pillar": "Resilience",
                "is_reverse": False,
            },
        ]
        answers = {"1": 6}

        scores = calculate_pillar_scores(answers, questions)

        assert scores["motivation"] == 6.0
        assert scores["resilience"] == 6.0

    def test_mixed_questions(self):
        """Complex scenario with reverse and secondary pillars."""
        questions = [
            {
                "id": 1,
                "text": "Q1",
                "pillar": "Confidence",
                "is_reverse": False,
            },
            {
                "id": 2,
                "text": "Q2",
                "pillar": "Confidence",
                "secondary_pillar": "Motivation",
                "is_reverse": False,
            },
            {
                "id": 3,
                "text": "Q3",
                "pillar": "Mindfulness",
                "is_reverse": True,
            },
        ]
        answers = {"1": 6, "2": 4, "3": 2}

        scores = calculate_pillar_scores(answers, questions)

        assert scores["confidence"] == 5.0  # (6 + 4) / 2
        assert scores["motivation"] == 4.0  # just from Q2
        assert scores["mindfulness"] == 6.0  # reverse_score(2)

    def test_missing_answers_ignored(self):
        """Questions without answers should be skipped."""
        questions = [
            {"id": 1, "text": "Q1", "pillar": "Confidence", "is_reverse": False},
            {"id": 2, "text": "Q2", "pillar": "Confidence", "is_reverse": False},
        ]
        answers = {"1": 6}  # Missing answer for question 2

        scores = calculate_pillar_scores(answers, questions)

        assert scores["confidence"] == 6.0  # Only Q1 counted

    def test_pillar_name_normalization(self):
        """Pillar names should be normalized (lowercase, underscored)."""
        questions = [
            {"id": 1, "text": "Q1", "pillar": "Attentional Focus", "is_reverse": False},
            {"id": 2, "text": "Q2", "pillar": "Self-Awareness", "is_reverse": False},
        ]
        answers = {"1": 5, "2": 6}

        scores = calculate_pillar_scores(answers, questions)

        assert "attentional_focus" in scores
        assert "self-awareness" in scores  # preserves hyphen
        assert scores["attentional_focus"] == 5.0


class TestMetaScoreCalculation:
    """Tests for meta category score calculation."""

    def test_thinking_category(self):
        """Thinking pillars should be grouped correctly."""
        pillar_scores = {
            "mindfulness": 5.0,
            "attentional_focus": 6.0,
            "knowledge": 4.0,
            "self_awareness": 5.0,
        }

        meta_scores = calculate_meta_scores(pillar_scores)

        # Average of mindfulness, attentional_focus, knowledge, self_awareness
        expected = (5.0 + 6.0 + 4.0 + 5.0) / 4
        assert meta_scores["thinking"] == expected

    def test_feeling_category(self):
        """Feeling pillars should be grouped correctly."""
        pillar_scores = {
            "confidence": 6.0,
            "motivation": 5.0,
            "arousal_control": 4.0,
        }

        meta_scores = calculate_meta_scores(pillar_scores)

        expected = (6.0 + 5.0 + 4.0) / 3
        assert meta_scores["feeling"] == expected

    def test_action_category(self):
        """Action pillars should be grouped correctly."""
        pillar_scores = {
            "resilience": 5.0,
            "wellness": 6.0,
            "deliberate_practice": 4.0,
        }

        meta_scores = calculate_meta_scores(pillar_scores)

        expected = (5.0 + 6.0 + 4.0) / 3
        assert meta_scores["action"] == expected

    def test_zero_scores_excluded(self):
        """Zero scores should not affect averages."""
        pillar_scores = {
            "confidence": 6.0,
            "motivation": 0,  # Should be excluded
            "arousal_control": 4.0,
        }

        meta_scores = calculate_meta_scores(pillar_scores)

        expected = (6.0 + 4.0) / 2  # motivation excluded
        assert meta_scores["feeling"] == expected


class TestStrengthsAndGrowthAreas:
    """Tests for identifying strengths and growth areas."""

    def test_top_two_strengths(self):
        """Should identify top 2 pillars as strengths."""
        pillar_scores = {
            "mindfulness": 3.0,
            "confidence": 6.5,
            "motivation": 5.0,
            "attentional_focus": 4.0,
            "arousal_control": 4.5,
            "resilience": 7.0,
        }

        strengths, _ = identify_strengths_and_growth_areas(pillar_scores)

        assert len(strengths) == 2
        assert "resilience" in strengths
        assert "confidence" in strengths

    def test_bottom_as_growth_areas(self):
        """Should identify lowest pillars as growth areas."""
        pillar_scores = {
            "mindfulness": 3.0,
            "confidence": 6.5,
            "motivation": 5.0,
            "attentional_focus": 4.0,
            "arousal_control": 2.5,
            "resilience": 7.0,
        }

        _, growth_areas = identify_strengths_and_growth_areas(pillar_scores)

        assert "mindfulness" in growth_areas or "arousal_control" in growth_areas

    def test_no_overlap_strength_growth(self):
        """A pillar should not appear in both strengths and growth areas."""
        pillar_scores = {
            "mindfulness": 5.0,
            "confidence": 5.0,
            "motivation": 5.0,
            "attentional_focus": 5.0,
            "arousal_control": 5.0,
            "resilience": 5.0,
        }

        strengths, growth_areas = identify_strengths_and_growth_areas(pillar_scores)

        for pillar in strengths:
            assert pillar not in growth_areas

    def test_only_core_pillars_considered(self):
        """Only core pillars should be in strengths/growth areas."""
        pillar_scores = {
            "mindfulness": 3.0,
            "confidence": 5.0,
            "motivation": 5.0,
            "attentional_focus": 4.0,
            "arousal_control": 4.0,
            "resilience": 6.0,
            "knowledge": 7.0,  # Supporting dimension - highest
            "wellness": 2.0,  # Supporting dimension - lowest
        }

        strengths, growth_areas = identify_strengths_and_growth_areas(pillar_scores)

        # Supporting dimensions should NOT appear
        assert "knowledge" not in strengths
        assert "wellness" not in growth_areas

        # Core pillars should
        for pillar in strengths + growth_areas:
            assert pillar in CORE_PILLARS


class TestFullAssessmentScoring:
    """Integration tests for the complete scoring function."""

    def test_score_assessment_returns_all_fields(self):
        """Full scoring should return all expected fields."""
        questions = [
            {"id": 1, "pillar": "Confidence", "is_reverse": False},
            {"id": 2, "pillar": "Motivation", "is_reverse": False},
            {"id": 3, "pillar": "Mindfulness", "is_reverse": True},
        ]
        answers = {"1": 6, "2": 5, "3": 2}

        result = score_assessment(answers, questions)

        assert "pillar_scores" in result
        assert "meta_scores" in result
        assert "strengths" in result
        assert "growth_areas" in result
        assert "detailed_results" in result

    def test_detailed_results_structure(self):
        """Detailed results should have proper structure."""
        questions = [
            {"id": 1, "pillar": "Confidence", "is_reverse": False},
        ]
        answers = {"1": 6}

        result = score_assessment(answers, questions)
        detailed = result["detailed_results"]

        # Find confidence in detailed results
        confidence_result = next(
            (r for r in detailed if r["pillar"] == "confidence"), None
        )
        assert confidence_result is not None
        assert "display_name" in confidence_result
        assert "score" in confidence_result
        assert "max_score" in confidence_result
        assert "percentage" in confidence_result
        assert "description" in confidence_result
        assert "category" in confidence_result
        assert "meta_category" in confidence_result

    def test_realistic_assessment_scenario(self):
        """Test with a realistic set of questions and answers."""
        questions = [
            {"id": 1, "pillar": "Mindfulness", "is_reverse": True},
            {"id": 2, "pillar": "Mindfulness", "is_reverse": False},
            {"id": 3, "pillar": "Confidence", "is_reverse": True},
            {"id": 4, "pillar": "Confidence", "is_reverse": False},
            {"id": 5, "pillar": "Motivation", "secondary_pillar": "Resilience", "is_reverse": False},
            {"id": 6, "pillar": "Resilience", "is_reverse": False},
        ]
        # Athlete with high confidence, low mindfulness
        answers = {
            "1": 5,  # reverse -> 3 (low mindfulness)
            "2": 3,  # 3 (low mindfulness)
            "3": 1,  # reverse -> 7 (high confidence)
            "4": 6,  # 6 (high confidence)
            "5": 6,  # 6 (high motivation, also counts for resilience)
            "6": 5,  # 5 (resilience)
        }

        result = score_assessment(answers, questions)

        # Mindfulness: (3 + 3) / 2 = 3.0
        assert result["pillar_scores"]["mindfulness"] == 3.0

        # Confidence: (7 + 6) / 2 = 6.5
        assert result["pillar_scores"]["confidence"] == 6.5

        # Motivation: 6.0
        assert result["pillar_scores"]["motivation"] == 6.0

        # Resilience: (6 + 5) / 2 = 5.5 (from Q5 secondary + Q6)
        assert result["pillar_scores"]["resilience"] == 5.5

        # Confidence should be a strength
        assert "confidence" in result["strengths"]

        # Mindfulness should be a growth area
        assert "mindfulness" in result["growth_areas"]


class TestReverseScoreItemNumbers:
    """Verify the reverse scored item numbers match the MPA spec."""

    def test_reverse_scored_items_documented(self):
        """Verify all reverse scored items are as documented."""
        expected_reverse_items = {1, 3, 5, 13, 15, 25, 27, 34, 37}
        assert REVERSE_SCORED_ITEMS == expected_reverse_items

    def test_reverse_items_count(self):
        """Should have exactly 9 reverse scored items."""
        assert len(REVERSE_SCORED_ITEMS) == 9
