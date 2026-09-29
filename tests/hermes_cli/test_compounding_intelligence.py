import pytest
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_compounding_intelligence_summary_and_review(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.setattr("hermes_cli.operating_runtime.db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.delenv("INVESTING_SYSTEM_API_BASE_URL", raising=False)
    monkeypatch.delenv("KHASHI_VC_API_BASE_URL", raising=False)

    from hermes_cli.compounding_intelligence import compounding_intelligence_summary, record_compounding_intelligence_review

    summary = await compounding_intelligence_summary()
    assert summary["contractVersion"] == "hermes-compounding-intelligence.v1"
    assert summary["summary"]["executionEnabled"] is False
    assert summary["summary"]["liveTradingLocked"] is True
    assert summary["proposals"]
    assert summary["proposals"][0]["executionEnabled"] is False
    assert summary["committeePacket"]["decisionMode"] == "operator_review_only"
    assert summary["committeePacket"]["executionEnabled"] is False
    assert {"lifecycle", "outcomes", "portfolio", "policy", "recovery"}.issubset(summary["evidence"])

    review = await record_compounding_intelligence_review()
    assert review["ok"] is True
    assert review["summary"]["contractVersion"] == "hermes-compounding-intelligence.v1"


def test_compounding_intelligence_api_routes(tmp_path, monkeypatch):
    from hermes_cli import operating_runtime, web_server

    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.delenv("INVESTING_SYSTEM_API_BASE_URL", raising=False)
    monkeypatch.delenv("KHASHI_VC_API_BASE_URL", raising=False)

    client = TestClient(web_server.app)
    response = client.get(
        "/api/compounding-intelligence/summary",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )
    assert response.status_code == 200
    assert response.json()["summary"]["executionEnabled"] is False

    review = client.post(
        "/api/compounding-intelligence/review",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )
    assert review.status_code == 200
    assert review.json()["ok"] is True
