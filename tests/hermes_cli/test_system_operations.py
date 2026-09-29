def test_storage_summary_and_scan(tmp_path, monkeypatch):
    home = tmp_path / "home"
    (home / "logs").mkdir(parents=True)
    (home / "logs" / "app.log").write_text("hello\n", encoding="utf-8")
    monkeypatch.setenv("HERMES_HOME", str(home))

    from hermes_cli.system_operations import record_storage_scan, storage_series, storage_summary

    summary = storage_summary()
    assert summary["contractVersion"] == "system-storage.v1"
    assert summary["summary"]["cleanupCandidates"] >= 1
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

    from hermes_cli.system_operations import record_worker_dry_run, workers_series, workers_summary

    summary = workers_summary()
    assert summary["contractVersion"] == "system-workers.v1"
    assert summary["summary"]["workers"] >= 1
    assert len(workers_series("1h")["points"]) == 6
    assert record_worker_dry_run()["ok"] is True
