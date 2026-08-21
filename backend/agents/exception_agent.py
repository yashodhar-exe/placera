from sqlalchemy.orm import Session
from backend.models import ExceptionItem, Drive, Student, MatchScore, EligibilityResult, AuditLog
import datetime

class ExceptionAgent:
    @classmethod
    def run_exception_sweep(cls, drive_id: int, db: Session) -> int:
        """
        Runs a comprehensive sweep on a recruitment drive to detect anomalies.
        Creates ExceptionItem entries for unresolved problems.
        Returns the number of new anomalies found.
        """
        drive = db.query(Drive).filter(Drive.id == drive_id).first()
        if not drive:
            return 0
            
        anomalies_count = 0

        # 1. Sweep for Low Confidence matches
        # If all matched candidates have overall scores below 50.0
        scores = db.query(MatchScore).filter(MatchScore.drive_id == drive_id).all()
        if scores and all(s.overall_score < 50.0 for s in scores):
            existing = db.query(ExceptionItem).filter(
                ExceptionItem.drive_id == drive_id,
                ExceptionItem.type == "low_confidence_match",
                ExceptionItem.resolved == False
            ).first()
            if not existing:
                exc = ExceptionItem(
                    drive_id=drive_id,
                    type="low_confidence_match",
                    severity="medium",
                    description=(
                        f"Low Confidence Match Warning: All {len(scores)} matched candidates for "
                        f"'{drive.company_name}' have compatibility scores under 50%. "
                        f"Consider revising the JD skill cutoff rules."
                    ),
                    resolved=False
                )
                db.add(exc)
                anomalies_count += 1

        # 2. Sweep for missing critical profile data among candidates applying
        # For example, if a student has CGPA 0.0 or empty skills list
        eligible_students = db.query(Student).join(
            EligibilityResult, EligibilityResult.student_id == Student.id
        ).filter(
            EligibilityResult.drive_id == drive_id,
            EligibilityResult.eligible == True
        ).all()

        for s in eligible_students:
            if not s.skills or len(s.skills) == 0:
                existing = db.query(ExceptionItem).filter(
                    ExceptionItem.drive_id == drive_id,
                    ExceptionItem.type == "missing_data",
                    ExceptionItem.description.like(f"%{s.name}%"),
                    ExceptionItem.resolved == False
                ).first()
                if not existing:
                    exc = ExceptionItem(
                        drive_id=drive_id,
                        type="missing_data",
                        severity="low",
                        description=f"Candidate Profile Alert: '{s.name}' has an empty skills inventory. Matches may be inaccurate.",
                        resolved=False
                    )
                    db.add(exc)
                    anomalies_count += 1

        db.commit()
        return anomalies_count

    @classmethod
    def resolve_exception(cls, exception_id: int, resolved_by: str, db: Session) -> bool:
        """
        Marks an exception as resolved.
        """
        exc = db.query(ExceptionItem).filter(ExceptionItem.id == exception_id).first()
        if not exc:
            return False

        exc.resolved = True
        exc.resolved_by = resolved_by
        exc.resolved_at = datetime.datetime.utcnow()

        # Audit logging
        log = AuditLog(
            action="resolve_exception",
            target_type="exception",
            target_id=exception_id,
            performed_by=resolved_by,
            details=f"Resolved exception of type '{exc.type}': {exc.description}"
        )
        db.add(log)
        db.commit()
        return True
