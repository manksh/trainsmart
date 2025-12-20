"""Training Modules API endpoints."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import attributes

from app.database import get_db
from app.models import (
    User,
    TrainingModule,
    ModuleProgress,
    ModuleStatus,
    Membership,
)
from app.schemas.training_module import (
    ModulesConfigOut,
    ModuleListItem,
    ModuleContentOut,
    ModuleProgressCreate,
    ModuleProgressUpdate,
    ModuleProgressOut,
    AllModulesStatusOut,
    ModuleStatusItem,
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


def calculate_progress_percentage(progress: ModuleProgress, module: TrainingModule) -> int:
    """Calculate completion percentage for a module progress record."""
    if progress.is_completed:
        return 100

    if not progress.is_started:
        return 0

    progress_data = progress.progress_data or {}
    content = module.content or {}

    # Check for sequential_activities flow type (About Performance style)
    if content.get("flow_type") == "sequential_activities":
        return _calculate_sequential_progress(progress_data, content)

    # Original sections-based calculation (Being Human style)
    return _calculate_sections_progress(progress, module)


def _calculate_sequential_progress(progress_data: dict, content: dict) -> int:
    """Calculate progress for sequential_activities flow type."""
    activities = content.get("activities", [])
    if not activities:
        return 0

    total_screens = 0
    completed_screens = 0

    activities_completed = set(progress_data.get("activities_completed", []))
    screen_responses = progress_data.get("screen_responses", {})
    current_activity = progress_data.get("current_activity")
    current_screen = progress_data.get("current_screen", 0)

    for activity in activities:
        activity_id = activity.get("id")
        screens = activity.get("screens", [])
        num_screens = len(screens)
        total_screens += num_screens

        if activity_id in activities_completed:
            # Completed activity - all screens count
            completed_screens += num_screens
        elif activity_id == current_activity:
            # Current activity - count screens up to current position
            completed_screens += current_screen
            # Also count any screens with responses
            for screen in screens:
                screen_id = screen.get("id")
                if screen_id in screen_responses:
                    # Don't double count if already included in current_screen
                    screen_index = next(
                        (i for i, s in enumerate(screens) if s.get("id") == screen_id),
                        -1
                    )
                    if screen_index >= current_screen:
                        completed_screens += 1

    if total_screens == 0:
        return 0

    return min(99, int((completed_screens / total_screens) * 100))


def _calculate_sections_progress(progress: ModuleProgress, module: TrainingModule) -> int:
    """Calculate progress for sections-based flow type (Being Human style)."""
    sections = module.content.get("sections", [])
    if not sections:
        return 0

    total_items = 0
    completed_items = 0

    progress_data = progress.progress_data or {}
    cards_viewed = set(progress_data.get("cards_viewed", []))
    sections_completed = set(progress_data.get("sections_completed", []))
    examples_viewed = set(progress_data.get("examples_viewed", []))

    for section in sections:
        section_type = section.get("type")

        if section_type == "card_deck":
            cards = section.get("cards", [])
            total_items += len(cards)
            completed_items += len([c for c in cards if c.get("id") in cards_viewed])

        elif section_type == "example_screens":
            examples = section.get("examples", [])
            total_items += len(examples)
            completed_items += len([e for e in examples if e.get("id") in examples_viewed])

        elif section_type == "activity_sequence":
            activities = section.get("activities", [])
            total_items += len(activities)
            activity_responses = progress.activity_responses or {}
            completed_items += len([a for a in activities if a.get("id") in activity_responses])

        elif section_type in ("grid_selection", "personal_selection"):
            total_items += 1
            if section.get("id") in sections_completed:
                completed_items += 1

    if total_items == 0:
        return 0

    return int((completed_items / total_items) * 100)


@router.get("/config", response_model=ModulesConfigOut)
async def get_modules_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get list of available training modules."""
    result = await db.execute(
        select(TrainingModule)
        .where(TrainingModule.status == ModuleStatus.ACTIVE.value)
        .order_by(TrainingModule.order_index)
    )
    modules = result.scalars().all()

    return ModulesConfigOut(
        modules=[
            ModuleListItem(
                slug=m.slug,
                name=m.name,
                description=m.description,
                icon=m.icon,
                color=m.color,
                estimated_minutes=m.estimated_minutes,
                is_premium=m.is_premium,
                requires_assessment=m.requires_assessment,
            )
            for m in modules
        ]
    )


@router.get("/status/me", response_model=AllModulesStatusOut)
async def get_all_modules_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get status of all modules for current user."""
    # Get all active modules
    modules_result = await db.execute(
        select(TrainingModule)
        .where(TrainingModule.status == ModuleStatus.ACTIVE.value)
        .order_by(TrainingModule.order_index)
    )
    modules = modules_result.scalars().all()

    # Get user's progress for all modules
    progress_result = await db.execute(
        select(ModuleProgress)
        .where(ModuleProgress.user_id == current_user.id)
    )
    progress_records = {p.module_id: p for p in progress_result.scalars().all()}

    module_statuses = []
    completed_count = 0
    in_progress_count = 0

    for module in modules:
        progress = progress_records.get(module.id)

        if progress:
            is_started = progress.is_started
            is_completed = progress.is_completed
            progress_pct = calculate_progress_percentage(progress, module)
            completed_at = progress.completed_at

            if is_completed:
                completed_count += 1
            elif is_started:
                in_progress_count += 1
        else:
            is_started = False
            is_completed = False
            progress_pct = 0
            completed_at = None

        module_statuses.append(
            ModuleStatusItem(
                module_slug=module.slug,
                module_name=module.name,
                is_started=is_started,
                is_completed=is_completed,
                progress_percentage=progress_pct,
                completed_at=completed_at,
            )
        )

    return AllModulesStatusOut(
        modules=module_statuses,
        total_modules=len(modules),
        completed_count=completed_count,
        in_progress_count=in_progress_count,
    )


@router.get("/{module_slug}", response_model=ModuleContentOut)
async def get_module_content(
    module_slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get full module content by slug."""
    result = await db.execute(
        select(TrainingModule).where(
            TrainingModule.slug == module_slug,
            TrainingModule.status == ModuleStatus.ACTIVE.value,
        )
    )
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    return module


@router.post("/progress/start", response_model=ModuleProgressOut, status_code=status.HTTP_201_CREATED)
async def start_module(
    data: ModuleProgressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Start a module (create progress record)."""
    # Verify membership
    if not await verify_membership(db, current_user.id, data.organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization",
        )

    # Get the module
    module_result = await db.execute(
        select(TrainingModule).where(
            TrainingModule.slug == data.module_slug,
            TrainingModule.status == ModuleStatus.ACTIVE.value,
        )
    )
    module = module_result.scalar_one_or_none()

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    # Check if progress already exists
    existing_result = await db.execute(
        select(ModuleProgress).where(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_id == module.id,
            ModuleProgress.organization_id == data.organization_id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        # Return existing progress instead of error
        return ModuleProgressOut(
            id=existing.id,
            user_id=existing.user_id,
            organization_id=existing.organization_id,
            module_id=existing.module_id,
            module_slug=module.slug,
            progress_data=existing.progress_data,
            current_section=existing.current_section,
            current_step=existing.current_step,
            is_started=existing.is_started,
            is_completed=existing.is_completed,
            completed_at=existing.completed_at,
            activity_responses=existing.activity_responses,
            personal_selections=existing.personal_selections,
            total_time_seconds=existing.total_time_seconds,
            progress_percentage=calculate_progress_percentage(existing, module),
            created_at=existing.created_at,
            updated_at=existing.updated_at,
        )

    # Initialize progress_data based on module flow type
    module_content = module.content or {}
    flow_type = module_content.get("flow_type")

    if flow_type == "sequential_activities":
        # For sequential activities modules (About Performance, Building Confidence)
        initial_progress_data = {
            "activities_completed": [],
            "current_activity": None,
            "current_screen": 0,
            "screen_responses": {},
        }
    else:
        # For sections-based modules (Being Human)
        initial_progress_data = {
            "cards_viewed": [],
            "sections_completed": [],
            "examples_viewed": [],
        }

    # Create new progress record
    progress = ModuleProgress(
        user_id=current_user.id,
        organization_id=data.organization_id,
        module_id=module.id,
        is_started=True,
        progress_data=initial_progress_data,
        activity_responses={},
        personal_selections={},
    )

    db.add(progress)
    await db.commit()
    await db.refresh(progress)

    return ModuleProgressOut(
        id=progress.id,
        user_id=progress.user_id,
        organization_id=progress.organization_id,
        module_id=progress.module_id,
        module_slug=module.slug,
        progress_data=progress.progress_data,
        current_section=progress.current_section,
        current_step=progress.current_step,
        is_started=progress.is_started,
        is_completed=progress.is_completed,
        completed_at=progress.completed_at,
        activity_responses=progress.activity_responses,
        personal_selections=progress.personal_selections,
        total_time_seconds=progress.total_time_seconds,
        progress_percentage=calculate_progress_percentage(progress, module),
        created_at=progress.created_at,
        updated_at=progress.updated_at,
    )


@router.get("/progress/me/{module_slug}", response_model=Optional[ModuleProgressOut])
async def get_my_module_progress(
    module_slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's progress for a specific module."""
    # Get the module
    module_result = await db.execute(
        select(TrainingModule).where(TrainingModule.slug == module_slug)
    )
    module = module_result.scalar_one_or_none()

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )

    # Get progress
    progress_result = await db.execute(
        select(ModuleProgress).where(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_id == module.id,
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        return None

    return ModuleProgressOut(
        id=progress.id,
        user_id=progress.user_id,
        organization_id=progress.organization_id,
        module_id=progress.module_id,
        module_slug=module.slug,
        progress_data=progress.progress_data,
        current_section=progress.current_section,
        current_step=progress.current_step,
        is_started=progress.is_started,
        is_completed=progress.is_completed,
        completed_at=progress.completed_at,
        activity_responses=progress.activity_responses,
        personal_selections=progress.personal_selections,
        total_time_seconds=progress.total_time_seconds,
        progress_percentage=calculate_progress_percentage(progress, module),
        created_at=progress.created_at,
        updated_at=progress.updated_at,
    )


@router.patch("/progress/{progress_id}", response_model=ModuleProgressOut)
async def update_module_progress(
    progress_id: UUID,
    data: ModuleProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update module progress (cards viewed, activity responses, etc.)."""
    # Get progress record
    result = await db.execute(
        select(ModuleProgress).where(
            ModuleProgress.id == progress_id,
            ModuleProgress.user_id == current_user.id,
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress record not found",
        )

    # Get the module for slug
    module_result = await db.execute(
        select(TrainingModule).where(TrainingModule.id == progress.module_id)
    )
    module = module_result.scalar_one_or_none()

    # Update progress_data
    if data.cards_viewed is not None:
        current_data = progress.progress_data or {}
        existing_cards = set(current_data.get("cards_viewed", []))
        existing_cards.update(data.cards_viewed)
        current_data["cards_viewed"] = list(existing_cards)
        progress.progress_data = current_data

    if data.sections_completed is not None:
        current_data = progress.progress_data or {}
        existing_sections = set(current_data.get("sections_completed", []))
        existing_sections.update(data.sections_completed)
        current_data["sections_completed"] = list(existing_sections)
        progress.progress_data = current_data

    if data.examples_viewed is not None:
        current_data = progress.progress_data or {}
        existing_examples = set(current_data.get("examples_viewed", []))
        existing_examples.update(data.examples_viewed)
        current_data["examples_viewed"] = list(existing_examples)
        progress.progress_data = current_data

    # Update location
    if data.current_section is not None:
        progress.current_section = data.current_section

    if data.current_step is not None:
        progress.current_step = data.current_step

    # Update activity responses
    if data.activity_response is not None:
        current_responses = progress.activity_responses or {}
        current_responses.update(data.activity_response)
        progress.activity_responses = current_responses

    # Update personal selections
    if data.personal_selection is not None:
        current_selections = progress.personal_selections or {}
        current_selections.update(data.personal_selection)
        progress.personal_selections = current_selections

    # Update time spent
    if data.time_spent_seconds is not None:
        progress.total_time_seconds = (progress.total_time_seconds or 0) + data.time_spent_seconds

    # Handle full progress_data update (for sequential activities flow)
    if data.progress_data is not None:
        current_data = progress.progress_data or {}
        # Merge the new progress_data with existing
        for key, value in data.progress_data.items():
            if key == "activities_completed":
                # Merge activities_completed arrays (don't duplicate)
                existing = set(current_data.get("activities_completed", []))
                if isinstance(value, list):
                    existing.update(value)
                current_data["activities_completed"] = list(existing)
            elif key == "screen_responses":
                # Merge screen_responses dicts
                existing_responses = current_data.get("screen_responses", {})
                if isinstance(value, dict):
                    existing_responses.update(value)
                current_data["screen_responses"] = existing_responses
            else:
                # For other fields like current_activity, current_screen, just overwrite
                current_data[key] = value
        progress.progress_data = current_data
        # Flag the JSONB column as modified so SQLAlchemy detects the change
        attributes.flag_modified(progress, "progress_data")

    await db.commit()
    await db.refresh(progress)

    return ModuleProgressOut(
        id=progress.id,
        user_id=progress.user_id,
        organization_id=progress.organization_id,
        module_id=progress.module_id,
        module_slug=module.slug if module else "",
        progress_data=progress.progress_data,
        current_section=progress.current_section,
        current_step=progress.current_step,
        is_started=progress.is_started,
        is_completed=progress.is_completed,
        completed_at=progress.completed_at,
        activity_responses=progress.activity_responses,
        personal_selections=progress.personal_selections,
        total_time_seconds=progress.total_time_seconds,
        progress_percentage=calculate_progress_percentage(progress, module) if module else 0,
        created_at=progress.created_at,
        updated_at=progress.updated_at,
    )


@router.post("/progress/{progress_id}/complete", response_model=ModuleProgressOut)
async def complete_module(
    progress_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark a module as completed."""
    from datetime import datetime

    # Get progress record
    result = await db.execute(
        select(ModuleProgress).where(
            ModuleProgress.id == progress_id,
            ModuleProgress.user_id == current_user.id,
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress record not found",
        )

    # Get the module for slug
    module_result = await db.execute(
        select(TrainingModule).where(TrainingModule.id == progress.module_id)
    )
    module = module_result.scalar_one_or_none()

    # Mark as completed
    progress.is_completed = True
    progress.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(progress)

    return ModuleProgressOut(
        id=progress.id,
        user_id=progress.user_id,
        organization_id=progress.organization_id,
        module_id=progress.module_id,
        module_slug=module.slug if module else "",
        progress_data=progress.progress_data,
        current_section=progress.current_section,
        current_step=progress.current_step,
        is_started=progress.is_started,
        is_completed=progress.is_completed,
        completed_at=progress.completed_at,
        activity_responses=progress.activity_responses,
        personal_selections=progress.personal_selections,
        total_time_seconds=progress.total_time_seconds,
        progress_percentage=calculate_progress_percentage(progress, module) if module else 100,
        created_at=progress.created_at,
        updated_at=progress.updated_at,
    )
