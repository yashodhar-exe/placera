# AI Campus Placement Operations & Interview Coordination Agent

This is a Hackathon MVP that automates campus placement operations while keeping humans in the loop.

## Architecture
- **Backend:** FastAPI (Python) using Google ADK concepts for agents.
- **Frontend:** React + Vite.
- **Database:** SQLite (local MVP).
- **AI Models:** Google Gemini for JD parsing and matching explanations.

## Setup Instructions

### 1. Environment Setup
Create a `.env` file in the `backend/` directory:
```
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=sqlite+aiosqlite:///./placement.db
EMAIL_PROVIDER_API_KEY=mock_key
```

### 2. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install fastapi uvicorn sqlalchemy aiosqlite pydantic google-genai python-dotenv`
5. Seed database: `python seed.py`
6. Run the server: `uvicorn main:app --reload`

### 3. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## Demo Flow
1. Open the React Dashboard.
2. Click **Create New Placement Drive**.
3. Upload JD text and click **Extract Requirements**. The `JDIntakeAgent` uses Gemini to extract structured requirements.
4. **Confirm & Publish** the requirements.
5. Click **Run Eligibility Filter**. The `EligibilityAgent` filters the 100 seeded students deterministically based on CGPA, branch, etc.
6. Click **Run Match & Rank**. The `MatchingAgent` calculates a hybrid score for each eligible candidate and uses Gemini to generate a natural language explanation.
7. Click **Approve Shortlist** to simulate TPO approval.
8. Click **Generate Interview Schedule**. The `SchedulingAgent` and `CoordinationAgent` create time slots and assign rooms/panels.
9. **Exception Handling Demo**: Simulate an outage by changing a Panel's status to `UNAVAILABLE` in the database, then click **Detect Conflicts**. The `ExceptionAgent` will flag affected interviews. Click **Resolve** to have the agent replan and assign a new panel.
