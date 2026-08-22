from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import InterviewSchedule, Student, PlacementDrive
from app.models.schemas import (
    InterviewScheduleResponse, GenerateScheduleRequest, ResolveScheduleConflictRequest
)
from app.agents.scheduling_agent import scheduling_agent
from app.agents.coordination_agent import coordination_agent
from app.agents.context_router import context_router
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/scheduling", tags=["Scheduling & Coordination"])

@router.get("/drive/{drive_id}", response_model=List[InterviewScheduleResponse])
def get_drive_schedule(
    drive_id: int,
    round_number: Optional[int] = None,
    status: Optional[str] = None,
    conflicts_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(InterviewSchedule).filter(InterviewSchedule.drive_id == drive_id)
    if round_number:
        query = query.filter(InterviewSchedule.round_number == round_number)
    if status:
        query = query.filter(InterviewSchedule.status == status)
    if conflicts_only:
        query = query.filter(InterviewSchedule.is_conflict == True)
    
    return query.order_by(InterviewSchedule.start_time.asc()).all()

@router.post("/drive/{drive_id}/generate")
def generate_schedule(drive_id: int, req: GenerateScheduleRequest, db: Session = Depends(get_db)):
    """
    Generates interview slots with panel and room allocation using constraint-satisfaction heuristic.
    """
    result = scheduling_agent.generate_drive_schedule(
        db=db,
        drive_id=drive_id,
        round_number=req.round_number,
        round_name=req.round_name,
        start_date_str=req.start_date,
        start_hour=req.start_hour,
        slot_duration_mins=req.slot_duration_minutes,
        buffer_mins=req.buffer_minutes,
        auto_resolve_conflicts=req.auto_resolve_conflicts
    )

    context_router.log_event(
        event_type="SCHEDULE_GENERATED",
        drive_id=drive_id,
        agent_name="SchedulingAgent",
        message=f"Generated {result['total_scheduled']} interview slots for {result['round_name']}. Conflicts detected: {result['conflicts_detected']}",
        payload=result
    )

    return result

@router.post("/resolve_conflict", response_model=InterviewScheduleResponse)
def resolve_schedule_conflict(data: ResolveScheduleConflictRequest, db: Session = Depends(get_db)):
    """
    Reallocates a conflicting interview slot to another panel, room, or time window.
    """
    updated_schedule = coordination_agent.reallocate_slot(
        db=db,
        schedule_id=data.schedule_id,
        new_panel_id=data.new_panel_id,
        new_room_id=data.new_room_id,
        new_start_time=data.new_start_time,
        new_end_time=data.new_end_time,
        resolution_notes=data.resolution_notes,
        actor_id=data.actor_id
    )
    return updated_schedule

@router.put("/slot/{schedule_id}/status")
def update_slot_status(
    schedule_id: int,
    status: str = Query(...),
    result: Optional[str] = Query(None),
    rating: Optional[float] = Query(None),
    feedback: Optional[str] = Query(None),
    actor_id: str = Query("TPO_ADMIN"),
    db: Session = Depends(get_db)
):
    sch = db.query(InterviewSchedule).filter(InterviewSchedule.id == schedule_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Schedule slot not found")
    
    before_status = sch.status
    before_result = sch.result
    sch.status = status
    if result:
        sch.result = result
    if rating is not None:
        sch.interviewer_rating = rating
    if feedback:
        sch.feedback_notes = feedback

    # If student cleared and received offer
    if result == "SELECTED" and sch.student_id:
        student = db.query(Student).filter(Student.id == sch.student_id).first()
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == sch.drive_id).first()
        if student and drive:
            new_tier = "PLACED_DREAM" if drive.tier == "DREAM" else ("PLACED_TIER_1" if drive.tier == "TIER_1" else "PLACED_TIER_2")
            student.placement_status = new_tier
            student.current_company = drive.company.name if drive.company else "Company"
            student.current_package_lpa = drive.ctc_lpa

            AuditService.log_action(
                db=db,
                action_type="OFFER_ACCEPTED",
                target_type="Student",
                target_id=str(student.id),
                drive_id=sch.drive_id,
                before_state={"status": student.placement_status},
                after_state={"status": new_tier, "company": student.current_company, "ctc_lpa": student.current_package_lpa},
                reason=f"Interview cleared for {drive.role_title}. Offer issued.",
                actor_id=actor_id
            )

            context_router.log_event(
                event_type="PLACEMENT_OFFER_ISSUED",
                drive_id=sch.drive_id,
                agent_name="SchedulingAgent",
                message=f"Offer issued to {student.name} ({student.roll_number}) for {student.current_company} ({drive.ctc_lpa} LPA)",
                payload={"student_id": student.id, "ctc_lpa": drive.ctc_lpa}
            )

    db.commit()
    return {"message": "Slot updated", "schedule_id": schedule_id, "status": status, "result": sch.result}
