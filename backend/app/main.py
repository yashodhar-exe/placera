import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.services.seed_service import seed_database
from app.agents.context_router import context_router

# Import all API routers
from app.api.drives import router as drives_router
from app.api.students import router as students_router
from app.api.eligibility import router as eligibility_router
from app.api.matching import router as matching_router
from app.api.scheduling import router as scheduling_router
from app.api.coordination import router as coordination_router
from app.api.notifications import router as notifications_router
from app.api.analytics import router as analytics_router
from app.api.reports import router as reports_router
from app.api.exceptions import router as exceptions_router
from app.api.audit import router as audit_router
from app.api.events import router as events_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial rich campus dataset
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    context_router.log_event(
        event_type="SYSTEM_BOOTSTRAP",
        drive_id=None,
        agent_name="ContextRouter",
        message="AI Campus Placement Command Center online. All 9 Agents initialized."
    )
    yield

app = FastAPI(
    title="AI Campus Placement Command Center API",
    description="Multi-Agent Campus Placement Operations, Interview Scheduling & Coordination Engine",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(drives_router)
app.include_router(students_router)
app.include_router(eligibility_router)
app.include_router(matching_router)
app.include_router(scheduling_router)
app.include_router(coordination_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(exceptions_router)
app.include_router(audit_router)
app.include_router(events_router)

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "University Placement Command Center",
        "agents": [
            "JDIntakeAgent", "EligibilityAgent", "MatchingAgent",
            "SchedulingAgent", "CoordinationAgent", "NotificationAgent",
            "AnalyticsAgent", "ReportingAgent", "ExceptionAgent"
        ],
        "router": "ContextRouter (HITL Enabled)",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
