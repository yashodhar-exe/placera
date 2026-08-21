import os
import json
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ReadinessPlan, CandidateMatch

class ReadinessCoachAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    async def generate_plan(self, db: AsyncSession, student_id: int, drive_id: int, match_score: float, missing_skills: str):
        # 1. Generate plan using Gemini
        readiness_score = match_score # Start with match score as base
        
        plan_text = self._generate_plan_text(missing_skills, readiness_score)

        # 2. Store in DB
        plan = ReadinessPlan(
            student_id=student_id,
            drive_id=drive_id,
            readiness_score=readiness_score,
            skill_gaps=missing_skills,
            plan=plan_text
        )
        db.add(plan)
        await db.commit()
        return plan

    def _generate_plan_text(self, missing_skills: str, score: float) -> str:
        if not missing_skills or missing_skills.lower() == "none":
            return "You are highly ready! Focus on mock interviews and behavioral questions."
            
        if not self.client:
            return f"Focus on these missing skills: {missing_skills}. Create a 3-day study plan."

        prompt = f"""
        You are an expert Placement Readiness Coach.
        A student has a readiness score of {score:.1f}% for an upcoming interview.
        They are missing these key skills: {missing_skills}.

        Generate a concise 3-day preparation plan for them.
        Format it in Markdown like:
        ### 3-DAY PLAN
        **Day 1:** [Topic] - [Actionable Advice]
        **Day 2:** [Topic] - [Actionable Advice]
        **Day 3:** [Topic] - [Actionable Advice]
        
        Keep it very brief, action-oriented, and specific to the missing skills.
        """
        try:
            response = self.client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt
            )
            return response.text.strip()
        except Exception:
            return f"Focus on these missing skills: {missing_skills}. Create a 3-day study plan."
