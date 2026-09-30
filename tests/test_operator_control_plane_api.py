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
                    "projectId": "investing-system",
                    "label": "Investing System",
                    "available": True,
                    "status": "watch",
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
                        },
                        "strategyQuality": {
                            "backtestReadiness": {
                                "generatedAt": "2026-09-29T15:23:00.000Z",
                                "status": "ready",
                                "liveTradingLocked": True,
                                "coverage": {"barCount": 240, "stale": False},
                                "lineage": {
                                    "datasetWindowId": "dataset-window-test",
                                    "sourceSnapshotId": "source-snapshot-test",
                                    "transformationVersion": "strategy-backtesting.sma-crossover.v1",
                                    "replayId": "replay-test",
                                },
                            }
                        },
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
    assert "system-recovery" in ids
    assert "trading-account-visibility" in ids
    assert "broker-account-robinhood-mcp" in ids
    assert "broker-account-oanda" in ids
    assert "backtest-lineage-investing-system" in ids
    assert "strategy-development-lifecycle" in ids
    assert "trading-outcome-learning" in ids
    assert "trading-portfolio-intelligence" in ids
    assert "compounding-intelligence-proposals" in ids
    assert body["summary"]["attention"] >= 2
    runtime_item = next(item for item in body["items"] if item["id"] == "runtime-incident-live-worker")
    assert runtime_item["severity"] == "critical"
    assert runtime_item["route"] == "/operate/incidents"
    recovery_item = next(item for item in body["items"] if item["id"] == "system-recovery")
    assert recovery_item["severity"] in {"critical", "warning"}
    assert recovery_item["route"] == "/operate/incidents"
    trading_item = next(item for item in body["items"] if item["id"] == "trading-account-visibility")
    assert trading_item["severity"] == "warning"
    assert "capitalKnown=False" in trading_item["evidence"]
    robinhood_item = next(item for item in body["items"] if item["id"] == "broker-account-robinhood-mcp")
    assert robinhood_item["severity"] == "critical"
    assert "liveSubmit=False" in robinhood_item["evidence"]
    backtest_item = next(item for item in body["items"] if item["id"] == "backtest-lineage-investing-system")
    assert backtest_item["severity"] == "ready"
    assert backtest_item["route"] == "/trading/backtesting"
    assert "replayId=replay-test" in backtest_item["evidence"]
    lifecycle_item = next(item for item in body["items"] if item["id"] == "strategy-development-lifecycle")
    assert lifecycle_item["severity"] == "critical"
    assert lifecycle_item["route"] == "/trading/strategies"
    outcome_item = next(item for item in body["items"] if item["id"] == "trading-outcome-learning")
    assert outcome_item["route"] == "/trading/evidence"
    assert "reliabilityScore=" in outcome_item["evidence"]
    portfolio_item = next(item for item in body["items"] if item["id"] == "trading-portfolio-intelligence")
    assert portfolio_item["route"] == "/trading/risk"
    assert "exposureCoverage=" in portfolio_item["evidence"]
    assert "brokerCoverage=" in portfolio_item["evidence"]
    compounding_item = next(item for item in body["items"] if item["id"] == "compounding-intelligence-proposals")
    assert compounding_item["route"] == "/compounding-intelligence"
    assert "executionEnabled=False" in compounding_item["evidence"]
    assert "liveTradingLocked=True" in compounding_item["evidence"]


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
    assert body["policy"]["action_class"] == "read"
    assert body["evidence"]["kind"] == "workbench"
    assert body["evidence"]["subject"] == "Operator action intent: Khashi VC production snapshot"
    assert body["evidence"]["payload"]["item_id"] == "fleet-khashi-vc"
    assert body["audit"]["payload"]["policy"]["proof_required"] == "read-only request proof"


def test_operate_action_policy_and_high_risk_intent(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")

    client = TestClient(web_server.app)
    policy_response = client.get(
        "/api/operate/action-policy",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )
    assert policy_response.status_code == 200
    policy = policy_response.json()
    assert policy["contractVersion"] == "hermes-action-policy.v1"
    assert policy["enforcement"]["mode"] == "decision-required-before-execution"
    assert policy["enforcement"]["resultHistoryEndpoint"] == "/api/operate/action-results"
    live_policy = next(item for item in policy["policies"] if item["action"] == "submit-live-order")
    assert live_policy["approval"] == "explicit"
    assert live_policy["required_role"] == "admin"
    assert live_policy["rollback_required"] is True

    response = client.post(
        "/api/operate/action-intent",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={
            "item_id": "live-submit",
            "title": "Submit live order",
            "action": "submit-live-order",
            "actor_role": "operator",
            "explicit_approval": False,
            "payload": {"route": "/trading/investing"},
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["decision"]["allowed"] is False
    assert body["policy"]["action_class"] == "live"
    assert body["policy"]["approval"] == "explicit"
    assert body["audit"]["payload"]["policy"]["live_effect"] is True
    assert body["evidence"]["state"] == "gated"


def test_operate_action_closeout_records_audit_and_evidence(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")

    client = TestClient(web_server.app)
    response = client.post(
        "/api/operate/action-closeout",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={
            "item_id": "system-storage",
            "title": "Storage pressure",
            "action": "review:system-storage",
            "result": "no-op",
            "actor_role": "operator",
            "proof": "Reviewed storage posture; no mutation needed.",
            "route": "/system/storage",
            "rollback": "No rollback required for read-only review.",
            "payload": {"source": "test"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["decision"]["allowed"] is True
    assert body["audit"]["action"] == "closeout:review:system-storage"
    assert body["audit"]["payload"]["result"] == "no-op"
    assert body["evidence"]["kind"] == "workbench"
    assert body["evidence"]["subject"] == "Operator action closeout: Storage pressure"
    assert body["evidence"]["payload"]["item_id"] == "system-storage"
    assert body["evidence"]["payload"]["audit_id"] == body["audit"]["id"]
    assert body["evidence"]["payload"]["route"] == "/system/storage"

    results = client.get(
        "/api/operate/action-results?route=/system/storage",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )
    assert results.status_code == 200
    results_body = results.json()
    assert results_body["contractVersion"] == "operate-action-results.v1"
    assert results_body["summary"]["closeouts"] == 1
    assert results_body["records"][0]["route"] == "/system/storage"
    assert results_body["records"][0]["auditId"] == body["audit"]["id"]


def test_operate_control_backbone_reaches_local_sufficiency(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))

    client = TestClient(web_server.app)
    headers = {"X-Hermes-Session-Token": web_server._SESSION_TOKEN}

    initial = client.get("/api/operate/control-backbone", headers=headers)
    assert initial.status_code == 200
    assert initial.json()["summary"]["controlPlaneEnough"] is False

    incident = client.post(
        "/api/operating-runtime/incidents",
        headers=headers,
        json={
            "title": "Worker restart loop",
            "severity": "critical",
            "owner": "Operations",
            "next_step": "Acknowledge the worker incident and attach recovery proof.",
            "rollback": "Keep worker disabled until recovery proof exists.",
            "source": "test",
            "status": "open",
        },
    )
    assert incident.status_code == 200

    intent = client.post(
        "/api/operate/action-intent",
        headers=headers,
        json={
            "item_id": "incident-worker-restart-loop",
            "title": "Worker restart loop",
            "action": "review:incident-worker-restart-loop",
            "actor_role": "operator",
            "explicit_approval": False,
            "payload": {"route": "/operate/incidents"},
        },
    )
    assert intent.status_code == 200

    closeout = client.post(
        "/api/operate/action-closeout",
        headers=headers,
        json={
            "item_id": "incident-worker-restart-loop",
            "title": "Worker restart loop",
            "action": "review:incident-worker-restart-loop",
            "result": "denied",
            "actor_role": "operator",
            "proof": "Denied remediation because recovery proof was insufficient.",
            "route": "/operate/incidents",
            "rollback": "Keep the incident open and collect worker logs.",
            "payload": {"severity": "critical", "run_id": "worker-review-test"},
        },
    )
    assert closeout.status_code == 200

    audit = client.get("/api/operate/control-backbone", headers=headers)
    assert audit.status_code == 200
    body = audit.json()
    assert body["contractVersion"] == "operate-control-backbone-audit.v1"
    assert body["summary"]["ready"] == body["summary"]["categories"]
    assert body["summary"]["controlPlaneEnough"] is True
    ids = {item["id"] for item in body["items"]}
    assert {
        "approval-inbox-resolution",
        "incident-lifecycle-timeline",
        "run-output-artifacts",
        "decision-learning",
    }.issubset(ids)
