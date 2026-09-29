"""Unified operator queue contracts for dashboard and chat surfaces."""

from __future__ import annotations

import asyncio
from typing import Any, Dict, Iterable, Optional

from hermes_cli.fleet_monitoring import fleet_operator_queue
from hermes_cli.operating_runtime import connect, list_evidence


def operator_queue(limit: int = 12, include_system: bool = False) -> Dict[str, Any]:
    """Return the server-side answer to "what needs attention?"."""

    return _build_operator_queue(limit=limit, include_system=include_system, extra_items=[])


async def operator_queue_async(limit: int = 12, include_system: bool = False, include_trading: bool = False) -> Dict[str, Any]:
    """Async queue builder with optional bounded external aggregations."""

    extra_items: list[Dict[str, Any]] = []
    if include_trading:
        extra_items.extend(await _trading_items())
    return _build_operator_queue(limit=limit, include_system=include_system, extra_items=extra_items)


def _build_operator_queue(limit: int, include_system: bool, extra_items: list[Dict[str, Any]]) -> Dict[str, Any]:
    safe_limit = max(1, min(int(limit), 50))
    fleet = fleet_operator_queue(limit=50)
    conn = connect()
    try:
        runtime_items = [_runtime_evidence_to_item(record) for record in list_evidence(conn)]
    finally:
        conn.close()
    system_items = _system_summary_items() if include_system else []
    items = sorted(
        [*fleet["items"], *runtime_items, *system_items, *extra_items],
        key=lambda item: (-_severity_rank(item["severity"]), -_state_rank(item["state"]), item["title"]),
    )
    return {
        "schemaVersion": 1,
        "generatedAt": fleet["generatedAt"],
        "source": "fleet registry + operating runtime evidence"
        + (" + system summaries" if include_system else "")
        + (" + trading intelligence" if extra_items else ""),
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


def _system_summary_items() -> list[Dict[str, Any]]:
    from hermes_cli.system_operations import (
        credentials_summary,
        deployments_summary,
        freshness_summary,
        storage_summary,
        workers_summary,
    )
    from hermes_cli.system_warehouse import warehouse_summary

    specs = [
        ("system-storage", "Storage pressure", storage_summary, "/system/storage"),
        ("system-warehouse", "Warehouse posture", warehouse_summary, "/system/warehouse"),
        ("system-freshness", "Freshness posture", freshness_summary, "/system/freshness"),
        ("system-workers", "Worker posture", workers_summary, "/system/workers"),
        ("system-deployments", "Deployment posture", deployments_summary, "/system/deployments"),
        ("system-credentials", "Credential posture", credentials_summary, "/system/credentials"),
    ]
    items: list[Dict[str, Any]] = []
    for id_, title, loader, route in specs:
        try:
            summary = loader()
            items.append(_system_summary_to_item(id_, title, summary, route))
        except Exception as exc:
            items.append(
                {
                    "id": id_,
                    "kind": "incident",
                    "title": title,
                    "source": "System summary",
                    "owner": "Operations",
                    "severity": "critical",
                    "state": "blocked",
                    "whyItMatters": "Hermes needs this local system summary to decide whether operations are safe.",
                    "nextAction": "Repair the system summary loader and rerun the operator queue.",
                    "clearingProof": "The system summary loads successfully and reports ready/warning/critical health.",
                    "evidence": str(exc),
                    "safeAction": None,
                    "requiresApproval": True,
                    "updatedAt": None,
                    "route": route,
                }
            )
    return items


def _system_summary_to_item(id_: str, title: str, summary: Dict[str, Any], route: str) -> Dict[str, Any]:
    health = str(summary.get("health") or "warning")
    bad = health in {"critical", "blocked", "failed"}
    watch = health in {"warning", "partial", "watch", "unknown"}
    evidence = _compact_system_evidence(summary)
    return {
        "id": id_,
        "kind": "incident" if bad else "action" if watch else "evidence",
        "title": title,
        "source": "System summary",
        "owner": "Operations",
        "severity": "critical" if bad else "warning" if watch else "ready",
        "state": "blocked" if bad else "review" if watch else "ready",
        "whyItMatters": "System storage, freshness, workers, deployments, credentials, and warehouse posture decide whether Hermes can safely operate.",
        "nextAction": "Review the domain page and attach clearing proof for any warning or blocked state." if (bad or watch) else "Keep this posture on cadence.",
        "clearingProof": "Summary health returns ready and the domain page has no open breaches." if (bad or watch) else "Summary health is ready.",
        "evidence": evidence,
        "safeAction": None,
        "requiresApproval": bad,
        "updatedAt": summary.get("generatedAt"),
        "route": route,
    }


def _compact_system_evidence(summary: Dict[str, Any]) -> str:
    parts = [f"health={summary.get('health') or 'unknown'}"]
    details = summary.get("summary") if isinstance(summary.get("summary"), dict) else None
    if details:
        for key in ("failed", "blocked", "gated", "watch", "staleSources", "cleanupCandidates", "missing", "blockers"):
            if key in details:
                parts.append(f"{key}={details[key]}")
    slo = summary.get("slo") if isinstance(summary.get("slo"), dict) else None
    breaches = slo.get("breaches") if isinstance(slo, dict) else None
    if isinstance(breaches, list) and breaches:
        parts.append(f"breaches={len(breaches)}")
    return "; ".join(parts)


async def _trading_items() -> list[Dict[str, Any]]:
    try:
        from hermes_cli.trading_intelligence import trading_command_center

        command = await asyncio.wait_for(trading_command_center(limit=5), timeout=3)
    except Exception as exc:
        return [
            {
                "id": "trading-command-center-unavailable",
                "kind": "incident",
                "title": "Trading command center unavailable",
                "source": "Trading intelligence",
                "owner": "Trading systems",
                "severity": "critical",
                "state": "blocked",
                "whyItMatters": "Hermes needs broker/account and Khashi state to decide whether trading systems need attention.",
                "nextAction": "Check Investing/Khashi API base URLs, read tokens, and service health; keep trading actions gated.",
                "clearingProof": "Trading command center returns within the operator queue timeout.",
                "evidence": str(exc),
                "safeAction": None,
                "requiresApproval": True,
                "updatedAt": None,
                "route": "/trading/investing",
            }
        ]
    return _trading_command_to_items(command)


def _trading_command_to_items(command: Dict[str, Any]) -> list[Dict[str, Any]]:
    items: list[Dict[str, Any]] = []
    summary = command.get("summary") if isinstance(command.get("summary"), dict) else {}
    status = str(command.get("status") or "unknown")
    live_locked = command.get("liveTradingLocked") is not False
    capital_known = bool(summary.get("totalCapitalKnown"))
    cash_known = bool(summary.get("cashLeftKnown"))
    blocked = status in {"blocked", "unavailable"} or not live_locked
    watch = status in {"watch", "unknown"} or not capital_known or not cash_known
    items.append(
        {
            "id": "trading-account-visibility",
            "kind": "incident" if blocked else "action" if watch else "evidence",
            "title": "Trading account visibility",
            "source": "Trading intelligence",
            "owner": "Trading systems",
            "severity": "critical" if blocked else "warning" if watch else "ready",
            "state": "blocked" if blocked else "review" if watch else "ready",
            "whyItMatters": "Hermes needs current account, cash, buying power, risk, and live-lock state before recommending trading work.",
            "nextAction": "Connect or refresh broker/Khashi read-only sources until capital and cash coverage are known." if watch or blocked else "Keep broker and Khashi reads on cadence.",
            "clearingProof": "Trading command center reports known capital/cash coverage and liveTradingLocked remains true.",
            "evidence": (
                f"status={status}; liveTradingLocked={live_locked}; "
                f"capitalKnown={capital_known}; cashKnown={cash_known}; "
                f"openTrades={summary.get('openTrades')}; humanActionsRequired={summary.get('humanActionsRequired')}"
            ),
            "safeAction": None,
            "requiresApproval": blocked,
            "updatedAt": command.get("generatedAt"),
            "route": "/trading/investing",
        }
    )
    for action in command.get("actionQueue") or []:
        if not isinstance(action, dict):
            continue
        risk = str(action.get("risk") or action.get("riskLevel") or action.get("severity") or "medium")
        critical = risk in {"high", "critical"}
        items.append(
            {
                "id": f"trading-action-{action.get('id') or action.get('controlId') or len(items)}",
                "kind": "approval" if critical else "action",
                "title": str(action.get("title") or action.get("label") or "Trading action"),
                "source": "Trading intelligence",
                "owner": str(action.get("sourceProject") or "Trading systems"),
                "severity": "critical" if critical else "warning",
                "state": "gated" if critical else "review",
                "whyItMatters": "Trading actions can affect broker, strategy, or market-operation state and must stay governed.",
                "nextAction": str(action.get("recommendedAction") or "Review action and route through the project-owned control endpoint."),
                "clearingProof": "Action has explicit owner, approval level, result evidence, and rollback/no-op proof.",
                "evidence": f"risk={risk}; source={action.get('sourceProject') or 'unknown'}",
                "safeAction": None,
                "requiresApproval": critical,
                "updatedAt": command.get("generatedAt"),
                "route": "/trading/investing",
            }
        )
    return items


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
