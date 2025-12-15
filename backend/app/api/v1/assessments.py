"""
Assessment API endpoints.
"""

from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user, get_current_superadmin
from app.models.user import User
from app.models.assessment import Assessment, AssessmentResponse
from app.models.membership import Membership
from app.schemas.assessment import (
    AssessmentOut,
    AssessmentSummary,
    AssessmentSubmission,
    AssessmentResultOut,
    AssessmentStatusOut,
)
from app.services.scoring import score_assessment

router = APIRouter()


@router.get("/", response_model=list[AssessmentSummary])
async def list_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all active assessments."""
    result = await db.execute(
        select(Assessment).where(Assessment.is_active == True)
    )
    assessments = result.scalars().all()

    return [
        AssessmentSummary(
            id=a.id,
            name=a.name,
            description=a.description,
            sport=a.sport,
            question_count=len(a.questions) if a.questions else 0,
            is_active=a.is_active,
        )
        for a in assessments
    ]


@router.get("/{assessment_id}", response_model=AssessmentOut)
async def get_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get assessment with all questions."""
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    return assessment


@router.get("/me/status", response_model=AssessmentStatusOut)
async def get_my_assessment_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if current user has completed an assessment."""
    result = await db.execute(
        select(AssessmentResponse)
        .where(AssessmentResponse.user_id == current_user.id)
        .where(AssessmentResponse.is_complete == True)
        .order_by(AssessmentResponse.completed_at.desc())
        .limit(1)
    )
    response = result.scalar_one_or_none()

    if response:
        return AssessmentStatusOut(
            has_completed=True,
            response_id=response.id,
            completed_at=response.completed_at,
        )

    return AssessmentStatusOut(has_completed=False)


@router.post("/submit", response_model=AssessmentResultOut)
async def submit_assessment(
    submission: AssessmentSubmission,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit completed assessment answers and get results."""
    # Verify user has membership in the organization
    membership_result = await db.execute(
        select(Membership)
        .where(Membership.user_id == current_user.id)
        .where(Membership.organization_id == submission.organization_id)
    )
    membership = membership_result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )

    # Get the assessment
    assessment_result = await db.execute(
        select(Assessment).where(Assessment.id == submission.assessment_id)
    )
    assessment = assessment_result.scalar_one_or_none()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    # Convert answers to dict format
    answers_dict = {str(a.question_id): a.value for a in submission.answers}

    # Validate all questions are answered
    expected_count = len(assessment.questions)
    if len(answers_dict) < expected_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {expected_count} answers, got {len(answers_dict)}"
        )

    # Score the assessment
    scoring_result = score_assessment(answers_dict, assessment.questions)

    # Create response record
    response = AssessmentResponse(
        user_id=current_user.id,
        assessment_id=submission.assessment_id,
        organization_id=submission.organization_id,
        answers=answers_dict,
        pillar_scores=scoring_result["pillar_scores"],
        meta_scores=scoring_result["meta_scores"],
        strengths=scoring_result["strengths"],
        growth_areas=scoring_result["growth_areas"],
        is_complete=True,
        completed_at=datetime.utcnow(),
    )

    db.add(response)
    await db.commit()
    await db.refresh(response)

    return response


@router.get("/results/{response_id}", response_model=AssessmentResultOut)
async def get_assessment_results(
    response_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get assessment results for a specific response."""
    result = await db.execute(
        select(AssessmentResponse)
        .where(AssessmentResponse.id == response_id)
    )
    response = result.scalar_one_or_none()

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment response not found"
        )

    # Users can only see their own results (unless admin - TODO)
    if response.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return response


@router.get("/results/me/latest", response_model=AssessmentResultOut)
async def get_my_latest_results(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's most recent assessment results."""
    result = await db.execute(
        select(AssessmentResponse)
        .where(AssessmentResponse.user_id == current_user.id)
        .where(AssessmentResponse.is_complete == True)
        .order_by(AssessmentResponse.completed_at.desc())
        .limit(1)
    )
    response = result.scalar_one_or_none()

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No completed assessment found"
        )

    return response


@router.delete("/me/reset")
async def reset_my_assessment(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Reset/delete all assessment responses for the current user.
    NOTE: This is a testing endpoint - should be removed or restricted in production.
    """
    result = await db.execute(
        select(AssessmentResponse)
        .where(AssessmentResponse.user_id == current_user.id)
    )
    responses = result.scalars().all()

    for response in responses:
        await db.delete(response)

    await db.commit()

    return {"message": f"Deleted {len(responses)} assessment response(s)"}
