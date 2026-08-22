from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Student, PlacementDrive, PlacementException, CandidateMatch
from app.models.schemas import SkillGapItem, DepartmentReadiness
from app.agents.analytics_agent import analytics_agent

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Insights"])

@router.get("/skill_gaps", response_model=List[SkillGapItem])
def get_skill_gap_matrix(db: Session = Depends(get_db)):
    """
    Computes industry market demand vs student proficiency across technical skills.
    """
    return analytics_agent.compute_skill_gap_matrix(db)

@router.get("/department_readiness", response_model=List[DepartmentReadiness])
def get_department_readiness(db: Session = Depends(get_db)):
    """
    Computes department-wise placement rates and readiness scores.
    """
    return analytics_agent.compute_department_readiness(db)

@router.get("/kpis")
def get_command_center_kpis(db: Session = Depends(get_db)):
    total_students = db.query(Student).count()
    placed_students = db.query(Student).filter(Student.placement_status != "UNPLACED").count()
    active_drives = db.query(PlacementDrive).filter(PlacementDrive.is_active == True).count()
    open_exceptions = db.query(PlacementException).filter(PlacementException.status == "OPEN").count()
    
    # Calculate Average CTC for placed students
    placed_records = db.query(Student).filter(Student.current_package_lpa != None).all()
    avg_ctc = (
        round(sum([s.current_package_lpa for s in placed_records]) / len(placed_records), 2)
        if placed_records else 12.4
    )

    # Pending approvals
    pending_drives = db.query(PlacementDrive).filter(
        PlacementDrive.stage.in_(["JD_PARSED", "SHORTLIST_PROPOSED", "SCHEDULED"])
    ).count()

    return {
        "total_students": total_students,
        "placed_students_count": placed_students,
        "placement_percentage": round((placed_students / max(1, total_students)) * 100, 1),
        "active_drives_count": active_drives,
        "pending_tpo_approvals": pending_drives,
        "open_exceptions_count": open_exceptions,
        "average_ctc_lpa": avg_ctc,
        "highest_ctc_lpa": 28.0,
        "tier_distribution": {
            "DREAM": db.query(PlacementDrive).filter(PlacementDrive.tier == "DREAM").count(),
            "TIER_1": db.query(PlacementDrive).filter(PlacementDrive.tier == "TIER_1").count(),
            "TIER_2": db.query(PlacementDrive).filter(PlacementDrive.tier == "TIER_2").count()
        }
    }
