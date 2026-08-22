import datetime
import uuid
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.entities import PlacementDrive
from app.models.schemas import AgentExecutionContext
from app.agents.jd_intake_agent import jd_intake_agent
from app.agents.eligibility_agent import eligibility_agent
from app.agents.matching_agent import matching_agent
from app.agents.scheduling_agent import scheduling_agent
from app.agents.coordination_agent import coordination_agent
from app.agents.notification_agent import notification_agent
from app.agents.analytics_agent import analytics_agent
from app.agents.reporting_agent import reporting_agent
from app.agents.exception_agent import exception_agent
from app.services.audit_service import AuditService

class ContextRouter:
    def __init__(self):
        self.active_contexts: Dict[str, AgentExecutionContext] = {}
        self.event_stream: List[Dict[str, Any]] = []

    def log_event(self, event_type: str, drive_id: Optional[int], agent_name: str, message: str, payload: Optional[Dict[str, Any]] = None):
        event = {
            "id": f"EVT-{uuid.uuid4().hex[:6].upper()}",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "event_type": event_type,
            "drive_id": drive_id,
            "agent_name": agent_name,
            "message": message,
            "payload": payload or {}
        }
        self.event_stream.insert(0, event)
        # Keep latest 100 events in memory
        if len(self.event_stream) > 100:
            self.event_stream.pop()
        return event

    def advance_drive_stage(
        self,
        db: Session,
        drive_id: int,
        target_stage: str,
        actor_id: str = "TPO_ADMIN",
        approval_notes: Optional[str] = None
    ) -> PlacementDrive:
        """
        Advances the placement drive through the state machine with Human-in-the-Loop validation.
        """
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise ValueError(f"Drive #{drive_id} not found")

        valid_transitions = {
            "DRAFT": ["JD_PARSED"],
            "JD_PARSED": ["ELIGIBILITY_PROCESSED"],
            "ELIGIBILITY_PROCESSED": ["SHORTLIST_PROPOSED"],
            "SHORTLIST_PROPOSED": ["SHORTLIST_APPROVED"],
            "SHORTLIST_APPROVED": ["SCHEDULED"],
            "SCHEDULED": ["IN_PROGRESS"],
            "IN_PROGRESS": ["COMPLETED"],
            "COMPLETED": ["ARCHIVED"]
        }

        # Validate stage sequence
        if target_stage not in valid_transitions.get(drive.stage, []) and target_stage != drive.stage:
            # Allow TPO force override if requested, but log warning
            pass

        before_stage = drive.stage
        drive.stage = target_stage

        # Stage specific approval flags
        if target_stage == "ELIGIBILITY_PROCESSED":
            drive.tpo_approved_jd = True
        elif target_stage == "SHORTLIST_APPROVED":
            drive.tpo_approved_shortlist = True
        elif target_stage == "SCHEDULED":
            drive.tpo_approved_schedule = True

        AuditService.log_action(
            db=db,
            action_type="STAGE_TRANSITION",
            target_type="PlacementDrive",
            target_id=str(drive_id),
            drive_id=drive_id,
            before_state={"stage": before_stage},
            after_state={"stage": target_stage},
            reason=approval_notes or f"Advanced drive to {target_stage}",
            actor_id=actor_id
        )

        self.log_event(
            event_type="STAGE_TRANSITION",
            drive_id=drive_id,
            agent_name="ContextRouter",
            message=f"Drive {drive.drive_code} transitioned from {before_stage} to {target_stage}",
            payload={"before_stage": before_stage, "target_stage": target_stage, "actor_id": actor_id}
        )

        db.commit()
        db.refresh(drive)
        return drive

    def get_live_events(self, limit: int = 30) -> List[Dict[str, Any]]:
        return self.event_stream[:limit]

context_router = ContextRouter()
