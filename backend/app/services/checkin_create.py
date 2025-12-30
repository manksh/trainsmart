"""
Check-in creation service.

Provides a generic function for creating check-ins of any type,
reducing duplication across the check-in API endpoints.
"""

from typing import Any, Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import verify_org_membership
from app.models.checkin import CheckIn, CheckInType


async def create_checkin_record(
    db: AsyncSession,
    user_id: UUID,
    organization_id: UUID,
    check_in_type: CheckInType,
    **type_specific_fields: Any,
) -> CheckIn:
    """
    Create a new check-in record after verifying organization membership.

    This function handles the common pattern across all check-in types:
    1. Verify user is a member of the organization
    2. Create the CheckIn record with common and type-specific fields
    3. Persist to database and refresh

    Args:
        db: Database session
        user_id: ID of the user creating the check-in
        organization_id: ID of the organization context
        check_in_type: The type of check-in (MOOD, BREATHING, CONFIDENCE, ENERGY)
        **type_specific_fields: Additional fields specific to the check-in type

    Returns:
        The created CheckIn record

    Raises:
        HTTPException: 403 if user is not a member of the organization

    Example:
        # Creating a mood check-in
        checkin = await create_checkin_record(
            db=db,
            user_id=user.id,
            organization_id=data.organization_id,
            check_in_type=CheckInType.MOOD,
            emotion=data.emotion,
            intensity=data.intensity,
            body_areas=data.body_areas,
            signal_resonated=data.signal_resonated,
            selected_action=data.selected_action,
            notes=data.notes,
        )

        # Creating a breathing check-in
        checkin = await create_checkin_record(
            db=db,
            user_id=user.id,
            organization_id=data.organization_id,
            check_in_type=CheckInType.BREATHING,
            breathing_exercise_type=data.breathing_exercise_type,
            cycles_completed=data.cycles_completed,
            duration_seconds=data.duration_seconds,
            trigger_selected=data.trigger_selected,
            effectiveness_rating=data.effectiveness_rating,
            notes=data.notes,
        )
    """
    # Verify user has membership in the organization
    await verify_org_membership(db, user_id, organization_id)

    # Create the check-in with common fields plus type-specific fields
    new_checkin = CheckIn(
        user_id=user_id,
        organization_id=organization_id,
        check_in_type=check_in_type.value,
        **type_specific_fields,
    )

    db.add(new_checkin)
    await db.commit()
    await db.refresh(new_checkin)

    return new_checkin


def build_checkin_fields(
    base_fields: Dict[str, Any],
    optional_fields: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build a dictionary of check-in fields, filtering out None values for optional fields.

    This utility helps construct the keyword arguments for create_checkin_record
    when you want to exclude None values from optional fields.

    Args:
        base_fields: Required fields that should always be included
        optional_fields: Optional fields where None values should be filtered out

    Returns:
        Combined dictionary with base fields and non-None optional fields

    Example:
        fields = build_checkin_fields(
            base_fields={
                "breathing_exercise_type": data.breathing_exercise_type,
                "cycles_completed": data.cycles_completed,
            },
            optional_fields={
                "duration_seconds": data.duration_seconds,
                "trigger_selected": data.trigger_selected,
                "effectiveness_rating": data.effectiveness_rating,
                "notes": data.notes,
            },
        )
    """
    result = base_fields.copy()
    result.update({k: v for k, v in optional_fields.items() if v is not None})
    return result
