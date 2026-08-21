from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Interview, Venue, InterviewPanel

class CoordinationAgent:
    async def allocate_resources(self, db: AsyncSession, drive_id: int):
        """
        Assigns Venues and Panels to Interviews that lack them.
        """
        # Get unscheduled interviews
        result = await db.execute(
            select(Interview)
            .where(Interview.drive_id == drive_id)
            .where(Interview.panel_id == None)
        )
        interviews = result.scalars().all()
        
        # Get all venues and panels
        venues = (await db.execute(select(Venue))).scalars().all()
        panels = (await db.execute(select(InterviewPanel).where(InterviewPanel.status == "AVAILABLE"))).scalars().all()
        
        if not venues or not panels:
            return 0
            
        allocated = 0
        v_idx = 0
        p_idx = 0
        
        for interview in interviews:
            # Simple round-robin allocation for MVP
            interview.venue_id = venues[v_idx].id
            interview.panel_id = panels[p_idx].id
            
            v_idx = (v_idx + 1) % len(venues)
            p_idx = (p_idx + 1) % len(panels)
            allocated += 1
            
        await db.commit()
        return allocated
