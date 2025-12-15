from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.api.deps import CurrentUser, SuperAdmin
from app.schemas import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationWithStats,
    AthleteWithAssessmentStatus,
)
from app.models import Organization, Membership, User
from app.models.membership import MembershipRole, MembershipStatus
from app.models.assessment import AssessmentResponse

router = APIRouter()


@router.get("", response_model=list[OrganizationWithStats])
async def list_organizations(
    current_user: SuperAdmin,
    db: AsyncSession = Depends(get_db),
):
    """List all organizations (SuperAdmin only)."""
    result = await db.execute(
        select(Organization).order_by(Organization.created_at.desc())
    )
    organizations = result.scalars().all()

    # Get stats for each org
    org_stats = []
    for org in organizations:
        # Count admins
        admin_result = await db.execute(
            select(func.count(Membership.id))
            .where(Membership.organization_id == org.id)
            .where(Membership.role == MembershipRole.ADMIN)
        )
        admin_count = admin_result.scalar()

        # Count athletes
        athlete_result = await db.execute(
            select(func.count(Membership.id))
            .where(Membership.organization_id == org.id)
            .where(Membership.role == MembershipRole.ATHLETE)
        )
        athlete_count = athlete_result.scalar()

        org_stats.append(
            OrganizationWithStats(
                **OrganizationResponse.model_validate(org).model_dump(),
                admin_count=admin_count,
                athlete_count=athlete_count,
            )
        )

    return org_stats


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    current_user: SuperAdmin,
    db: AsyncSession = Depends(get_db),
):
    """Create a new organization (SuperAdmin only)."""
    organization = Organization(
        name=org_data.name,
        sport=org_data.sport,
        description=org_data.description,
        created_by=current_user.id,
    )
    db.add(organization)
    await db.commit()
    await db.refresh(organization)
    return OrganizationResponse.model_validate(organization)


@router.get("/{org_id}", response_model=OrganizationWithStats)
async def get_organization(
    org_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get organization details. Accessible by SuperAdmin or org members."""
    # Check access
    if not current_user.is_superadmin:
        # Check if user is member of this org
        result = await db.execute(
            select(Membership)
            .where(Membership.user_id == current_user.id)
            .where(Membership.organization_id == org_id)
        )
        membership = result.scalar_one_or_none()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this organization",
            )

    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Get stats
    admin_result = await db.execute(
        select(func.count(Membership.id))
        .where(Membership.organization_id == org.id)
        .where(Membership.role == MembershipRole.ADMIN)
    )
    admin_count = admin_result.scalar()

    athlete_result = await db.execute(
        select(func.count(Membership.id))
        .where(Membership.organization_id == org.id)
        .where(Membership.role == MembershipRole.ATHLETE)
    )
    athlete_count = athlete_result.scalar()

    return OrganizationWithStats(
        **OrganizationResponse.model_validate(org).model_dump(),
        admin_count=admin_count,
        athlete_count=athlete_count,
    )


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    current_user: SuperAdmin,
    db: AsyncSession = Depends(get_db),
):
    """Update organization (SuperAdmin only)."""
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    update_data = org_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)

    await db.commit()
    await db.refresh(org)
    return OrganizationResponse.model_validate(org)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: UUID,
    current_user: SuperAdmin,
    db: AsyncSession = Depends(get_db),
):
    """Delete organization (SuperAdmin only)."""
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    await db.delete(org)
    await db.commit()


@router.get("/{org_id}/athletes", response_model=list[AthleteWithAssessmentStatus])
async def get_organization_athletes(
    org_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all athletes for an organization with their assessment status.
    Accessible by SuperAdmin or admins of the organization.
    """
    # Check access - must be superadmin or admin of this org
    if not current_user.is_superadmin:
        result = await db.execute(
            select(Membership)
            .where(Membership.user_id == current_user.id)
            .where(Membership.organization_id == org_id)
            .where(Membership.role == MembershipRole.ADMIN)
        )
        membership = result.scalar_one_or_none()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view athletes for this organization",
            )

    # Get all athlete memberships for this org
    result = await db.execute(
        select(Membership, User)
        .join(User, Membership.user_id == User.id)
        .where(Membership.organization_id == org_id)
        .where(Membership.role == MembershipRole.ATHLETE)
        .where(Membership.status == MembershipStatus.ACTIVE)
        .order_by(User.last_name, User.first_name)
    )
    athlete_memberships = result.all()

    # Get assessment responses for these athletes
    athlete_ids = [m.user_id for m, _ in athlete_memberships]
    assessment_result = await db.execute(
        select(AssessmentResponse)
        .where(AssessmentResponse.user_id.in_(athlete_ids))
        .where(AssessmentResponse.organization_id == org_id)
        .where(AssessmentResponse.is_complete == True)
    )
    assessment_responses = {r.user_id: r for r in assessment_result.scalars().all()}

    # Build response
    athletes = []
    for membership, user in athlete_memberships:
        assessment = assessment_responses.get(user.id)
        athletes.append(
            AthleteWithAssessmentStatus(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                is_superadmin=user.is_superadmin,
                is_active=user.is_active,
                created_at=user.created_at,
                joined_at=membership.joined_at,
                has_completed_assessment=assessment is not None,
                assessment_completed_at=assessment.completed_at if assessment else None,
                pillar_scores=assessment.pillar_scores if assessment else None,
                strengths=assessment.strengths if assessment else None,
                growth_areas=assessment.growth_areas if assessment else None,
            )
        )

    return athletes
