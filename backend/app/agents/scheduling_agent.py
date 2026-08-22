import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.entities import (
    PlacementDrive, CandidateMatch, InterviewPanel, VenueRoom, InterviewSchedule, PlacementException
)
from app.services.audit_service import AuditService

class SchedulingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="SchedulingAgent",
            role_description="Generates conflict-free interview and test schedules matching candidate-panel constraints"
        )

    def generate_drive_schedule(
        self,
        db: Session,
        drive_id: int,
        round_number: int = 1,
        round_name: str = "Technical Round 1",
        start_date_str: str = "2026-08-25",
        start_hour: int = 9,
        slot_duration_mins: int = 45,
        buffer_mins: int = 15,
        auto_resolve_conflicts: bool = True
    ) -> Dict[str, Any]:
        """
        Generates interview slots for all approved/shortlisted candidates.
        """
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise ValueError(f"Drive #{drive_id} not found")

        # Get shortlisted candidates (approved or recommended)
        shortlisted_matches = db.query(CandidateMatch).filter(
            CandidateMatch.drive_id == drive_id,
            CandidateMatch.is_shortlisted == True
        ).order_by(CandidateMatch.overall_score.desc()).all()

        if not shortlisted_matches:
            # Fallback to top 15 matches if none explicitly marked
            shortlisted_matches = db.query(CandidateMatch).filter(
                CandidateMatch.drive_id == drive_id
            ).order_by(CandidateMatch.overall_score.desc()).limit(15).all()

        panels = db.query(InterviewPanel).filter(InterviewPanel.is_available == True).all()
        rooms = db.query(VenueRoom).filter(VenueRoom.is_active == True).all()

        if not panels:
            raise ValueError("No active interview panels available in the system")
        if not rooms:
            raise ValueError("No active venue rooms configured in the system")

        # Clear previous schedules for this round in this drive
        db.query(InterviewSchedule).filter(
            InterviewSchedule.drive_id == drive_id,
            InterviewSchedule.round_number == round_number
        ).delete()

        base_date = datetime.datetime.strptime(start_date_str, "%Y-%m-%d")
        current_time = base_date.replace(hour=start_hour, minute=0, second=0)

        panel_idx = 0
        room_idx = 0
        schedules_created = []
        conflicts_found = 0

        for candidate_match in shortlisted_matches:
            panel = panels[panel_idx % len(panels)]
            room = rooms[room_idx % len(rooms)]

            slot_start = current_time.strftime("%Y-%m-%d %I:%M %p")
            slot_end_dt = current_time + datetime.timedelta(minutes=slot_duration_mins)
            slot_end = slot_end_dt.strftime("%Y-%m-%d %I:%M %p")

            # Check if this panel or room has an existing booking in ANOTHER drive at overlapping time
            existing_panel_booking = db.query(InterviewSchedule).filter(
                InterviewSchedule.panel_id == panel.id,
                InterviewSchedule.start_time == slot_start,
                InterviewSchedule.drive_id != drive_id
            ).first()

            existing_room_booking = db.query(InterviewSchedule).filter(
                InterviewSchedule.room_id == room.id,
                InterviewSchedule.start_time == slot_start,
                InterviewSchedule.drive_id != drive_id
            ).first()

            is_conflict = False
            conflict_details = None

            if existing_panel_booking:
                is_conflict = True
                conflict_details = f"Panel {panel.name} is double-booked with Drive #{existing_panel_booking.drive_id}"
                conflicts_found += 1
            elif existing_room_booking:
                is_conflict = True
                conflict_details = f"Room {room.room_number} is double-booked with Drive #{existing_room_booking.drive_id}"
                conflicts_found += 1

            meet_link = f"https://meet.google.com/pcd-{drive.drive_code.lower()}-{candidate_match.student_id}" if room.room_type == "VIRTUAL_MEET" else None

            schedule_entry = InterviewSchedule(
                drive_id=drive_id,
                student_id=candidate_match.student_id,
                panel_id=panel.id,
                room_id=room.id,
                round_number=round_number,
                round_name=round_name,
                start_time=slot_start,
                end_time=slot_end,
                time_slot_iso=current_time,
                status="SCHEDULED",
                meeting_link=meet_link,
                result="PENDING",
                is_conflict=is_conflict,
                conflict_details=conflict_details
            )
            db.add(schedule_entry)
            schedules_created.append(schedule_entry)

            # If conflict detected, create a PlacementException for TPO Action Queue
            if is_conflict:
                exc = PlacementException(
                    drive_id=drive_id,
                    category="SCHEDULE_CONFLICT",
                    severity="HIGH",
                    title=f"Schedule Conflict for Candidate {candidate_match.student_id}",
                    description=conflict_details or "Time slot clash detected",
                    affected_entities={
                        "student_id": candidate_match.student_id,
                        "panel_id": panel.id,
                        "room_id": room.id,
                        "slot": slot_start
                    },
                    suggested_resolution=f"Reassign to an alternative panel or switch room.",
                    status="OPEN"
                )
                db.add(exc)

            # Advance slot
            panel_idx += 1
            room_idx += 1
            if panel_idx % len(panels) == 0:
                current_time = slot_end_dt + datetime.timedelta(minutes=buffer_mins)
                # Lunch break between 1:00 PM and 2:00 PM
                if current_time.hour == 13:
                    current_time = current_time.replace(hour=14, minute=0)

        drive.stage = "SCHEDULED"
        db.commit()

        self.log_agent_action("SCHEDULE_GENERATED", {
            "drive_id": drive_id,
            "total_slots": len(schedules_created),
            "conflicts_detected": conflicts_found
        })

        return {
            "drive_id": drive_id,
            "total_scheduled": len(schedules_created),
            "conflicts_detected": conflicts_found,
            "round_name": round_name
        }

scheduling_agent = SchedulingAgent()
