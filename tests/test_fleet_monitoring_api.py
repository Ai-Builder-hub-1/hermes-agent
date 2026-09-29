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


def test_fleet_operator_queue_route_returns_ranked_attention(monkeypatch, tmp_path):
    from hermes_cli import fleet_monitoring, web_server

    registry = tmp_path / "dashboard-monitoring-registry.json"
    registry.write_text(
        json.dumps(
            {
                "generatedAt": "2026-09-29T15:21:00.455Z",
                "entries": [
                    {
                        "projectId": "khashi-vc",
                        "label": "Khashi VC",
                        "status": "current",
                        "healthUrl": "https://roc.tlccapitalgroup.com/readyz",
                        "snapshotUrl": "https://roc.tlccapitalgroup.com/api/dashboard-snapshot",
                        "alertOwner": "khashi-vc",
                        "latestCheck": {
                            "status": "passed",
                            "capturedAt": "2026-09-29T15:22:00.000Z",
                            "checks": {
                                "health": {"ok": True, "status": 200, "ms": 292, "bytes": 125},
                                "snapshot": {"ok": True, "status": 200, "ms": 1011, "bytes": 1340},
                            },
                            "pressure": {"status": "passed", "violations": []},
                        },
                    },
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
                    },
                ],
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(fleet_monitoring, "REGISTRY_PATH", registry)

    client = TestClient(web_server.app)
    response = client.get(
        "/api/fleet/operator-queue?limit=5",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["summary"] == {"attention": 1, "blocked": 1, "ready": 1, "executable": 2}
    assert [item["id"] for item in body["items"]] == ["fleet-tlc-capital-group-os", "fleet-khashi-vc"]
    assert body["items"][0]["severity"] == "critical"
    assert body["items"][0]["state"] == "blocked"
    assert body["items"][0]["safeAction"] == "dashboard:monitoring:check:strict"
    assert body["items"][1]["route"] == "/trading/khashi"
