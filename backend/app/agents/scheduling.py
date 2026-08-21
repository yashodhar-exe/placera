from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import CandidateMatch, Interview, TimeSlot, JobDrive
from datetime import datetime, timedelta

class SchedulingAgent:
    async def generate_schedule(self, db: AsyncSession, drive_id: int):
        """
        Creates Interview records with proposed time slots for approved candidates.
        """
        # Get approved candidates
        result = await db.execute(
            select(CandidateMatch)
            .where(CandidateMatch.drive_id == drive_id)
            .where(CandidateMatch.status == "APPROVED")
        )
        approved_matches = result.scalars().all()
        
        if not approved_matches:
            return 0
            
        # For MVP, we just create slots starting from tomorrow 10 AM, 30 mins each
        start_time = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        interviews_created = 0
        for match in approved_matches:
            # Create a time slot
            end_time = start_time + timedelta(minutes=30)
            slot = TimeSlot(start_time=start_time, end_time=end_time)
            db.add(slot)
            await db.flush() # flush to get slot ID
            
            interview = Interview(
                drive_id=drive_id,
                student_id=match.student_id,
                time_slot_id=slot.id,
                status="SCHEDULED"
            )
            db.add(interview)
            interviews_created += 1
            
            # Increment time for next slot
            start_time = end_time
            
        await db.commit()
        return interviews_created
