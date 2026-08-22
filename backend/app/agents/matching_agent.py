from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.entities import Student, PlacementDrive, StudentEligibility, CandidateMatch
from app.services.vector_store import vector_store
from app.services.audit_service import AuditService

class MatchingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="MatchingAgent",
            role_description="Ranks eligible students against JD using explainable multi-factor and semantic scoring"
        )

    def calculate_student_match(self, student: Student, drive: PlacementDrive, semantic_sim: float = 0.7) -> Dict[str, Any]:
        """
        Calculates explainable multi-factor score for an eligible candidate.
        """
        required_skills = [s.strip() for s in (drive.required_skills or [])]
        preferred_skills = [s.strip() for s in (drive.preferred_skills or [])]
        
        student_skill_map = {}
        for sk in (student.skills or []):
            name = vector_store.normalize_skill(sk.get("name", ""))
            level = sk.get("level", "Intermediate").lower()
            weight = 1.0 if "expert" in level or "advanced" in level else (0.85 if "intermediate" in level else 0.6)
            student_skill_map[name] = weight

        matched_skills = []
        missing_skills = []
        
        # Check required skills
        req_match_points = 0.0
        for req in required_skills:
            norm_req = vector_store.normalize_skill(req)
            matched = False
            for s_name, s_weight in student_skill_map.items():
                if norm_req in s_name or s_name in norm_req:
                    req_match_points += s_weight
                    matched = True
                    matched_skills.append(req)
                    break
            if not matched:
                missing_skills.append(req)

        req_coverage = (req_match_points / max(1, len(required_skills))) * 100.0

        # Check preferred skills
        pref_match_points = 0.0
        for pref in preferred_skills:
            norm_pref = vector_store.normalize_skill(pref)
            for s_name, s_weight in student_skill_map.items():
                if norm_pref in s_name or s_name in norm_pref:
                    pref_match_points += s_weight
                    if pref not in matched_skills:
                        matched_skills.append(pref)
                    break

        pref_bonus = min(15.0, pref_match_points * 5.0)
        skill_score = min(100.0, req_coverage * 0.85 + pref_bonus)

        # 2. Project Relevance Score (25%)
        project_count = len(student.projects or [])
        project_tech_hits = 0
        for p in (student.projects or []):
            stack = " ".join(p.get("tech_stack", [])).lower()
            desc = p.get("description", "").lower()
            for s in required_skills:
                norm_s = vector_store.normalize_skill(s)
                if norm_s in stack or norm_s in desc:
                    project_tech_hits += 1

        project_score = min(100.0, 40.0 + (min(3, project_count) * 15.0) + (min(3, project_tech_hits) * 8.0))

        # 3. Academic Score (20%)
        # 10.0 CGPA -> 100, 7.0 CGPA -> 70
        academic_score = min(100.0, max(40.0, student.cgpa * 10.0))

        # 4. Placement Readiness Score (15%)
        readiness_score = float(student.placement_readiness_score or 70.0)

        # Overall Weighted Score
        overall_score = round(
            (0.40 * skill_score) +
            (0.25 * project_score) +
            (0.20 * academic_score) +
            (0.15 * readiness_score),
            1
        )

        # Strengths & Risk Flags
        strength_highlights = []
        risk_flags = []

        if student.cgpa >= 8.5:
            strength_highlights.append(f"Outstanding academic record (CGPA {student.cgpa:.2f})")
        if len(matched_skills) >= len(required_skills):
            strength_highlights.append(f"100% coverage of core required skills ({', '.join(required_skills[:3])})")
        elif len(matched_skills) > 0:
            strength_highlights.append(f"Solid proficiency in {', '.join(matched_skills[:3])}")

        if project_count >= 2:
            strength_highlights.append(f"Strong practical experience with {project_count} verified projects")
        if student.mock_interview_rating >= 8.0:
            strength_highlights.append("Top-tier mock interview performance (Rating >= 8.0/10)")

        if missing_skills:
            risk_flags.append(f"Lacks verified proficiency in: {', '.join(missing_skills)}")
        if student.active_backlogs > 0:
            risk_flags.append(f"Has {student.active_backlogs} active backlogs")
        if skill_score < 60.0:
            risk_flags.append("Core technical skills gap against JD requirements")

        recommendation_summary = (
            f"Candidate shows {overall_score:.1f}% fit for {drive.role_title}. "
            f"Possesses {len(matched_skills)}/{len(required_skills)} core skills. "
            f"{'Strongly recommended for technical interview round.' if overall_score >= 75 else 'Consider for shortlist based on project evaluation.'}"
        )

        return {
            "overall_score": overall_score,
            "skill_score": round(skill_score, 1),
            "academic_score": round(academic_score, 1),
            "project_score": round(project_score, 1),
            "readiness_score": round(readiness_score, 1),
            "semantic_similarity": round(semantic_sim, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "strength_highlights": strength_highlights,
            "risk_flags": risk_flags,
            "ai_recommendation_summary": recommendation_summary
        }

    def generate_candidate_matches(self, db: Session, drive_id: int) -> Dict[str, Any]:
        """
        Runs matching and ranking for all eligible students for a drive.
        """
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise ValueError(f"Drive #{drive_id} not found")

        # Fetch eligible students
        eligible_records = db.query(StudentEligibility).filter(
            StudentEligibility.drive_id == drive_id,
            StudentEligibility.is_eligible == True
        ).all()

        if not eligible_records:
            return {"drive_id": drive_id, "matches_generated": 0, "message": "No eligible students found"}

        student_ids = [e.student_id for e in eligible_records]
        students = db.query(Student).filter(Student.id.in_(student_ids)).all()

        # Semantic vectors
        drive_text = vector_store.build_jd_requirements_text({
            "role_title": drive.role_title,
            "required_skills": drive.required_skills,
            "preferred_skills": drive.preferred_skills,
            "job_description_raw": drive.job_description_raw
        })
        candidate_texts = [
            vector_store.build_candidate_profile_text({
                "branch": s.branch,
                "skills": s.skills,
                "projects": s.projects,
                "certifications": s.certifications,
                "resume_summary": s.resume_summary
            })
            for s in students
        ]
        semantic_scores = vector_store.compute_similarity(drive_text, candidate_texts)

        # Existing matches map
        existing_matches = {
            m.student_id: m for m in db.query(CandidateMatch).filter(CandidateMatch.drive_id == drive_id).all()
        }

        match_results = []
        for idx, student in enumerate(students):
            sim = semantic_scores[idx] if idx < len(semantic_scores) else 0.65
            metrics = self.calculate_student_match(student, drive, sim)
            
            if student.id in existing_matches:
                m_record = existing_matches[student.id]
                m_record.overall_score = metrics["overall_score"]
                m_record.skill_score = metrics["skill_score"]
                m_record.academic_score = metrics["academic_score"]
                m_record.project_score = metrics["project_score"]
                m_record.readiness_score = metrics["readiness_score"]
                m_record.semantic_similarity = metrics["semantic_similarity"]
                m_record.matched_skills = metrics["matched_skills"]
                m_record.missing_skills = metrics["missing_skills"]
                m_record.strength_highlights = metrics["strength_highlights"]
                m_record.risk_flags = metrics["risk_flags"]
                m_record.ai_recommendation_summary = metrics["ai_recommendation_summary"]
            else:
                m_record = CandidateMatch(
                    drive_id=drive_id,
                    student_id=student.id,
                    overall_score=metrics["overall_score"],
                    skill_score=metrics["skill_score"],
                    academic_score=metrics["academic_score"],
                    project_score=metrics["project_score"],
                    readiness_score=metrics["readiness_score"],
                    semantic_similarity=metrics["semantic_similarity"],
                    matched_skills=metrics["matched_skills"],
                    missing_skills=metrics["missing_skills"],
                    strength_highlights=metrics["strength_highlights"],
                    risk_flags=metrics["risk_flags"],
                    ai_recommendation_summary=metrics["ai_recommendation_summary"],
                    tpo_status="RECOMMENDED",
                    is_shortlisted=(metrics["overall_score"] >= 72.0)
                )
                db.add(m_record)
            match_results.append(m_record)

        db.flush()

        # Sort by overall score descending to assign rank
        all_matches = db.query(CandidateMatch).filter(CandidateMatch.drive_id == drive_id).order_by(CandidateMatch.overall_score.desc()).all()
        for r, m in enumerate(all_matches, start=1):
            m.rank = r

        drive.stage = "SHORTLIST_PROPOSED"
        db.commit()

        self.log_agent_action("GENERATE_MATCHES_COMPLETED", {
            "drive_id": drive_id,
            "total_candidates_ranked": len(all_matches),
            "top_candidate_score": all_matches[0].overall_score if all_matches else 0
        })

        return {
            "drive_id": drive_id,
            "ranked_candidates_count": len(all_matches),
            "recommended_shortlist_count": len([m for m in all_matches if m.is_shortlisted])
        }

    def update_shortlist_decision(
        self,
        db: Session,
        match_ids: List[int],
        action: str,  # APPROVE, REJECT, WAITLIST, REMOVE
        actor_id: str = "TPO_ADMIN",
        notes: Optional[str] = None
    ):
        matches = db.query(CandidateMatch).filter(CandidateMatch.id.in_(match_ids)).all()
        if not matches:
            return 0

        drive_id = matches[0].drive_id

        for m in matches:
            before_state = {"tpo_status": m.tpo_status, "is_shortlisted": m.is_shortlisted}
            if action == "APPROVE":
                m.tpo_status = "APPROVED"
                m.is_shortlisted = True
            elif action == "REJECT":
                m.tpo_status = "REJECTED"
                m.is_shortlisted = False
            elif action == "WAITLIST":
                m.tpo_status = "WAITLISTED"
                m.is_shortlisted = False
            elif action == "REMOVE":
                m.tpo_status = "REMOVED"
                m.is_shortlisted = False
            m.tpo_notes = notes

            AuditService.log_action(
                db=db,
                action_type=f"SHORTLIST_{action}",
                target_type="CandidateMatch",
                target_id=str(m.id),
                drive_id=drive_id,
                before_state=before_state,
                after_state={"tpo_status": m.tpo_status, "is_shortlisted": m.is_shortlisted},
                reason=notes,
                actor_id=actor_id
            )

        db.commit()
        return len(matches)

matching_agent = MatchingAgent()
