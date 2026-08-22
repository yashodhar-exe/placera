from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models.entities import Student, PlacementDrive
from app.services.vector_store import vector_store

class AnalyticsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="AnalyticsAgent",
            role_description="Computes university skill gap analytics, department readiness, and hiring market trends"
        )

    def compute_skill_gap_matrix(self, db: Session) -> List[Dict[str, Any]]:
        """
        Analyzes recruiter demand across all drives vs student proficiency.
        """
        drives = db.query(PlacementDrive).filter(PlacementDrive.is_active == True).all()
        students = db.query(Student).all()
        total_students = max(1, len(students))
        total_drives = max(1, len(drives))

        # 1. Aggregate demand
        demand_counts = {}
        for d in drives:
            req_skills = d.required_skills or []
            pref_skills = d.preferred_skills or []
            for s in req_skills:
                norm = vector_store.normalize_skill(s)
                demand_counts[norm] = demand_counts.get(norm, 0) + 1.0
            for s in pref_skills:
                norm = vector_store.normalize_skill(s)
                demand_counts[norm] = demand_counts.get(norm, 0) + 0.5

        # 2. Student proficiency
        student_skill_counts = {}
        for st in students:
            for sk in (st.skills or []):
                norm = vector_store.normalize_skill(sk.get("name", ""))
                student_skill_counts[norm] = student_skill_counts.get(norm, 0) + 1

        catalog = [
            ("System Design & Distributed Systems", "Backend Architecture", "system design", "High demand in Tier 1 tech; organize microservices & caching workshops"),
            ("Docker & Containerization", "DevOps & Cloud", "docker", "Include containerization labs in 6th semester lab curriculum"),
            ("Kubernetes & Orchestration", "DevOps & Cloud", "kubernetes", "Host weekend certified cloud bootcamp"),
            ("Data Structures & Algorithms", "Core Computer Science", "dsa", "Maintain daily LeetCode practice sessions in placement lab"),
            ("FastAPI & RESTful APIs", "Backend Engineering", "fastapi", "Encourage production Python API capstone projects"),
            ("React & Frontend State", "Full-Stack Web", "react", "Organize Next.js/React fullstack hackathon"),
            ("SQL & Query Optimization", "Databases", "sql", "Conduct advanced indexing and query profiling masterclasses"),
            ("Machine Learning & LLMs", "AI / Emerging Tech", "machine learning", "Introduce Generative AI agent project coursework"),
            ("Embedded C / VLSI Design", "Core Electronics", "embedded", "Partner with Texas Instruments / Qualcomm for hardware lab")
        ]

        gap_items = []
        for display_name, category, key, rec_action in catalog:
            norm_key = vector_store.normalize_skill(key)
            
            # Recruiter demand %
            d_count = demand_counts.get(norm_key, 0.0)
            for k, v in demand_counts.items():
                if norm_key in k or k in norm_key:
                    d_count = max(d_count, v)
            
            demand_pct = round(min(95.0, (d_count / total_drives * 100) + 40.0), 1)

            # Student supply %
            s_count = student_skill_counts.get(norm_key, 0)
            for k, v in student_skill_counts.items():
                if norm_key in k or k in norm_key:
                    s_count = max(s_count, v)
            
            proficiency_pct = round(min(100.0, (s_count / total_students * 100)), 1)
            gap_pct = round(max(0.0, demand_pct - proficiency_pct), 1)
            
            severity = "CRITICAL" if gap_pct >= 35.0 else ("MODERATE" if gap_pct >= 15.0 else "GOOD")
            impacted = int(total_students * (gap_pct / 100.0))

            gap_items.append({
                "skill": display_name,
                "category": category,
                "industry_demand_pct": demand_pct,
                "student_proficiency_pct": proficiency_pct,
                "gap_pct": gap_pct,
                "severity": severity,
                "impacted_students_count": impacted,
                "recommended_action": rec_action
            })

        gap_items.sort(key=lambda x: x["gap_pct"], reverse=True)
        return gap_items

    def compute_department_readiness(self, db: Session) -> List[Dict[str, Any]]:
        students = db.query(Student).all()
        branches = list(set([s.branch for s in students]))
        
        results = []
        for b in sorted(branches):
            b_students = [s for s in students if s.branch == b]
            total = len(b_students)
            if total == 0:
                continue
            
            placed = len([s for s in b_students if s.placement_status != "UNPLACED"])
            avg_readiness = sum([s.placement_readiness_score or 70.0 for s in b_students]) / total
            avg_cgpa = sum([s.cgpa for s in b_students]) / total

            # Missing skills in this branch
            branch_skills = {}
            for s in b_students:
                for sk in (s.skills or []):
                    branch_skills[sk.get("name", "")] = branch_skills.get(sk.get("name", ""), 0) + 1
            
            top_missing = []
            if "Docker" not in branch_skills or branch_skills.get("Docker", 0) < total * 0.3:
                top_missing.append("Docker")
            if "System Design" not in branch_skills or branch_skills.get("System Design", 0) < total * 0.3:
                top_missing.append("System Design")
            if "AWS" not in branch_skills or branch_skills.get("AWS", 0) < total * 0.3:
                top_missing.append("Cloud / AWS")

            results.append({
                "branch": b,
                "total_students": total,
                "placed_count": placed,
                "placed_pct": round(placed / total * 100, 1),
                "avg_cgpa": round(avg_cgpa, 2),
                "avg_readiness_score": round(avg_readiness, 1),
                "top_missing_skills": top_missing[:3]
            })

        return results

analytics_agent = AnalyticsAgent()
