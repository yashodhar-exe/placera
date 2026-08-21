from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Student, EligibilityResult, JobDrive

class EligibilityAgent:
    async def filter_students(self, db: AsyncSession, drive_id: int) -> int:
        """
        Runs deterministic rules against student records and creates EligibilityResult entries.
        Returns the number of eligible students found.
        """
        # Get Drive
        drive = await db.get(JobDrive, drive_id)
        if not drive:
            raise ValueError("Drive not found")
            
        allowed_branches = drive.allowed_branches.split(",") if drive.allowed_branches else []
        allowed_branches = [b.strip() for b in allowed_branches]
        
        # Get all students
        result = await db.execute(select(Student))
        students = result.scalars().all()
        
        eligible_count = 0
        
        for student in students:
            is_eligible = True
            reasons = []
            
            # CGPA Check
            if drive.cgpa_cutoff is not None and student.cgpa < drive.cgpa_cutoff:
                is_eligible = False
                reasons.append(f"CGPA {student.cgpa} below cutoff {drive.cgpa_cutoff}")
                
            # Branch Check
            if allowed_branches and student.branch not in allowed_branches:
                is_eligible = False
                reasons.append(f"Branch {student.branch} not allowed")
                
            # Backlogs Check
            if drive.max_backlogs is not None and student.backlogs > drive.max_backlogs:
                is_eligible = False
                reasons.append(f"Backlogs {student.backlogs} above limit {drive.max_backlogs}")
                
            # Prior Offer Check
            if not drive.allow_prior_offers and student.has_prior_offer:
                is_eligible = False
                reasons.append("Already has a prior offer")
                
            reason_str = ", ".join(reasons) if reasons else "Meets all criteria"
            
            # Save or update eligibility result
            # (In MVP we just create new or update if exists, simple create for now)
            elig_result = EligibilityResult(
                drive_id=drive_id,
                student_id=student.id,
                is_eligible=is_eligible,
                reason=reason_str,
                status="PENDING_APPROVAL" if is_eligible else "REJECTED_BY_AI"
            )
            db.add(elig_result)
            
            if is_eligible:
                eligible_count += 1
                
        # Update drive status
        drive.status = "ELIGIBILITY_DONE"
        
        await db.commit()
        return eligible_count
