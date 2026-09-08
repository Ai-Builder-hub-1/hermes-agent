from __future__ import annotations

from fastapi.testclient import TestClient


def test_trading_intelligence_summary_route(monkeypatch):
    from hermes_cli import trading_intelligence as ti
    from hermes_cli import web_server

    async def fake_request_source(source, route, **_kwargs):
        payload = {
            "status": "ready",
            "liveTradingLocked": True,
            "kpis": {
                "openTrades": 1 if source["projectId"] == "investing-system" else 2,
                "realizedPnlUsd": 12.5,
                "liveMarkets": 4,
                "paperCandidates": 3,
            },
            "tabs": [{"id": "overview"}],
            "blockers": [],
            "recommendations": ["Keep collecting evidence."],
        }
        return {
            "ok": True,
            "status": 200,
            "latencyMs": 7,
            "payload": payload,
            "error": None,
            "baseUrl": source["baseUrls"][0],
        }

    monkeypatch.setattr(ti, "_request_source", fake_request_source)
    client = TestClient(web_server.app)
    response = client.get(
        "/api/trading-intelligence/summary",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["contractVersion"] == "trading-intelligence-control-plane.v1"
    assert body["status"] == "ready"
    assert body["kpis"]["projectsAvailable"] == 2
    assert body["kpis"]["openTrades"] == 3
    assert body["liveTradingLocked"] is True


def test_trading_intelligence_events_controls_and_proxy(monkeypatch):
    from hermes_cli import trading_intelligence as ti
    from hermes_cli import web_server

    calls = []

    async def fake_request_source(source, route, **kwargs):
        calls.append((source["projectId"], route, kwargs))
        if route.startswith(source["routes"]["events"]):
            return {
                "ok": True,
                "status": 200,
                "latencyMs": 4,
                "payload": {"events": [{"id": f"{source['projectId']}-1", "type": "trade", "occurredAt": "2026-09-08T20:00:00Z"}]},
                "error": None,
                "baseUrl": source["baseUrls"][0],
            }
        if route == source["routes"]["controls"]:
            return {
                "ok": True,
                "status": 200,
                "latencyMs": 4,
                "payload": {"controls": [{"id": "pause", "label": "Pause"}], "safety": {"liveTradingLocked": True}},
                "error": None,
                "baseUrl": source["baseUrls"][0],
            }
        return {
            "ok": True,
            "status": 200,
            "latencyMs": 4,
            "payload": {"status": "accepted"},
            "error": None,
            "baseUrl": source["baseUrls"][0],
        }

    monkeypatch.setattr(ti, "_request_source", fake_request_source)
    client = TestClient(web_server.app)
    headers = {"X-Hermes-Session-Token": web_server._SESSION_TOKEN}

    events = client.get("/api/trading-intelligence/events?limit=5", headers=headers)
    controls = client.get("/api/trading-intelligence/controls", headers=headers)
    control = client.post(
        "/api/trading-intelligence/control",
        headers=headers,
        json={"action": "investing-system:pause", "execute": False},
    )

    assert events.status_code == 200
    assert len(events.json()["events"]) == 2
    assert controls.status_code == 200
    assert controls.json()["controls"][0]["namespacedId"] == "investing-system:pause"
    assert control.status_code == 200
    assert control.json()["status"] == "proxied"
    assert calls[-1][0] == "investing-system"
    assert calls[-1][2]["body"]["actorId"] == "nous-hermes-control-plane"


def test_trading_intelligence_frontend_spec_route():
    from hermes_cli import web_server

    client = TestClient(web_server.app)
    response = client.get(
        "/api/trading-intelligence/frontend-spec",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    assert response.json()["basePath"] == "/api/trading-intelligence"
