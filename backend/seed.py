import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine, Base, AsyncSessionLocal
from app.models import Student, Skill, StudentSkill, Project, Company, JobDrive, JobSkill, Venue, InterviewPanel
import random

# Synthetic data
skills_list = ["Python", "Java", "C++", "React", "Node.js", "SQL", "Machine Learning", "AWS", "Docker", "Go"]
branches_list = ["CSE", "ECE", "MECH", "CIVIL", "EEE"]

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        # Create Skills
        db_skills = []
        for s_name in skills_list:
            skill = Skill(name=s_name)
            db.add(skill)
            db_skills.append(skill)
        await db.commit()
        
        # Create Students
        for i in range(1, 101):
            student = Student(
                name=f"Student {i}",
                email=f"student{i}@example.com",
                branch=random.choice(branches_list),
                graduation_year=2024,
                cgpa=round(random.uniform(6.0, 9.8), 2),
                backlogs=random.choice([0, 0, 0, 1, 2]),
                has_prior_offer=random.choice([False, False, True])
            )
            db.add(student)
            await db.commit() # commit to get student ID
            
            # Add Skills to student
            for _ in range(random.randint(2, 5)):
                s_skill = random.choice(db_skills)
                student_skill = StudentSkill(student_id=student.id, skill_id=s_skill.id, proficiency=random.randint(2, 5))
                db.add(student_skill)
                
            # Add Project
            project = Project(
                student_id=student.id,
                title=f"Project {i}",
                description="Sample project description.",
                domain_tags="Web, Backend" if i % 2 == 0 else "ML, Data"
            )
            db.add(project)
        await db.commit()

        # Create Companies
        c1 = Company(name="TechCorp")
        c2 = Company(name="InnovateInc")
        c3 = Company(name="CloudSystems")
        db.add_all([c1, c2, c3])
        await db.commit()

        # Create Venues and Panels
        v1 = Venue(name="Room 101", capacity=10)
        v2 = Venue(name="Room 102", capacity=10)
        p1 = InterviewPanel(name="Panel A", members="Alice, Bob")
        p2 = InterviewPanel(name="Panel B", members="Charlie, Dave")
        db.add_all([v1, v2, p1, p2])
        await db.commit()

        print("Database seeded successfully with 100 students, skills, companies, and venues.")

if __name__ == "__main__":
    asyncio.run(seed_data())
