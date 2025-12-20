"""
Check-in API endpoints.
"""

from datetime import datetime, date, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user, verify_org_membership
from app.models.user import User
from app.services.checkin import get_today_checkins as svc_get_today_checkins
from app.models.checkin import (
    CheckIn,
    CheckInType,
    EMOTION_CONFIG,
    BODY_AREAS,
    Emotion,
    BREATHING_CONFIG,
    BreathingExerciseType,
    CONFIDENCE_SOURCES,
    CONFIDENCE_ACTIONS,
    ENERGY_FACTORS,
    ENERGY_ACTIONS,
)
from app.models.membership import Membership
from app.schemas.checkin import (
    CheckInCreate,
    CheckInOut,
    CheckInHistory,
    TodayCheckInStatus,
    EmotionsConfigOut,
    EmotionConfig,
    ActionCompletionUpdate,
    BreathingConfigOut,
    BreathingExerciseConfig,
    BreathingTimingConfig,
    BreathingCheckInCreate,
    BreathingCheckInOut,
    ConfidenceConfigOut,
    ConfidenceSourceItem,
    ConfidenceLevelActions,
    ConfidenceCheckInCreate,
    ConfidenceCheckInOut,
    EnergyConfigOut,
    EnergyFactorItem,
    EnergyStateActions,
    EnergyCheckInCreate,
    EnergyCheckInOut,
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


@router.get("/breathing/exercises", response_model=BreathingConfigOut)
async def get_breathing_exercises_config(
    current_user: User = Depends(get_current_active_user),
):
    """Get all breathing exercises with their configurations for the check-in flow."""
    exercises = []
    for exercise_type, config in BREATHING_CONFIG.items():
        timing = config["timing"]
        exercises.append(
            BreathingExerciseConfig(
                key=exercise_type.value,
                display_name=config["display_name"],
                technique=config["technique"],
                description=config["description"],
                triggers=config["triggers"],
                timing=BreathingTimingConfig(
                    inhale=timing["inhale"],
                    hold_in=timing["hold_in"],
                    exhale=timing["exhale"],
                    hold_out=timing["hold_out"],
                    second_inhale=timing.get("second_inhale"),
                ),
                cycles=config["cycles"],
                instructions=config["instructions"],
                category=config["category"],
            )
        )

    return BreathingConfigOut(exercises=exercises)


@router.post("/breathing", response_model=BreathingCheckInOut, status_code=status.HTTP_201_CREATED)
async def create_breathing_checkin(
    checkin: BreathingCheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new breathing check-in."""
    # Verify user has membership in the organization
    await verify_org_membership(db, current_user.id, checkin.organization_id)

    # Validate breathing exercise type
    valid_types = [e.value for e in BreathingExerciseType]
    if checkin.breathing_exercise_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid breathing exercise type. Must be one of: {', '.join(valid_types)}"
        )

    # Validate trigger if provided
    if checkin.trigger_selected:
        exercise_config = BREATHING_CONFIG.get(
            BreathingExerciseType(checkin.breathing_exercise_type)
        )
        if exercise_config and checkin.trigger_selected not in exercise_config["triggers"]:
            # Just log a warning, don't reject - user might have custom reason
            pass

    # Create the breathing check-in
    new_checkin = CheckIn(
        user_id=current_user.id,
        organization_id=checkin.organization_id,
        check_in_type=CheckInType.BREATHING.value,
        breathing_exercise_type=checkin.breathing_exercise_type,
        cycles_completed=checkin.cycles_completed,
        duration_seconds=checkin.duration_seconds,
        trigger_selected=checkin.trigger_selected,
        effectiveness_rating=checkin.effectiveness_rating,
        notes=checkin.notes,
    )

    db.add(new_checkin)
    await db.commit()
    await db.refresh(new_checkin)

    return new_checkin


@router.get("/breathing/me/today")
async def get_today_breathing_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if user has completed a breathing check-in today."""
    check_ins = await svc_get_today_checkins(
        db, current_user.id, CheckInType.BREATHING
    )

    return {
        "has_checked_in_today": len(check_ins) > 0,
        "count_today": len(check_ins),
        "check_ins": [BreathingCheckInOut.model_validate(c) for c in check_ins],
    }


@router.get("/me/today", response_model=TodayCheckInStatus)
async def get_today_checkin_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if user has completed a mood check-in today."""
    check_ins = await svc_get_today_checkins(
        db, current_user.id, CheckInType.MOOD, limit=1
    )

    if check_ins:
        return TodayCheckInStatus(
            has_checked_in_today=True,
            check_in=CheckInOut.model_validate(check_ins[0]),
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


@router.post("", response_model=CheckInOut, status_code=status.HTTP_201_CREATED)
async def create_checkin(
    checkin: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new check-in."""
    # Verify user has membership in the organization
    await verify_org_membership(db, current_user.id, checkin.organization_id)

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


@router.get("/me/activity/week")
async def get_weekly_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get daily activity status for the current week (Monday-Sunday).

    Returns which days of the current week had any activity (check-ins of any type).
    """
    # Get the current date and calculate week boundaries (Monday to Sunday)
    today = date.today()
    # Monday is 0, Sunday is 6
    days_since_monday = today.weekday()
    monday = today - timedelta(days=days_since_monday)
    sunday = monday + timedelta(days=6)

    start_of_week = datetime.combine(monday, datetime.min.time())
    end_of_week = datetime.combine(sunday, datetime.max.time())

    # Get all check-ins for the current week
    result = await db.execute(
        select(CheckIn)
        .where(CheckIn.user_id == current_user.id)
        .where(CheckIn.created_at >= start_of_week)
        .where(CheckIn.created_at <= end_of_week)
    )
    check_ins = result.scalars().all()

    # Track which dates have activity
    active_dates = set()
    for c in check_ins:
        active_dates.add(c.created_at.date())

    # Build the daily activity array (Mon=0 to Sun=6)
    daily_activity = []
    for i in range(7):
        day_date = monday + timedelta(days=i)
        daily_activity.append({
            "date": day_date.isoformat(),
            "day_name": day_date.strftime("%a"),  # Mon, Tue, etc.
            "has_activity": day_date in active_dates,
            "is_today": day_date == today,
            "is_past": day_date < today,
        })

    active_days = len(active_dates)

    return {
        "week_start": monday.isoformat(),
        "week_end": sunday.isoformat(),
        "daily_activity": daily_activity,
        "active_days": active_days,
        "total_days": 7,
    }


# === Confidence Check-In Endpoints ===

def get_confidence_level_category(level: int) -> str:
    """Get the action category based on confidence level."""
    if level <= 2:
        return "low"
    elif level <= 4:
        return "moderate"
    elif level <= 6:
        return "high"
    else:
        return "peak"


@router.get("/confidence/config", response_model=ConfidenceConfigOut)
async def get_confidence_config(
    current_user: User = Depends(get_current_active_user),
):
    """Get confidence check-in configuration for the frontend."""
    confidence_sources = [
        ConfidenceSourceItem(**source) for source in CONFIDENCE_SOURCES["confidence"]
    ]
    doubt_sources = [
        ConfidenceSourceItem(**source) for source in CONFIDENCE_SOURCES["doubt"]
    ]
    level_actions = {
        key: ConfidenceLevelActions(**value)
        for key, value in CONFIDENCE_ACTIONS.items()
    }

    return ConfidenceConfigOut(
        confidence_sources=confidence_sources,
        doubt_sources=doubt_sources,
        level_actions=level_actions,
    )


@router.post("/confidence", response_model=ConfidenceCheckInOut, status_code=status.HTTP_201_CREATED)
async def create_confidence_checkin(
    checkin: ConfidenceCheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new confidence check-in."""
    # Verify user has membership in the organization
    await verify_org_membership(db, current_user.id, checkin.organization_id)

    # Validate confidence level
    if checkin.confidence_level < 1 or checkin.confidence_level > 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confidence level must be between 1 and 7"
        )

    # Create the confidence check-in
    new_checkin = CheckIn(
        user_id=current_user.id,
        organization_id=checkin.organization_id,
        check_in_type=CheckInType.CONFIDENCE.value,
        confidence_level=checkin.confidence_level,
        confidence_sources=checkin.confidence_sources,
        doubt_sources=checkin.doubt_sources,
        confidence_commitment=checkin.confidence_commitment,
        selected_action=checkin.selected_action,
        notes=checkin.notes,
    )

    db.add(new_checkin)
    await db.commit()
    await db.refresh(new_checkin)

    return new_checkin


@router.get("/confidence/me/today")
async def get_today_confidence_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if user has completed a confidence check-in today."""
    check_ins = await svc_get_today_checkins(
        db, current_user.id, CheckInType.CONFIDENCE
    )

    return {
        "has_checked_in_today": len(check_ins) > 0,
        "count_today": len(check_ins),
        "check_ins": [ConfidenceCheckInOut.model_validate(c) for c in check_ins],
    }


# === Energy Check-In Endpoints ===

def get_energy_state(physical: int, mental: int) -> str:
    """Calculate energy state based on physical and mental levels."""
    # Low: 1-3, Moderate: 4, High: 5-7
    p_low = physical <= 3
    p_high = physical >= 5
    m_low = mental <= 3
    m_high = mental >= 5

    if p_low and m_low:
        return "low_low"
    elif p_low and m_high:
        return "low_high"
    elif p_high and m_low:
        return "high_low"
    elif p_high and m_high:
        return "high_high"
    else:
        return "moderate"


@router.get("/energy/config", response_model=EnergyConfigOut)
async def get_energy_config(
    current_user: User = Depends(get_current_active_user),
):
    """Get energy check-in configuration for the frontend."""
    physical_factors = [
        EnergyFactorItem(**factor) for factor in ENERGY_FACTORS["physical"]
    ]
    mental_factors = [
        EnergyFactorItem(**factor) for factor in ENERGY_FACTORS["mental"]
    ]
    state_actions = {
        key: EnergyStateActions(**value)
        for key, value in ENERGY_ACTIONS.items()
    }

    return EnergyConfigOut(
        physical_factors=physical_factors,
        mental_factors=mental_factors,
        state_actions=state_actions,
    )


@router.post("/energy", response_model=EnergyCheckInOut, status_code=status.HTTP_201_CREATED)
async def create_energy_checkin(
    checkin: EnergyCheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new energy check-in."""
    # Verify user has membership in the organization
    await verify_org_membership(db, current_user.id, checkin.organization_id)

    # Validate energy levels
    if checkin.physical_energy < 1 or checkin.physical_energy > 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Physical energy must be between 1 and 7"
        )
    if checkin.mental_energy < 1 or checkin.mental_energy > 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mental energy must be between 1 and 7"
        )

    # Calculate energy state
    energy_state = get_energy_state(checkin.physical_energy, checkin.mental_energy)

    # Create the energy check-in
    new_checkin = CheckIn(
        user_id=current_user.id,
        organization_id=checkin.organization_id,
        check_in_type=CheckInType.ENERGY.value,
        physical_energy=checkin.physical_energy,
        mental_energy=checkin.mental_energy,
        physical_factors=checkin.physical_factors,
        mental_factors=checkin.mental_factors,
        energy_state=energy_state,
        selected_action=checkin.selected_action,
        notes=checkin.notes,
    )

    db.add(new_checkin)
    await db.commit()
    await db.refresh(new_checkin)

    return new_checkin


@router.get("/energy/me/today")
async def get_today_energy_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if user has completed an energy check-in today."""
    check_ins = await svc_get_today_checkins(
        db, current_user.id, CheckInType.ENERGY
    )

    return {
        "has_checked_in_today": len(check_ins) > 0,
        "count_today": len(check_ins),
        "check_ins": [EnergyCheckInOut.model_validate(c) for c in check_ins],
    }
