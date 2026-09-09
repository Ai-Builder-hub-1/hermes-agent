from __future__ import annotations

from fastapi.testclient import TestClient


def _client(monkeypatch, tmp_path):
    monkeypatch.setenv("HEAD_TRADER_DATA_DIR", str(tmp_path / "head-trader"))
    from hermes_cli import web_server

    return TestClient(web_server.app), {"X-Hermes-Session-Token": web_server._SESSION_TOKEN}


def _fake_summary():
    return {
        "contractVersion": "trading-intelligence-control-plane.v1",
        "status": "blocked",
        "liveTradingLocked": True,
        "kpis": {"projectsAvailable": 2, "projectsTotal": 2},
        "projects": [
            {
                "projectId": "investing-system",
                "label": "Investing System",
                "available": True,
                "httpStatus": 200,
                "status": "watch",
                "liveTradingLocked": True,
                "kpis": {"openTrades": 1},
                "tabs": [],
                "blockers": ["OANDA strategy freshness is degraded."],
                "recommendations": ["Review OANDA runtime."],
            },
            {
                "projectId": "khashi-vc",
                "label": "Khashi VC",
                "available": True,
                "httpStatus": 200,
                "status": "blocked",
                "liveTradingLocked": True,
                "kpis": {"liveMarkets": 12},
                "tabs": [],
                "blockers": ["Market freshness is stale."],
                "recommendations": ["Run freshness proof."],
            },
        ],
        "blockers": ["Investing System: OANDA strategy freshness is degraded.", "Khashi VC: Market freshness is stale."],
    }


def test_head_trader_end_to_end_incident_reply_decision_confirm(monkeypatch, tmp_path):
    from hermes_cli import head_trader as ht

    async def fake_summary():
        return _fake_summary()

    async def fake_events(limit=20):
        return {"events": []}

    async def fake_control(payload):
        return {"status": "proxied", "projectId": "khashi-vc", "action": payload["action"], "result": {"status": "accepted"}}

    monkeypatch.setattr(ht, "trading_intelligence_summary", fake_summary)
    monkeypatch.setattr(ht, "trading_intelligence_events", fake_events)
    monkeypatch.setattr(ht, "trading_intelligence_control", fake_control)
    client, headers = _client(monkeypatch, tmp_path)

    refresh = client.post("/api/head-trader/refresh", headers=headers)
    assert refresh.status_code == 200
    assert refresh.json()["createdOrUpdated"] == 2

    incidents = client.get("/api/head-trader/incidents", headers=headers).json()["incidents"]
    khashi = next(item for item in incidents if item["desk"] == "khashi")

    reply = client.post(
        f"/api/head-trader/incidents/{khashi['id']}/reply",
        headers=headers,
        json={"message": "run freshness proof", "channel": "dashboard", "actorId": "hq"},
    )
    assert reply.status_code == 200
    body = reply.json()
    assert body["intent"]["actionId"] == "khashi.run_freshness_proof"
    assert body["decision"]["status"] == "waiting_for_confirmation"

    confirm = client.post(
        f"/api/head-trader/decisions/{body['decision']['id']}/confirm",
        headers=headers,
        json={"actorId": "hq", "reason": "approved from test"},
    )
    assert confirm.status_code == 200
    assert confirm.json()["status"] == "executed"
    assert confirm.json()["decision"]["result"]["status"] == "proxied"

    audit = client.get("/api/head-trader/audit", headers=headers).json()["events"]
    assert any(item["type"] == "decision.confirmed" for item in audit)


def test_head_trader_hard_gate_blocks_resume(monkeypatch, tmp_path):
    from hermes_cli import head_trader as ht

    async def fake_summary():
        return _fake_summary()

    monkeypatch.setattr(ht, "trading_intelligence_summary", fake_summary)
    client, headers = _client(monkeypatch, tmp_path)

    risk = client.post(
        "/api/head-trader/risk-check",
        headers=headers,
        json={"actionId": "investing.resume_oanda_runtime", "execute": True},
    )

    assert risk.status_code == 200
    assert risk.json()["allowed"] is False
    assert risk.json()["permissionLevel"] == "hard_gate"


def test_head_trader_contract_routes(monkeypatch, tmp_path):
    client, headers = _client(monkeypatch, tmp_path)

    assert client.get("/api/head-trader/action-catalog", headers=headers).status_code == 200
    assert client.get("/api/head-trader/channels", headers=headers).json()["channels"][0]["mode"] == "disabled_by_default"
    assert client.get("/api/head-trader/frontend-spec", headers=headers).json()["basePath"] == "/api/head-trader"
