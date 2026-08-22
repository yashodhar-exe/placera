import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Shared Placement Context Schema ---
class AgentExecutionContext(BaseModel):
    drive_id: Optional[int] = None
    task_id: str
    session_id: str
    caller_agent: str
    target_agent: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    routing_info: Dict[str, Any] = Field(default_factory=dict)
    requires_human_approval: bool = False
    is_approved: bool = False
    approved_by: Optional[str] = None
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

# --- Students ---
class StudentBase(BaseModel):
    roll_number: str
    name: str
    email: str
    phone: Optional[str] = None
    branch: str
    batch: int = 2026
    cgpa: float
    tenth_percentage: Optional[float] = None
    twelfth_percentage: Optional[float] = None
    active_backlogs: int = 0
    history_backlogs: int = 0
    placement_status: str = "UNPLACED"
    current_company: Optional[str] = None
    current_package_lpa: Optional[float] = None
    skills: List[Dict[str, Any]] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[Dict[str, Any]] = Field(default_factory=list)
    placement_readiness_score: float = 70.0
    mock_interview_rating: float = 7.5
    resume_summary: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Companies ---
class CompanyBase(BaseModel):
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    tier: str = "TIER_1"
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Placement Drives & JD Intake ---
class JDParseRequest(BaseModel):
    raw_text: Optional[str] = None
    company_name: Optional[str] = None
    role_title: Optional[str] = None

class JDIntakeEditRequest(BaseModel):
    company_name: str
    role_title: str
    ctc_lpa: float
    base_salary_lpa: Optional[float] = None
    openings: int = 5
    job_location: str = "Bangalore / Hybrid"
    tier: str = "TIER_1"
    min_cgpa: float = 7.0
    min_tenth_pct: float = 60.0
    min_twelfth_pct: float = 60.0
    allowed_branches: List[str] = Field(default_factory=lambda: ["CSE", "IT", "ECE"])
    max_active_backlogs: int = 0
    allow_history_backlogs: bool = True
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    rounds_config: List[Dict[str, Any]] = Field(default_factory=list)
    drive_date: Optional[str] = None
    tpo_confirm: bool = True
    tpo_notes: Optional[str] = None

class PlacementDriveResponse(BaseModel):
    id: int
    drive_code: str
    company_id: int
    company: Optional[CompanyResponse] = None
    role_title: str
    job_description_raw: Optional[str] = None
    ctc_lpa: float
    base_salary_lpa: Optional[float] = None
    openings: int
    job_location: str
    tier: str
    min_cgpa: float
    min_tenth_pct: float
    min_twelfth_pct: float
    allowed_branches: List[str]
    max_active_backlogs: int
    allow_history_backlogs: bool
    allowed_upgrade_from: List[str] = Field(default_factory=list)
    required_skills: List[str]
    preferred_skills: List[str]
    rounds_config: List[Dict[str, Any]]
    drive_date: Optional[str] = None
    stage: str
    is_active: bool
    jd_extraction_confidence: float
    jd_extracted_data: Dict[str, Any]
    tpo_approved_jd: bool
    tpo_approved_eligibility: bool
    tpo_approved_shortlist: bool
    tpo_approved_schedule: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Eligibility & Overrides ---
class EligibilityOverrideRequest(BaseModel):
    is_eligible: bool
    override_reason: str
    actor_id: str = "TPO_ADMIN"

class StudentEligibilityResponse(BaseModel):
    id: int
    drive_id: int
    student_id: int
    student: StudentResponse
    is_eligible: bool
    reason_breakdown: Dict[str, Any]
    exclusion_reasons: List[str]
    is_overridden: bool
    override_reason: Optional[str] = None
    overridden_by: Optional[str] = None
    overridden_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- Matching & Explainability ---
class CandidateMatchResponse(BaseModel):
    id: int
    drive_id: int
    student_id: int
    student: StudentResponse
    overall_score: float
    rank: Optional[int] = None
    skill_score: float
    academic_score: float
    project_score: float
    readiness_score: float
    semantic_similarity: float
    matched_skills: List[str]
    missing_skills: List[str]
    strength_highlights: List[str]
    risk_flags: List[str]
    ai_recommendation_summary: Optional[str] = None
    tpo_status: str
    tpo_notes: Optional[str] = None
    is_shortlisted: bool

    class Config:
        from_attributes = True

class ShortlistActionRequest(BaseModel):
    candidate_match_ids: List[int]
    action: str  # APPROVE, REJECT, WAITLIST, REMOVE
    actor_id: str = "TPO_ADMIN"
    notes: Optional[str] = None

# --- Panels, Rooms & Scheduling ---
class InterviewPanelResponse(BaseModel):
    id: int
    name: str
    email: str
    role_designation: str
    company_name: Optional[str] = None
    domain_expertise: List[str]
    max_slots_per_day: int
    is_available: bool
    contact_number: Optional[str] = None

    class Config:
        from_attributes = True

class VenueRoomResponse(BaseModel):
    id: int
    room_number: str
    building_block: str
    room_type: str
    capacity: int
    equipment: List[str]
    is_active: bool
    virtual_link_template: Optional[str] = None

    class Config:
        from_attributes = True

class InterviewScheduleResponse(BaseModel):
    id: int
    drive_id: int
    student_id: int
    student: Optional[StudentResponse] = None
    panel_id: Optional[int] = None
    panel: Optional[InterviewPanelResponse] = None
    room_id: Optional[int] = None
    room: Optional[VenueRoomResponse] = None
    round_number: int
    round_name: str
    start_time: str
    end_time: str
    status: str
    meeting_link: Optional[str] = None
    result: str
    interviewer_rating: Optional[float] = None
    feedback_notes: Optional[str] = None
    is_conflict: bool
    conflict_details: Optional[str] = None

    class Config:
        from_attributes = True

class GenerateScheduleRequest(BaseModel):
    round_number: int = 1
    round_name: str = "Technical Round 1"
    start_date: str = "2026-08-25"
    start_hour: int = 9  # 9 AM
    slot_duration_minutes: int = 45
    buffer_minutes: int = 15
    auto_resolve_conflicts: bool = True

class ResolveScheduleConflictRequest(BaseModel):
    schedule_id: int
    new_panel_id: Optional[int] = None
    new_room_id: Optional[int] = None
    new_start_time: Optional[str] = None
    new_end_time: Optional[str] = None
    actor_id: str = "TPO_ADMIN"
    resolution_notes: str

# --- Exceptions ---
class PlacementExceptionResponse(BaseModel):
    id: int
    drive_id: Optional[int] = None
    category: str
    severity: str
    title: str
    description: str
    affected_entities: Dict[str, Any]
    suggested_resolution: Optional[str] = None
    status: str
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ResolveExceptionRequest(BaseModel):
    resolution_notes: str
    action_taken: str = "APPLY_SUGGESTED_FIX"
    actor_id: str = "TPO_ADMIN"

# --- Notifications ---
class NotificationResponse(BaseModel):
    id: int
    drive_id: Optional[int] = None
    recipient_type: str
    recipient_id: str
    recipient_name: Optional[str] = None
    recipient_contact: Optional[str] = None
    channel: str
    subject: str
    message_body: str
    template_type: str
    status: str
    sent_at: datetime.datetime

    class Config:
        from_attributes = True

class BroadcastNotificationRequest(BaseModel):
    drive_id: int
    target_group: str  # ALL_ELIGIBLE, SHORTLISTED, SCHEDULED_CANDIDATES, PANELS
    channels: List[str] = Field(default_factory=lambda: ["PORTAL", "EMAIL"])
    template_type: str = "CUSTOM_BROADCAST"
    custom_subject: Optional[str] = None
    custom_message: Optional[str] = None
    actor_id: str = "TPO_ADMIN"

# --- Audit Logs ---
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    actor_id: str
    actor_role: str
    action_type: str
    target_type: str
    target_id: Optional[str] = None
    drive_id: Optional[int] = None
    before_state: Dict[str, Any]
    after_state: Dict[str, Any]
    reason: Optional[str] = None

    class Config:
        from_attributes = True

# --- Analytics & Reporting ---
class SkillGapItem(BaseModel):
    skill: str
    category: str
    industry_demand_pct: float
    student_proficiency_pct: float
    gap_pct: float
    severity: str  # CRITICAL, MODERATE, GOOD
    impacted_students_count: int
    recommended_action: str

class DepartmentReadiness(BaseModel):
    branch: str
    total_students: int
    eligible_avg_pct: float
    placed_pct: float
    avg_readiness_score: float
    top_missing_skills: List[str]

class DriveReportResponse(BaseModel):
    drive_id: int
    drive_code: str
    company_name: str
    role_title: str
    ctc_lpa: float
    total_applicants: int
    eligible_count: int
    shortlisted_count: int
    interviews_conducted: int
    offers_made: int
    no_show_count: int
    conversion_rate_pct: float
    eligibility_rate_pct: float
    department_breakdown: Dict[str, Any]
    skill_demand_breakdown: List[Dict[str, Any]]
    timeline_summary: List[Dict[str, Any]]
