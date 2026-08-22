import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import AuditLog

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action_type: str,
        target_type: str,
        target_id: Optional[str] = None,
        drive_id: Optional[int] = None,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None,
        actor_id: str = "TPO_ADMIN",
        actor_role: str = "TRAINING_AND_PLACEMENT_OFFICER"
    ) -> AuditLog:
        log_entry = AuditLog(
            timestamp=datetime.datetime.utcnow(),
            actor_id=actor_id,
            actor_role=actor_role,
            action_type=action_type,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            drive_id=drive_id,
            before_state=before_state or {},
            after_state=after_state or {},
            reason=reason
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
