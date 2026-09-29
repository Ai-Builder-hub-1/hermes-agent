from __future__ import annotations

import json

from fastapi.testclient import TestClient


def test_fleet_operator_snapshots_route_normalizes_registry(monkeypatch, tmp_path):
    from hermes_cli import fleet_monitoring, web_server

    registry = tmp_path / "dashboard-monitoring-registry.json"
    registry.write_text(
        json.dumps(
            {
                "generatedAt": "2026-09-29T15:21:00.455Z",
                "entries": [
                    {
                        "projectId": "investing-system",
                        "label": "Investing System",
                        "status": "current",
                        "healthUrl": "https://investing.tlccapitalgroup.com/health",
                        "snapshotUrl": "https://investing.tlccapitalgroup.com/api/dashboard-snapshot",
                        "alertOwner": "investing-system",
                        "latestCheck": {
                            "status": "passed",
                            "capturedAt": "2026-09-29T15:22:00.000Z",
                            "checks": {
                                "health": {"ok": True, "status": 200, "ms": 230, "bytes": 90},
                                "snapshot": {"ok": True, "status": 200, "ms": 571, "bytes": 1488},
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

    client = TestClient(web_server.app)
    response = client.get(
        "/api/fleet/operator-snapshots",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["schemaVersion"] == 1
    assert body["generatedAt"] == "2026-09-29T15:21:00.455Z"
    assert body["snapshots"] == [
        {
            "projectId": "investing-system",
            "label": "Investing System",
            "owner": "investing-system",
            "status": "current",
            "healthUrl": "https://investing.tlccapitalgroup.com/health",
            "snapshotUrl": "https://investing.tlccapitalgroup.com/api/dashboard-snapshot",
            "latestCheck": {
                "status": "passed",
                "capturedAt": "2026-09-29T15:22:00.000Z",
                "checks": {
                    "health": {"ok": True, "status": 200, "ms": 230, "bytes": 90},
                    "snapshot": {"ok": True, "status": 200, "ms": 571, "bytes": 1488},
                },
                "pressure": {"status": "passed", "violations": []},
            },
        }
    ]
