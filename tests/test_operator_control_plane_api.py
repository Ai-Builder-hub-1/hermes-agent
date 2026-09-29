from __future__ import annotations

import json

from fastapi.testclient import TestClient


def test_operate_queue_merges_fleet_and_runtime_evidence(monkeypatch, tmp_path):
    from hermes_cli import fleet_monitoring, operating_runtime, trading_intelligence, web_server

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

    async def fake_trading_command_center(limit=5):
        return {
            "generatedAt": "2026-09-29T15:24:00.000Z",
            "status": "watch",
            "liveTradingLocked": True,
            "summary": {
                "totalCapitalKnown": False,
                "cashLeftKnown": False,
                "openTrades": 2,
                "humanActionsRequired": 1,
            },
            "actionQueue": [
                {
                    "id": "review-oanda-runtime",
                    "title": "Review OANDA runtime",
                    "risk": "medium",
                    "recommendedAction": "Review runtime evidence before changing state.",
                    "sourceProject": "investing-system",
                }
            ],
            "sourceProjects": [
                {
                    "label": "Investing System",
                    "summary": {
                        "accountObservability": {
                            "brokers": [
                                {
                                    "brokerId": "robinhood-mcp",
                                    "label": "Robinhood",
                                    "status": "not_configured",
                                    "credentialConfigured": False,
                                    "accountVisible": False,
                                    "positionsVisible": False,
                                    "ordersVisible": False,
                                    "fillsVisible": False,
                                    "pnlVisible": False,
                                    "freshnessStatus": "missing",
                                    "liveSubmit": False,
                                    "nextAction": "Configure Robinhood read-only credentials.",
                                },
                                {
                                    "brokerId": "oanda",
                                    "label": "OANDA",
                                    "status": "ready_read_only",
                                    "credentialConfigured": True,
                                    "accountVisible": True,
                                    "positionsVisible": True,
                                    "ordersVisible": True,
                                    "fillsVisible": True,
                                    "pnlVisible": True,
                                    "freshnessStatus": "fresh",
                                    "liveSubmit": False,
                                    "nextAction": "Keep OANDA read-only snapshot refresh on cadence.",
                                },
                            ]
                        }
                    },
                }
            ],
        }

    monkeypatch.setattr(trading_intelligence, "trading_command_center", fake_trading_command_center)

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
        "/api/operate/queue?limit=50&include_system=true&include_trading=true",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    ids = [item["id"] for item in body["items"]]
    assert "fleet-tlc-capital-group-os" in ids
    assert "runtime-incident-live-worker" in ids
    assert "system-storage" in ids
    assert "system-credentials" in ids
    assert "trading-account-visibility" in ids
    assert "broker-account-robinhood-mcp" in ids
    assert "broker-account-oanda" in ids
    assert body["summary"]["attention"] >= 2
    runtime_item = next(item for item in body["items"] if item["id"] == "runtime-incident-live-worker")
    assert runtime_item["severity"] == "critical"
    assert runtime_item["route"] == "/operate/incidents"
    trading_item = next(item for item in body["items"] if item["id"] == "trading-account-visibility")
    assert trading_item["severity"] == "warning"
    assert "capitalKnown=False" in trading_item["evidence"]
    robinhood_item = next(item for item in body["items"] if item["id"] == "broker-account-robinhood-mcp")
    assert robinhood_item["severity"] == "critical"
    assert "liveSubmit=False" in robinhood_item["evidence"]


def test_operate_action_intent_records_audit_and_evidence(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")

    client = TestClient(web_server.app)
    response = client.post(
        "/api/operate/action-intent",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={
            "item_id": "fleet-khashi-vc",
            "title": "Khashi VC production snapshot",
            "action": "dashboard:monitoring:check:strict",
            "actor_role": "operator",
            "explicit_approval": False,
            "payload": {"route": "/trading/khashi"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["decision"]["allowed"] is True
    assert body["audit"]["action"] == "dashboard:monitoring:check:strict"
    assert body["evidence"]["kind"] == "workbench"
    assert body["evidence"]["subject"] == "Operator action intent: Khashi VC production snapshot"
    assert body["evidence"]["payload"]["item_id"] == "fleet-khashi-vc"
