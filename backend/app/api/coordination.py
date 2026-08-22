from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import InterviewPanel, VenueRoom, InterviewSchedule
from app.models.schemas import InterviewPanelResponse, VenueRoomResponse

router = APIRouter(prefix="/api/coordination", tags=["Coordination Matrix"])

@router.get("/panels", response_model=List[InterviewPanelResponse])
def get_panels(db: Session = Depends(get_db)):
    return db.query(InterviewPanel).all()

@router.get("/rooms", response_model=List[VenueRoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(VenueRoom).all()

@router.get("/panel_load")
def get_panel_loads(db: Session = Depends(get_db)):
    panels = db.query(InterviewPanel).all()
    results = []
    for p in panels:
        assigned_slots = db.query(InterviewSchedule).filter(InterviewSchedule.panel_id == p.id).count()
        results.append({
            "panel_id": p.id,
            "name": p.name,
            "company_name": p.company_name,
            "max_slots_per_day": p.max_slots_per_day,
            "assigned_slots_count": assigned_slots,
            "load_percentage": round((assigned_slots / max(1, p.max_slots_per_day)) * 100, 1),
            "is_overloaded": assigned_slots > p.max_slots_per_day
        })
    return results
