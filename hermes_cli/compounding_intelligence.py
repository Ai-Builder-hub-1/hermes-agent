"""Compounding intelligence proposals built from governed Hermes evidence."""

from __future__ import annotations

import asyncio
import hashlib
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


CONTRACT_VERSION = "hermes-compounding-intelligence.v1"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def compounding_intelligence_summary() -> dict[str, Any]:
    from hermes_cli.operating_runtime import action_policy_summary
    from hermes_cli.portfolio_intelligence import portfolio_intelligence_summary
    from hermes_cli.system_operations import recovery_summary
    from hermes_cli.trading_research import outcome_learning_summary, strategy_lifecycle_summary

    lifecycle, outcomes, portfolio = await asyncio.gather(
        strategy_lifecycle_summary(),
        outcome_learning_summary(),
        portfolio_intelligence_summary(),
    )
    policy = action_policy_summary()
    recovery = recovery_summary()
    return compounding_intelligence_from_components(lifecycle, outcomes, portfolio, policy, recovery)


def compounding_intelligence_from_components(
    lifecycle: dict[str, Any],
    outcomes: dict[str, Any],
    portfolio: dict[str, Any],
    policy: dict[str, Any],
    recovery: dict[str, Any],
) -> dict[str, Any]:
    proposals = _proposals(lifecycle, outcomes, portfolio, policy, recovery)
    evidence_layer = _automated_evidence_layer(lifecycle, outcomes, portfolio, recovery)
    predictive_layer = _predictive_and_causal_layer(lifecycle, outcomes, portfolio, recovery, evidence_layer)
    remediation_layer = _remediation_layer(proposals, evidence_layer, predictive_layer)
    business_layer = _business_reliability_cost_self_audit_layer(lifecycle, outcomes, portfolio, recovery, evidence_layer, predictive_layer, remediation_layer)
    fleet_layer = _fleet_governance_layer(policy, recovery, evidence_layer, remediation_layer, business_layer)
    launch_layer = _launch_readiness_layer(lifecycle, outcomes, portfolio, recovery, business_layer, fleet_layer)
    interaction_layer = _frontend_interaction_maturity_layer()
    committee_packet = _committee_packet(lifecycle, outcomes, portfolio, policy, recovery, proposals)
    blocked = [proposal for proposal in proposals if proposal["status"] == "blocked"]
    approval = [proposal for proposal in proposals if proposal["requiresApproval"]]
    slo_breaches = evidence_layer["slos"]["summary"]["breaches"]
    triage_packets = len(remediation_layer["triagePackets"])
    return {
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": now_iso(),
        "health": "critical" if blocked or slo_breaches else "warning" if approval or triage_packets else "ready",
        "summary": {
            "proposals": len(proposals),
            "blocked": len(blocked),
            "requiresApproval": len(approval),
            "experiments": len([proposal for proposal in proposals if proposal["type"] == "experiment"]),
            "promotionReviews": len([proposal for proposal in proposals if proposal["type"] == "promotion_review"]),
            "demotionReviews": len([proposal for proposal in proposals if proposal["type"] == "demotion_review"]),
            "evidenceCaptures": evidence_layer["summary"]["captures"],
            "sloBreaches": slo_breaches,
            "forecasts": predictive_layer["summary"]["forecasts"],
            "causalChains": predictive_layer["summary"]["causalChains"],
            "causalGraphNodes": predictive_layer["summary"]["graphNodes"],
            "triagePackets": triage_packets,
            "playbooks": remediation_layer["summary"]["playbooks"],
            "runbookHistory": remediation_layer["summary"]["runbookHistory"],
            "businessDomains": business_layer["summary"]["domains"],
            "selfAuditGaps": business_layer["summary"]["selfAuditGaps"],
            "regressionActions": business_layer["summary"]["regressionActions"],
            "fleetControls": fleet_layer["summary"]["controls"],
            "visualBaselines": fleet_layer["summary"]["visualBaselines"],
            "interactionRoutes": interaction_layer["summary"]["routes"],
            "launchSystems": launch_layer["summary"]["systems"],
            "launchReady": launch_layer["summary"]["ready"],
            "liveTradingLocked": True,
            "executionEnabled": False,
        },
        "proposals": proposals,
        "committeePacket": committee_packet,
        "automatedEvidence": evidence_layer,
        "predictiveIntelligence": predictive_layer,
        "remediation": remediation_layer,
        "businessReliabilityCost": business_layer,
        "fleetGovernance": fleet_layer,
        "launchReadiness": launch_layer,
        "interactionMaturity": interaction_layer,
        "evidence": {
            "lifecycle": _brief(lifecycle),
            "outcomes": _brief(outcomes),
            "portfolio": _brief(portfolio),
            "policy": _brief(policy),
            "recovery": _brief(recovery),
        },
        "blockers": [proposal["title"] for proposal in blocked] + [breach["title"] for breach in evidence_layer["slos"]["breaches"]],
        "recommendations": [
            *[proposal["nextAction"] for proposal in proposals[:5]],
            *[packet["recommendedAction"] for packet in remediation_layer["triagePackets"][:3]],
            *[system["nextAction"] for system in launch_layer["systems"] if system["status"] != "ready"][:3],
        ],
    }


def _automated_evidence_layer(
    lifecycle: dict[str, Any],
    outcomes: dict[str, Any],
    portfolio: dict[str, Any],
    recovery: dict[str, Any],
) -> dict[str, Any]:
    lifecycle_summary = lifecycle.get("summary") if isinstance(lifecycle.get("summary"), dict) else {}
    outcome_summary = outcomes.get("summary") if isinstance(outcomes.get("summary"), dict) else {}
    portfolio_summary = portfolio.get("summary") if isinstance(portfolio.get("summary"), dict) else {}
    recovery_summary = recovery.get("summary") if isinstance(recovery.get("summary"), dict) else {}
    captures = [
        _capture("strategy-lifecycle-snapshot", "api_snapshot", "strategy-lifecycle", lifecycle, "standard"),
        _capture("outcome-learning-snapshot", "api_snapshot", "outcome-learning", outcomes, "standard"),
        _capture("portfolio-risk-snapshot", "api_snapshot", "portfolio-risk", portfolio, "standard"),
        _capture("recovery-snapshot", "api_snapshot", "recovery", recovery, "standard"),
    ]
    objectives = [
        _slo(
            "proof-hash-coverage",
            "Proof hash coverage",
            int(outcome_summary.get("missingProofHashes") or 0) == 0,
            f"missingProofHashes={outcome_summary.get('missingProofHashes', 0)}",
            "Attach proof hashes to outcome, backtest, and strategy evidence.",
            "critical",
        ),
        _slo(
            "recovery-proof-coverage",
            "Recovery proof coverage",
            int(recovery_summary.get("rollbackGaps") or 0) == 0 and recovery.get("health") != "critical",
            f"recoveryHealth={recovery.get('health')}; rollbackGaps={recovery_summary.get('rollbackGaps', 0)}",
            "Attach rollback/no-op proof before expanding automation.",
            "critical",
        ),
        _slo(
            "strategy-blocker-clearance",
            "Strategy blocker clearance",
            int(lifecycle_summary.get("blocked") or 0) == 0,
            f"blockedStrategies={lifecycle_summary.get('blocked', 0)}",
            "Review blocked strategies for pause, retirement, or missing evidence.",
            "warning",
        ),
        _slo(
            "portfolio-observability",
            "Portfolio observability",
            str(portfolio_summary.get("allocationPosture") or "unknown") == "ready",
            f"allocationPosture={portfolio_summary.get('allocationPosture')}; brokerCoverage={portfolio_summary.get('brokerCoverage')}",
            "Restore broker/account observability before expansion.",
            "warning",
        ),
    ]
    breaches = [objective for objective in objectives if objective["status"] == "breach"]
    slo_history = [_slo_history_point(objective) for objective in objectives]
    return {
        "contractVersion": "hermes-automated-evidence-slo.v1",
        "generatedAt": now_iso(),
        "summary": {
            "captures": len(captures),
            "objectives": len(objectives),
            "breaches": len(breaches),
            "burnRate": round(len(breaches) / max(len(objectives), 1), 2),
            "dedupeKey": "source+subject+contractVersion",
            "retention": "standard",
            "historyPoints": len(slo_history),
        },
        "captures": captures,
        "slos": {
            "objectives": objectives,
            "breaches": breaches,
            "summary": {
                "objectives": len(objectives),
                "breaches": len(breaches),
                "burnRate": round(len(breaches) / max(len(objectives), 1), 2),
            },
        },
        "sloHistory": {
            "contractVersion": "hermes-slo-history.v1",
            "storageMode": "local_snapshot_ledger",
            "status": "local_ready_live_series_deferred",
            "generatedAt": now_iso(),
            "summary": {
                "points": len(slo_history),
                "sources": len({point["source"] for point in slo_history}),
                "liveSeriesConnected": False,
            },
            "points": slo_history,
        },
    }


def _predictive_and_causal_layer(
    lifecycle: dict[str, Any],
    outcomes: dict[str, Any],
    portfolio: dict[str, Any],
    recovery: dict[str, Any],
    evidence_layer: dict[str, Any],
) -> dict[str, Any]:
    lifecycle_summary = lifecycle.get("summary") if isinstance(lifecycle.get("summary"), dict) else {}
    outcome_summary = outcomes.get("summary") if isinstance(outcomes.get("summary"), dict) else {}
    portfolio_summary = portfolio.get("summary") if isinstance(portfolio.get("summary"), dict) else {}
    recovery_summary = recovery.get("summary") if isinstance(recovery.get("summary"), dict) else {}
    forecasts = [
        _forecast(
            "proof-debt-risk",
            "Proof debt will block promotion reviews",
            int(outcome_summary.get("missingProofHashes") or 0),
            "critical",
            "Missing proof hashes convert future promotion decisions into manual recovery work.",
        ),
        _forecast(
            "recovery-gap-risk",
            "Recovery gaps will block autonomy expansion",
            int(recovery_summary.get("rollbackGaps") or 0),
            "critical",
            "Rollback gaps keep scheduler/autonomy work approval-gated.",
        ),
        _forecast(
            "strategy-blocker-risk",
            "Blocked strategies will slow research throughput",
            int(lifecycle_summary.get("blocked") or 0),
            "warning",
            "Blocked lifecycle rows reduce clean promotion candidates.",
        ),
        _forecast(
            "allocation-observability-risk",
            "Portfolio observability may constrain expansion",
            0 if str(portfolio_summary.get("allocationPosture") or "unknown") == "ready" else 1,
            "warning",
            "Allocation posture must be ready before compounding scope increases.",
        ),
    ]
    forecasts = [forecast for forecast in forecasts if forecast["signal"] > 0]
    causal_chains = [
        _causal_chain(
            "proof-to-promotion-chain",
            ["outcome-learning", "proof-hash-coverage", "promotion-review-packet"],
            "Missing proof hashes increase promotion review risk.",
            "Attach proof hash artifacts before committee review.",
            int(outcome_summary.get("missingProofHashes") or 0),
        ),
        _causal_chain(
            "recovery-to-autonomy-chain",
            ["recovery", "rollback-proof-coverage", "enable-autonomy-scheduler"],
            "Recovery proof gaps block autonomy and scheduler expansion.",
            "Close rollback/no-op evidence before enabling automation.",
            int(recovery_summary.get("rollbackGaps") or 0),
        ),
        _causal_chain(
            "portfolio-to-sizing-chain",
            ["portfolio-risk-office", "broker-coverage", "allocation-constraint-review"],
            "Portfolio observability constrains compounding experiment sizing.",
            "Restore read-only broker/account metrics before expansion.",
            0 if str(portfolio_summary.get("allocationPosture") or "unknown") == "ready" else 1,
        ),
    ]
    causal_chains = [chain for chain in causal_chains if chain["weight"] > 0]
    causal_graph = _causal_graph(causal_chains, evidence_layer)
    return {
        "contractVersion": "hermes-predictive-causal.v1",
        "generatedAt": now_iso(),
        "summary": {
            "forecasts": len(forecasts),
            "critical": len([forecast for forecast in forecasts if forecast["severity"] == "critical"]),
            "causalChains": len(causal_chains),
            "graphNodes": causal_graph["summary"]["nodes"],
            "graphEdges": causal_graph["summary"]["edges"],
            "correlationId": _correlation_id(evidence_layer),
        },
        "forecasts": forecasts,
        "causalChains": causal_chains,
        "causalGraph": causal_graph,
    }


def _remediation_layer(
    proposals: list[dict[str, Any]],
    evidence_layer: dict[str, Any],
    predictive_layer: dict[str, Any],
) -> dict[str, Any]:
    playbooks = [
        _playbook("proof-hash-remediation", "Attach missing proof hashes", "metadata-only", "run-backtest", "confirm"),
        _playbook("recovery-proof-remediation", "Attach rollback or no-op recovery proof", "operations", "enable-autonomy-scheduler", "explicit"),
        _playbook("portfolio-observability-remediation", "Restore broker/account observability", "read-only", "read-status", "none"),
        _playbook("strategy-blocker-remediation", "Review blocked strategies", "review-only", "pause-runtime", "confirm"),
    ]
    packets: list[dict[str, Any]] = []
    for breach in evidence_layer["slos"]["breaches"]:
        packets.append(_triage_packet(
            packet_id=f"slo-{breach['id']}",
            title=f"SLO breach: {breach['title']}",
            severity=breach["severity"],
            evidence=[breach["measurement"]],
            recommended_action=breach["nextAction"],
            playbook_id=_playbook_for_slo(breach["id"]),
            approval=breach["approval"],
        ))
    for forecast in predictive_layer["forecasts"]:
        packets.append(_triage_packet(
            packet_id=f"forecast-{forecast['id']}",
            title=f"Forecast: {forecast['title']}",
            severity=forecast["severity"],
            evidence=[forecast["reason"]],
            recommended_action=forecast["nextAction"],
            playbook_id=_playbook_for_forecast(forecast["id"]),
            approval="explicit" if forecast["severity"] == "critical" else "confirm",
        ))
    for proposal in proposals:
        if proposal["status"] == "blocked":
            packets.append(_triage_packet(
                packet_id=f"proposal-{proposal['id']}",
                title=f"Blocked proposal: {proposal['title']}",
                severity=proposal["risk"],
                evidence=proposal["evidence"],
                recommended_action=proposal["nextAction"],
                playbook_id=_playbook_for_action(proposal["policyAction"]),
                approval=proposal["policy"]["approval"],
            ))
    runbook_history = [_runbook_history_entry(playbook, packets) for playbook in playbooks]
    return {
        "contractVersion": "hermes-remediation-autonomy.v1",
        "generatedAt": now_iso(),
        "summary": {
            "playbooks": len(playbooks),
            "triagePackets": len(packets),
            "runbookHistory": len(runbook_history),
            "approvalRequired": len([packet for packet in packets if packet["approval"] in {"confirm", "explicit"}]),
            "executionEnabled": False,
        },
        "playbooks": playbooks,
        "triagePackets": packets[:12],
        "runbookHistory": runbook_history,
    }


def _business_reliability_cost_self_audit_layer(
    lifecycle: dict[str, Any],
    outcomes: dict[str, Any],
    portfolio: dict[str, Any],
    recovery: dict[str, Any],
    evidence_layer: dict[str, Any],
    predictive_layer: dict[str, Any],
    remediation_layer: dict[str, Any],
) -> dict[str, Any]:
    outcome_summary = outcomes.get("summary") if isinstance(outcomes.get("summary"), dict) else {}
    portfolio_summary = portfolio.get("summary") if isinstance(portfolio.get("summary"), dict) else {}
    recovery_summary = recovery.get("summary") if isinstance(recovery.get("summary"), dict) else {}
    lifecycle_summary = lifecycle.get("summary") if isinstance(lifecycle.get("summary"), dict) else {}
    domains = [
        _business_domain("nous-hermes", "Nous Hermes", "control-plane", recovery.get("health"), int(recovery_summary.get("rollbackGaps") or 0), "Keep operator dashboard proof, rollback proof, and permission runtime green."),
        _business_domain("khashi-vc", "Khashi VC", "investing", lifecycle.get("health"), int(lifecycle_summary.get("blocked") or 0), "Keep research, backtest, and promotion evidence separated from live execution."),
        _business_domain("investing-system", "Investing System", "investing", portfolio.get("health"), 0 if str(portfolio_summary.get("allocationPosture") or "") == "ready" else 1, "Restore account and portfolio observability before strategy expansion."),
        _business_domain("media-engine", "Media Engine", "media", "warning", 1, "Attach production outcome and audience evidence before launch decisions."),
        _business_domain("media-business-ops", "Media Business Ops", "media", "warning", 1, "Attach business ops queue, owner, and fulfillment metrics."),
    ]
    reliability = [
        _reliability_score(domain["id"], domain["label"], domain["health"], domain["openRisks"])
        for domain in domains
    ]
    cost = [
        _cost_recommendation("proof-retention", "Retain proof artifacts before pruning.", "storage", evidence_layer["summary"]["captures"], "Keep"),
        _cost_recommendation("triage-load", "Review approval-heavy triage packets before adding more automation.", "operator-time", remediation_layer["summary"]["triagePackets"], "Reduce"),
        _cost_recommendation("forecast-risk", "Prioritize critical forecasts before expanding spend.", "risk-cost", predictive_layer["summary"]["critical"], "Avoid"),
    ]
    self_audit = [
        _self_audit_gap("live-provider-history", "Live provider histories are deferred.", "deferred", "Connect provider histories after local maturity is complete."),
        _self_audit_gap("approval-outcomes", "Approval outcomes are not yet live-observed.", "deferred", "Connect approval inbox and closeout learning."),
        _self_audit_gap("media-launch-evidence", "Media launch evidence is modeled but not source-native.", "open", "Attach Media Engine and Media Business Ops telemetry."),
    ]
    regression_actions = [_regression_action(gap) for gap in self_audit]
    return {
        "contractVersion": "hermes-business-reliability-cost-self-audit.v1",
        "generatedAt": now_iso(),
        "summary": {
            "domains": len(domains),
            "criticalDomains": len([domain for domain in domains if domain["health"] == "critical"]),
            "averageReliability": round(sum(item["score"] for item in reliability) / max(len(reliability), 1)),
            "costRecommendations": len(cost),
            "selfAuditGaps": len(self_audit),
            "regressionActions": len(regression_actions),
        },
        "domains": domains,
        "reliability": reliability,
        "costRecommendations": cost,
        "selfAudit": self_audit,
        "regressionActions": regression_actions,
    }


def _fleet_governance_layer(
    policy: dict[str, Any],
    recovery: dict[str, Any],
    evidence_layer: dict[str, Any],
    remediation_layer: dict[str, Any],
    business_layer: dict[str, Any],
) -> dict[str, Any]:
    policy_summary = policy.get("summary") if isinstance(policy.get("summary"), dict) else {}
    recovery_summary = recovery.get("summary") if isinstance(recovery.get("summary"), dict) else {}
    controls = [
        _fleet_control("governance-refresh-all", "Deterministic governance refresh", "ready", "dashboard:operational-proof:report + plan validation", "Run read-only refresh before release decisions."),
        _fleet_control("deployment-ledger", "Deployment source ledger", "guarded" if int(recovery_summary.get("rollbackGaps") or 0) else "ready", "deployment evidence and rollback proof", "Attach rollback artifacts before promotion."),
        _fleet_control("package-distribution", "Package distribution path", "ready", "web build and desktop package checks", "Keep dirty-build warning visible until committed."),
        _fleet_control("runtime-data-hygiene", "Runtime data hygiene", "guarded" if evidence_layer["summary"]["breaches"] else "ready", "retention, dedupe, proof capture", "Resolve evidence breaches before autonomous expansion."),
        _fleet_control("visual-primitive-protection", "Visual primitive protection", "ready", "visual baseline contract and route proof", "Capture production screenshots after baseline storage is approved."),
        _fleet_control("autonomous-fleet-runner", "Autonomous fleet runner", "blocked" if remediation_layer["summary"]["approvalRequired"] else "guarded", "permission runtime and approval queue", "Keep execution disabled until approvals and runbook histories are live."),
    ]
    visual_baselines = _visual_baselines()
    blockers = [control for control in controls if control["status"] == "blocked"]
    guarded = [control for control in controls if control["status"] == "guarded"]
    return {
        "contractVersion": "hermes-fleet-governance-autonomous-execution.v1",
        "generatedAt": now_iso(),
        "summary": {
            "controls": len(controls),
            "ready": len([control for control in controls if control["status"] == "ready"]),
            "guarded": len(guarded),
            "blocked": len(blockers),
            "explicitPolicies": int(policy_summary.get("explicit") or 0),
            "businessDomains": business_layer["summary"]["domains"],
            "visualBaselines": len(visual_baselines),
            "executionEnabled": False,
        },
        "controls": controls,
        "visualBaselines": visual_baselines,
        "autonomy": {
            "mode": "operator_review_only",
            "executionEnabled": False,
            "dangerousActions": "explicit-approval-required",
            "nextApprovalGate": blockers[0]["title"] if blockers else guarded[0]["title"] if guarded else "cadence review",
        },
    }


def _frontend_interaction_maturity_layer() -> dict[str, Any]:
    routes = [
        _interaction_route("/operate/incidents", "operate-incidents", ["1h", "24h", "7d", "30d"]),
        _interaction_route("/operate/runs", "operate-runs", ["1h", "24h", "7d", "30d"]),
        _interaction_route("/operate/actions", "operate-actions", ["1h", "24h", "7d", "30d"]),
        _interaction_route("/system/operations", "system-operations", ["1h", "24h", "7d", "30d"]),
        _interaction_route("/trading/development", "trading-development", ["1h", "24h", "7d", "30d"]),
        _interaction_route("/trading/evidence", "trading-evidence", ["1h", "24h", "7d", "30d"]),
    ]
    states = [
        {"id": "loading", "status": "covered", "surface": "ActionResultHistory"},
        {"id": "empty", "status": "covered", "surface": "ActionResultHistory"},
        {"id": "error", "status": "covered", "surface": "ActionResultHistory"},
        {"id": "compact", "status": "covered", "surface": "ActionResultHistory"},
        {"id": "full", "status": "covered", "surface": "ActionResultHistory"},
        {"id": "time-window", "status": "standard_defined", "surface": "operate/system/trading"},
    ]
    return {
        "contractVersion": "hermes-frontend-interaction-maturity.v1",
        "generatedAt": now_iso(),
        "summary": {
            "routes": len(routes),
            "windows": len({window for route in routes for window in route["windows"]}),
            "visualStates": len(states),
            "baselineStorageConnected": False,
        },
        "routes": routes,
        "visualStates": states,
        "remainingLiveWork": "Capture approved visual regression snapshots and connect comparison storage.",
    }


def _launch_readiness_layer(
    lifecycle: dict[str, Any],
    outcomes: dict[str, Any],
    portfolio: dict[str, Any],
    recovery: dict[str, Any],
    business_layer: dict[str, Any],
    fleet_layer: dict[str, Any],
) -> dict[str, Any]:
    lifecycle_summary = lifecycle.get("summary") if isinstance(lifecycle.get("summary"), dict) else {}
    outcome_summary = outcomes.get("summary") if isinstance(outcomes.get("summary"), dict) else {}
    portfolio_summary = portfolio.get("summary") if isinstance(portfolio.get("summary"), dict) else {}
    recovery_summary = recovery.get("summary") if isinstance(recovery.get("summary"), dict) else {}
    systems = [
        _launch_system(
            "khashi-vc",
            "Khashi VC",
            "guarded" if int(lifecycle_summary.get("blocked") or 0) == 0 else "blocked",
            ["strategy lifecycle", "backtest evidence", "promotion lock"],
            [f"blockedStrategies={lifecycle_summary.get('blocked', 0)}", f"promotionCandidates={lifecycle_summary.get('promotionCandidates', 0)}"],
            "Keep strategy work review-only until observed paper/shadow outcomes exist.",
        ),
        _launch_system(
            "investing-system",
            "Investing System",
            "guarded" if str(portfolio_summary.get("allocationPosture") or "") == "ready" else "blocked",
            ["broker observability", "portfolio risk", "live lock"],
            [f"allocationPosture={portfolio_summary.get('allocationPosture')}", f"brokerCoverage={portfolio_summary.get('brokerCoverage')}"],
            "Connect broker/account metrics and keep live trading blocked until approved.",
        ),
        _launch_system(
            "media-engine",
            "Media Engine",
            "guarded",
            ["content pipeline", "audience evidence", "publishing proof"],
            ["sourceNativeMediaTelemetry=missing"],
            "Attach Media Engine output, audience, and publishing telemetry.",
        ),
        _launch_system(
            "media-business-ops",
            "Media Business Ops",
            "guarded",
            ["fulfillment queue", "operator owner", "business KPI proof"],
            ["sourceNativeOpsTelemetry=missing"],
            "Attach queue, owner, fulfillment, and business metrics.",
        ),
        _launch_system(
            "nous-hermes-control-plane",
            "Nous Hermes Control Plane",
            "guarded" if int(recovery_summary.get("rollbackGaps") or 0) == 0 and fleet_layer["summary"]["blocked"] == 0 else "blocked",
            ["rollback proof", "fleet governance", "operator control plane"],
            [f"rollbackGaps={recovery_summary.get('rollbackGaps', 0)}", f"fleetBlocked={fleet_layer['summary']['blocked']}"],
            "Resolve rollback and autonomous-runner blockers before launch expansion.",
        ),
    ]
    ready = [system for system in systems if system["status"] == "ready"]
    blocked = [system for system in systems if system["status"] == "blocked"]
    return {
        "contractVersion": "hermes-launch-readiness-closure.v1",
        "generatedAt": now_iso(),
        "summary": {
            "systems": len(systems),
            "ready": len(ready),
            "guarded": len([system for system in systems if system["status"] == "guarded"]),
            "blocked": len(blocked),
            "businessDomains": business_layer["summary"]["domains"],
            "outcomeReliability": outcome_summary.get("reliabilityScore"),
            "executionEnabled": False,
        },
        "systems": systems,
        "decision": {
            "launchMode": "guarded_review" if not blocked else "blocked_until_evidence",
            "executionEnabled": False,
            "nextAction": blocked[0]["nextAction"] if blocked else "Keep launch checks on weekly cadence.",
        },
    }


def _capture(capture_id: str, capture_type: str, source: str, payload: dict[str, Any], retention: str) -> dict[str, Any]:
    summary = payload.get("summary") if isinstance(payload.get("summary"), dict) else {}
    fingerprint = "|".join([capture_id, str(payload.get("contractVersion") or ""), str(payload.get("health") or payload.get("status") or ""), str(sorted(summary.items())[:8])])
    return {
        "id": capture_id,
        "type": capture_type,
        "source": source,
        "status": "captured" if payload else "missing",
        "retention": retention,
        "dedupeKey": f"{source}:{payload.get('contractVersion') or 'unknown'}",
        "artifactRef": f"runtime://compounding/{capture_id}",
        "contentHash": hashlib.sha256(fingerprint.encode("utf-8")).hexdigest(),
        "capturedAt": now_iso(),
    }


def _business_domain(domain_id: str, label: str, business_unit: str, health: Any, open_risks: int, next_action: str) -> dict[str, Any]:
    normalized_health = str(health or "warning")
    if normalized_health not in {"ready", "warning", "critical"}:
        normalized_health = "warning"
    impact = "critical" if open_risks > 1 or normalized_health == "critical" else "high" if open_risks else "medium"
    return {
        "id": domain_id,
        "label": label,
        "businessUnit": business_unit,
        "health": normalized_health,
        "impact": impact,
        "openRisks": open_risks,
        "nextAction": next_action,
    }


def _reliability_score(domain_id: str, label: str, health: str, open_risks: int) -> dict[str, Any]:
    base = 95 if health == "ready" else 78 if health == "warning" else 55
    score = max(0, base - open_risks * 8)
    trend = "stable" if score >= 80 else "watch" if score >= 65 else "regressing"
    return {
        "id": f"reliability-{domain_id}",
        "domainId": domain_id,
        "label": label,
        "score": score,
        "trend": trend,
        "driver": f"health={health}; openRisks={open_risks}",
    }


def _cost_recommendation(rec_id: str, title: str, bucket: str, signal: int, recommendation: str) -> dict[str, Any]:
    return {
        "id": rec_id,
        "title": title,
        "bucket": bucket,
        "signal": signal,
        "recommendation": recommendation,
        "confidence": "medium" if signal else "low",
    }


def _self_audit_gap(gap_id: str, title: str, status: str, next_action: str) -> dict[str, Any]:
    return {
        "id": gap_id,
        "title": title,
        "status": status,
        "severity": "warning" if status == "deferred" else "critical",
        "nextAction": next_action,
    }


def _fleet_control(control_id: str, title: str, status: str, proof: str, next_action: str) -> dict[str, Any]:
    return {
        "id": control_id,
        "title": title,
        "status": status,
        "proof": proof,
        "nextAction": next_action,
        "executionEnabled": False,
    }


def _launch_system(system_id: str, label: str, status: str, gates: list[str], evidence: list[str], next_action: str) -> dict[str, Any]:
    return {
        "id": system_id,
        "label": label,
        "status": status,
        "gates": gates,
        "evidence": evidence,
        "nextAction": next_action,
        "executionEnabled": False,
    }


def _slo(slo_id: str, title: str, passed: bool, measurement: str, next_action: str, severity: str) -> dict[str, Any]:
    return {
        "id": slo_id,
        "title": title,
        "status": "met" if passed else "breach",
        "measurement": measurement,
        "severity": severity if not passed else "ready",
        "burnRate": 0 if passed else 1,
        "approval": "explicit" if severity == "critical" and not passed else "confirm" if not passed else "none",
        "nextAction": next_action,
    }


def _slo_history_point(objective: dict[str, Any]) -> dict[str, Any]:
    fingerprint = "|".join([objective["id"], objective["status"], objective["measurement"]])
    return {
        "id": f"slo-history-{objective['id']}",
        "source": objective["id"],
        "status": objective["status"],
        "severity": objective["severity"],
        "measurement": objective["measurement"],
        "burnRate": objective["burnRate"],
        "capturedAt": now_iso(),
        "contentHash": hashlib.sha256(fingerprint.encode("utf-8")).hexdigest(),
    }


def _forecast(forecast_id: str, title: str, signal: int, severity: str, reason: str) -> dict[str, Any]:
    return {
        "id": forecast_id,
        "title": title,
        "signal": signal,
        "severity": severity,
        "confidence": "high" if signal > 1 or severity == "critical" else "medium",
        "horizon": "next_operator_cycle",
        "reason": reason,
        "nextAction": "Create a triage packet and collect the missing evidence before approval.",
    }


def _causal_chain(chain_id: str, nodes: list[str], summary: str, next_action: str, weight: int) -> dict[str, Any]:
    return {
        "id": chain_id,
        "correlationId": f"corr-{chain_id}",
        "nodes": nodes,
        "summary": summary,
        "weight": weight,
        "nextAction": next_action,
    }


def _causal_graph(causal_chains: list[dict[str, Any]], evidence_layer: dict[str, Any]) -> dict[str, Any]:
    nodes: dict[str, dict[str, Any]] = {}
    edges: list[dict[str, Any]] = []
    for chain in causal_chains:
        previous: str | None = None
        for index, node_id in enumerate(chain["nodes"]):
            nodes.setdefault(node_id, {
                "id": node_id,
                "label": node_id.replace("-", " "),
                "kind": "source" if index == 0 else "gate" if index == 1 else "impact",
            })
            if previous:
                edges.append({
                    "id": f"{chain['id']}:{previous}->{node_id}",
                    "from": previous,
                    "to": node_id,
                    "weight": chain["weight"],
                    "correlationId": chain["correlationId"],
                })
            previous = node_id
    return {
        "contractVersion": "hermes-causal-graph.v1",
        "storageMode": "local_contract_graph",
        "status": "local_ready_live_event_joins_deferred",
        "correlationId": _correlation_id(evidence_layer),
        "summary": {
            "nodes": len(nodes),
            "edges": len(edges),
            "liveEventJoinsConnected": False,
        },
        "nodes": list(nodes.values()),
        "edges": edges,
    }


def _playbook(playbook_id: str, title: str, mode: str, action: str, approval: str) -> dict[str, Any]:
    return {
        "id": playbook_id,
        "title": title,
        "mode": mode,
        "policyAction": action,
        "approval": approval,
        "executionEnabled": False,
        "steps": [
            "Collect current evidence snapshot.",
            "Classify risk and required approval.",
            "Record closeout as no-op, denied, superseded, failed, or completed.",
        ],
    }


def _runbook_history_entry(playbook: dict[str, Any], packets: list[dict[str, Any]]) -> dict[str, Any]:
    matching_packets = [packet for packet in packets if packet["playbookId"] == playbook["id"]]
    return {
        "id": f"runbook-history-{playbook['id']}",
        "playbookId": playbook["id"],
        "status": "not_observed" if matching_packets else "no_active_packet",
        "observedRuns": 0,
        "pendingPackets": len(matching_packets),
        "lastOutcome": "none",
        "executionEnabled": False,
        "nextAction": "Record operator-reviewed runbook outcomes when live remediation is exercised.",
    }


def _triage_packet(
    *,
    packet_id: str,
    title: str,
    severity: str,
    evidence: list[str],
    recommended_action: str,
    playbook_id: str,
    approval: str,
) -> dict[str, Any]:
    return {
        "id": packet_id,
        "title": title,
        "severity": severity,
        "status": "approval_required" if approval in {"confirm", "explicit"} else "ready",
        "evidence": evidence,
        "recommendedAction": recommended_action,
        "playbookId": playbook_id,
        "approval": approval,
        "executionEnabled": False,
        "suggestedCommand": "record-closeout",
    }


def _regression_action(gap: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": f"regression-action-{gap['id']}",
        "sourceGap": gap["id"],
        "title": f"Regression guard for {gap['title']}",
        "status": "candidate",
        "approval": "confirm" if gap["status"] == "deferred" else "explicit",
        "executionEnabled": False,
        "recommendedAction": gap["nextAction"],
        "closeoutRequired": True,
    }


def _visual_baselines() -> list[dict[str, Any]]:
    routes = [
        ("/compounding-intelligence", "compounding intelligence maturity panels"),
        ("/operate", "daily operator queue and closeout surfaces"),
        ("/system/operations", "system operations maturity panels"),
        ("/trading/evidence", "trading evidence and proof surfaces"),
    ]
    return [
        {
            "id": f"visual-baseline-{route.strip('/').replace('/', '-') or 'root'}",
            "route": route,
            "label": label,
            "status": "defined",
            "captureCommand": "dashboard:visual-baseline:capture",
            "comparisonStorage": "deferred_until_baseline_store_selected",
        }
        for route, label in routes
    ]


def _interaction_route(route: str, surface: str, windows: list[str]) -> dict[str, Any]:
    return {
        "route": route,
        "surface": surface,
        "status": "standard_defined",
        "windows": windows,
        "defaultWindow": "24h",
        "states": ["loading", "empty", "error", "ready"],
    }


def _correlation_id(evidence_layer: dict[str, Any]) -> str:
    parts = [capture["dedupeKey"] for capture in evidence_layer.get("captures") or [] if isinstance(capture, dict)]
    return f"corr-{hashlib.sha256('|'.join(parts).encode('utf-8')).hexdigest()[:16]}"


def _playbook_for_slo(slo_id: str) -> str:
    if "proof" in slo_id:
        return "proof-hash-remediation"
    if "recovery" in slo_id:
        return "recovery-proof-remediation"
    if "portfolio" in slo_id:
        return "portfolio-observability-remediation"
    return "strategy-blocker-remediation"


def _playbook_for_forecast(forecast_id: str) -> str:
    if "proof" in forecast_id:
        return "proof-hash-remediation"
    if "recovery" in forecast_id:
        return "recovery-proof-remediation"
    if "allocation" in forecast_id:
        return "portfolio-observability-remediation"
    return "strategy-blocker-remediation"


def _playbook_for_action(action: str) -> str:
    if "autonomy" in action:
        return "recovery-proof-remediation"
    if "backtest" in action:
        return "proof-hash-remediation"
    if "read" in action:
        return "portfolio-observability-remediation"
    return "strategy-blocker-remediation"


async def record_compounding_intelligence_review() -> dict[str, Any]:
    summary = await compounding_intelligence_summary()
    from hermes_cli.operating_runtime import connect, upsert_evidence

    with connect() as conn:
        evidence = upsert_evidence(
            conn,
            id=f"compounding-intelligence-review-{uuid4().hex[:10]}",
            kind="learning",
            subject="Compounding intelligence review",
            state="ready" if summary["health"] == "ready" else "warning",
            owner="Hermes",
            detail="Compounding intelligence proposal review recorded. No experiment, promotion, demotion, or trade was executed.",
            payload=summary,
        )
    return {"ok": True, "generatedAt": now_iso(), "evidence": evidence, "summary": summary}


def _proposals(
    lifecycle: dict[str, Any],
    outcomes: dict[str, Any],
    portfolio: dict[str, Any],
    policy: dict[str, Any],
    recovery: dict[str, Any],
) -> list[dict[str, Any]]:
    proposals: list[dict[str, Any]] = []
    outcome_summary = outcomes.get("summary") if isinstance(outcomes.get("summary"), dict) else {}
    portfolio_summary = portfolio.get("summary") if isinstance(portfolio.get("summary"), dict) else {}
    recovery_summary = recovery.get("summary") if isinstance(recovery.get("summary"), dict) else {}
    lifecycle_summary = lifecycle.get("summary") if isinstance(lifecycle.get("summary"), dict) else {}

    if int(outcome_summary.get("missingProofHashes") or 0) > 0:
        proposals.append(_proposal(
            proposal_id="proof-hash-experiment",
            proposal_type="experiment",
            title="Run proof-hash coverage experiment",
            priority="high",
            evidence=[f"missingProofHashes={outcome_summary.get('missingProofHashes')}"],
            next_action="Create a read-only experiment to attach proof hashes to promoted strategy and backtest evidence.",
            sizing="metadata-only; no broker/action mutation",
            action="run-backtest",
        ))
    if int(lifecycle_summary.get("promotionCandidates") or 0) > 0:
        proposals.append(_proposal(
            proposal_id="promotion-review-packet",
            proposal_type="promotion_review",
            title="Prepare promotion review packet",
            priority="medium",
            evidence=[f"promotionCandidates={lifecycle_summary.get('promotionCandidates')}"],
            next_action="Prepare a committee packet before any strategy promotion.",
            sizing="review-only; zero live allocation",
            action="paper-trade-preview",
        ))
    if str(outcome_summary.get("calibration") or "") == "blocked" or int(lifecycle_summary.get("blocked") or 0) > 0:
        proposals.append(_proposal(
            proposal_id="demotion-review",
            proposal_type="demotion_review",
            title="Review blocked strategies for pause or retirement",
            priority="high",
            evidence=[
                f"calibration={outcome_summary.get('calibration')}",
                f"blockedStrategies={lifecycle_summary.get('blocked')}",
            ],
            next_action="Create pause/retirement recommendations for blocked lifecycle rows.",
            sizing="review-only; no strategy mutation",
            action="pause-runtime",
        ))
    if str(portfolio_summary.get("allocationPosture") or "") != "ready":
        proposals.append(_proposal(
            proposal_id="allocation-constraint-review",
            proposal_type="experiment",
            title="Resolve allocation constraints before expansion",
            priority="high",
            evidence=[
                f"allocationPosture={portfolio_summary.get('allocationPosture')}",
                f"brokerCoverage={portfolio_summary.get('brokerCoverage')}",
                f"exposureCoverage={portfolio_summary.get('exposureCoverage')}",
            ],
            next_action="Run a read-only portfolio constraint review before increasing strategy scope.",
            sizing="read-only; no allocation change",
            action="read-status",
        ))
    if int(recovery_summary.get("rollbackGaps") or 0) > 0 or recovery.get("health") == "critical":
        proposals.append(_proposal(
            proposal_id="recovery-proof-before-autonomy",
            proposal_type="safety_review",
            title="Attach recovery proof before more autonomy",
            priority="critical",
            evidence=[f"recoveryHealth={recovery.get('health')}", f"rollbackGaps={recovery_summary.get('rollbackGaps')}"],
            next_action="Close recovery and rollback proof gaps before enabling any scheduler/autonomy expansion.",
            sizing="operations-only; no automation increase",
            action="enable-autonomy-scheduler",
        ))
    if not proposals:
        proposals.append(_proposal(
            proposal_id="cadence-compounding-review",
            proposal_type="experiment",
            title="Keep compounding intelligence review on cadence",
            priority="low",
            evidence=["All core compounding blockers are clear."],
            next_action="Review outcome, portfolio, policy, and recovery posture on the next cadence.",
            sizing="read-only cadence review",
            action="read-status",
        ))

    policies = {str(row.get("action")): row for row in policy.get("policies") or [] if isinstance(row, dict)}
    for proposal in proposals:
        action_policy = policies.get(proposal["policyAction"]) or {}
        proposal["policy"] = {
            "actionClass": action_policy.get("action_class") or "read",
            "risk": action_policy.get("risk") or proposal["risk"],
            "approval": action_policy.get("approval") or "none",
            "proofRequired": action_policy.get("proof_required") or "proposal evidence and review receipt",
            "rollbackRequired": bool(action_policy.get("rollback_required")),
            "liveEffect": bool(action_policy.get("live_effect")),
        }
        proposal["requiresApproval"] = proposal["priority"] in {"critical", "high"} or proposal["policy"]["approval"] == "explicit"
        proposal["status"] = "blocked" if proposal["priority"] == "critical" else "review" if proposal["requiresApproval"] else "ready"
    return proposals


def _proposal(
    *,
    proposal_id: str,
    proposal_type: str,
    title: str,
    priority: str,
    evidence: list[str],
    next_action: str,
    sizing: str,
    action: str,
) -> dict[str, Any]:
    return {
        "id": proposal_id,
        "type": proposal_type,
        "title": title,
        "priority": priority,
        "risk": "critical" if priority == "critical" else "high" if priority == "high" else "medium" if priority == "medium" else "low",
        "confidence": "medium" if priority in {"critical", "high"} else "low",
        "evidence": evidence,
        "nextAction": next_action,
        "sizing": sizing,
        "policyAction": action,
        "executionEnabled": False,
        "liveTradingLocked": True,
    }


def _committee_packet(
    lifecycle: dict[str, Any],
    outcomes: dict[str, Any],
    portfolio: dict[str, Any],
    policy: dict[str, Any],
    recovery: dict[str, Any],
    proposals: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "title": "Compounding Intelligence Committee Packet",
        "generatedAt": now_iso(),
        "decisionMode": "operator_review_only",
        "sections": [
            {"id": "strategy-lifecycle", "health": lifecycle.get("health"), "summary": lifecycle.get("summary")},
            {"id": "outcome-learning", "health": outcomes.get("health"), "summary": outcomes.get("summary")},
            {"id": "portfolio-risk-office", "health": portfolio.get("health"), "summary": portfolio.get("summary")},
            {"id": "action-policy", "health": "ready", "summary": policy.get("summary")},
            {"id": "recovery", "health": recovery.get("health"), "summary": recovery.get("summary")},
        ],
        "proposals": [proposal["id"] for proposal in proposals],
        "approvalRequired": any(proposal.get("requiresApproval") for proposal in proposals),
        "executionEnabled": False,
        "liveTradingLocked": True,
    }


def _brief(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "contractVersion": payload.get("contractVersion"),
        "health": payload.get("health") or payload.get("status"),
        "generatedAt": payload.get("generatedAt"),
        "summary": payload.get("summary"),
    }
