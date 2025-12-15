"""
Check-in API endpoints.
"""

from datetime import datetime, date, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.checkin import CheckIn, EMOTION_CONFIG, BODY_AREAS, Emotion
from app.models.membership import Membership
from app.schemas.checkin import (
    CheckInCreate,
    CheckInOut,
    CheckInHistory,
    TodayCheckInStatus,
    EmotionsConfigOut,
    EmotionConfig,
    ActionCompletionUpdate,
)

router = APIRouter()


@router.get("/emotions", response_model=EmotionsConfigOut)
async def get_emotions_config(
    current_user: User = Depends(get_current_active_user),
):
    """Get all emotions with their signals and actions for the check-in flow."""
    emotions = []
    for emotion, config in EMOTION_CONFIG.items():
        emotions.append(
            EmotionConfig(
                key=emotion.value,
                display_name=config["display_name"],
                category=config["category"],
                signals=config["signals"],
                actions=config["actions"],
            )
        )

    body_areas = [
        {"key": "head", "display_name": "Head"},
        {"key": "chest", "display_name": "Chest"},
        {"key": "stomach", "display_name": "Stomach"},
        {"key": "shoulders", "display_name": "Shoulders"},
        {"key": "arms", "display_name": "Arms"},
        {"key": "legs", "display_name": "Legs"},
        {"key": "all_over", "display_name": "All over"},
        {"key": "not_sure", "display_name": "Not sure"},
    ]

    return EmotionsConfigOut(emotions=emotions, body_areas=body_areas)


@router.get("/me/today", response_model=TodayCheckInStatus)
async def get_today_checkin_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if user has completed a mood check-in today."""
    # Get today's date range
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    result = await db.execute(
        select(CheckIn)
        .where(CheckIn.user_id == current_user.id)
        .where(CheckIn.check_in_type == "mood")
        .where(CheckIn.created_at >= start_of_day)
        .where(CheckIn.created_at <= end_of_day)
        .order_by(CheckIn.created_at.desc())
        .limit(1)
    )
    check_in = result.scalar_one_or_none()

    if check_in:
        return TodayCheckInStatus(
            has_checked_in_today=True,
            check_in=CheckInOut.model_validate(check_in),
        )

    return TodayCheckInStatus(has_checked_in_today=False)


@router.get("/me", response_model=CheckInHistory)
async def get_my_checkins(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get check-in history for the current user."""
    # Get total count
    count_result = await db.execute(
        select(func.count(CheckIn.id))
        .where(CheckIn.user_id == current_user.id)
    )
    total = count_result.scalar()

    # Get paginated check-ins
    offset = (page - 1) * page_size
    result = await db.execute(
        select(CheckIn)
        .where(CheckIn.user_id == current_user.id)
        .order_by(CheckIn.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    check_ins = result.scalars().all()

    return CheckInHistory(
        check_ins=[CheckInOut.model_validate(c) for c in check_ins],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=CheckInOut, status_code=status.HTTP_201_CREATED)
async def create_checkin(
    checkin: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new check-in."""
    # Verify user has membership in the organization
    membership_result = await db.execute(
        select(Membership)
        .where(Membership.user_id == current_user.id)
        .where(Membership.organization_id == checkin.organization_id)
    )
    membership = membership_result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )

    # Validate emotion
    valid_emotions = [e.value for e in Emotion]
    if checkin.emotion not in valid_emotions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid emotion. Must be one of: {', '.join(valid_emotions)}"
        )

    # Validate body areas
    for area in checkin.body_areas:
        if area not in BODY_AREAS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid body area: {area}. Must be one of: {', '.join(BODY_AREAS)}"
            )

    # Create the check-in
    new_checkin = CheckIn(
        user_id=current_user.id,
        organization_id=checkin.organization_id,
        check_in_type=checkin.check_in_type,
        emotion=checkin.emotion,
        intensity=checkin.intensity,
        body_areas=checkin.body_areas,
        signal_resonated=checkin.signal_resonated,
        selected_action=checkin.selected_action,
        notes=checkin.notes,
    )

    db.add(new_checkin)
    await db.commit()
    await db.refresh(new_checkin)

    return new_checkin


@router.get("/{checkin_id}", response_model=CheckInOut)
async def get_checkin(
    checkin_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific check-in by ID."""
    result = await db.execute(
        select(CheckIn).where(CheckIn.id == checkin_id)
    )
    check_in = result.scalar_one_or_none()

    if not check_in:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check-in not found"
        )

    # Users can only see their own check-ins
    if check_in.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return check_in


@router.patch("/{checkin_id}/action", response_model=CheckInOut)
async def update_action_completion(
    checkin_id: UUID,
    update: ActionCompletionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update whether the selected action was completed."""
    result = await db.execute(
        select(CheckIn).where(CheckIn.id == checkin_id)
    )
    check_in = result.scalar_one_or_none()

    if not check_in:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check-in not found"
        )

    # Users can only update their own check-ins
    if check_in.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    check_in.action_completed = update.action_completed
    await db.commit()
    await db.refresh(check_in)

    return check_in


@router.get("/me/stats/week")
async def get_weekly_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get check-in statistics for the past week."""
    # Get date range for past 7 days
    today = date.today()
    week_ago = today - timedelta(days=7)
    start_date = datetime.combine(week_ago, datetime.min.time())

    result = await db.execute(
        select(CheckIn)
        .where(CheckIn.user_id == current_user.id)
        .where(CheckIn.created_at >= start_date)
        .order_by(CheckIn.created_at.desc())
    )
    check_ins = result.scalars().all()

    # Calculate stats
    total_checkins = len(check_ins)
    emotions_count = {}
    avg_intensity = 0
    actions_completed = 0
    actions_total = 0

    for c in check_ins:
        emotions_count[c.emotion] = emotions_count.get(c.emotion, 0) + 1
        avg_intensity += c.intensity
        if c.selected_action:
            actions_total += 1
            if c.action_completed:
                actions_completed += 1

    if total_checkins > 0:
        avg_intensity = round(avg_intensity / total_checkins, 1)

    return {
        "total_checkins": total_checkins,
        "emotions_breakdown": emotions_count,
        "average_intensity": avg_intensity,
        "actions_completed": actions_completed,
        "actions_total": actions_total,
        "check_in_dates": [c.created_at.date().isoformat() for c in check_ins],
    }
