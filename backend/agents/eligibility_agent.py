from typing import List, Tuple
from sqlalchemy.orm import Session
from backend.models import Student, Drive, EligibilityResult, ExceptionItem, AuditLog

class EligibilityAgent:
    @staticmethod
    def evaluate_student(student: Student, drive: Drive) -> Tuple[bool, str, bool]:
        """
        Evaluates eligibility of a single student for a given drive.
        Returns:
            Tuple of (eligible: bool, reason: str, flagged_for_review: bool)
        """
        # 1. Branch filter
        if student.branch not in drive.eligible_branches:
            return False, f"Branch '{student.branch}' is not in eligible branches list: {drive.eligible_branches}.", False

        # 2. Backlog filter
        if student.backlog_count > 0:
            return False, f"Student has {student.backlog_count} active backlogs (Policy requires 0).", False

        # 3. Current best offer package filter
        if student.current_best_offer is not None and student.current_best_offer >= drive.package_min:
            return False, (
                f"Student already holds an offer of {student.current_best_offer} LPA, "
                f"which meets or exceeds the drive's minimum package of {drive.package_min} LPA."
            ), False

        # 4. CGPA filter and Borderline check
        if student.cgpa < drive.cgpa_cutoff:
            diff = drive.cgpa_cutoff - student.cgpa
            if diff <= 0.2:
                # Borderline case! Flag for TPO review.
                return False, (
                    f"CGPA ({student.cgpa}) is borderline (within 0.2 of the required cutoff {drive.cgpa_cutoff}). "
                    f"Flagged for manual TPO review."
                ), True
            else:
                return False, f"CGPA ({student.cgpa}) is below the required cutoff of {drive.cgpa_cutoff}.", False

        # If all criteria are met
        return True, "Meets all deterministic academic and policy eligibility criteria.", False

    @classmethod
    def run_eligibility_check(cls, drive_id: int, db: Session) -> List[EligibilityResult]:
        """
        Runs eligibility checks for all students against a drive and saves results.
        Also creates ExceptionItems for flagged borderline cases.
        """
        drive = db.query(Drive).filter(Drive.id == drive_id).first()
        if not drive:
            raise ValueError(f"Drive with ID {drive_id} not found.")

        students = db.query(Student).all()
        results = []

        # Remove previous non-overridden eligibility results for this drive
        db.query(EligibilityResult).filter(
            EligibilityResult.drive_id == drive_id,
            EligibilityResult.overridden_by_tpo == False
        ).delete()

        # Retrieve existing overridden results to keep them intact
        overridden_results = {
            r.student_id: r for r in db.query(EligibilityResult).filter(
                EligibilityResult.drive_id == drive_id,
                EligibilityResult.overridden_by_tpo == True
            ).all()
        }

        for student in students:
            # If there is already a manual override, we keep it and don't re-evaluate
            if student.id in overridden_results:
                results.append(overridden_results[student.id])
                continue

            eligible, reason, flagged = cls.evaluate_student(student, drive)
            
            result = EligibilityResult(
                drive_id=drive_id,
                student_id=student.id,
                eligible=eligible,
                reason=reason,
                overridden_by_tpo=False,
                flagged_for_review=flagged
            )
            db.add(result)
            db.flush()  # to get the result.id
            results.append(result)

            # Create exception item if flagged
            if flagged:
                # Check if exception already exists
                existing_exc = db.query(ExceptionItem).filter(
                    ExceptionItem.drive_id == drive_id,
                    ExceptionItem.type == "eligibility_edge_case",
                    ExceptionItem.description.like(f"%{student.name}%")
                ).first()

                if not existing_exc:
                    exception = ExceptionItem(
                        drive_id=drive_id,
                        type="eligibility_edge_case",
                        severity="medium",
                        description=f"Student {student.name} ({student.branch}) has CGPA {student.cgpa}, which is borderline for {drive.company_name} (Cutoff: {drive.cgpa_cutoff}).",
                        resolved=False
                    )
                    db.add(exception)

        db.commit()
        return results
