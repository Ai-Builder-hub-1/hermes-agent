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


def fleet_operator_queue(registry_path: Optional[Path] = None, limit: int = 12) -> Dict[str, Any]:
    """Return a ranked, chat-readable operator queue from fleet evidence."""

    snapshots = fleet_operator_snapshots(registry_path)
    items = sorted(
        [_snapshot_to_operator_item(snapshot) for snapshot in snapshots["snapshots"]],
        key=lambda item: (-_severity_rank(item["severity"]), -_state_rank(item["state"]), item["title"]),
    )
    safe_limit = max(1, min(int(limit), 50))
    return {
        "schemaVersion": 1,
        "generatedAt": snapshots["generatedAt"],
        "source": snapshots["source"],
        "summary": {
            "attention": len([item for item in items if item["state"] != "done" and item["severity"] != "ready"]),
            "blocked": len([item for item in items if item["state"] in {"blocked", "gated"}]),
            "ready": len([item for item in items if item["severity"] == "ready"]),
            "executable": len([item for item in items if item["safeAction"]]),
        },
        "items": items[:safe_limit],
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


def _snapshot_to_operator_item(snapshot: Dict[str, Any]) -> Dict[str, Any]:
    latest_check = snapshot.get("latestCheck") if isinstance(snapshot.get("latestCheck"), dict) else None
    health = latest_check.get("checks", {}).get("health", {}) if latest_check else {}
    dashboard = latest_check.get("checks", {}).get("snapshot", {}) if latest_check else {}
    pressure = latest_check.get("pressure", {}) if latest_check else {}
    failed = latest_check is None or latest_check.get("status") != "passed"
    pressure_failed = pressure.get("status") == "failed"
    severity = "critical" if failed else "warning" if pressure_failed else "ready"
    state = "blocked" if failed else "review" if pressure_failed else "ready"
    pressure_detail = _pressure_detail(pressure)
    endpoint_detail = (
        f"health={health.get('status') or health.get('error') or 'missing'} {health.get('ms') or 0}ms; "
        f"snapshot={dashboard.get('status') or dashboard.get('error') or 'missing'} {dashboard.get('ms') or 0}ms"
    )
    return {
        "id": f"fleet-{snapshot['projectId']}",
        "kind": "incident" if failed else "action" if pressure_failed else "evidence",
        "title": f"{snapshot['label']} production snapshot",
        "source": "Fleet monitoring registry",
        "owner": snapshot["owner"],
        "severity": severity,
        "state": state,
        "whyItMatters": "Hermes daily operation depends on child-system health, freshness, and cheap dashboard snapshots matching production reality.",
        "nextAction": _next_action(failed, pressure_failed),
        "clearingProof": _clearing_proof(failed, pressure_failed),
        "evidence": f"{endpoint_detail}; {pressure_detail}",
        "safeAction": "dashboard:monitoring:check:strict",
        "requiresApproval": failed or pressure_failed,
        "updatedAt": latest_check.get("capturedAt") if latest_check else None,
        "route": _route_for_project(snapshot["projectId"]),
    }


def _pressure_detail(pressure: Dict[str, Any]) -> str:
    violations = pressure.get("violations") if isinstance(pressure.get("violations"), list) else []
    if not violations:
        return "health and snapshot are inside fleet pressure budget"
    return "; ".join(
        f"{violation.get('check')} {violation.get('actual')}/{violation.get('budget')}{violation.get('unit')}"
        for violation in violations
        if isinstance(violation, dict)
    )


def _next_action(failed: bool, pressure_failed: bool) -> str:
    if failed:
        return "Repair or re-run the production health and dashboard snapshot check; keep child-system actions gated until monitoring passes."
    if pressure_failed:
        return "Trim the endpoint payload or latency, then rerun the strict fleet pressure check."
    return "Keep monitoring on cadence; use drill-through only when this system needs attention."


def _clearing_proof(failed: bool, pressure_failed: bool) -> str:
    if failed:
        return "Strict fleet monitoring check passes with health and snapshot status 200."
    if pressure_failed:
        return "Strict fleet pressure check passes with no latency or payload violations."
    return "Latest fleet monitoring check is passing."


def _route_for_project(project_id: str) -> str:
    if project_id == "khashi-vc":
        return "/trading/khashi"
    if project_id == "investing-system":
        return "/trading/investing"
    return "/system/freshness"


def _severity_rank(severity: str) -> int:
    return {"critical": 4, "warning": 3, "info": 2, "ready": 1}.get(severity, 0)


def _state_rank(state: str) -> int:
    return {"blocked": 7, "gated": 6, "review": 5, "stale": 4, "assigned": 3, "queued": 2, "ready": 1}.get(state, 0)
