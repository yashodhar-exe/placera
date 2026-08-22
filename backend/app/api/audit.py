from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import AuditLog
from app.models.schemas import AuditLogResponse

router = APIRouter(prefix="/api/audit", tags=["Human-in-the-Loop Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_trail(
    action_type: Optional[str] = None,
    target_type: Optional[str] = None,
    drive_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    if drive_id:
        query = query.filter(AuditLog.drive_id == drive_id)
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
