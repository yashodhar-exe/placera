from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
import os
import shutil
import json
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy import delete
from pydantic import BaseModel
import contextlib
import logging

from app.database import get_db, engine, Base
from app.models import JobDrive, EligibilityResult, CandidateMatch, Interview, SystemException, Resume, AgentEvent, Offer, ReadinessPlan, User, Student, JobSkill, AuditLog, InterviewPanel
from app.agents.manager import PlacementManagerAgent
from app.auth import get_password_hash, verify_password, create_access_token

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

class SignupRequest(BaseModel):
    name: str | None = None
    email: str
    password: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class OfferRequest(BaseModel):
    student_id: int
    drive_id: int

class ReadinessRequest(BaseModel):
    student_id: int
    drive_id: int

async def record_event(
    db: AsyncSession,
    agent: str,
    event_type: str,
    message: str,
    details: dict | None = None,
    related_entity: str | None = None,
    status: str = "SUCCESS",
):
    db.add(AgentEvent(
        agent=agent,
        event_type=event_type,
        message=message,
        details=json.dumps(details or {}),
        related_entity=related_entity,
        status=status,
    ))

async def record_audit(
    db: AsyncSession,
    action: str,
    entity: str,
    entity_id: int,
    details: dict | str | None = None,
):
    payload = details if isinstance(details, str) else json.dumps(details or {})
    db.add(AuditLog(action=action, entity=entity, entity_id=entity_id, details=payload))

@app.get("/api/drives")
async def get_drives(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(JobDrive).options(joinedload(JobDrive.company)).order_by(JobDrive.id.desc())
    )
    drives = result.scalars().all()
    return [{
        "id": d.id,
        "company_name": d.company.name if d.company else f"Company {d.company_id}",
        "role": d.role or "Unspecified Role",
        "status": d.status,
    } for d in drives]

@app.post("/api/drives")
async def create_drive(company_id: int, db: AsyncSession = Depends(get_db)):
    drive = JobDrive(company_id=company_id, status="DRAFT")
    db.add(drive)
    await record_event(db, "PlacementManagerAgent", "JOB_CREATED", f"Created draft drive for company {company_id}.", {"company_id": company_id})
    await db.commit()
    await db.refresh(drive)
    return drive

@app.post("/api/drives/{drive_id}/parse-jd")
async def parse_jd(drive_id: int, request: JDParseRequest, db: AsyncSession = Depends(get_db)):
    # Uses Gemini to parse
    parsed = manager.parse_job_description(request.jd_text)
    await record_event(db, "JDIntakeAgent", "JD_PARSED", f"Extracted requirements for drive {drive_id}.", parsed.model_dump(), f"job_drive:{drive_id}")
    await db.commit()
    return parsed

@app.post("/api/drives/{drive_id}/jd")
async def confirm_jd(drive_id: int, request: JDConfirmRequest, db: AsyncSession = Depends(get_db)):
    drive = await db.get(JobDrive, drive_id)
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    drive.role = request.role
    drive.description = getattr(request, "jd_text", None) or drive.description
    drive.cgpa_cutoff = request.cgpa_cutoff
    drive.allowed_branches = ",".join(request.allowed_branches) if request.allowed_branches else None
    drive.max_backlogs = request.max_backlogs
    drive.allow_prior_offers = request.allow_prior_offers
    drive.status = "JD_PARSED"

    await db.execute(delete(JobSkill).where(JobSkill.drive_id == drive_id))
    for skill in request.skills_mandatory:
        db.add(JobSkill(drive_id=drive_id, skill_name=skill.strip(), is_mandatory=True))
    for skill in request.skills_preferred:
        db.add(JobSkill(drive_id=drive_id, skill_name=skill.strip(), is_mandatory=False))

    await record_audit(db, "CONFIRM_JD", "job_drive", drive_id, request.model_dump())
    await record_event(db, "TPO", "TPO_APPROVED", f"Confirmed JD requirements for drive {drive_id}.", request.model_dump(), f"job_drive:{drive_id}")
    
    await db.commit()
    return {"status": "success", "drive": drive}

@app.get("/api/drives/{drive_id}/eligibility")
async def get_eligibility(drive_id: int, db: AsyncSession = Depends(get_db)):
    # Run eligibility agent
    count = await manager.run_eligibility(db, drive_id)
    await record_event(db, "EligibilityAgent", "ELIGIBILITY_COMPLETED", f"Evaluated eligibility for drive {drive_id}; {count} students eligible.", {"eligible_count": count}, f"job_drive:{drive_id}")
    await db.commit()
    
    # Fetch results
    result = await db.execute(select(EligibilityResult).where(EligibilityResult.drive_id == drive_id))
    return {"eligible_count": count, "results": result.scalars().all()}

@app.post("/api/drives/{drive_id}/run-matching")
async def run_matching(drive_id: int, db: AsyncSession = Depends(get_db)):
    await record_event(db, "MatchingAgent", "MATCHING_STARTED", f"Started matching for drive {drive_id}.", {"drive_id": drive_id}, f"job_drive:{drive_id}", "INFO")
    count = await manager.run_matching(db, drive_id)
    await record_event(db, "MatchingAgent", "MATCHING_COMPLETED", f"Generated {count} candidate recommendations for drive {drive_id}.", {"matched_count": count}, f"job_drive:{drive_id}")
    await db.commit()
    return {"matched_count": count}

@app.post("/api/drives/{drive_id}/matches")
async def run_and_get_matches(drive_id: int, db: AsyncSession = Depends(get_db)):
    # 1. Run the AI Matching engine
    count = await manager.run_matching(db, drive_id)
    await record_event(db, "MatchingAgent", "MATCHING_COMPLETED", f"Generated {count} candidate recommendations for drive {drive_id}.", {"matched_count": count}, f"job_drive:{drive_id}")
    await db.commit()
    # 2. Fetch the newly created match results
    result = await db.execute(select(CandidateMatch).where(CandidateMatch.drive_id == drive_id).order_by(CandidateMatch.match_score.desc()))
    return result.scalars().all()

@app.get("/api/drives/{drive_id}/matches")
async def get_matches(drive_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CandidateMatch)
        .where(CandidateMatch.drive_id == drive_id)
        .order_by(CandidateMatch.match_score.desc())
    )
    return result.scalars().all()

@app.post("/api/drives/{drive_id}/shortlist/approve")
async def approve_shortlist(drive_id: int, student_ids: list[int], db: AsyncSession = Depends(get_db)):
    for sid in student_ids:
        result = await db.execute(select(CandidateMatch).where(CandidateMatch.drive_id == drive_id, CandidateMatch.student_id == sid))
        match = result.scalars().first()
        if match:
            match.status = "APPROVED"
    await record_audit(db, "APPROVE_SHORTLIST", "job_drive", drive_id, {"student_ids": student_ids})
    await record_event(db, "TPO", "TPO_APPROVED", f"Approved {len(student_ids)} shortlisted candidates for drive {drive_id}.", {"student_ids": student_ids}, f"job_drive:{drive_id}")
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
        await record_audit(db, "APPROVE_RESOLUTION", "exception", exception_id, {"resolution_id": resolution_id})
        await db.commit()
        return {"status": "resolved"}
    return {"status": "failed"}

@app.post("/api/drives/{drive_id}/notifications/send")
async def send_notifications(drive_id: int, db: AsyncSession = Depends(get_db)):
    manager.send_update_notifications(drive_id, "Schedule has been finalized.")
    await record_event(db, "NotificationAgent", "NOTIFICATION_SENT", f"Sent mock schedule notifications for drive {drive_id}.", {"drive_id": drive_id}, f"job_drive:{drive_id}")
    await db.commit()
    return {"status": "sent"}

@app.get("/api/dashboard/summary")
async def dashboard_summary(db: AsyncSession = Depends(get_db)):
    async def count(model, where=None):
        stmt = select(model)
        if where is not None:
            stmt = stmt.where(where)
        return len((await db.execute(stmt)).scalars().all())

    return {
        "active_drives": await count(JobDrive, JobDrive.status != "COMPLETED"),
        "eligible_students": await count(EligibilityResult, EligibilityResult.is_eligible == True),
        "shortlisted_students": await count(CandidateMatch, CandidateMatch.status == "APPROVED"),
        "interviews": await count(Interview),
        "pending_tpo_actions": await count(CandidateMatch, CandidateMatch.status == "AI_RECOMMENDATION"),
        "active_conflicts": await count(SystemException, SystemException.status == "OPEN"),
        "offers_accepted": await count(Offer, Offer.status == "ACCEPTED"),
    }

@app.get("/api/audit-log")
async def get_audit_log(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()))
    return result.scalars().all()

# --- Auth Endpoints ---

@app.post("/api/auth/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing_user = await db.execute(select(User).where(User.email == req.email))
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    student_id = None
    if req.role == "student":
        existing_student = await db.execute(select(Student).where(Student.email == req.email))
        student = existing_student.scalars().first()
        if student:
            student_id = student.id
        else:
            new_student = Student(name=req.name or "New Student", email=req.email)
            db.add(new_student)
            await db.flush()
            student_id = new_student.id
            
    new_user = User(
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=req.role,
        student_id=student_id
    )
    db.add(new_user)
    await db.commit()
    
    token = create_access_token({"sub": req.email, "role": req.role, "student_id": student_id})
    return {"token": token, "role": req.role, "student_id": student_id, "name": req.name}

@app.post("/api/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    token = create_access_token({"sub": user.email, "role": user.role, "student_id": user.student_id})
    
    name = user.email
    if user.role == "student" and user.student_id:
        student_res = await db.execute(select(Student).where(Student.id == user.student_id))
        student = student_res.scalars().first()
        if student:
            name = student.name
            
    return {"token": token, "role": user.role, "student_id": user.student_id, "name": name}

# --- V1 Mock Endpoints ---

@app.post("/api/students/{student_id}/resume")
async def upload_resume(student_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if file.content_type not in {"application/pdf", "application/octet-stream"} and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Resume upload must be a PDF file")

    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{student_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        resume = await manager.parse_and_store_resume(db, student_id, file_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "status": "success", 
        "resume_id": resume.id,
        "parsed_data": json.loads(resume.structured_data) if resume.structured_data else {}
    }

@app.get("/api/students/{student_id}/resume")
async def get_student_resume(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resume).where(Resume.student_id == student_id).order_by(Resume.uploaded_at.desc()))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {
        "id": resume.id,
        "student_id": resume.student_id,
        "file_path": resume.file_path,
        "extracted_text": resume.extracted_text,
        "structured_data": json.loads(resume.structured_data) if resume.structured_data else {},
        "uploaded_at": resume.uploaded_at,
    }

@app.get("/api/students/{student_id}/matches")
async def get_student_matches(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CandidateMatch)
        .where(CandidateMatch.student_id == student_id)
        .order_by(CandidateMatch.match_score.desc())
    )
    return result.scalars().all()

@app.get("/api/students/{student_id}/offers")
async def get_student_offers(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Offer).where(Offer.student_id == student_id).order_by(Offer.offer_date.desc()))
    return result.scalars().all()

@app.get("/api/matching/{drive_id}/{student_id}/evidence")
async def get_match_evidence(drive_id: int, student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CandidateMatch)
        .where(CandidateMatch.drive_id == drive_id)
        .where(CandidateMatch.student_id == student_id)
    )
    match = result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {
        "student_id": student_id,
        "drive_id": drive_id,
        "match_score": match.match_score,
        "matched_skills": [s for s in (match.matched_skills or "").split(",") if s],
        "missing_skills": [s for s in (match.missing_skills or "").split(",") if s],
        "skill_evidence": json.loads(match.skill_evidence) if match.skill_evidence else {},
        "missing_skills_explanation": match.missing_skills_explanation,
        "explanation": match.explanation,
    }

@app.get("/api/agent-events")
async def get_agent_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentEvent).order_by(AgentEvent.timestamp.desc()))
    return result.scalars().all()

@app.get("/api/events")
async def get_events(db: AsyncSession = Depends(get_db)):
    return await get_agent_events(db)

@app.post("/api/exceptions/{exception_id}/negotiate")
async def negotiate_exception(exception_id: int, db: AsyncSession = Depends(get_db)):
    result = await manager.negotiate_conflict(db, exception_id)
    return result

@app.get("/api/students/{student_id}/readiness")
async def get_readiness_plan(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReadinessPlan).where(ReadinessPlan.student_id == student_id))
    return result.scalars().all()

@app.post("/api/readiness/generate")
async def generate_readiness(req: ReadinessRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CandidateMatch)
        .where(CandidateMatch.student_id == req.student_id)
        .where(CandidateMatch.drive_id == req.drive_id)
    )
    match = result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    plan = await manager.generate_readiness_plan(db, req.student_id, req.drive_id, match.match_score, match.missing_skills or "")
    await record_event(db, "ReadinessCoachAgent", "READINESS_PLAN_CREATED", f"Created readiness plan for student {req.student_id}.", {"student_id": req.student_id, "drive_id": req.drive_id}, f"student:{req.student_id}")
    await db.commit()
    return plan

@app.get("/api/readiness/{student_id}")
async def get_readiness_alias(student_id: int, db: AsyncSession = Depends(get_db)):
    return await get_readiness_plan(student_id, db)

@app.post("/api/offers")
async def create_offer(req: OfferRequest, db: AsyncSession = Depends(get_db)):
    offer = Offer(student_id=req.student_id, drive_id=req.drive_id, status="PENDING")
    db.add(offer)
    await record_event(db, "PlacementManagerAgent", "OFFER_RECEIVED", f"Recorded offer for student {req.student_id} on drive {req.drive_id}.", req.model_dump(), f"student:{req.student_id}")
    await db.commit()
    await db.refresh(offer)
    return offer

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
            
    await record_event(db, "PlacementManagerAgent", "OFFER_ACCEPTED", f"Student {offer.student_id} accepted offer for Drive {offer.drive_id}.", {"rematch_triggered_for_drives": list(rematch_drives)}, f"student:{offer.student_id}")
    
    await db.commit()
    
    for rematch_drive_id in rematch_drives:
        await manager.run_matching(db, rematch_drive_id)
        await record_event(db, "MatchingAgent", "REMATCH_TRIGGERED", f"Re-ranked drive {rematch_drive_id} after offer acceptance.", {"student_id": offer.student_id, "drive_id": rematch_drive_id}, f"job_drive:{rematch_drive_id}")
    await db.commit()
    
    return {"status": "success", "rematch_triggered_for_drives": list(rematch_drives)}

@app.patch("/api/offers/{offer_id}/accept")
async def accept_offer_patch(offer_id: int, db: AsyncSession = Depends(get_db)):
    return await accept_offer(offer_id, db)

@app.patch("/api/offers/{offer_id}/decline")
async def decline_offer(offer_id: int, db: AsyncSession = Depends(get_db)):
    offer = await db.get(Offer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    offer.status = "DECLINED"
    await record_event(db, "PlacementManagerAgent", "OFFER_DECLINED", f"Student {offer.student_id} declined offer {offer_id}.", {"offer_id": offer_id}, f"student:{offer.student_id}")
    await db.commit()
    return {"status": "success"}

@app.post("/api/demo/simulate-panel-conflict")
async def simulate_panel_conflict(drive_id: int | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Interview).where(Interview.status == "SCHEDULED")
    if drive_id:
        stmt = stmt.where(Interview.drive_id == drive_id)
    result = await db.execute(stmt)
    interview = result.scalars().first()
    if not interview or not interview.panel_id:
        raise HTTPException(status_code=404, detail="No scheduled interview with an assigned panel found")
    panel = await db.get(InterviewPanel, interview.panel_id)
    if not panel:
        raise HTTPException(status_code=404, detail="Panel not found")
    panel.status = "UNAVAILABLE"
    await record_event(db, "CoordinationAgent", "CONFLICT_DETECTED", f"Demo: marked {panel.name} unavailable.", {"panel_id": panel.id, "interview_id": interview.id}, f"interview:{interview.id}", "WARNING")
    await db.commit()
    return {"status": "success", "panel_id": panel.id, "interview_id": interview.id}
