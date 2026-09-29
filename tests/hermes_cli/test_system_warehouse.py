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
    assert summary["mirror"]["configured"] is True
    assert "ingest" in summary
    assert "slo" in summary


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
    assert Path(tmp_path / "home" / "operating_runtime.db").exists()
