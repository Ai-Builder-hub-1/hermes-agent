from __future__ import annotations

import json

from fastapi.testclient import TestClient


def test_operate_queue_merges_fleet_and_runtime_evidence(monkeypatch, tmp_path):
    from hermes_cli import fleet_monitoring, operating_runtime, web_server

    registry = tmp_path / "dashboard-monitoring-registry.json"
    registry.write_text(
        json.dumps(
            {
                "generatedAt": "2026-09-29T15:21:00.455Z",
                "entries": [
                    {
                        "projectId": "tlc-capital-group-os",
                        "label": "TLC Capital Group OS",
                        "status": "declared",
                        "healthUrl": "https://tlc.tlccapitalgroup.com/health",
                        "snapshotUrl": "https://tlc.tlccapitalgroup.com/dashboard-snapshot",
                        "alertOwner": "tlc-enterprise",
                        "latestCheck": {
                            "status": "failed",
                            "capturedAt": "2026-09-29T15:22:00.000Z",
                            "checks": {
                                "health": {"ok": False, "status": None, "ms": 20, "error": "fetch failed"},
                                "snapshot": {"ok": False, "status": None, "ms": 1, "error": "fetch failed"},
                            },
                            "pressure": {"status": "passed", "violations": []},
                        },
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(fleet_monitoring, "REGISTRY_PATH", registry)
    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.setenv("HERMES_WAREHOUSE_ROOT", str(tmp_path / "warehouse"))

    conn = operating_runtime.connect()
    try:
        operating_runtime.upsert_evidence(
            conn,
            id="incident-live-worker",
            kind="incident",
            subject="Worker restart loop",
            state="blocked",
            owner="Operations",
            detail="Worker uptime is lower than container age and needs recovery proof.",
        )
    finally:
        conn.close()

    client = TestClient(web_server.app)
    response = client.get(
        "/api/operate/queue?limit=50&include_system=true",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    ids = [item["id"] for item in body["items"]]
    assert "fleet-tlc-capital-group-os" in ids
    assert "runtime-incident-live-worker" in ids
    assert "system-storage" in ids
    assert "system-credentials" in ids
    assert body["summary"]["attention"] >= 2
    runtime_item = next(item for item in body["items"] if item["id"] == "runtime-incident-live-worker")
    assert runtime_item["severity"] == "critical"
    assert runtime_item["route"] == "/operate/incidents"
