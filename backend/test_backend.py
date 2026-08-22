import sys
import io
from pathlib import Path

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import Base, engine, SessionLocal
from app.services.seed_service import seed_database
from app.agents.jd_intake_agent import jd_intake_agent
from app.agents.eligibility_agent import eligibility_agent
from app.agents.matching_agent import matching_agent
from app.agents.scheduling_agent import scheduling_agent
from app.agents.exception_agent import exception_agent
from app.agents.analytics_agent import analytics_agent
from app.agents.reporting_agent import reporting_agent
from app.models.entities import PlacementDrive

def run_tests():
    print("1. Creating database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    print("2. Seeding database...")
    seed_database(db)
    
    print("3. Testing JD Intake Agent...")
    sample_jd = """
    Hiring Company: Apple Inc.
    Role: iOS & Core ML Software Engineer
    Package: 26.5 LPA
    Min CGPA: 8.0
    Eligible Branches: CSE, IT, ECE
    No active backlogs allowed.
    Requirements: Swift, Python, Machine Learning, Data Structures, System Design
    """
    parsed = jd_intake_agent.parse_job_description(sample_jd)
    assert parsed["company_name"] == "Apple Inc.", f"Expected Apple Inc., got {parsed['company_name']}"
    assert parsed["ctc_lpa"] == 26.5, f"Expected 26.5, got {parsed['ctc_lpa']}"
    print(f"   ✓ JD Intake parsed: {parsed['company_name']} - {parsed['role_title']} ({parsed['ctc_lpa']} LPA)")

    print("4. Testing Analytics Agent...")
    gaps = analytics_agent.compute_skill_gap_matrix(db)
    assert len(gaps) > 0, "Expected skill gaps to be computed"
    print(f"   ✓ Skill Gap Matrix computed: {len(gaps)} categories analyzed (Top Gap: {gaps[0]['skill']} {gaps[0]['gap_pct']}%)")

    print("5. Testing Reporting Agent...")
    first_drive = db.query(PlacementDrive).first()
    report = reporting_agent.generate_drive_report(db, first_drive.id)
    assert "conversion_rate_pct" in report
    print(f"   ✓ Drive Report generated for {report['company_name']}: {report['eligible_count']} eligible, {report['shortlisted_count']} shortlisted")

    print("6. Testing Exception Agent Scan...")
    exceptions = exception_agent.scan_for_exceptions(db)
    print(f"   ✓ Exception Agent scanned: {len(exceptions)} exceptions detected")

    db.close()
    print("\n✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
