from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Notification
from app.models.schemas import NotificationResponse, BroadcastNotificationRequest
from app.agents.notification_agent import notification_agent

router = APIRouter(prefix="/api/notifications", tags=["Notification Engine"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    drive_id: Optional[int] = None,
    recipient_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if drive_id:
        query = query.filter(Notification.drive_id == drive_id)
    if recipient_type:
        query = query.filter(Notification.recipient_type == recipient_type)
    return query.order_by(Notification.sent_at.desc()).limit(limit).all()

@router.post("/broadcast")
def dispatch_broadcast(data: BroadcastNotificationRequest, db: Session = Depends(get_db)):
    """
    TPO trigger to dispatch approved templated notifications to candidates or panels.
    """
    result = notification_agent.dispatch_broadcast(
        db=db,
        drive_id=data.drive_id,
        target_group=data.target_group,
        channels=data.channels,
        template_type=data.template_type,
        custom_subject=data.custom_subject,
        custom_message=data.custom_message,
        actor_id=data.actor_id
    )
    return result
