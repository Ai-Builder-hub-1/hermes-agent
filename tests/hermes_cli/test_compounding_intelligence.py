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
    assert summary["automatedEvidence"]["contractVersion"] == "hermes-automated-evidence-slo.v1"
    assert summary["automatedEvidence"]["summary"]["captures"] >= 4
    assert summary["automatedEvidence"]["summary"]["backboneReady"] == summary["automatedEvidence"]["summary"]["backboneCategories"]
    assert summary["automatedEvidence"]["summary"]["automatedEvidenceEnough"] is True
    assert summary["automatedEvidence"]["captureBackbone"]["summary"]["automatedEvidenceEnough"] is True
    assert summary["automatedEvidence"]["slos"]["summary"]["objectives"] >= 4
    assert summary["automatedEvidence"]["sloHistory"]["contractVersion"] == "hermes-slo-history.v1"
    assert summary["automatedEvidence"]["sloHistory"]["summary"]["points"] >= 4
    assert summary["predictiveIntelligence"]["contractVersion"] == "hermes-predictive-causal.v1"
    assert "correlationId" in summary["predictiveIntelligence"]["summary"]
    assert summary["predictiveIntelligence"]["summary"]["backboneReady"] == summary["predictiveIntelligence"]["summary"]["backboneCategories"]
    assert summary["predictiveIntelligence"]["summary"]["predictiveCausalEnough"] is True
    assert summary["predictiveIntelligence"]["predictiveBackbone"]["summary"]["predictiveCausalEnough"] is True
    assert summary["predictiveIntelligence"]["causalGraph"]["contractVersion"] == "hermes-causal-graph.v1"
    assert "liveEventJoinsConnected" in summary["predictiveIntelligence"]["causalGraph"]["summary"]
    assert summary["remediation"]["contractVersion"] == "hermes-remediation-autonomy.v1"
    assert summary["remediation"]["summary"]["executionEnabled"] is False
    assert summary["remediation"]["summary"]["backboneReady"] == summary["remediation"]["summary"]["backboneCategories"]
    assert summary["remediation"]["summary"]["remediationEnough"] is True
    assert summary["remediation"]["remediationBackbone"]["summary"]["remediationEnough"] is True
    assert summary["remediation"]["playbooks"]
    assert summary["remediation"]["runbookHistory"]
    assert summary["businessReliabilityCost"]["contractVersion"] == "hermes-business-reliability-cost-self-audit.v1"
    assert summary["businessReliabilityCost"]["summary"]["domains"] >= 5
    assert summary["businessReliabilityCost"]["summary"]["backboneReady"] == summary["businessReliabilityCost"]["summary"]["backboneCategories"]
    assert summary["businessReliabilityCost"]["summary"]["businessReliabilityCostEnough"] is True
    assert summary["businessReliabilityCost"]["businessBackbone"]["summary"]["businessReliabilityCostEnough"] is True
    assert summary["businessReliabilityCost"]["reliability"]
    assert summary["businessReliabilityCost"]["regressionActions"]
    assert summary["fleetGovernance"]["contractVersion"] == "hermes-fleet-governance-autonomous-execution.v1"
    assert summary["fleetGovernance"]["summary"]["executionEnabled"] is False
    assert summary["fleetGovernance"]["controls"]
    assert summary["fleetGovernance"]["visualBaselines"]
    assert summary["launchReadiness"]["contractVersion"] == "hermes-launch-readiness-closure.v1"
    assert summary["launchReadiness"]["summary"]["systems"] >= 5
    assert summary["launchReadiness"]["decision"]["executionEnabled"] is False
    assert summary["interactionMaturity"]["contractVersion"] == "hermes-frontend-interaction-maturity.v1"
    assert summary["interactionMaturity"]["summary"]["routes"] >= 4
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
    body = response.json()
    assert body["summary"]["executionEnabled"] is False
    assert body["summary"]["evidenceCaptures"] >= 4
    assert body["automatedEvidence"]["captureBackbone"]["summary"]["ready"] == body["automatedEvidence"]["captureBackbone"]["summary"]["categories"]
    assert body["summary"]["businessDomains"] >= 5
    assert body["summary"]["launchSystems"] >= 5
    assert body["summary"]["visualBaselines"] >= 4
    assert body["summary"]["interactionRoutes"] >= 4
    assert body["predictiveIntelligence"]["predictiveBackbone"]["summary"]["ready"] == body["predictiveIntelligence"]["predictiveBackbone"]["summary"]["categories"]
    assert body["remediation"]["remediationBackbone"]["summary"]["ready"] == body["remediation"]["remediationBackbone"]["summary"]["categories"]
    assert body["businessReliabilityCost"]["businessBackbone"]["summary"]["ready"] == body["businessReliabilityCost"]["businessBackbone"]["summary"]["categories"]

    review = client.post(
        "/api/compounding-intelligence/review",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )
    assert review.status_code == 200
    assert review.json()["ok"] is True
