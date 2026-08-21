from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.jd_intake import JDIntakeAgent, JDRequirements
from app.agents.eligibility import EligibilityAgent
from app.agents.matching import MatchingAgent
from app.agents.scheduling import SchedulingAgent
from app.agents.coordination import CoordinationAgent
from app.agents.exception import ExceptionAgent
from app.agents.notification import NotificationAgent
from app.agents.resume_intelligence import ResumeIntelligenceAgent
from app.agents.readiness import ReadinessCoachAgent
from app.models import JobDrive

class PlacementManagerAgent:
    """
    Orchestrator for the Placement pipeline.
    Routes execution to the specialized agents.
    """
    def __init__(self):
        self.jd_agent = JDIntakeAgent()
        self.eligibility_agent = EligibilityAgent()
        self.matching_agent = MatchingAgent()
        self.scheduling_agent = SchedulingAgent()
        self.coordination_agent = CoordinationAgent()
        self.exception_agent = ExceptionAgent()
        self.notification_agent = NotificationAgent()
        self.resume_agent = ResumeIntelligenceAgent()
        self.readiness_agent = ReadinessCoachAgent()

    async def generate_readiness_plan(self, db, student_id: int, drive_id: int, match_score: float, missing_skills: str):
        return await self.readiness_agent.generate_plan(db, student_id, drive_id, match_score, missing_skills)

    async def parse_and_store_resume(self, db, student_id: int, file_path: str):
        return await self.resume_agent.parse_and_store_resume(db, student_id, file_path)


    def parse_job_description(self, jd_text: str) -> JDRequirements:
        return self.jd_agent.parse_jd(jd_text)
        
    async def run_eligibility(self, db: AsyncSession, drive_id: int):
        return await self.eligibility_agent.filter_students(db, drive_id)
        
    async def run_matching(self, db: AsyncSession, drive_id: int):
        return await self.matching_agent.run_matching(db, drive_id)
        
    async def run_scheduling_and_coordination(self, db: AsyncSession, drive_id: int):
        slots_created = await self.scheduling_agent.generate_schedule(db, drive_id)
        allocated = await self.coordination_agent.allocate_resources(db, drive_id)
        
        drive = await db.get(JobDrive, drive_id)
        if drive:
            drive.status = "SCHEDULED"
            await db.commit()
            
        return slots_created, allocated
        
    async def check_and_replan_exceptions(self, db: AsyncSession):
        conflicts = await self.exception_agent.detect_and_handle_conflicts(db)
        # In a real system, the TPO would trigger replanning, but for MVP we can expose the replan method
        return conflicts
        
    async def negotiate_conflict(self, db: AsyncSession, exception_id: int):
        return await self.exception_agent.negotiate_conflict(db, exception_id)

    async def apply_resolution(self, db: AsyncSession, exception_id: int, resolution_id: str):
        return await self.exception_agent.apply_resolution(db, exception_id, resolution_id)
        
    def send_update_notifications(self, drive_id: int, message: str):
        self.notification_agent.send_notification("students_and_panels@college.edu", f"Update for Drive {drive_id}", message)
