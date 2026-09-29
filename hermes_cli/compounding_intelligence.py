"""Compounding intelligence proposals built from governed Hermes evidence."""

from __future__ import annotations

import asyncio
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
    committee_packet = _committee_packet(lifecycle, outcomes, portfolio, policy, recovery, proposals)
    blocked = [proposal for proposal in proposals if proposal["status"] == "blocked"]
    approval = [proposal for proposal in proposals if proposal["requiresApproval"]]
    return {
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": now_iso(),
        "health": "critical" if blocked else "warning" if approval else "ready",
        "summary": {
            "proposals": len(proposals),
            "blocked": len(blocked),
            "requiresApproval": len(approval),
            "experiments": len([proposal for proposal in proposals if proposal["type"] == "experiment"]),
            "promotionReviews": len([proposal for proposal in proposals if proposal["type"] == "promotion_review"]),
            "demotionReviews": len([proposal for proposal in proposals if proposal["type"] == "demotion_review"]),
            "liveTradingLocked": True,
            "executionEnabled": False,
        },
        "proposals": proposals,
        "committeePacket": committee_packet,
        "evidence": {
            "lifecycle": _brief(lifecycle),
            "outcomes": _brief(outcomes),
            "portfolio": _brief(portfolio),
            "policy": _brief(policy),
            "recovery": _brief(recovery),
        },
        "blockers": [proposal["title"] for proposal in blocked],
        "recommendations": [proposal["nextAction"] for proposal in proposals[:8]],
    }


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
