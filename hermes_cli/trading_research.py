"""Trading strategy and backtest research contracts for the dashboard."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
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


def _proof_hash(*parts: Any) -> str:
    material = "|".join(str(part) for part in parts if part is not None)
    return hashlib.sha256(material.encode("utf-8")).hexdigest()[:16] if material else ""


def _artifact_uri(source_project: str, artifact_type: str, item_id: str) -> str:
    safe_project = str(source_project or "unknown").replace(" ", "-").lower()
    safe_id = str(item_id or "unknown").replace(" ", "-").lower()
    return f"trading://{safe_project}/{artifact_type}/{safe_id}"


def _safe_ref(value: Any) -> str:
    return "".join(char if char.isalnum() or char in {"-", "_", "."} else "-" for char in str(value or "unknown").lower()).strip("-") or "unknown"


def _trading_tables() -> set[str]:
    return {
        "trading_strategy_artifacts",
        "trading_backtest_artifacts",
        "trading_falsification_outcomes",
        "trading_strategy_observations",
    }


def _trading_rows(table: str, limit: int = 100) -> list[dict[str, Any]]:
    if table not in _trading_tables():
        return []
    try:
        from hermes_cli.operating_runtime import connect

        with connect() as conn:
            rows = conn.execute(
                f"SELECT * FROM {table} ORDER BY recorded_at DESC LIMIT ?",
                (max(1, min(int(limit or 100), 500)),),
            ).fetchall()
            records: list[dict[str, Any]] = []
            for row in rows:
                record = dict(row)
                payload = record.get("payload")
                if isinstance(payload, str):
                    try:
                        record["payload"] = json.loads(payload)
                    except json.JSONDecodeError:
                        record["payload"] = {}
                records.append(record)
            return records
    except Exception:
        return []


def _upsert_trading_record(table: str, record: dict[str, Any]) -> None:
    if table not in _trading_tables():
        return
    from hermes_cli.operating_runtime import connect

    row = dict(record)
    row["payload"] = json.dumps(row.get("payload") or {}, sort_keys=True, default=str)
    row.setdefault("recorded_at", now_iso())
    columns = list(row)
    placeholders = ", ".join("?" for _ in columns)
    updates = ", ".join(f"{column} = excluded.{column}" for column in columns if column != "id")
    with connect() as conn:
        conn.execute(
            f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES ({placeholders})
            ON CONFLICT(id) DO UPDATE SET {updates}
            """,
            [row[column] for column in columns],
        )
        conn.commit()


def _write_trading_artifact(kind: str, item_id: str, payload: dict[str, Any]) -> str:
    from hermes_cli.system_warehouse import _record_object_inventory, _write_artifact

    relative_path = f"trading/{_safe_ref(kind)}/{_safe_ref(item_id)}.json"
    artifact_ref = _write_artifact(relative_path, payload)
    _record_object_inventory(Path(artifact_ref).parent, provider="local-artifact-store", source_system="trading-research", retention_class="strategy-proof")
    return artifact_ref


def _source_backbone_item(
    *,
    item_id: str,
    label: str,
    status: str,
    source_native_enough: bool,
    evidence: list[str],
    missing: list[str],
    next_action: str,
) -> dict[str, Any]:
    return {
        "id": item_id,
        "label": label,
        "status": status,
        "sourceNativeEnough": source_native_enough,
        "evidence": evidence,
        "missing": missing,
        "nextAction": next_action,
    }


def _assumption_registry(raw: dict[str, Any], *, default_source: str) -> list[dict[str, Any]]:
    raw_assumptions = raw.get("assumptions") or raw.get("assumptionRegistry") or []
    rows: list[dict[str, Any]] = []
    if isinstance(raw_assumptions, list):
        for index, item in enumerate(raw_assumptions):
            if isinstance(item, dict):
                text = str(item.get("text") or item.get("assumption") or item.get("name") or "").strip()
                status = str(item.get("status") or "untested")
                source = str(item.get("source") or default_source)
            else:
                text = str(item).strip()
                status = "untested"
                source = default_source
            if text:
                rows.append({"id": f"assumption-{index + 1}", "text": text, "status": status, "source": source})
    if rows:
        return rows
    return [
        {"id": "assumption-fees-slippage", "text": "Fees and slippage are explicitly modeled.", "status": "required", "source": default_source},
        {"id": "assumption-dataset-window", "text": "Dataset window is declared and repeatable.", "status": "required", "source": default_source},
        {"id": "assumption-bias-review", "text": "Survivorship, lookahead, and selection bias are reviewed.", "status": "required", "source": default_source},
    ]


def _assumption_status(assumptions: list[dict[str, Any]]) -> str:
    statuses = {str(item.get("status") or "").lower() for item in assumptions}
    if statuses and statuses <= {"tested", "accepted", "ready"}:
        return "ready"
    if "failed" in statuses or "blocked" in statuses:
        return "blocked"
    return "review"


def _falsification_status(raw: dict[str, Any], criteria: str, evidence_count: int) -> str:
    explicit = str(raw.get("falsificationStatus") or raw.get("falsification_status") or "").strip()
    if explicit:
        return explicit
    if not criteria or "needs explicit" in criteria.lower():
        return "missing"
    return "testable" if evidence_count else "criteria_without_data"


async def strategy_summary() -> dict[str, Any]:
    from hermes_cli.trading_intelligence import trading_command_center

    command = await trading_command_center(20)
    strategy_rows = (command.get("strategies") or {}).get("rows") or []
    source_projects = command.get("sourceProjects") or []
    candidates = []
    for index, row in enumerate(strategy_rows):
        raw = row.get("raw") if isinstance(row.get("raw"), dict) else {}
        readiness = _tone(str(row.get("status") or raw.get("readiness") or "watch"))
        item_id = str(row.get("id") or f"strategy-{index}")
        source_project = str(row.get("sourceProject") or "unknown")
        criteria = str(raw.get("falsificationCriteria") or raw.get("failureCase") or "Needs explicit falsification criteria.")
        evidence_count = int(row.get("scoredTrades") or raw.get("evidenceCount") or 0)
        assumptions = _assumption_registry(raw, default_source=source_project)
        candidates.append({
            "id": item_id,
            "sourceProject": source_project,
            "hypothesis": str(raw.get("hypothesis") or raw.get("name") or row.get("id") or "Strategy candidate"),
            "status": readiness,
            "expectedEdge": str(raw.get("expectedEdge") or raw.get("edge") or "unproven"),
            "falsificationCriteria": criteria,
            "falsificationStatus": _falsification_status(raw, criteria, evidence_count),
            "assumptions": assumptions,
            "assumptionStatus": _assumption_status(assumptions),
            "sourceArtifact": str(raw.get("artifact") or raw.get("artifactUri") or _artifact_uri(source_project, "strategy", item_id)),
            "proofHash": str(raw.get("proofHash") or _proof_hash(source_project, item_id, criteria, evidence_count)),
            "decisionCloseout": str(raw.get("decisionCloseout") or raw.get("closeout") or "operator_review_required"),
            "evidenceCount": evidence_count,
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
                "falsificationStatus": "missing",
                "assumptions": _assumption_registry({}, default_source=str(project.get("projectId") or "unknown")),
                "assumptionStatus": "review",
                "sourceArtifact": _artifact_uri(str(project.get("projectId") or "unknown"), "strategy", "backlog"),
                "proofHash": "",
                "decisionCloseout": "source_adapter_required",
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
    return _backtesting_from_strategies(strategies)


def _backtesting_from_strategies(strategies: dict[str, Any]) -> dict[str, Any]:
    runs = []
    for candidate in strategies["candidates"]:
        evidence_count = int(candidate.get("evidenceCount") or 0)
        ready = candidate.get("status") == "ready"
        assumptions = list(candidate.get("assumptions") or [])
        run_id = f"{candidate['id']}-backtest"
        dataset_window = "source-defined" if evidence_count else "missing"
        runs.append({
            "id": run_id,
            "strategyId": candidate["id"],
            "sourceProject": candidate["sourceProject"],
            "datasetWindow": dataset_window,
            "status": "passed" if ready else "waiting_for_data" if evidence_count == 0 else "review",
            "assumptions": [str(item.get("text") or item) for item in assumptions] or ["fees/slippage required", "dataset window required", "survivorship bias review required"],
            "assumptionRegistry": assumptions,
            "assumptionStatus": str(candidate.get("assumptionStatus") or "review"),
            "trades": evidence_count,
            "winRate": candidate.get("winRate"),
            "expectancy": candidate.get("expectancy"),
            "maxDrawdown": candidate.get("maxDrawdown"),
            "failure": "" if ready else "Backtest proof is not sufficient for promotion.",
            "sourceArtifact": _artifact_uri(str(candidate["sourceProject"]), "backtest", run_id),
            "proofHash": _proof_hash(candidate["id"], dataset_window, evidence_count, candidate.get("winRate"), candidate.get("expectancy")),
            "comparisonKey": f"{candidate['sourceProject']}::{candidate['id']}",
            "decisionCloseout": "operator_review_required" if ready else "backtest_evidence_required",
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
            "persisted": True,
            "comparisonHash": _proof_hash(*[run["comparisonKey"] for run in runs]),
        },
        "blockers": strategies.get("blockers") or [],
        "recommendations": strategies.get("recommendations") or [],
    }


async def backtesting_series(window: Window = "24h") -> dict[str, Any]:
    summary = await backtesting_summary()
    return _series(window, max(int(summary["summary"]["runs"]), 1), ("runs", "passed", "blocked"))


async def strategy_lifecycle_summary() -> dict[str, Any]:
    strategies = await strategy_summary()
    backtests = _backtesting_from_strategies(strategies)
    return _strategy_lifecycle_from_components(strategies, backtests)


def _strategy_lifecycle_from_components(strategies: dict[str, Any], backtests: dict[str, Any]) -> dict[str, Any]:
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
        "falsificationStatus": str(candidate.get("falsificationStatus") or "missing"),
        "assumptionStatus": str((run or {}).get("assumptionStatus") or candidate.get("assumptionStatus") or "review"),
        "sourceArtifact": str((run or {}).get("sourceArtifact") or candidate.get("sourceArtifact") or ""),
        "proofHash": str((run or {}).get("proofHash") or candidate.get("proofHash") or ""),
        "decisionCloseout": str((run or {}).get("decisionCloseout") or candidate.get("decisionCloseout") or "operator_review_required"),
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


def trading_source_backbone_audit() -> dict[str, Any]:
    """Audit local source-native proof rows for Group 2 trading maturity."""

    strategy_artifacts = _trading_rows("trading_strategy_artifacts")
    backtest_artifacts = _trading_rows("trading_backtest_artifacts")
    falsification_outcomes = _trading_rows("trading_falsification_outcomes")
    observations = _trading_rows("trading_strategy_observations")

    items = [
        _source_backbone_item(
            item_id="strategy-source-artifacts",
            label="Strategy source artifacts",
            status="ready" if strategy_artifacts else "missing",
            source_native_enough=bool(strategy_artifacts),
            evidence=[str(row.get("artifact_ref") or row.get("id")) for row in strategy_artifacts[:6]],
            missing=[] if strategy_artifacts else ["trading_strategy_artifacts rows with artifact refs, hypotheses, proof hashes, and falsification criteria"],
            next_action="Record a strategy review or ingest Khashi/Investing strategy artifacts.",
        ),
        _source_backbone_item(
            item_id="backtest-report-artifacts",
            label="Backtest report artifacts and datasets",
            status="ready" if backtest_artifacts else "missing",
            source_native_enough=bool(backtest_artifacts),
            evidence=[str(row.get("artifact_ref") or row.get("id")) for row in backtest_artifacts[:6]],
            missing=[] if backtest_artifacts else ["trading_backtest_artifacts rows with dataset window, metrics, artifact refs, and proof hashes"],
            next_action="Record a backtest review or ingest project-authored backtest reports.",
        ),
        _source_backbone_item(
            item_id="falsification-outcomes",
            label="Source-authored falsification outcomes",
            status="ready" if falsification_outcomes else "missing",
            source_native_enough=bool(falsification_outcomes),
            evidence=[str(row.get("evidence_ref") or row.get("id")) for row in falsification_outcomes[:6]],
            missing=[] if falsification_outcomes else ["trading_falsification_outcomes rows with criteria, observed status, outcome, evidence ref, and proof hash"],
            next_action="Record falsification state from strategy reviews or project-owned outcomes.",
        ),
        _source_backbone_item(
            item_id="strategy-observation-closeouts",
            label="Paper/shadow/promotion observation closeouts",
            status="ready" if observations else "missing",
            source_native_enough=bool(observations),
            evidence=[str(row.get("artifact_ref") or row.get("id")) for row in observations[:6]],
            missing=[] if observations else ["trading_strategy_observations rows with mode, status, decision closeout, artifact ref, and proof hash"],
            next_action="Record evidence/outcome reviews or ingest observed paper/shadow/promotion closeouts.",
        ),
    ]
    ready = len([item for item in items if item["status"] == "ready"])
    partial = len([item for item in items if item["status"] == "partial"])
    missing = len([item for item in items if item["status"] == "missing"])
    source_native_enough = all(item["sourceNativeEnough"] for item in items)
    return {
        "contractVersion": "trading-source-backbone-audit.v1",
        "generatedAt": now_iso(),
        "summary": {
            "categories": len(items),
            "ready": ready,
            "partial": partial,
            "missing": missing,
            "sourceNativeEnough": source_native_enough,
            "posture": "sufficient" if source_native_enough else "needs_local_proof",
        },
        "items": items,
        "recommendations": [] if source_native_enough else [item["nextAction"] for item in items if not item["sourceNativeEnough"]],
    }


def _persist_strategy_artifacts(summary: dict[str, Any]) -> None:
    generated_at = str(summary.get("generatedAt") or now_iso())
    for candidate in summary.get("candidates") or []:
        if not isinstance(candidate, dict):
            continue
        strategy_id = str(candidate.get("id") or "unknown")
        source_project = str(candidate.get("sourceProject") or "unknown")
        artifact_payload = {
            "contractVersion": "trading-strategy-artifact.v1",
            "generatedAt": generated_at,
            "candidate": candidate,
            "liveTradingLocked": True,
        }
        artifact_ref = _write_trading_artifact("strategies", f"{source_project}-{strategy_id}", artifact_payload)
        proof_hash = str(candidate.get("proofHash") or _proof_hash(source_project, strategy_id, candidate.get("falsificationCriteria")))
        _upsert_trading_record(
            "trading_strategy_artifacts",
            {
                "id": f"strategy-artifact-{_safe_ref(source_project)}-{_safe_ref(strategy_id)}",
                "source_project": source_project,
                "strategy_id": strategy_id,
                "artifact_ref": artifact_ref,
                "proof_hash": proof_hash,
                "hypothesis": str(candidate.get("hypothesis") or ""),
                "falsification_criteria": str(candidate.get("falsificationCriteria") or ""),
                "created_at": generated_at,
                "payload": artifact_payload,
            },
        )
        _upsert_trading_record(
            "trading_falsification_outcomes",
            {
                "id": f"falsification-{_safe_ref(source_project)}-{_safe_ref(strategy_id)}",
                "strategy_id": strategy_id,
                "source_project": source_project,
                "status": str(candidate.get("falsificationStatus") or "unknown"),
                "criteria": str(candidate.get("falsificationCriteria") or ""),
                "outcome": str(candidate.get("decisionCloseout") or "operator_review_required"),
                "evidence_ref": artifact_ref,
                "proof_hash": proof_hash,
                "observed_at": generated_at,
                "payload": {"source": "strategy-review", "candidate": candidate, "liveTradingLocked": True},
            },
        )


def _persist_backtest_artifacts(summary: dict[str, Any]) -> None:
    generated_at = str(summary.get("generatedAt") or now_iso())
    for run in summary.get("runs") or []:
        if not isinstance(run, dict):
            continue
        run_id = str(run.get("id") or "unknown")
        strategy_id = str(run.get("strategyId") or "unknown")
        source_project = str(run.get("sourceProject") or "unknown")
        artifact_payload = {
            "contractVersion": "trading-backtest-artifact.v1",
            "generatedAt": generated_at,
            "run": run,
            "comparison": summary.get("comparison") or {},
            "liveTradingLocked": True,
        }
        artifact_ref = _write_trading_artifact("backtests", f"{source_project}-{run_id}", artifact_payload)
        proof_hash = str(run.get("proofHash") or _proof_hash(strategy_id, run_id, run.get("datasetWindow")))
        _upsert_trading_record(
            "trading_backtest_artifacts",
            {
                "id": f"backtest-artifact-{_safe_ref(source_project)}-{_safe_ref(run_id)}",
                "source_project": source_project,
                "strategy_id": strategy_id,
                "run_id": run_id,
                "dataset_window": str(run.get("datasetWindow") or ""),
                "artifact_ref": artifact_ref,
                "proof_hash": proof_hash,
                "trades": int(run.get("trades") or 0),
                "win_rate": run.get("winRate"),
                "expectancy": run.get("expectancy"),
                "max_drawdown": run.get("maxDrawdown"),
                "status": str(run.get("status") or "unknown"),
                "payload": artifact_payload,
            },
        )


def _persist_observation_records(ledger: dict[str, Any], *, source: str) -> None:
    generated_at = str(ledger.get("generatedAt") or now_iso())
    for record in ledger.get("records") or []:
        if not isinstance(record, dict):
            continue
        kind = str(record.get("kind") or "evidence")
        if kind not in {"strategy", "backtest", "source_event", "catalog", "runtime_evidence"}:
            continue
        record_id = str(record.get("id") or uuid4().hex)
        strategy_id = str(record.get("subject") if kind == "backtest" else record.get("id") or record.get("subject") or "unknown")
        source_project = str(record.get("sourceProject") or "unknown")
        decision_closeout = str(record.get("decisionCloseout") or "not_observed")
        artifact_payload = {
            "contractVersion": "trading-observation-closeout.v1",
            "generatedAt": generated_at,
            "source": source,
            "record": record,
            "liveTradingLocked": True,
        }
        artifact_ref = _write_trading_artifact("observations", f"{source_project}-{record_id}-{source}", artifact_payload)
        proof_hash = str(record.get("proofHash") or _proof_hash(source_project, record_id, decision_closeout))
        _upsert_trading_record(
            "trading_strategy_observations",
            {
                "id": f"observation-{_safe_ref(source_project)}-{_safe_ref(record_id)}-{_safe_ref(source)}",
                "strategy_id": strategy_id,
                "source_project": source_project,
                "mode": "not_observed" if decision_closeout == "not_observed" else kind,
                "status": str(record.get("status") or "unknown"),
                "decision_closeout": decision_closeout,
                "artifact_ref": artifact_ref,
                "proof_hash": proof_hash,
                "observed_at": str(record.get("occurredAt") or generated_at),
                "payload": artifact_payload,
            },
        )


async def record_strategy_review() -> dict[str, Any]:
    summary = await strategy_summary()
    _persist_strategy_artifacts(summary)
    evidence = _record_action("Strategy review", "Strategy candidate review recorded. No trading action was executed.", summary)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary, "sourceBackbone": trading_source_backbone_audit()}


async def record_backtest_review() -> dict[str, Any]:
    summary = await backtesting_summary()
    _persist_backtest_artifacts(summary)
    evidence = _record_action("Backtest review", "Backtest readiness review recorded. No promotion was executed.", summary)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary, "sourceBackbone": trading_source_backbone_audit()}


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
            "artifactPreview": str(event.get("artifactPreview") or event.get("message") or event.get("detail") or "Source trading event."),
            "decisionCloseout": str(event.get("decisionCloseout") or "not_observed"),
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
            "proofHash": str(candidate.get("proofHash") or ""),
            "artifact": str(candidate.get("sourceArtifact") or candidate["promotionGate"]),
            "artifactPreview": str(candidate.get("hypothesis") or ""),
            "decisionCloseout": str(candidate.get("decisionCloseout") or "operator_review_required"),
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
            "proofHash": str(run.get("proofHash") or ""),
            "artifact": str(run.get("sourceArtifact") or run["datasetWindow"]),
            "artifactPreview": f"dataset={run.get('datasetWindow')}; assumptions={len(run.get('assumptionRegistry') or run.get('assumptions') or [])}",
            "decisionCloseout": str(run.get("decisionCloseout") or "backtest_evidence_required"),
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
            "artifactPreview": str((record.get("payload") or {}).get("artifactPreview") or record.get("detail") or "Runtime evidence record."),
            "decisionCloseout": str((record.get("payload") or {}).get("decisionCloseout") or "runtime_evidence"),
            "detail": str(record.get("detail") or "Runtime evidence record."),
        })
    rows.sort(key=lambda row: row["occurredAt"], reverse=True)
    missing_hashes = len([row for row in rows if not row["proofHash"]])
    source_backbone = trading_source_backbone_audit()
    return {
        "contractVersion": "trading-evidence-ledger.v1",
        "generatedAt": now_iso(),
        "health": "warning" if missing_hashes or not source_backbone["summary"]["sourceNativeEnough"] else "ready",
        "summary": {
            "records": len(rows[:bounded]),
            "sourceEvents": len([row for row in rows if row["kind"] == "source_event"]),
            "strategies": len([row for row in rows if row["kind"] == "strategy"]),
            "backtests": len([row for row in rows if row["kind"] == "backtest"]),
            "missingProofHashes": missing_hashes,
            "sourceBackboneReady": source_backbone["summary"]["ready"],
            "sourceBackboneCategories": source_backbone["summary"]["categories"],
            "sourceNativeEnough": source_backbone["summary"]["sourceNativeEnough"],
        },
        "sourceBackbone": source_backbone,
        "records": rows[:bounded],
        "blockers": ([f"{missing_hashes} evidence rows do not have proof hashes yet."] if missing_hashes else [])
        + ([] if source_backbone["summary"]["sourceNativeEnough"] else ["Trading source backbone is missing durable local proof rows."]),
        "recommendations": (["Add source-native artifact previews and proof hashes for promoted strategy/backtest evidence."] if missing_hashes else [])
        + list(source_backbone.get("recommendations") or []),
    }


async def evidence_series(window: Window = "24h") -> dict[str, Any]:
    ledger = await evidence_ledger(100)
    return _series(window, max(int(ledger["summary"]["records"]), 1), ("records", "sourceEvents", "missingProofHashes"))


async def record_evidence_review() -> dict[str, Any]:
    ledger = await evidence_ledger(100)
    _persist_observation_records(ledger, source="evidence-review")
    evidence = _record_action("Trading evidence review", "Trading evidence ledger review recorded. No trading action was executed.", ledger)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": ledger, "sourceBackbone": trading_source_backbone_audit()}


async def outcome_learning_summary() -> dict[str, Any]:
    strategies, ledger = await asyncio.gather(
        strategy_summary(),
        evidence_ledger(100),
    )
    backtests = _backtesting_from_strategies(strategies)
    lifecycle = _strategy_lifecycle_from_components(strategies, backtests)
    lifecycle_summary = lifecycle.get("summary", {})
    backtest_summary = backtests.get("summary", {})
    evidence_summary = ledger.get("summary", {})
    strategies = int(lifecycle_summary.get("strategies") or 0)
    blocked = int(lifecycle_summary.get("blocked") or 0)
    review = int(lifecycle_summary.get("review") or 0)
    passed = int(backtest_summary.get("passed") or 0)
    runs = int(backtest_summary.get("runs") or 0)
    missing_hashes = int(evidence_summary.get("missingProofHashes") or 0)
    records = int(evidence_summary.get("records") or 0)
    reliability_score = max(0, min(100, 100 - blocked * 25 - review * 10 - missing_hashes * 2 - max(0, runs - passed) * 8))
    calibration = "ready" if reliability_score >= 80 and passed else "watch" if reliability_score >= 50 else "blocked"
    tasks = []
    if blocked:
        tasks.append(_research_task("unblock-strategy-lifecycle", "Resolve blocked strategy lifecycle rows", "critical", lifecycle.get("blockers") or []))
    if runs and passed == 0:
        tasks.append(_research_task("backtest-outcome-baseline", "Produce at least one passed backtest baseline", "high", backtests.get("blockers") or []))
    if missing_hashes:
        tasks.append(_research_task("proof-hash-coverage", "Attach proof hashes to promoted strategy and backtest evidence", "medium", ledger.get("blockers") or []))
    if not tasks:
        tasks.append(_research_task("cadence-review", "Keep outcome learning review on cadence", "low", ["No current outcome-learning blockers."]))
    return {
        "contractVersion": "trading-outcome-learning.v1",
        "generatedAt": now_iso(),
        "health": "ready" if calibration == "ready" else "warning" if calibration == "watch" else "critical",
        "summary": {
            "strategies": strategies,
            "backtestRuns": runs,
            "passedBacktests": passed,
            "evidenceRecords": records,
            "missingProofHashes": missing_hashes,
            "reliabilityScore": reliability_score,
            "calibration": calibration,
        },
        "signals": [
            {"id": "strategy-lifecycle", "status": lifecycle.get("health"), "detail": f"blocked={blocked}; review={review}; strategies={strategies}"},
            {"id": "backtest-outcomes", "status": backtests.get("health"), "detail": f"passed={passed}; runs={runs}; blocked={backtest_summary.get('blocked')}"},
            {"id": "evidence-ledger", "status": ledger.get("health"), "detail": f"records={records}; missingProofHashes={missing_hashes}"},
        ],
        "researchTasks": tasks,
        "blockers": [task["title"] for task in tasks if task["priority"] in {"critical", "high"}],
        "recommendations": [task["nextAction"] for task in tasks],
    }


def _research_task(task_id: str, title: str, priority: str, evidence: list[Any]) -> dict[str, Any]:
    return {
        "id": task_id,
        "title": title,
        "priority": priority,
        "status": "open" if priority != "low" else "cadence",
        "evidence": [str(item) for item in evidence[:5]],
        "nextAction": title,
        "liveTradingLocked": True,
    }


async def record_outcome_learning_review() -> dict[str, Any]:
    summary = await outcome_learning_summary()
    ledger = await evidence_ledger(100)
    _persist_observation_records(ledger, source="outcome-learning-review")
    evidence = _record_action("Outcome learning review", "Outcome-learning review recorded. No strategy mutation or trade action was executed.", summary)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary, "sourceBackbone": trading_source_backbone_audit()}
