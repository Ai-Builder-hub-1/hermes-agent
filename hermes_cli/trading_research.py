"""Trading strategy and backtest research contracts for the dashboard."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from uuid import uuid4

Window = Literal["1h", "24h", "7d", "30d"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _tone(status: str | None) -> str:
    lowered = str(status or "").lower()
    if lowered in {"ready", "passed", "approved", "paper-watch", "shadow-ready"}:
        return "ready"
    if lowered in {"failed", "blocked", "rejected"}:
        return "blocked"
    return "watch"


def _series(window: Window, seed: int, fields: tuple[str, ...]) -> dict[str, Any]:
    points_by_window = {"1h": 6, "24h": 12, "7d": 7, "30d": 15}
    step_by_window = {"1h": timedelta(minutes=10), "24h": timedelta(hours=2), "7d": timedelta(days=1), "30d": timedelta(days=2)}
    count = points_by_window.get(window, 12)
    step = step_by_window.get(window, timedelta(hours=2))
    end = datetime.now(timezone.utc)
    points: list[dict[str, Any]] = []
    for index in range(count):
        row: dict[str, Any] = {"timestamp": (end - step * (count - index - 1)).isoformat()}
        for offset, field in enumerate(fields):
            row[field] = max(0, int(seed * (0.45 + ((index + 1) / count) * 0.55) + (index % 4) * (offset + 1)))
        points.append(row)
    return {"generatedAt": now_iso(), "window": window, "historyStatus": "trading_research_inferred_series", "points": points}


async def strategy_summary() -> dict[str, Any]:
    from hermes_cli.trading_intelligence import trading_command_center

    command = await trading_command_center(20)
    strategy_rows = (command.get("strategies") or {}).get("rows") or []
    source_projects = command.get("sourceProjects") or []
    candidates = []
    for index, row in enumerate(strategy_rows):
        raw = row.get("raw") if isinstance(row.get("raw"), dict) else {}
        readiness = _tone(str(row.get("status") or raw.get("readiness") or "watch"))
        candidates.append({
            "id": str(row.get("id") or f"strategy-{index}"),
            "sourceProject": str(row.get("sourceProject") or "unknown"),
            "hypothesis": str(raw.get("hypothesis") or raw.get("name") or row.get("id") or "Strategy candidate"),
            "status": readiness,
            "expectedEdge": str(raw.get("expectedEdge") or raw.get("edge") or "unproven"),
            "falsificationCriteria": str(raw.get("falsificationCriteria") or raw.get("failureCase") or "Needs explicit falsification criteria."),
            "evidenceCount": int(row.get("scoredTrades") or raw.get("evidenceCount") or 0),
            "winRate": row.get("winRate"),
            "expectancy": row.get("expectancy"),
            "maxDrawdown": row.get("maxDrawdown"),
            "promotionGate": "backtest_required" if readiness != "ready" else "operator_review",
        })
    if not candidates:
        for project in source_projects:
            candidates.append({
                "id": f"{project.get('projectId')}-strategy-backlog",
                "sourceProject": str(project.get("projectId") or "unknown"),
                "hypothesis": "No source strategy rows have been published yet.",
                "status": "watch" if project.get("available") else "blocked",
                "expectedEdge": "unknown",
                "falsificationCriteria": "Publish strategy-quality rows with evidence, edge, and failure cases.",
                "evidenceCount": 0,
                "winRate": None,
                "expectancy": None,
                "maxDrawdown": None,
                "promotionGate": "source_adapter_required",
            })
    blocked = [item for item in candidates if item["status"] == "blocked"]
    ready = [item for item in candidates if item["status"] == "ready"]
    return {
        "contractVersion": "trading-strategy-research.v1",
        "generatedAt": now_iso(),
        "health": "critical" if blocked else "warning" if not ready else "ready",
        "summary": {
            "candidates": len(candidates),
            "ready": len(ready),
            "watch": len(candidates) - len(ready) - len(blocked),
            "blocked": len(blocked),
            "sourceProjects": len(source_projects),
        },
        "candidates": candidates,
        "sourceCoverage": [
            {
                "projectId": str(project.get("projectId") or "unknown"),
                "label": str(project.get("label") or project.get("projectId") or "Unknown project"),
                "available": bool(project.get("available")),
                "status": str(project.get("status") or "unknown"),
                "blockers": list(project.get("blockers") or []),
            }
            for project in source_projects
        ],
        "recommendations": command.get("recommendations") or [],
        "blockers": command.get("blockers") or [],
    }


async def strategy_series(window: Window = "24h") -> dict[str, Any]:
    summary = await strategy_summary()
    return _series(window, max(int(summary["summary"]["candidates"]), 1), ("candidates", "ready", "blocked"))


async def backtesting_summary() -> dict[str, Any]:
    strategies = await strategy_summary()
    runs = []
    for candidate in strategies["candidates"]:
        evidence_count = int(candidate.get("evidenceCount") or 0)
        ready = candidate.get("status") == "ready"
        runs.append({
            "id": f"{candidate['id']}-backtest",
            "strategyId": candidate["id"],
            "sourceProject": candidate["sourceProject"],
            "datasetWindow": "source-defined" if evidence_count else "missing",
            "status": "passed" if ready else "waiting_for_data" if evidence_count == 0 else "review",
            "assumptions": ["fees/slippage required", "dataset window required", "survivorship bias review required"],
            "trades": evidence_count,
            "winRate": candidate.get("winRate"),
            "expectancy": candidate.get("expectancy"),
            "maxDrawdown": candidate.get("maxDrawdown"),
            "failure": "" if ready else "Backtest proof is not sufficient for promotion.",
            "promotionGate": "operator_review" if ready else "backtest_evidence_required",
        })
    failed = [run for run in runs if run["status"] not in {"passed", "review"}]
    passed = [run for run in runs if run["status"] == "passed"]
    return {
        "contractVersion": "trading-backtesting.v1",
        "generatedAt": now_iso(),
        "health": "critical" if failed else "warning" if not passed else "ready",
        "summary": {
            "runs": len(runs),
            "passed": len(passed),
            "review": len([run for run in runs if run["status"] == "review"]),
            "blocked": len(failed),
        },
        "runs": runs,
        "comparison": {
            "bestCandidate": next((run["strategyId"] for run in runs if run["status"] == "passed"), ""),
            "coverage": "source_strategy_rows" if runs and any(run["trades"] for run in runs) else "readiness_inferred",
        },
        "blockers": strategies.get("blockers") or [],
        "recommendations": strategies.get("recommendations") or [],
    }


async def backtesting_series(window: Window = "24h") -> dict[str, Any]:
    summary = await backtesting_summary()
    return _series(window, max(int(summary["summary"]["runs"]), 1), ("runs", "passed", "blocked"))


def _record_action(subject: str, detail: str, payload: dict[str, Any]) -> dict[str, Any]:
    from hermes_cli.operating_runtime import connect, upsert_evidence

    with connect() as conn:
        return upsert_evidence(
            conn,
            id=f"trading-{subject.lower().replace(' ', '-')}-{uuid4().hex[:10]}",
            kind="catalog",
            subject=subject,
            state="ready",
            owner="Trading Research",
            detail=detail,
            payload=payload,
        )


async def record_strategy_review() -> dict[str, Any]:
    summary = await strategy_summary()
    evidence = _record_action("Strategy review", "Strategy candidate review recorded. No trading action was executed.", summary)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}


async def record_backtest_review() -> dict[str, Any]:
    summary = await backtesting_summary()
    evidence = _record_action("Backtest review", "Backtest readiness review recorded. No promotion was executed.", summary)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}
