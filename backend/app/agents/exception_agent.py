import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.entities import (
    PlacementException, InterviewSchedule, Student, PlacementDrive, CandidateMatch, InterviewPanel, VenueRoom
)
from app.services.audit_service import AuditService

class ExceptionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="ExceptionAgent",
            role_description="Continuously monitors placement operations and identifies anomalies in TPO Action Queue"
        )

    def scan_for_exceptions(self, db: Session) -> List[PlacementException]:
        """
        Scans current database state for anomalies and generates exception tickets.
        """
        new_exceptions = []
        existing_open = db.query(PlacementException).filter(PlacementException.status == "OPEN").all()
        existing_keys = set()
        for e in existing_open:
            aff = e.affected_entities or {}
            key = f"{e.category}_{aff.get('schedule_id')}_{aff.get('student_id')}_{aff.get('panel_id')}_{aff.get('drive_id')}"
            existing_keys.add(key)

        # 1. Check for interview schedule double-bookings (Panels & Rooms)
        schedules = db.query(InterviewSchedule).all()
        panel_slots = {}
        room_slots = {}

        for s in schedules:
            if s.panel_id and s.start_time:
                key = (s.panel_id, s.start_time)
                if key in panel_slots:
                    existing_s = panel_slots[key]
                    if existing_s.drive_id != s.drive_id or existing_s.id != s.id:
                        dedup_key = f"PANEL_DOUBLE_BOOKING_{s.id}_{s.student_id}_{s.panel_id}_{s.drive_id}"
                        if dedup_key not in existing_keys:
                            exc = PlacementException(
                                drive_id=s.drive_id,
                                category="PANEL_DOUBLE_BOOKING",
                                severity="HIGH",
                                title=f"Panel Double-Booked at {s.start_time}",
                                description=f"Panel #{s.panel_id} is scheduled simultaneously for Drive #{s.drive_id} (Slot #{s.id}) and Drive #{existing_s.drive_id} (Slot #{existing_s.id}).",
                                affected_entities={
                                    "schedule_id": s.id,
                                    "conflicting_schedule_id": existing_s.id,
                                    "panel_id": s.panel_id,
                                    "slot": s.start_time
                                },
                                suggested_resolution="Reassign candidate to standby panel or shift slot time.",
                                status="OPEN"
                            )
                            db.add(exc)
                            new_exceptions.append(exc)
                            existing_keys.add(dedup_key)
                else:
                    panel_slots[key] = s

            # Check room double booking
            if s.room_id and s.start_time:
                r_key = (s.room_id, s.start_time)
                if r_key in room_slots:
                    existing_r = room_slots[r_key]
                    if existing_r.drive_id != s.drive_id or existing_r.id != s.id:
                        dedup_r_key = f"ROOM_DOUBLE_BOOKING_{s.id}_{s.student_id}_{s.room_id}_{s.drive_id}"
                        if dedup_r_key not in existing_keys:
                            exc = PlacementException(
                                drive_id=s.drive_id,
                                category="ROOM_DOUBLE_BOOKING",
                                severity="HIGH",
                                title=f"Venue Room Conflict at {s.start_time}",
                                description=f"Room #{s.room_id} is double-booked for multiple interview slots.",
                                affected_entities={
                                    "schedule_id": s.id,
                                    "room_id": s.room_id,
                                    "slot": s.start_time
                                },
                                suggested_resolution="Reallocate to an unassigned interview cabin or lab.",
                                status="OPEN"
                            )
                            db.add(exc)
                            new_exceptions.append(exc)
                            existing_keys.add(dedup_r_key)
                else:
                    room_slots[r_key] = s

        # 2. Check for panel workload limits
        panels = db.query(InterviewPanel).filter(InterviewPanel.is_available == True).all()
        for p in panels:
            assigned_count = db.query(InterviewSchedule).filter(InterviewSchedule.panel_id == p.id).count()
            if assigned_count > p.max_slots_per_day:
                dedup_p_key = f"PANEL_OVERLOADED_None_None_{p.id}_None"
                if dedup_p_key not in existing_keys:
                    exc = PlacementException(
                        category="PANEL_OVERLOADED",
                        severity="MEDIUM",
                        title=f"Panel Quota Exceeded: {p.name}",
                        description=f"Panel {p.name} assigned {assigned_count} slots (Max permitted daily quota is {p.max_slots_per_day}).",
                        affected_entities={"panel_id": p.id, "assigned_count": assigned_count, "quota": p.max_slots_per_day},
                        suggested_resolution="Balance workload by distributing candidates across other available panels.",
                        status="OPEN"
                    )
                    db.add(exc)
                    new_exceptions.append(exc)
                    existing_keys.add(dedup_p_key)

        # 3. Check for students with incomplete profiles
        incomplete_students = db.query(Student).filter(
            (Student.skills == None) | (Student.skills == []) | (Student.cgpa == None)
        ).all()

        for st in incomplete_students:
            dedup_st_key = f"DATA_MISSING_None_{st.id}_None_None"
            if dedup_st_key not in existing_keys:
                exc = PlacementException(
                    category="DATA_MISSING",
                    severity="MEDIUM",
                    title=f"Incomplete Student Profile: {st.name} ({st.roll_number})",
                    description=f"Student profile is missing verified technical skills or academic data.",
                    affected_entities={"student_id": st.id, "roll_number": st.roll_number},
                    suggested_resolution="Send automated profile completion reminder to student.",
                    status="OPEN"
                )
                db.add(exc)
                new_exceptions.append(exc)
                existing_keys.add(dedup_st_key)

        # 4. Check for low-confidence top-ranked matches in active drives
        drives = db.query(PlacementDrive).filter(PlacementDrive.stage == "SHORTLIST_PROPOSED").all()
        for d in drives:
            low_matches = db.query(CandidateMatch).filter(
                CandidateMatch.drive_id == d.id,
                CandidateMatch.is_shortlisted == True,
                CandidateMatch.overall_score < 60.0
            ).all()

            if low_matches:
                dedup_d_key = f"LOW_CONFIDENCE_MATCH_None_None_None_{d.id}"
                if dedup_d_key not in existing_keys:
                    exc = PlacementException(
                        drive_id=d.id,
                        category="LOW_CONFIDENCE_MATCH",
                        severity="MEDIUM",
                        title=f"Low-Confidence Shortlist in {d.role_title}",
                        description=f"Identified {len(low_matches)} shortlisted candidates with match score < 60%.",
                        affected_entities={"drive_id": d.id, "low_match_count": len(low_matches)},
                        suggested_resolution="Review student project portfolios or relax strict skill filters.",
                        status="OPEN"
                    )
                    db.add(exc)
                    new_exceptions.append(exc)
                    existing_keys.add(dedup_d_key)

        db.commit()
        return new_exceptions

    def resolve_exception(
        self,
        db: Session,
        exception_id: int,
        resolution_notes: str,
        action_taken: str = "APPLY_SUGGESTED_FIX",
        actor_id: str = "TPO_ADMIN"
    ) -> PlacementException:
        """
        Resolves an exception ticket with TPO audit trail and applies automated fixes.
        """
        exc = db.query(PlacementException).filter(PlacementException.id == exception_id).first()
        if not exc:
            raise ValueError(f"Exception #{exception_id} not found")

        # Auto-apply resolution if possible
        if action_taken == "APPLY_SUGGESTED_FIX":
            aff = exc.affected_entities or {}
            sch_id = aff.get("schedule_id")
            if sch_id:
                sch = db.query(InterviewSchedule).filter(InterviewSchedule.id == sch_id).first()
                if sch:
                    sch.is_conflict = False
                    sch.conflict_details = None
                    # Reallocate to standby panel
                    panels = db.query(InterviewPanel).filter(InterviewPanel.is_available == True).all()
                    if panels and len(panels) > 1:
                        standby = [p for p in panels if p.id != sch.panel_id]
                        if standby:
                            sch.panel_id = standby[0].id

        exc.status = "RESOLVED"
        exc.resolved_by = actor_id
        exc.resolved_at = datetime.datetime.utcnow()
        exc.resolution_notes = f"{action_taken}: {resolution_notes}"

        AuditService.log_action(
            db=db,
            action_type="RESOLVE_EXCEPTION",
            target_type="PlacementException",
            target_id=str(exc.id),
            drive_id=exc.drive_id,
            before_state={"status": "OPEN"},
            after_state={"status": "RESOLVED", "action_taken": action_taken},
            reason=resolution_notes,
            actor_id=actor_id
        )

        db.commit()
        db.refresh(exc)
        return exc

exception_agent = ExceptionAgent()
