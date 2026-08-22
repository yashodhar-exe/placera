from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import CandidateMatch, PlacementDrive
from app.models.schemas import CandidateMatchResponse, ShortlistActionRequest
from app.agents.matching_agent import matching_agent
from app.agents.context_router import context_router

router = APIRouter(prefix="/api/matching", tags=["Matching & Shortlisting Engine"])

@router.get("/drive/{drive_id}", response_model=List[CandidateMatchResponse])
def get_drive_matches(
    drive_id: int,
    is_shortlisted: Optional[bool] = None,
    tpo_status: Optional[str] = None,
    min_score: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CandidateMatch).filter(CandidateMatch.drive_id == drive_id)
    if is_shortlisted is not None:
        query = query.filter(CandidateMatch.is_shortlisted == is_shortlisted)
    if tpo_status:
        query = query.filter(CandidateMatch.tpo_status == tpo_status)
    if min_score is not None:
        query = query.filter(CandidateMatch.overall_score >= min_score)
    
    return query.order_by(CandidateMatch.overall_score.desc()).all()

@router.post("/drive/{drive_id}/generate")
def generate_matches(drive_id: int, db: Session = Depends(get_db)):
    """
    Executes explainable multi-factor scoring and semantic vector matching across all eligible candidates.
    """
    result = matching_agent.generate_candidate_matches(db, drive_id)
    context_router.log_event(
        event_type="MATCHING_GENERATED",
        drive_id=drive_id,
        agent_name="MatchingAgent",
        message=f"Candidate matching completed: Ranked {result['ranked_candidates_count']} candidates. Recommended shortlist: {result['recommended_shortlist_count']}",
        payload=result
    )
    return result

@router.post("/shortlist_action")
def perform_shortlist_action(data: ShortlistActionRequest, db: Session = Depends(get_db)):
    """
    TPO action to Approve, Reject, Waitlist, or Remove candidates from the proposed shortlist.
    """
    count = matching_agent.update_shortlist_decision(
        db=db,
        match_ids=data.candidate_match_ids,
        action=data.action,
        actor_id=data.actor_id,
        notes=data.notes
    )
    return {"message": f"Successfully updated {count} candidate matches to {data.action}", "updated_count": count}
