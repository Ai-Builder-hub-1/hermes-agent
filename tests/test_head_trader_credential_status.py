import json

from fastapi.testclient import TestClient

from hermes_cli import credential_status as module


def test_credential_status_never_returns_secret_values(tmp_path, monkeypatch):
    proof = {
        "generatedAt": "2099-01-01T00:00:00.000Z",
        "mode": "production-proof",
        "host": "hermes-os",
        "projects": [
            {
                "projectId": "investing-system",
                "variables": [
                    {"name": "BINANCE_API_KEY", "configured": True, "valueLength": 64, "source": "production_container"},
                    {"name": "BINANCE_SECRET_KEY", "configured": True, "valueLength": 64, "source": "production_container"},
                ],
            },
            {
                "projectId": "khashi-vc",
                "variables": [
                    {"name": "BINANCE_API_KEY", "configured": True, "valueLength": 64, "source": "production_container"},
                    {"name": "BINANCE_SECRET_KEY", "configured": True, "valueLength": 64, "source": "production_container"},
                ],
            },
        ],
    }
    proof_path = tmp_path / "fleet-credential-status.json"
    proof_path.write_text(json.dumps(proof), encoding="utf-8")
    monkeypatch.setattr(module, "_proof_path", lambda: proof_path)
    monkeypatch.setenv("BINANCE_API_KEY", "a" * 64)
    monkeypatch.setenv("BINANCE_SECRET_KEY", "s" * 64)

    payload = module.credential_status()
    serialized = json.dumps(payload)

    assert payload["status"] == "ready"
    assert "a" * 64 not in serialized
    assert "s" * 64 not in serialized
    assert payload["runtime"]["variables"][0]["valueLength"] == 64
    assert all(project["status"] == "ready" for project in payload["projects"])


def test_credential_status_reports_missing_proof_as_watch(tmp_path, monkeypatch):
    missing = tmp_path / "missing.json"
    monkeypatch.setattr(module, "_proof_path", lambda: missing)
    monkeypatch.delenv("BINANCE_API_KEY", raising=False)
    monkeypatch.delenv("BINANCE_SECRET_KEY", raising=False)

    payload = module.credential_status()

    assert payload["status"] == "watch"
    assert payload["productionProof"]["freshness"] == "missing"
    assert {project["status"] for project in payload["projects"]} == {"unknown"}


def test_credential_frontend_spec_names_safe_rendering_rules():
    spec = module.credential_frontend_spec()

    assert spec["contractVersion"] == module.CONTRACT_VERSION
    assert any("Never render credential values" in rule for rule in spec["securityRules"])


def test_head_trader_credential_status_route_is_redacted(tmp_path, monkeypatch):
    from hermes_cli import web_server

    proof_path = tmp_path / "fleet-credential-status.json"
    proof_path.write_text(
        json.dumps({
            "generatedAt": "2099-01-01T00:00:00.000Z",
            "mode": "production-proof",
            "host": "hermes-os",
            "projects": [
                {
                    "projectId": "investing-system",
                    "variables": [
                        {"name": "BINANCE_API_KEY", "configured": True, "valueLength": 64},
                        {"name": "BINANCE_SECRET_KEY", "configured": True, "valueLength": 64},
                    ],
                },
                {
                    "projectId": "khashi-vc",
                    "variables": [
                        {"name": "BINANCE_API_KEY", "configured": True, "valueLength": 64},
                        {"name": "BINANCE_SECRET_KEY", "configured": True, "valueLength": 64},
                    ],
                },
            ],
        }),
        encoding="utf-8",
    )
    monkeypatch.setattr(module, "_proof_path", lambda: proof_path)
    monkeypatch.setenv("BINANCE_API_KEY", "api-secret-value")
    monkeypatch.setenv("BINANCE_SECRET_KEY", "super-secret-value")

    client = TestClient(web_server.app)
    response = client.get(
        "/api/head-trader/credential-status",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    body = response.text
    assert "api-secret-value" not in body
    assert "super-secret-value" not in body
    assert response.json()["status"] == "ready"
