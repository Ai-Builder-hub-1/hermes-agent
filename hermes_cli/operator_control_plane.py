"""Unified operator queue contracts for dashboard and chat surfaces."""

from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from hermes_cli.fleet_monitoring import fleet_operator_queue
from hermes_cli.operating_runtime import connect, list_evidence


def operator_queue(limit: int = 12) -> Dict[str, Any]:
    """Return the server-side answer to "what needs attention?"."""

    safe_limit = max(1, min(int(limit), 50))
    fleet = fleet_operator_queue(limit=50)
    conn = connect()
    try:
        runtime_items = [_runtime_evidence_to_item(record) for record in list_evidence(conn)]
    finally:
        conn.close()
    items = sorted(
        [*fleet["items"], *runtime_items],
        key=lambda item: (-_severity_rank(item["severity"]), -_state_rank(item["state"]), item["title"]),
    )
    return {
        "schemaVersion": 1,
        "generatedAt": fleet["generatedAt"],
        "source": "fleet registry + operating runtime evidence",
        "summary": _summary(items),
        "items": items[:safe_limit],
    }


def _runtime_evidence_to_item(record: Dict[str, Any]) -> Dict[str, Any]:
    bad = record["state"] in {"blocked", "gated", "warning", "failed"}
    severity = "critical" if record["state"] in {"failed", "blocked"} else "warning" if bad else "ready"
    state = (
        "blocked"
        if record["state"] == "failed"
        else "review"
        if record["state"] == "warning"
        else "ready"
        if record["state"] in {"stored", "allowed"}
        else record["state"]
    )
    return {
        "id": f"runtime-{record['id']}",
        "kind": "evidence",
        "title": record["subject"],
        "source": f"Runtime evidence / {record['kind']}",
        "owner": record["owner"],
        "severity": severity,
        "state": state,
        "whyItMatters": record["detail"],
        "nextAction": "Review the evidence and either attach clearing proof or keep it gated." if bad else "Use as supporting proof for related operating work.",
        "clearingProof": "A fresh evidence record must show ready/stored/allowed before this stops needing attention." if bad else "Evidence is currently acceptable.",
        "evidence": record["detail"],
        "safeAction": None,
        "requiresApproval": bad,
        "updatedAt": record.get("updatedAt") or record.get("updated_at"),
        "route": _route_for_runtime_kind(record["kind"]),
    }


def _summary(items: Iterable[Dict[str, Any]]) -> Dict[str, int]:
    materialized = list(items)
    return {
        "attention": len([item for item in materialized if item["state"] != "done" and item["severity"] != "ready"]),
        "blocked": len([item for item in materialized if item["state"] in {"blocked", "gated"}]),
        "ready": len([item for item in materialized if item["severity"] == "ready"]),
        "executable": len([item for item in materialized if item["safeAction"]]),
    }


def _route_for_runtime_kind(kind: str) -> Optional[str]:
    if kind in {"registry", "telemetry", "quality"}:
        return "/system/freshness"
    if kind in {"deployment", "incident"}:
        return "/operate/incidents"
    if kind in {"permission", "autonomy"}:
        return "/operate/approvals"
    if kind in {"finance", "catalog"}:
        return "/system/warehouse"
    return "/operate"


def _severity_rank(severity: str) -> int:
    return {"critical": 4, "warning": 3, "info": 2, "ready": 1}.get(severity, 0)


def _state_rank(state: str) -> int:
    return {"blocked": 7, "gated": 6, "review": 5, "stale": 4, "assigned": 3, "queued": 2, "ready": 1}.get(state, 0)
