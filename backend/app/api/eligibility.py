from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import StudentEligibility, PlacementDrive
from app.models.schemas import StudentEligibilityResponse, EligibilityOverrideRequest
from app.agents.eligibility_agent import eligibility_agent
from app.agents.context_router import context_router

router = APIRouter(prefix="/api/eligibility", tags=["Eligibility Engine"])

@router.get("/drive/{drive_id}", response_model=List[StudentEligibilityResponse])
def get_drive_eligibility(
    drive_id: int,
    is_eligible: Optional[bool] = None,
    branch: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(StudentEligibility).filter(StudentEligibility.drive_id == drive_id)
    if is_eligible is not None:
        query = query.filter(StudentEligibility.is_eligible == is_eligible)
    
    records = query.all()
    if branch:
        records = [r for r in records if r.student and r.student.branch == branch]
    return records

@router.post("/drive/{drive_id}/evaluate")
def evaluate_eligibility(drive_id: int, db: Session = Depends(get_db)):
    """
    Executes deterministic EligibilityAgent rules across all students for this drive.
    """
    result = eligibility_agent.evaluate_drive_eligibility(db, drive_id)
    context_router.log_event(
        event_type="ELIGIBILITY_EVALUATED",
        drive_id=drive_id,
        agent_name="EligibilityAgent",
        message=f"Eligibility evaluated: {result['eligible_count']} eligible out of {result['total_students']} students ({result['eligibility_rate_pct']}%)",
        payload=result
    )
    return result

@router.post("/override", response_model=StudentEligibilityResponse)
def override_eligibility(
    drive_id: int = Query(...),
    student_id: int = Query(...),
    override_data: EligibilityOverrideRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    TPO manual override for a specific student's eligibility with mandatory audit tracking.
    """
    record = eligibility_agent.override_eligibility(
        db=db,
        drive_id=drive_id,
        student_id=student_id,
        new_is_eligible=override_data.is_eligible,
        reason=override_data.override_reason,
        actor_id=override_data.actor_id
    )

    context_router.log_event(
        event_type="ELIGIBILITY_OVERRIDDEN",
        drive_id=drive_id,
        agent_name="EligibilityAgent",
        message=f"TPO overridden eligibility for Student #{student_id} -> {'ELIGIBLE' if override_data.is_eligible else 'INELIGIBLE'} ({override_data.override_reason})",
        payload={"student_id": student_id, "is_eligible": override_data.is_eligible, "reason": override_data.override_reason}
    )

    return record
