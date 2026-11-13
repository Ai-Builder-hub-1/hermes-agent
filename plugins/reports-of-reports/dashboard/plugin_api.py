"""Serve the worker's public-to-dashboard status projection."""
import json
import math
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()
SNAPSHOT = Path("/run/reports-of-reports/status.json")


def _field(record, key, *types, optional=False):
    value = record.get(key)
    if value is None and optional:
        return None
    if isinstance(value, bool) or not isinstance(value, types):
        raise ValueError(f"Invalid snapshot field: {key}")
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError(f"Invalid snapshot field: {key}")
    return value


def _run(run):
    if not isinstance(run, dict):
        raise ValueError("Invalid snapshot run")
    return {
        "id": _field(run, "id", str, int),
        "name": _field(run, "name", str),
        "state": _field(run, "state", str),
        "updated_at": _field(run, "updated_at", str, optional=True),
        "spend_usd": _field(run, "spend_usd", int, float),
        "error_code": _field(run, "error_code", str, optional=True),
        "report_doc_id": _field(run, "report_doc_id", str, optional=True),
    }


def _project(data):
    if not isinstance(data, dict) or data.get("schema_version") != 1:
        raise ValueError("Unsupported snapshot")
    runs = data.get("runs")
    if not isinstance(runs, list):
        raise ValueError("Invalid snapshot field: runs")
    return {
        "schema_version": 1,
        "generated_at": _field(data, "generated_at", str),
        "last_scan": _field(data, "last_scan", str, optional=True),
        "scan_exit_code": _field(data, "scan_exit_code", int, optional=True),
        "month_spend_usd": _field(data, "month_spend_usd", int, float),
        "runs": [_run(run) for run in runs],
    }


@router.get("/status")
def status():
    try:
        with SNAPSHOT.open("rb") as file:
            raw = file.read(262145)
        if len(raw) > 262144:
            raise ValueError("Snapshot too large")
        projection = _project(json.loads(raw))
    except FileNotFoundError:
        return {"available": False}
    except (OSError, ValueError, RecursionError):
        raise HTTPException(503, "Research status snapshot unavailable") from None
    return {**projection, "available": True}
