from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.entities import InterviewSchedule, InterviewPanel, VenueRoom, PlacementException
from app.services.audit_service import AuditService

class CoordinationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="CoordinationAgent",
            role_description="Coordinates venue allocations, panel assignments, and resolves double-bookings"
        )

    def reallocate_slot(
        self,
        db: Session,
        schedule_id: int,
        new_panel_id: Optional[int] = None,
        new_room_id: Optional[int] = None,
        new_start_time: Optional[str] = None,
        new_end_time: Optional[str] = None,
        resolution_notes: str = "TPO Manual Reallocation",
        actor_id: str = "TPO_ADMIN"
    ) -> InterviewSchedule:
        """
        Reallocates an interview slot to fix a conflict or panel change.
        """
        schedule = db.query(InterviewSchedule).filter(InterviewSchedule.id == schedule_id).first()
        if not schedule:
            raise ValueError(f"Schedule #{schedule_id} not found")

        before_state = {
            "panel_id": schedule.panel_id,
            "room_id": schedule.room_id,
            "start_time": schedule.start_time,
            "is_conflict": schedule.is_conflict
        }

        if new_panel_id:
            schedule.panel_id = new_panel_id
        if new_room_id:
            schedule.room_id = new_room_id
        if new_start_time:
            schedule.start_time = new_start_time
        if new_end_time:
            schedule.end_time = new_end_time

        # Re-check conflict
        schedule.is_conflict = False
        schedule.conflict_details = None

        # Check if corresponding exception exists and resolve it
        open_exc = db.query(PlacementException).filter(
            PlacementException.drive_id == schedule.drive_id,
            PlacementException.category.in_(["SCHEDULE_CONFLICT", "ROOM_DOUBLE_BOOKING", "PANEL_UNAVAILABLE"]),
            PlacementException.status == "OPEN"
        ).first()

        if open_exc:
            open_exc.status = "RESOLVED"
            open_exc.resolved_by = actor_id
            open_exc.resolution_notes = f"Resolved via reallocating slot #{schedule.id}: {resolution_notes}"

        AuditService.log_action(
            db=db,
            action_type="REALLOCATE_INTERVIEW_SLOT",
            target_type="InterviewSchedule",
            target_id=str(schedule.id),
            drive_id=schedule.drive_id,
            before_state=before_state,
            after_state={
                "panel_id": schedule.panel_id,
                "room_id": schedule.room_id,
                "start_time": schedule.start_time,
                "is_conflict": False
            },
            reason=resolution_notes,
            actor_id=actor_id
        )

        db.commit()
        db.refresh(schedule)
        return schedule

coordination_agent = CoordinationAgent()
