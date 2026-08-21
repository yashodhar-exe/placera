import numpy as np
import pandas as pd
import xgboost as xgb
import shap
import pickle
import os
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.models import Student, Drive, MatchScore, EligibilityResult

class MatchingAgent:
    @staticmethod
    def compute_skill_score(student: Student, drive: Drive) -> float:
        """
        Computes a skill score out of 100 based on drive requirements.
        """
        req_skills = drive.required_skills.get("required", [])
        pref_skills = drive.required_skills.get("preferred", [])
        
        if not req_skills and not pref_skills:
            return 80.0 # Default if no skills are defined
            
        student_skills_map = {sk["skill"].lower(): sk.get("level", "Beginner").lower() for sk in student.skills}
        
        # Required skills score
        req_score = 0.0
        if req_skills:
            matched_req = 0
            for skill in req_skills:
                skill_l = skill.lower()
                if skill_l in student_skills_map:
                    level = student_skills_map[skill_l]
                    if level == "advanced":
                        matched_req += 1.0
                    elif level == "intermediate":
                        matched_req += 0.8
                    else: # beginner
                        matched_req += 0.5
            req_score = (matched_req / len(req_skills)) * 100.0

        # Preferred skills score
        pref_score = 0.0
        if pref_skills:
            matched_pref = 0
            for skill in pref_skills:
                skill_l = skill.lower()
                if skill_l in student_skills_map:
                    level = student_skills_map[skill_l]
                    if level == "advanced":
                        matched_pref += 1.0
                    elif level == "intermediate":
                        matched_pref += 0.8
                    else:
                        matched_pref += 0.5
            pref_score = (matched_pref / len(pref_skills)) * 100.0
            
        # Combine: Required is 70% of skill score, Preferred is 30%
        if req_skills and pref_skills:
            return round(req_score * 0.7 + pref_score * 0.3, 2)
        elif req_skills:
            return round(req_score, 2)
        else:
            return round(pref_score, 2)

    @staticmethod
    def compute_project_score(student: Student, drive: Drive) -> float:
        """
        Computes a project score out of 100 based on relevance.
        """
        if not student.projects:
            return 20.0 # Base minimum score
            
        # Base count points
        base_score = min(len(student.projects) * 30.0, 60.0)
        
        # Relevance points
        req_skills = [s.lower() for s in drive.required_skills.get("required", [])]
        pref_skills = [s.lower() for s in drive.required_skills.get("preferred", [])]
        all_drive_skills = set(req_skills + pref_skills)
        
        relevance_score = 0.0
        for proj in student.projects:
            tech_stack = [t.lower() for t in proj.get("tech_stack", [])]
            # check intersection
            matched = all_drive_skills.intersection(tech_stack)
            if matched:
                relevance_score += 20.0
                
        return min(base_score + relevance_score, 100.0)

    @classmethod
    def calculate_deterministic_score(cls, student: Student, drive: Drive) -> Dict[str, Any]:
        """
        Computes deterministic score using the weighted formula.
        Weights: S_skill: 40%, S_academic: 25%, S_project: 20%, S_readiness: 15%
        """
        s_skill = cls.compute_skill_score(student, drive)
        s_academic = student.api_score # Out of 100
        s_project = cls.compute_project_score(student, drive)
        s_readiness = student.prs_score # Out of 100
        
        overall = 0.40 * s_skill + 0.25 * s_academic + 0.20 * s_project + 0.15 * s_readiness
        overall = round(overall, 2)
        
        return {
            "overall_score": overall,
            "skill_score": s_skill,
            "academic_score": s_academic,
            "project_score": s_project,
            "readiness_score": s_readiness
        }

    @classmethod
    def run_ml_explainability(cls, student: Student, drive: Drive, scores: Dict[str, Any], db: Session) -> Dict[str, float]:
        """
        Trains a quick XGBoost model and calculates SHAP values to explain the prediction.
        Returns a dictionary of feature importances / SHAP contributions.
        """
        try:
            # 1. Gather all student records for training a basic classifier
            all_students = db.query(Student).all()
            if len(all_students) < 5:
                # Fallback explanation if data is too small to fit model
                return cls.fallback_shap_explanation(scores)

            # 2. Build feature matrix
            data_list = []
            for s in all_students:
                s_skills_map = {sk["skill"].lower() for sk in s.skills}
                req_skills = drive.required_skills.get("required", [])
                matched_req = sum(1 for sk in req_skills if sk.lower() in s_skills_map)
                skill_match_pct = (matched_req / len(req_skills)) if req_skills else 1.0

                # Define mock label (outcome alignment)
                # Successful placement aligns with high CGPA, strong skills, projects
                is_aligned = 1 if (s.cgpa >= 7.8 and s.backlog_count == 0 and s.ssi_score >= 40) else 0

                data_list.append({
                    "cgpa": s.cgpa,
                    "backlog_count": s.backlog_count,
                    "api_score": s.api_score,
                    "ssi_score": s.ssi_score,
                    "prs_score": s.prs_score,
                    "project_count": len(s.projects),
                    "internship_count": len(s.internship_history),
                    "skill_match_pct": skill_match_pct,
                    "label": is_aligned
                })

            df = pd.DataFrame(data_list)
            X = df.drop(columns=["label"])
            y = df["label"]

            # Train XGBoost
            model = xgb.XGBRegressor(n_estimators=10, max_depth=3, learning_rate=0.1, random_state=42)
            model.fit(X, y)

            # Build feature vector for the target student
            tgt_skills_map = {sk["skill"].lower() for sk in student.skills}
            req_skills = drive.required_skills.get("required", [])
            matched_req = sum(1 for sk in req_skills if sk.lower() in tgt_skills_map)
            tgt_skill_match_pct = (matched_req / len(req_skills)) if req_skills else 1.0

            target_features = pd.DataFrame([{
                "cgpa": student.cgpa,
                "backlog_count": student.backlog_count,
                "api_score": student.api_score,
                "ssi_score": student.ssi_score,
                "prs_score": student.prs_score,
                "project_count": len(student.projects),
                "internship_count": len(student.internship_history),
                "skill_match_pct": tgt_skill_match_pct
            }])

            # SHAP Explainer
            explainer = shap.Explainer(model, X)
            shap_values = explainer(target_features)

            # Convert SHAP values to dictionary
            feature_names = X.columns.tolist()
            shap_contributions = {}
            base_value = shap_values.base_values[0] if hasattr(shap_values.base_values, "__len__") else shap_values.base_values
            
            # Map features to friendly names
            friendly_names = {
                "cgpa": "CGPA",
                "backlog_count": "Active Backlogs",
                "api_score": "Academic Score (API)",
                "ssi_score": "Skill Index (SSI)",
                "prs_score": "Readiness Score (PRS)",
                "project_count": "Projects Count",
                "internship_count": "Internships Count",
                "skill_match_pct": "JD Skill Alignment"
            }

            for idx, fname in enumerate(feature_names):
                val = float(shap_values.values[0][idx])
                friendly_name = friendly_names.get(fname, fname)
                shap_contributions[friendly_name] = round(val * 100, 2) # convert to percentage impact

            # Scale contributions so that they sum up to explain the score breakdown
            return shap_contributions
            
        except Exception as e:
            print(f"SHAP explanation error: {e}. Falling back to default.")
            return cls.fallback_shap_explanation(scores)

    @staticmethod
    def fallback_shap_explanation(scores: Dict[str, Any]) -> Dict[str, float]:
        """
        Fallback calculation for SHAP-style breakdown based on deterministic scores.
        """
        # Distribute based on sub-score deviation from mean
        return {
            "JD Skill Alignment": round((scores["skill_score"] - 50.0) * 0.4, 2),
            "Academic Score (API)": round((scores["academic_score"] - 75.0) * 0.25, 2),
            "Projects Count": round((scores["project_score"] - 50.0) * 0.2, 2),
            "Readiness Score (PRS)": round((scores["readiness_score"] - 50.0) * 0.15, 2),
            "Active Backlogs": 0.0
        }

    @classmethod
    def match_and_rank_students(cls, drive_id: int, db: Session) -> List[MatchScore]:
        """
        Calculates match scores and ranks for all eligible students for a drive.
        """
        drive = db.query(Drive).filter(Drive.id == drive_id).first()
        if not drive:
            raise ValueError(f"Drive with ID {drive_id} not found.")

        # Get all eligible student IDs (including overridden eligible ones)
        eligible_students = db.query(Student).join(
            EligibilityResult, EligibilityResult.student_id == Student.id
        ).filter(
            EligibilityResult.drive_id == drive_id,
            EligibilityResult.eligible == True
        ).all()

        if not eligible_students:
            return []

        # Remove previous match scores
        db.query(MatchScore).filter(MatchScore.drive_id == drive_id).delete()

        scored_records = []
        for student in eligible_students:
            scores = cls.calculate_deterministic_score(student, drive)
            shap_breakdown = cls.run_ml_explainability(student, drive, scores, db)
            
            match_score = MatchScore(
                drive_id=drive_id,
                student_id=student.id,
                overall_score=scores["overall_score"],
                skill_score=scores["skill_score"],
                academic_score=scores["academic_score"],
                project_score=scores["project_score"],
                readiness_score=scores["readiness_score"],
                feature_importance=shap_breakdown,
                approved=False
            )
            scored_records.append(match_score)
            db.add(match_score)

        db.flush()

        # Sort and rank
        scored_records.sort(key=lambda x: x.overall_score, reverse=True)
        for rank, rec in enumerate(scored_records, 1):
            rec.rank = rank

        db.commit()
        return scored_records
