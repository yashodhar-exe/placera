import os
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import selectinload
from app.models import Student, JobDrive, EligibilityResult, CandidateMatch, StudentSkill, Resume, Project
from google import genai

class MatchingAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
        self.weights = {
            "skill": float(os.getenv("MATCH_WEIGHT_SKILL", "0.40")),
            "project": float(os.getenv("MATCH_WEIGHT_PROJECT", "0.25")),
            "academic": float(os.getenv("MATCH_WEIGHT_ACADEMIC", "0.20")),
            "readiness": float(os.getenv("MATCH_WEIGHT_READINESS", "0.15")),
        }

    async def run_matching(self, db: AsyncSession, drive_id: int):
        # Get Drive and required skills
        drive = await db.get(JobDrive, drive_id, options=[selectinload(JobDrive.job_skills)])
        if not drive:
            raise ValueError("Drive not found")
            
        jd_skills = [js.skill_name.lower() for js in drive.job_skills]
        jd_skill_set = set(jd_skills)

        await db.execute(
            delete(CandidateMatch)
            .where(CandidateMatch.drive_id == drive_id)
            .where(CandidateMatch.status != "REJECTED")
        )
        
        # Get eligible students and their resumes
        result = await db.execute(
            select(EligibilityResult)
            .where(EligibilityResult.drive_id == drive_id)
            .where(EligibilityResult.is_eligible == True)
            .options(
                selectinload(EligibilityResult.student)
                .selectinload(Student.skills)
                .selectinload(StudentSkill.skill),
                selectinload(EligibilityResult.student)
                .selectinload(Student.projects)
            )
        )
        eligible_results = result.scalars().all()
        
        for er in eligible_results:
            student = er.student

            existing_rejected = await db.execute(
                select(CandidateMatch)
                .where(CandidateMatch.drive_id == drive_id)
                .where(CandidateMatch.student_id == student.id)
                .where(CandidateMatch.status == "REJECTED")
            )
            if existing_rejected.scalars().first():
                continue
            
            # Fetch Resume for Evidence-Based Matching
            resume_result = await db.execute(
                select(Resume).where(Resume.student_id == student.id).order_by(Resume.uploaded_at.desc())
            )
            resume = resume_result.scalars().first()
            
            skill_evidence_map = {}
            project_evidence = []
            certification_evidence = []
            education_evidence = []
            experience_evidence = []
            if resume and resume.structured_data:
                try:
                    structured = json.loads(resume.structured_data)
                    for s in structured.get("skills", []):
                        if isinstance(s, dict) and s.get("name"):
                            evidence = s.get("evidence", [])
                            skill_evidence_map[s["name"].lower()] = evidence or ["Resume skill section"]
                        elif isinstance(s, str):
                            skill_evidence_map[s.lower()] = ["Resume skill section"]
                    project_evidence = structured.get("projects", []) or []
                    certification_evidence = structured.get("certifications", []) or []
                    education_evidence = structured.get("education", []) or []
                    experience_evidence = structured.get("experience", []) or []
                except json.JSONDecodeError:
                    pass

            # 1. Skill Similarity
            student_skill_names = [ss.skill.name.lower() for ss in student.skills] if student.skills else []
            student_skill_names = list(set(student_skill_names + list(skill_evidence_map.keys())))
            
            matched = jd_skill_set.intersection(set(student_skill_names))
            missing = jd_skill_set - set(student_skill_names)
            
            skill_score = (len(matched) / len(jd_skills) * 100) if jd_skills else 100
            
            # 2. Academic Performance
            academic_score = (student.cgpa / 10.0) * 100 if student.cgpa else 70.0
            
            # 3. Project Relevance
            project_texts = []
            for project in student.projects or []:
                project_texts.append(f"{project.title} {project.description} {project.domain_tags}".lower())
            for project in project_evidence:
                if isinstance(project, dict):
                    project_texts.append(" ".join(str(v) for v in project.values()).lower())
                else:
                    project_texts.append(str(project).lower())
            project_hits = sum(1 for skill in jd_skills if any(skill in text for text in project_texts))
            project_score = (project_hits / len(jd_skills) * 100) if jd_skills else 75.0
            
            # 4. Readiness/Certification
            readiness_score = student.readiness_score if student.readiness_score > 0 else 75.0
            if certification_evidence and jd_skills:
                cert_blob = json.dumps(certification_evidence).lower()
                cert_hits = sum(1 for skill in jd_skills if skill in cert_blob)
                readiness_score = min(100.0, readiness_score + cert_hits * 5)
            
            # Hybrid Score
            match_score = (
                (self.weights["skill"] * skill_score) +
                (self.weights["project"] * project_score) +
                (self.weights["academic"] * academic_score) +
                (self.weights["readiness"] * readiness_score)
            )
            
            # Format Evidence
            evidence_json = {
                skill: skill_evidence_map.get(skill, ["Supported by profile data"])
                for skill in sorted(matched)
            }
            if project_evidence:
                evidence_json["_projects"] = project_evidence[:3]
            if certification_evidence:
                evidence_json["_certifications"] = certification_evidence[:3]
            if education_evidence:
                evidence_json["_education"] = education_evidence[:2]
            if experience_evidence:
                evidence_json["_experience"] = experience_evidence[:2]
            
            # Generate explanation using Gemini
            explanation, missing_exp = self._generate_explanations(student.name, drive.role, match_score, matched, missing, skill_evidence_map)
            
            match = CandidateMatch(
                drive_id=drive_id,
                student_id=student.id,
                match_score=round(match_score, 2),
                skill_score=round(skill_score, 2),
                academic_score=round(academic_score, 2),
                project_score=round(project_score, 2),
                readiness_score=round(readiness_score, 2),
                matched_skills=",".join(matched),
                missing_skills=",".join(missing),
                explanation=explanation,
                skill_evidence=json.dumps(evidence_json),
                missing_skills_explanation=missing_exp,
                status="AI_RECOMMENDATION"
            )
            db.add(match)
            
        drive.status = "MATCHING_DONE"
        await db.commit()
        return len(eligible_results)

    def _generate_explanations(self, name, role, score, matched, missing, evidence_map):
        if not self.client:
            return (
                f"Candidate {name} has a match score of {score:.1f}% for {role}.",
                f"Missing: {', '.join(missing) or 'None'}"
            )
            
        prompt = f"""
        You are evaluating {name} for the {role} role. Match score: {score:.1f}%.
        Matched skills: {', '.join(matched) if matched else 'None'}.
        Missing skills: {', '.join(missing) if missing else 'None'}.
        Resume Evidence: {json.dumps(evidence_map)}
        
        Return a JSON object with two fields:
        1. "explanation": 2 concise sentences explaining why they match based on the evidence.
        2. "missing_explanation": 1 concise sentence explaining the impact of the missing skills.
        
        Do not use markdown blocks.
        """
        try:
            response = self.client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt
            )
            content = response.text.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            
            data = json.loads(content)
            return data.get("explanation", ""), data.get("missing_explanation", "")
        except Exception:
            return (
                f"{name} is a {score:.1f}% match. Matched: {','.join(matched)}.",
                f"Missing: {','.join(missing)}."
            )
