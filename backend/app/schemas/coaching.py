"""
Coaching tips schemas.

Pydantic models for the coaching tips API response.
"""

from typing import Dict
from pydantic import BaseModel


class CoachingTipOut(BaseModel):
    """A coaching tip with practice and game day recommendations."""
    practice: str
    game_day: str


class PillarTipsOut(BaseModel):
    """Complete tips for a single pillar."""
    pillar: str
    display_name: str
    strength_tips: CoachingTipOut
    growth_tips: CoachingTipOut


class CoachingTipsResponse(BaseModel):
    """Response containing all coaching tips and classification thresholds."""
    tips: Dict[str, PillarTipsOut]
    thresholds: Dict[str, float]
