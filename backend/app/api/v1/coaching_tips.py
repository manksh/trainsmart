"""
Coaching tips API endpoints.

Provides static coaching tips for all 10 mental performance pillars.
Tips are cached client-side for 24 hours since they don't change.
"""

from fastapi import APIRouter, Response

from app.api.deps import CurrentUser
from app.schemas.coaching import CoachingTipsResponse
from app.services.coaching_tips import COACHING_TIPS_DATA, COACHING_TIP_THRESHOLDS

router = APIRouter()


@router.get("", response_model=CoachingTipsResponse)
async def get_coaching_tips(
    response: Response,
    current_user: CurrentUser,
):
    """
    Get all coaching tips for all pillars.

    Returns tips categorized by strength vs growth area for each pillar,
    with separate recommendations for practice and game day scenarios.

    The response includes thresholds that the frontend uses to determine
    whether to show strength_tips or growth_tips based on assessment scores:
    - score >= strength threshold (5.5): show strength_tips
    - score <= growth threshold (3.5): show growth_tips
    - between thresholds: may show either or context-dependent tips
    """
    # Set cache headers - tips are static, cache for 24 hours
    response.headers["Cache-Control"] = "public, max-age=86400"

    return CoachingTipsResponse(
        tips={k: v.model_dump() for k, v in COACHING_TIPS_DATA.items()},
        thresholds=COACHING_TIP_THRESHOLDS
    )
