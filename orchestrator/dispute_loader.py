"""
Curia Dispute Loader — Loads sample cases and parses user-submitted disputes.
"""

import json
import os
import glob
import logging
from typing import Optional

logger = logging.getLogger(__name__)

SAMPLE_CASES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_cases")


def load_sample_cases() -> list[dict]:
    """Load all sample case files from the sample_cases directory."""
    cases = []
    pattern = os.path.join(SAMPLE_CASES_DIR, "*.json")

    for filepath in sorted(glob.glob(pattern)):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                case = json.load(f)
                cases.append(case)
                logger.info(f"Loaded sample case: {case.get('title', filepath)}")
        except Exception as e:
            logger.error(f"Failed to load {filepath}: {e}")

    return cases


def get_sample_case(case_id: str) -> Optional[dict]:
    """Get a specific sample case by its ID."""
    cases = load_sample_cases()
    for case in cases:
        if case.get("id") == case_id:
            return case
    return None


def parse_case_submission(data: dict) -> dict:
    """Parse and validate a user-submitted case into the standard format."""
    import uuid

    case_id = f"case-{uuid.uuid4().hex[:8]}"

    return {
        "id": case_id,
        "title": data.get("title", "Untitled Dispute"),
        "category": data.get("category", "custom"),
        "description": data.get("description", "No description provided."),
        "evidence": data.get("evidence", []),
        "plaintiff": data.get("plaintiff", "Plaintiff"),
        "defendant": data.get("defendant", "Defendant"),
    }
