"""Journal API endpoints."""
from datetime import date, datetime, timedelta
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    User,
    JournalEntry,
    JournalType,
    AffirmationFocusArea,
    AFFIRMATIONS_BY_FOCUS,
    AFFIRMATION_TIMING_OPTIONS,
    DAILY_WIN_FACTORS,
    EMOTION_OPTIONS,
    OPEN_ENDED_TAGS,
    OPEN_ENDED_PROMPTS,
    I_KNOW_PROMPTS,
    Membership,
)
from app.schemas.journal import (
    JournalConfigOut,
    JournalEntryCreate,
    JournalEntryUpdate,
    JournalEntryOut,
    JournalEntryListOut,
    JournalCalendarOut,
)
from app.api.deps import get_current_active_user

router = APIRouter()


async def verify_membership(
    db: AsyncSession, user_id: UUID, organization_id: UUID
) -> bool:
    """Verify user is a member of the organization."""
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user_id,
            Membership.organization_id == organization_id,
        )
    )
    return result.scalar_one_or_none() is not None


@router.get("/config", response_model=JournalConfigOut)
async def get_journal_config(
    current_user: User = Depends(get_current_active_user),
):
    """Get journal configuration (types, prompts, options, etc.)."""
    # Build affirmations config
    affirmations_config = {}
    for focus_area in AffirmationFocusArea:
        affirmations_config[focus_area.value] = {
            "key": focus_area.value,
            "label": focus_area.value.replace("_", " ").title(),
            "affirmations": AFFIRMATIONS_BY_FOCUS.get(focus_area, []),
        }

    return JournalConfigOut(
        journal_types=[
            {
                "key": JournalType.AFFIRMATIONS.value,
                "label": "Affirmations",
                "description": "Practice intentional self-talk",
                "icon": "sparkles",
            },
            {
                "key": JournalType.DAILY_WINS.value,
                "label": "Daily Wins",
                "description": "Track your achievements",
                "icon": "trophy",
            },
            {
                "key": JournalType.GRATITUDE.value,
                "label": "Gratitude",
                "description": "Build appreciation and balance",
                "icon": "heart",
            },
            {
                "key": JournalType.OPEN_ENDED.value,
                "label": "Free Write",
                "description": "Write whatever is on your mind",
                "icon": "pencil",
            },
            {
                "key": JournalType.I_KNOW.value,
                "label": "I Know...",
                "description": "Reinforce what you know to be true",
                "icon": "lightbulb",
            },
        ],
        affirmations=affirmations_config,
        affirmation_timing_options=AFFIRMATION_TIMING_OPTIONS,
        daily_win_factors=DAILY_WIN_FACTORS,
        emotion_options=EMOTION_OPTIONS,
        open_ended_tags=OPEN_ENDED_TAGS,
        open_ended_prompts=OPEN_ENDED_PROMPTS,
        i_know_prompts=I_KNOW_PROMPTS,
    )


@router.post("", response_model=JournalEntryOut, status_code=status.HTTP_201_CREATED)
async def create_journal_entry(
    entry_data: JournalEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new journal entry."""
    # Verify membership
    if not await verify_membership(db, current_user.id, entry_data.organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization",
        )

    # Validate journal type
    try:
        JournalType(entry_data.journal_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid journal type: {entry_data.journal_type}",
        )

    # Validate required fields for i_know type
    if entry_data.journal_type == JournalType.I_KNOW.value:
        if not entry_data.i_know_statement:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="i_know_statement is required for i_know journal type",
            )
        if not entry_data.i_know_feeling:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="i_know_feeling is required for i_know journal type",
            )

    # Calculate word count for open-ended entries
    word_count = None
    if entry_data.content:
        word_count = len(entry_data.content.split())

    # Create the journal entry
    journal_entry = JournalEntry(
        user_id=current_user.id,
        organization_id=entry_data.organization_id,
        journal_type=entry_data.journal_type,
        # Affirmations
        affirmation_focus_area=entry_data.affirmation_focus_area,
        affirmation_text=entry_data.affirmation_text,
        affirmation_is_custom=entry_data.affirmation_is_custom,
        affirmation_when_helpful=entry_data.affirmation_when_helpful,
        # Daily wins
        win_description=entry_data.win_description,
        win_factors=entry_data.win_factors,
        win_feeling=entry_data.win_feeling,
        # Gratitude
        gratitude_item=entry_data.gratitude_item,
        gratitude_why_meaningful=entry_data.gratitude_why_meaningful,
        gratitude_feeling=entry_data.gratitude_feeling,
        # Open-ended
        content=entry_data.content,
        tags=entry_data.tags,
        prompt_used=entry_data.prompt_used,
        # I Know
        i_know_statement=entry_data.i_know_statement,
        i_know_why_matters=entry_data.i_know_why_matters,
        i_know_feeling=entry_data.i_know_feeling,
        # Shared
        word_count=word_count,
    )

    db.add(journal_entry)
    await db.commit()
    await db.refresh(journal_entry)

    return journal_entry


@router.get("/me", response_model=JournalEntryListOut)
async def get_my_journal_entries(
    journal_type: Optional[str] = Query(None, description="Filter by journal type"),
    tag: Optional[str] = Query(None, description="Filter by tag (for open-ended)"),
    start_date: Optional[date] = Query(None, description="Filter entries from this date"),
    end_date: Optional[date] = Query(None, description="Filter entries until this date"),
    limit: int = Query(20, ge=1, le=100, description="Number of entries to return"),
    offset: int = Query(0, ge=0, description="Number of entries to skip"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's journal entries with optional filtering."""
    query = select(JournalEntry).where(JournalEntry.user_id == current_user.id)

    # Apply filters
    if journal_type:
        query = query.where(JournalEntry.journal_type == journal_type)

    if tag:
        # JSONB contains check for tags array
        query = query.where(JournalEntry.tags.contains([tag]))

    if start_date:
        start_datetime = datetime.combine(start_date, datetime.min.time())
        query = query.where(JournalEntry.created_at >= start_datetime)

    if end_date:
        end_datetime = datetime.combine(end_date, datetime.max.time())
        query = query.where(JournalEntry.created_at <= end_datetime)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(JournalEntry.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    entries = result.scalars().all()

    return JournalEntryListOut(
        entries=entries,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/me/calendar", response_model=JournalCalendarOut)
async def get_journal_calendar(
    year: int = Query(..., description="Year to get calendar for"),
    month: int = Query(..., ge=1, le=12, description="Month to get calendar for"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get journal entries grouped by date for calendar view."""
    # Calculate date range for the month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)

    # Get all entries for this month
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == current_user.id)
        .where(JournalEntry.created_at >= start_date)
        .where(JournalEntry.created_at <= end_date)
        .order_by(JournalEntry.created_at.desc())
    )
    entries = result.scalars().all()

    # Group entries by date
    entries_by_date = {}
    for entry in entries:
        date_key = entry.created_at.date().isoformat()
        if date_key not in entries_by_date:
            entries_by_date[date_key] = []
        entries_by_date[date_key].append(entry)

    # Build calendar data
    dates_with_entries = []
    for date_key, date_entries in entries_by_date.items():
        dates_with_entries.append({
            "date": date_key,
            "entry_count": len(date_entries),
            "types": list(set(e.journal_type for e in date_entries)),
            "entries": date_entries,
        })

    return JournalCalendarOut(
        year=year,
        month=month,
        dates_with_entries=dates_with_entries,
        total_entries=len(entries),
    )


@router.get("/{entry_id}", response_model=JournalEntryOut)
async def get_journal_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific journal entry by ID."""
    result = await db.execute(
        select(JournalEntry).where(
            JournalEntry.id == entry_id,
            JournalEntry.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )

    return entry


@router.put("/{entry_id}", response_model=JournalEntryOut)
async def update_journal_entry(
    entry_id: UUID,
    entry_data: JournalEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a journal entry."""
    result = await db.execute(
        select(JournalEntry).where(
            JournalEntry.id == entry_id,
            JournalEntry.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )

    # Update fields that are provided
    update_data = entry_data.model_dump(exclude_unset=True)

    # Recalculate word count if content is updated
    if "content" in update_data and update_data["content"]:
        update_data["word_count"] = len(update_data["content"].split())

    for field, value in update_data.items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)

    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a journal entry."""
    result = await db.execute(
        select(JournalEntry).where(
            JournalEntry.id == entry_id,
            JournalEntry.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )

    await db.delete(entry)
    await db.commit()

    return None
