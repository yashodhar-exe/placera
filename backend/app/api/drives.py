import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import PlacementDrive, Company
from app.models.schemas import (
    PlacementDriveResponse, JDParseRequest, JDIntakeEditRequest
)
from app.agents.jd_intake_agent import jd_intake_agent
from app.agents.context_router import context_router
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/drives", tags=["Placement Drives"])

@router.get("", response_model=List[PlacementDriveResponse])
def get_all_drives(stage: Optional[str] = None, is_active: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(PlacementDrive)
    if stage:
        query = query.filter(PlacementDrive.stage == stage)
    if is_active is not None:
        query = query.filter(PlacementDrive.is_active == is_active)
    return query.order_by(PlacementDrive.created_at.desc()).all()

@router.get("/{drive_id}", response_model=PlacementDriveResponse)
def get_drive_by_id(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    return drive

@router.post("/parse_jd")
def parse_job_description(request: JDParseRequest):
    """
    AI JD Intake Agent parses raw JD text and extracts structured requirements with field confidences.
    """
    extracted = jd_intake_agent.parse_job_description(
        raw_text=request.raw_text or "",
        default_company=request.company_name or "",
        default_role=request.role_title or ""
    )
    return extracted

@router.post("/upload_jd")
async def upload_job_description_file(
    file: UploadFile = File(...),
    company_name: Optional[str] = Form(None),
    role_title: Optional[str] = Form(None)
):
    """
    Accepts PDF or text JD files, extracts content, and runs AI JD Intake Agent.
    """
    contents = await file.read()
    if file.filename.lower().endswith('.pdf'):
        extracted_text = jd_intake_agent.extract_text_from_pdf(contents)
    else:
        extracted_text = contents.decode('utf-8', errors='ignore')

    parsed = jd_intake_agent.parse_job_description(
        raw_text=extracted_text,
        default_company=company_name or "",
        default_role=role_title or ""
    )
    parsed["raw_text"] = extracted_text
    parsed["filename"] = file.filename
    return parsed

@router.post("", response_model=PlacementDriveResponse)
def create_or_confirm_drive(data: JDIntakeEditRequest, db: Session = Depends(get_db)):
    """
    Creates a new placement drive after TPO reviews and confirms/edits the extracted JD.
    """
    comp = db.query(Company).filter(Company.name == data.company_name).first()
    if not comp:
        comp = Company(
            name=data.company_name,
            tier=data.tier,
            industry="Technology",
            website=f"https://{data.company_name.lower().replace(' ', '')}.com"
        )
        db.add(comp)
        db.flush()

    drive_code = f"DRV-{data.company_name[:4].upper()}-{uuid.uuid4().hex[:4].upper()}"
    
    drive = PlacementDrive(
        drive_code=drive_code,
        company_id=comp.id,
        role_title=data.role_title,
        ctc_lpa=data.ctc_lpa,
        base_salary_lpa=data.base_salary_lpa or round(data.ctc_lpa * 0.85, 2),
        openings=data.openings,
        job_location=data.job_location,
        tier=data.tier,
        min_cgpa=data.min_cgpa,
        min_tenth_pct=data.min_tenth_pct,
        min_twelfth_pct=data.min_twelfth_pct,
        allowed_branches=data.allowed_branches,
        max_active_backlogs=data.max_active_backlogs,
        allow_history_backlogs=data.allow_history_backlogs,
        required_skills=data.required_skills,
        preferred_skills=data.preferred_skills,
        rounds_config=data.rounds_config or [
            {"round_num": 1, "name": "Online Assessment", "type": "TEST", "duration_mins": 90},
            {"round_num": 2, "name": "Technical Interview 1", "type": "INTERVIEW", "duration_mins": 45}
        ],
        drive_date=data.drive_date or "2026-09-01",
        stage="JD_PARSED" if data.tpo_confirm else "DRAFT",
        tpo_approved_jd=data.tpo_confirm,
        jd_extraction_confidence=0.96,
        jd_extracted_data={"confirmed_by_tpo": data.tpo_confirm}
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)

    AuditService.log_action(
        db=db,
        action_type="CREATE_DRIVE_FROM_JD",
        target_type="PlacementDrive",
        target_id=str(drive.id),
        drive_id=drive.id,
        after_state={"stage": drive.stage, "ctc_lpa": drive.ctc_lpa, "role": drive.role_title},
        reason=data.tpo_notes or "TPO approved JD Intake parameters"
    )

    context_router.log_event(
        event_type="DRIVE_CREATED",
        drive_id=drive.id,
        agent_name="JDIntakeAgent",
        message=f"Created new Placement Drive {drive.drive_code} for {data.company_name} ({data.role_title})"
    )

    return drive

@router.put("/{drive_id}", response_model=PlacementDriveResponse)
def update_drive(drive_id: int, data: JDIntakeEditRequest, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    drive.role_title = data.role_title
    drive.ctc_lpa = data.ctc_lpa
    drive.base_salary_lpa = data.base_salary_lpa
    drive.openings = data.openings
    drive.job_location = data.job_location
    drive.tier = data.tier
    drive.min_cgpa = data.min_cgpa
    drive.min_tenth_pct = data.min_tenth_pct
    drive.min_twelfth_pct = data.min_twelfth_pct
    drive.allowed_branches = data.allowed_branches
    drive.max_active_backlogs = data.max_active_backlogs
    drive.allow_history_backlogs = data.allow_history_backlogs
    drive.required_skills = data.required_skills
    drive.preferred_skills = data.preferred_skills
    drive.rounds_config = data.rounds_config
    if data.drive_date:
        drive.drive_date = data.drive_date

    db.commit()
    db.refresh(drive)

    AuditService.log_action(
        db=db,
        action_type="EDIT_DRIVE_REQUIREMENTS",
        target_type="PlacementDrive",
        target_id=str(drive.id),
        drive_id=drive.id,
        after_state={"role": drive.role_title, "ctc_lpa": drive.ctc_lpa, "min_cgpa": drive.min_cgpa},
        reason=data.tpo_notes or "TPO updated drive parameters"
    )

    return drive

@router.post("/{drive_id}/advance_stage", response_model=PlacementDriveResponse)
def advance_stage(drive_id: int, target_stage: str = Body(..., embed=True), notes: Optional[str] = Body(None, embed=True), db: Session = Depends(get_db)):
    return context_router.advance_drive_stage(
        db=db,
        drive_id=drive_id,
        target_stage=target_stage,
        approval_notes=notes
    )
