import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    branch = Column(String, nullable=False)
    cgpa = Column(Float, nullable=False)
    tenth_pct = Column(Float, nullable=False)
    twelfth_pct = Column(Float, nullable=False)
    semester_marks = Column(JSON, default=dict)  # e.g., {"sem1": 8.5, "sem2": 9.0}
    backlog_count = Column(Integer, default=0)
    skills = Column(JSON, default=list)  # e.g., [{"skill": "Python", "level": "Advanced"}, ...]
    certifications = Column(JSON, default=list)  # e.g., [{"name": "AWS Certified Cloud Practitioner", "issuer": "Amazon"}]
    projects = Column(JSON, default=list)  # e.g., [{"title": "Placement Ops", "tech_stack": ["FastAPI", "React"]}]
    internship_history = Column(JSON, default=list)  # e.g., [{"company": "Google", "duration_months": 3}]
    current_best_offer = Column(Float, nullable=True)  # LPA of current best offer
    applied_drives = Column(JSON, default=list)  # list of drive IDs applied to
    
    # Derived scores
    api_score = Column(Float, default=0.0)  # Academic Performance Index
    ssi_score = Column(Float, default=0.0)  # Skill Strength Index
    prs_score = Column(Float, default=0.0)  # Placement Readiness Score

    eligibility_results = relationship("EligibilityResult", back_populates="student", cascade="all, delete-orphan")
    match_scores = relationship("MatchScore", back_populates="student", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="student", cascade="all, delete-orphan")


class Drive(Base):
    __tablename__ = "drives"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    role_title = Column(String, nullable=False)
    jd_raw_text = Column(Text, nullable=False)
    required_skills = Column(JSON, default=dict)  # e.g., {"required": ["Python", "SQL"], "preferred": ["FastAPI"]}
    cgpa_cutoff = Column(Float, default=0.0)
    eligible_branches = Column(JSON, default=list)  # e.g., ["CSE", "ECE", "ISE"]
    package_min = Column(Float, default=0.0)  # LPA min
    package_max = Column(Float, default=0.0)  # LPA max
    headcount = Column(Integer, default=0)
    status = Column(String, default="draft")  # draft, published, closed
    stage = Column(String, default="intake")  # intake, eligibility, matching, scheduling, coordination, notified, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    eligibility_results = relationship("EligibilityResult", back_populates="drive", cascade="all, delete-orphan")
    match_scores = relationship("MatchScore", back_populates="drive", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="drive", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="drive", cascade="all, delete-orphan")
    exceptions = relationship("ExceptionItem", back_populates="drive", cascade="all, delete-orphan")


class EligibilityResult(Base):
    __tablename__ = "eligibility_results"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    eligible = Column(Boolean, default=False)
    reason = Column(Text, nullable=True)
    overridden_by_tpo = Column(Boolean, default=False)
    flagged_for_review = Column(Boolean, default=False)

    drive = relationship("Drive", back_populates="eligibility_results")
    student = relationship("Student", back_populates="eligibility_results")


class MatchScore(Base):
    __tablename__ = "match_scores"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    overall_score = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    academic_score = Column(Float, default=0.0)
    project_score = Column(Float, default=0.0)
    readiness_score = Column(Float, default=0.0)
    feature_importance = Column(JSON, default=dict)  # SHAP-style breakdown
    rank = Column(Integer, nullable=True)
    approved = Column(Boolean, default=False)

    drive = relationship("Drive", back_populates="match_scores")
    student = relationship("Student", back_populates="match_scores")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    panel_members = Column(JSON, default=list)  # e.g., ["Dr. Prasad", "Mr. Amit"]
    room_or_link = Column(String, nullable=True)
    time_slot = Column(String, nullable=False)  # e.g., "2026-08-22 10:00 - 10:30"
    status = Column(String, default="scheduled")  # scheduled, completed, no_show, cancelled
    conflict_flag = Column(Boolean, default=False)

    drive = relationship("Drive", back_populates="interviews")
    student = relationship("Student", back_populates="interviews")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id"), nullable=True)
    recipient_type = Column(String, nullable=False)  # student, panel
    recipient_id = Column(Integer, nullable=False)  # Student ID or Panel identifier
    channel = Column(String, nullable=False)  # email, sms, portal
    message_template = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
    delivery_status = Column(String, default="sent")  # sent, delivered, failed

    drive = relationship("Drive", back_populates="notifications")


class ExceptionItem(Base):
    __tablename__ = "exception_items"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id"), nullable=True)
    type = Column(String, nullable=False)  # eligibility_edge_case, low_confidence_match, schedule_conflict, double_booking, missing_data
    severity = Column(String, nullable=False)  # low, medium, high
    description = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    drive = relationship("Drive", back_populates="exceptions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)  # e.g., "eligibility_override", "shortlist_approve"
    target_type = Column(String, nullable=False)  # e.g., "eligibility", "shortlist", "schedule", "exception"
    target_id = Column(Integer, nullable=False)
    performed_by = Column(String, default="TPO")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(Text, nullable=True)
