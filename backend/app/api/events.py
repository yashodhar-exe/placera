from typing import List, Dict, Any
from fastapi import APIRouter, Query
from app.agents.context_router import context_router

router = APIRouter(prefix="/api/events", tags=["Context Router Stream"])

@router.get("/live", response_model=List[Dict[str, Any]])
def get_live_event_stream(limit: int = Query(30, ge=1, le=100)):
    return context_router.get_live_events(limit=limit)
