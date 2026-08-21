import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import Student, Drive, EligibilityResult, MatchScore, Interview, ExceptionItem, Notification

def calculate_derived_scores(student: Student):
    # 1. API Score (Academic Performance Index) - out of 100
    # Formula: (CGPA * 10) * 0.6 + tenth_pct * 0.2 + twelfth_pct * 0.2
    cgpa_contrib = (student.cgpa * 10) * 0.6
    tenth_contrib = student.tenth_pct * 0.2
    twelfth_contrib = student.twelfth_pct * 0.2
    student.api_score = round(cgpa_contrib + tenth_contrib + twelfth_contrib, 2)

    # 2. SSI Score (Skill Strength Index) - out of 100
    # Formula: Each Advanced skill = 25, Intermediate = 15, Beginner = 5, capped at 100
    ssi = 0
    for sk in student.skills:
        level = sk.get("level", "Beginner").lower()
        if level == "advanced":
            ssi += 25
        elif level == "intermediate":
            ssi += 15
        else:
            ssi += 5
    student.ssi_score = min(ssi, 100.0)

    # 3. PRS Score (Placement Readiness Score) - out of 100
    # Formula: Projects (20 pts each, max 40) + Internships (30 pts each, max 60) + Certs (10 pts each, max 10), capped at 100
    project_pts = len(student.projects) * 20
    internship_pts = len(student.internship_history) * 30
    cert_pts = len(student.certifications) * 10
    student.prs_score = min(project_pts + internship_pts + cert_pts, 100.0)

def seed_db():
    # Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        # 1. Create mock students
        students = [
            Student(
                name="Aditya Sharma",
                email="aditya.sharma@example.com",
                branch="CSE",
                cgpa=9.2,
                tenth_pct=92.5,
                twelfth_pct=89.0,
                semester_marks={"sem1": 8.8, "sem2": 9.0, "sem3": 9.3, "sem4": 9.7},
                backlog_count=0,
                skills=[
                    {"skill": "Python", "level": "Advanced"},
                    {"skill": "SQL", "level": "Advanced"},
                    {"skill": "FastAPI", "level": "Intermediate"},
                    {"skill": "React", "level": "Intermediate"}
                ],
                certifications=[
                    {"name": "AWS Cloud Practitioner", "issuer": "Amazon"}
                ],
                projects=[
                    {"title": "Campus Recruiter Bot", "tech_stack": ["FastAPI", "React"]}
                ],
                internship_history=[
                    {"company": "Tech solutions Inc", "duration_months": 3}
                ],
                current_best_offer=None,
                applied_drives=[]
            ),
            Student(
                name="Rohan Verma",
                email="rohan.verma@example.com",
                branch="CSE",
                cgpa=7.9,  # Borderline for 8.0 cutoff
                tenth_pct=85.0,
                twelfth_pct=82.5,
                semester_marks={"sem1": 7.5, "sem2": 8.0, "sem3": 7.8, "sem4": 8.3},
                backlog_count=0,
                skills=[
                    {"skill": "Python", "level": "Intermediate"},
                    {"skill": "SQL", "level": "Intermediate"},
                    {"skill": "React", "level": "Advanced"},
                    {"skill": "JavaScript", "level": "Advanced"}
                ],
                certifications=[],
                projects=[
                    {"title": "E-Commerce App", "tech_stack": ["React", "Node.js"]}
                ],
                internship_history=[],
                current_best_offer=None,
                applied_drives=[]
            ),
            Student(
                name="Sneha Patil",
                email="sneha.patil@example.com",
                branch="ISE",
                cgpa=8.5,
                tenth_pct=88.0,
                twelfth_pct=85.0,
                semester_marks={"sem1": 8.2, "sem2": 8.4, "sem3": 8.6, "sem4": 8.8},
                backlog_count=0,
                skills=[
                    {"skill": "Java", "level": "Advanced"},
                    {"skill": "SQL", "level": "Intermediate"},
                    {"skill": "Python", "level": "Intermediate"}
                ],
                certifications=[
                    {"name": "Oracle Java Associate", "issuer": "Oracle"}
                ],
                projects=[
                    {"title": "Library System", "tech_stack": ["Java", "SQL"]}
                ],
                internship_history=[
                    {"company": "InfoSys Ltd", "duration_months": 2}
                ],
                current_best_offer=None,
                applied_drives=[]
            ),
            Student(
                name="Vikram Rathore",
                email="vikram.rathore@example.com",
                branch="ECE",
                cgpa=8.1,
                tenth_pct=78.0,
                twelfth_pct=80.0,
                semester_marks={"sem1": 7.9, "sem2": 8.1, "sem3": 8.0, "sem4": 8.4},
                backlog_count=1,  # Backlog count 1
                skills=[
                    {"skill": "C++", "level": "Advanced"},
                    {"skill": "Embedded Systems", "level": "Advanced"},
                    {"skill": "Python", "level": "Intermediate"}
                ],
                certifications=[],
                projects=[
                    {"title": "IoT Smart Home", "tech_stack": ["C++", "Raspberry Pi"]}
                ],
                internship_history=[],
                current_best_offer=None,
                applied_drives=[]
            ),
            Student(
                name="Pooja Rao",
                email="pooja.rao@example.com",
                branch="CSE",
                cgpa=9.6,
                tenth_pct=96.0,
                twelfth_pct=94.5,
                semester_marks={"sem1": 9.4, "sem2": 9.6, "sem3": 9.7, "sem4": 9.7},
                backlog_count=0,
                skills=[
                    {"skill": "Python", "level": "Advanced"},
                    {"skill": "JavaScript", "level": "Advanced"},
                    {"skill": "React", "level": "Advanced"},
                    {"skill": "Node.js", "level": "Advanced"}
                ],
                certifications=[
                    {"name": "Google Cloud Architect", "issuer": "Google"}
                ],
                projects=[
                    {"title": "Decentralized Voting", "tech_stack": ["React", "Solidity"]}
                ],
                internship_history=[
                    {"company": "Microsoft", "duration_months": 3}
                ],
                current_best_offer=12.5,  # Has an offer of 12.5 LPA
                applied_drives=[]
            ),
            Student(
                name="Karan Malhotra",
                email="karan.m@example.com",
                branch="ME",
                cgpa=6.8,
                tenth_pct=70.0,
                twelfth_pct=72.0,
                semester_marks={"sem1": 6.5, "sem2": 6.7, "sem3": 6.9, "sem4": 7.1},
                backlog_count=0,
                skills=[
                    {"skill": "AutoCAD", "level": "Advanced"},
                    {"skill": "SolidWorks", "level": "Advanced"},
                    {"skill": "Python", "level": "Beginner"}
                ],
                certifications=[],
                projects=[
                    {"title": "Robotic Arm Design", "tech_stack": ["SolidWorks", "Arduino"]}
                ],
                internship_history=[],
                current_best_offer=None,
                applied_drives=[]
            ),
            Student(
                name="Ananya Hegde",
                email="ananya.hegde@example.com",
                branch="ISE",
                cgpa=8.8,
                tenth_pct=91.0,
                twelfth_pct=88.5,
                semester_marks={"sem1": 8.5, "sem2": 8.9, "sem3": 8.7, "sem4": 9.1},
                backlog_count=0,
                skills=[
                    {"skill": "Python", "level": "Advanced"},
                    {"skill": "SQL", "level": "Advanced"},
                    {"skill": "Tableau", "level": "Advanced"},
                    {"skill": "Machine Learning", "level": "Intermediate"}
                ],
                certifications=[
                    {"name": "Tableau Analyst", "issuer": "Tableau"}
                ],
                projects=[
                    {"title": "Customer Segmentation Model", "tech_stack": ["Python", "Tableau"]}
                ],
                internship_history=[
                    {"company": "Amazon", "duration_months": 6}
                ],
                current_best_offer=None,
                applied_drives=[]
            ),
            Student(
                name="Rahul Jain",
                email="rahul.jain@example.com",
                branch="ECE",
                cgpa=7.3,  # Borderline for 7.5
                tenth_pct=80.0,
                twelfth_pct=78.5,
                semester_marks={"sem1": 7.0, "sem2": 7.2, "sem3": 7.5, "sem4": 7.5},
                backlog_count=0,
                skills=[
                    {"skill": "C++", "level": "Intermediate"},
                    {"skill": "Verilog", "level": "Intermediate"},
                    {"skill": "JavaScript", "level": "Intermediate"},
                    {"skill": "React", "level": "Intermediate"}
                ],
                certifications=[],
                projects=[
                    {"title": "Smart Irrigation IoT", "tech_stack": ["C++", "Arduino"]}
                ],
                internship_history=[],
                current_best_offer=None,
                applied_drives=[]
            )
        ]

        # Calculate scores
        for stud in students:
            calculate_derived_scores(stud)
            db.add(stud)

        db.commit()
        print(f"Seeded {len(students)} students successfully.")

        # 2. Seed Jobs / Drives
        drives = [
            Drive(
                company_name="Acme Systems",
                role_title="Software Engineer - Backend",
                jd_raw_text="We are seeking a Backend Engineer with strong proficiency in Python and database management using SQL. Exposure to FastAPI and React is highly preferred. Candidate should be able to design REST APIs, write database migrations, and coordinate with team members.",
                required_skills={"required": ["Python", "SQL"], "preferred": ["FastAPI", "React"]},
                cgpa_cutoff=8.0,
                eligible_branches=["CSE", "ISE"],
                package_min=12.0,
                package_max=16.0,
                headcount=5,
                status="published",
                stage="eligibility"
            ),
            Drive(
                company_name="TechCorp",
                role_title="Full Stack Developer",
                jd_raw_text="Join our web development team. Required: JavaScript, React, and general web technologies. Experience with Node.js and AWS is preferred. The role requires building responsive frontend interfaces and backend endpoints.",
                required_skills={"required": ["JavaScript", "React"], "preferred": ["Node.js", "AWS"]},
                cgpa_cutoff=7.5,
                eligible_branches=["CSE", "ISE", "ECE"],
                package_min=8.0,
                package_max=11.0,
                headcount=8,
                status="published",
                stage="matching"
            ),
            Drive(
                company_name="InnoTech",
                role_title="Data Analyst",
                jd_raw_text="We are looking for a Data Analyst to join our team. Responsibilities include analyzing business metrics, building reports, and writing basic SQL queries. Required skills: Python and Excel. Preferred: SQL and Tableau.",
                required_skills={"required": ["Python", "Excel"], "preferred": ["SQL", "Tableau"]},
                cgpa_cutoff=7.0,
                eligible_branches=["CSE", "ISE", "ECE", "ME"],
                package_min=6.0,
                package_max=8.0,
                headcount=3,
                status="draft",
                stage="intake"
            ),
            Drive(
                company_name="Innovaccer",
                role_title="SDE Intern",
                jd_raw_text="Required skills: C++, Java, DS & Algo. Good problem-solving ability. Cutoff 7.0.",
                required_skills={"required": ["C++", "Java"], "preferred": ["DS & Algo"]},
                cgpa_cutoff=7.0,
                eligible_branches=["CSE", "ISE", "ECE"],
                package_min=4.0,
                package_max=6.0,
                headcount=10,
                status="published",
                stage="scheduling"
            )
        ]

        for dr in drives:
            db.add(dr)

        db.commit()
        print(f"Seeded {len(drives)} drives successfully.")

        # Let's seed some exception items for testing the exceptions feed
        exceptions = [
            ExceptionItem(
                drive_id=1, # Acme Systems
                type="eligibility_edge_case",
                severity="medium",
                description="Student Rohan Verma has CGPA 7.9, which is borderline for Acme Systems (Cutoff: 8.0). Marked for TPO review.",
                resolved=False
            ),
            ExceptionItem(
                drive_id=1, # Acme Systems
                type="missing_data",
                severity="low",
                description="Student Sneha Patil is missing semester 5 marks. Computed readiness score with available semester marks.",
                resolved=False
            )
        ]

        for exc in exceptions:
            db.add(exc)
        
        db.commit()
        print("Seeded exceptions successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding DB: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
