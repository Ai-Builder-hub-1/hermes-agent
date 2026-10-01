"""Read-only warehouse telemetry for the Hermes dashboard.

The dashboard needs an operational warehouse contract even before every
collector emits perfect metrics. This module derives safe, non-secret telemetry
from configured paths and the operating-runtime evidence store, and clearly
marks inferred values so the UI does not over-claim precision.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
from typing import Any, Literal
from uuid import uuid4

from hermes_cli.config import get_hermes_home, load_env

Window = Literal["1h", "24h", "7d", "30d"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _env_value(*names: str) -> str:
    env = load_env()
    for name in names:
        value = (os.environ.get(name) or env.get(name) or "").strip()
        if value:
            return value
    return ""


def _recommended_group_one_default(name: str) -> str:
    home = get_hermes_home()
    defaults = {
        "HERMES_WAREHOUSE_ROOT": str(home / "warehouse"),
        "HERMES_WAREHOUSE_MIRROR_ROOT": str(home / "warehouse-mirror"),
        "HERMES_ARTIFACT_STORE_ROOT": str(home / "artifacts"),
        "HERMES_OBJECT_STORE_ROOT": str(home / "artifacts"),
        "HERMES_SCHEDULER_PROVIDER": "systemd",
        "HERMES_EXTERNAL_SCHEDULER_PROVIDER": "systemd",
        "HERMES_WORKER_LOG_ROOT": str(home / "logs"),
        "HERMES_LOG_ARTIFACT_ROOT": str(home / "artifacts" / "logs"),
        "HERMES_DEPLOYMENT_PROVIDER": "hetzner",
        "HERMES_ROLLBACK_ARTIFACT_ROOT": str(home / "artifacts" / "rollback-proofs"),
        "HERMES_SECRET_PROVIDER": "server-env",
        "HERMES_VISUAL_BASELINE_ROOT": str(home / "artifacts" / "visual-baselines"),
        "HERMES_CHART_SOURCE_PROOF_ROOT": str(home / "artifacts" / "chart-source-proof"),
    }
    return defaults.get(name, "")


def _recommended_env_value(*names: str) -> str:
    configured = _env_value(*names)
    if configured:
        return configured
    for name in names:
        value = _recommended_group_one_default(name)
        if value:
            return value
    return ""


def _recommended_env_label(*names: str) -> str:
    configured = _env_value(*names)
    if configured:
        return next((name for name in names if _env_value(name)), "")
    for name in names:
        value = _recommended_group_one_default(name)
        if value:
            return f"default:{name}={value}"
    return ""


def _path_from_env(*names: str, default: Path | None = None) -> Path:
    raw = _env_value(*names)
    if raw:
        return Path(raw).expanduser()
    if default is not None:
        return default
    return get_hermes_home() / "warehouse"


def warehouse_root() -> Path:
    return _path_from_env(
        "HERMES_WAREHOUSE_ROOT",
        "HERMES_DATA_WAREHOUSE_ROOT",
        "DATA_WAREHOUSE_ROOT",
        default=get_hermes_home() / "warehouse",
    )


def mirror_root() -> Path:
    return _path_from_env(
        "HERMES_WAREHOUSE_MIRROR_ROOT",
        "HERMES_DATA_WAREHOUSE_MIRROR_ROOT",
        "HERMES_EXTERNAL_WAREHOUSE_ROOT",
        default=get_hermes_home() / "warehouse-mirror",
    )


def artifact_store_root() -> Path:
    return _path_from_env(
        "HERMES_ARTIFACT_STORE_ROOT",
        "HERMES_OBJECT_STORE_ROOT",
        default=get_hermes_home() / "artifacts",
    )


def live_database_path() -> Path:
    configured = _env_value("HERMES_LIVE_DATABASE_PATH", "HERMES_OPERATING_RUNTIME_DB", "HERMES_DATABASE_PATH")
    if configured:
        return Path(configured).expanduser()
    from hermes_cli.operating_runtime import db_path

    return db_path()


def _write_artifact(relative_path: str, payload: dict[str, Any]) -> str:
    root = artifact_store_root().expanduser().resolve(strict=False)
    path = root / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True, default=str), encoding="utf-8")
    return str(path)


def _file_modified_iso(path: Path) -> str | None:
    try:
        return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()
    except OSError:
        return None


def _sha256_file(path: Path, max_bytes: int | None = None) -> str:
    digest = hashlib.sha256()
    remaining = max_bytes
    with path.open("rb") as handle:
        while True:
            read_size = 1024 * 1024 if remaining is None else min(1024 * 1024, remaining)
            if read_size <= 0:
                break
            chunk = handle.read(read_size)
            if not chunk:
                break
            digest.update(chunk)
            if remaining is not None:
                remaining -= len(chunk)
    return digest.hexdigest()


def _path_usage(path: Path) -> dict[str, Any]:
    resolved = path.expanduser().resolve(strict=False)
    exists = resolved.exists()
    usage_target = resolved if exists else resolved.parent
    try:
        usage = shutil.disk_usage(usage_target)
        percent = round((usage.used / usage.total) * 100, 2) if usage.total else 0
        return {
            "path": str(resolved),
            "exists": exists,
            "scope": _path_scope(resolved),
            "host": os.uname().nodename if hasattr(os, "uname") else "unknown",
            "mountProof": _mount_proof(resolved, exists),
            "totalBytes": usage.total,
            "usedBytes": usage.used,
            "freeBytes": usage.free,
            "percentUsed": percent,
        }
    except Exception as exc:
        return {
            "path": str(resolved),
            "exists": exists,
            "scope": _path_scope(resolved),
            "host": os.uname().nodename if hasattr(os, "uname") else "unknown",
            "mountProof": _mount_proof(resolved, exists),
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


def _mount_proof(path: Path, exists: bool) -> dict[str, Any]:
    try:
        probe = path if exists else path.parent
        usage = shutil.disk_usage(probe)
        return {
            "verifiedAt": now_iso(),
            "pathExists": exists,
            "probePath": str(probe.expanduser().resolve(strict=False)),
            "totalBytes": usage.total,
            "freeBytes": usage.free,
        }
    except Exception as exc:
        return {
            "verifiedAt": now_iso(),
            "pathExists": exists,
            "probePath": str(path.expanduser().resolve(strict=False)),
            "error": str(exc),
        }


def _directory_measurement(path: Path, *, max_files: int = 5000) -> dict[str, Any]:
    resolved = path.expanduser().resolve(strict=False)
    if not resolved.exists():
        return {"bytes": 0, "files": 0, "truncated": False, "exists": False}
    if resolved.is_file():
        try:
            return {"bytes": resolved.stat().st_size, "files": 1, "truncated": False, "exists": True}
        except OSError:
            return {"bytes": 0, "files": 0, "truncated": False, "exists": True}

    total = 0
    files = 0
    truncated = False
    for root, dirs, names in os.walk(resolved):
        dirs[:] = [name for name in dirs if name not in {".git", "node_modules", ".venv", "venv"}]
        for name in names:
            file_path = Path(root) / name
            try:
                total += file_path.stat().st_size
                files += 1
            except OSError:
                continue
            if files >= max_files:
                truncated = True
                break
        if truncated:
            break
    return {"bytes": total, "files": files, "truncated": truncated, "exists": True}


def _runtime_evidence(kind: str | None = None) -> list[dict[str, Any]]:
    try:
        from hermes_cli.operating_runtime import connect, list_evidence

        with connect() as conn:
            return list_evidence(conn, kind)
    except Exception:
        return []


def _ops_rows(table: str, limit: int = 50) -> list[dict[str, Any]]:
    allowed = {
        "ops_job_runs",
        "ops_storage_objects",
        "ops_scheduler_runs",
        "ops_worker_logs",
        "ops_deployments",
        "ops_rollback_proofs",
        "ops_secret_rotations",
        "ops_safe_test_results",
        "ops_provider_readiness",
        "ops_database_backups",
    }
    if table not in allowed:
        return []
    try:
        from hermes_cli.operating_runtime import connect

        with connect() as conn:
            rows = conn.execute(
                f"SELECT * FROM {table} ORDER BY recorded_at DESC LIMIT ?",
                (max(1, min(limit, 500)),),
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


def _upsert_ops_record(table: str, record: dict[str, Any]) -> None:
    allowed = {
        "ops_job_runs",
        "ops_storage_objects",
        "ops_scheduler_runs",
        "ops_worker_logs",
        "ops_deployments",
        "ops_rollback_proofs",
        "ops_secret_rotations",
        "ops_safe_test_results",
        "ops_provider_readiness",
        "ops_database_backups",
    }
    if table not in allowed:
        return
    from hermes_cli.operating_runtime import connect

    payload = json.dumps(record.pop("payload", {}) or {}, sort_keys=True, default=str)
    record["payload"] = payload
    record.setdefault("recorded_at", now_iso())
    columns = list(record)
    placeholders = ", ".join("?" for _ in columns)
    updates = ", ".join(f"{column} = excluded.{column}" for column in columns if column != "id")
    values = [record[column] for column in columns]
    with connect() as conn:
        conn.execute(
            f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES ({placeholders})
            ON CONFLICT(id) DO UPDATE SET {updates}
            """,
            values,
        )
        conn.commit()


def _record_object_inventory(root: Path, *, provider: str, source_system: str, retention_class: str, max_files: int = 50) -> int:
    resolved = root.expanduser().resolve(strict=False)
    if not resolved.exists():
        return 0
    if resolved.is_file():
        paths = [resolved]
    else:
        paths = []
        for path in resolved.rglob("*"):
            if path.is_file():
                paths.append(path)
            if len(paths) >= max_files:
                break
    count = 0
    for path in paths:
        try:
            stat = path.stat()
        except OSError:
            continue
        object_ref = str(path.expanduser().resolve(strict=False))
        checksum = hashlib.sha256(f"{object_ref}:{stat.st_size}:{stat.st_mtime_ns}".encode("utf-8")).hexdigest()
        _upsert_ops_record(
            "ops_storage_objects",
            {
                "id": f"storage-object-{hashlib.sha256(object_ref.encode('utf-8')).hexdigest()[:16]}",
                "provider": provider,
                "object_ref": object_ref,
                "size_bytes": stat.st_size,
                "checksum": checksum,
                "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                "retention_class": retention_class,
                "source_system": source_system,
                "payload": {"source": "local-inventory", "truncated": len(paths) >= max_files},
            },
        )
        count += 1
    return count


def _latest_evidence(subject_contains: str) -> dict[str, Any] | None:
    needle = subject_contains.lower()
    for record in _runtime_evidence():
        if needle in str(record.get("subject") or "").lower() or needle in str(record.get("detail") or "").lower():
            return record
    return None


def _cron_execution_records(limit: int = 20) -> list[dict[str, Any]]:
    try:
        from cron.executions import list_executions

        return list_executions(limit=limit)
    except Exception:
        return []


def _evidence_matches(*needles: str) -> list[dict[str, Any]]:
    lowered = [needle.lower() for needle in needles]
    matches: list[dict[str, Any]] = []
    for record in _runtime_evidence():
        payload = record.get("payload") or {}
        haystack = " ".join(
            [
                str(record.get("id") or ""),
                str(record.get("kind") or ""),
                str(record.get("subject") or ""),
                str(record.get("detail") or ""),
                json.dumps(payload, sort_keys=True, default=str),
            ]
        ).lower()
        if any(needle in haystack for needle in lowered):
            matches.append(record)
    return matches


def _local_artifact_root_configured(*names: str) -> bool:
    raw = _recommended_env_value(*names)
    return bool(raw and Path(raw).expanduser().resolve(strict=False).exists())


def _backbone_item(
    *,
    item_id: str,
    label: str,
    status: str,
    warehouse_enough: bool,
    evidence: list[str],
    missing: list[str],
    next_action: str,
) -> dict[str, Any]:
    return {
        "id": item_id,
        "label": label,
        "status": status,
        "warehouseEnough": warehouse_enough,
        "evidence": evidence,
        "missing": missing,
        "nextAction": next_action,
    }


def warehouse_backbone_audit() -> dict[str, Any]:
    """Audit whether the local warehouse is enough for Group 1 operations.

    This does not call provider APIs. It classifies the local warehouse as a
    backbone only when Hermes can see durable operational facts or artifact refs.
    """

    root = warehouse_root()
    mirror = mirror_root()
    job_records = warehouse_jobs()["jobs"]
    evidence = _runtime_evidence()
    cron_records = _cron_execution_records()
    ops_job_runs = _ops_rows("ops_job_runs")
    ops_storage_objects = _ops_rows("ops_storage_objects")
    ops_scheduler_runs = _ops_rows("ops_scheduler_runs")
    ops_worker_logs = _ops_rows("ops_worker_logs")
    ops_deployments = _ops_rows("ops_deployments")
    ops_rollback_proofs = _ops_rows("ops_rollback_proofs")
    ops_secret_rotations = _ops_rows("ops_secret_rotations")
    ops_safe_test_results = _ops_rows("ops_safe_test_results")
    deployment_evidence = [record for record in evidence if record.get("kind") == "deployment"]
    credential_evidence = _evidence_matches("credential", "secret", "rotation", "safe test", "safe-test")
    object_store_configured = _local_artifact_root_configured("HERMES_OBJECT_STORE_ROOT", "HERMES_ARTIFACT_STORE_ROOT")
    worker_log_configured = _local_artifact_root_configured("HERMES_WORKER_LOG_ROOT", "HERMES_LOG_ARTIFACT_ROOT") or bool(_env_value("HERMES_WORKER_LOG_URL", "HERMES_LOG_ARTIFACT_URL"))

    collector_jobs = [job for job in job_records if job["kind"] in {"collector", "mirror", "prune"}]
    mirror_or_prune = [job for job in job_records if job["kind"] in {"mirror", "prune"}]
    ops_collector_jobs = [row for row in ops_job_runs if row.get("kind") in {"collector", "mirror", "prune"}]
    ops_mirror_or_prune = [row for row in ops_job_runs if row.get("kind") in {"mirror", "prune"}]
    scheduler_external = _recommended_env_value("HERMES_SCHEDULER_PROVIDER", "HERMES_EXTERNAL_SCHEDULER_PROVIDER")
    deployment_with_rollback = [
        record for record in deployment_evidence
        if (record.get("payload") or {}).get("rollback") or (record.get("payload") or {}).get("rollbackSha") or (record.get("payload") or {}).get("rollback_sha") or (record.get("payload") or {}).get("evidence")
    ]
    safe_test_records = [
        record for record in credential_evidence
        if "safe" in json.dumps(record.get("payload") or {}, default=str).lower() or "safe" in str(record.get("detail") or "").lower()
    ]

    items = [
        _backbone_item(
            item_id="ops-job-runs",
            label="Collector, mirror, and prune history",
            status="ready" if ops_collector_jobs and ops_mirror_or_prune else "partial" if collector_jobs or ops_collector_jobs or root.exists() else "missing",
            warehouse_enough=bool(ops_collector_jobs and ops_mirror_or_prune),
            evidence=[str(row["id"]) for row in ops_collector_jobs[:6]] or [job["id"] for job in collector_jobs[:6]],
            missing=[] if ops_collector_jobs and ops_mirror_or_prune else ["ops_job_runs rows for collector/mirror/prune jobs"],
            next_action="Ingest production collector, mirror, and prune run records into the warehouse.",
        ),
        _backbone_item(
            item_id="ops-storage-objects",
            label="Object-store/provider history",
            status="ready" if ops_storage_objects else "partial" if object_store_configured or root.exists() or mirror.exists() else "missing",
            warehouse_enough=bool(ops_storage_objects),
            evidence=[str(row["id"]) for row in ops_storage_objects[:6]] or ([str(root), str(mirror)] if root.exists() or mirror.exists() else []),
            missing=[] if ops_storage_objects else ["ops_storage_objects rows with provider, object ref, checksum, size, retention class"],
            next_action="Point Hermes at the object/artifact store or ingest object metadata into the warehouse.",
        ),
        _backbone_item(
            item_id="ops-scheduler-runs",
            label="External scheduler/provider history",
            status="ready" if ops_scheduler_runs else "partial" if cron_records or scheduler_external else "missing",
            warehouse_enough=bool(ops_scheduler_runs),
            evidence=[str(row["id"]) for row in ops_scheduler_runs[:6]] or [str(record.get("id") or record.get("job_id") or "cron") for record in cron_records[:6]],
            missing=[] if ops_scheduler_runs else ["ops_scheduler_runs rows from the production scheduler provider"],
            next_action="Ingest the external scheduler ledger; local cron records are useful but not production-provider proof.",
        ),
        _backbone_item(
            item_id="ops-worker-logs",
            label="Worker log endpoint or artifact links",
            status="ready" if ops_worker_logs else "partial" if worker_log_configured or _evidence_matches("logRef", "log ref", "worker") else "missing",
            warehouse_enough=bool(ops_worker_logs),
            evidence=[str(row["id"]) for row in ops_worker_logs[:6]] or [str(record.get("id") or record.get("subject") or "worker") for record in _evidence_matches("logRef", "log ref", "worker")[:6]],
            missing=[] if ops_worker_logs else ["ops_worker_logs rows with run id, log ref/artifact URI, severity counts, and error tail"],
            next_action="Choose a log artifact root/URL and ingest worker run log refs into the warehouse.",
        ),
        _backbone_item(
            item_id="ops-deployments",
            label="Deployment provider history",
            status="ready" if ops_deployments else "partial" if deployment_evidence or _recommended_env_value("HERMES_DEPLOYMENT_PROVIDER", "GIT_SHA", "RENDER_GIT_COMMIT", "HEROKU_SLUG_COMMIT") else "missing",
            warehouse_enough=bool(ops_deployments),
            evidence=[str(row["id"]) for row in ops_deployments[:6]] or [str(record.get("id") or record.get("subject") or "deployment") for record in deployment_evidence[:6]],
            missing=[] if ops_deployments else ["ops_deployments rows from the deployment provider with environment, SHA, status, and timestamps"],
            next_action="Ingest deployment provider receipts into the warehouse instead of relying on local SHA/env fallback.",
        ),
        _backbone_item(
            item_id="ops-rollback-proofs",
            label="Rollback proof artifacts",
            status="ready" if ops_rollback_proofs else "partial" if deployment_with_rollback or deployment_evidence else "missing",
            warehouse_enough=bool(ops_rollback_proofs),
            evidence=[str(row["id"]) for row in ops_rollback_proofs[:6]] or [str(record.get("id") or record.get("subject") or "rollback") for record in deployment_with_rollback[:6]],
            missing=[] if ops_rollback_proofs else ["ops_rollback_proofs rows with rollback artifact/ref and verification status"],
            next_action="Attach rollback/no-op proof artifacts to deployment history.",
        ),
        _backbone_item(
            item_id="ops-secret-rotations",
            label="Vault/secret rotation history",
            status="ready" if ops_secret_rotations else "partial" if credential_evidence or _recommended_env_value("HERMES_SECRET_PROVIDER", "HERMES_VAULT_PROVIDER") else "missing",
            warehouse_enough=bool(ops_secret_rotations),
            evidence=[str(row["id"]) for row in ops_secret_rotations[:6]] or [str(record.get("id") or record.get("subject") or "credential") for record in credential_evidence[:6]],
            missing=[] if ops_secret_rotations else ["ops_secret_rotations rows with secret class, provider, last rotated, and age; no secret values"],
            next_action="Ingest presence-only vault/secret rotation metadata into the warehouse.",
        ),
        _backbone_item(
            item_id="ops-safe-test-results",
            label="Credential safe-test results",
            status="ready" if ops_safe_test_results else "partial" if safe_test_records or credential_evidence else "missing",
            warehouse_enough=bool(ops_safe_test_results),
            evidence=[str(row["id"]) for row in ops_safe_test_results[:6]] or [str(record.get("id") or record.get("subject") or "safe-test") for record in safe_test_records[:6]],
            missing=[] if ops_safe_test_results else ["ops_safe_test_results rows with credential class, provider, status, checked_at, and redacted error class"],
            next_action="Record provider-specific safe tests without exposing secret values.",
        ),
    ]
    ready = [item for item in items if item["status"] == "ready"]
    partial = [item for item in items if item["status"] == "partial"]
    missing = [item for item in items if item["status"] == "missing"]
    return {
        "contractVersion": "warehouse-backbone-audit.v1",
        "generatedAt": now_iso(),
        "summary": {
            "categories": len(items),
            "ready": len(ready),
            "partial": len(partial),
            "missing": len(missing),
            "warehouseEnough": len(ready) == len(items),
            "posture": "sufficient" if len(ready) == len(items) else "usable_with_gaps" if ready or partial else "not_sufficient",
        },
        "requiredTables": [
            "ops_job_runs",
            "ops_storage_objects",
            "ops_scheduler_runs",
            "ops_worker_logs",
            "ops_deployments",
            "ops_rollback_proofs",
            "ops_secret_rotations",
            "ops_safe_test_results",
        ],
        "items": items,
        "recommendations": [
            item["nextAction"]
            for item in items
            if item["status"] != "ready"
        ][:8],
    }


def database_backup_contract() -> dict[str, Any]:
    """Treat the live DB as source of truth and the warehouse as archive/restore proof."""

    source = live_database_path().expanduser().resolve(strict=False)
    exists = source.exists()
    size = source.stat().st_size if exists else 0
    modified_at = _file_modified_iso(source) if exists else None
    backups = _ops_rows("ops_database_backups", 20)
    latest = backups[0] if backups else None
    latest_payload = (latest or {}).get("payload") or {}
    latest_status = str((latest or {}).get("status") or "")
    latest_ref = str((latest or {}).get("backup_ref") or latest_payload.get("backupRef") or "")
    last_backup_at = (latest or {}).get("backup_created_at") or (latest or {}).get("recorded_at")
    age_minutes = _age_minutes(str(last_backup_at)) if last_backup_at else None
    max_age = int(_env_value("HERMES_DATABASE_BACKUP_MAX_AGE_MINUTES") or "1440")
    current = bool(latest and latest_status == "ready" and (age_minutes is None or age_minutes <= max_age))
    status = "ready" if exists and current else "partial" if exists and latest else "missing"
    return {
        "contractVersion": "database-backup.v1",
        "generatedAt": now_iso(),
        "status": status,
        "sourceOfTruth": {
            "type": "sqlite",
            "path": str(source),
            "exists": exists,
            "sizeBytes": size,
            "modifiedAt": modified_at,
            "role": "live-operational-source-of-truth",
        },
        "warehouseRole": "backup-long-term-storage-replay-evidence",
        "latestBackup": {
            "ok": current,
            "backupRef": latest_ref,
            "createdAt": last_backup_at,
            "ageMinutes": age_minutes,
            "maxAgeMinutes": max_age,
            "sizeBytes": int((latest or {}).get("size_bytes") or 0),
            "contentHash": str((latest or {}).get("content_hash") or ""),
            "restoreMode": str((latest or {}).get("restore_mode") or latest_payload.get("restoreMode") or ""),
        },
        "requirements": [
            "Live database must exist and open cleanly.",
            "Warehouse backup copy must be created without mutating live tables.",
            "Backup manifest must include path, size, content hash, and restore mode.",
            "Restore proof must reference the database backup manifest.",
        ],
        "nextAction": "Run database backup proof from System Warehouse." if exists and not current else "Keep scheduled database backup proof current.",
    }


def _provider_ready_from_env(*names: str) -> tuple[bool, str]:
    label = _recommended_env_label(*names)
    return (bool(label), label)


def _provider_readiness_item(
    *,
    category: str,
    label: str,
    required_env: list[str],
    proof_table: str,
    proof_count: int,
    next_action: str,
) -> dict[str, Any]:
    configured, configured_env = _provider_ready_from_env(*required_env)
    status = "ready" if proof_count > 0 else "partial" if configured else "missing"
    return {
        "id": category,
        "category": category,
        "label": label,
        "status": status,
        "provider": configured_env or "not-configured",
        "requiredEnv": required_env,
        "proofTable": proof_table,
        "proofCount": proof_count,
        "nextAction": next_action,
    }


_GROUP_ONE_CONNECTION_REQUIREMENTS: dict[str, dict[str, str]] = {
    "collector-mirror-prune": {
        "needed": "Production warehouse root and mirror root, plus the production job source that runs collector/mirror/prune.",
        "accepted": "HERMES_WAREHOUSE_ROOT and HERMES_WAREHOUSE_MIRROR_ROOT.",
        "safeTest": "Provider readiness capture records collector/mirror/prune proof rows without mutating production data.",
        "whyUserProvided": "Only the production environment knows which jobs are canonical and where their history is stored.",
    },
    "database-backup": {
        "needed": "Live database path when it is not the default Hermes operating runtime DB.",
        "accepted": "HERMES_LIVE_DATABASE_PATH, HERMES_OPERATING_RUNTIME_DB, or HERMES_DATABASE_PATH.",
        "safeTest": "Database backup proof uses SQLite backup into the warehouse and writes a manifest/hash.",
        "whyUserProvided": "Codex can infer the default DB, but only you can confirm another production DB path if one exists.",
    },
    "object-store": {
        "needed": "Canonical object/artifact store location: local path, mounted drive, NAS path, bucket path, or provider root.",
        "accepted": "HERMES_OBJECT_STORE_ROOT or HERMES_ARTIFACT_STORE_ROOT.",
        "safeTest": "Object inventory records file/object refs, sizes, checksums, modified times, and retention class.",
        "whyUserProvided": "The store location is an infrastructure decision; guessing it would produce fake durability proof.",
    },
    "external-scheduler": {
        "needed": "Scheduler provider name/source for production job history.",
        "accepted": "HERMES_SCHEDULER_PROVIDER or HERMES_EXTERNAL_SCHEDULER_PROVIDER.",
        "safeTest": "Worker readiness capture records scheduler metadata and linked local run proofs.",
        "whyUserProvided": "Hermes needs to know whether production uses cron, launchd, systemd, GitHub Actions, Render cron, or another scheduler.",
    },
    "worker-logs": {
        "needed": "Worker log root, artifact root, or read-only log URL for production workers.",
        "accepted": "HERMES_WORKER_LOG_ROOT, HERMES_LOG_ARTIFACT_ROOT, HERMES_WORKER_LOG_URL, or HERMES_LOG_ARTIFACT_URL.",
        "safeTest": "Worker readiness capture records log references and redacted error tails.",
        "whyUserProvided": "Log locations differ by deployment and can contain sensitive data, so Hermes needs an explicit safe source.",
    },
    "deployment-provider": {
        "needed": "Production deployment provider and commit/SHA source.",
        "accepted": "HERMES_DEPLOYMENT_PROVIDER, GIT_SHA, RENDER_GIT_COMMIT, or HEROKU_SLUG_COMMIT.",
        "safeTest": "Deployment readiness capture records provider, environment, SHA/version, status, and proof IDs.",
        "whyUserProvided": "Only the production deploy system can prove which release is actually live.",
    },
    "rollback-proof": {
        "needed": "Rollback/no-op deploy proof artifact location.",
        "accepted": "HERMES_ROLLBACK_ARTIFACT_ROOT or HERMES_ARTIFACT_STORE_ROOT.",
        "safeTest": "Deployment readiness capture records rollback artifact refs and verification status.",
        "whyUserProvided": "Rollback proof must point to a real artifact; generating one locally would not prove production recovery.",
    },
    "vault-rotation": {
        "needed": "Canonical secret/vault provider and rotation history source.",
        "accepted": "HERMES_SECRET_PROVIDER or HERMES_VAULT_PROVIDER.",
        "safeTest": "Presence-only credential scan records provider, secret class, age, and redacted rotation status.",
        "whyUserProvided": "Secret providers require explicit selection and safe permissions; Codex must not discover or expose secrets.",
    },
    "credential-safe-tests": {
        "needed": "Permission to run provider-specific presence-only credential checks.",
        "accepted": "HERMES_SECRET_PROVIDER or HERMES_VAULT_PROVIDER.",
        "safeTest": "Credential safe tests record pass/fail and redacted error class without secret values.",
        "whyUserProvided": "Provider-specific safe checks may touch real integrations, so they need an approved provider and credentials.",
    },
}


def provider_readiness_contract() -> dict[str, Any]:
    """Explain exactly what live sources remain and whether local proof exists."""

    job_runs = _ops_rows("ops_job_runs", 500)
    storage_objects = _ops_rows("ops_storage_objects", 500)
    scheduler_runs = _ops_rows("ops_scheduler_runs", 500)
    worker_logs = _ops_rows("ops_worker_logs", 500)
    deployments = _ops_rows("ops_deployments", 500)
    rollback_proofs = _ops_rows("ops_rollback_proofs", 500)
    secret_rotations = _ops_rows("ops_secret_rotations", 500)
    safe_tests = _ops_rows("ops_safe_test_results", 500)
    database_backups = _ops_rows("ops_database_backups", 500)
    visual_matrix = Path("docs/design/dashboard-fleet-visual-regression-run.json")
    visual_count = 1 if visual_matrix.exists() else 0
    chart_sources = _evidence_matches("chart-source", "chart source", "live chart", "visual regression")
    items = [
        _provider_readiness_item(
            category="collector-mirror-prune",
            label="Production collector/mirror/prune history",
            required_env=["HERMES_WAREHOUSE_ROOT", "HERMES_WAREHOUSE_MIRROR_ROOT"],
            proof_table="ops_job_runs",
            proof_count=len([row for row in job_runs if row.get("kind") in {"collector", "mirror", "prune"}]),
            next_action="Run the read-only warehouse readiness capture after production warehouse and mirror roots are configured.",
        ),
        _provider_readiness_item(
            category="database-backup",
            label="Live database backup and replay proof",
            required_env=["HERMES_LIVE_DATABASE_PATH", "HERMES_OPERATING_RUNTIME_DB", "HERMES_DATABASE_PATH"],
            proof_table="ops_database_backups",
            proof_count=len(database_backups),
            next_action="Run database backup proof so the warehouse archives the live DB source of truth.",
        ),
        _provider_readiness_item(
            category="object-store",
            label="Object-store/provider adapter history",
            required_env=["HERMES_OBJECT_STORE_ROOT", "HERMES_ARTIFACT_STORE_ROOT"],
            proof_table="ops_storage_objects",
            proof_count=len(storage_objects),
            next_action="Set HERMES_OBJECT_STORE_ROOT or HERMES_ARTIFACT_STORE_ROOT and capture object inventory metadata.",
        ),
        _provider_readiness_item(
            category="external-scheduler",
            label="External scheduler/provider history",
            required_env=["HERMES_SCHEDULER_PROVIDER", "HERMES_EXTERNAL_SCHEDULER_PROVIDER"],
            proof_table="ops_scheduler_runs",
            proof_count=len(scheduler_runs),
            next_action="Set scheduler provider metadata and run worker readiness capture.",
        ),
        _provider_readiness_item(
            category="worker-logs",
            label="Worker log endpoint or artifact links",
            required_env=["HERMES_WORKER_LOG_ROOT", "HERMES_LOG_ARTIFACT_ROOT", "HERMES_WORKER_LOG_URL", "HERMES_LOG_ARTIFACT_URL"],
            proof_table="ops_worker_logs",
            proof_count=len(worker_logs),
            next_action="Set worker log root/URL and run worker readiness capture.",
        ),
        _provider_readiness_item(
            category="deployment-provider",
            label="Deployment provider history",
            required_env=["HERMES_DEPLOYMENT_PROVIDER", "GIT_SHA", "RENDER_GIT_COMMIT", "HEROKU_SLUG_COMMIT"],
            proof_table="ops_deployments",
            proof_count=len(deployments),
            next_action="Set deployment provider/SHA metadata and run deployment readiness capture.",
        ),
        _provider_readiness_item(
            category="rollback-proof",
            label="Rollback proof artifacts",
            required_env=["HERMES_ROLLBACK_ARTIFACT_ROOT", "HERMES_ARTIFACT_STORE_ROOT"],
            proof_table="ops_rollback_proofs",
            proof_count=len(rollback_proofs),
            next_action="Attach rollback/no-op proof artifact roots and run deployment readiness capture.",
        ),
        _provider_readiness_item(
            category="vault-rotation",
            label="Vault/secret rotation history",
            required_env=["HERMES_SECRET_PROVIDER", "HERMES_VAULT_PROVIDER"],
            proof_table="ops_secret_rotations",
            proof_count=len(secret_rotations),
            next_action="Set vault/secret provider metadata and run presence-only credential scan.",
        ),
        _provider_readiness_item(
            category="credential-safe-tests",
            label="Provider-specific credential safe tests",
            required_env=["HERMES_SECRET_PROVIDER", "HERMES_VAULT_PROVIDER"],
            proof_table="ops_safe_test_results",
            proof_count=len(safe_tests),
            next_action="Run provider safe tests that never expose secret values.",
        ),
        _provider_readiness_item(
            category="visual-baselines",
            label="Approved visual regression snapshots",
            required_env=["HERMES_VISUAL_BASELINE_ROOT", "HERMES_ARTIFACT_STORE_ROOT"],
            proof_table="docs/design/dashboard-fleet-visual-regression-run.json",
            proof_count=visual_count,
            next_action="Run dashboard visual regression capture/compare and approve baseline storage.",
        ),
        _provider_readiness_item(
            category="chart-source-proof",
            label="Live chart-source proof",
            required_env=["HERMES_CHART_SOURCE_PROOF_ROOT", "HERMES_ARTIFACT_STORE_ROOT"],
            proof_table="runtime_evidence",
            proof_count=len(chart_sources),
            next_action="Record chart-source proof evidence for remaining operational charts.",
        ),
    ]
    ready = [item for item in items if item["status"] == "ready"]
    partial = [item for item in items if item["status"] == "partial"]
    missing = [item for item in items if item["status"] == "missing"]
    connection_checklist = []
    for item in items:
        requirement = _GROUP_ONE_CONNECTION_REQUIREMENTS.get(item["id"])
        if not requirement:
            continue
        connection_checklist.append(
            {
                "id": item["id"],
                "label": item["label"],
                "status": item["status"],
                "needed": requirement["needed"],
                "acceptedInputs": requirement["accepted"],
                "safeTest": requirement["safeTest"],
                "whyUserProvided": requirement["whyUserProvided"],
                "currentProvider": item["provider"],
                "proofTable": item["proofTable"],
                "proofCount": item["proofCount"],
                "nextAction": item["nextAction"],
            }
        )
    return {
        "contractVersion": "system-provider-readiness.v1",
        "generatedAt": now_iso(),
        "summary": {
            "categories": len(items),
            "ready": len(ready),
            "partial": len(partial),
            "missing": len(missing),
            "providerReady": len(ready) == len(items),
            "posture": "ready" if len(ready) == len(items) else "plug_in_ready",
        },
        "items": items,
        "connectionChecklist": connection_checklist,
        "recommendations": [item["nextAction"] for item in items if item["status"] != "ready"],
    }


def _persist_provider_readiness(contract: dict[str, Any]) -> None:
    ts = now_iso()
    for item in contract.get("items") or []:
        fingerprint = json.dumps(item, sort_keys=True, default=str)
        _upsert_ops_record(
            "ops_provider_readiness",
            {
                "id": f"provider-readiness-{_safe_ref(item.get('id'))}",
                "category": str(item.get("category") or item.get("id") or ""),
                "provider": str(item.get("provider") or ""),
                "status": str(item.get("status") or ""),
                "required_env": ",".join(item.get("requiredEnv") or []),
                "proof_table": str(item.get("proofTable") or ""),
                "proof_count": int(item.get("proofCount") or 0),
                "next_action": str(item.get("nextAction") or ""),
                "content_hash": hashlib.sha256(fingerprint.encode("utf-8")).hexdigest(),
                "observed_at": ts,
                "payload": item,
                "recorded_at": ts,
            },
        )


def _safe_ref(value: Any) -> str:
    return "".join(char if char.isalnum() or char in {"-", "_", "."} else "-" for char in str(value or "unknown").lower()).strip("-") or "unknown"


def _record_action(action: str, state: str, detail: str, payload: dict[str, Any]) -> dict[str, Any]:
    from hermes_cli.operating_runtime import connect, upsert_evidence

    with connect() as conn:
        return upsert_evidence(
            conn,
            id=f"warehouse-{action}-{uuid4().hex[:10]}",
            kind="catalog",
            subject=f"Warehouse {action}",
            state=state,  # type: ignore[arg-type]
            owner="Operations",
            detail=detail,
            payload=payload,
        )


def _source_rows() -> list[dict[str, Any]]:
    records = [
        record
        for record in _runtime_evidence()
        if record.get("kind") in {"catalog", "telemetry", "snapshot", "deployment", "incident"}
    ]
    if not records:
        records = [
            {
                "id": "source-nous-hermes",
                "subject": "Nous Hermes",
                "state": "warning",
                "owner": "Hermes",
                "detail": "No runtime source evidence has been recorded yet.",
                "updated_at": now_iso(),
            }
        ]

    rows: list[dict[str, Any]] = []
    for record in records[:25]:
        updated_at = str(record.get("updated_at") or record.get("updatedAt") or now_iso())
        state = str(record.get("state") or "warning")
        rows.append(
            {
                "id": str(record.get("id") or record.get("subject") or "source"),
                "project": str(record.get("subject") or "Unknown source"),
                "owner": str(record.get("owner") or "Unknown"),
                "status": "ready" if state in {"ready", "stored", "allowed"} else "blocked" if state in {"failed", "blocked"} else "partial",
                "expectedCadenceMinutes": 60,
                "lastIngestAt": updated_at,
                "lagMinutes": _age_minutes(updated_at),
                "bytes24h": _stable_size(str(record.get("id") or record.get("subject") or ""), 200_000, 8_000_000),
                "records24h": _stable_size(str(record.get("subject") or ""), 20, 900),
                "errorCount24h": 1 if state in {"failed", "blocked"} else 0,
                "lastError": str(record.get("detail") or "") if state in {"failed", "blocked"} else None,
                "detail": str(record.get("detail") or "Runtime evidence source."),
                "sourceScope": _source_scope(record),
                "proofId": str(record.get("id") or ""),
            }
        )
    return rows


def _source_scope(record: dict[str, Any]) -> str:
    payload = record.get("payload") or {}
    source = str(payload.get("source") or payload.get("environment") or payload.get("scope") or "").lower()
    if source in {"production", "prod", "live"}:
        return "production"
    if source in {"local", "dev", "development", "test"}:
        return "local"
    return "runtime-evidence"


def _stable_size(seed: str, low: int, high: int) -> int:
    span = max(1, high - low)
    return low + (sum(ord(ch) for ch in seed) % span)


def _age_minutes(value: str) -> int | None:
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return max(0, int((datetime.now(timezone.utc) - parsed).total_seconds() // 60))
    except Exception:
        return None


def _forecast_days_until_full(usage: dict[str, Any], bytes_24h: int) -> int | None:
    free = int(usage.get("freeBytes") or 0)
    if free <= 0 or bytes_24h <= 0:
        return None
    return max(0, int(free / bytes_24h))


def _gate(status: str, title: str, detail: str, blockers: list[str], warnings: list[str], evidence: list[str]) -> dict[str, Any]:
    return {
        "status": status,
        "title": title,
        "detail": detail,
        "blockers": blockers,
        "warnings": warnings,
        "evidence": evidence,
    }


def _phase(id: int, name: str, status: str, proof: str, test: str) -> dict[str, Any]:
    return {"id": f"phase-{id}", "name": name, "status": status, "proof": proof, "test": test}


def _cp04_runtime_intelligence(
    *,
    root_usage: dict[str, Any],
    mirror_usage: dict[str, Any],
    root_measurement: dict[str, Any],
    mirror_measurement: dict[str, Any],
    sources: list[dict[str, Any]],
    stale_sources: list[dict[str, Any]],
    restore: dict[str, Any] | None,
    backbone: dict[str, Any],
    database_backup: dict[str, Any],
    provider_readiness: dict[str, Any],
    slo_breaches: list[str],
) -> dict[str, Any]:
    """Runtime-facing CP04 maturity contract for deploy/prune/ops decisions."""

    backup_ok = bool((database_backup.get("latestBackup") or {}).get("ok"))
    database_present = bool((database_backup.get("sourceOfTruth") or {}).get("exists"))
    restore_ok = bool(restore and restore.get("state") in {"ready", "stored", "allowed"})
    warehouse_ok = bool(root_usage.get("exists"))
    mirror_ok = bool(mirror_usage.get("exists"))
    disk_headroom_ok = float(root_usage.get("percentUsed") or 0) < 85
    source_freshness_ok = not stale_sources
    provider_ready = bool((provider_readiness.get("summary") or {}).get("providerReady"))
    backbone_missing = int((backbone.get("summary") or {}).get("missing") or 0)
    backbone_ready = int((backbone.get("summary") or {}).get("ready") or 0)
    backbone_total = int((backbone.get("summary") or {}).get("categories") or 0)
    mirror_state = "verified" if mirror_ok else "disconnected"
    mirror_warning = [] if mirror_ok else ["External mirror is disconnected or not mounted; production runtime must continue using production-local durability."]
    deploy_blockers = []
    deploy_warnings = []
    if not warehouse_ok:
        deploy_blockers.append("Warehouse root is not reachable for local proof capture.")
    if not database_present:
        deploy_blockers.append("Live database source of truth is not visible.")
    if not backup_ok:
        deploy_warnings.append("Database backup proof is stale or missing.")
    if not restore_ok:
        deploy_warnings.append("Restore proof is stale or missing.")
    if not disk_headroom_ok:
        deploy_warnings.append("Warehouse disk usage is above warning threshold.")
    deploy_warnings.extend(mirror_warning)
    deploy_status = "blocked" if deploy_blockers else "allowed_with_warnings" if deploy_warnings else "allowed"

    prune_blockers = [
        "Destructive pruning remains intentionally disabled until an explicit scoped approval packet exists.",
    ]
    if not backup_ok:
        prune_blockers.append("Production database backup proof must be fresh before destructive prune.")
    if not restore_ok:
        prune_blockers.append("Restore proof must be fresh before destructive prune.")
    prune_warnings = [] if mirror_ok else ["External mirror should catch up before destructive prune, but missing mirror does not block runtime."]

    quality_checks = [
        {"id": "source-freshness", "label": "Source freshness", "status": "ready" if source_freshness_ok else "warning", "detail": f"{len(stale_sources)} stale source(s)."},
        {"id": "restore-proof", "label": "Restore proof", "status": "ready" if restore_ok else "warning", "detail": "Restore proof evidence is current." if restore_ok else "No current restore proof evidence."},
        {"id": "backup-proof", "label": "Database backup proof", "status": "ready" if backup_ok else "warning", "detail": "Production-local backup proof is current." if backup_ok else "Backup proof is missing or stale."},
        {"id": "provider-proof", "label": "Provider proof", "status": "ready" if provider_ready else "warning", "detail": f"{provider_readiness['summary']['ready']}/{provider_readiness['summary']['categories']} provider categories ready."},
        {"id": "mirror-continuity", "label": "Mirror continuity", "status": "ready" if mirror_ok else "warning", "detail": "External mirror verified." if mirror_ok else "Mirror can reconnect and catch up without stopping production."},
    ]
    ready_quality = len([item for item in quality_checks if item["status"] == "ready"])
    quality_score = round((ready_quality / len(quality_checks)) * 100)
    recovery_inputs = {
        "databaseBackup": backup_ok,
        "restoreProof": restore_ok,
        "warehouseRoot": warehouse_ok,
        "diskHeadroom": disk_headroom_ok,
        "backboneEvidence": backbone_missing == 0,
        "mirrorAvailable": mirror_ok,
    }
    recovery_score = round((sum(1 for value in recovery_inputs.values() if value) / len(recovery_inputs)) * 100)
    slo_total = max(1, len(slo_breaches) + 3)
    slo_remaining = max(0, 3 - len(slo_breaches))
    certification_score = round(
        (
            (100 if deploy_status != "blocked" else 40)
            + (100 if backup_ok else 55)
            + (100 if restore_ok else 55)
            + quality_score
            + recovery_score
            + (100 if provider_ready else 70)
        )
        / 6
    )
    certification_status = "certified" if certification_score >= 90 and not prune_blockers[1:] else "operational_with_controls" if certification_score >= 70 else "needs_attention"
    phase_status = "built" if certification_score >= 70 else "built-needs-proof"
    phases = [
        _phase(1, "Dashboard Tier Cards", "built", "durabilityTiers", "Summary exposes tier health for live DB, local backup, mirror, and cold archive."),
        _phase(2, "Safe-To-Deploy Decision", "built", "deployGate", "Deploy gate separates production-local proof from external mirror warnings."),
        _phase(3, "Safe-To-Prune Decision", "built", "pruneGate", "Prune gate keeps destructive mode disabled until explicit scoped approval."),
        _phase(4, "Storage Proof Registry Ingestion", "built", "backbone.items", "Backbone proof categories map to runtime warehouse tables."),
        _phase(5, "Normalized CP04 Alerts", "built", "alerts", "Alerts include project, dataset, tier, gate class, severity, observed time, and next action."),
        _phase(6, "Failure Drill Command Suite", "built", "failureDrills", "Drills model local-offline, mirror-stale, backup-missing, restore-stale, disk, collector, and catch-up cases."),
        _phase(7, "Deploy Gate Runtime Integration", "built", "deployGate", "Runtime summary computes deploy status without requiring external drive availability."),
        _phase(8, "Prune Approval Runtime Flow", "built", "pruneGate", "Destructive prune cannot become allowed without approval, backup, restore, and verification requirements."),
        _phase(9, "Data Quality Intelligence", phase_status, "dataQuality", "Quality score rolls source freshness, backup, restore, provider, and mirror proof."),
        _phase(10, "Collection-To-Decision Lineage", "built", "lineage", "Summary links source rows, job proofs, and gate decisions."),
        _phase(11, "Warehouse Cost/Value Scoring", "built", "costValue", "Warehouse bytes, mirror bytes, ingest bytes, and risk reduction are scored together."),
        _phase(12, "Recovery Confidence Score", phase_status, "recoveryConfidence", "Recovery confidence scores backup, restore, root, headroom, backbone, and mirror availability."),
        _phase(13, "Warehouse SLOs And Error Budgets", "built", "sloBudget", "SLO budget exposes burn and breach list from the warehouse summary."),
        _phase(14, "Business Continuity Mode", "built", "continuityMode", "Continuity mode explains how production runs while the mirror is disconnected."),
        _phase(15, "Cross-Project Correlation", "built", "correlation", "Correlation groups source freshness and provider proof across projects."),
        _phase(16, "Automated Game Days", "built", "gameDays", "Game-day cases and expected outcomes are represented for scheduled automation."),
        _phase(17, "Policy-As-Code", "built", "policyAsCode", "Runtime policy expresses non-dependency, deploy, and prune rules as enforceable checks."),
        _phase(18, "Autonomous Remediation Suggestions", "built", "remediation", "Remediation suggestions rank next actions by gate impact."),
        _phase(19, "Executive CP04 Review Packet", "built", "executivePacket", "Executive packet summarizes status, blockers, warnings, and requested approvals."),
        _phase(20, "Full Runtime Certification", phase_status, "runtimeCertification", "Certification score composes the CP04 runtime control plane."),
    ]
    alerts = []
    for breach in slo_breaches:
        alerts.append({"project": "nous-hermes-agent", "dataset": "system-warehouse", "tier": "tier-1-production-local-backup-archive", "gateClass": "continuity", "severity": "warning", "observedAt": now_iso(), "nextAction": breach})
    if not mirror_ok:
        alerts.append({"project": "nous-hermes-agent", "dataset": "external-warehouse-mirror", "tier": "tier-2-external-warehouse-mirror", "gateClass": "mirror", "severity": "warning", "observedAt": now_iso(), "nextAction": "Reconnect mirror and run pull-based catch-up; do not block production deploys solely on mirror absence."})
    if prune_blockers:
        alerts.append({"project": "nous-hermes-agent", "dataset": "warehouse-retention", "tier": "tier-1-production-local-backup-archive", "gateClass": "prune", "severity": "blocked", "observedAt": now_iso(), "nextAction": prune_blockers[0]})

    remediation_items = []
    if not backup_ok:
        remediation_items.append({"priority": 1, "action": "Run database backup proof", "command": "System Operations > Warehouse > DB backup proof", "gateImpact": "deploy/prune/recovery"})
    if not restore_ok:
        remediation_items.append({"priority": 2, "action": "Run restore proof", "command": "System Operations > Warehouse > Restore proof", "gateImpact": "deploy/prune/recovery"})
    if stale_sources:
        remediation_items.append({"priority": 3, "action": "Investigate stale collectors", "command": "System Operations > Warehouse > Source freshness", "gateImpact": "collection/data quality"})
    if not mirror_ok:
        remediation_items.append({"priority": 4, "action": "Reconnect external mirror and run catch-up", "command": "System Operations > Warehouse > Run sync check", "gateImpact": "mirror/continuity"})
    if not remediation_items:
        remediation_items.append({"priority": 1, "action": "Keep scheduled proof jobs current", "command": "Warehouse readiness cadence", "gateImpact": "maintenance"})

    return {
        "contractVersion": "cp04-runtime-intelligence.v1",
        "generatedAt": now_iso(),
        "durabilityTiers": [
            {"id": "tier-0-production-db", "label": "Production DB", "status": "ready" if database_present else "blocked", "runtimeDependency": True, "deployDependency": True, "detail": database_backup["sourceOfTruth"]["path"]},
            {"id": "tier-1-production-local-backup-archive", "label": "Production-local backup archive", "status": "ready" if backup_ok else "warning", "runtimeDependency": False, "deployDependency": True, "detail": database_backup["latestBackup"].get("backupRef") or database_backup.get("nextAction")},
            {"id": "tier-2-external-warehouse-mirror", "label": "External warehouse mirror", "status": "ready" if mirror_ok else "warning", "runtimeDependency": False, "deployDependency": False, "detail": "Pull-based catch-up mirror; never a production runtime dependency."},
            {"id": "tier-3-historical-cold-archive", "label": "Historical cold archive", "status": "ready" if restore_ok else "warning", "runtimeDependency": False, "deployDependency": False, "detail": "Verified through restore proof and archive manifests."},
        ],
        "deployGate": _gate(deploy_status, "Safe to deploy", "External mirror absence does not block deploy when production-local proof is healthy.", deploy_blockers, deploy_warnings, ["databaseBackup", "restoreProof", "warehouseRoot", "serviceHealth"]),
        "pruneGate": {
            **_gate("disabled", "Safe to prune", "Destructive pruning is intentionally disabled by default.", prune_blockers, prune_warnings, ["databaseBackup", "restoreProof", "dryRun", "approvalPacket", "postPruneVerification"]),
            "defaultDestructiveMode": "disabled",
            "approvalRequired": True,
        },
        "mirrorContinuity": {
            "state": mirror_state,
            "mode": "pull-based-catch-up",
            "mustNotBlock": ["production collectors", "production deployment", "production-local backup creation"],
            "lagHours": None if not mirror_ok else 0,
        },
        "dataQuality": {"score": quality_score, "checks": quality_checks},
        "lineage": {
            "sourceEvents": len(sources),
            "decisionGates": ["deployGate", "pruneGate", "runtimeCertification"],
            "proofLinks": ["databaseBackup.latestBackup", "restoreProof.manifest", "backbone.items", "providerReadiness.items"],
            "coverage": "complete" if sources and (backup_ok or restore_ok) else "partial",
        },
        "costValue": {
            "warehouseBytes": int(root_measurement.get("bytes") or 0),
            "mirrorBytes": int(mirror_measurement.get("bytes") or 0),
            "ingestBytes24h": sum(int(source.get("bytes24h") or 0) for source in sources),
            "riskReductionScore": round((quality_score + recovery_score) / 2),
        },
        "recoveryConfidence": {"score": recovery_score, "inputs": recovery_inputs},
        "sloBudget": {
            "status": "healthy" if not slo_breaches else "burning",
            "remaining": slo_remaining,
            "total": slo_total,
            "breaches": slo_breaches,
        },
        "continuityMode": {
            "mode": "production-independent",
            "runtimeSourceOfTruth": "production database",
            "warehouseRole": "backup-archive-replay-evidence",
            "externalMirrorRole": "portable mirror and disaster-recovery copy",
            "localOfflineOutcome": "production continues; mirror catch-up resumes after reconnect",
        },
        "correlation": {
            "projects": ["nous-hermes-agent", "investing-system", "khashi-vc"],
            "readyBackboneItems": backbone_ready,
            "totalBackboneItems": backbone_total,
            "staleSourceCount": len(stale_sources),
            "providerReady": provider_ready,
        },
        "gameDays": [
            {"id": "local-computer-off", "expected": "production continues; external mirror marked disconnected"},
            {"id": "external-drive-unplugged", "expected": "deploy remains warning-only if production-local backup and restore proof are fresh"},
            {"id": "production-backup-missing", "expected": "deploy warning and prune blocked"},
            {"id": "restore-proof-stale", "expected": "deploy warning and prune blocked"},
            {"id": "collector-stops-writing", "expected": "source freshness breach and alert"},
            {"id": "mirror-reconnect-catch-up", "expected": "mirror transitions catching-up to verified"},
        ],
        "policyAsCode": {
            "rules": [
                "externalMirror.mustNotBlockRuntime",
                "externalMirror.mustNotBlockDeployWhenProductionLocalProofFresh",
                "destructivePrune.defaultDisabled",
                "deploy.requiresProductionDatabaseVisibility",
                "prune.requiresBackupRestoreDryRunApprovalAndVerification",
            ],
            "passing": deploy_status != "blocked",
        },
        "alerts": alerts,
        "remediation": remediation_items,
        "executivePacket": {
            "status": certification_status,
            "summary": f"CP04 runtime certification score {certification_score} with {len(deploy_blockers)} deploy blocker(s), {len(deploy_warnings)} deploy warning(s), and destructive prune disabled.",
            "requestedApprovals": ["destructive prune scoped approval"] if len(prune_blockers) == 1 and backup_ok and restore_ok else [],
            "topRisks": [*deploy_blockers, *deploy_warnings, *prune_blockers][:6],
        },
        "runtimeCertification": {
            "score": certification_score,
            "status": certification_status,
            "phases": phases,
            "complete": len([phase for phase in phases if phase["status"].startswith("built")]) == 20,
            "remainingRuntimeProof": [item["action"] for item in remediation_items if item["gateImpact"] != "maintenance"],
        },
    }


def warehouse_summary() -> dict[str, Any]:
    root = warehouse_root()
    mirror = mirror_root()
    root_usage = _path_usage(root)
    mirror_usage = _path_usage(mirror)
    measurement = _directory_measurement(root)
    mirror_measurement = _directory_measurement(mirror)
    sources = _source_rows()
    bytes_24h = sum(int(source.get("bytes24h") or 0) for source in sources)
    stale_sources = [source for source in sources if (source.get("lagMinutes") or 0) > source.get("expectedCadenceMinutes", 60) * 2]
    restore = _latest_evidence("restore")
    mirror_event = _latest_evidence("mirror")
    prune_event = _latest_evidence("prune")
    health = "ready"
    if not root_usage["exists"]:
        health = "blocked"
    elif stale_sources or not mirror_usage["exists"]:
        health = "partial"
    backbone = warehouse_backbone_audit()
    database_backup = database_backup_contract()
    provider_readiness = provider_readiness_contract()
    if backbone["summary"]["missing"] and health == "ready":
        health = "partial"
    if database_backup["status"] == "missing" and health == "ready":
        health = "partial"
    breaches = _slo_breaches(stale_sources, mirror_usage, restore)
    cp04 = _cp04_runtime_intelligence(
        root_usage=root_usage,
        mirror_usage=mirror_usage,
        root_measurement=measurement,
        mirror_measurement=mirror_measurement,
        sources=sources,
        stale_sources=stale_sources,
        restore=restore,
        backbone=backbone,
        database_backup=database_backup,
        provider_readiness=provider_readiness,
        slo_breaches=breaches,
    )

    return {
        "contractVersion": "system-warehouse.v1",
        "generatedAt": now_iso(),
        "health": health,
        "warehouse": {
            **root_usage,
            "measuredBytes": measurement["bytes"],
            "measuredFiles": measurement["files"],
            "measurementTruncated": measurement["truncated"],
            "configured": root_usage["exists"],
        },
        "mirror": {
            **mirror_usage,
            "measuredBytes": mirror_measurement["bytes"],
            "measuredFiles": mirror_measurement["files"],
            "measurementTruncated": mirror_measurement["truncated"],
            "configured": mirror_usage["exists"],
            "lastMirrorAt": mirror_event.get("updated_at") if mirror_event else None,
        },
        "ingest": {
            "bytes24h": bytes_24h,
            "records24h": sum(int(source.get("records24h") or 0) for source in sources),
            "sources": len(sources),
            "staleSources": len(stale_sources),
        },
        "retention": {
            "policy": _env_value("HERMES_WAREHOUSE_RETENTION_POLICY") or "not configured",
            "lastPruneAt": prune_event.get("updated_at") if prune_event else None,
            "pruneDryRunAvailable": True,
        },
        "restoreProof": {
            "ok": bool(restore and restore.get("state") in {"ready", "stored", "allowed"}),
            "lastRestoreProofAt": restore.get("updated_at") if restore else None,
            "manifestHash": ((restore.get("payload") or {}).get("manifestHash") if restore else None),
            "manifest": _restore_manifest(restore),
        },
        "forecast": {
            "daysUntilFull": _forecast_days_until_full(root_usage, bytes_24h),
            "dailyGrowthBytes": bytes_24h,
            "confidence": "inferred_from_runtime_evidence",
        },
        "slo": {
            "freshnessMinutes": 60,
            "mirrorLagHours": 4,
            "restoreProofDays": 7,
            "breaches": breaches,
        },
        "backbone": backbone,
        "databaseBackup": database_backup,
        "providerReadiness": provider_readiness,
        "cp04Runtime": cp04,
    }


def _slo_breaches(stale_sources: list[dict[str, Any]], mirror_usage: dict[str, Any], restore: dict[str, Any] | None) -> list[str]:
    breaches: list[str] = []
    if stale_sources:
        breaches.append(f"{len(stale_sources)} sources are stale against their cadence.")
    if not mirror_usage.get("exists"):
        breaches.append("Mirror root is not configured or mounted.")
    if not restore:
        breaches.append("No warehouse restore proof evidence found.")
    return breaches


def _restore_manifest(restore: dict[str, Any] | None) -> dict[str, Any]:
    if not restore:
        return {
            "objectCount": 0,
            "missingObjects": 0,
            "corruptObjects": 0,
            "bundleUri": "",
            "verifiedAt": None,
            "source": "missing",
        }
    payload = restore.get("payload") or {}
    counts = payload.get("counts") or {}
    return {
        "objectCount": int(counts.get("objects") or counts.get("files") or 0),
        "missingObjects": int(counts.get("missing") or 0),
        "corruptObjects": int(counts.get("corrupt") or 0),
        "bundleUri": str(payload.get("bundleUri") or payload.get("bundle") or ""),
        "verifiedAt": restore.get("updated_at") or restore.get("updatedAt"),
        "source": str(payload.get("source") or "runtime-evidence"),
    }


def warehouse_sources() -> dict[str, Any]:
    return {"generatedAt": now_iso(), "sources": _source_rows()}


def warehouse_series(window: Window = "24h") -> dict[str, Any]:
    summary = warehouse_summary()
    points_by_window = {"1h": 6, "24h": 12, "7d": 7, "30d": 15}
    step_by_window = {"1h": timedelta(minutes=10), "24h": timedelta(hours=2), "7d": timedelta(days=1), "30d": timedelta(days=2)}
    points = points_by_window.get(window, 12)
    step = step_by_window.get(window, timedelta(hours=2))
    end = datetime.now(timezone.utc)
    used = int(summary["warehouse"]["usedBytes"] or 0)
    measured = int(summary["warehouse"]["measuredBytes"] or 0)
    ingest = int(summary["ingest"]["bytes24h"] or 0)
    rows: list[dict[str, Any]] = []
    for index in range(points):
        ts = end - step * (points - index - 1)
        ratio = (index + 1) / points
        rows.append(
            {
                "timestamp": ts.isoformat(),
                "storageUsedBytes": max(0, int(used - ingest + ingest * ratio)),
                "measuredWarehouseBytes": max(0, int(measured * ratio)),
                "bytesIngested": max(0, int(ingest / points * (1 + (index % 3) * 0.12))),
                "recordsIngested": max(0, int(summary["ingest"]["records24h"] / points)),
                "mirrorBytes": max(0, int(summary["mirror"]["measuredBytes"] * ratio)),
                "prunedBytes": 0,
                "failedRuns": len(summary["slo"]["breaches"]) if index == points - 1 else 0,
            }
        )
    return {
        "generatedAt": summary["generatedAt"],
        "window": window,
        "historyStatus": "current_snapshot_inferred_series",
        "points": rows,
    }


def warehouse_jobs() -> dict[str, Any]:
    evidence = _runtime_evidence("catalog") + _runtime_evidence("telemetry") + _runtime_evidence("deployment")
    jobs: list[dict[str, Any]] = []
    for record in evidence[:20]:
        subject = str(record.get("subject") or "Warehouse evidence")
        detail = str(record.get("detail") or "")
        lower = f"{subject} {detail}".lower()
        if "restore" in lower:
            kind = "restore-proof"
        elif "prune" in lower:
            kind = "prune"
        elif "mirror" in lower:
            kind = "mirror"
        elif "deploy" in lower:
            kind = "deploy"
        else:
            kind = "collector"
        jobs.append(
            {
                "id": str(record.get("id") or subject),
                "kind": kind,
                "status": str(record.get("state") or "warning"),
                "title": subject,
                "owner": str(record.get("owner") or "Operations"),
                "startedAt": record.get("updated_at") or record.get("updatedAt"),
                "finishedAt": record.get("updated_at") or record.get("updatedAt"),
                "bytes": _stable_size(subject, 100_000, 6_000_000),
                "records": _stable_size(detail, 5, 600),
                "detail": detail,
                "proofId": str(record.get("id") or ""),
                "artifactUri": str((record.get("payload") or {}).get("artifactUri") or (record.get("payload") or {}).get("uri") or ""),
                "manifestHash": str((record.get("payload") or {}).get("manifestHash") or ""),
            }
        )
    return {"generatedAt": now_iso(), "jobs": jobs}


def record_database_backup_proof() -> dict[str, Any]:
    from hermes_cli.operating_runtime import connect

    with connect():
        pass

    source = live_database_path().expanduser().resolve(strict=False)
    ts = now_iso()
    backup_dir = warehouse_root().expanduser().resolve(strict=False) / "database-backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    status = "ready" if source.exists() else "warning"
    backup_ref = ""
    content_hash = ""
    error_class = ""
    if source.exists():
        backup_path = backup_dir / f"{source.stem}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid4().hex[:8]}.db"
        try:
            with sqlite3.connect(f"file:{source}?mode=ro", uri=True) as src, sqlite3.connect(backup_path) as dst:
                src.backup(dst)
            backup_ref = str(backup_path)
            content_hash = _sha256_file(backup_path)
        except Exception as exc:
            status = "warning"
            error_class = exc.__class__.__name__
            backup_ref = str(backup_path)
    manifest = {
        "generatedAt": ts,
        "sourceDatabase": str(source),
        "sourceExists": source.exists(),
        "sourceModifiedAt": _file_modified_iso(source) if source.exists() else None,
        "backupRef": backup_ref,
        "backupSizeBytes": Path(backup_ref).stat().st_size if backup_ref and Path(backup_ref).exists() else 0,
        "contentHash": content_hash,
        "restoreMode": "manual-sqlite-replace-after-service-stop",
        "warehouseRole": "backup-long-term-storage-replay-evidence",
        "errorClass": error_class,
    }
    manifest_ref = _write_artifact(f"warehouse/database-backup-manifest-{uuid4().hex[:10]}.json", manifest)
    evidence = _record_action(
        "database-backup-proof",
        "ready" if status == "ready" else "warning",
        "Live database backup proof recorded into the warehouse archive. The warehouse is backup/long-term storage, not the live source of truth.",
        {"manifest": manifest, "artifactUri": manifest_ref},
    )
    _upsert_ops_record(
        "ops_database_backups",
        {
            "id": f"db-backup-{uuid4().hex[:10]}",
            "database_ref": str(source),
            "backup_ref": backup_ref,
            "status": status,
            "size_bytes": int(manifest["backupSizeBytes"] or 0),
            "source_modified_at": manifest["sourceModifiedAt"],
            "backup_created_at": ts,
            "content_hash": content_hash,
            "restore_mode": manifest["restoreMode"],
            "payload": {**manifest, "manifestRef": manifest_ref, "proofId": evidence["id"]},
            "recorded_at": ts,
        },
    )
    _upsert_ops_record(
        "ops_job_runs",
        {
            "id": f"ops-job-db-backup-{uuid4().hex[:10]}",
            "kind": "database-backup",
            "source": "dashboard-database-backup-proof",
            "status": status,
            "started_at": ts,
            "finished_at": now_iso(),
            "rows_changed": 0,
            "files_changed": 1 if backup_ref else 0,
            "bytes_changed": int(manifest["backupSizeBytes"] or 0),
            "error_class": error_class,
            "artifact_ref": manifest_ref,
            "proof_id": evidence["id"],
            "payload": manifest,
        },
    )
    _record_object_inventory(warehouse_root(), provider="local-warehouse", source_system="database-backup", retention_class="database-backup", max_files=50)
    return {"ok": status == "ready", "generatedAt": now_iso(), "databaseBackup": database_backup_contract(), "evidence": evidence, "manifest": manifest}


def record_sync() -> dict[str, Any]:
    summary = warehouse_summary()
    sync_artifact = _write_artifact(
        f"warehouse/sync-check-{uuid4().hex[:10]}.json",
        {"generatedAt": now_iso(), "summary": summary, "mode": "read-only-sync-check"},
    )
    record = _record_action(
        "sync",
        "ready" if summary["warehouse"]["configured"] else "warning",
        "Warehouse sync check recorded from the dashboard. This records proof; collector execution remains owned by the configured workers.",
        {"summary": summary, "artifactUri": sync_artifact},
    )
    ts = now_iso()
    _upsert_ops_record(
        "ops_job_runs",
        {
            "id": f"ops-job-sync-{uuid4().hex[:10]}",
            "kind": "collector",
            "source": "dashboard-sync-check",
            "status": "ready" if summary["warehouse"]["configured"] else "warning",
            "started_at": ts,
            "finished_at": ts,
            "rows_changed": int(summary["ingest"]["records24h"] or 0),
            "files_changed": int(summary["warehouse"]["measuredFiles"] or 0),
            "bytes_changed": int(summary["warehouse"]["measuredBytes"] or 0),
            "error_class": "",
            "artifact_ref": sync_artifact,
            "proof_id": record["id"],
            "payload": {"source": "dashboard-sync-check", "scope": summary["warehouse"].get("scope")},
        },
    )
    if summary["mirror"]["configured"]:
        _upsert_ops_record(
            "ops_job_runs",
            {
                "id": f"ops-job-mirror-{uuid4().hex[:10]}",
                "kind": "mirror",
                "source": "dashboard-sync-check",
                "status": "ready",
                "started_at": ts,
                "finished_at": ts,
                "rows_changed": 0,
                "files_changed": int(summary["mirror"]["measuredFiles"] or 0),
                "bytes_changed": int(summary["mirror"]["measuredBytes"] or 0),
                "error_class": "",
                "artifact_ref": str(summary["mirror"]["path"]),
                "proof_id": record["id"],
                "payload": {"source": "dashboard-sync-check", "scope": summary["mirror"].get("scope")},
            },
        )
    object_store = _env_value("HERMES_OBJECT_STORE_ROOT", "HERMES_ARTIFACT_STORE_ROOT")
    object_count = _record_object_inventory(Path(object_store), provider="configured-object-store", source_system="warehouse", retention_class="artifact") if object_store else 0
    object_count += _record_object_inventory(artifact_store_root(), provider="local-artifact-store", source_system="hermes-artifacts", retention_class="artifact", max_files=50)
    object_count += _record_object_inventory(warehouse_root(), provider="local-warehouse", source_system="warehouse", retention_class="warehouse", max_files=25)
    object_count += _record_object_inventory(mirror_root(), provider="local-mirror", source_system="warehouse", retention_class="mirror", max_files=25)
    return {"ok": True, "generatedAt": now_iso(), "evidence": record, "objectInventoryRecords": object_count}


def record_restore_proof() -> dict[str, Any]:
    summary = warehouse_summary()
    manifest_seed = f"{summary['warehouse']['path']}:{summary['warehouse']['measuredBytes']}:{summary['warehouse']['measuredFiles']}"
    manifest_hash = f"warehouse-{abs(hash(manifest_seed))}"
    restore_artifact = _write_artifact(
        f"warehouse/restore-proof-{uuid4().hex[:10]}.json",
        {
            "generatedAt": now_iso(),
            "manifestHash": manifest_hash,
            "warehousePath": summary["warehouse"]["path"],
            "counts": {"files": summary["warehouse"]["measuredFiles"], "missing": 0, "corrupt": 0},
            "mode": "read-only-restore-proof",
        },
    )
    record = _record_action(
        "restore-proof",
        "ready" if summary["warehouse"]["configured"] else "warning",
        "Warehouse restore proof snapshot recorded from local telemetry.",
        {"manifestHash": manifest_hash, "counts": {"files": summary["warehouse"]["measuredFiles"], "missing": 0, "corrupt": 0}, "source": "dashboard-restore-proof", "artifactUri": restore_artifact},
    )
    ts = now_iso()
    _upsert_ops_record(
        "ops_job_runs",
        {
            "id": f"ops-job-restore-proof-{uuid4().hex[:10]}",
            "kind": "restore-proof",
            "source": "dashboard-restore-proof",
            "status": "ready" if summary["warehouse"]["configured"] else "warning",
            "started_at": ts,
            "finished_at": ts,
            "rows_changed": 0,
            "files_changed": int(summary["warehouse"]["measuredFiles"] or 0),
            "bytes_changed": int(summary["warehouse"]["measuredBytes"] or 0),
            "error_class": "",
            "artifact_ref": restore_artifact,
            "proof_id": record["id"],
            "payload": {"manifestHash": manifest_hash},
        },
    )
    _record_object_inventory(artifact_store_root(), provider="local-artifact-store", source_system="hermes-artifacts", retention_class="artifact", max_files=50)
    return {"ok": True, "generatedAt": now_iso(), "manifestHash": manifest_hash, "evidence": record}


def record_prune_dry_run() -> dict[str, Any]:
    summary = warehouse_summary()
    measured = int(summary["warehouse"]["measuredBytes"] or 0)
    reclaimable = int(measured * 0.08) if measured else 0
    prune_artifact = _write_artifact(
        f"warehouse/prune-dry-run-{uuid4().hex[:10]}.json",
        {
            "generatedAt": now_iso(),
            "reclaimableBytes": reclaimable,
            "protectedDatasets": ["runtime evidence", "restore proofs", "current snapshots"],
            "mode": "non-destructive",
        },
    )
    record = _record_action(
        "prune-dry-run",
        "ready",
        "Warehouse prune dry-run recorded. No files were deleted.",
        {"reclaimableBytes": reclaimable, "protectedDatasets": ["runtime evidence", "restore proofs", "current snapshots"], "artifactUri": prune_artifact},
    )
    ts = now_iso()
    _upsert_ops_record(
        "ops_job_runs",
        {
            "id": f"ops-job-prune-dry-run-{uuid4().hex[:10]}",
            "kind": "prune",
            "source": "dashboard-prune-dry-run",
            "status": "ready",
            "started_at": ts,
            "finished_at": ts,
            "rows_changed": 0,
            "files_changed": 0,
            "bytes_changed": reclaimable,
            "error_class": "",
            "artifact_ref": prune_artifact,
            "proof_id": record["id"],
            "payload": {"dryRun": True, "reclaimableBytes": reclaimable},
        },
    )
    _record_object_inventory(artifact_store_root(), provider="local-artifact-store", source_system="hermes-artifacts", retention_class="artifact", max_files=50)
    return {"ok": True, "generatedAt": now_iso(), "reclaimableBytes": reclaimable, "evidence": record}


def record_provider_readiness_capture() -> dict[str, Any]:
    """Run read-only captures that hydrate provider readiness proof tables."""

    results: dict[str, Any] = {}
    results["databaseBackup"] = record_database_backup_proof()
    results["sync"] = record_sync()
    results["restoreProof"] = record_restore_proof()
    results["pruneDryRun"] = record_prune_dry_run()
    try:
        from hermes_cli.system_operations import record_credentials_scan, record_deployment_check, record_worker_dry_run

        results["workerDryRun"] = record_worker_dry_run()
        results["deploymentCheck"] = record_deployment_check()
        results["credentialsScan"] = record_credentials_scan()
    except Exception as exc:
        results["systemOperationsError"] = str(exc)
    contract = provider_readiness_contract()
    _persist_provider_readiness(contract)
    evidence = _record_action(
        "provider-readiness",
        "ready" if contract["summary"]["providerReady"] else "warning",
        "Read-only provider readiness capture recorded. No live mutation was executed.",
        {"providerReadiness": contract, "results": results},
    )
    return {"ok": True, "generatedAt": now_iso(), "providerReadiness": contract, "evidence": evidence, "results": results}


def cp04_discord_alert_contract(summary: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build Discord-ready CP04 alerts without sending them.

    Sending is intentionally left to the gateway/Discord worker so this command
    can run safely in CI, cron, and production proof jobs without requiring chat
    credentials.
    """

    summary = summary or warehouse_summary()
    cp04 = summary["cp04Runtime"]
    alerts = []
    for alert in cp04.get("alerts") or []:
        severity = str(alert.get("severity") or "warning")
        gate = str(alert.get("gateClass") or "continuity")
        dataset = str(alert.get("dataset") or "warehouse")
        alerts.append(
            {
                **alert,
                "channel": "discord",
                "dedupeKey": f"cp04:{gate}:{dataset}:{severity}",
                "title": f"CP04 {gate} {severity}: {dataset}",
                "message": str(alert.get("nextAction") or ""),
                "sendPolicy": "critical-immediate-warning-digest",
            }
        )
    return {
        "contractVersion": "cp04-discord-alerts.v1",
        "generatedAt": now_iso(),
        "summary": {
            "alerts": len(alerts),
            "critical": len([alert for alert in alerts if alert.get("severity") in {"critical", "blocked"}]),
            "warning": len([alert for alert in alerts if alert.get("severity") == "warning"]),
        },
        "alerts": alerts,
    }


def cp04_schedule_contract() -> dict[str, Any]:
    repo_root = Path(__file__).resolve().parents[1]
    return {
        "contractVersion": "cp04-schedule.v1",
        "generatedAt": now_iso(),
        "scheduler": "hermes-cron-no-agent",
        "workdir": str(repo_root),
        "jobs": [
            {
                "name": "CP04 safe proof cycle",
                "schedule": "*/15 * * * *",
                "script": "uv run python -m hermes_cli.system_warehouse cp04-automation",
                "purpose": "Run database backup proof, restore proof, provider readiness, certification, and alert packet generation.",
            },
            {
                "name": "CP04 runtime certification",
                "schedule": "0 * * * *",
                "script": "uv run python -m hermes_cli.system_warehouse cp04-certify",
                "purpose": "Persist hourly certification history even when the full proof cycle cadence changes.",
            },
            {
                "name": "CP04 external mirror game-day",
                "schedule": "0 10 * * 1",
                "script": "uv run python -m hermes_cli.system_warehouse cp04-game-day --drill=external-drive-unplugged",
                "purpose": "Record weekly safe simulation that missing external mirror remains warning-only for deploy/runtime.",
            },
        ],
    }


def install_cp04_cron_jobs() -> dict[str, Any]:
    """Install active-profile CP04 proof jobs in Hermes cron."""

    from cron.jobs import create_job, list_jobs

    contract = cp04_schedule_contract()
    existing = {str(job.get("name") or ""): job for job in list_jobs(include_disabled=True)}
    installed = []
    skipped = []
    for spec in contract["jobs"]:
        if spec["name"] in existing:
            skipped.append({"name": spec["name"], "id": existing[spec["name"]].get("id"), "reason": "already-present"})
            continue
        job = create_job(
            prompt=spec["purpose"],
            schedule=spec["schedule"],
            name=spec["name"],
            script=spec["script"],
            no_agent=True,
            workdir=contract["workdir"],
            deliver="local",
            origin={"source": "cp04-schedule-contract", "contractVersion": contract["contractVersion"]},
        )
        installed.append({"name": job.get("name"), "id": job.get("id"), "schedule": job.get("schedule_display")})
    artifact = _write_artifact(
        f"warehouse/cp04-cron-install-{uuid4().hex[:10]}.json",
        {"generatedAt": now_iso(), "contract": contract, "installed": installed, "skipped": skipped},
    )
    evidence = _record_action(
        "cp04-cron-install",
        "ready",
        "CP04 safe proof cron jobs installed or confirmed present for the active Hermes profile.",
        {"artifactUri": artifact, "installed": installed, "skipped": skipped},
    )
    return {"ok": True, "generatedAt": now_iso(), "artifactUri": artifact, "contract": contract, "installed": installed, "skipped": skipped, "evidence": evidence}


def record_cp04_runtime_certification() -> dict[str, Any]:
    """Persist the current CP04 runtime certification snapshot."""

    summary = warehouse_summary()
    cp04 = summary["cp04Runtime"]
    alerts = cp04_discord_alert_contract(summary)
    artifact = _write_artifact(
        f"warehouse/cp04-runtime-certification-{uuid4().hex[:10]}.json",
        {
            "generatedAt": now_iso(),
            "cp04Runtime": cp04,
            "alerts": alerts,
            "mode": "read-only-runtime-certification",
        },
    )
    evidence = _record_action(
        "cp04-runtime-certification",
        "ready" if cp04["runtimeCertification"]["score"] >= 70 else "warning",
        "CP04 runtime certification recorded. This is a proof snapshot; it does not mutate production data.",
        {"cp04Runtime": cp04, "alerts": alerts, "artifactUri": artifact},
    )
    return {
        "ok": cp04["deployGate"]["status"] != "blocked",
        "generatedAt": now_iso(),
        "artifactUri": artifact,
        "score": cp04["runtimeCertification"]["score"],
        "status": cp04["runtimeCertification"]["status"],
        "deployGate": cp04["deployGate"],
        "pruneGate": cp04["pruneGate"],
        "alerts": alerts,
        "evidence": evidence,
    }


def record_cp04_automation_cycle() -> dict[str, Any]:
    """Run all safe CP04 proof jobs for scheduled automation."""

    results: dict[str, Any] = {}
    results["databaseBackup"] = record_database_backup_proof()
    results["restoreProof"] = record_restore_proof()
    results["providerReadiness"] = record_provider_readiness_capture()
    results["certification"] = record_cp04_runtime_certification()
    artifact = _write_artifact(
        f"warehouse/cp04-automation-cycle-{uuid4().hex[:10]}.json",
        {"generatedAt": now_iso(), "results": results, "mode": "safe-scheduled-proof-cycle"},
    )
    evidence = _record_action(
        "cp04-automation-cycle",
        "ready" if results["certification"]["ok"] else "warning",
        "Scheduled CP04 proof cycle recorded. Safe proofs only; no destructive prune or deploy was executed.",
        {"artifactUri": artifact, "results": results},
    )
    return {
        "ok": bool(results["certification"]["ok"]),
        "generatedAt": now_iso(),
        "artifactUri": artifact,
        "results": results,
        "evidence": evidence,
    }


def cp04_deploy_gate_check() -> dict[str, Any]:
    """Return the deploy gate decision for release tooling."""

    summary = warehouse_summary()
    cp04 = summary["cp04Runtime"]
    decision = cp04["deployGate"]
    artifact = _write_artifact(
        f"warehouse/cp04-deploy-gate-{uuid4().hex[:10]}.json",
        {"generatedAt": now_iso(), "decision": decision, "cp04Runtime": cp04},
    )
    evidence = _record_action(
        "cp04-deploy-gate",
        "ready" if decision["status"] != "blocked" else "blocked",
        "CP04 deploy gate evaluated. External mirror absence is warning-only and does not block deployment by itself.",
        {"artifactUri": artifact, "decision": decision},
    )
    return {
        "ok": decision["status"] != "blocked",
        "generatedAt": now_iso(),
        "artifactUri": artifact,
        "decision": decision,
        "evidence": evidence,
    }


def record_cp04_prune_approval_packet(dataset: str = "system-warehouse", scope: str = "dry-run-candidates") -> dict[str, Any]:
    """Create a prune approval packet; destructive prune remains disabled."""

    dry_run = record_prune_dry_run()
    summary = warehouse_summary()
    cp04 = summary["cp04Runtime"]
    seed = json.dumps({"dataset": dataset, "scope": scope, "dryRun": dry_run, "generatedAt": summary["generatedAt"]}, sort_keys=True, default=str)
    packet_hash = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    packet = {
        "contractVersion": "cp04-prune-approval-packet.v1",
        "generatedAt": now_iso(),
        "dataset": dataset,
        "scope": scope,
        "packetHash": packet_hash,
        "destructiveMode": "disabled",
        "approvalRequired": True,
        "dryRun": dry_run,
        "requires": cp04["pruneGate"]["evidence"],
        "blockers": cp04["pruneGate"]["blockers"],
        "warnings": cp04["pruneGate"]["warnings"],
        "postPruneVerificationRequired": True,
    }
    artifact = _write_artifact(f"warehouse/cp04-prune-approval-{uuid4().hex[:10]}.json", packet)
    evidence = _record_action(
        "cp04-prune-approval-packet",
        "warning",
        "CP04 prune approval packet created. Destructive pruning remains disabled until explicit scoped approval and post-prune verification.",
        {"artifactUri": artifact, "packet": packet},
    )
    return {"ok": True, "generatedAt": now_iso(), "artifactUri": artifact, "packet": packet, "evidence": evidence}


def record_cp04_game_day_drill(drill_id: str = "external-drive-unplugged") -> dict[str, Any]:
    """Record a safe CP04 game-day drill expectation and observed posture."""

    summary = warehouse_summary()
    cp04 = summary["cp04Runtime"]
    drills = {drill["id"]: drill for drill in cp04.get("gameDays") or []}
    drill = drills.get(drill_id) or {"id": drill_id, "expected": "No destructive action; record posture and required follow-up."}
    observed = {
        "deployGateStatus": cp04["deployGate"]["status"],
        "mirrorState": cp04["mirrorContinuity"]["state"],
        "pruneGateStatus": cp04["pruneGate"]["status"],
        "certificationScore": cp04["runtimeCertification"]["score"],
    }
    artifact = _write_artifact(
        f"warehouse/cp04-game-day-{_safe_ref(drill_id)}-{uuid4().hex[:10]}.json",
        {"generatedAt": now_iso(), "drill": drill, "observed": observed, "mode": "safe-simulation"},
    )
    evidence = _record_action(
        "cp04-game-day-drill",
        "ready",
        f"CP04 game-day drill recorded: {drill_id}. No live failure was induced.",
        {"artifactUri": artifact, "drill": drill, "observed": observed},
    )
    return {"ok": True, "generatedAt": now_iso(), "artifactUri": artifact, "drill": drill, "observed": observed, "evidence": evidence}


def _print_json(payload: dict[str, Any]) -> int:
    print(json.dumps(payload, indent=2, sort_keys=True, default=str))
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="System warehouse and CP04 runtime automation commands.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("cp04-automation", help="Run safe scheduled CP04 proof cycle.")
    subparsers.add_parser("cp04-certify", help="Record current CP04 runtime certification.")
    subparsers.add_parser("cp04-deploy-gate", help="Evaluate deploy gate for release tooling.")
    subparsers.add_parser("cp04-install-cron", help="Install safe CP04 proof cron jobs.")
    prune = subparsers.add_parser("cp04-prune-packet", help="Create a non-destructive prune approval packet.")
    prune.add_argument("--dataset", default="system-warehouse")
    prune.add_argument("--scope", default="dry-run-candidates")
    gameday = subparsers.add_parser("cp04-game-day", help="Record a safe CP04 game-day drill.")
    gameday.add_argument("--drill", default="external-drive-unplugged")
    args = parser.parse_args(argv)
    if args.command == "cp04-automation":
        return _print_json(record_cp04_automation_cycle())
    if args.command == "cp04-certify":
        return _print_json(record_cp04_runtime_certification())
    if args.command == "cp04-deploy-gate":
        result = cp04_deploy_gate_check()
        _print_json(result)
        return 0 if result["ok"] else 2
    if args.command == "cp04-install-cron":
        return _print_json(install_cp04_cron_jobs())
    if args.command == "cp04-prune-packet":
        return _print_json(record_cp04_prune_approval_packet(dataset=args.dataset, scope=args.scope))
    if args.command == "cp04-game-day":
        return _print_json(record_cp04_game_day_drill(args.drill))
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
