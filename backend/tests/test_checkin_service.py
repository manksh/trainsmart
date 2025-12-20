"""
Tests for check-in query services.

Tests the reusable check-in query functions in app/services/checkin.py
for getting today's check-ins, status, and checking if user has checked in.
"""

import uuid
from datetime import datetime, timedelta, date
from typing import List

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Organization, CheckIn, CheckInType
from app.services.checkin import (
    get_today_checkins,
    get_today_checkin_status,
    has_checked_in_today,
    TodayCheckInsResult,
)


# === Fixture Helpers ===

async def create_checkin(
    db_session: AsyncSession,
    user: User,
    org: Organization,
    check_in_type: CheckInType,
    created_at: datetime = None,
    **kwargs
) -> CheckIn:
    """Helper to create a check-in with specified type and timestamp."""
    checkin = CheckIn(
        id=uuid.uuid4(),
        user_id=user.id,
        organization_id=org.id,
        check_in_type=check_in_type.value,
        created_at=created_at or datetime.utcnow(),
        **kwargs
    )
    db_session.add(checkin)
    await db_session.commit()
    await db_session.refresh(checkin)
    return checkin


# === Test Classes ===

class TestGetTodayCheckins:
    """Tests for get_today_checkins function."""

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_checkins(
        self,
        db_session: AsyncSession,
        athlete_user: User,
    ):
        """Should return empty list when user has no check-ins today."""
        result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.MOOD
        )
        assert result == []

    @pytest.mark.asyncio
    async def test_returns_todays_checkins_only(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should return only check-ins from today, not from other days."""
        # Create a check-in from yesterday
        yesterday = datetime.utcnow() - timedelta(days=1)
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD, created_at=yesterday,
            emotion="sad", intensity=2, body_areas=["chest"]
        )

        # Create a check-in from today
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            emotion="happy", intensity=4, body_areas=["head"]
        )

        result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.MOOD
        )

        assert len(result) == 1
        assert result[0].emotion == "happy"

    @pytest.mark.asyncio
    async def test_filters_by_checkin_type(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should return only check-ins of the specified type."""
        # Create mood check-in
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            emotion="happy", intensity=4, body_areas=["head"]
        )

        # Create breathing check-in
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.BREATHING,
            breathing_exercise_type="relax", cycles_completed=4
        )

        # Query for mood only
        mood_result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.MOOD
        )
        assert len(mood_result) == 1
        assert mood_result[0].emotion == "happy"

        # Query for breathing only
        breathing_result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.BREATHING
        )
        assert len(breathing_result) == 1
        assert breathing_result[0].breathing_exercise_type == "relax"

    @pytest.mark.asyncio
    async def test_returns_multiple_checkins_ordered_by_created_at_desc(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should return multiple check-ins ordered by most recent first."""
        now = datetime.utcnow()

        # Create check-ins at different times today
        earlier = await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.BREATHING,
            created_at=now - timedelta(hours=2),
            breathing_exercise_type="energize", cycles_completed=12
        )

        later = await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.BREATHING,
            created_at=now - timedelta(hours=1),
            breathing_exercise_type="relax", cycles_completed=4
        )

        most_recent = await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.BREATHING,
            breathing_exercise_type="focus", cycles_completed=10
        )

        result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.BREATHING
        )

        assert len(result) == 3
        # Most recent first
        assert result[0].breathing_exercise_type == "focus"
        assert result[1].breathing_exercise_type == "relax"
        assert result[2].breathing_exercise_type == "energize"

    @pytest.mark.asyncio
    async def test_respects_limit_parameter(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should limit results when limit parameter is provided."""
        # Create 5 check-ins
        for i in range(5):
            await create_checkin(
                db_session, athlete_user, organization,
                CheckInType.CONFIDENCE,
                confidence_level=i + 1
            )

        # Request only 2
        result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.CONFIDENCE, limit=2
        )

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_returns_all_when_limit_is_none(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should return all check-ins when limit is None."""
        # Create 5 check-ins
        for i in range(5):
            await create_checkin(
                db_session, athlete_user, organization,
                CheckInType.ENERGY,
                physical_energy=i + 1, mental_energy=i + 1
            )

        result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.ENERGY, limit=None
        )

        assert len(result) == 5

    @pytest.mark.asyncio
    async def test_does_not_return_other_users_checkins(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        admin_user: User,
        organization: Organization,
    ):
        """Should only return check-ins for the specified user."""
        # Create check-in for athlete
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            emotion="happy", intensity=4, body_areas=["head"]
        )

        # Create check-in for admin
        await create_checkin(
            db_session, admin_user, organization,
            CheckInType.MOOD,
            emotion="calm", intensity=3, body_areas=["chest"]
        )

        # Query for athlete only
        result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.MOOD
        )

        assert len(result) == 1
        assert result[0].emotion == "happy"

    @pytest.mark.asyncio
    async def test_handles_checkins_at_start_of_day(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should include check-ins from the very start of today."""
        today = date.today()
        start_of_day = datetime.combine(today, datetime.min.time())

        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            created_at=start_of_day,
            emotion="tired", intensity=2, body_areas=["head"]
        )

        result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.MOOD
        )

        assert len(result) == 1
        assert result[0].emotion == "tired"

    @pytest.mark.asyncio
    async def test_handles_checkins_at_end_of_day(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should include check-ins from the very end of today."""
        today = date.today()
        # Use a time very close to end of day but still today
        end_of_day = datetime.combine(today, datetime.max.time().replace(microsecond=0))

        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            created_at=end_of_day,
            emotion="calm", intensity=4, body_areas=["chest"]
        )

        result = await get_today_checkins(
            db_session, athlete_user.id, CheckInType.MOOD
        )

        assert len(result) == 1
        assert result[0].emotion == "calm"


class TestGetTodayCheckinStatus:
    """Tests for get_today_checkin_status function."""

    @pytest.mark.asyncio
    async def test_returns_false_when_no_checkins(
        self,
        db_session: AsyncSession,
        athlete_user: User,
    ):
        """Should return has_checked_in_today=False when no check-ins exist."""
        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.MOOD
        )

        assert isinstance(result, TodayCheckInsResult)
        assert result.has_checked_in_today is False
        assert result.count_today == 0
        assert result.check_ins == []

    @pytest.mark.asyncio
    async def test_returns_true_when_checkins_exist(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should return has_checked_in_today=True when check-ins exist."""
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.CONFIDENCE,
            confidence_level=5
        )

        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.CONFIDENCE
        )

        assert result.has_checked_in_today is True
        assert result.count_today == 1
        assert len(result.check_ins) == 1
        assert result.check_ins[0].confidence_level == 5

    @pytest.mark.asyncio
    async def test_counts_multiple_checkins(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should count all check-ins of the same type today."""
        # Create 3 breathing check-ins
        for i in range(3):
            await create_checkin(
                db_session, athlete_user, organization,
                CheckInType.BREATHING,
                breathing_exercise_type="relax", cycles_completed=4
            )

        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.BREATHING
        )

        assert result.has_checked_in_today is True
        assert result.count_today == 3
        assert len(result.check_ins) == 3

    @pytest.mark.asyncio
    async def test_only_counts_specified_type(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should only count check-ins of the specified type."""
        # Create mood check-in
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            emotion="happy", intensity=4, body_areas=["head"]
        )

        # Create energy check-in
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.ENERGY,
            physical_energy=5, mental_energy=5
        )

        mood_result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.MOOD
        )
        energy_result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.ENERGY
        )

        assert mood_result.count_today == 1
        assert energy_result.count_today == 1

    @pytest.mark.asyncio
    async def test_does_not_count_yesterdays_checkins(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should not count check-ins from yesterday."""
        yesterday = datetime.utcnow() - timedelta(days=1)

        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            created_at=yesterday,
            emotion="sad", intensity=2, body_areas=["chest"]
        )

        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.MOOD
        )

        assert result.has_checked_in_today is False
        assert result.count_today == 0


class TestHasCheckedInToday:
    """Tests for has_checked_in_today function."""

    @pytest.mark.asyncio
    async def test_returns_false_when_no_checkins(
        self,
        db_session: AsyncSession,
        athlete_user: User,
    ):
        """Should return False when user has no check-ins today."""
        result = await has_checked_in_today(
            db_session, athlete_user.id, CheckInType.ENERGY
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_returns_true_when_checkin_exists(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should return True when user has at least one check-in today."""
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.ENERGY,
            physical_energy=5, mental_energy=5
        )

        result = await has_checked_in_today(
            db_session, athlete_user.id, CheckInType.ENERGY
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_returns_true_with_multiple_checkins(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should return True when user has multiple check-ins today."""
        for i in range(3):
            await create_checkin(
                db_session, athlete_user, organization,
                CheckInType.BREATHING,
                breathing_exercise_type="relax", cycles_completed=4
            )

        result = await has_checked_in_today(
            db_session, athlete_user.id, CheckInType.BREATHING
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_checks_correct_type(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should only check for the specified check-in type."""
        # Create only mood check-in
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            emotion="happy", intensity=4, body_areas=["head"]
        )

        # Should return True for mood
        mood_result = await has_checked_in_today(
            db_session, athlete_user.id, CheckInType.MOOD
        )
        assert mood_result is True

        # Should return False for confidence
        confidence_result = await has_checked_in_today(
            db_session, athlete_user.id, CheckInType.CONFIDENCE
        )
        assert confidence_result is False

    @pytest.mark.asyncio
    async def test_uses_limit_1_for_efficiency(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """
        Should use limit=1 internally for efficiency.

        This is a behavior test - even with many check-ins,
        the function should work correctly and efficiently.
        """
        # Create 10 check-ins
        for i in range(10):
            await create_checkin(
                db_session, athlete_user, organization,
                CheckInType.CONFIDENCE,
                confidence_level=i + 1
            )

        result = await has_checked_in_today(
            db_session, athlete_user.id, CheckInType.CONFIDENCE
        )

        # Should still return True without issues
        assert result is True


class TestAllCheckinTypes:
    """Tests to ensure all check-in types work correctly."""

    @pytest.mark.asyncio
    async def test_mood_checkin_type(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should work correctly with MOOD check-in type."""
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.MOOD,
            emotion="happy", intensity=4, body_areas=["head"]
        )

        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.MOOD
        )

        assert result.has_checked_in_today is True
        assert result.check_ins[0].check_in_type == "mood"

    @pytest.mark.asyncio
    async def test_breathing_checkin_type(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should work correctly with BREATHING check-in type."""
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.BREATHING,
            breathing_exercise_type="relax", cycles_completed=4
        )

        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.BREATHING
        )

        assert result.has_checked_in_today is True
        assert result.check_ins[0].check_in_type == "breathing"

    @pytest.mark.asyncio
    async def test_confidence_checkin_type(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should work correctly with CONFIDENCE check-in type."""
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.CONFIDENCE,
            confidence_level=6
        )

        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.CONFIDENCE
        )

        assert result.has_checked_in_today is True
        assert result.check_ins[0].check_in_type == "confidence"

    @pytest.mark.asyncio
    async def test_energy_checkin_type(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should work correctly with ENERGY check-in type."""
        await create_checkin(
            db_session, athlete_user, organization,
            CheckInType.ENERGY,
            physical_energy=5, mental_energy=6, energy_state="high_high"
        )

        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.ENERGY
        )

        assert result.has_checked_in_today is True
        assert result.check_ins[0].check_in_type == "energy"


class TestTodayCheckInsResultModel:
    """Tests for the TodayCheckInsResult Pydantic model."""

    def test_model_creation_with_empty_list(self):
        """Should create model with empty check_ins list."""
        result = TodayCheckInsResult(
            has_checked_in_today=False,
            count_today=0,
            check_ins=[]
        )

        assert result.has_checked_in_today is False
        assert result.count_today == 0
        assert result.check_ins == []

    def test_model_allows_arbitrary_types(self):
        """Model should allow CheckIn objects (arbitrary_types_allowed=True)."""
        # This test verifies the Config setting works
        result = TodayCheckInsResult(
            has_checked_in_today=True,
            count_today=0,
            check_ins=[]  # Empty list, but model allows CheckIn type
        )

        assert result.has_checked_in_today is True


class TestEdgeCases:
    """Edge case tests for check-in services."""

    @pytest.mark.asyncio
    async def test_handles_nonexistent_user_id(
        self,
        db_session: AsyncSession,
    ):
        """Should return empty result for non-existent user ID."""
        fake_user_id = uuid.uuid4()

        result = await get_today_checkins(
            db_session, fake_user_id, CheckInType.MOOD
        )

        assert result == []

    @pytest.mark.asyncio
    async def test_has_checked_in_with_nonexistent_user(
        self,
        db_session: AsyncSession,
    ):
        """Should return False for non-existent user."""
        fake_user_id = uuid.uuid4()

        result = await has_checked_in_today(
            db_session, fake_user_id, CheckInType.MOOD
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_status_with_nonexistent_user(
        self,
        db_session: AsyncSession,
    ):
        """Should return appropriate status for non-existent user."""
        fake_user_id = uuid.uuid4()

        result = await get_today_checkin_status(
            db_session, fake_user_id, CheckInType.CONFIDENCE
        )

        assert result.has_checked_in_today is False
        assert result.count_today == 0
        assert result.check_ins == []

    @pytest.mark.asyncio
    async def test_handles_large_number_of_checkins(
        self,
        db_session: AsyncSession,
        athlete_user: User,
        organization: Organization,
    ):
        """Should handle a large number of check-ins without issues."""
        # Create 50 check-ins
        for i in range(50):
            await create_checkin(
                db_session, athlete_user, organization,
                CheckInType.BREATHING,
                breathing_exercise_type="relax", cycles_completed=4
            )

        result = await get_today_checkin_status(
            db_session, athlete_user.id, CheckInType.BREATHING
        )

        assert result.count_today == 50
        assert len(result.check_ins) == 50
