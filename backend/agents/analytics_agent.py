from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import Student, Drive, MatchScore
from typing import Dict, Any, List

class AnalyticsAgent:
    @staticmethod
    def get_skill_gap_analysis(db: Session) -> List[Dict[str, Any]]:
        """
        Analyzes skill gaps: how many drives demand a skill vs how many students have it (Intermediate/Advanced).
        """
        drives = db.query(Drive).all()
        students = db.query(Student).all()

        # Count skill demand in drives
        demand = {}
        for drive in drives:
            req = drive.required_skills.get("required", [])
            pref = drive.required_skills.get("preferred", [])
            for sk in req + pref:
                sk_name = sk.title()
                demand[sk_name] = demand.get(sk_name, 0) + 1

        # Count student proficiency in those skills
        supply = {}
        for student in students:
            for sk_item in student.skills:
                sk_name = sk_item.get("skill", "").title()
                level = sk_item.get("level", "Beginner").lower()
                if level in ["intermediate", "advanced"]:
                    supply[sk_name] = supply.get(sk_name, 0) + 1

        # Combine
        skills = sorted(list(set(list(demand.keys()) + list(supply.keys()))))
        skill_gap_data = []
        for sk in skills:
            d_count = demand.get(sk, 0)
            s_count = supply.get(sk, 0)
            skill_gap_data.append({
                "skill": sk,
                "demand": d_count,
                "supply": s_count,
                "gap": max(0, d_count - s_count)
            })
        return skill_gap_data

    @staticmethod
    def get_readiness_trends(db: Session) -> Dict[str, Any]:
        """
        Returns average derived scores (API, SSI, PRS) across departments (branches).
        """
        branches = db.query(Student.branch).distinct().all()
        branch_names = [b[0] for b in branches]

        trends = []
        for branch in branch_names:
            studs = db.query(Student).filter(Student.branch == branch).all()
            if not studs:
                continue
            avg_api = sum(s.api_score for s in studs) / len(studs)
            avg_ssi = sum(s.ssi_score for s in studs) / len(studs)
            avg_prs = sum(s.prs_score for s in studs) / len(studs)
            avg_cgpa = sum(s.cgpa for s in studs) / len(studs)
            
            trends.append({
                "branch": branch,
                "avg_cgpa": round(avg_cgpa, 2),
                "avg_api": round(avg_api, 2),
                "avg_ssi": round(avg_ssi, 2),
                "avg_prs": round(avg_prs, 2),
                "student_count": len(studs)
            })
        
        return {
            "department_comparison": trends,
            "overall_averages": {
                "avg_api": round(db.query(func.avg(Student.api_score)).scalar() or 0.0, 2),
                "avg_ssi": round(db.query(func.avg(Student.ssi_score)).scalar() or 0.0, 2),
                "avg_prs": round(db.query(func.avg(Student.prs_score)).scalar() or 0.0, 2),
            }
        }
