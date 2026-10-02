from fastapi.testclient import TestClient


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
