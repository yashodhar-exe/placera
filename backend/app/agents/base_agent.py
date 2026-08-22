import datetime
import uuid
from typing import Dict, Any, Optional
from app.models.schemas import AgentExecutionContext

class BaseAgent:
    def __init__(self, agent_name: str, role_description: str):
        self.agent_name = agent_name
        self.role_description = role_description

    def create_context(
        self,
        drive_id: Optional[int] = None,
        target_agent: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        requires_human_approval: bool = False
    ) -> AgentExecutionContext:
        return AgentExecutionContext(
            drive_id=drive_id,
            task_id=f"TASK-{uuid.uuid4().hex[:8].upper()}",
            session_id=f"SESS-{uuid.uuid4().hex[:8].upper()}",
            caller_agent=self.agent_name,
            target_agent=target_agent,
            payload=payload or {},
            routing_info={"initiated_at": datetime.datetime.utcnow().isoformat()},
            requires_human_approval=requires_human_approval,
            is_approved=False
        )

    def log_agent_action(self, action: str, details: Dict[str, Any]):
        print(f"[{datetime.datetime.utcnow().strftime('%H:%M:%S')}] [{self.agent_name}] {action}: {details}")
