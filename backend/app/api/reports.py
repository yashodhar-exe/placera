from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import DriveReportResponse
from app.agents.reporting_agent import reporting_agent

router = APIRouter(prefix="/api/reports", tags=["Reporting Engine"])

@router.get("/drive/{drive_id}", response_model=DriveReportResponse)
def get_drive_report(drive_id: int, db: Session = Depends(get_db)):
    """
    Generates placement drive funnel analytics, yield rates, and conversion statistics.
    """
    report = reporting_agent.generate_drive_report(db, drive_id)
    return report
