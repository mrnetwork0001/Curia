"""
Curia REST API Routes - Endpoints for the frontend to interact with the trial system.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from agents.protocol import CaseSubmission
from orchestrator.dispute_loader import load_sample_cases, parse_case_submission

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# Reference to the court session (set by main.py on startup)
_court = None


def set_court(court):
    global _court
    _court = court


class CaseSubmitRequest(BaseModel):
    title: str
    category: str = "custom"
    description: str
    evidence: list[str] = []
    plaintiff: str = "Plaintiff"
    defendant: str = "Defendant"


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "curia-api"}


@router.get("/cases")
async def list_cases():
    """List all cases - sample + active + completed."""
    sample_cases = load_sample_cases()
    active_cases = []

    if _court:
        for case in _court.case_history:
            active_cases.append(case.model_dump())

    return {
        "sample_cases": sample_cases,
        "active_cases": active_cases,
    }


@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Get a specific case by ID."""
    if _court:
        for case in _court.case_history:
            if case.id == case_id:
                return case.model_dump()

    # Check sample cases
    sample_cases = load_sample_cases()
    for case in sample_cases:
        if case.get("id") == case_id:
            return case

    raise HTTPException(status_code=404, detail="Case not found")


@router.get("/cases/{case_id}/transcript")
async def get_transcript(case_id: str):
    """Get the full message transcript for a case."""
    if _court:
        for case in _court.case_history:
            if case.id == case_id:
                return {
                    "case_id": case_id,
                    "phase": case.current_phase,
                    "transcript": case.transcript,
                    "verdict": case.verdict,
                }
    raise HTTPException(status_code=404, detail="Case not found")


@router.post("/cases")
async def submit_case(data: CaseSubmitRequest):
    """Submit a new dispute and start a trial."""
    if not _court:
        raise HTTPException(status_code=503, detail="Court session not initialized")

    case_data = parse_case_submission(data.model_dump())
    case = _court.start_trial(case_data)

    return {
        "status": "trial_started",
        "case_id": case.id,
        "title": case.title,
    }


@router.post("/cases/{case_id}/start")
async def start_sample_case(case_id: str):
    """Start a trial with a pre-loaded sample case."""
    if not _court:
        raise HTTPException(status_code=503, detail="Court session not initialized")

    sample_cases = load_sample_cases()
    target_case = None
    for case in sample_cases:
        if case.get("id") == case_id:
            target_case = case
            break

    if not target_case:
        raise HTTPException(status_code=404, detail="Sample case not found")

    case = _court.start_trial(target_case)
    return {
        "status": "trial_started",
        "case_id": case.id,
        "title": case.title,
    }


@router.get("/topology")
async def get_topology():
    """Get the AXL mesh topology of all 5 agents."""
    if not _court:
        return {"nodes": {}, "simulation_mode": True}

    return {
        "nodes": _court.get_topology(),
        "simulation_mode": _court.simulation_mode,
    }


@router.get("/agents")
async def get_agents():
    """Get status of all courtroom agents."""
    if not _court:
        return {"agents": []}

    return {"agents": _court.get_agents_status()}


@router.get("/trial/status")
async def get_trial_status():
    """Get the current trial status."""
    if not _court or not _court.active_case:
        return {"active": False}

    case = _court.active_case
    return {
        "active": case.status == "active",
        "case_id": case.id,
        "title": case.title,
        "phase": case.current_phase,
        "status": case.status,
        "message_count": len(case.transcript),
        "verdict": case.verdict,
    }
