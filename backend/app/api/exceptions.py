from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import PlacementException
from app.models.schemas import PlacementExceptionResponse, ResolveExceptionRequest
from app.agents.exception_agent import exception_agent
from app.agents.context_router import context_router

router = APIRouter(prefix="/api/exceptions", tags=["Exception Radar"])

@router.get("", response_model=List[PlacementExceptionResponse])
def get_exceptions(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    drive_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PlacementException)
    if status:
        query = query.filter(PlacementException.status == status)
    if severity:
        query = query.filter(PlacementException.severity == severity)
    if drive_id:
        query = query.filter(PlacementException.drive_id == drive_id)
    return query.order_by(PlacementException.created_at.desc()).all()

@router.post("/scan")
def scan_exceptions(db: Session = Depends(get_db)):
    """
    Triggers Exception Sentinel to scan the ecosystem for conflicts, double bookings, and anomalies.
    """
    found = exception_agent.scan_for_exceptions(db)
    context_router.log_event(
        event_type="EXCEPTION_SCAN_COMPLETED",
        drive_id=None,
        agent_name="ExceptionAgent",
        message=f"Sentinel scan completed. Identified {len(found)} active exceptions.",
        payload={"new_exceptions_count": len(found)}
    )
    return {"message": "Scan completed", "exceptions_detected": len(found)}

@router.post("/{exception_id}/resolve", response_model=PlacementExceptionResponse)
def resolve_exception(exception_id: int, req: ResolveExceptionRequest, db: Session = Depends(get_db)):
    """
    TPO resolves an exception ticket with resolution notes and audit logging.
    """
    resolved = exception_agent.resolve_exception(
        db=db,
        exception_id=exception_id,
        resolution_notes=req.resolution_notes,
        action_taken=req.action_taken,
        actor_id=req.actor_id
    )

    context_router.log_event(
        event_type="EXCEPTION_RESOLVED",
        drive_id=resolved.drive_id,
        agent_name="ExceptionAgent",
        message=f"Resolved Exception #{exception_id}: {resolved.title} ({req.action_taken})",
        payload={"exception_id": exception_id, "notes": req.resolution_notes}
    )

    return resolved
