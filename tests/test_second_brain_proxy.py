from fastapi.testclient import TestClient


def test_second_brain_agent_preflight_returns_injection_packet(monkeypatch):
    from hermes_cli import web_server

    calls = []

    async def fake_request(path, method="GET", payload=None):
        calls.append({"path": path, "method": method, "payload": payload})
        return {
            "check": {
                "id": "preflight_1",
                "request": payload,
                "policy": "warn",
                "relevantMemories": [{"id": "memory_1"}],
                "relevantDecisions": [{"id": "decision_1"}],
                "contradictions": [],
                "staleMemories": [],
                "warnings": ["Warehouse proof should be fresh."],
                "requiredAcknowledgements": [],
                "blockReasons": [],
                "citations": ["memory_1"],
                "createdAt": "2026-10-02T00:00:00.000Z",
                "metadata": {},
            }
        }

    monkeypatch.setattr(web_server, "_hermes_brain_service_token", lambda: "test-token")
    monkeypatch.setattr(web_server, "_hermes_brain_request", fake_request)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/second-brain/agent-preflight",
        json={
            "task": "Scale earnings event backfill",
            "project": "investing-system",
            "workflow": "earnings-event-backfill",
            "riskClass": "high",
            "entities": ["earnings", "warehouse"],
        },
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["enforcement"] == {
        "mode": "automatic-agent-preflight",
        "mustStop": False,
        "mustAcknowledge": False,
        "proceedSilentlyAllowed": False,
    }
    assert body["injection"]["policy"] == "warn"
    assert body["injection"]["context"]["memoryIds"] == ["memory_1"]
    assert calls[0]["path"] == "/api/brain/preflight"
    assert calls[0]["method"] == "POST"
    assert calls[0]["payload"]["project"] == "investing-system"
    assert calls[0]["payload"]["metadata"]["enforcement"] == "must-not-proceed-silently"


def test_second_brain_agent_preflight_blocks_silent_high_impact_work(monkeypatch):
    from hermes_cli import web_server

    async def fake_request(path, method="GET", payload=None):
        return {
            "check": {
                "id": "preflight_blocked",
                "request": payload,
                "policy": "block",
                "relevantMemories": [],
                "relevantDecisions": [],
                "contradictions": [{"id": "contradiction_1"}],
                "staleMemories": [{"id": "memory_stale"}],
                "warnings": ["Critical memory is stale."],
                "requiredAcknowledgements": ["Resolve contradiction_1 before execution."],
                "blockReasons": ["Open high-impact contradiction."],
                "citations": ["contradiction_1"],
                "createdAt": "2026-10-02T00:00:00.000Z",
                "metadata": {},
            }
        }

    monkeypatch.setattr(web_server, "_hermes_brain_service_token", lambda: "test-token")
    monkeypatch.setattr(web_server, "_hermes_brain_request", fake_request)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/second-brain/agent-preflight",
        json={
            "task": "Deploy production autonomy change",
            "workflow": "production-deploy",
            "riskClass": "critical",
            "entities": ["deploy", "autonomy"],
        },
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["error"] == "second_brain_preflight_blocked"
    assert detail["injection"]["mustStop"] is True
    assert detail["injection"]["context"]["contradictionIds"] == ["contradiction_1"]
    assert detail["preflight"]["policy"] == "block"


def test_second_brain_contradiction_resolve_proxies_to_hermes_brain(monkeypatch):
    from hermes_cli import web_server

    calls = []

    async def fake_request(path, method="GET", payload=None):
        calls.append({"path": path, "method": method, "payload": payload})
        return {
            "contradiction": {
                "id": "contradiction with space",
                "status": "resolved",
            }
        }

    monkeypatch.setattr(web_server, "_hermes_brain_request", fake_request)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/second-brain/contradictions/contradiction%20with%20space/resolve",
        json={
            "status": "resolved",
            "actor": "nous-hermes-dashboard",
            "reason": "Operator reviewed source evidence.",
        },
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    assert response.json()["contradiction"]["status"] == "resolved"
    assert calls == [
        {
            "path": "/api/brain/contradictions/contradiction%20with%20space/resolve",
            "method": "POST",
            "payload": {
                "status": "resolved",
                "actor": "nous-hermes-dashboard",
                "reason": "Operator reviewed source evidence.",
            },
        }
    ]
