"""Serve the worker's public-to-dashboard status projection."""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()
SNAPSHOT = Path("/run/reports-of-reports/status.json")


@router.get("/status")
def status():
    try:
        with SNAPSHOT.open("rb") as file:
            raw = file.read(262145)
        if len(raw) > 262144:
            raise ValueError("Snapshot too large")
        data = json.loads(raw)
        if not isinstance(data, dict) or data.get("schema_version") != 1:
            raise ValueError("Unsupported snapshot")
    except FileNotFoundError:
        return {"available": False}
    except (OSError, ValueError, RecursionError):
        raise HTTPException(503, "Research status snapshot unavailable") from None
    return {**data, "available": True}
