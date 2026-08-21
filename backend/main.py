from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import datetime
import uuid
import io
from pydantic import BaseModel

from backend.database import get_db
from backend.models import Student, Drive, EligibilityResult, MatchScore, Interview, ExceptionItem, Notification, AuditLog
from backend.agents.context_router import ContextRouter, ContextObject
from backend.agents.jd_intake_agent import JDIntakeAgent
from backend.agents.eligibility_agent import EligibilityAgent
from backend.agents.matching_agent import MatchingAgent
from backend.agents.scheduling_agent import SchedulingAgent
from backend.agents.coordination_agent import CoordinationAgent
from backend.agents.notification_agent import NotificationAgent
from backend.agents.exception_agent import ExceptionAgent
from backend.agents.analytics_agent import AnalyticsAgent
from backend.agents.reporting_agent import ReportingAgent

app = FastAPI(title="Placement Ops - AI Recruiter Agent Backend")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Placement Ops Core Multi-Agent API is running."}

# ==========================================
# STUDENTS ENDPOINTS
# ==========================================
@app.get("/students")
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).order_by(Student.name).all()

@app.get("/students/{id}")
def get_student_details(id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ==========================================
# DRIVES (JD INTAKE) ENDPOINTS
# ==========================================
@app.get("/drives")
def get_drives(db: Session = Depends(get_db)):
    return db.query(Drive).order_by(Drive.created_at.desc()).all()

@app.get("/drives/{id}")
def get_drive(id: int, db: Session = Depends(get_db)):
    drive = db.query(Drive).filter(Drive.id == id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    return drive

class CreateDriveRequest(BaseModel):
    company_name: str
    jd_raw_text: str

class JDRequest(BaseModel):
    company_name: str
    jd_raw_text: str

@app.post("/drives")
def create_drive(req: JDRequest, db: Session = Depends(get_db)):
    # 1. Start intake session
    session_id = str(uuid.uuid4())
    task_id = str(uuid.uuid4())
    
    # Run JDIntakeAgent to parse raw text
    parsed = JDIntakeAgent.parse_jd(req.jd_raw_text)
    
    # Save parsed draft into Drive
    drive = Drive(
        company_name=req.company_name or parsed.get("company_name", "Unknown"),
        role_title=parsed.get("role_title"),
        jd_raw_text=req.jd_raw_text,
        required_skills=parsed.get("required_skills"),
        cgpa_cutoff=parsed.get("cgpa_cutoff"),
        eligible_branches=parsed.get("eligible_branches"),
        package_min=parsed.get("package_min"),
        package_max=parsed.get("package_max"),
        headcount=parsed.get("headcount"),
        status="draft",
        stage="intake"
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)
    
    # Return draft drive + explanations for review
    return {
        "drive": drive,
        "session_id": session_id,
        "task_id": task_id,
        "explanations": parsed.get("explanations")
    }

class ConfirmDriveRequest(BaseModel):
    company_name: str
    role_title: str
    cgpa_cutoff: float
    eligible_branches: List[str]
    package_min: float
    package_max: float
    headcount: int
    required_skills: Dict[str, List[str]]

@app.patch("/drives/{id}/confirm")
def confirm_drive(id: int, req: ConfirmDriveRequest, db: Session = Depends(get_db)):
    drive = db.query(Drive).filter(Drive.id == id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    # Apply human-approved/modified fields
    drive.company_name = req.company_name
    drive.role_title = req.role_title
    drive.cgpa_cutoff = req.cgpa_cutoff
    drive.eligible_branches = req.eligible_branches
    drive.package_min = req.package_min
    drive.package_max = req.package_max
    drive.headcount = req.headcount
    drive.required_skills = req.required_skills
    drive.status = "published"
    
    db.commit()
    
    # Trigger EligibilityAgent in background via context object router
    context = ContextObject(
        drive_id=drive.id,
        task_id=str(uuid.uuid4()),
        session_id=str(uuid.uuid4()),
        payload={},
        routing=["EligibilityAgent"]
    )
    
    updated_context = ContextRouter.execute_next(context, db)
    
    # Log Audit
    audit = AuditLog(
        action="confirm_jd",
        target_type="drive",
        target_id=drive.id,
        performed_by="TPO",
        details=f"TPO confirmed JD extraction parameters. Drive status is now Published."
    )
    db.add(audit)
    db.commit()
    
    return {
        "drive": drive,
        "context_payload": updated_context.payload
    }

# ==========================================
# ELIGIBILITY ENDPOINTS
# ==========================================
@app.get("/drives/{id}/eligibility")
def get_drive_eligibility(id: int, db: Session = Depends(get_db)):
    results = db.query(EligibilityResult).filter(EligibilityResult.drive_id == id).all()
    
    output = []
    for r in results:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        if student:
            output.append({
                "eligibility_id": r.id,
                "student_id": student.id,
                "student_name": student.name,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "backlog_count": student.backlog_count,
                "current_best_offer": student.current_best_offer,
                "eligible": r.eligible,
                "reason": r.reason,
                "overridden_by_tpo": r.overridden_by_tpo,
                "flagged_for_review": r.flagged_for_review
            })
            
    return output

class OverrideEligibilityRequest(BaseModel):
    eligible: bool
    reason: str
    tpo_name: str = "TPO"

@app.patch("/eligibility/{id}/override")
def override_eligibility(id: int, req: OverrideEligibilityRequest, db: Session = Depends(get_db)):
    result = db.query(EligibilityResult).filter(EligibilityResult.id == id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Eligibility record not found")
        
    student = db.query(Student).filter(Student.id == result.student_id).first()
    drive = db.query(Drive).filter(Drive.id == result.drive_id).first()
    
    old_status = result.eligible
    result.eligible = req.eligible
    result.overridden_by_tpo = True
    result.reason = f"[TPO Override] {req.reason} (Originally: {result.reason})"
    
    # Audit log
    audit = AuditLog(
        action="eligibility_override",
        target_type="eligibility",
        target_id=id,
        performed_by=req.tpo_name,
        details=f"Overrode eligibility for student '{student.name if student else 'ID '+str(result.student_id)}' in drive '{drive.company_name if drive else 'ID '+str(result.drive_id)}'. Changed from {old_status} to {req.eligible}."
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Eligibility override applied successfully", "result": result}

# ==========================================
# SHORTLIST / MATCHING ENDPOINTS
# ==========================================
@app.get("/drives/{id}/shortlist")
def get_drive_shortlist(id: int, db: Session = Depends(get_db)):
    # If shortlist doesn't exist, we run matching agent.
    # Note: Shortlist is calculated based on eligible candidates.
    scores = db.query(MatchScore).filter(MatchScore.drive_id == id).order_by(MatchScore.rank).all()
    
    if not scores:
        # Run matching
        MatchingAgent.match_and_rank_students(id, db)
        scores = db.query(MatchScore).filter(MatchScore.drive_id == id).order_by(MatchScore.rank).all()

    output = []
    for s in scores:
        student = db.query(Student).filter(Student.id == s.student_id).first()
        if student:
            output.append({
                "match_id": s.id,
                "student_id": student.id,
                "student_name": student.name,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "overall_score": s.overall_score,
                "skill_score": s.skill_score,
                "academic_score": s.academic_score,
                "project_score": s.project_score,
                "readiness_score": s.readiness_score,
                "feature_importance": s.feature_importance,
                "rank": s.rank,
                "approved": s.approved
            })
    return output

class ApproveShortlistRequest(BaseModel):
    approved_candidate_ids: List[int] # List of Student IDs approved
    tpo_name: str = "TPO"

@app.patch("/drives/{id}/shortlist/approve")
def approve_shortlist(id: int, req: ApproveShortlistRequest, db: Session = Depends(get_db)):
    drive = db.query(Drive).filter(Drive.id == id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    # Reset all approved flags for this drive
    db.query(MatchScore).filter(MatchScore.drive_id == id).update({"approved": False})
    
    # Set approved flags for selected
    db.query(MatchScore).filter(
        MatchScore.drive_id == id,
        MatchScore.student_id.in_(req.approved_candidate_ids)
    ).update({"approved": True})
    
    drive.stage = "scheduling"
    db.commit()
    
    # Audit log
    audit = AuditLog(
        action="approve_shortlist",
        target_type="shortlist",
        target_id=id,
        performed_by=req.tpo_name,
        details=f"TPO approved shortlist of {len(req.approved_candidate_ids)} candidates: {req.approved_candidate_ids}."
    )
    db.add(audit)
    db.commit()
    
    return {"message": f"Shortlist of {len(req.approved_candidate_ids)} candidates approved and ready for scheduling."}

# ==========================================
# SCHEDULING & COORDINATION ENDPOINTS
# ==========================================
class ProposeScheduleRequest(BaseModel):
    panel_members: List[str]
    available_slots: List[str]
    rooms: List[str]

@app.post("/drives/{id}/schedule/propose")
def propose_schedule(id: int, req: ProposeScheduleRequest, db: Session = Depends(get_db)):
    proposed = SchedulingAgent.propose_schedule(
        id, req.panel_members, req.available_slots, req.rooms, db
    )
    
    # Perform coordination validation check immediately
    CoordinationAgent.validate_all_interviews(db)
    
    return proposed

@app.get("/drives/{id}/interviews")
def get_drive_interviews(id: int, db: Session = Depends(get_db)):
    interviews = db.query(Interview).filter(Interview.drive_id == id).all()
    output = []
    for intr in interviews:
        student = db.query(Student).filter(Student.id == intr.student_id).first()
        output.append({
            "interview_id": intr.id,
            "student_id": intr.student_id,
            "student_name": student.name if student else "Unknown",
            "panel_members": intr.panel_members,
            "room_or_link": intr.room_or_link,
            "time_slot": intr.time_slot,
            "status": intr.status,
            "conflict_flag": intr.conflict_flag
        })
    return output

class ConfirmScheduleRequest(BaseModel):
    tpo_name: str = "TPO"

@app.patch("/schedule/{id}/confirm")
def confirm_schedule(id: int, req: ConfirmScheduleRequest, db: Session = Depends(get_db)):
    # 'id' is drive_id
    drive = db.query(Drive).filter(Drive.id == id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    drive.stage = "coordination"
    db.commit()
    
    # Run Coordination check
    CoordinationAgent.validate_all_interviews(db)
    
    # Trigger notifications if no conflicts
    conflicts = db.query(Interview).filter(
        Interview.drive_id == id,
        Interview.conflict_flag == True
    ).count()
    
    audit = AuditLog(
        action="confirm_schedule",
        target_type="schedule",
        target_id=id,
        performed_by=req.tpo_name,
        details=f"TPO confirmed proposed schedule for drive ID {id}. Checked coordination anomalies: {conflicts} conflicts remaining."
    )
    db.add(audit)
    db.commit()
    
    if conflicts == 0:
        # Move drive stage to notified and send notifications
        context = ContextObject(
            drive_id=id,
            task_id=str(uuid.uuid4()),
            session_id=str(uuid.uuid4()),
            payload={},
            routing=["NotificationAgent"]
        )
        ContextRouter.execute_next(context, db)
        return {"message": "Schedule confirmed and notifications dispatched successfully. Stage set to notified."}
    else:
        return {"message": f"Schedule locked. However, {conflicts} coordination conflicts remain. Please resolve in the exceptions screen before dispatching.", "conflicts_found": True}

class ResolveInterviewRequest(BaseModel):
    time_slot: str
    room_or_link: str
    panel_members: List[str]
    tpo_name: str = "TPO"

@app.patch("/interviews/{id}/resolve")
def resolve_interview(id: int, req: ResolveInterviewRequest, db: Session = Depends(get_db)):
    res = CoordinationAgent.resolve_conflict(
        id, req.time_slot, req.room_or_link, req.panel_members, db, req.tpo_name
    )
    if not res:
        raise HTTPException(status_code=404, detail="Interview not found")
    return {"message": "Interview slot resolved and updated successfully."}

# ==========================================
# EXCEPTIONS ENDPOINTS
# ==========================================
@app.get("/exceptions")
def get_exceptions(db: Session = Depends(get_db)):
    exceptions = db.query(ExceptionItem).order_by(ExceptionItem.resolved, ExceptionItem.severity.desc()).all()
    output = []
    for exc in exceptions:
        drive = db.query(Drive).filter(Drive.id == exc.drive_id).first()
        output.append({
            "exception_id": exc.id,
            "drive_id": exc.drive_id,
            "company_name": drive.company_name if drive else "System Wide",
            "type": exc.type,
            "severity": exc.severity,
            "description": exc.description,
            "resolved": exc.resolved,
            "resolved_by": exc.resolved_by,
            "resolved_at": exc.resolved_at
        })
    return output

class ResolveExceptionRequest(BaseModel):
    resolved_by: str = "TPO"

@app.patch("/exceptions/{id}/resolve")
def resolve_exception(id: int, req: ResolveExceptionRequest, db: Session = Depends(get_db)):
    res = ExceptionAgent.resolve_exception(id, req.resolved_by, db)
    if not res:
        raise HTTPException(status_code=404, detail="Exception item not found")
    return {"message": "Exception marked as resolved."}

# ==========================================
# ANALYTICS ENDPOINTS
# ==========================================
@app.get("/analytics/skill-gap")
def get_skill_gap(db: Session = Depends(get_db)):
    return AnalyticsAgent.get_skill_gap_analysis(db)

@app.get("/analytics/readiness-trend")
def get_readiness_trend(db: Session = Depends(get_db)):
    return AnalyticsAgent.get_readiness_trends(db)

# ==========================================
# REPORTS ENDPOINTS
# ==========================================
@app.get("/reports/{drive_id}")
def get_drive_report(drive_id: int, db: Session = Depends(get_db)):
    # To support completed reports, let's mark the drive stage as completed if it was in notified stage
    drive = db.query(Drive).filter(Drive.id == drive_id).first()
    if drive and drive.stage in ["notified", "coordination", "scheduling"]:
        # Simulate drive completion
        drive.stage = "completed"
        drive.status = "closed"
        db.commit()

        # Update some interview statuses to 'completed' and 'no_show' for realistic stats
        interviews = db.query(Interview).filter(Interview.drive_id == drive_id).all()
        for idx, intr in enumerate(interviews):
            if idx % 5 == 0:
                intr.status = "no_show"
            else:
                intr.status = "completed"
        db.commit()

    return ReportingAgent.generate_drive_report(drive_id, db)

@app.get("/reports/{drive_id}/csv")
def get_drive_report_csv(drive_id: int, db: Session = Depends(get_db)):
    csv_str = ReportingAgent.export_report_csv(drive_id, db)
    drive = db.query(Drive).filter(Drive.id == drive_id).first()
    filename = f"{drive.company_name.lower().replace(' ', '_')}_placement_report.csv" if drive else "report.csv"
    
    return StreamingResponse(
        io.BytesIO(csv_str.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ==========================================
# AUDIT LOGS ENDPOINTS
# ==========================================
@app.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

# ==========================================
# NOTIFICATIONS FEED ENDPOINT
# ==========================================
@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notifications = db.query(Notification).order_by(Notification.sent_at.desc()).all()
    output = []
    for n in notifications:
        student = db.query(Student).filter(Student.id == n.recipient_id).first()
        output.append({
            "notification_id": n.id,
            "drive_id": n.drive_id,
            "recipient_name": student.name if student else "Panelist",
            "recipient_type": n.recipient_type,
            "channel": n.channel,
            "message_template": n.message_template,
            "sent_at": n.sent_at,
            "delivery_status": n.delivery_status
        })
    return output
