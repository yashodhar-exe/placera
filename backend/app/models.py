from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    branch = Column(String)
    graduation_year = Column(Integer)
    cgpa = Column(Float)
    backlogs = Column(Integer, default=0)
    has_prior_offer = Column(Boolean, default=False)
    
    # Pre-computed scores for the MVP matching
    academic_score = Column(Float, default=0.0)
    readiness_score = Column(Float, default=0.0)

    skills = relationship("StudentSkill", back_populates="student")
    projects = relationship("Project", back_populates="student")
    eligibility_results = relationship("EligibilityResult", back_populates="student")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class StudentSkill(Base):
    __tablename__ = "student_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    proficiency = Column(Integer, default=3) # 1-5
    
    student = relationship("Student", back_populates="skills")
    skill = relationship("Skill")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    title = Column(String)
    description = Column(Text)
    domain_tags = Column(String) # Comma separated for MVP
    
    student = relationship("Student", back_populates="projects")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class JobDrive(Base):
    __tablename__ = "job_drives"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    role = Column(String)
    description = Column(Text) # Raw JD
    cgpa_cutoff = Column(Float, nullable=True)
    allowed_branches = Column(String, nullable=True) # Comma separated
    max_backlogs = Column(Integer, nullable=True)
    allow_prior_offers = Column(Boolean, default=False)
    
    status = Column(String, default="DRAFT") # DRAFT, JD_PARSED, ELIGIBILITY_DONE, MATCHING_DONE, SCHEDULED, COMPLETED
    
    company = relationship("Company")
    job_skills = relationship("JobSkill", back_populates="drive")

class JobSkill(Base):
    __tablename__ = "job_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("job_drives.id"))
    skill_name = Column(String)
    is_mandatory = Column(Boolean, default=False)
    
    drive = relationship("JobDrive", back_populates="job_skills")

class EligibilityResult(Base):
    __tablename__ = "eligibility_results"
    
    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("job_drives.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    is_eligible = Column(Boolean)
    reason = Column(Text)
    status = Column(String, default="PENDING_APPROVAL") # PENDING_APPROVAL, APPROVED, OVERRIDDEN
    
    student = relationship("Student", back_populates="eligibility_results")

class CandidateMatch(Base):
    __tablename__ = "candidate_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("job_drives.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    match_score = Column(Float)
    skill_score = Column(Float)
    academic_score = Column(Float)
    project_score = Column(Float)
    readiness_score = Column(Float)
    matched_skills = Column(String)
    missing_skills = Column(String)
    explanation = Column(Text)
    
    # V2 Additions for Evidence-Based Matching
    skill_evidence = Column(Text, nullable=True) # JSON string of skill -> evidence mapping
    missing_skills_explanation = Column(Text, nullable=True)
    
    status = Column(String, default="AI_RECOMMENDATION") # AI_RECOMMENDATION, APPROVED, MODIFIED_BY_TPO, REJECTED

    
class Venue(Base):
    __tablename__ = "venues"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    capacity = Column(Integer)
    is_virtual = Column(Boolean, default=False)

class InterviewPanel(Base):
    __tablename__ = "interview_panels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    drive_id = Column(Integer, ForeignKey("job_drives.id"))
    members = Column(String) # Comma separated
    status = Column(String, default="AVAILABLE") # AVAILABLE, UNAVAILABLE

class TimeSlot(Base):
    __tablename__ = "time_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("job_drives.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    panel_id = Column(Integer, ForeignKey("interview_panels.id"))
    venue_id = Column(Integer, ForeignKey("venues.id"))
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"))
    status = Column(String, default="SCHEDULED") # SCHEDULED, CONFLICT, EXCEPTION, COMPLETED
    
class SystemException(Base):
    __tablename__ = "exceptions"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String) # INTERVIEW, PANEL, etc.
    entity_id = Column(Integer)
    description = Column(Text)
    status = Column(String, default="OPEN") # OPEN, RESOLVED

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    entity = Column(String)
    entity_id = Column(Integer)
    details = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    file_path = Column(String)
    extracted_text = Column(Text)
    structured_data = Column(Text) # JSON string
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    student = relationship("Student")

class AgentEvent(Base):
    __tablename__ = "agent_events"
    
    id = Column(Integer, primary_key=True, index=True)
    agent = Column(String)
    event_type = Column(String)
    message = Column(Text)
    details = Column(Text, nullable=True) # JSON string
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    related_entity = Column(String, nullable=True)
    status = Column(String, default="INFO") # INFO, SUCCESS, WARNING, ERROR

class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    drive_id = Column(Integer, ForeignKey("job_drives.id"))
    status = Column(String, default="PENDING") # PENDING, ACCEPTED, DECLINED
    offer_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ReadinessPlan(Base):
    __tablename__ = "readiness_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    drive_id = Column(Integer, ForeignKey("job_drives.id"))
    readiness_score = Column(Float)
    skill_gaps = Column(Text) # Comma separated
    plan = Column(Text) # Detailed plan text/markdown
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
