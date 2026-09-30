from pathlib import Path


def test_warehouse_summary_reports_configured_root(tmp_path, monkeypatch):
    warehouse = tmp_path / "warehouse"
    mirror = tmp_path / "mirror"
    warehouse.mkdir()
    mirror.mkdir()
    (warehouse / "events.jsonl").write_text("one\ntwo\n", encoding="utf-8")

    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.setenv("HERMES_WAREHOUSE_ROOT", str(warehouse))
    monkeypatch.setenv("HERMES_WAREHOUSE_MIRROR_ROOT", str(mirror))

    from hermes_cli.system_warehouse import warehouse_summary

    summary = warehouse_summary()
    assert summary["contractVersion"] == "system-warehouse.v1"
    assert summary["warehouse"]["configured"] is True
    assert summary["warehouse"]["measuredFiles"] == 1
    assert summary["warehouse"]["scope"] in {"local", "production", "unknown"}
    assert summary["warehouse"]["mountProof"]["pathExists"] is True
    assert summary["mirror"]["configured"] is True
    assert summary["restoreProof"]["manifest"]["source"] in {"missing", "runtime-evidence", "dashboard-restore-proof"}
    assert "ingest" in summary
    assert "slo" in summary
    assert summary["backbone"]["contractVersion"] == "warehouse-backbone-audit.v1"
    assert summary["backbone"]["summary"]["categories"] == 8
    assert "ops_job_runs" in summary["backbone"]["requiredTables"]


def test_warehouse_series_has_points(tmp_path, monkeypatch):
    warehouse = tmp_path / "warehouse"
    warehouse.mkdir()
    (warehouse / "payload.bin").write_bytes(b"x" * 128)

    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.setenv("HERMES_WAREHOUSE_ROOT", str(warehouse))

    from hermes_cli.system_warehouse import warehouse_series

    series = warehouse_series("24h")
    assert series["window"] == "24h"
    assert len(series["points"]) == 12
    assert {"timestamp", "bytesIngested", "storageUsedBytes"}.issubset(series["points"][0])


def test_warehouse_actions_record_evidence(tmp_path, monkeypatch):
    warehouse = tmp_path / "warehouse"
    warehouse.mkdir()
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.setenv("HERMES_WAREHOUSE_ROOT", str(warehouse))

    from hermes_cli.system_warehouse import record_prune_dry_run, record_restore_proof, record_sync

    sync = record_sync()
    restore = record_restore_proof()
    prune = record_prune_dry_run()

    assert sync["ok"] is True
    assert restore["ok"] is True
    assert prune["ok"] is True
    assert restore["manifestHash"]
    assert restore["evidence"]["payload"]["counts"]["missing"] == 0
    assert Path(tmp_path / "home" / "operating_runtime.db").exists()


def test_warehouse_backbone_audit_classifies_group_one_gaps(tmp_path, monkeypatch):
    warehouse = tmp_path / "warehouse"
    mirror = tmp_path / "mirror"
    object_store = tmp_path / "objects"
    log_root = tmp_path / "logs"
    warehouse.mkdir()
    mirror.mkdir()
    object_store.mkdir()
    log_root.mkdir()
    (object_store / "receipt.json").write_text("{}", encoding="utf-8")
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.setenv("HERMES_WAREHOUSE_ROOT", str(warehouse))
    monkeypatch.setenv("HERMES_WAREHOUSE_MIRROR_ROOT", str(mirror))
    monkeypatch.setenv("HERMES_OBJECT_STORE_ROOT", str(object_store))
    monkeypatch.setenv("HERMES_WORKER_LOG_ROOT", str(log_root))
    monkeypatch.setenv("DASHBOARD_RESET_DISCORD_USER_IDS", "123")

    from hermes_cli.operating_runtime import connect, record_deployment, upsert_evidence
    from hermes_cli.system_operations import record_credentials_scan, record_worker_dry_run
    from hermes_cli.system_warehouse import record_prune_dry_run, record_sync, warehouse_backbone_audit

    with connect() as conn:
        record_deployment(
            conn,
            project="Nous Hermes",
            version="abc123",
            environment="production",
            status="ready",
            rollback="rollback artifact attached",
            evidence=["deploy-receipt", "rollback-proof"],
        )
        upsert_evidence(
            conn,
            id="credential-safe-test",
            kind="catalog",
            subject="Credential safe test",
            state="ready",
            owner="Operations",
            detail="Credential safe-test passed without exposing secret values.",
            payload={"safeTestStatus": "passed", "rotationStatus": "current"},
        )
        upsert_evidence(
            conn,
            id="worker-log-ref",
            kind="telemetry",
            subject="Worker run logRef",
            state="ready",
            owner="Operations",
            detail="Worker log artifact captured.",
            payload={"logRef": "logs://worker/1"},
        )
    record_sync()
    record_prune_dry_run()
    record_worker_dry_run()
    record_credentials_scan()

    audit = warehouse_backbone_audit()
    statuses = {item["id"]: item["status"] for item in audit["items"]}
    assert audit["summary"]["categories"] == 8
    assert statuses["ops-storage-objects"] == "ready"
    assert statuses["ops-worker-logs"] == "ready"
    assert statuses["ops-deployments"] == "ready"
    assert statuses["ops-rollback-proofs"] == "ready"
    assert statuses["ops-safe-test-results"] == "ready"
    assert statuses["ops-scheduler-runs"] == "ready"
