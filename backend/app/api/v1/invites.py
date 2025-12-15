from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.api.deps import CurrentUser, SuperAdmin
from app.schemas import InviteCreate, InviteResponse, InviteWithOrg, InviteValidation
from app.models import Invite, Organization, Membership, User
from app.models.membership import MembershipRole

router = APIRouter()


@router.post("", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite(
    invite_data: InviteCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Create an invite.
    - SuperAdmin can invite admins to any organization
    - Admin can invite athletes to their organization
    """
    # Check organization exists
    result = await db.execute(
        select(Organization).where(Organization.id == invite_data.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Check permissions
    if not current_user.is_superadmin:
        # Non-superadmin can only invite athletes to orgs they admin
        result = await db.execute(
            select(Membership)
            .where(Membership.user_id == current_user.id)
            .where(Membership.organization_id == invite_data.organization_id)
            .where(Membership.role == MembershipRole.ADMIN)
        )
        admin_membership = result.scalar_one_or_none()

        if not admin_membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to invite users to this organization",
            )

        if invite_data.role == MembershipRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only SuperAdmin can invite organization admins",
            )

    # Check if invite already exists for this email/org
    result = await db.execute(
        select(Invite)
        .where(Invite.email == invite_data.email.lower())
        .where(Invite.organization_id == invite_data.organization_id)
        .where(Invite.used_at.is_(None))
    )
    existing_invite = result.scalar_one_or_none()
    if existing_invite and existing_invite.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active invite already exists for this email",
        )

    # Check if user already member
    result = await db.execute(
        select(User).where(User.email == invite_data.email.lower())
    )
    existing_user = result.scalar_one_or_none()
    if existing_user:
        result = await db.execute(
            select(Membership)
            .where(Membership.user_id == existing_user.id)
            .where(Membership.organization_id == invite_data.organization_id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this organization",
            )

    # Create invite
    invite = Invite(
        email=invite_data.email.lower(),
        organization_id=invite_data.organization_id,
        role=invite_data.role,
        created_by=current_user.id,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)

    return InviteResponse.model_validate(invite)


@router.get("/validate/{code}", response_model=InviteValidation)
async def validate_invite(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Validate an invite code (public endpoint for signup flow)."""
    result = await db.execute(
        select(Invite)
        .options(selectinload(Invite.organization))
        .where(Invite.code == code)
    )
    invite = result.scalar_one_or_none()

    if not invite:
        return InviteValidation(
            is_valid=False,
            message="Invite not found",
        )

    if not invite.is_valid:
        if invite.used_at:
            return InviteValidation(
                is_valid=False,
                message="Invite has already been used",
            )
        return InviteValidation(
            is_valid=False,
            message="Invite has expired",
        )

    return InviteValidation(
        is_valid=True,
        email=invite.email,
        organization_name=invite.organization.name if invite.organization else None,
        role=invite.role,
    )


@router.get("/organization/{org_id}", response_model=list[InviteResponse])
async def list_organization_invites(
    org_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List invites for an organization."""
    # Check permissions
    if not current_user.is_superadmin:
        result = await db.execute(
            select(Membership)
            .where(Membership.user_id == current_user.id)
            .where(Membership.organization_id == org_id)
            .where(Membership.role == MembershipRole.ADMIN)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view invites for this organization",
            )

    result = await db.execute(
        select(Invite)
        .where(Invite.organization_id == org_id)
        .order_by(Invite.created_at.desc())
    )
    invites = result.scalars().all()
    return [InviteResponse.model_validate(inv) for inv in invites]


@router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invite(
    invite_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Delete/revoke an invite."""
    result = await db.execute(
        select(Invite).where(Invite.id == invite_id)
    )
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found",
        )

    # Check permissions
    if not current_user.is_superadmin:
        result = await db.execute(
            select(Membership)
            .where(Membership.user_id == current_user.id)
            .where(Membership.organization_id == invite.organization_id)
            .where(Membership.role == MembershipRole.ADMIN)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this invite",
            )

    await db.delete(invite)
    await db.commit()
