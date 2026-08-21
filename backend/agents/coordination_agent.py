from sqlalchemy.orm import Session
from backend.models import Interview, ExceptionItem, Student, Drive, AuditLog
import datetime

class CoordinationAgent:
    @classmethod
    def validate_all_interviews(cls, db: Session) -> int:
        """
        Scans all scheduled interviews across all active drives.
        Detects double bookings (overlapping time slots for student, room, or panel).
        Sets conflict_flag=True and inserts ExceptionItems.
        Returns the number of active conflicts found.
        """
        interviews = db.query(Interview).filter(Interview.status == "scheduled").all()
        conflict_count = 0

        # Reset conflict flags before checking
        for item in interviews:
            item.conflict_flag = False

        for i in range(len(interviews)):
            int_a = interviews[i]
            for j in range(i + 1, len(interviews)):
                int_b = interviews[j]
                
                # If they share the same time slot
                if int_a.time_slot == int_b.time_slot:
                    has_conflict = False
                    details = []

                    # 1. Student overlap
                    if int_a.student_id == int_b.student_id:
                        has_conflict = True
                        student_name = db.query(Student.name).filter(Student.id == int_a.student_id).scalar()
                        details.append(f"Student '{student_name}' is double-booked.")

                    # 2. Room overlap
                    if int_a.room_or_link and int_a.room_or_link == int_b.room_or_link:
                        has_conflict = True
                        details.append(f"Room/Link '{int_a.room_or_link}' is double-booked.")

                    # 3. Panel overlap
                    # If any panelist is shared between the two interviews
                    shared_panel = set(int_a.panel_members).intersection(set(int_b.panel_members))
                    if shared_panel:
                        has_conflict = True
                        details.append(f"Panel members {list(shared_panel)} are double-booked.")

                    if has_conflict:
                        int_a.conflict_flag = True
                        int_b.conflict_flag = True
                        conflict_count += 2
                        
                        desc = f"Overlap clash on slot '{int_a.time_slot}': " + " ".join(details)
                        
                        # Raise exception item
                        # Check if this exception was already logged
                        existing_exc = db.query(ExceptionItem).filter(
                            ExceptionItem.type == "double_booking",
                            ExceptionItem.description.like(f"%{int_a.time_slot}%"),
                            ExceptionItem.resolved == False
                        ).first()

                        if not existing_exc:
                            exc = ExceptionItem(
                                drive_id=int_a.drive_id,
                                type="double_booking",
                                severity="high",
                                description=desc,
                                resolved=False
                            )
                            db.add(exc)

        db.commit()
        return conflict_count

    @classmethod
    def resolve_conflict(cls, interview_id: int, new_slot: str, new_room: str, new_panel: list, db: Session, tpo_name: str = "TPO") -> bool:
        """
        Manually resolves an interview conflict by updating its scheduling details.
        Logs an audit trail.
        """
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            return False

        old_details = f"Slot: {interview.time_slot}, Room: {interview.room_or_link}, Panel: {interview.panel_members}"
        
        # Apply changes
        interview.time_slot = new_slot
        interview.room_or_link = new_room
        interview.panel_members = new_panel
        interview.conflict_flag = False

        # Create audit log
        log = AuditLog(
            action="resolve_conflict",
            target_type="interview",
            target_id=interview_id,
            performed_by=tpo_name,
            details=f"Updated interview details. Before: [{old_details}] -> After: [Slot: {new_slot}, Room: {new_room}, Panel: {new_panel}]"
        )
        db.add(log)
        db.commit()

        # Re-run validation to clear resolved flags if no longer clashing
        cls.validate_all_interviews(db)
        return True
