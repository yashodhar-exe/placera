"""
generate_placement_dataset.py

Generates a full, referentially-consistent synthetic dataset matching the
Placement Ops database schema (19 tables, integer PK/FK, real column names).

Unlike a purely random generator, key derived fields are computed from the
underlying data so the dataset is actually useful for training/demoing the
eligibility and matching agents:
  - students.academic_score / readiness_score are derived from cgpa, backlogs,
    skill proficiency, and project count (not random).
  - eligibility_results.is_eligible is computed from the drive's actual rules
    (cgpa_cutoff, allowed_branches, max_backlogs, allow_prior_offers).
  - candidate_matches.match_score is a real weighted function of skill overlap,
    academic score, project relevance, and readiness score.
  - offers are only generated for students who were actually matched,
    interviewed, and completed the interview.

Usage:
    python generate_placement_dataset.py [output_dir]
    (output_dir defaults to ./placement_dataset)
"""
import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from faker import Faker

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
fake = Faker("en_IN")
Faker.seed(SEED)

OUT_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("placement_dataset")
OUT_DIR.mkdir(parents=True, exist_ok=True)

N_STUDENTS = 500
BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"]
SKILL_POOL = [
    "Python", "Java", "C++", "SQL", "React", "Node.js", "Django", "Flask",
    "Machine Learning", "Data Structures", "Algorithms", "AWS", "Docker",
    "Kubernetes", "Git", "REST APIs", "MongoDB", "PostgreSQL", "TensorFlow",
    "System Design", "JavaScript", "TypeScript", "HTML/CSS", "Spring Boot",
]
PROJECT_DOMAINS = ["AI/ML", "Web", "Mobile", "Data Engineering", "Cloud", "IoT"]
PROJECT_TITLES = [
    "Placement Analytics Dashboard", "AI Resume Screener", "Campus Event App",
    "Attendance Tracker", "E-commerce Recommender", "Chatbot Assistant",
    "Weather Prediction Model", "Library Management Portal", "IoT Smart Campus",
    "Fraud Detection System",
]
COMPANY_NAMES = [
    "Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro", "Accenture",
    "Adobe", "Flipkart", "Zoho",
]
AGENTS = [
    "JDIntakeAgent", "EligibilityAgent", "MatchingAgent", "SchedulingAgent",
    "CoordinationAgent", "NotificationAgent", "AnalyticsAgent",
    "ReportingAgent", "ExceptionAgent",
]

def now_minus(days_max=30):
    return datetime.now() - timedelta(days=random.randint(0, days_max),
                                       hours=random.randint(0, 23))

def clip(v, lo=0.0, hi=100.0):
    return round(max(lo, min(hi, v)), 2)

rows = {}  # table_name -> list[dict]

# ---------------------------------------------------------------------------
# 1. skills
# ---------------------------------------------------------------------------
skills = [{"id": i + 1, "name": s} for i, s in enumerate(SKILL_POOL)]
rows["skills"] = skills
skill_id_by_name = {s["name"]: s["id"] for s in skills}

# ---------------------------------------------------------------------------
# 2. companies
# ---------------------------------------------------------------------------
companies = [{"id": i + 1, "name": n} for i, n in enumerate(COMPANY_NAMES)]
rows["companies"] = companies

# ---------------------------------------------------------------------------
# 3. venues
# ---------------------------------------------------------------------------
venues = [
    {"id": 1, "name": "Seminar Hall A", "capacity": 60, "is_virtual": False},
    {"id": 2, "name": "Seminar Hall B", "capacity": 40, "is_virtual": False},
    {"id": 3, "name": "Placement Cell Room 1", "capacity": 15, "is_virtual": False},
    {"id": 4, "name": "Placement Cell Room 2", "capacity": 15, "is_virtual": False},
    {"id": 5, "name": "Virtual Room — Zoom A", "capacity": 100, "is_virtual": True},
    {"id": 6, "name": "Virtual Room — Zoom B", "capacity": 100, "is_virtual": True},
]
rows["venues"] = venues

# ---------------------------------------------------------------------------
# 4. time_slots (9am-5pm, 30-min slots, next 5 weekdays)
# ---------------------------------------------------------------------------
time_slots = []
slot_id = 1
base_day = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
day_cursor = base_day
days_added = 0
while days_added < 5:
    if day_cursor.weekday() < 5:  # weekdays only
        for h in range(9, 17):
            for m in (0, 30):
                start = day_cursor.replace(hour=h, minute=m)
                end = start + timedelta(minutes=30)
                time_slots.append({"id": slot_id, "start_time": start.isoformat(),
                                    "end_time": end.isoformat()})
                slot_id += 1
        days_added += 1
    day_cursor += timedelta(days=1)
rows["time_slots"] = time_slots

# ---------------------------------------------------------------------------
# 5. students (base fields first; academic_score/readiness_score filled after
#    skills & projects are generated, since they depend on them)
# ---------------------------------------------------------------------------
students = []
for i in range(1, N_STUDENTS + 1):
    fn, ln = fake.first_name(), fake.last_name()
    cgpa = round(random.uniform(5.5, 10.0), 2)
    backlogs = random.choices([0, 1, 2, 3], weights=[70, 18, 8, 4])[0]
    students.append({
        "id": i,
        "name": f"{fn} {ln}",
        "email": f"{fn.lower()}.{ln.lower()}{i}@example.com",
        "branch": random.choice(BRANCHES),
        "graduation_year": random.choice([2025, 2026, 2027]),
        "cgpa": cgpa,
        "backlogs": backlogs,
        "has_prior_offer": random.random() < 0.12,
        "academic_score": None,   # filled below
        "readiness_score": None,  # filled below
    })
students_by_id = {s["id"]: s for s in students}

# ---------------------------------------------------------------------------
# 6. student_skills
# ---------------------------------------------------------------------------
student_skills = []
ss_id = 1
skills_by_student = {}
for s in students:
    chosen = random.sample(SKILL_POOL, random.randint(3, 8))
    skills_by_student[s["id"]] = {}
    for sk in chosen:
        prof = random.randint(1, 5)
        student_skills.append({
            "id": ss_id, "student_id": s["id"], "skill_id": skill_id_by_name[sk],
            "proficiency": prof,
        })
        skills_by_student[s["id"]][sk] = prof
        ss_id += 1
rows["student_skills"] = student_skills

# ---------------------------------------------------------------------------
# 7. projects
# ---------------------------------------------------------------------------
projects = []
proj_id = 1
projects_by_student = {}
for s in students:
    n_proj = random.randint(1, 3)
    projects_by_student[s["id"]] = []
    for _ in range(n_proj):
        domain = random.choice(PROJECT_DOMAINS)
        rec = {
            "id": proj_id, "student_id": s["id"],
            "title": random.choice(PROJECT_TITLES),
            "description": fake.sentence(nb_words=12),
            "domain_tags": domain,
        }
        projects.append(rec)
        projects_by_student[s["id"]].append(rec)
        proj_id += 1
rows["projects"] = projects

# ---------------------------------------------------------------------------
# Fill students.academic_score / readiness_score (derived, not random)
# ---------------------------------------------------------------------------
for s in students:
    sid = s["id"]
    academic_score = clip((s["cgpa"] / 10.0) * 100 - s["backlogs"] * 4)
    avg_prof = np.mean(list(skills_by_student[sid].values())) if skills_by_student[sid] else 0
    n_projects = len(projects_by_student[sid])
    readiness_score = clip(
        0.5 * academic_score + 0.35 * (avg_prof / 5 * 100) + 0.15 * min(n_projects, 3) / 3 * 100
    )
    s["academic_score"] = academic_score
    s["readiness_score"] = readiness_score
rows["students"] = students

# ---------------------------------------------------------------------------
# 8. resumes
# ---------------------------------------------------------------------------
resumes = []
for s in students:
    sid = s["id"]
    top_skills = list(skills_by_student[sid].keys())
    structured = {
        "name": s["name"], "email": s["email"], "cgpa": s["cgpa"],
        "skills": top_skills, "projects": [p["title"] for p in projects_by_student[sid]],
    }
    resumes.append({
        "id": sid,
        "student_id": sid,
        "file_path": f"/resumes/{sid}_{s['name'].split()[0].lower()}.pdf",
        "extracted_text": f"{s['name']} | {s['branch']} | CGPA {s['cgpa']} | Skills: {', '.join(top_skills)}",
        "structured_data": json.dumps(structured),
        "uploaded_at": now_minus(60).isoformat(),
    })
rows["resumes"] = resumes

# ---------------------------------------------------------------------------
# 9. job_drives
# ---------------------------------------------------------------------------
ROLES = ["SDE-1", "Data Analyst", "ML Engineer", "Backend Developer",
         "Frontend Developer", "DevOps Engineer", "QA Engineer", "Product Analyst"]
job_drives = []
drive_id = 1
N_DRIVES = 10
for _ in range(N_DRIVES):
    company = random.choice(companies)
    cutoff = round(random.uniform(6.0, 8.5), 2)
    allowed = ",".join(random.sample(BRANCHES, random.randint(2, len(BRANCHES))))
    job_drives.append({
        "id": drive_id,
        "company_id": company["id"],
        "role": random.choice(ROLES),
        "description": fake.paragraph(nb_sentences=3),
        "cgpa_cutoff": cutoff,
        "allowed_branches": allowed,
        "max_backlogs": random.choice([0, 1, 1, 2]),
        "allow_prior_offers": random.random() < 0.3,
        "status": random.choices(["Published", "Draft", "Closed"], weights=[70, 15, 15])[0],
    })
    drive_id += 1
rows["job_drives"] = job_drives

# ---------------------------------------------------------------------------
# 10. job_skills
# ---------------------------------------------------------------------------
job_skills = []
js_id = 1
skills_by_drive = {}
for jd in job_drives:
    chosen = random.sample(SKILL_POOL, random.randint(4, 7))
    mandatory_count = random.randint(2, 3)
    skills_by_drive[jd["id"]] = {"mandatory": set(), "preferred": set()}
    for idx, sk in enumerate(chosen):
        is_mandatory = idx < mandatory_count
        job_skills.append({
            "id": js_id, "drive_id": jd["id"], "skill_name": sk,
            "is_mandatory": is_mandatory,
        })
        (skills_by_drive[jd["id"]]["mandatory"] if is_mandatory
         else skills_by_drive[jd["id"]]["preferred"]).add(sk)
        js_id += 1
rows["job_skills"] = job_skills

# ---------------------------------------------------------------------------
# 11. eligibility_results (real rule evaluation, drive x student)
# ---------------------------------------------------------------------------
eligibility_results = []
er_id = 1
eligible_students_by_drive = {}
for jd in job_drives:
    allowed_branches = set(jd["allowed_branches"].split(","))
    eligible_students_by_drive[jd["id"]] = []
    for s in students:
        reasons = []
        eligible = True
        if s["cgpa"] < jd["cgpa_cutoff"]:
            eligible = False
            reasons.append(f"CGPA {s['cgpa']} below cutoff {jd['cgpa_cutoff']}")
        if s["branch"] not in allowed_branches:
            eligible = False
            reasons.append(f"Branch {s['branch']} not in allowed list")
        if s["backlogs"] > jd["max_backlogs"]:
            eligible = False
            reasons.append(f"{s['backlogs']} backlogs exceeds max {jd['max_backlogs']}")
        if s["has_prior_offer"] and not jd["allow_prior_offers"]:
            eligible = False
            reasons.append("Has a prior offer; drive excludes already-placed students")

        borderline = eligible and (0 <= (s["cgpa"] - jd["cgpa_cutoff"]) < 0.15)
        status = "Flagged" if borderline else ("Eligible" if eligible else "Excluded")
        reason_text = "; ".join(reasons) if reasons else "Meets all eligibility criteria"

        eligibility_results.append({
            "id": er_id, "drive_id": jd["id"], "student_id": s["id"],
            "is_eligible": eligible, "reason": reason_text, "status": status,
        })
        if eligible:
            eligible_students_by_drive[jd["id"]].append(s["id"])
        er_id += 1
rows["eligibility_results"] = eligibility_results

# ---------------------------------------------------------------------------
# 12. candidate_matches (real weighted scoring for eligible students only)
# ---------------------------------------------------------------------------
W_SKILL, W_ACADEMIC, W_PROJECT, W_READY = 0.40, 0.25, 0.20, 0.15
candidate_matches = []
cm_id = 1
matches_by_drive = {}
for jd in job_drives:
    mandatory = skills_by_drive[jd["id"]]["mandatory"]
    preferred = skills_by_drive[jd["id"]]["preferred"]
    domain_hint = "AI/ML" if "ML" in jd["role"] or "Data" in jd["role"] else (
        "Web" if "Developer" in jd["role"] else "Cloud")
    matches_by_drive[jd["id"]] = []

    for sid in eligible_students_by_drive[jd["id"]]:
        s = students_by_id[sid]
        student_skill_set = set(skills_by_student[sid].keys())

        matched_mandatory = student_skill_set & mandatory
        matched_preferred = student_skill_set & preferred
        missing = (mandatory | preferred) - student_skill_set
        total_required = len(mandatory) + len(preferred)
        skill_score = clip(
            (0.7 * (len(matched_mandatory) / max(len(mandatory), 1)) +
             0.3 * (len(matched_preferred) / max(len(preferred), 1))) * 100
        )

        academic_score = s["academic_score"]

        student_projects = projects_by_student[sid]
        relevant_projects = [p for p in student_projects if p["domain_tags"] == domain_hint]
        project_score = clip((len(relevant_projects) / max(len(student_projects), 1)) * 100) if student_projects else 0.0

        readiness_score = s["readiness_score"]

        match_score = clip(
            W_SKILL * skill_score + W_ACADEMIC * academic_score +
            W_PROJECT * project_score + W_READY * readiness_score
        )

        matched_all = sorted(matched_mandatory | matched_preferred)
        missing_all = sorted(missing)
        skill_evidence = "; ".join(
            f"{sk} (proficiency {skills_by_student[sid].get(sk, 0)}/5)" for sk in matched_all
        ) or "No overlapping skills on record"
        explanation = (
            f"Weighted score {match_score}: skills {skill_score} (x{W_SKILL}), "
            f"academics {academic_score} (x{W_ACADEMIC}), projects {project_score} (x{W_PROJECT}), "
            f"readiness {readiness_score} (x{W_READY})."
        )
        missing_skills_explanation = (
            f"Missing: {', '.join(missing_all)}" if missing_all else "No skill gaps against this drive"
        )

        rec = {
            "id": cm_id, "drive_id": jd["id"], "student_id": sid,
            "match_score": match_score, "skill_score": skill_score,
            "academic_score": academic_score, "project_score": project_score,
            "readiness_score": readiness_score,
            "matched_skills": ",".join(matched_all),
            "missing_skills": ",".join(missing_all),
            "explanation": explanation,
            "skill_evidence": skill_evidence,
            "missing_skills_explanation": missing_skills_explanation,
            "status": "Pending",
        }
        candidate_matches.append(rec)
        matches_by_drive[jd["id"]].append(rec)
        cm_id += 1

    # Rank and approve the top slice per drive (simulates TPO approval of top-N)
    matches_by_drive[jd["id"]].sort(key=lambda r: r["match_score"], reverse=True)
    top_n = matches_by_drive[jd["id"]][:min(15, len(matches_by_drive[jd["id"]]))]
    for r in top_n:
        r["status"] = "Approved"
rows["candidate_matches"] = candidate_matches

# ---------------------------------------------------------------------------
# 13. interview_panels
# ---------------------------------------------------------------------------
interview_panels = []
panel_id = 1
panels_by_drive = {}
for jd in job_drives:
    panels_by_drive[jd["id"]] = []
    for p in range(random.randint(1, 2)):
        members = ", ".join(fake.name() for _ in range(random.randint(2, 3)))
        rec = {"id": panel_id, "name": f"Panel {p + 1} — Drive {jd['id']}",
               "drive_id": jd["id"], "members": members, "status": "Active"}
        interview_panels.append(rec)
        panels_by_drive[jd["id"]].append(rec)
        panel_id += 1
rows["interview_panels"] = interview_panels

# ---------------------------------------------------------------------------
# 14. interviews (scheduled for approved matches only)
# ---------------------------------------------------------------------------
interviews = []
interview_id = 1
interviews_by_student_drive = {}
used_slots = set()
for jd in job_drives:
    approved = [r for r in matches_by_drive[jd["id"]] if r["status"] == "Approved"]
    panels = panels_by_drive[jd["id"]]
    for r in approved:
        panel = random.choice(panels)
        venue = random.choice(venues)
        # pick a time slot not already double-booked for this venue
        for _ in range(10):
            slot = random.choice(time_slots)
            key = (venue["id"], slot["id"])
            if key not in used_slots:
                used_slots.add(key)
                break
        status = random.choices(
            ["Scheduled", "Completed", "No-show", "Cancelled"],
            weights=[35, 45, 12, 8]
        )[0]
        rec = {
            "id": interview_id, "drive_id": jd["id"], "student_id": r["student_id"],
            "panel_id": panel["id"], "venue_id": venue["id"], "time_slot_id": slot["id"],
            "status": status,
        }
        interviews.append(rec)
        interviews_by_student_drive[(r["student_id"], jd["id"])] = rec
        interview_id += 1
rows["interviews"] = interviews

# ---------------------------------------------------------------------------
# 15. offers (only for completed interviews, biased toward higher match_score)
# ---------------------------------------------------------------------------
offers = []
offer_id = 1
match_lookup = {(r["drive_id"], r["student_id"]): r for r in candidate_matches}
for iv in interviews:
    if iv["status"] != "Completed":
        continue
    m = match_lookup.get((iv["drive_id"], iv["student_id"]))
    if not m:
        continue
    # higher match_score -> higher chance of an offer
    offer_prob = min(0.9, max(0.05, (m["match_score"] - 50) / 50))
    if random.random() < offer_prob:
        offer_status = random.choices(["Offered", "Accepted", "Declined"], weights=[30, 55, 15])[0]
        offers.append({
            "id": offer_id, "student_id": iv["student_id"], "drive_id": iv["drive_id"],
            "status": offer_status, "offer_date": now_minus(10).isoformat(),
        })
        offer_id += 1
rows["offers"] = offers

# ---------------------------------------------------------------------------
# 16. readiness_plans (for eligible students with meaningful skill gaps)
# ---------------------------------------------------------------------------
readiness_plans = []
rp_id = 1
for r in candidate_matches:
    missing = r["missing_skills"]
    if missing:
        readiness_plans.append({
            "id": rp_id, "student_id": r["student_id"], "drive_id": r["drive_id"],
            "readiness_score": r["readiness_score"],
            "skill_gaps": missing,
            "plan": f"Focus on: {missing.split(',')[0]} first — complete a project or certification, "
                    f"then revisit remaining gaps: {missing}.",
            "created_at": now_minus(20).isoformat(),
        })
        rp_id += 1
rows["readiness_plans"] = readiness_plans

# ---------------------------------------------------------------------------
# 17. exceptions
# ---------------------------------------------------------------------------
exceptions = []
exc_id = 1
# borderline eligibility cases
for er in [e for e in eligibility_results if e["status"] == "Flagged"][:40]:
    exceptions.append({
        "id": exc_id, "entity_type": "eligibility_result", "entity_id": er["id"],
        "description": f"Borderline eligibility for student {er['student_id']} on drive {er['drive_id']}: {er['reason']}",
        "status": random.choices(["Open", "Resolved"], weights=[60, 40])[0],
    })
    exc_id += 1
# low-confidence matches
for r in [m for m in candidate_matches if m["match_score"] < 55][:30]:
    exceptions.append({
        "id": exc_id, "entity_type": "candidate_match", "entity_id": r["id"],
        "description": f"Low-confidence match ({r['match_score']}) for student {r['student_id']} on drive {r['drive_id']}",
        "status": random.choices(["Open", "Resolved"], weights=[50, 50])[0],
    })
    exc_id += 1
# double-booked venue/slot conflicts (synthetic)
for _ in range(10):
    iv = random.choice(interviews)
    exceptions.append({
        "id": exc_id, "entity_type": "interview", "entity_id": iv["id"],
        "description": f"Possible venue/time conflict for interview {iv['id']} at venue {iv['venue_id']}",
        "status": random.choices(["Open", "Resolved"], weights=[40, 60])[0],
    })
    exc_id += 1
rows["exceptions"] = exceptions

# ---------------------------------------------------------------------------
# 18. audit_logs (human override actions)
# ---------------------------------------------------------------------------
audit_logs = []
al_id = 1
ACTIONS = ["override_eligibility", "approve_shortlist", "edit_job_drive",
           "confirm_schedule", "resolve_exception", "reject_match"]
for _ in range(150):
    action = random.choice(ACTIONS)
    entity = random.choice(["eligibility_result", "candidate_match", "job_drive",
                             "interview", "exception"])
    audit_logs.append({
        "id": al_id, "action": action, "entity": entity,
        "entity_id": random.randint(1, 400),
        "details": f"TPO performed '{action}' on {entity}",
        "timestamp": now_minus(45).isoformat(),
    })
    al_id += 1
rows["audit_logs"] = audit_logs

# ---------------------------------------------------------------------------
# 19. agent_events (pipeline activity log)
# ---------------------------------------------------------------------------
agent_events = []
ae_id = 1
EVENT_TYPES = ["started", "completed", "flagged", "escalated"]
for jd in job_drives:
    for agent in AGENTS:
        status = random.choices(["success", "success", "success", "needs_review"], weights=[70, 15, 10, 5])[0]
        agent_events.append({
            "id": ae_id, "agent": agent, "event_type": random.choice(EVENT_TYPES),
            "message": f"{agent} processed drive {jd['id']} ({jd['role']} @ company {jd['company_id']})",
            "details": json.dumps({"drive_id": jd["id"], "role": jd["role"]}),
            "timestamp": now_minus(15).isoformat(),
            "related_entity": f"job_drive:{jd['id']}",
            "status": status,
        })
        ae_id += 1
rows["agent_events"] = agent_events

# ---------------------------------------------------------------------------
# Write all CSVs
# ---------------------------------------------------------------------------
TABLE_ORDER = [
    "students", "skills", "companies", "venues", "time_slots", "exceptions",
    "audit_logs", "agent_events", "student_skills", "projects", "job_drives",
    "resumes", "job_skills", "eligibility_results", "candidate_matches",
    "interview_panels", "offers", "readiness_plans", "interviews",
]
for table in TABLE_ORDER:
    df = pd.DataFrame(rows[table])
    df.to_csv(OUT_DIR / f"{table}.csv", index=False)

print(f"Generated {len(TABLE_ORDER)} CSV files in {OUT_DIR.resolve()}")
for table in TABLE_ORDER:
    print(f"  {table}.csv: {len(rows[table])} rows")