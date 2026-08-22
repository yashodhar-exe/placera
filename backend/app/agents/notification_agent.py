import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.entities import Notification, Student, PlacementDrive, InterviewSchedule, StudentEligibility, CandidateMatch
from app.services.audit_service import AuditService

class NotificationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="NotificationAgent",
            role_description="Dispatches approved multi-channel notifications and reminders with safe templates"
        )

    def dispatch_broadcast(
        self,
        db: Session,
        drive_id: int,
        target_group: str,  # ALL_ELIGIBLE, SHORTLISTED, SCHEDULED_CANDIDATES
        channels: List[str],  # PORTAL, EMAIL, SMS
        template_type: str = "ELIGIBILITY_ANNOUNCEMENT",
        custom_subject: Optional[str] = None,
        custom_message: Optional[str] = None,
        actor_id: str = "TPO_ADMIN"
    ) -> Dict[str, Any]:
        """
        Dispatches templated messages to the target group for a drive.
        """
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise ValueError(f"Drive #{drive_id} not found")

        recipients = []
        if target_group == "ALL_ELIGIBLE":
            elig_records = db.query(StudentEligibility).filter(
                StudentEligibility.drive_id == drive_id,
                StudentEligibility.is_eligible == True
            ).all()
            student_ids = [e.student_id for e in elig_records]
            recipients = db.query(Student).filter(Student.id.in_(student_ids)).all()

        elif target_group == "SHORTLISTED":
            matches = db.query(CandidateMatch).filter(
                CandidateMatch.drive_id == drive_id,
                CandidateMatch.is_shortlisted == True
            ).all()
            student_ids = [m.student_id for m in matches]
            recipients = db.query(Student).filter(Student.id.in_(student_ids)).all()

        elif target_group == "SCHEDULED_CANDIDATES":
            schedules = db.query(InterviewSchedule).filter(InterviewSchedule.drive_id == drive_id).all()
            student_ids = list(set([s.student_id for s in schedules]))
            recipients = db.query(Student).filter(Student.id.in_(student_ids)).all()

        created_notifications = []
        for student in recipients:
            subject = custom_subject or f"Placement Update: {drive.company.name if drive.company else 'Drive'} - {drive.role_title}"
            
            if custom_message:
                body = custom_message.replace("{Name}", student.name).replace("{Company}", drive.company.name if drive.company else "Company")
            else:
                if template_type == "ELIGIBILITY_ANNOUNCEMENT":
                    body = f"Dear {student.name},\n\nYou have been verified as ELIGIBLE for the upcoming campus recruitment drive by {drive.company.name if drive.company else 'Company'} for the position of {drive.role_title} (CTC: {drive.ctc_lpa} LPA). Please review your profile and prepare for Round 1."
                elif template_type == "SHORTLIST_ANNOUNCEMENT":
                    body = f"Congratulations {student.name}!\n\nYou have been SHORTLISTED for {drive.company.name if drive.company else 'Company'} - {drive.role_title}. Your interview schedule will be published shortly."
                else:
                    body = f"Dear {student.name},\n\nPlease note important placement instructions regarding {drive.role_title} drive."

            for ch in channels:
                notif = Notification(
                    drive_id=drive_id,
                    recipient_type="STUDENT",
                    recipient_id=str(student.id),
                    recipient_name=student.name,
                    recipient_contact=student.email if ch == "EMAIL" else (student.phone if ch == "SMS" else student.roll_number),
                    channel=ch,
                    subject=subject,
                    message_body=body,
                    template_type=template_type,
                    status="SENT",
                    sent_at=datetime.datetime.utcnow()
                )
                db.add(notif)
                created_notifications.append(notif)

        AuditService.log_action(
            db=db,
            action_type="DISPATCH_NOTIFICATIONS",
            target_type="PlacementDrive",
            target_id=str(drive_id),
            drive_id=drive_id,
            after_state={
                "target_group": target_group,
                "channels": channels,
                "notifications_sent": len(created_notifications)
            },
            reason=f"TPO broadcast to {target_group}",
            actor_id=actor_id
        )

        db.commit()

        self.log_agent_action("NOTIFICATIONS_DISPATCHED", {
            "drive_id": drive_id,
            "count": len(created_notifications),
            "target_group": target_group
        })

        return {
            "drive_id": drive_id,
            "dispatched_count": len(created_notifications),
            "target_group": target_group,
            "channels": channels
        }

notification_agent = NotificationAgent()
