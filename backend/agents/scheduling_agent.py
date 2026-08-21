from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models import Student, Drive, MatchScore, Interview, ExceptionItem, AuditLog
import datetime

class SchedulingAgent:
    @classmethod
    def propose_schedule(
        cls, 
        drive_id: int, 
        panel_members: List[str], 
        available_slots: List[str], 
        rooms: List[str], 
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Proposes interview slots for the approved student shortlist.
        Identifies and flags conflicts for panels, rooms, and students.
        """
        # Get approved shortlist for this drive
        approved_matches = db.query(MatchScore).filter(
            MatchScore.drive_id == drive_id,
            MatchScore.approved == True
        ).all()

        if not approved_matches:
            return []

        proposed_interviews = []
        slot_index = 0
        room_index = 0
        panel_index = 0

        # Remove previous unscheduled proposed interviews for this drive
        db.query(Interview).filter(
            Interview.drive_id == drive_id,
            Interview.status == "scheduled"
        ).delete()

        for match in approved_matches:
            student = db.query(Student).filter(Student.id == match.student_id).first()
            if not student:
                continue

            # Check if we run out of slots, we assign the last slot and raise a conflict
            if slot_index >= len(available_slots):
                # No more free slots! Force assign to the last slot, and flag conflict
                assigned_slot = available_slots[-1] if available_slots else "Unassigned (No slots available)"
                conflict = True
                conflict_reason = "No available slots left. Forced allocation caused a conflict."
            else:
                assigned_slot = available_slots[slot_index]
                conflict = False
                conflict_reason = ""

            assigned_room = rooms[room_index % len(rooms)] if rooms else "TBD"
            assigned_panel = [panel_members[panel_index % len(panel_members)]] if panel_members else ["General Panel"]

            # Check for double booking of student across ALL drives
            student_clash = db.query(Interview).filter(
                Interview.student_id == student.id,
                Interview.time_slot == assigned_slot,
                Interview.status != "cancelled"
            ).first()

            # Check for double booking of room across ALL drives
            room_clash = db.query(Interview).filter(
                Interview.room_or_link == assigned_room,
                Interview.time_slot == assigned_slot,
                Interview.status != "cancelled"
            ).first()

            # Check for double booking of panel across ALL drives
            panel_clash = False
            for panelist in assigned_panel:
                existing_panelists_interviews = db.query(Interview).filter(
                    Interview.time_slot == assigned_slot,
                    Interview.status != "cancelled"
                ).all()
                for existing_int in existing_panelists_interviews:
                    if panelist in existing_int.panel_members:
                        panel_clash = True
                        break

            if student_clash or room_clash or panel_clash or conflict:
                conflict = True
                reasons = []
                if student_clash:
                    reasons.append(f"Student '{student.name}' is already scheduled at this slot in drive ID {student_clash.drive_id}")
                if room_clash:
                    reasons.append(f"Room '{assigned_room}' is already booked at this slot in drive ID {room_clash.drive_id}")
                if panel_clash:
                    reasons.append(f"Panel member '{assigned_panel[0]}' is already interviewing at this slot")
                if conflict_reason:
                    reasons.append(conflict_reason)
                conflict_desc = "; ".join(reasons)
            else:
                conflict_desc = ""

            interview = Interview(
                drive_id=drive_id,
                student_id=student.id,
                panel_members=assigned_panel,
                room_or_link=assigned_room,
                time_slot=assigned_slot,
                status="scheduled",
                conflict_flag=conflict
            )
            db.add(interview)
            db.flush()

            # If there's a conflict, log it in Exceptions Queue
            if conflict:
                exception = ExceptionItem(
                    drive_id=drive_id,
                    type="schedule_conflict",
                    severity="high",
                    description=f"Scheduling conflict for Student {student.name}: {conflict_desc}",
                    resolved=False
                )
                db.add(exception)

            proposed_interviews.append({
                "interview_id": interview.id,
                "student_id": student.id,
                "student_name": student.name,
                "panel_members": assigned_panel,
                "room": assigned_room,
                "time_slot": assigned_slot,
                "conflict": conflict,
                "conflict_details": conflict_desc
            })

            # Advance pointers
            slot_index += 1
            room_index += 1
            panel_index += 1

        db.commit()
        return proposed_interviews
