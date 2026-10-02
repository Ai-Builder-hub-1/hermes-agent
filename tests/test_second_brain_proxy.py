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


def test_second_brain_high_impact_workflows_exposes_registry():
    from hermes_cli import web_server

    client = TestClient(web_server.app)
    response = client.get(
        "/api/second-brain/high-impact-workflows",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["valid"] is True
    assert body["summary"]["preflightRequired"] >= 1
    workflow_ids = {workflow["id"] for workflow in body["workflows"]}
    assert "chat-high-impact-task" in workflow_ids
    assert "destructive-pruning" in workflow_ids
    assert "oanda-live-trading" in workflow_ids


def test_second_brain_registered_workflow_preflight_uses_registry_metadata(monkeypatch):
    from hermes_cli import web_server

    calls = []
    evidence_calls = []

    async def fake_request(path, method="GET", payload=None):
        calls.append({"path": path, "method": method, "payload": payload})
        return {
            "check": {
                "id": "preflight_chat",
                "request": payload,
                "policy": "pass",
                "relevantMemories": [],
                "relevantDecisions": [],
                "contradictions": [],
                "staleMemories": [],
                "warnings": [],
                "requiredAcknowledgements": [],
                "blockReasons": [],
                "citations": [],
                "createdAt": "2026-10-02T00:00:00.000Z",
                "metadata": {},
            }
        }

    monkeypatch.setattr(web_server, "_hermes_brain_service_token", lambda: "test-token")
    monkeypatch.setattr(web_server, "_hermes_brain_request", fake_request)
    monkeypatch.setattr(
        web_server,
        "_record_high_impact_preflight_evidence",
        lambda **kwargs: evidence_calls.append(kwargs) or {"id": "preflight-enforcement-chat-high-impact-task", **kwargs},
    )

    client = TestClient(web_server.app)
    response = client.post(
        "/api/second-brain/high-impact-workflows/chat-high-impact-task/preflight",
        json={
            "task": "Prepare production warehouse maintenance",
            "actor": "test-operator",
            "entities": ["warehouse", "production"],
        },
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["workflow"]["id"] == "chat-high-impact-task"
    assert body["enforcement"]["mode"] == "registered-workflow-preflight"
    assert body["evidence"]["id"] == "preflight-enforcement-chat-high-impact-task"
    assert calls[0]["path"] == "/api/brain/preflight"
    assert calls[0]["payload"]["workflow"] == "high-impact-agent-task"
    assert calls[0]["payload"]["metadata"]["workflowId"] == "chat-high-impact-task"
    assert calls[0]["payload"]["metadata"]["actor"] == "test-operator"
    assert evidence_calls[0]["state"] == "ready"
    assert evidence_calls[0]["workflow"]["id"] == "chat-high-impact-task"


def test_second_brain_registered_workflow_preflight_stops_locked_workflow(monkeypatch):
    from hermes_cli import web_server

    evidence_calls = []

    async def fake_request(path, method="GET", payload=None):
        raise AssertionError("locked workflow should not call Hermes Brain")

    monkeypatch.setattr(web_server, "_hermes_brain_service_token", lambda: "test-token")
    monkeypatch.setattr(web_server, "_hermes_brain_request", fake_request)
    monkeypatch.setattr(
        web_server,
        "_record_high_impact_preflight_evidence",
        lambda **kwargs: evidence_calls.append(kwargs) or {"id": "preflight-enforcement-destructive-pruning", **kwargs},
    )

    client = TestClient(web_server.app)
    response = client.post(
        "/api/second-brain/high-impact-workflows/destructive-pruning/preflight",
        json={"task": "Delete old warehouse data"},
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 423
    detail = response.json()["detail"]
    assert detail["error"] == "high_impact_workflow_locked"
    assert detail["workflow"]["posture"] == "blocked_until_approved"
    assert detail["enforcement"]["mustStop"] is True
    assert detail["evidence"]["id"] == "preflight-enforcement-destructive-pruning"
    assert evidence_calls[0]["state"] == "blocked"


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
