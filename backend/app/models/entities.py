import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    branch = Column(String(50), index=True, nullable=False)  # CSE, ECE, MECH, EEE, IT, etc.
    batch = Column(Integer, nullable=False, default=2026)
    cgpa = Column(Float, nullable=False, index=True)
    tenth_percentage = Column(Float, nullable=True)
    twelfth_percentage = Column(Float, nullable=True)
    active_backlogs = Column(Integer, default=0)
    history_backlogs = Column(Integer, default=0)
    
    # Placement Status: UNPLACED, PLACED_TIER_2, PLACED_TIER_1, PLACED_DREAM
    placement_status = Column(String(50), default="UNPLACED", index=True)
    current_company = Column(String(150), nullable=True)
    current_package_lpa = Column(Float, nullable=True)
    
    # AI & Profile Attributes
    skills = Column(JSON, default=list)  # [{"name": "Python", "level": "Expert"}, ...]
    projects = Column(JSON, default=list)  # [{"title": "...", "tech_stack": [...], "description": "..."}]
    certifications = Column(JSON, default=list)  # [{"title": "AWS Cloud Practitioner", "issuer": "AWS"}]
    placement_readiness_score = Column(Float, default=70.0)  # 0 to 100
    mock_interview_rating = Column(Float, default=7.5)  # 0 to 10
    resume_summary = Column(Text, nullable=True)
    profile_embedding = Column(JSON, nullable=True)  # Vector representation
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    eligibilities = relationship("StudentEligibility", back_populates="student", cascade="all, delete-orphan")
    matches = relationship("CandidateMatch", back_populates="student", cascade="all, delete-orphan")
    schedules = relationship("InterviewSchedule", back_populates="student", cascade="all, delete-orphan")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    industry = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)
    tier = Column(String(50), default="TIER_1")  # DREAM, TIER_1, TIER_2
    contact_person = Column(String(150), nullable=True)
    contact_email = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    drives = relationship("PlacementDrive", back_populates="company", cascade="all, delete-orphan")


class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True)
    drive_code = Column(String(50), unique=True, index=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role_title = Column(String(150), nullable=False)
    job_description_raw = Column(Text, nullable=True)
    
    # Financials & Openings
    ctc_lpa = Column(Float, nullable=False, default=10.0)
    base_salary_lpa = Column(Float, nullable=True)
    openings = Column(Integer, default=5)
    job_location = Column(String(150), default="Bangalore / Remote")
    tier = Column(String(50), default="TIER_1")

    # Eligibility Criteria
    min_cgpa = Column(Float, default=7.0)
    min_tenth_pct = Column(Float, default=60.0)
    min_twelfth_pct = Column(Float, default=60.0)
    allowed_branches = Column(JSON, default=list)  # ["CSE", "IT", "ECE"]
    max_active_backlogs = Column(Integer, default=0)
    allow_history_backlogs = Column(Boolean, default=True)
    allowed_upgrade_from = Column(JSON, default=list)  # ["UNPLACED", "TIER_2"]

    # Skill Requirements
    required_skills = Column(JSON, default=list)  # ["Python", "FastAPI", "PostgreSQL", "Data Structures"]
    preferred_skills = Column(JSON, default=list)  # ["Docker", "Kubernetes", "Redis", "AWS"]
    
    # Interview Rounds Configuration
    rounds_config = Column(JSON, default=list)  # [{"round_num": 1, "name": "Online Assessment", "type": "TEST"}, ...]
    drive_date = Column(String(50), nullable=True)
    
    # Pipeline Lifecycle Stage
    # STAGES: DRAFT, JD_PARSED, ELIGIBILITY_PROCESSED, SHORTLIST_PROPOSED, SHORTLIST_APPROVED, SCHEDULED, IN_PROGRESS, COMPLETED, ARCHIVED
    stage = Column(String(50), default="DRAFT", index=True)
    is_active = Column(Boolean, default=True)
    
    # Agent Extraction Telemetry & HITL State
    jd_extraction_confidence = Column(Float, default=0.95)
    jd_extracted_data = Column(JSON, default=dict)
    tpo_approved_jd = Column(Boolean, default=False)
    tpo_approved_eligibility = Column(Boolean, default=False)
    tpo_approved_shortlist = Column(Boolean, default=False)
    tpo_approved_schedule = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="drives")
    eligibilities = relationship("StudentEligibility", back_populates="drive", cascade="all, delete-orphan")
    matches = relationship("CandidateMatch", back_populates="drive", cascade="all, delete-orphan")
    schedules = relationship("InterviewSchedule", back_populates="drive", cascade="all, delete-orphan")
    exceptions = relationship("PlacementException", back_populates="drive", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="drive", cascade="all, delete-orphan")


class StudentEligibility(Base):
    __tablename__ = "student_eligibility"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    
    is_eligible = Column(Boolean, default=False, index=True)
    reason_breakdown = Column(JSON, default=dict)  # {"cgpa_check": {"pass": true, "student": 8.5, "required": 7.0}, ...}
    exclusion_reasons = Column(JSON, default=list)  # ["CGPA below cutoff", "Active backlog detected"]
    
    # HITL Override
    is_overridden = Column(Boolean, default=False)
    override_reason = Column(String(255), nullable=True)
    overridden_by = Column(String(100), nullable=True)
    overridden_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    drive = relationship("PlacementDrive", back_populates="eligibilities")
    student = relationship("Student", back_populates="eligibilities")


class CandidateMatch(Base):
    __tablename__ = "candidate_matches"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    
    overall_score = Column(Float, nullable=False)  # 0 to 100
    rank = Column(Integer, nullable=True)
    
    # Multi-factor score breakdown
    skill_score = Column(Float, default=0.0)      # 40% weight
    academic_score = Column(Float, default=0.0)   # 20% weight
    project_score = Column(Float, default=0.0)    # 25% weight
    readiness_score = Column(Float, default=0.0)  # 15% weight
    semantic_similarity = Column(Float, default=0.0)
    
    # Explainability Data
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    strength_highlights = Column(JSON, default=list)
    risk_flags = Column(JSON, default=list)
    ai_recommendation_summary = Column(Text, nullable=True)
    
    # TPO Shortlist Decision: RECOMMENDED, APPROVED, WAITLISTED, REJECTED
    tpo_status = Column(String(50), default="RECOMMENDED", index=True)
    tpo_notes = Column(String(255), nullable=True)
    is_shortlisted = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    drive = relationship("PlacementDrive", back_populates="matches")
    student = relationship("Student", back_populates="matches")


class InterviewPanel(Base):
    __tablename__ = "interview_panels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    role_designation = Column(String(100), default="Senior Tech Lead")
    company_name = Column(String(150), nullable=True)
    domain_expertise = Column(JSON, default=list)  # ["Backend", "Distributed Systems", "AI/ML"]
    max_slots_per_day = Column(Integer, default=8)
    is_available = Column(Boolean, default=True)
    contact_number = Column(String(30), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    schedules = relationship("InterviewSchedule", back_populates="panel")


class VenueRoom(Base):
    __tablename__ = "venue_rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, index=True, nullable=False)
    building_block = Column(String(100), default="Placement Central Block")
    room_type = Column(String(50), default="OFFLINE_CABIN")  # OFFLINE_CABIN, LAB, SEMINAR_HALL, VIRTUAL_MEET
    capacity = Column(Integer, default=2)
    equipment = Column(JSON, default=list)  # ["VC_SETUP", "WHITEBOARD", "HIGH_SPEED_LAN", "PROJECTOR"]
    is_active = Column(Boolean, default=True)
    virtual_link_template = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    schedules = relationship("InterviewSchedule", back_populates="room")


class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    panel_id = Column(Integer, ForeignKey("interview_panels.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("venue_rooms.id"), nullable=True)
    
    round_number = Column(Integer, default=1)
    round_name = Column(String(100), default="Technical Round 1")
    
    start_time = Column(String(50), nullable=False)  # "2026-08-22 09:30 AM"
    end_time = Column(String(50), nullable=False)    # "2026-08-22 10:15 AM"
    time_slot_iso = Column(DateTime, nullable=True)
    
    # Status: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, NO_SHOW, RESCHEDULED, CANCELLED
    status = Column(String(50), default="SCHEDULED", index=True)
    meeting_link = Column(String(255), nullable=True)
    
    # Outcome: PENDING, SELECTED, REJECTED, ON_HOLD
    result = Column(String(50), default="PENDING")
    interviewer_rating = Column(Float, nullable=True)
    feedback_notes = Column(Text, nullable=True)
    
    is_conflict = Column(Boolean, default=False)
    conflict_details = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    drive = relationship("PlacementDrive", back_populates="schedules")
    student = relationship("Student", back_populates="schedules")
    panel = relationship("InterviewPanel", back_populates="schedules")
    room = relationship("VenueRoom", back_populates="schedules")


class PlacementException(Base):
    __tablename__ = "placement_exceptions"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=True, index=True)
    
    # Category: SCHEDULE_CONFLICT, ROOM_DOUBLE_BOOKING, PANEL_UNAVAILABLE, LOW_CONFIDENCE_MATCH, MISSING_DATA, NOTIFICATION_FAILURE, CANDIDATE_NO_SHOW
    category = Column(String(100), nullable=False, index=True)
    # Severity: LOW, MEDIUM, HIGH, CRITICAL
    severity = Column(String(50), default="MEDIUM", index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    affected_entities = Column(JSON, default=dict)  # {"student_id": 12, "room_id": 3, "slot": "09:30"}
    suggested_resolution = Column(Text, nullable=True)
    
    # Status: OPEN, RESOLVED, IGNORED
    status = Column(String(50), default="OPEN", index=True)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    drive = relationship("PlacementDrive", back_populates="exceptions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    actor_id = Column(String(100), default="TPO_ADMIN")
    actor_role = Column(String(50), default="TRAINING_AND_PLACEMENT_OFFICER")
    
    # Action: OVERRIDE_ELIGIBILITY, APPROVE_SHORTLIST, MODIFY_SHORTLIST, CONFIRM_SCHEDULE, RESOLVE_EXCEPTION, EDIT_JD, DISPATCH_NOTIFICATION, STAGE_TRANSITION
    action_type = Column(String(100), nullable=False, index=True)
    target_type = Column(String(100), nullable=False)  # "StudentEligibility", "CandidateMatch", "PlacementDrive", etc.
    target_id = Column(String(100), nullable=True)
    drive_id = Column(Integer, nullable=True)
    
    before_state = Column(JSON, default=dict)
    after_state = Column(JSON, default=dict)
    reason = Column(Text, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=True, index=True)
    recipient_type = Column(String(50), default="STUDENT")  # STUDENT, PANEL, TPO
    recipient_id = Column(String(100), nullable=False)
    recipient_name = Column(String(150), nullable=True)
    recipient_contact = Column(String(150), nullable=True)
    
    # Channel: PORTAL, EMAIL, SMS
    channel = Column(String(50), default="PORTAL")
    subject = Column(String(200), nullable=False)
    message_body = Column(Text, nullable=False)
    template_type = Column(String(100), default="ELIGIBILITY_ANNOUNCEMENT")
    
    # Status: PENDING_APPROVAL, APPROVED, SENT, FAILED
    status = Column(String(50), default="SENT", index=True)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    drive = relationship("PlacementDrive", back_populates="notifications")
