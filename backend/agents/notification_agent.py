from sqlalchemy.orm import Session
from backend.models import Student, Drive, Notification, ExceptionItem, AuditLog
import datetime

class NotificationAgent:
    @classmethod
    def send_eligibility_notification(cls, student_id: int, drive_id: int, eligible: bool, reason: str, db: Session) -> bool:
        """
        Sends eligibility results to a student using a pre-approved template.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        drive = db.query(Drive).filter(Drive.id == drive_id).first()

        if not student or not drive:
            return False

        # Check for missing email anomaly
        if not student.email or "@" not in student.email:
            # Escalate to ExceptionAgent/exceptions queue
            exc = ExceptionItem(
                drive_id=drive_id,
                type="missing_data",
                severity="medium",
                description=f"Notification failed: Student '{student.name}' has an invalid or missing email address.",
                resolved=False
            )
            db.add(exc)
            db.commit()
            return False

        status_str = "Eligible" if eligible else "Not Eligible"
        message = (
            f"Dear {student.name},\n\n"
            f"This is to inform you about your eligibility status for the upcoming drive: {drive.company_name} - {drive.role_title}.\n"
            f"Status: {status_str}\n"
            f"Details: {reason}\n\n"
            f"Best regards,\nTraining & Placement Cell"
        )

        notification = Notification(
            drive_id=drive_id,
            recipient_type="student",
            recipient_id=student.id,
            channel="email",
            message_template=message,
            sent_at=datetime.datetime.utcnow(),
            delivery_status="delivered"
        )
        db.add(notification)
        db.commit()
        print(f"[SMTP Simulator] Sent email notification to {student.email} successfully.")
        return True

    @classmethod
    def send_interview_notification(cls, interview_id: int, db: Session) -> bool:
        """
        Sends interview schedule notifications to student and panel members.
        """
        from backend.models import Interview
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            return False

        student = db.query(Student).filter(Student.id == interview.student_id).first()
        drive = db.query(Drive).filter(Drive.id == interview.drive_id).first()

        if not student or not drive:
            return False

        # Notify Student
        if not student.email or "@" not in student.email:
            exc = ExceptionItem(
                drive_id=interview.drive_id,
                type="missing_data",
                severity="high",
                description=f"Interview notification failed: Student '{student.name}' has no valid email.",
                resolved=False
            )
            db.add(exc)
            db.commit()
            return False

        student_msg = (
            f"Dear {student.name},\n\n"
            f"Your interview for {drive.company_name} ({drive.role_title}) has been scheduled!\n"
            f"Time Slot: {interview.time_slot}\n"
            f"Location/Link: {interview.room_or_link}\n"
            f"Panel: {', '.join(interview.panel_members)}\n\n"
            f"Please be on time.\nBest regards,\nTraining & Placement Cell"
        )

        db.add(Notification(
            drive_id=interview.drive_id,
            recipient_type="student",
            recipient_id=student.id,
            channel="email",
            message_template=student_msg,
            sent_at=datetime.datetime.utcnow(),
            delivery_status="delivered"
        ))

        # Notify Panel Members
        for panelist in interview.panel_members:
            panel_msg = (
                f"Hello {panelist},\n\n"
                f"You have been assigned to interview {student.name} ({student.branch}) for {drive.company_name} - {drive.role_title}.\n"
                f"Time Slot: {interview.time_slot}\n"
                f"Room/Link: {interview.room_or_link}\n\n"
                f"Thank you,\nTraining & Placement Cell"
            )
            db.add(Notification(
                drive_id=interview.drive_id,
                recipient_type="panel",
                recipient_id=999, # Placeholder for panel ID
                channel="email",
                message_template=panel_msg,
                sent_at=datetime.datetime.utcnow(),
                delivery_status="delivered"
            ))

        db.commit()
        print(f"[SMTP Simulator] Sent notifications for interview ID {interview_id} to student and panel.")
        return True
