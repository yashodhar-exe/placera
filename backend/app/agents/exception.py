from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Interview, InterviewPanel, SystemException

class ExceptionAgent:
    async def detect_and_handle_conflicts(self, db: AsyncSession):
        """
        Scans for scheduling or resource conflicts, e.g., a panel became UNAVAILABLE
        but is still assigned to an interview.
        """
        # Find all interviews assigned to unavailable panels
        query = (
            select(Interview, InterviewPanel)
            .join(InterviewPanel, Interview.panel_id == InterviewPanel.id)
            .where(InterviewPanel.status == "UNAVAILABLE")
            .where(Interview.status == "SCHEDULED")
        )
        result = await db.execute(query)
        conflicts = result.all()
        
        exceptions_created = 0
        for interview, panel in conflicts:
            # Mark interview as conflict
            interview.status = "EXCEPTION"
            
            # Create exception record
            exc = SystemException(
                entity_type="INTERVIEW",
                entity_id=interview.id,
                description=f"Panel '{panel.name}' is unavailable for scheduled interview."
            )
            db.add(exc)
            exceptions_created += 1
            
        await db.commit()
        return exceptions_created

    async def negotiate_conflict(self, db: AsyncSession, exception_id: int):
        """
        Multi-Agent Negotiation: Evaluates the conflict and proposes resolution options.
        """
        exc = await db.get(SystemException, exception_id)
        if not exc or exc.entity_type != "INTERVIEW" or exc.status != "OPEN":
            return {"options": []}

        interview = await db.get(Interview, exc.entity_id)
        if not interview:
            return {"options": []}

        options = []
        
        # Option 1: Find an available panel
        result = await db.execute(select(InterviewPanel).where(InterviewPanel.status == "AVAILABLE").limit(2))
        panels = result.scalars().all()
        
        if panels:
            options.append({
                "id": f"REASSIGN_PANEL_{panels[0].id}",
                "title": f"Reassign to {panels[0].name}",
                "tradeoffs": "No delay for student. Panel is available.",
                "is_recommended": True
            })
            
        # Option 2: Delay by 1 hour (mocked logic for MVP)
        options.append({
            "id": "DELAY_1_HOUR",
            "title": "Delay by 1 hour",
            "tradeoffs": "Student will be delayed. Same panel can be used later.",
            "is_recommended": False
        })
        
        # Option 3: Virtual Interview
        options.append({
            "id": "SWITCH_TO_VIRTUAL",
            "title": "Switch to Virtual Interview",
            "tradeoffs": "Requires sending new links. No physical room constraint.",
            "is_recommended": False
        })

        return {"options": options, "recommendation": options[0]["id"] if options else None}

    async def apply_resolution(self, db: AsyncSession, exception_id: int, resolution_id: str):
        exc = await db.get(SystemException, exception_id)
        if not exc:
            return False
            
        interview = await db.get(Interview, exc.entity_id)
        if not interview:
            return False
            
        if resolution_id.startswith("REASSIGN_PANEL_"):
            panel_id = int(resolution_id.split("_")[-1])
            interview.panel_id = panel_id
            exc.description += f" [RESOLVED: {resolution_id}]"
        else:
            exc.description += f" [RESOLVED: {resolution_id}]"
            
        interview.status = "SCHEDULED"
        exc.status = "RESOLVED"
        await db.commit()
        return True
