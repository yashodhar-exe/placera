from fastapi.testclient import TestClient

from main import app, manager


client = TestClient(app)
manager.jd_agent.client = None
manager.matching_agent.client = None
manager.resume_agent.client = None
manager.readiness_agent.client = None


def test_dashboard_summary_loads():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["active_drives"] >= 1
    assert "pending_tpo_actions" in body


def test_jd_eligibility_matching_and_evidence_flow():
    created = client.post("/api/drives?company_id=1")
    assert created.status_code == 200
    drive_id = created.json()["id"]

    parsed = client.post(
        f"/api/drives/{drive_id}/parse-jd",
        json={"jd_text": "Software Engineer with Python and React. CGPA 7.5. CSE and ECE only."},
    )
    assert parsed.status_code == 200
    jd = parsed.json()
    assert jd["skills_mandatory"]

    confirmed = client.post(f"/api/drives/{drive_id}/jd", json=jd)
    assert confirmed.status_code == 200

    eligibility = client.get(f"/api/drives/{drive_id}/eligibility")
    assert eligibility.status_code == 200
    assert eligibility.json()["eligible_count"] >= 0

    matches = client.post(f"/api/drives/{drive_id}/matches")
    assert matches.status_code == 200
    match_rows = matches.json()
    assert match_rows
    top = match_rows[0]
    assert top["match_score"] >= 0

    evidence = client.get(f"/api/matching/{drive_id}/{top['student_id']}/evidence")
    assert evidence.status_code == 200
    evidence_body = evidence.json()
    assert "matched_skills" in evidence_body
    assert "missing_skills" in evidence_body


def test_schedule_conflict_negotiation_flow():
    created = client.post("/api/drives?company_id=1")
    drive_id = created.json()["id"]
    jd = client.post(f"/api/drives/{drive_id}/parse-jd", json={"jd_text": "Python React role"}).json()
    client.post(f"/api/drives/{drive_id}/jd", json=jd)
    client.get(f"/api/drives/{drive_id}/eligibility")
    matches = client.post(f"/api/drives/{drive_id}/matches").json()
    student_ids = [row["student_id"] for row in matches[:3]]
    approved = client.post(f"/api/drives/{drive_id}/shortlist/approve", json=student_ids)
    assert approved.status_code == 200

    scheduled = client.post(f"/api/drives/{drive_id}/schedule/generate")
    assert scheduled.status_code == 200
    assert scheduled.json()["slots_created"] == len(student_ids)

    simulated = client.post(f"/api/demo/simulate-panel-conflict?drive_id={drive_id}")
    assert simulated.status_code == 200
    interview_id = simulated.json()["interview_id"]
    checked = client.post("/api/exceptions/check")
    assert checked.status_code == 200

    exceptions = client.get("/api/exceptions").json()
    open_exception = next(item for item in exceptions if item["status"] == "OPEN" and item["entity_id"] == interview_id)
    negotiated = client.post(f"/api/exceptions/{open_exception['id']}/negotiate")
    assert negotiated.status_code == 200
    option = negotiated.json()["recommendation"]
    assert option

    resolved = client.post(f"/api/exceptions/{open_exception['id']}/resolve", json={"resolution_id": option})
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"


def test_invalid_resume_upload_is_rejected():
    response = client.post(
        "/api/students/1/resume",
        files={"file": ("resume.txt", b"not a pdf", "text/plain")},
    )
    assert response.status_code == 400
