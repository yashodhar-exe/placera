from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.entities import Student, PlacementDrive, StudentEligibility
from app.services.audit_service import AuditService

class EligibilityAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="EligibilityAgent",
            role_description="Evaluates student database against drive rules deterministically with full explainability"
        )

    def evaluate_student(self, student: Student, drive: PlacementDrive) -> Tuple[bool, Dict[str, Any], List[str]]:
        """
        Evaluates a single student against drive criteria and produces explainable breakdown.
        """
        breakdown = {}
        exclusion_reasons = []
        is_eligible = True

        # 1. Branch Check
        branch_pass = student.branch in drive.allowed_branches
        breakdown["branch_check"] = {
            "pass": branch_pass,
            "student_branch": student.branch,
            "allowed_branches": drive.allowed_branches,
            "status_text": f"Branch '{student.branch}' {'matches' if branch_pass else 'not in'} eligible branches ({', '.join(drive.allowed_branches)})"
        }
        if not branch_pass:
            is_eligible = False
            exclusion_reasons.append(f"Branch '{student.branch}' is not among allowed branches: {', '.join(drive.allowed_branches)}")

        # 2. CGPA Cutoff Check
        cgpa_pass = student.cgpa >= drive.min_cgpa
        breakdown["cgpa_check"] = {
            "pass": cgpa_pass,
            "student_cgpa": student.cgpa,
            "required_min_cgpa": drive.min_cgpa,
            "status_text": f"CGPA {student.cgpa:.2f} {'meets' if cgpa_pass else 'is below'} minimum cutoff {drive.min_cgpa:.2f}"
        }
        if not cgpa_pass:
            is_eligible = False
            exclusion_reasons.append(f"CGPA {student.cgpa:.2f} is below minimum requirement of {drive.min_cgpa:.2f}")

        # 3. 10th / 12th Percentages
        tenth_pass = (student.tenth_percentage or 100.0) >= (drive.min_tenth_pct or 0.0)
        twelfth_pass = (student.twelfth_percentage or 100.0) >= (drive.min_twelfth_pct or 0.0)
        breakdown["school_academics_check"] = {
            "pass": tenth_pass and twelfth_pass,
            "tenth_pct": student.tenth_percentage,
            "twelfth_pct": student.twelfth_percentage,
            "required_tenth": drive.min_tenth_pct,
            "required_twelfth": drive.min_twelfth_pct
        }
        if not tenth_pass or not twelfth_pass:
            is_eligible = False
            exclusion_reasons.append("Secondary (10th/12th) academic percentage below threshold")

        # 4. Active Backlogs
        backlog_pass = student.active_backlogs <= drive.max_active_backlogs
        breakdown["active_backlogs_check"] = {
            "pass": backlog_pass,
            "student_active_backlogs": student.active_backlogs,
            "max_allowed": drive.max_active_backlogs,
            "status_text": f"{student.active_backlogs} active backlogs (max permitted: {drive.max_active_backlogs})"
        }
        if not backlog_pass:
            is_eligible = False
            exclusion_reasons.append(f"Has {student.active_backlogs} active backlogs (Maximum allowed is {drive.max_active_backlogs})")

        # 5. Backlog History
        history_pass = True
        if not drive.allow_history_backlogs and student.history_backlogs > 0:
            history_pass = False
        breakdown["history_backlogs_check"] = {
            "pass": history_pass,
            "student_history_backlogs": student.history_backlogs,
            "allow_history": drive.allow_history_backlogs
        }
        if not history_pass:
            is_eligible = False
            exclusion_reasons.append(f"Company mandates 0 historical backlogs (Student had {student.history_backlogs} past backlogs)")

        # 6. Placement Policy & Tier Upgrade Rules
        tier_pass = True
        drive_tier = drive.tier or "TIER_1"
        student_status = student.placement_status or "UNPLACED"
        
        if student_status == "PLACED_DREAM":
            tier_pass = False
            exclusion_reasons.append(f"Already placed in DREAM tier at {student.current_company or 'Top Org'} ({student.current_package_lpa or 18} LPA)")
        elif student_status == "PLACED_TIER_1":
            if drive_tier != "DREAM" and (drive.ctc_lpa < (student.current_package_lpa or 10.0) * 1.4):
                tier_pass = False
                exclusion_reasons.append(f"Already placed in TIER 1 at {student.current_company or 'Org'} ({student.current_package_lpa or 10} LPA). Only DREAM tier / 40%+ upgrade allowed.")
        elif student_status == "PLACED_TIER_2":
            if drive_tier == "TIER_2" and drive.ctc_lpa <= (student.current_package_lpa or 4.5):
                tier_pass = False
                exclusion_reasons.append(f"Already placed in TIER 2 at {student.current_company or 'Org'}")

        breakdown["tier_policy_check"] = {
            "pass": tier_pass,
            "student_placement_status": student_status,
            "student_current_company": student.current_company,
            "student_package_lpa": student.current_package_lpa,
            "drive_tier": drive_tier,
            "drive_ctc_lpa": drive.ctc_lpa
        }
        if not tier_pass and "Already placed" not in " ".join(exclusion_reasons):
            is_eligible = False
            exclusion_reasons.append("University Tier Upgrade Policy restriction")

        return is_eligible, breakdown, exclusion_reasons

    def evaluate_drive_eligibility(self, db: Session, drive_id: int) -> Dict[str, Any]:
        """
        Runs eligibility evaluation across all active students for a placement drive.
        """
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise ValueError(f"Drive #{drive_id} not found")

        students = db.query(Student).all()
        
        total_count = len(students)
        eligible_count = 0
        excluded_count = 0

        # Existing overrides map to preserve TPO decisions if re-run
        existing_elig = {
            e.student_id: e for e in db.query(StudentEligibility).filter(StudentEligibility.drive_id == drive_id).all()
        }

        for student in students:
            is_eligible, breakdown, exclusions = self.evaluate_student(student, drive)
            
            if student.id in existing_elig:
                record = existing_elig[student.id]
                # If TPO explicitly overridden, preserve the override state
                if not record.is_overridden:
                    record.is_eligible = is_eligible
                    record.reason_breakdown = breakdown
                    record.exclusion_reasons = exclusions
                else:
                    # Keep override flag and reason, update raw evaluation details
                    record.reason_breakdown = breakdown
            else:
                record = StudentEligibility(
                    drive_id=drive_id,
                    student_id=student.id,
                    is_eligible=is_eligible,
                    reason_breakdown=breakdown,
                    exclusion_reasons=exclusions,
                    is_overridden=False
                )
                db.add(record)

            if is_eligible:
                eligible_count += 1
            else:
                excluded_count += 1

        drive.stage = "ELIGIBILITY_PROCESSED"
        db.commit()

        self.log_agent_action("EVALUATE_ELIGIBILITY_COMPLETED", {
            "drive_id": drive_id,
            "total_students": total_count,
            "eligible_students": eligible_count,
            "excluded_students": excluded_count
        })

        return {
            "drive_id": drive_id,
            "total_students": total_count,
            "eligible_count": eligible_count,
            "excluded_count": excluded_count,
            "eligibility_rate_pct": round((eligible_count / total_count * 100) if total_count > 0 else 0, 1)
        }

    def override_eligibility(
        self,
        db: Session,
        drive_id: int,
        student_id: int,
        new_is_eligible: bool,
        reason: str,
        actor_id: str = "TPO_ADMIN"
    ) -> StudentEligibility:
        """
        Allows TPO to manually override eligibility decision with mandatory audit logging.
        """
        record = db.query(StudentEligibility).filter(
            StudentEligibility.drive_id == drive_id,
            StudentEligibility.student_id == student_id
        ).first()

        if not record:
            student = db.query(Student).filter(Student.id == student_id).first()
            drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
            if not student or not drive:
                raise ValueError("Invalid student or drive ID")
            is_elig, breakdown, exclusions = self.evaluate_student(student, drive)
            record = StudentEligibility(
                drive_id=drive_id,
                student_id=student_id,
                is_eligible=new_is_eligible,
                reason_breakdown=breakdown,
                exclusion_reasons=exclusions,
                is_overridden=True,
                override_reason=reason,
                overridden_by=actor_id
            )
            db.add(record)
        else:
            before_state = {
                "is_eligible": record.is_eligible,
                "is_overridden": record.is_overridden,
                "override_reason": record.override_reason
            }
            record.is_eligible = new_is_eligible
            record.is_overridden = True
            record.override_reason = reason
            record.overridden_by = actor_id
            
            # Log in Audit Trail
            AuditService.log_action(
                db=db,
                action_type="OVERRIDE_ELIGIBILITY",
                target_type="StudentEligibility",
                target_id=str(record.id),
                drive_id=drive_id,
                before_state=before_state,
                after_state={
                    "is_eligible": new_is_eligible,
                    "is_overridden": True,
                    "override_reason": reason
                },
                reason=reason,
                actor_id=actor_id
            )

        db.commit()
        db.refresh(record)
        return record

eligibility_agent = EligibilityAgent()
