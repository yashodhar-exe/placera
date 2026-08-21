from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import uuid

from backend.agents.jd_intake_agent import JDIntakeAgent
from backend.agents.eligibility_agent import EligibilityAgent
from backend.agents.matching_agent import MatchingAgent
from backend.agents.scheduling_agent import SchedulingAgent
from backend.agents.coordination_agent import CoordinationAgent
from backend.agents.notification_agent import NotificationAgent
from backend.agents.exception_agent import ExceptionAgent
from backend.models import Drive

class ContextObject(BaseModel):
    drive_id: int
    task_id: str
    session_id: str
    payload: Dict[str, Any] = {}
    routing: List[str] = []
    requires_approval: bool = False

class ContextRouter:
    @classmethod
    def execute_next(cls, context: ContextObject, db: Session) -> ContextObject:
        """
        Orchestration engine: pops the next agent from the routing list,
        executes its logic using the database and context payload,
        and manages the approval checkpoint transition.
        """
        if not context.routing:
            return context

        next_agent = context.routing[0]
        print(f"[Context Router] Invoking Agent: {next_agent} for Drive ID {context.drive_id}")

        if next_agent == "JDIntakeAgent":
            jd_text = context.payload.get("jd_text", "")
            parsed = JDIntakeAgent.parse_jd(jd_text)
            
            # Save parsed fields into payload
            context.payload["parsed_fields"] = parsed
            context.requires_approval = True
            
            # Update routing
            context.routing.pop(0)
            if "EligibilityAgent" not in context.routing:
                context.routing.append("EligibilityAgent")

        elif next_agent == "EligibilityAgent":
            # Run eligibility calculations
            results = EligibilityAgent.run_eligibility_check(context.drive_id, db)
            
            eligible_count = sum(1 for r in results if r.eligible)
            flagged_count = sum(1 for r in results if r.flagged_for_review)
            excluded_count = len(results) - eligible_count - flagged_count
            
            context.payload["eligibility_summary"] = {
                "total_students": len(results),
                "eligible": eligible_count,
                "flagged": flagged_count,
                "excluded": excluded_count
            }
            
            # Advance stage on drive to 'eligibility'
            drive = db.query(Drive).filter(Drive.id == context.drive_id).first()
            if drive:
                drive.stage = "eligibility"
                db.commit()

            context.requires_approval = True
            
            context.routing.pop(0)
            if "MatchingAgent" not in context.routing:
                context.routing.append("MatchingAgent")

        elif next_agent == "MatchingAgent":
            # Run scoring and ranking
            scores = MatchingAgent.match_and_rank_students(context.drive_id, db)
            
            context.payload["shortlist"] = [
                {
                    "student_id": s.student_id,
                    "overall_score": s.overall_score,
                    "rank": s.rank,
                    "approved": s.approved
                }
                for s in scores
            ]
            
            drive = db.query(Drive).filter(Drive.id == context.drive_id).first()
            if drive:
                drive.stage = "matching"
                db.commit()

            # Run exception sweep for low confidence
            ExceptionAgent.run_exception_sweep(context.drive_id, db)

            context.requires_approval = True
            context.routing.pop(0)
            if "SchedulingAgent" not in context.routing:
                context.routing.append("SchedulingAgent")

        elif next_agent == "SchedulingAgent":
            # Propose slots
            panel_members = context.payload.get("panel_members", ["Dr. Prasad", "Mr. Amit"])
            available_slots = context.payload.get("available_slots", [
                "2026-08-22 10:00 - 10:30",
                "2026-08-22 10:30 - 11:00",
                "2026-08-22 11:00 - 11:30",
                "2026-08-22 11:30 - 12:00"
            ])
            rooms = context.payload.get("rooms", ["Room 101", "Room 102"])
            
            proposed = SchedulingAgent.propose_schedule(
                context.drive_id, panel_members, available_slots, rooms, db
            )
            
            context.payload["proposed_schedule"] = proposed
            
            drive = db.query(Drive).filter(Drive.id == context.drive_id).first()
            if drive:
                drive.stage = "scheduling"
                db.commit()

            context.requires_approval = True
            context.routing.pop(0)
            if "CoordinationAgent" not in context.routing:
                context.routing.append("CoordinationAgent")

        elif next_agent == "CoordinationAgent":
            # Run coordination validation sweep
            conflict_count = CoordinationAgent.validate_all_interviews(db)
            
            context.payload["coordination_status"] = {
                "conflicts_detected": conflict_count
            }
            
            drive = db.query(Drive).filter(Drive.id == context.drive_id).first()
            if drive:
                drive.stage = "coordination"
                db.commit()

            # If conflicts exist, we pause for human resolution.
            if conflict_count > 0:
                context.requires_approval = True
            else:
                context.requires_approval = False
                
            context.routing.pop(0)
            if "NotificationAgent" not in context.routing:
                context.routing.append("NotificationAgent")

        elif next_agent == "NotificationAgent":
            # Trigger sending approved templates
            from backend.models import Interview
            interviews = db.query(Interview).filter(Interview.drive_id == context.drive_id).all()
            
            success_count = 0
            for intr in interviews:
                res = NotificationAgent.send_interview_notification(intr.id, db)
                if res:
                    success_count += 1
                    
            context.payload["notifications_status"] = {
                "total_interviews": len(interviews),
                "successfully_notified": success_count
            }
            
            drive = db.query(Drive).filter(Drive.id == context.drive_id).first()
            if drive:
                drive.stage = "notified"
                db.commit()

            context.requires_approval = False
            context.routing.pop(0) # Done with pipeline

        return context
