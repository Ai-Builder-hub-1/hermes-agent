def test_storage_summary_and_scan(tmp_path, monkeypatch):
    home = tmp_path / "home"
    (home / "logs").mkdir(parents=True)
    (home / "logs" / "app.log").write_text("hello\n", encoding="utf-8")
    monkeypatch.setenv("HERMES_HOME", str(home))

    from hermes_cli.system_operations import record_storage_scan, storage_series, storage_summary

    summary = storage_summary()
    assert summary["contractVersion"] == "system-storage.v1"
    assert summary["summary"]["cleanupCandidates"] >= 1
    assert "providers" in summary
    assert all("scope" in volume for volume in summary["volumes"])
    assert len(storage_series("24h")["points"]) == 12
    assert record_storage_scan()["ok"] is True


def test_freshness_summary_and_check(tmp_path, monkeypatch):
    home = tmp_path / "home"
    warehouse = tmp_path / "warehouse"
    warehouse.mkdir()
    monkeypatch.setenv("HERMES_HOME", str(home))
    monkeypatch.setenv("HERMES_WAREHOUSE_ROOT", str(warehouse))

    from hermes_cli.system_operations import freshness_series, freshness_summary, record_freshness_check

    summary = freshness_summary()
    assert summary["contractVersion"] == "system-freshness.v1"
    assert summary["summary"]["sources"] >= 1
    assert len(freshness_series("7d")["points"]) == 7
    assert record_freshness_check()["ok"] is True


def test_workers_summary_and_dry_run(tmp_path, monkeypatch):
    home = tmp_path / "home"
    monkeypatch.setenv("HERMES_HOME", str(home))

    from cron.executions import create_execution, finish_execution

    execution = create_execution("nightly-warehouse-sync", source="builtin")
    finish_execution(execution["id"], success=True)

    from hermes_cli.system_operations import record_worker_dry_run, workers_series, workers_summary

    summary = workers_summary()
    assert summary["contractVersion"] == "system-workers.v1"
    assert summary["summary"]["workers"] >= 1
    assert "scheduleSource" in summary["workers"][0]
    assert "logRef" in summary["workers"][0]
    assert any(worker["id"].startswith("cron-") for worker in summary["workers"])
    assert len(workers_series("1h")["points"]) == 6
    assert record_worker_dry_run()["ok"] is True


def test_deployments_summary_and_check(tmp_path, monkeypatch):
    home = tmp_path / "home"
    monkeypatch.setenv("HERMES_HOME", str(home))
    monkeypatch.setenv("GIT_SHA", "abc123")

    from hermes_cli.system_operations import deployments_series, deployments_summary, record_deployment_check

    summary = deployments_summary()
    assert summary["contractVersion"] == "system-deployments.v1"
    assert summary["summary"]["deployments"] >= 1
    assert {"id", "project", "environment", "version", "state"}.issubset(summary["deployments"][0])
    assert {"deployedSha", "promotionSource", "healthStatus", "rollbackSha"}.issubset(summary["deployments"][0])
    assert len(deployments_series("30d")["points"]) == 15
    assert record_deployment_check()["ok"] is True


def test_recovery_summary_and_check(tmp_path, monkeypatch):
    home = tmp_path / "home"
    monkeypatch.setenv("HERMES_HOME", str(home))

    from hermes_cli.operating_runtime import connect, record_deployment, record_incident
    from hermes_cli.system_operations import record_recovery_check, recovery_summary

    with connect() as conn:
        record_incident(
            conn,
            title="Worker restart loop",
            severity="critical",
            owner="Operations",
            next_step="Restart loop needs recovery proof.",
            source="test",
        )
        record_deployment(
            conn,
            project="Nous Hermes",
            version="abc123",
            environment="production",
            status="failed",
            rollback="Restore previous image.",
            evidence=["health-check-failed"],
        )

    summary = recovery_summary()
    assert summary["contractVersion"] == "system-recovery.v1"
    assert summary["health"] == "critical"
    assert summary["summary"]["openIncidents"] >= 1
    assert summary["summary"]["failedDeployments"] >= 1
    assert summary["summary"]["rollbackGaps"] >= 1
    assert summary["blockers"]
    assert record_recovery_check()["ok"] is True


def test_credentials_summary_and_scan(tmp_path, monkeypatch):
    home = tmp_path / "home"
    monkeypatch.setenv("HERMES_HOME", str(home))
    monkeypatch.setenv("DASHBOARD_RESET_DISCORD_USER_IDS", "123")

    from hermes_cli.system_operations import credentials_series, credentials_summary, record_credentials_scan

    summary = credentials_summary()
    assert summary["contractVersion"] == "system-credentials.v1"
    assert summary["secretExposurePolicy"] == "values_never_returned"
    assert "runtimeVariables" in summary
    if summary["runtimeVariables"]:
        assert {"secretClass", "rotationStatus", "safeTestStatus"}.issubset(summary["runtimeVariables"][0])
    assert len(credentials_series("24h")["points"]) == 12
    assert record_credentials_scan()["ok"] is True
