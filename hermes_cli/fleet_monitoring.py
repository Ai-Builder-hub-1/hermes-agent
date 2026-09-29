"""Fleet monitoring registry helpers for the Hermes operator dashboard."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


PROJECT_ROOT = Path(__file__).parent.parent.resolve()
REGISTRY_PATH = PROJECT_ROOT / "docs" / "design" / "dashboard-monitoring-registry.json"


def fleet_operator_snapshots(registry_path: Optional[Path] = None) -> Dict[str, Any]:
    """Return normalized fleet snapshots for the Operate dashboard."""

    path = registry_path or REGISTRY_PATH
    generated_at: Optional[str] = None
    entries: List[Dict[str, Any]] = []
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        generated_at = _string_or_none(data.get("generatedAt"))
        entries = [_normalize_entry(entry) for entry in data.get("entries", []) if isinstance(entry, dict)]
    return {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "source": str(path.relative_to(PROJECT_ROOT)) if path.is_relative_to(PROJECT_ROOT) else str(path),
        "snapshots": entries,
    }


def _normalize_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    latest_check = entry.get("latestCheck")
    return {
        "projectId": str(entry.get("projectId") or ""),
        "label": str(entry.get("label") or entry.get("projectId") or "Unknown project"),
        "owner": _string_or_none(entry.get("alertOwner")) or "unassigned",
        "status": _one_of(entry.get("status"), {"current", "declared", "missing"}, "missing"),
        "healthUrl": _string_or_none(entry.get("healthUrl")),
        "snapshotUrl": _string_or_none(entry.get("snapshotUrl")),
        "latestCheck": _normalize_latest_check(latest_check) if isinstance(latest_check, dict) else None,
    }


def _normalize_latest_check(check: Dict[str, Any]) -> Dict[str, Any]:
    checks = check.get("checks") if isinstance(check.get("checks"), dict) else {}
    pressure = check.get("pressure") if isinstance(check.get("pressure"), dict) else {}
    return {
        "status": _one_of(check.get("status"), {"passed", "failed"}, "failed"),
        "capturedAt": _string_or_none(check.get("capturedAt")) or "",
        "checks": {
            "health": _normalize_endpoint_check(checks.get("health") if isinstance(checks, dict) else None),
            "snapshot": _normalize_endpoint_check(checks.get("snapshot") if isinstance(checks, dict) else None),
        },
        "pressure": _normalize_pressure(pressure),
    }


def _normalize_endpoint_check(check: Any) -> Dict[str, Any]:
    if not isinstance(check, dict):
        return {"ok": False, "status": None, "ms": 0, "error": "missing_check"}
    normalized: Dict[str, Any] = {
        "ok": bool(check.get("ok")),
        "status": check.get("status") if isinstance(check.get("status"), int) else None,
        "ms": _number(check.get("ms")),
    }
    if isinstance(check.get("bytes"), (int, float)):
        normalized["bytes"] = int(check["bytes"])
    if check.get("error"):
        normalized["error"] = str(check["error"])
    return normalized


def _normalize_pressure(pressure: Dict[str, Any]) -> Dict[str, Any]:
    violations = pressure.get("violations") if isinstance(pressure.get("violations"), list) else []
    return {
        "status": _one_of(pressure.get("status"), {"passed", "failed"}, "passed"),
        "violations": [_normalize_pressure_violation(item) for item in violations if isinstance(item, dict)],
    }


def _normalize_pressure_violation(violation: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "check": str(violation.get("check") or "unknown"),
        "actual": _number(violation.get("actual")),
        "budget": _number(violation.get("budget")),
        "unit": _one_of(violation.get("unit"), {"ms", "bytes"}, "ms"),
    }


def _number(value: Any) -> int:
    return int(value) if isinstance(value, (int, float)) else 0


def _string_or_none(value: Any) -> Optional[str]:
    return value if isinstance(value, str) and value else None


def _one_of(value: Any, choices: set[str], fallback: str) -> str:
    return value if isinstance(value, str) and value in choices else fallback
