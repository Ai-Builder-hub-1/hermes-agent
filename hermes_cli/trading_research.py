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


async def strategy_lifecycle_summary() -> dict[str, Any]:
    strategies, backtests = await strategy_summary(), await backtesting_summary()
    candidates = list(strategies.get("candidates") or [])
    runs = list(backtests.get("runs") or [])
    run_by_strategy = {str(run.get("strategyId")): run for run in runs}
    rows = [_strategy_lifecycle_row(candidate, run_by_strategy.get(str(candidate.get("id")))) for candidate in candidates]
    stage_order = {
        "idea": 0,
        "hypothesis": 1,
        "backtest": 2,
        "paper": 3,
        "shadow": 4,
        "review": 5,
        "promotion_candidate": 6,
        "active": 7,
        "paused": 8,
        "retired": 9,
    }
    rows.sort(key=lambda row: (stage_order.get(row["stage"], 99), row["sourceProject"], row["strategyId"]))
    blocked = [row for row in rows if row["state"] == "blocked"]
    review = [row for row in rows if row["state"] == "review"]
    ready = [row for row in rows if row["state"] == "ready"]
    return {
        "contractVersion": "trading-strategy-lifecycle.v1",
        "generatedAt": now_iso(),
        "health": "critical" if blocked else "warning" if review or not ready else "ready",
        "summary": {
            "strategies": len(rows),
            "ready": len(ready),
            "review": len(review),
            "blocked": len(blocked),
            "promotionCandidates": len([row for row in rows if row["stage"] == "promotion_candidate"]),
            "active": len([row for row in rows if row["stage"] == "active"]),
            "retired": len([row for row in rows if row["stage"] == "retired"]),
        },
        "stages": [
            {
                "id": stage,
                "label": stage.replace("_", " ").title(),
                "count": len([row for row in rows if row["stage"] == stage]),
                "blocked": len([row for row in rows if row["stage"] == stage and row["state"] == "blocked"]),
            }
            for stage in stage_order
        ],
        "strategies": rows,
        "blockers": _unique(
            blocker
            for row in rows
            for blocker in row.get("blockers", [])
        ),
        "recommendations": _unique(
            recommendation
            for row in rows
            for recommendation in row.get("nextActions", [])
        )[:12],
    }


def _strategy_lifecycle_row(candidate: dict[str, Any], run: dict[str, Any] | None) -> dict[str, Any]:
    evidence_count = int(candidate.get("evidenceCount") or 0)
    candidate_status = str(candidate.get("status") or "watch")
    backtest_status = str((run or {}).get("status") or "missing")
    stage = _strategy_lifecycle_stage(candidate_status, backtest_status, evidence_count)
    blockers = []
    if candidate_status == "blocked":
        blockers.append("Strategy source is blocked.")
    if evidence_count == 0:
        blockers.append("No strategy evidence rows are available.")
    if not run or backtest_status in {"waiting_for_data", "missing"}:
        blockers.append("Backtest proof is missing or waiting for data.")
    if (run or {}).get("datasetWindow") in {None, "", "missing"}:
        blockers.append("Dataset window is missing.")
    next_actions = []
    if evidence_count == 0:
        next_actions.append("Publish strategy evidence rows with falsification criteria.")
    if not run or backtest_status in {"waiting_for_data", "missing"}:
        next_actions.append("Run or ingest a backtest before promotion review.")
    if not blockers and stage in {"review", "promotion_candidate"}:
        next_actions.append("Record an operator review before any promotion.")
    state = "blocked" if blockers else "review" if stage in {"review", "promotion_candidate"} else "ready"
    return {
        "id": f"strategy-lifecycle-{candidate.get('id')}",
        "strategyId": str(candidate.get("id") or "unknown"),
        "sourceProject": str(candidate.get("sourceProject") or "unknown"),
        "hypothesis": str(candidate.get("hypothesis") or "Strategy candidate"),
        "stage": stage,
        "state": state,
        "evidenceCount": evidence_count,
        "backtestStatus": backtest_status,
        "promotionGate": str((run or {}).get("promotionGate") or candidate.get("promotionGate") or "source_adapter_required"),
        "winRate": candidate.get("winRate"),
        "expectancy": candidate.get("expectancy"),
        "maxDrawdown": candidate.get("maxDrawdown"),
        "datasetWindow": str((run or {}).get("datasetWindow") or "missing"),
        "falsificationCriteria": str(candidate.get("falsificationCriteria") or "Needs explicit falsification criteria."),
        "blockers": blockers,
        "nextActions": next_actions or ["Keep collecting evidence until the next lifecycle gate is ready."],
        "liveTradingLocked": True,
    }


def _strategy_lifecycle_stage(candidate_status: str, backtest_status: str, evidence_count: int) -> str:
    if candidate_status == "blocked":
        return "idea"
    if evidence_count == 0:
        return "hypothesis"
    if backtest_status in {"waiting_for_data", "missing"}:
        return "backtest"
    if backtest_status == "review":
        return "review"
    if candidate_status == "ready" and backtest_status == "passed":
        return "promotion_candidate"
    return "paper"


def _unique(values: Any) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        text = str(value)
        if text and text not in seen:
            seen.add(text)
            result.append(text)
    return result


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


def _runtime_evidence() -> list[dict[str, Any]]:
    try:
        from hermes_cli.operating_runtime import connect, list_evidence

        with connect() as conn:
            return list_evidence(conn, None)
    except Exception:
        return []


async def evidence_ledger(limit: int = 50) -> dict[str, Any]:
    from hermes_cli.trading_intelligence import trading_intelligence_events

    bounded = max(1, min(100, int(limit or 50)))
    strategies, backtests, events = await strategy_summary(), await backtesting_summary(), await trading_intelligence_events(bounded)
    rows: list[dict[str, Any]] = []
    for event in events.get("events") or []:
        rows.append({
            "id": str(event.get("id") or f"event-{len(rows)}"),
            "kind": "source_event",
            "sourceProject": str(event.get("sourceProject") or event.get("projectId") or "trading-source"),
            "subject": str(event.get("type") or event.get("title") or "Trading event"),
            "status": str(event.get("severity") or "info"),
            "occurredAt": str(event.get("occurredAt") or event.get("timestamp") or now_iso()),
            "proofHash": str(event.get("proofHash") or ""),
            "artifact": str(event.get("artifact") or ""),
            "detail": str(event.get("detail") or event.get("message") or "Source trading event."),
        })
    for candidate in strategies.get("candidates") or []:
        rows.append({
            "id": str(candidate["id"]),
            "kind": "strategy",
            "sourceProject": str(candidate["sourceProject"]),
            "subject": str(candidate["hypothesis"]),
            "status": str(candidate["status"]),
            "occurredAt": strategies["generatedAt"],
            "proofHash": "",
            "artifact": str(candidate["promotionGate"]),
            "detail": str(candidate["falsificationCriteria"]),
        })
    for run in backtests.get("runs") or []:
        rows.append({
            "id": str(run["id"]),
            "kind": "backtest",
            "sourceProject": str(run["sourceProject"]),
            "subject": str(run["strategyId"]),
            "status": str(run["status"]),
            "occurredAt": backtests["generatedAt"],
            "proofHash": "",
            "artifact": str(run["datasetWindow"]),
            "detail": str(run["failure"] or "; ".join(run.get("assumptions") or [])),
        })
    for record in _runtime_evidence()[:bounded]:
        subject = str(record.get("subject") or "")
        owner = str(record.get("owner") or "")
        if not any(token in f"{subject} {owner}".lower() for token in ("trading", "strategy", "backtest", "head trader", "khashi", "investing")):
            continue
        rows.append({
            "id": str(record.get("id") or f"runtime-{len(rows)}"),
            "kind": str(record.get("kind") or "runtime_evidence"),
            "sourceProject": owner or "runtime",
            "subject": subject or "Runtime evidence",
            "status": str(record.get("state") or "unknown"),
            "occurredAt": str(record.get("updated_at") or record.get("updatedAt") or now_iso()),
            "proofHash": str((record.get("payload") or {}).get("proofHash") or ""),
            "artifact": str((record.get("payload") or {}).get("artifact") or ""),
            "detail": str(record.get("detail") or "Runtime evidence record."),
        })
    rows.sort(key=lambda row: row["occurredAt"], reverse=True)
    missing_hashes = len([row for row in rows if not row["proofHash"]])
    return {
        "contractVersion": "trading-evidence-ledger.v1",
        "generatedAt": now_iso(),
        "health": "warning" if missing_hashes else "ready",
        "summary": {
            "records": len(rows[:bounded]),
            "sourceEvents": len([row for row in rows if row["kind"] == "source_event"]),
            "strategies": len([row for row in rows if row["kind"] == "strategy"]),
            "backtests": len([row for row in rows if row["kind"] == "backtest"]),
            "missingProofHashes": missing_hashes,
        },
        "records": rows[:bounded],
        "blockers": [f"{missing_hashes} evidence rows do not have proof hashes yet."] if missing_hashes else [],
        "recommendations": ["Add source-native artifact previews and proof hashes for promoted strategy/backtest evidence."] if missing_hashes else [],
    }


async def evidence_series(window: Window = "24h") -> dict[str, Any]:
    ledger = await evidence_ledger(100)
    return _series(window, max(int(ledger["summary"]["records"]), 1), ("records", "sourceEvents", "missingProofHashes"))


async def record_evidence_review() -> dict[str, Any]:
    ledger = await evidence_ledger(100)
    evidence = _record_action("Trading evidence review", "Trading evidence ledger review recorded. No trading action was executed.", ledger)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": ledger}
