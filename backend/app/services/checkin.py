"""
Check-in query services.

Provides reusable query functions for check-in data access patterns.
"""

from datetime import date, datetime, timezone
from typing import List, Optional, TypeVar, Generic
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from zoneinfo import ZoneInfo

from app.models.checkin import CheckIn, CheckInType

# Use Eastern Time for all date calculations
EASTERN_TZ = ZoneInfo("America/New_York")


class TodayCheckInsResult(BaseModel):
    """Result of a today's check-ins query."""
    has_checked_in_today: bool
    count_today: int
    check_ins: List[CheckIn]

    class Config:
        arbitrary_types_allowed = True


async def get_today_checkins(
    db: AsyncSession,
    user_id: UUID,
    check_in_type: CheckInType,
    *,
    limit: Optional[int] = None,
) -> List[CheckIn]:
    """
    Get check-ins for a user from today, filtered by check-in type.

    This extracts the common pattern of querying for "today's check-ins"
    used across mood, breathing, confidence, and energy check-in endpoints.

    Args:
        db: Database session
        user_id: ID of the user
        check_in_type: Type of check-in to filter by
        limit: Optional limit on number of results (default: no limit)

    Returns:
        List of CheckIn records from today, ordered by created_at desc
    """
    # Get "today" in Eastern Time
    now_eastern = datetime.now(EASTERN_TZ)
    today = now_eastern.date()

    # Create timezone-aware boundaries in Eastern Time, then convert to UTC for DB query
    start_of_day_eastern = datetime.combine(today, datetime.min.time(), tzinfo=EASTERN_TZ)
    end_of_day_eastern = datetime.combine(today, datetime.max.time(), tzinfo=EASTERN_TZ)

    # Convert to UTC for database comparison (DB stores UTC timestamps)
    start_of_day = start_of_day_eastern.astimezone(timezone.utc).replace(tzinfo=None)
    end_of_day = end_of_day_eastern.astimezone(timezone.utc).replace(tzinfo=None)

    query = (
        select(CheckIn)
        .where(CheckIn.user_id == user_id)
        .where(CheckIn.check_in_type == check_in_type.value)
        .where(CheckIn.created_at >= start_of_day)
        .where(CheckIn.created_at <= end_of_day)
        .order_by(CheckIn.created_at.desc())
    )

    if limit is not None:
        query = query.limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_today_checkin_status(
    db: AsyncSession,
    user_id: UUID,
    check_in_type: CheckInType,
) -> TodayCheckInsResult:
    """
    Get today's check-in status for a user.

    Convenience wrapper around get_today_checkins that returns a structured
    result with has_checked_in_today flag.

    Args:
        db: Database session
        user_id: ID of the user
        check_in_type: Type of check-in to filter by

    Returns:
        TodayCheckInsResult with status and check-in list
    """
    check_ins = await get_today_checkins(db, user_id, check_in_type)

    return TodayCheckInsResult(
        has_checked_in_today=len(check_ins) > 0,
        count_today=len(check_ins),
        check_ins=check_ins,
    )


async def has_checked_in_today(
    db: AsyncSession,
    user_id: UUID,
    check_in_type: CheckInType,
) -> bool:
    """
    Quick check if user has completed a check-in of the given type today.

    More efficient than get_today_checkins when you only need to know
    if any check-ins exist (uses LIMIT 1).

    Args:
        db: Database session
        user_id: ID of the user
        check_in_type: Type of check-in to filter by

    Returns:
        True if user has at least one check-in of this type today
    """
    check_ins = await get_today_checkins(
        db, user_id, check_in_type, limit=1
    )
    return len(check_ins) > 0
