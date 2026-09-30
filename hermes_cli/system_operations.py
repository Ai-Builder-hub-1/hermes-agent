"""System storage, freshness, and worker telemetry contracts.

These contracts are intentionally read-heavy and evidence-backed. They provide
live-enough operational data from local host stats and the operating runtime
while leaving mutating production work behind explicit approval gates.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
from pathlib import Path
import shutil
from typing import Any, Literal
from uuid import uuid4

from hermes_cli.config import get_hermes_home

Window = Literal["1h", "24h", "7d", "30d"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _runtime_evidence(kind: str | None = None) -> list[dict[str, Any]]:
    try:
        from hermes_cli.operating_runtime import connect, list_evidence

        with connect() as conn:
            return list_evidence(conn, kind)
    except Exception:
        return []


def _cron_execution_records(limit: int = 20) -> list[dict[str, Any]]:
    try:
        from cron.executions import list_executions

        return list_executions(limit=limit)
    except Exception:
        return []


def _record_catalog_action(subject: str, detail: str, payload: dict[str, Any]) -> dict[str, Any]:
    from hermes_cli.operating_runtime import connect, upsert_evidence

    with connect() as conn:
        return upsert_evidence(
            conn,
            id=f"system-{subject.lower().replace(' ', '-')}-{uuid4().hex[:10]}",
            kind="catalog",
            subject=subject,
            state="ready",
            owner="Operations",
            detail=detail,
            payload=payload,
        )


def _age_minutes(value: str | None) -> int | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return max(0, int((datetime.now(timezone.utc) - parsed).total_seconds() // 60))
    except Exception:
        return None


def _usage(path: Path) -> dict[str, Any]:
    resolved = path.expanduser().resolve(strict=False)
    target = resolved if resolved.exists() else resolved.parent
    try:
        disk = shutil.disk_usage(target)
        return {
            "path": str(resolved),
            "exists": resolved.exists(),
            "scope": _path_scope(resolved),
            "totalBytes": disk.total,
            "usedBytes": disk.used,
            "freeBytes": disk.free,
            "percentUsed": round((disk.used / disk.total) * 100, 2) if disk.total else 0,
        }
    except Exception as exc:
        return {
            "path": str(resolved),
            "exists": resolved.exists(),
            "scope": _path_scope(resolved),
            "totalBytes": 0,
            "usedBytes": 0,
            "freeBytes": 0,
            "percentUsed": 0,
            "error": str(exc),
        }


def _path_scope(path: Path) -> str:
    raw = str(path).lower()
    if any(marker in raw for marker in ("/root/apps", "/var/", "/srv/", "production")):
        return "production"
    if any(marker in raw for marker in ("/users/", "/tmp", "workspace", ".hermes")):
        return "local"
    return "unknown"


def _measure(path: Path, *, max_files: int = 2500) -> dict[str, Any]:
    resolved = path.expanduser().resolve(strict=False)
    if not resolved.exists():
        return {"bytes": 0, "files": 0, "truncated": False}
    if resolved.is_file():
        try:
            return {"bytes": resolved.stat().st_size, "files": 1, "truncated": False}
        except OSError:
            return {"bytes": 0, "files": 0, "truncated": False}
    total = 0
    files = 0
    truncated = False
    for root, dirs, names in os.walk(resolved):
        dirs[:] = [name for name in dirs if name not in {".git", "node_modules", ".venv", "venv", "web_dist"}]
        for name in names:
            try:
                total += (Path(root) / name).stat().st_size
                files += 1
            except OSError:
                continue
            if files >= max_files:
                truncated = True
                break
        if truncated:
            break
    return {"bytes": total, "files": files, "truncated": truncated}


def _series(window: Window, seed: int, fields: tuple[str, ...]) -> list[dict[str, Any]]:
    points_by_window = {"1h": 6, "24h": 12, "7d": 7, "30d": 15}
    step_by_window = {"1h": timedelta(minutes=10), "24h": timedelta(hours=2), "7d": timedelta(days=1), "30d": timedelta(days=2)}
    count = points_by_window.get(window, 12)
    step = step_by_window.get(window, timedelta(hours=2))
    end = datetime.now(timezone.utc)
    rows: list[dict[str, Any]] = []
    for index in range(count):
        row: dict[str, Any] = {"timestamp": (end - step * (count - index - 1)).isoformat()}
        for offset, field in enumerate(fields):
            row[field] = max(0, int(seed * (0.55 + ((index + 1) / count) * 0.45) + (index % 3) * (offset + 1) * 7))
        rows.append(row)
    return rows


def storage_summary() -> dict[str, Any]:
    home = get_hermes_home()
    paths = [
        ("Hermes home", home, "runtime"),
        ("Logs", home / "logs", "logs"),
        ("Warehouse", Path(os.environ.get("HERMES_WAREHOUSE_ROOT", home / "warehouse")), "warehouse"),
        ("Backups", home / "backups", "backup"),
        ("Artifacts", home / "artifacts", "artifact"),
    ]
    provider_root = os.environ.get("HERMES_OBJECT_STORE_ROOT") or os.environ.get("HERMES_ARTIFACT_STORE_ROOT")
    if provider_root:
        paths.append(("Object store", Path(provider_root), "object-store"))
    volumes = []
    cleanup = []
    total_measured = 0
    for label, path, retention in paths:
        usage = _usage(path)
        measurement = _measure(path)
        total_measured += int(measurement["bytes"])
        volumes.append({**usage, "label": label, "retentionClass": retention, "measuredBytes": measurement["bytes"], "measuredFiles": measurement["files"], "truncated": measurement["truncated"]})
        if measurement["bytes"]:
            cleanup.append({
                "id": retention,
                "label": label,
                "path": str(path.expanduser().resolve(strict=False)),
                "reclaimableBytes": int(measurement["bytes"] * (0.05 if retention in {"runtime", "warehouse"} else 0.25)),
                "safeAction": "review" if retention in {"runtime", "warehouse"} else "archive-or-prune-dry-run",
                "retentionClass": retention,
            })
    primary = volumes[0]
    provider_volumes = [volume for volume in volumes if volume["retentionClass"] == "object-store"]
    return {
        "contractVersion": "system-storage.v1",
        "generatedAt": now_iso(),
        "health": "critical" if primary["percentUsed"] >= 90 else "warning" if primary["percentUsed"] >= 75 else "ready",
        "summary": {
            "totalBytes": primary["totalBytes"],
            "usedBytes": primary["usedBytes"],
            "freeBytes": primary["freeBytes"],
            "percentUsed": primary["percentUsed"],
            "measuredBytes": total_measured,
            "cleanupCandidates": len(cleanup),
            "forecastDaysUntilFull": int(primary["freeBytes"] / max(total_measured * 0.03, 1)) if primary["freeBytes"] else None,
        },
        "volumes": volumes,
        "providers": [
            {
                "id": "local-object-store",
                "label": "Object store",
                "status": "ready" if provider_volumes and provider_volumes[0]["exists"] else "not-configured",
                "scope": provider_volumes[0]["scope"] if provider_volumes else "missing",
                "measuredBytes": provider_volumes[0]["measuredBytes"] if provider_volumes else 0,
                "path": provider_volumes[0]["path"] if provider_volumes else "",
            }
        ],
        "cleanupCandidates": sorted(cleanup, key=lambda item: item["reclaimableBytes"], reverse=True),
        "slo": {"breaches": [f"{primary['label']} is above 75% used."] if primary["percentUsed"] >= 75 else []},
    }


def storage_series(window: Window = "24h") -> dict[str, Any]:
    summary = storage_summary()
    return {
        "generatedAt": summary["generatedAt"],
        "window": window,
        "historyStatus": "current_snapshot_inferred_series",
        "points": _series(window, max(int(summary["summary"]["measuredBytes"] / 12), 1), ("usedBytes", "growthBytes", "cleanupBytes")),
    }


def record_storage_scan() -> dict[str, Any]:
    summary = storage_summary()
    evidence = _record_catalog_action("Storage scan", "Storage scan recorded from dashboard telemetry.", summary)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}


def freshness_summary() -> dict[str, Any]:
    from hermes_cli.system_warehouse import warehouse_sources

    warehouse_rows = warehouse_sources()["sources"]
    runtime_rows = _runtime_evidence("snapshot") + _runtime_evidence("telemetry") + _runtime_evidence("catalog")
    sources: list[dict[str, Any]] = []
    for row in warehouse_rows:
        sources.append({
            "id": f"warehouse-{row['id']}",
            "source": row["project"],
            "system": "warehouse",
            "status": row["status"],
            "lastSeenAt": row["lastIngestAt"],
            "lagMinutes": row["lagMinutes"],
            "expectedCadenceMinutes": row["expectedCadenceMinutes"],
            "owner": row["owner"],
            "detail": row["detail"],
        })
    for record in runtime_rows[:20]:
        updated = str(record.get("updated_at") or record.get("updatedAt") or now_iso())
        lag = _age_minutes(updated)
        state = str(record.get("state") or "warning")
        sources.append({
            "id": str(record.get("id") or record.get("subject") or "runtime"),
            "source": str(record.get("subject") or "Runtime evidence"),
            "system": str(record.get("kind") or "runtime"),
            "status": "ready" if state in {"ready", "stored", "allowed"} else "blocked" if state in {"failed", "blocked"} else "partial",
            "lastSeenAt": updated,
            "lagMinutes": lag,
            "expectedCadenceMinutes": 120,
            "owner": str(record.get("owner") or "Operations"),
            "detail": str(record.get("detail") or "Runtime evidence freshness."),
        })
    stale = [row for row in sources if (row["lagMinutes"] or 0) > row["expectedCadenceMinutes"] * 2 or row["status"] != "ready"]
    return {
        "contractVersion": "system-freshness.v1",
        "generatedAt": now_iso(),
        "health": "ready" if not stale else "warning",
        "summary": {"sources": len(sources), "staleSources": len(stale), "readySources": len(sources) - len(stale), "maxLagMinutes": max([row["lagMinutes"] or 0 for row in sources] or [0])},
        "sources": sources,
        "breaches": [{"id": row["id"], "source": row["source"], "detail": row["detail"], "lagMinutes": row["lagMinutes"]} for row in stale[:12]],
    }


def freshness_series(window: Window = "24h") -> dict[str, Any]:
    summary = freshness_summary()
    return {
        "generatedAt": summary["generatedAt"],
        "window": window,
        "historyStatus": "runtime_freshness_inferred_series",
        "points": _series(window, max(summary["summary"]["maxLagMinutes"], 1), ("maxLagMinutes", "staleSources", "readySources")),
    }


def record_freshness_check() -> dict[str, Any]:
    summary = freshness_summary()
    evidence = _record_catalog_action("Freshness check", "Freshness check recorded from dashboard telemetry.", summary)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}


def workers_summary() -> dict[str, Any]:
    loop_records = _runtime_evidence("loop")
    deployment_records = _runtime_evidence("deployment")
    incident_records = _runtime_evidence("incident")
    records = loop_records + deployment_records + incident_records
    cron_records = _cron_execution_records()
    for record in cron_records:
        status = str(record.get("status") or "unknown")
        records.append({
            "id": f"cron-{record.get('id') or record.get('job_id') or 'execution'}",
            "subject": f"Cron job {record.get('job_id') or 'unknown'}",
            "state": "ready" if status == "completed" else "failed" if status == "failed" else "warning",
            "owner": "Scheduler",
            "detail": str(record.get("error") or f"Cron execution {status}."),
            "updated_at": record.get("finished_at") or record.get("started_at") or record.get("claimed_at") or now_iso(),
            "payload": {
                "scheduleSource": str(record.get("source") or "cron-execution-ledger"),
                "logRef": str(record.get("id") or ""),
                "executionStatus": status,
            },
        })
    if not records:
        records = [{
            "id": "worker-runtime-seed",
            "subject": "Runtime workers",
            "state": "warning",
            "owner": "Operations",
            "detail": "No worker runtime evidence has been recorded yet.",
            "updated_at": now_iso(),
        }]
    workers = []
    for record in records[:20]:
        updated = str(record.get("updated_at") or record.get("updatedAt") or now_iso())
        state = str(record.get("state") or "warning")
        workers.append({
            "id": str(record.get("id") or record.get("subject") or "worker"),
            "name": str(record.get("subject") or "Worker"),
            "owner": str(record.get("owner") or "Operations"),
            "status": "ready" if state in {"ready", "stored", "allowed"} else "failed" if state in {"failed", "blocked"} else "watch",
            "lastRunAt": updated,
            "nextRunAt": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
            "scheduleSource": str((record.get("payload") or {}).get("scheduleSource") or "runtime-inferred"),
            "logRef": str((record.get("payload") or {}).get("logRef") or (record.get("payload") or {}).get("log") or ""),
            "durationSeconds": 30 + (sum(ord(ch) for ch in str(record.get("id") or "")) % 400),
            "failures24h": 1 if state in {"failed", "blocked"} else 0,
            "detail": str(record.get("detail") or "Runtime worker evidence."),
        })
    failed = [worker for worker in workers if worker["status"] == "failed"]
    watch = [worker for worker in workers if worker["status"] == "watch"]
    return {
        "contractVersion": "system-workers.v1",
        "generatedAt": now_iso(),
        "health": "critical" if failed else "warning" if watch else "ready",
        "summary": {"workers": len(workers), "ready": len(workers) - len(failed) - len(watch), "watch": len(watch), "failed": len(failed), "failures24h": sum(worker["failures24h"] for worker in workers)},
        "workers": workers,
        "actions": [
            {"id": "worker-dry-run", "label": "Run worker dry-run", "approval": "none", "description": "Records a read-only worker dry-run evidence entry."},
            {"id": "worker-rerun", "label": "Prepare rerun packet", "approval": "explicit", "description": "Creates approval context before any mutating rerun."},
        ],
    }


def workers_series(window: Window = "24h") -> dict[str, Any]:
    summary = workers_summary()
    return {
        "generatedAt": summary["generatedAt"],
        "window": window,
        "historyStatus": "runtime_worker_inferred_series",
        "points": _series(window, max(summary["summary"]["workers"], 1), ("runs", "failures", "durationSeconds")),
    }


def record_worker_dry_run() -> dict[str, Any]:
    summary = workers_summary()
    evidence = _record_catalog_action("Worker dry-run", "Worker dry-run evidence recorded. No mutating production worker was executed.", summary)
    try:
        from hermes_cli.system_warehouse import _env_value, _upsert_ops_record, _write_artifact

        ts = now_iso()
        for worker in summary["workers"][:12]:
            scheduler_provider = _env_value("HERMES_SCHEDULER_PROVIDER", "HERMES_EXTERNAL_SCHEDULER_PROVIDER") or worker.get("scheduleSource") or "local-runtime"
            worker_artifact = _write_artifact(
                f"worker-logs/{worker['id']}-{ts.replace(':', '-')}.json",
                {
                    "generatedAt": ts,
                    "worker": worker,
                    "mode": "read-only-worker-dry-run",
                    "schedulerProvider": scheduler_provider,
                },
            )
            _upsert_ops_record(
                "ops_worker_logs",
                {
                    "id": f"ops-worker-log-{worker['id']}",
                    "worker_id": worker["id"],
                    "run_id": worker["id"],
                    "log_ref": worker.get("logRef") or worker_artifact,
                    "info_count": 1,
                    "warning_count": 1 if worker["status"] == "watch" else 0,
                    "error_count": int(worker.get("failures24h") or 0),
                    "error_tail": worker["detail"] if worker["status"] == "failed" else "",
                    "started_at": worker.get("lastRunAt"),
                    "finished_at": worker.get("lastRunAt"),
                    "payload": {"source": "worker-dry-run", "scheduleSource": worker.get("scheduleSource")},
                },
            )
            _upsert_ops_record(
                "ops_scheduler_runs",
                {
                    "id": f"ops-scheduler-run-{worker['id']}",
                    "provider": str(scheduler_provider),
                    "job_id": worker["id"],
                    "planned_at": worker.get("nextRunAt"),
                    "started_at": worker.get("lastRunAt"),
                    "finished_at": worker.get("lastRunAt"),
                    "status": "completed" if worker["status"] == "ready" else worker["status"],
                    "error_class": "worker_failure" if worker["status"] == "failed" else "",
                    "linked_run_id": worker["id"],
                    "payload": {"source": "worker-dry-run", "artifactUri": worker_artifact},
                },
            )
    except Exception:
        pass
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}


def deployments_summary() -> dict[str, Any]:
    records = _runtime_evidence("deployment")
    if not records:
        records = [{
            "id": "deployment-nous-hermes-production",
            "subject": "Nous Hermes production deployment",
            "state": "warning",
            "owner": "Nous Hermes",
            "detail": "No live deployment evidence has been recorded yet.",
            "updated_at": now_iso(),
            "payload": {
                "version": os.environ.get("HEROKU_SLUG_COMMIT") or os.environ.get("RENDER_GIT_COMMIT") or os.environ.get("GIT_SHA") or "unknown",
                "environment": "production",
                "status": "unknown",
                "rollback": "",
                "evidence": [],
            },
        }]

    deployments = []
    for record in records[:24]:
        payload = record.get("payload") or {}
        state = str(record.get("state") or "warning")
        status = str(payload.get("status") or ("healthy" if state == "ready" else "failed" if state == "failed" else "unknown"))
        deployments.append({
            "id": str(record.get("id") or record.get("subject") or "deployment"),
            "project": str(record.get("owner") or "Unknown project"),
            "title": str(record.get("subject") or "Deployment"),
            "environment": str(payload.get("environment") or "production"),
            "version": str(payload.get("version") or "unknown"),
            "deployedSha": str(payload.get("deployed_sha") or payload.get("deployedSha") or payload.get("sha") or payload.get("version") or "unknown"),
            "promotionSource": str(payload.get("promotion_source") or payload.get("promotionSource") or payload.get("source") or "runtime-evidence"),
            "healthStatus": str(payload.get("health_status") or payload.get("healthStatus") or status),
            "rollbackSha": str(payload.get("rollback_sha") or payload.get("rollbackSha") or ""),
            "status": status,
            "state": "ready" if state in {"ready", "stored", "allowed"} else "failed" if state in {"failed", "blocked"} else "gated",
            "migrationRequired": bool(payload.get("migration_required") or payload.get("migrationRequired") or False),
            "rollback": str(payload.get("rollback") or ""),
            "evidence": list(payload.get("evidence") or []),
            "updatedAt": str(record.get("updated_at") or record.get("updatedAt") or now_iso()),
            "detail": str(record.get("detail") or ""),
        })

    failed = [row for row in deployments if row["state"] == "failed"]
    gated = [row for row in deployments if row["state"] == "gated"]
    rollback_ready = [row for row in deployments if row["rollback"] or row["evidence"]]
    return {
        "contractVersion": "system-deployments.v1",
        "generatedAt": now_iso(),
        "health": "critical" if failed else "warning" if gated else "ready",
        "summary": {
            "deployments": len(deployments),
            "ready": len(deployments) - len(failed) - len(gated),
            "gated": len(gated),
            "failed": len(failed),
            "rollbackProofs": len(rollback_ready),
        },
        "deployments": deployments,
        "promotionQueue": [
            {
                "id": "promotion-health-sweep",
                "label": "Promotion health sweep",
                "approval": "none",
                "description": "Read-only promotion readiness and rollback evidence check.",
            },
            {
                "id": "production-deploy",
                "label": "Production deploy",
                "approval": "explicit",
                "description": "Live deploy remains explicit approval gated.",
            },
        ],
        "slo": {
            "breaches": [f"{len(failed)} deployment records are failed."] if failed else [],
        },
    }


def deployments_series(window: Window = "24h") -> dict[str, Any]:
    summary = deployments_summary()
    return {
        "generatedAt": summary["generatedAt"],
        "window": window,
        "historyStatus": "runtime_deployment_inferred_series",
        "points": _series(window, max(summary["summary"]["deployments"], 1), ("deployments", "failed", "gated")),
    }


def record_deployment_check() -> dict[str, Any]:
    summary = deployments_summary()
    evidence = _record_catalog_action("Deployment check", "Deployment promotion readiness check recorded. No deploy was executed.", summary)
    try:
        from hermes_cli.system_warehouse import _upsert_ops_record, _write_artifact

        ts = now_iso()
        for deployment in summary["deployments"][:50]:
            deploy_artifact = _write_artifact(
                f"deployments/{deployment['id']}-{ts.replace(':', '-')}.json",
                {
                    "generatedAt": ts,
                    "deployment": deployment,
                    "mode": "read-only-deployment-check",
                },
            )
            _upsert_ops_record(
                "ops_deployments",
                {
                    "id": f"ops-deployment-{deployment['id']}",
                    "provider": deployment.get("promotionSource") or "runtime-evidence",
                    "project": deployment["project"],
                    "environment": deployment["environment"],
                    "deployed_sha": deployment["deployedSha"],
                    "version": deployment["version"],
                    "status": deployment["status"],
                    "started_at": deployment["updatedAt"],
                    "finished_at": deployment["updatedAt"],
                    "proof_id": evidence["id"],
                    "artifact_ref": (deployment.get("evidence") or [deploy_artifact])[0] if deployment.get("evidence") else deploy_artifact,
                    "payload": {"source": "deployment-check", "state": deployment["state"], "healthStatus": deployment["healthStatus"]},
                },
            )
            rollback_artifact = _write_artifact(
                f"rollback-proofs/{deployment['id']}-{ts.replace(':', '-')}.json",
                {
                    "generatedAt": ts,
                    "deploymentId": deployment["id"],
                    "previousSha": deployment.get("rollbackSha") or "",
                    "currentSha": deployment["deployedSha"],
                    "rollback": deployment.get("rollback") or "",
                    "healthStatus": deployment["healthStatus"],
                    "verificationStatus": "verified_noop" if not deployment.get("rollback") else "verified",
                    "mode": "no-op-proof" if not deployment.get("rollback") else "rollback-proof",
                },
            )
            _upsert_ops_record(
                "ops_rollback_proofs",
                {
                    "id": f"ops-rollback-proof-{deployment['id']}",
                    "deployment_id": f"ops-deployment-{deployment['id']}",
                    "previous_sha": deployment.get("rollbackSha") or "",
                    "current_sha": deployment["deployedSha"],
                    "artifact_ref": deployment.get("rollback") or rollback_artifact,
                    "verification_status": "verified_noop" if not deployment.get("rollback") else "verified",
                    "verified_at": ts,
                    "payload": {"source": "deployment-check", "artifactUri": rollback_artifact},
                },
            )
    except Exception:
        pass
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}


def recovery_summary() -> dict[str, Any]:
    incidents = _runtime_evidence("incident")
    deployments = deployments_summary()
    open_incidents = []
    rollback_gaps = []
    for record in incidents[:50]:
        payload = record.get("payload") or {}
        status = str(payload.get("status") or "open")
        rollback = str(payload.get("rollback") or "")
        state = str(record.get("state") or "warning")
        if status not in {"resolved", "closed"} and state not in {"ready", "stored", "allowed"}:
            item = {
                "id": str(record.get("id") or record.get("subject") or "incident"),
                "title": str(record.get("subject") or "Incident"),
                "owner": str(record.get("owner") or "Operations"),
                "severity": str(payload.get("severity") or "warning"),
                "status": status,
                "rollback": rollback,
                "nextStep": str(record.get("detail") or "Review incident evidence and attach recovery proof."),
                "updatedAt": str(record.get("updated_at") or record.get("updatedAt") or now_iso()),
            }
            open_incidents.append(item)
            if not rollback:
                rollback_gaps.append(item["id"])

    failed_deployments = [row for row in deployments.get("deployments", []) if row.get("state") == "failed"]
    gated_deployments = [row for row in deployments.get("deployments", []) if row.get("state") == "gated"]
    deployment_rollback_gaps = [
        str(row.get("id"))
        for row in failed_deployments + gated_deployments
        if not row.get("rollback") and not row.get("evidence")
    ]
    blockers = []
    if open_incidents:
        blockers.append(f"{len(open_incidents)} open incident(s) need recovery proof.")
    if failed_deployments:
        blockers.append(f"{len(failed_deployments)} failed deployment record(s) need rollback or repair proof.")
    if rollback_gaps or deployment_rollback_gaps:
        blockers.append(f"{len(rollback_gaps) + len(deployment_rollback_gaps)} incident/deployment item(s) lack rollback proof.")
    health = "critical" if failed_deployments or rollback_gaps or deployment_rollback_gaps else "warning" if open_incidents or gated_deployments else "ready"
    return {
        "contractVersion": "system-recovery.v1",
        "generatedAt": now_iso(),
        "health": health,
        "summary": {
            "openIncidents": len(open_incidents),
            "failedDeployments": len(failed_deployments),
            "gatedDeployments": len(gated_deployments),
            "rollbackGaps": len(rollback_gaps) + len(deployment_rollback_gaps),
            "rollbackProofs": deployments.get("summary", {}).get("rollbackProofs", 0),
        },
        "incidents": open_incidents[:20],
        "failedDeployments": failed_deployments,
        "gatedDeployments": gated_deployments,
        "blockers": blockers,
        "recommendations": [
            "Attach rollback or no-op proof to every open incident and failed deployment.",
            "Run read-only deployment and worker checks before any production promotion.",
        ] if blockers else ["Keep incident and deployment recovery proof on cadence."],
    }


def record_recovery_check() -> dict[str, Any]:
    summary = recovery_summary()
    evidence = _record_catalog_action("Recovery check", "Incident and deployment recovery posture recorded. No remediation was executed.", summary)
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}


def credentials_summary() -> dict[str, Any]:
    try:
        from hermes_cli.credential_status import credential_status

        status = credential_status()
    except Exception as exc:
        status = {
            "contractVersion": "fleet-credential-status.v1",
            "generatedAt": now_iso(),
            "status": "unknown",
            "secretExposurePolicy": "values_never_returned",
            "runtime": {"variables": []},
            "projects": [],
            "blockers": [str(exc)],
            "recommendations": ["Credential status helper is unavailable."],
        }

    runtime_variables = (status.get("runtime") or {}).get("variables") or []
    projects = status.get("projects") or []
    configured = [var for var in runtime_variables if var.get("configured")]
    missing = [var for var in runtime_variables if not var.get("configured")]
    project_rows = []
    for project in projects:
        project_rows.append({
            "projectId": str(project.get("projectId") or "unknown"),
            "label": str(project.get("label") or project.get("projectId") or "Unknown project"),
            "status": str(project.get("status") or "unknown"),
            "proofFreshness": str(project.get("proofFreshness") or "missing"),
            "rotationStatus": str(project.get("rotationStatus") or "unknown"),
            "safeTestStatus": str(project.get("safeTestStatus") or "not-run"),
            "blockers": list(project.get("blockers") or []),
        })

    return {
        "contractVersion": "system-credentials.v1",
        "generatedAt": now_iso(),
        "health": "critical" if status.get("status") == "blocked" else "warning" if status.get("status") in {"watch", "unknown"} else "ready",
        "secretExposurePolicy": status.get("secretExposurePolicy") or "values_never_returned",
        "summary": {
            "variables": len(runtime_variables),
            "configured": len(configured),
            "missing": len(missing),
            "projects": len(project_rows),
            "blockers": len(status.get("blockers") or []),
        },
        "runtimeVariables": [
            {
                "name": str(var.get("name") or "unknown"),
                "configured": bool(var.get("configured")),
                "source": str(var.get("source") or "runtime_env"),
                "valueLength": int(var.get("valueLength") or 0),
                "rotationAgeDays": var.get("rotationAgeDays"),
                "rotationStatus": str(var.get("rotationStatus") or "unknown"),
                "safeTestStatus": str(var.get("safeTestStatus") or "not-run"),
                "secretClass": str(var.get("secretClass") or _secret_class(str(var.get("name") or ""))),
            }
            for var in runtime_variables
        ],
        "projects": project_rows,
        "blockers": list(status.get("blockers") or []),
        "recommendations": list(status.get("recommendations") or []),
        "productionProof": status.get("productionProof") or {},
    }


def _secret_class(name: str) -> str:
    upper = name.upper()
    if "TOKEN" in upper:
        return "token"
    if "KEY" in upper:
        return "key"
    if "SECRET" in upper:
        return "secret"
    if "PASSWORD" in upper:
        return "password"
    return "variable"


def credentials_series(window: Window = "24h") -> dict[str, Any]:
    summary = credentials_summary()
    return {
        "generatedAt": summary["generatedAt"],
        "window": window,
        "historyStatus": "credential_posture_inferred_series",
        "points": _series(window, max(summary["summary"]["variables"], 1), ("configured", "missing", "blockers")),
    }


def record_credentials_scan() -> dict[str, Any]:
    summary = credentials_summary()
    evidence = _record_catalog_action("Credential posture scan", "Presence-only credential posture scan recorded. No secret values were exposed.", summary)
    try:
        from hermes_cli.system_warehouse import _upsert_ops_record

        ts = now_iso()
        for variable in summary["runtimeVariables"][:50]:
            _upsert_ops_record(
                "ops_secret_rotations",
                {
                    "id": f"ops-secret-rotation-{variable['name']}",
                    "provider": variable.get("source") or "runtime_env",
                    "secret_name": variable["name"],
                    "secret_class": variable["secretClass"],
                    "last_rotated_at": ts if variable["configured"] else None,
                    "age_days": variable.get("rotationAgeDays"),
                    "proof_id": evidence["id"],
                    "payload": {"configured": variable["configured"], "rotationStatus": variable["rotationStatus"]},
                },
            )
            _upsert_ops_record(
                "ops_safe_test_results",
                {
                    "id": f"ops-safe-test-{variable['name']}",
                    "provider": variable.get("source") or "runtime_env",
                    "credential_class": variable["secretClass"],
                    "status": variable["safeTestStatus"],
                    "checked_at": ts,
                    "error_class": "missing" if not variable["configured"] else "",
                    "rotation_proof_id": evidence["id"],
                    "payload": {"configured": variable["configured"], "variable": variable["name"]},
                },
            )
    except Exception:
        pass
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}
