import asyncio
import csv
import json
from datetime import datetime
from pathlib import Path

from app.auth import get_password_hash
from app.database import AsyncSessionLocal, Base, engine
from app.models import (
    AgentEvent,
    AuditLog,
    CandidateMatch,
    Company,
    EligibilityResult,
    Interview,
    InterviewPanel,
    JobDrive,
    JobSkill,
    Offer,
    Project,
    ReadinessPlan,
    Resume,
    Skill,
    Student,
    StudentSkill,
    SystemException,
    TimeSlot,
    User,
    Venue,
)

DATASET_DIR = Path(__file__).parent / "datasets"


def rows(name: str):
    with (DATASET_DIR / name).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def as_bool(value: str) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes", "active", "available"}


def as_dt(value: str):
    if not value:
        return None
    return datetime.fromisoformat(value)


def status(value: str, mapping: dict[str, str], default: str):
    return mapping.get(str(value).strip().lower(), default)


async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        db.add_all([
            Skill(id=int(r["id"]), name=r["name"])
            for r in rows("skills.csv")
        ])
        db.add_all([
            Student(
                id=int(r["id"]),
                name=r["name"],
                email=r["email"],
                branch=r["branch"],
                graduation_year=int(r["graduation_year"]),
                cgpa=float(r["cgpa"]),
                backlogs=int(r["backlogs"]),
                has_prior_offer=as_bool(r["has_prior_offer"]),
                academic_score=float(r["academic_score"]),
                readiness_score=float(r["readiness_score"]),
            )
            for r in rows("students.csv")
        ])
        db.add_all([
            Company(id=int(r["id"]), name=r["name"])
            for r in rows("companies.csv")
        ])
        await db.flush()

        db.add_all([
            StudentSkill(
                id=int(r["id"]),
                student_id=int(r["student_id"]),
                skill_id=int(r["skill_id"]),
                proficiency=int(r["proficiency"]),
            )
            for r in rows("student_skills.csv")
        ])
        db.add_all([
            Project(
                id=int(r["id"]),
                student_id=int(r["student_id"]),
                title=r["title"],
                description=r["description"],
                domain_tags=r["domain_tags"],
            )
            for r in rows("projects.csv")
        ])
        db.add_all([
            JobDrive(
                id=int(r["id"]),
                company_id=int(r["company_id"]),
                role=r["role"],
                description=r["description"],
                cgpa_cutoff=float(r["cgpa_cutoff"]) if r["cgpa_cutoff"] else None,
                allowed_branches=r["allowed_branches"],
                max_backlogs=int(r["max_backlogs"]) if r["max_backlogs"] else None,
                allow_prior_offers=as_bool(r["allow_prior_offers"]),
                status=status(r["status"], {"draft": "DRAFT", "published": "JD_PARSED", "scheduled": "SCHEDULED"}, "JD_PARSED"),
            )
            for r in rows("job_drives.csv")
        ])
        db.add_all([
            JobSkill(
                id=int(r["id"]),
                drive_id=int(r["drive_id"]),
                skill_name=r["skill_name"],
                is_mandatory=as_bool(r["is_mandatory"]),
            )
            for r in rows("job_skills.csv")
        ])
        db.add_all([
            Venue(
                id=int(r["id"]),
                name=r["name"],
                capacity=int(r["capacity"]),
                is_virtual=as_bool(r["is_virtual"]),
            )
            for r in rows("venues.csv")
        ])
        db.add_all([
            TimeSlot(
                id=int(r["id"]),
                start_time=as_dt(r["start_time"]),
                end_time=as_dt(r["end_time"]),
            )
            for r in rows("time_slots.csv")
        ])
        db.add_all([
            InterviewPanel(
                id=int(r["id"]),
                name=r["name"],
                drive_id=int(r["drive_id"]) if r["drive_id"] else None,
                members=r["members"],
                status=status(r["status"], {"active": "AVAILABLE", "available": "AVAILABLE", "unavailable": "UNAVAILABLE"}, "AVAILABLE"),
            )
            for r in rows("interview_panels.csv")
        ])
        await db.flush()

        db.add_all([
            EligibilityResult(
                id=int(r["id"]),
                drive_id=int(r["drive_id"]),
                student_id=int(r["student_id"]),
                is_eligible=as_bool(r["is_eligible"]),
                reason=r["reason"],
                status=status(r["status"], {"pending": "PENDING_APPROVAL", "approved": "APPROVED", "rejected": "AI_RECOMMENDATION"}, "PENDING_APPROVAL"),
            )
            for r in rows("eligibility_results.csv")
        ])
        db.add_all([
            CandidateMatch(
                id=int(r["id"]),
                drive_id=int(r["drive_id"]),
                student_id=int(r["student_id"]),
                match_score=float(r["match_score"]),
                skill_score=float(r["skill_score"]),
                academic_score=float(r["academic_score"]),
                project_score=float(r["project_score"]),
                readiness_score=float(r["readiness_score"]),
                matched_skills=r["matched_skills"],
                missing_skills=r["missing_skills"],
                explanation=r["explanation"],
                skill_evidence=json.dumps({"summary": r["skill_evidence"]}) if r["skill_evidence"] else None,
                missing_skills_explanation=r["missing_skills_explanation"],
                status=status(r["status"], {"pending": "AI_RECOMMENDATION", "approved": "APPROVED", "rejected": "REJECTED"}, "AI_RECOMMENDATION"),
            )
            for r in rows("candidate_matches.csv")
        ])
        db.add_all([
            Interview(
                id=int(r["id"]),
                drive_id=int(r["drive_id"]),
                student_id=int(r["student_id"]),
                panel_id=int(r["panel_id"]) if r["panel_id"] else None,
                venue_id=int(r["venue_id"]) if r["venue_id"] else None,
                time_slot_id=int(r["time_slot_id"]) if r["time_slot_id"] else None,
                status=status(r["status"], {"scheduled": "SCHEDULED", "no-show": "NO_SHOW", "completed": "COMPLETED"}, "SCHEDULED"),
            )
            for r in rows("interviews.csv")
        ])
        db.add_all([
            SystemException(
                id=int(r["id"]),
                entity_type=r["entity_type"],
                entity_id=int(r["entity_id"]),
                description=r["description"],
                status=status(r["status"], {"open": "OPEN", "resolved": "RESOLVED"}, "OPEN"),
            )
            for r in rows("exceptions.csv")
        ])
        db.add_all([
            Resume(
                id=int(r["id"]),
                student_id=int(r["student_id"]),
                file_path=r["file_path"],
                extracted_text=r["extracted_text"],
                structured_data=r["structured_data"],
                uploaded_at=as_dt(r["uploaded_at"]),
            )
            for r in rows("resumes.csv")
        ])
        db.add_all([
            Offer(
                id=int(r["id"]),
                student_id=int(r["student_id"]),
                drive_id=int(r["drive_id"]),
                status=status(r["status"], {"accepted": "ACCEPTED", "declined": "DECLINED", "offered": "PENDING", "pending": "PENDING"}, "PENDING"),
                offer_date=as_dt(r["offer_date"]),
            )
            for r in rows("offers.csv")
        ])
        db.add_all([
            ReadinessPlan(
                id=int(r["id"]),
                student_id=int(r["student_id"]),
                drive_id=int(r["drive_id"]),
                readiness_score=float(r["readiness_score"]),
                skill_gaps=r["skill_gaps"],
                plan=r["plan"],
                created_at=as_dt(r["created_at"]),
            )
            for r in rows("readiness_plans.csv")
        ])
        db.add_all([
            AgentEvent(
                id=int(r["id"]),
                agent=r["agent"],
                event_type=r["event_type"].upper(),
                message=r["message"],
                details=r["details"],
                timestamp=as_dt(r["timestamp"]),
                related_entity=r["related_entity"],
                status=r["status"].upper(),
            )
            for r in rows("agent_events.csv")
        ])
        db.add_all([
            AuditLog(
                id=int(r["id"]),
                action=r["action"],
                entity=r["entity"],
                entity_id=int(r["entity_id"]),
                details=r["details"],
                timestamp=as_dt(r["timestamp"]),
            )
            for r in rows("audit_logs.csv")
        ])

        db.add_all([
            User(email="tpo@example.com", password_hash=get_password_hash("password123"), role="tpo"),
            User(email="isaac.bakshi1@example.com", password_hash=get_password_hash("password123"), role="student", student_id=1),
        ])
        await db.commit()

    print("Database seeded with synthetic demo data: 500 students, drives, resumes, offers, schedules, and agent events.")


if __name__ == "__main__":
    asyncio.run(seed_data())
