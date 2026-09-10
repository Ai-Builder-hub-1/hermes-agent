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


def test_trading_command_center_route_normalizes_cross_system_backend(monkeypatch):
    from hermes_cli import trading_intelligence as ti
    from hermes_cli import web_server

    async def fake_request_source(source, route, **_kwargs):
        if route.startswith(source["routes"]["events"]):
            return {
                "ok": True,
                "status": 200,
                "latencyMs": 4,
                "payload": {"events": [{"id": f"{source['projectId']}-event", "type": "trade_closed", "occurredAt": "2026-09-10T17:00:00Z", "severity": "info"}]},
                "error": None,
                "baseUrl": source["baseUrls"][0],
            }
        if route == source["routes"]["controls"]:
            return {
                "ok": True,
                "status": 200,
                "latencyMs": 4,
                "payload": {
                    "controls": [{"id": "pause_runtime", "label": "Pause runtime", "permissionLevel": "approval_required", "riskLevel": "high"}],
                    "safety": {"liveTradingLocked": True},
                },
                "error": None,
                "baseUrl": source["baseUrls"][0],
            }
        payload = {
            "status": "watch" if source["projectId"] == "khashi-vc" else "ready",
            "generatedAt": "2026-09-10T17:00:00Z",
            "liveTradingLocked": True,
            "kpis": {
                "portfolioValueUsd": 10000 if source["projectId"] == "investing-system" else None,
                "accountEquityUsd": 2500 if source["projectId"] == "investing-system" else None,
                "cashLeftUsd": 4000 if source["projectId"] == "investing-system" else 800,
                "buyingPowerUsd": 4500 if source["projectId"] == "investing-system" else 800,
                "capitalSource": "broker-account" if source["projectId"] == "investing-system" else "internal-khashi-paper-bankroll",
                "capitalSemantics": "Broker account cash." if source["projectId"] == "investing-system" else "Internal Khashi simulated bankroll; not real Kalshi cash.",
                "isRealBrokerCash": source["projectId"] == "investing-system",
                "isKalshiDemoCash": False,
                "kalshiProductionCashUsd": None,
                "kalshiDemoCashUsd": None,
                "paperBankrollUsd": None if source["projectId"] == "investing-system" else 1000,
                "openTrades": 1 if source["projectId"] == "investing-system" else 0,
                "closedTrades": 8 if source["projectId"] == "investing-system" else 45,
                "realizedPnlTodayUsd": 10 if source["projectId"] == "investing-system" else -1.08,
                "realizedPnlUsd": 12.5 if source["projectId"] == "investing-system" else -1.08,
                "unrealizedPnlUsd": 3.25 if source["projectId"] == "investing-system" else 0,
                "openRiskUsd": 50 if source["projectId"] == "investing-system" else 0,
                "liveMarkets": 0 if source["projectId"] == "investing-system" else 22,
                "paperCandidates": 2 if source["projectId"] == "investing-system" else 0,
            },
            "positions": [{"id": "pos-1", "instrument": "EUR_USD", "status": "open", "quantity": 1000}],
            "strategies": [{"strategyId": "ma-cross@v1", "status": "paper-watch", "scoredTrades": 8, "winRate": 0.5}],
            "freshness": {"latestMarketDataAt": "2026-09-10T17:00:00Z", "latestProofAt": "2026-09-10T17:00:00Z"},
            "blockers": ["Average spread-adjusted P/L is negative."] if source["projectId"] == "khashi-vc" else [],
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
        "/api/trading-intelligence/command-center?limit=5",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["contractVersion"] == "trading-command-center.v1"
    assert body["status"] == "watch"
    assert body["liveTradingLocked"] is True
    assert [lane["id"] for lane in body["lanes"]] == [
        "leon_long_term",
        "leon_short_term_opportunity",
        "oanda_fx_trading",
        "khashi_perpetual_trading",
    ]
    assert body["summary"]["totalCapitalKnown"] is True
    assert body["summary"]["cashLeftUsd"] == 4800
    assert body["summary"]["cashLeftKnown"] is True
    assert body["capital"]["portfolioValueUsd"] == 10000
    assert body["capital"]["cashLeftUsd"] == 4800
    assert body["pnl"]["realizedPnlUsd"] == 11.42
    assert body["dailyMetrics"]["cashLeftUsd"] == 4800
    assert body["dailyMetrics"]["buyingPowerUsd"] == 5300
    assert body["dailyMetrics"]["riskAdjustedCashLeftUsd"] == 4750
    assert body["dailyMetrics"]["realizedPnlTodayUsd"] == 8.92
    assert body["dailyMetrics"]["eventsToday"] == 2
    assert body["dailyMetrics"]["coverage"]["cashLeft"] == "known"
    assert body["dailyMetrics"]["capitalSemantics"]["realBrokerCashSources"] == 1
    assert body["dailyMetrics"]["capitalSemantics"]["internalPaperBankrollSources"] == 1
    assert body["dailyMetrics"]["bySource"][1]["capitalSource"] == "internal-khashi-paper-bankroll"
    assert body["dailyMetrics"]["bySource"][1]["isRealBrokerCash"] is False
    assert body["dailyMetrics"]["bySource"][1]["paperBankrollUsd"] == 1000
    assert len(body["dailyMetrics"]["bySource"]) == 2
    assert body["positions"]["count"] == 2
    assert body["strategies"]["count"] == 2
    assert body["recentEvents"][0]["sourceProject"] in {"investing-system", "khashi-vc"}
    assert body["actionQueue"][0]["type"] == "blocker_review"
    assert body["freshness"][0]["latestMarketDataAt"] == "2026-09-10T17:00:00Z"
    assert body["sourceRoutes"]["headTrader"] == "/api/head-trader/summary"

    alias = client.get(
        "/api/trading-command-center?limit=5",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )
    assert alias.status_code == 200
    assert alias.json()["id"] == "trading-command-center"


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
