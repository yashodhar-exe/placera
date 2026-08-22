import random
import datetime
from sqlalchemy.orm import Session
from app.models.entities import (
    Student, Company, PlacementDrive, StudentEligibility, CandidateMatch,
    InterviewPanel, VenueRoom, InterviewSchedule, PlacementException, AuditLog, Notification
)
from app.agents.eligibility_agent import eligibility_agent
from app.agents.matching_agent import matching_agent

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Student).count() > 0:
        return

    print("[Seed] Initializing Campus Placement Database with rich synthetic dataset...")

    # 1. Seed Venue Rooms
    rooms_data = [
        {"room_number": "CABIN-101", "building_block": "Placement Centre, Floor 1", "room_type": "OFFLINE_CABIN", "capacity": 3, "equipment": ["VC_SETUP", "WHITEBOARD", "HIGH_SPEED_LAN"]},
        {"room_number": "CABIN-102", "building_block": "Placement Centre, Floor 1", "room_type": "OFFLINE_CABIN", "capacity": 3, "equipment": ["VC_SETUP", "WHITEBOARD", "HIGH_SPEED_LAN"]},
        {"room_number": "CABIN-103", "building_block": "Placement Centre, Floor 1", "room_type": "OFFLINE_CABIN", "capacity": 3, "equipment": ["VC_SETUP", "WHITEBOARD"]},
        {"room_number": "LAB-201 (High-Perf Computing)", "building_block": "IT Tower, Floor 2", "room_type": "LAB", "capacity": 60, "equipment": ["DESKTOPS", "PROJECTOR", "HIGH_SPEED_LAN"]},
        {"room_number": "LAB-202 (AI Lab)", "building_block": "IT Tower, Floor 2", "room_type": "LAB", "capacity": 45, "equipment": ["GPU_WORKSTATIONS", "PROJECTOR"]},
        {"room_number": "AUDITORIUM-A", "building_block": "Main Admin Complex", "room_type": "SEMINAR_HALL", "capacity": 300, "equipment": ["AUDIO_SYSTEM", "DUAL_PROJECTOR"]},
        {"room_number": "VIRTUAL-MEET-01", "building_block": "Google Meet Enterprise", "room_type": "VIRTUAL_MEET", "capacity": 10, "equipment": ["RECORDING_ENABLED", "AI_TRANSCRIPT"], "virtual_link_template": "https://meet.google.com/pcd-adm-01"},
        {"room_number": "VIRTUAL-MEET-02", "building_block": "Microsoft Teams Room", "room_type": "VIRTUAL_MEET", "capacity": 10, "equipment": ["RECORDING_ENABLED"], "virtual_link_template": "https://teams.microsoft.com/l/meetup-join/pcd-msft-02"}
    ]
    for r in rooms_data:
        db.add(VenueRoom(**r))

    # 2. Seed Interview Panels
    panels_data = [
        {"name": "Dr. Rajesh Ramanathan", "email": "rajesh.raman@google.com", "role_designation": "Principal Staff Engineer", "company_name": "Google", "domain_expertise": ["Distributed Systems", "Data Structures & Algorithms", "System Design"], "max_slots_per_day": 8, "contact_number": "+91-9876543210"},
        {"name": "Ananya Mukherjee", "email": "ananya.m@microsoft.com", "role_designation": "Senior Engineering Manager", "company_name": "Microsoft", "domain_expertise": ["Cloud & Azure", "C++", "System Architecture"], "max_slots_per_day": 6, "contact_number": "+91-9876543211"},
        {"name": "Vikramaditya Rao", "email": "vikram.rao@amazon.com", "role_designation": "Solutions Architect / SDE-3", "company_name": "Amazon", "domain_expertise": ["Cloud & DevOps", "Python", "Kubernetes"], "max_slots_per_day": 8, "contact_number": "+91-9876543212"},
        {"name": "Priyanka Shenoy", "email": "pshenoy@goldmansachs.com", "role_designation": "Vice President - Quant Tech", "company_name": "Goldman Sachs", "domain_expertise": ["C++", "Financial Systems", "Algorithms", "Low Latency"], "max_slots_per_day": 7, "contact_number": "+91-9876543213"},
        {"name": "Siddharth Verma", "email": "sverma@deloitte.com", "role_designation": "Lead Consultant - Cloud", "company_name": "Deloitte", "domain_expertise": ["Cloud Security", "SQL", "Full-Stack Web"], "max_slots_per_day": 10, "contact_number": "+91-9876543214"},
        {"name": "Deepa Sundaram", "email": "dsundaram@ti.com", "role_designation": "Senior Hardware Architect", "company_name": "Texas Instruments", "domain_expertise": ["Embedded Systems", "VLSI", "C++", "Microcontrollers"], "max_slots_per_day": 6, "contact_number": "+91-9876543215"}
    ]
    for p in panels_data:
        db.add(InterviewPanel(**p))

    # 3. Seed Companies
    companies_data = [
        {"name": "Google", "industry": "Technology / Internet", "website": "https://careers.google.com", "tier": "DREAM", "contact_person": "Pooja Hegde (Campus Recruiter)", "contact_email": "google-campus-recruitment@google.com"},
        {"name": "Microsoft", "industry": "Enterprise Software / Cloud", "website": "https://careers.microsoft.com", "tier": "DREAM", "contact_person": "Gaurav Roy (University Talent Lead)", "contact_email": "ms-university-hiring@microsoft.com"},
        {"name": "Amazon", "industry": "E-Commerce / Cloud Computing", "website": "https://amazon.jobs", "tier": "TIER_1", "contact_person": "Kavita Nair (Recruiting Specialist)", "contact_email": "amazon-campus@amazon.com"},
        {"name": "Goldman Sachs", "industry": "Investment Banking & FinTech", "website": "https://goldmansachs.com/careers", "tier": "DREAM", "contact_person": "Ashwin Iyer (Engineering Campus Lead)", "contact_email": "gs-campus@gs.com"},
        {"name": "Deloitte USI", "industry": "Management & Tech Consulting", "website": "https://deloitte.com", "tier": "TIER_2", "contact_person": "Ritika Sen (Campus Lead)", "contact_email": "deloitte-campus@deloitte.com"},
        {"name": "Texas Instruments", "industry": "Semiconductors & Embedded", "website": "https://ti.com/careers", "tier": "TIER_1", "contact_person": "Mohit Bansal (Hardware Talent Lead)", "contact_email": "ti-campus@ti.com"}
    ]
    comp_objs = {}
    for c in companies_data:
        comp = Company(**c)
        db.add(comp)
        comp_objs[c["name"]] = comp

    db.flush()

    # 4. Seed 120 Students with Diverse Profiles
    branches = ["CSE", "IT", "ECE", "EEE", "MECH"]
    branch_weights = [0.40, 0.20, 0.20, 0.10, 0.10]
    
    first_names = ["Aarav", "Aditi", "Akhil", "Ananya", "Arjun", "Bhavna", "Chetan", "Deepika", "Dev", "Divya",
                   "Esha", "Gautam", "Gayatri", "Harish", "Ishaan", "Janani", "Karan", "Kavya", "Madhav", "Meera",
                   "Naveen", "Niharika", "Omkar", "Pooja", "Pranav", "Radhika", "Rohan", "Sanjana", "Shreya", "Siddharth",
                   "Sneha", "Tanvi", "Tarun", "Utkarsh", "Varun", "Vidya", "Yash", "Yukta", "Zaid", "Rhea",
                   "Abhishek", "Bhavya", "Chirag", "Dhruv", "Gauri", "Hemanth", "Indira", "Kishore", "Lavanya", "Manish"]
    last_names = ["Sharma", "Verma", "Patel", "Reddy", "Iyer", "Rao", "Nair", "Gupta", "Singh", "Joshi",
                  "Kulkarni", "Deshmukh", "Chopra", "Mehta", "Bhat", "Menon", "Pillai", "Das", "Banerjee", "Kapoor"]

    skills_pool = [
        {"name": "Python", "level": "Expert"},
        {"name": "Data Structures & Algorithms", "level": "Expert"},
        {"name": "FastAPI & RESTful APIs", "level": "Intermediate"},
        {"name": "React & Frontend State", "level": "Intermediate"},
        {"name": "SQL & Query Optimization", "level": "Expert"},
        {"name": "Docker & Containerization", "level": "Intermediate"},
        {"name": "Kubernetes & Orchestration", "level": "Beginner"},
        {"name": "System Design & Distributed Systems", "level": "Intermediate"},
        {"name": "Machine Learning & LLMs", "level": "Intermediate"},
        {"name": "C++", "level": "Expert"},
        {"name": "Java & Spring Boot", "level": "Intermediate"},
        {"name": "Embedded C / VLSI Design", "level": "Expert"}
    ]

    students = []
    for i in range(1, 121):
        branch = random.choices(branches, weights=branch_weights, k=1)[0]
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        name = f"{fname} {lname}"
        roll = f"2022BTech{branch}{i:03d}"
        email = f"{fname.lower()}.{lname.lower()}{i}@university.edu"
        
        # CGPA distribution: bell curve centered around 8.0
        cgpa = round(min(9.95, max(6.1, random.gauss(8.1, 0.85))), 2)
        tenth_pct = round(random.uniform(78.0, 98.0), 1)
        twelfth_pct = round(random.uniform(75.0, 97.0), 1)
        
        active_b = 1 if (random.random() < 0.08 and cgpa < 7.2) else 0
        history_b = 1 if (active_b > 0 or (random.random() < 0.12 and cgpa < 7.5)) else 0
        
        # Determine skills
        k_skills = random.randint(4, 7)
        if branch in ["CSE", "IT"]:
            st_skills = random.sample(skills_pool[:9] + [skills_pool[9], skills_pool[10]], k_skills)
        elif branch == "ECE":
            st_skills = random.sample([skills_pool[0], skills_pool[1], skills_pool[9], skills_pool[11], skills_pool[4], skills_pool[5]], min(5, k_skills))
        else:
            st_skills = random.sample([skills_pool[0], skills_pool[4], skills_pool[1], skills_pool[11]], 3)

        # Projects
        st_projects = [
            {
                "title": f"Distributed Event Broker using {st_skills[0]['name']}",
                "tech_stack": [st_skills[0]["name"], "Docker", "PostgreSQL"],
                "description": "High-throughput asynchronous event processor handling 10k req/sec with zero loss."
            }
        ]
        if len(st_skills) > 2:
            st_projects.append({
                "title": f"Full-Stack Campus Portal with {st_skills[1]['name']}",
                "tech_stack": [st_skills[1]["name"], "React", "Redis"],
                "description": "Real-time portal with role-based auth, live updates, and responsive dashboard."
            })

        readiness = round(min(98.0, max(50.0, (cgpa * 8.5) + random.uniform(5.0, 15.0))), 1)
        mock_rating = round(min(9.8, max(5.5, (readiness / 10.0) + random.uniform(-0.5, 0.5))), 1)

        # Placement status
        p_status = "UNPLACED"
        curr_comp = None
        curr_pkg = None
        if i in [10, 22, 35]:
            p_status = "PLACED_TIER_2"
            curr_comp = "Infosys / Wipro"
            curr_pkg = 5.0
        elif i in [5, 18]:
            p_status = "PLACED_TIER_1"
            curr_comp = "Oracle Cloud"
            curr_pkg = 11.5

        student = Student(
            roll_number=roll,
            name=name,
            email=email,
            phone=f"+91-98{random.randint(10000000, 99999999)}",
            branch=branch,
            batch=2026,
            cgpa=cgpa,
            tenth_percentage=tenth_pct,
            twelfth_percentage=twelfth_pct,
            active_backlogs=active_b,
            history_backlogs=history_b,
            placement_status=p_status,
            current_company=curr_comp,
            current_package_lpa=curr_pkg,
            skills=st_skills,
            projects=st_projects,
            certifications=[{"title": "AWS Certified Cloud Practitioner", "issuer": "Amazon Web Services"}],
            placement_readiness_score=readiness,
            mock_interview_rating=mock_rating,
            resume_summary=f"Final year {branch} undergraduate with strong foundation in {', '.join([s['name'] for s in st_skills[:3]])} and hands-on project experience."
        )
        db.add(student)
        students.append(student)

    db.flush()

    # 5. Seed 6 Placement Drives at Varied Stages
    drives_spec = [
        {
            "drive_code": "DRV-GOOG-2026",
            "company_name": "Google",
            "role_title": "Software Engineer - Campus Specialist",
            "ctc_lpa": 28.0,
            "base_salary_lpa": 22.0,
            "openings": 6,
            "job_location": "Bangalore / Hyderabad",
            "tier": "DREAM",
            "min_cgpa": 8.0,
            "min_tenth_pct": 75.0,
            "min_twelfth_pct": 75.0,
            "allowed_branches": ["CSE", "IT", "ECE"],
            "max_active_backlogs": 0,
            "allow_history_backlogs": False,
            "required_skills": ["Data Structures & Algorithms", "Python", "System Design & Distributed Systems", "C++"],
            "preferred_skills": ["Docker & Containerization", "Kubernetes & Orchestration", "SQL & Query Optimization"],
            "drive_date": "2026-08-28",
            "stage": "SHORTLIST_PROPOSED",
            "tpo_approved_jd": True,
            "tpo_approved_eligibility": True,
            "job_description_raw": "Google is seeking top engineering talent for Software Engineer roles. Must have world-class problem solving in Algorithms, Data Structures, System Design, and Concurrency in Python/C++."
        },
        {
            "drive_code": "DRV-MSFT-2026",
            "company_name": "Microsoft",
            "role_title": "Software Development Engineer (SDE-1)",
            "ctc_lpa": 24.0,
            "base_salary_lpa": 19.5,
            "openings": 8,
            "job_location": "Hyderabad / Bangalore",
            "tier": "DREAM",
            "min_cgpa": 7.8,
            "min_tenth_pct": 70.0,
            "min_twelfth_pct": 70.0,
            "allowed_branches": ["CSE", "IT", "ECE"],
            "max_active_backlogs": 0,
            "allow_history_backlogs": True,
            "required_skills": ["Data Structures & Algorithms", "C++", "Java & Spring Boot", "System Design & Distributed Systems"],
            "preferred_skills": ["Docker & Containerization", "SQL & Query Optimization", "FastAPI & RESTful APIs"],
            "drive_date": "2026-08-25",
            "stage": "SCHEDULED",
            "tpo_approved_jd": True,
            "tpo_approved_eligibility": True,
            "tpo_approved_shortlist": True,
            "tpo_approved_schedule": True,
            "job_description_raw": "Microsoft Azure & Core Systems team hiring SDE-1 for cloud-scale distributed services and developer platforms."
        },
        {
            "drive_code": "DRV-AMZN-2026",
            "company_name": "Amazon",
            "role_title": "Cloud Support Associate & DevOps",
            "ctc_lpa": 14.5,
            "base_salary_lpa": 12.0,
            "openings": 12,
            "job_location": "Chennai / Bangalore",
            "tier": "TIER_1",
            "min_cgpa": 7.0,
            "min_tenth_pct": 65.0,
            "min_twelfth_pct": 65.0,
            "allowed_branches": ["CSE", "IT", "ECE", "EEE"],
            "max_active_backlogs": 0,
            "allow_history_backlogs": True,
            "required_skills": ["Docker & Containerization", "Python", "SQL & Query Optimization"],
            "preferred_skills": ["Kubernetes & Orchestration", "FastAPI & RESTful APIs", "React & Frontend State"],
            "drive_date": "2026-08-22",
            "stage": "IN_PROGRESS",
            "tpo_approved_jd": True,
            "tpo_approved_eligibility": True,
            "tpo_approved_shortlist": True,
            "tpo_approved_schedule": True,
            "job_description_raw": "Amazon AWS Cloud Services is recruiting Cloud Support and DevOps Engineers to manage production cloud infrastructure."
        },
        {
            "drive_code": "DRV-GS-2026",
            "company_name": "Goldman Sachs",
            "role_title": "Quantitative Technology Analyst",
            "ctc_lpa": 22.0,
            "base_salary_lpa": 18.0,
            "openings": 5,
            "job_location": "Bangalore",
            "tier": "DREAM",
            "min_cgpa": 8.2,
            "min_tenth_pct": 75.0,
            "min_twelfth_pct": 75.0,
            "allowed_branches": ["CSE", "IT", "ECE"],
            "max_active_backlogs": 0,
            "allow_history_backlogs": False,
            "required_skills": ["C++", "Data Structures & Algorithms", "SQL & Query Optimization", "Python"],
            "preferred_skills": ["Machine Learning & LLMs", "System Design & Distributed Systems"],
            "drive_date": "2026-09-02",
            "stage": "ELIGIBILITY_PROCESSED",
            "tpo_approved_jd": True,
            "job_description_raw": "Goldman Sachs Engineering division hiring Quant Tech Analysts for building ultra low-latency algorithmic trading infrastructure."
        },
        {
            "drive_code": "DRV-DEL-2026",
            "company_name": "Deloitte USI",
            "role_title": "Cybersecurity & Cloud Analyst",
            "ctc_lpa": 7.5,
            "base_salary_lpa": 6.5,
            "openings": 20,
            "job_location": "Hyderabad / Gurgaon",
            "tier": "TIER_2",
            "min_cgpa": 6.5,
            "min_tenth_pct": 60.0,
            "min_twelfth_pct": 60.0,
            "allowed_branches": ["CSE", "IT", "ECE", "EEE", "MECH"],
            "max_active_backlogs": 1,
            "allow_history_backlogs": True,
            "required_skills": ["SQL & Query Optimization", "Python"],
            "preferred_skills": ["React & Frontend State", "Docker & Containerization"],
            "drive_date": "2026-09-10",
            "stage": "JD_PARSED",
            "job_description_raw": "Deloitte USI hiring for Technology Advisory, Cloud migrations, and IT Risk & Cybersecurity practices."
        },
        {
            "drive_code": "DRV-TI-2026",
            "company_name": "Texas Instruments",
            "role_title": "Embedded Firmware & VLSI Engineer",
            "ctc_lpa": 16.0,
            "base_salary_lpa": 14.0,
            "openings": 4,
            "job_location": "Bangalore",
            "tier": "TIER_1",
            "min_cgpa": 7.5,
            "min_tenth_pct": 70.0,
            "min_twelfth_pct": 70.0,
            "allowed_branches": ["ECE", "EEE", "CSE"],
            "max_active_backlogs": 0,
            "allow_history_backlogs": True,
            "required_skills": ["Embedded C / VLSI Design", "C++", "Data Structures & Algorithms"],
            "preferred_skills": ["Python", "System Design & Distributed Systems"],
            "drive_date": "2026-09-15",
            "stage": "DRAFT",
            "job_description_raw": "Texas Instruments Embedded Processing group looking for firmware architects and analog/digital VLSI design engineers."
        }
    ]

    drive_map = {}
    for d_spec in drives_spec:
        comp = comp_objs.get(d_spec["company_name"])
        drive = PlacementDrive(
            drive_code=d_spec["drive_code"],
            company_id=comp.id,
            role_title=d_spec["role_title"],
            ctc_lpa=d_spec["ctc_lpa"],
            base_salary_lpa=d_spec["base_salary_lpa"],
            openings=d_spec["openings"],
            job_location=d_spec["job_location"],
            tier=d_spec["tier"],
            min_cgpa=d_spec["min_cgpa"],
            min_tenth_pct=d_spec["min_tenth_pct"],
            min_twelfth_pct=d_spec["min_twelfth_pct"],
            allowed_branches=d_spec["allowed_branches"],
            max_active_backlogs=d_spec["max_active_backlogs"],
            allow_history_backlogs=d_spec["allow_history_backlogs"],
            required_skills=d_spec["required_skills"],
            preferred_skills=d_spec["preferred_skills"],
            rounds_config=[
                {"round_num": 1, "name": "Online Assessment (Coding & Aptitude)", "type": "TEST", "duration_mins": 90},
                {"round_num": 2, "name": "Technical Interview 1 (DSA & Core)", "type": "INTERVIEW", "duration_mins": 45},
                {"round_num": 3, "name": "Technical Interview 2 (System & Projects)", "type": "INTERVIEW", "duration_mins": 45},
                {"round_num": 4, "name": "HR & Leadership Fitment Round", "type": "HR", "duration_mins": 30}
            ],
            drive_date=d_spec["drive_date"],
            stage=d_spec["stage"],
            is_active=True,
            jd_extraction_confidence=0.96,
            jd_extracted_data={"extracted_by": "JDIntakeAgent", "parsed_at": "2026-08-21T09:00:00Z"},
            tpo_approved_jd=d_spec.get("tpo_approved_jd", False),
            tpo_approved_eligibility=d_spec.get("tpo_approved_eligibility", False),
            tpo_approved_shortlist=d_spec.get("tpo_approved_shortlist", False),
            tpo_approved_schedule=d_spec.get("tpo_approved_schedule", False),
            job_description_raw=d_spec["job_description_raw"]
        )
        db.add(drive)
        drive_map[d_spec["drive_code"]] = drive

    db.flush()

    # 6. Execute Eligibility & Matching for Active Drives
    for code in ["DRV-GOOG-2026", "DRV-MSFT-2026", "DRV-AMZN-2026", "DRV-GS-2026"]:
        drv = drive_map[code]
        eligibility_agent.evaluate_drive_eligibility(db, drv.id)
        if drv.stage in ["SHORTLIST_PROPOSED", "SCHEDULED", "IN_PROGRESS"]:
            matching_agent.generate_candidate_matches(db, drv.id)

    # 7. Generate Schedules for Microsoft Drive & Amazon Drive
    msft_drv = drive_map["DRV-MSFT-2026"]
    amzn_drv = drive_map["DRV-AMZN-2026"]

    panels = db.query(InterviewPanel).all()
    rooms = db.query(VenueRoom).all()

    # Pre-generate schedules for Microsoft
    msft_matches = db.query(CandidateMatch).filter(
        CandidateMatch.drive_id == msft_drv.id,
        CandidateMatch.is_shortlisted == True
    ).limit(10).all()

    for idx, match in enumerate(msft_matches):
        p = panels[idx % len(panels)]
        r = rooms[idx % len(rooms)]
        start_hour = 9 + (idx // len(panels))
        start_min = (idx % len(panels)) * 15
        start_str = f"2026-08-25 {start_hour:02d}:{start_min:02d} AM"
        end_str = f"2026-08-25 {start_hour:02d}:{start_min+45:02d} AM"
        
        # Inject one intentional schedule conflict to demonstrate the Exception Sentinel & 1-click resolver
        is_conflict = (idx == 2)
        conflict_msg = "Double-booking: Panel Ananya Mukherjee is scheduled for another interview slot at the same time." if is_conflict else None

        sch = InterviewSchedule(
            drive_id=msft_drv.id,
            student_id=match.student_id,
            panel_id=p.id,
            room_id=r.id,
            round_number=1,
            round_name="Technical Round 1 (DSA & Systems)",
            start_time=start_str,
            end_time=end_str,
            status="CONFIRMED" if idx < 5 else "SCHEDULED",
            result="CLEARED" if idx < 3 else "PENDING",
            is_conflict=is_conflict,
            conflict_details=conflict_msg,
            meeting_link=f"https://meet.google.com/pcd-msft-{match.student_id}" if r.room_type == "VIRTUAL_MEET" else None
        )
        db.add(sch)

        if is_conflict:
            exc = PlacementException(
                drive_id=msft_drv.id,
                category="SCHEDULE_CONFLICT",
                severity="HIGH",
                title=f"Panel Clash: Interview Slot for Candidate #{match.student_id}",
                description=conflict_msg,
                affected_entities={"schedule_id": idx + 1, "student_id": match.student_id, "panel_id": p.id, "slot": start_str},
                suggested_resolution="Reassign to Standby Panel Dr. Rajesh Ramanathan or shift slot by 45 minutes.",
                status="OPEN"
            )
            db.add(exc)

    # 8. Add Audit Logs & Notifications
    audit_seeds = [
        AuditLog(
            actor_id="TPO_ADMIN",
            actor_role="TRAINING_AND_PLACEMENT_OFFICER",
            action_type="APPROVE_JD",
            target_type="PlacementDrive",
            target_id=str(msft_drv.id),
            drive_id=msft_drv.id,
            before_state={"stage": "DRAFT"},
            after_state={"stage": "JD_PARSED", "tpo_approved_jd": True},
            reason="Verified CTC package breakdown and branch eligibility criteria with Microsoft HR lead."
        ),
        AuditLog(
            actor_id="TPO_ADMIN",
            actor_role="TRAINING_AND_PLACEMENT_OFFICER",
            action_type="OVERRIDE_ELIGIBILITY",
            target_type="StudentEligibility",
            target_id="42",
            drive_id=msft_drv.id,
            before_state={"is_eligible": False},
            after_state={"is_eligible": True, "is_overridden": True},
            reason="Special exception approved by Dean: 1st place in ACM-ICPC regional contest."
        )
    ]
    for a in audit_seeds:
        db.add(a)

    notif_seeds = [
        Notification(
            drive_id=msft_drv.id,
            recipient_type="STUDENT",
            recipient_id="101",
            recipient_name="Aarav Sharma",
            recipient_contact="aarav.sharma1@university.edu",
            channel="EMAIL",
            subject="Interview Call Letter: Microsoft SDE-1 Technical Round 1",
            message_body="Dear Aarav, your Technical Interview is scheduled on 2026-08-25 at 09:00 AM in CABIN-101. Please bring your student ID and 2 copies of your resume.",
            template_type="INTERVIEW_CALL_LETTER",
            status="SENT"
        ),
        Notification(
            drive_id=msft_drv.id,
            recipient_type="STUDENT",
            recipient_id="101",
            recipient_name="Aarav Sharma",
            recipient_contact="+91-9876543210",
            channel="SMS",
            subject="Microsoft Interview Alert",
            message_body="Reminder: Microsoft SDE-1 Interview at 09:00 AM, CABIN-101. Best of luck!",
            template_type="INTERVIEW_REMINDER",
            status="SENT"
        )
    ]
    for n in notif_seeds:
        db.add(n)

    db.commit()
    print("[Seed] Successfully populated database with rich placement operational dataset!")
