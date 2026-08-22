import os
import json
import re
from google import genai
try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - keeps the API importable if pypdf is absent.
    PdfReader = None
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Student, Skill, StudentSkill, Resume, AgentEvent

class ResumeIntelligenceAgent:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None

    async def parse_and_store_resume(self, db: AsyncSession, student_id: int, file_path: str):
        # 1. Extract text from PDF
        extracted_text = ""
        try:
            if PdfReader is None:
                raise ValueError("PDF parser dependency is unavailable.")
            reader = PdfReader(file_path)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        except Exception as e:
            raise ValueError(f"Failed to read PDF: {str(e)}")

        if not extracted_text.strip():
            raise ValueError("No text could be extracted from the PDF.")

        # 2. Use Gemini to structure the data
        structured_data = self._extract_structured_data(extracted_text)

        # 3. Store in DB
        # Create Resume record
        resume = Resume(
            student_id=student_id,
            file_path=file_path,
            extracted_text=extracted_text,
            structured_data=json.dumps(structured_data)
        )
        db.add(resume)
        
        # Log Agent Event
        event = AgentEvent(
            agent="ResumeIntelligenceAgent",
            event_type="RESUME_PARSED",
            message=f"Extracted profile for student {student_id}",
            details=json.dumps({"skills_found": len(structured_data.get("skills", []))}),
            status="SUCCESS",
            related_entity=f"Student:{student_id}"
        )
        db.add(event)

        # Update Student model if cgpa or branch is found
        student = await db.get(Student, student_id)
        if student:
            if structured_data.get("cgpa"):
                student.cgpa = float(structured_data["cgpa"])
            if structured_data.get("branch"):
                student.branch = structured_data["branch"]

            # Note: A real app would sync skills to StudentSkill, but for this MVP,
            # we will rely on the `Resume` structured_data during Matching phase 
            # to provide evidence. We can just add the new skills here.
            for skill_info in structured_data.get("skills", []):
                skill_name = skill_info.get("name")
                if not skill_name:
                    continue
                # Get or create Skill
                result = await db.execute(select(Skill).where(Skill.name == skill_name))
                skill = result.scalars().first()
                if not skill:
                    skill = Skill(name=skill_name)
                    db.add(skill)
                    await db.flush()
                
                # Check if StudentSkill exists
                result = await db.execute(
                    select(StudentSkill).where(
                        StudentSkill.student_id == student_id,
                        StudentSkill.skill_id == skill.id
                    )
                )
                if not result.scalars().first():
                    db.add(StudentSkill(student_id=student_id, skill_id=skill.id, proficiency=3))

        await db.commit()
        return resume

    def _extract_structured_data(self, text: str) -> dict:
        if not self.client:
            return self._local_extract_structured_data(text)

        prompt = f"""
        You are an expert technical recruiter and resume parser.
        Extract the following structured information from the provided resume text.
        
        Return ONLY a JSON object (without markdown code blocks like ```json) with this exact schema:
        {{
            "cgpa": float or null,
            "branch": "string or null",
            "skills": [
                {{
                    "name": "Skill Name",
                    "proficiency": "beginner/intermediate/advanced",
                    "evidence": ["Evidence 1", "Evidence 2"]
                }}
            ],
            "projects": [
                {{
                    "title": "Project Title",
                    "description": "Short description"
                }}
            ],
            "certifications": [],
            "experience": [],
            "achievements": []
        }}

        Do NOT invent any qualifications or experience. Use only what is found in the text.
        
        Resume Text:
        {text}
        """
        try:
            response = self.client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt
            )
            # Clean up the response to get raw JSON
            content = response.text.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            
            return json.loads(content)
        except Exception as e:
            print(f"Gemini Extraction Error: {e}")
            return self._local_extract_structured_data(text)

    def _local_extract_structured_data(self, text: str) -> dict:
        known_skills = [
            "Python", "Java", "C++", "SQL", "React", "Node.js", "TypeScript",
            "JavaScript", "Django", "Flask", "Spring Boot", "AWS", "Docker",
            "Kubernetes", "TensorFlow", "Machine Learning", "PostgreSQL",
            "REST APIs", "Git", "HTML/CSS", "Data Structures"
        ]
        lowered = text.lower()
        cgpa_match = re.search(r"cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)", text, re.IGNORECASE)
        branch_match = re.search(r"\b(CSE|ECE|IT|EEE|MECH|CIVIL)\b", text, re.IGNORECASE)
        skills = [
            {
                "name": skill,
                "proficiency": "intermediate",
                "evidence": ["Mentioned in uploaded resume"]
            }
            for skill in known_skills
            if skill.lower() in lowered
        ]
        project_lines = [
            line.strip(" -•")
            for line in text.splitlines()
            if "project" in line.lower() and len(line.strip()) > 8
        ][:5]
        return {
            "cgpa": float(cgpa_match.group(1)) if cgpa_match else None,
            "branch": branch_match.group(1).upper() if branch_match else None,
            "skills": skills,
            "projects": [{"title": line[:80], "description": line} for line in project_lines],
            "certifications": [],
            "education": [],
            "experience": [],
            "achievements": []
        }
