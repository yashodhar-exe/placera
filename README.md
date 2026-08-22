# AI Campus Placement Operations & Interview Coordination Agent

Hackathon MVP for an AI-assisted campus placement operations platform. The app keeps the TPO in control while agents handle JD extraction, deterministic eligibility, explainable matching, scheduling, conflict negotiation, mock notifications, resume intelligence, offers, rematching, readiness coaching, analytics, and audit history.

## Stack

- Backend: FastAPI, SQLAlchemy async, SQLite local demo database
- Frontend: React + Vite
- AI: Google Gemini when `GEMINI_API_KEY` is present, deterministic/local fallbacks in demo mode
- Notifications: mock provider by default

The design document calls for PostgreSQL/pgvector in production. This local MVP intentionally uses SQLite so judges can run it quickly without external database setup.

## Architecture

```text
React TPO Dashboard / Student Portal
              |
        FastAPI REST API
              |
 PlacementManagerAgent
      | JDIntakeAgent
      | EligibilityAgent
      | MatchingAgent
      | SchedulingAgent
      | CoordinationAgent
      | Exception / Negotiation Agent
      | NotificationAgent
      | ResumeIntelligenceAgent
      | ReadinessCoachAgent
              |
        SQLAlchemy Data Layer
```

## Setup

```powershell
cd "C:\Users\imman\Downloads\Agentic AI Hackathon"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
cd backend
..\.venv\Scripts\python.exe seed.py
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

In another terminal:

```powershell
cd "C:\Users\imman\Downloads\Agentic AI Hackathon\frontend"
npm install
npm run dev
```

Demo accounts after seeding:

- TPO: `tpo@example.com` / `password123`
- Student: `isaac.bakshi1@example.com` / `password123`

## Main API

- `POST /api/drives`
- `POST /api/drives/{id}/parse-jd`
- `POST /api/drives/{id}/jd`
- `GET /api/drives/{id}/eligibility`
- `POST /api/drives/{id}/matches`
- `GET /api/matching/{driveId}/{studentId}/evidence`
- `POST /api/drives/{id}/shortlist/approve`
- `POST /api/drives/{id}/schedule/generate`
- `POST /api/demo/simulate-panel-conflict`
- `POST /api/exceptions/check`
- `POST /api/exceptions/{id}/negotiate`
- `POST /api/exceptions/{id}/resolve`
- `POST /api/students/{id}/resume`
- `POST /api/offers`, `PATCH /api/offers/{id}/accept`
- `POST /api/readiness/generate`
- `GET /api/dashboard/summary`, `GET /api/agent-events`, `GET /api/audit-log`

## Verification

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest
cd ..\frontend
npm run build
```

Core demo path:

1. TPO creates a drive.
2. JDIntakeAgent extracts requirements.
3. TPO confirms JD requirements.
4. EligibilityAgent filters students deterministically.
5. MatchingAgent ranks candidates with evidence and explanations.
6. TPO approves a shortlist.
7. SchedulingAgent and CoordinationAgent create interviews.
8. TPO simulates a panel conflict.
9. Exception/Negotiation agents propose alternatives.
10. TPO approves a resolution.
11. NotificationAgent sends mock updates.
12. Student portal shows resume intelligence, matches, readiness plans, and offer status.
