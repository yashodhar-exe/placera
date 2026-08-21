from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
import os
import shutil
import json
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import contextlib
import logging

from app.database import get_db, engine, Base
from app.models import JobDrive, EligibilityResult, CandidateMatch, Interview, SystemException, Resume, AgentEvent, Offer, ReadinessPlan
from app.agents.manager import PlacementManagerAgent

logging.basicConfig(level=logging.INFO)

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="AI Campus Placement Agent MVP", lifespan=lifespan)
manager = PlacementManagerAgent()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JDParseRequest(BaseModel):
    jd_text: str

class JDConfirmRequest(BaseModel):
    role: str
    skills_mandatory: list[str]
    skills_preferred: list[str]
    cgpa_cutoff: float | None
    allowed_branches: list[str] | None
    max_backlogs: int | None
    allow_prior_offers: bool

@app.post("/api/drives")
async def create_drive(company_id: int, db: AsyncSession = Depends(get_db)):
    drive = JobDrive(company_id=company_id, status="DRAFT")
    db.add(drive)
    await db.commit()
    await db.refresh(drive)
    return drive

@app.post("/api/drives/{drive_id}/parse-jd")
async def parse_jd(drive_id: int, request: JDParseRequest, db: AsyncSession = Depends(get_db)):
    # Uses Gemini to parse
    parsed = manager.parse_job_description(request.jd_text)
    return parsed

@app.post("/api/drives/{drive_id}/jd")
async def confirm_jd(drive_id: int, request: JDConfirmRequest, db: AsyncSession = Depends(get_db)):
    drive = await db.get(JobDrive, drive_id)
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    drive.role = request.role
    drive.cgpa_cutoff = request.cgpa_cutoff
    drive.allowed_branches = ",".join(request.allowed_branches) if request.allowed_branches else None
    drive.max_backlogs = request.max_backlogs
    drive.allow_prior_offers = request.allow_prior_offers
    drive.status = "JD_PARSED"
    
    # Normally we would save skills to JobSkill table here
    
    await db.commit()
    return {"status": "success", "drive": drive}

@app.get("/api/drives/{drive_id}/eligibility")
async def get_eligibility(drive_id: int, db: AsyncSession = Depends(get_db)):
    # Run eligibility agent
    count = await manager.run_eligibility(db, drive_id)
    
    # Fetch results
    result = await db.execute(select(EligibilityResult).where(EligibilityResult.drive_id == drive_id))
    return {"eligible_count": count, "results": result.scalars().all()}

@app.post("/api/drives/{drive_id}/run-matching")
async def run_matching(drive_id: int, db: AsyncSession = Depends(get_db)):
    count = await manager.run_matching(db, drive_id)
    return {"matched_count": count}

@app.get("/api/drives/{drive_id}/matches")
async def get_matches(drive_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CandidateMatch).where(CandidateMatch.drive_id == drive_id).order_by(CandidateMatch.match_score.desc()))
    return result.scalars().all()

@app.post("/api/drives/{drive_id}/shortlist/approve")
async def approve_shortlist(drive_id: int, student_ids: list[int], db: AsyncSession = Depends(get_db)):
    for sid in student_ids:
        result = await db.execute(select(CandidateMatch).where(CandidateMatch.drive_id == drive_id, CandidateMatch.student_id == sid))
        match = result.scalars().first()
        if match:
            match.status = "APPROVED"
    await db.commit()
    return {"status": "approved"}

@app.post("/api/drives/{drive_id}/schedule/generate")
async def generate_schedule(drive_id: int, db: AsyncSession = Depends(get_db)):
    slots, allocated = await manager.run_scheduling_and_coordination(db, drive_id)
    return {"slots_created": slots, "panels_allocated": allocated}

@app.get("/api/drives/{drive_id}/schedule")
async def get_schedule(drive_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Interview).where(Interview.drive_id == drive_id))
    return result.scalars().all()

@app.post("/api/exceptions/check")
async def check_exceptions(db: AsyncSession = Depends(get_db)):
    conflicts = await manager.check_and_replan_exceptions(db)
    return {"conflicts_found": conflicts}

@app.get("/api/exceptions")
async def get_exceptions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SystemException))
    return result.scalars().all()

@app.post("/api/exceptions/{exception_id}/resolve")
async def resolve_exception(exception_id: int, request: dict, db: AsyncSession = Depends(get_db)):
    resolution_id = request.get("resolution_id")
    if not resolution_id:
        raise HTTPException(status_code=400, detail="Missing resolution_id")
    success = await manager.apply_resolution(db, exception_id, resolution_id)
    if success:
        return {"status": "resolved"}
    return {"status": "failed"}

@app.post("/api/drives/{drive_id}/notifications/send")
async def send_notifications(drive_id: int):
    manager.send_update_notifications(drive_id, "Schedule has been finalized.")
    return {"status": "sent"}

# --- V2 Endpoints ---

@app.post("/api/students/{student_id}/resume")
async def upload_resume(student_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{student_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    resume = await manager.parse_and_store_resume(db, student_id, file_path)
    return {"status": "success", "resume_id": resume.id}

@app.get("/api/agent-events")
async def get_agent_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentEvent).order_by(AgentEvent.timestamp.desc()))
    return result.scalars().all()

@app.post("/api/exceptions/{exception_id}/negotiate")
async def negotiate_exception(exception_id: int, db: AsyncSession = Depends(get_db)):
    result = await manager.negotiate_conflict(db, exception_id)
    return result

@app.get("/api/students/{student_id}/readiness")
async def get_readiness_plan(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReadinessPlan).where(ReadinessPlan.student_id == student_id))
    return result.scalars().all()

@app.post("/api/offers/{offer_id}/accept")
async def accept_offer(offer_id: int, db: AsyncSession = Depends(get_db)):
    offer = await db.get(Offer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    offer.status = "ACCEPTED"
    
    # Dynamic Rematching Logic
    # 1. Mark student as having a prior offer
    student = await db.get(Student, offer.student_id)
    if student:
        student.has_prior_offer = True
        
    # 2. Find other active drives where this student is shortlisted or matched
    # and remove them, triggering a rematch/re-rank for those drives.
    result = await db.execute(select(CandidateMatch).where(CandidateMatch.student_id == offer.student_id))
    matches = result.scalars().all()
    
    rematch_drives = set()
    for match in matches:
        if match.drive_id != offer.drive_id:
            # Mark them as withdrawn/rejected for other drives
            match.status = "REJECTED"
            match.explanation = "Candidate accepted an offer elsewhere."
            rematch_drives.add(match.drive_id)
            
    # 3. Log event
    event = AgentEvent(
        agent="PlacementManagerAgent",
        event_type="OFFER_ACCEPTED",
        message=f"Student {offer.student_id} accepted offer for Drive {offer.drive_id}.",
        details=json.dumps({"rematch_triggered_for_drives": list(rematch_drives)})
    )
    db.add(event)
    
    await db.commit()
    
    # (In a full async system, we would trigger `manager.run_matching` for `rematch_drives` here in the background)
    
    return {"status": "success", "rematch_triggered_for_drives": list(rematch_drives)}
