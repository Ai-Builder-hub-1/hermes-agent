"""Registry for high-impact workflows that need second-brain preflight.

This module is intentionally small and static. It gives the dashboard,
command runners, and project adapters a shared source of truth for which
workflow classes must call ``/api/second-brain/agent-preflight`` before
execution, and which classes are still blocked or explicitly exempt.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Dict, Iterable, List, Literal


PreflightPosture = Literal[
    "preflight_required",
    "preflight_exempt_with_reason",
    "blocked_until_approved",
]


@dataclass(frozen=True)
class HighImpactWorkflow:
    id: str
    canonical_plan: str
    adapter_class: str
    project: str
    workflow: str
    risk_class: Literal["medium", "high", "critical"]
    posture: PreflightPosture
    endpoint: str
    owner: str
    reason: str
    evidence_path: str

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)


HIGH_IMPACT_WORKFLOWS: List[HighImpactWorkflow] = [
    HighImpactWorkflow(
        id="chat-high-impact-task",
        canonical_plan="CP-03",
        adapter_class="chat",
        project="nous-hermes-agent",
        workflow="high-impact-agent-task",
        risk_class="high",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Nous Hermes",
        reason="Chat tasks can trigger deploy, warehouse, credential, provider, or trading-adjacent actions.",
        evidence_path="docs/proofs/cp03-second-brain-production-readiness.md",
    ),
    HighImpactWorkflow(
        id="command-runner-high-impact",
        canonical_plan="CP-11",
        adapter_class="command-runner",
        project="nous-hermes-agent",
        workflow="high-impact-command",
        risk_class="high",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Nous Hermes",
        reason="Command execution is the shared path for deploys, data movement, credential changes, and operator actions.",
        evidence_path="docs/plans/canonical-maturity-blocker-tracker.md",
    ),
    HighImpactWorkflow(
        id="production-deploy-promote",
        canonical_plan="CP-02",
        adapter_class="deploy",
        project="nous-hermes-agent",
        workflow="production-deploy",
        risk_class="critical",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Operations",
        reason="Production deploys should surface stale memory, active incidents, and contradictory readiness evidence before promotion.",
        evidence_path="docs/proofs/cp03-second-brain-production-readiness.md",
    ),
    HighImpactWorkflow(
        id="warehouse-sync-restore",
        canonical_plan="CP-04",
        adapter_class="warehouse",
        project="cross-project",
        workflow="warehouse-sync-restore",
        risk_class="high",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Operations",
        reason="Warehouse sync, mirror, and restore actions can change durable evidence posture.",
        evidence_path="docs/plans/cross-project-storage-proof-registry.md",
    ),
    HighImpactWorkflow(
        id="destructive-pruning",
        canonical_plan="CP-04",
        adapter_class="pruning",
        project="cross-project",
        workflow="destructive-prune",
        risk_class="critical",
        posture="blocked_until_approved",
        endpoint="/api/second-brain/agent-preflight",
        owner="Operations",
        reason="Deletion remains disabled until archive, backup, restore, rollup, and explicit approval gates pass.",
        evidence_path="docs/plans/cross-project-warehouse-truth-contract.md",
    ),
    HighImpactWorkflow(
        id="investing-provider-backfill",
        canonical_plan="CP-06",
        adapter_class="provider-backfill",
        project="investing-system",
        workflow="earnings-event-backfill",
        risk_class="high",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Investing System",
        reason="Provider backfills consume quota, write durable warehouse data, and drive later simulations.",
        evidence_path="investing-system/docs/proofs/earnings-event-trading-e05-e24-full-extent-audit.md",
    ),
    HighImpactWorkflow(
        id="trading-research-review",
        canonical_plan="CP-06",
        adapter_class="trading-research",
        project="investing-system",
        workflow="trading-research-review",
        risk_class="high",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Investing System",
        reason="Research outcomes can influence strategy selection and should carry stale/contradiction warnings.",
        evidence_path="docs/proofs/cp03-second-brain-production-readiness.md",
    ),
    HighImpactWorkflow(
        id="khashi-market-intelligence",
        canonical_plan="CP-07",
        adapter_class="khashi-market-intelligence",
        project="khashi-vc",
        workflow="market-intelligence-signal-generation",
        risk_class="high",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Khashi VC",
        reason="Market intelligence signals should not use stale or conflicting memory silently.",
        evidence_path="khashi-vc/docs/ops/KHASHI_CP07_MARKET_INTELLIGENCE_LANE.md",
    ),
    HighImpactWorkflow(
        id="report-generation",
        canonical_plan="CP-10",
        adapter_class="reporting",
        project="khashi-vc",
        workflow="executive-report-generation",
        risk_class="medium",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Khashi VC",
        reason="Reports should expose cited memory, stale inputs, and decision lineage before briefing.",
        evidence_path="docs/plans/canonical-maturity-blocker-tracker.md",
    ),
    HighImpactWorkflow(
        id="discord-high-impact-command",
        canonical_plan="CP-11",
        adapter_class="discord",
        project="cross-project",
        workflow="discord-high-impact-command",
        risk_class="high",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Nous Hermes",
        reason="Discord can initiate operator actions and password resets from outside the dashboard.",
        evidence_path="docs/plans/canonical-maturity-blocker-tracker.md",
    ),
    HighImpactWorkflow(
        id="telegram-high-impact-command",
        canonical_plan="CP-11",
        adapter_class="telegram",
        project="cross-project",
        workflow="telegram-high-impact-command",
        risk_class="high",
        posture="preflight_required",
        endpoint="/api/second-brain/agent-preflight",
        owner="Nous Hermes",
        reason="Telegram commands need the same authorization, audit, and preflight posture as Discord.",
        evidence_path="docs/plans/canonical-maturity-blocker-tracker.md",
    ),
    HighImpactWorkflow(
        id="oanda-live-trading",
        canonical_plan="CP-05",
        adapter_class="broker-execution",
        project="investing-system",
        workflow="oanda-live-execution",
        risk_class="critical",
        posture="blocked_until_approved",
        endpoint="/api/second-brain/agent-preflight",
        owner="Investing System",
        reason="Live trading remains locked until risk gates, incident drill, restore proof, and explicit approval pass.",
        evidence_path="investing-system/docs/oanda-live-readiness-canonical-matrix.md",
    ),
]


def list_high_impact_workflows() -> List[Dict[str, str]]:
    return [workflow.to_dict() for workflow in HIGH_IMPACT_WORKFLOWS]


def find_workflow(workflow_id: str) -> HighImpactWorkflow | None:
    return next((workflow for workflow in HIGH_IMPACT_WORKFLOWS if workflow.id == workflow_id), None)


def workflows_by_posture(posture: PreflightPosture) -> List[HighImpactWorkflow]:
    return [workflow for workflow in HIGH_IMPACT_WORKFLOWS if workflow.posture == posture]


def validate_high_impact_registry(workflows: Iterable[HighImpactWorkflow] = HIGH_IMPACT_WORKFLOWS) -> List[str]:
    errors: List[str] = []
    seen: set[str] = set()
    valid_postures = {"preflight_required", "preflight_exempt_with_reason", "blocked_until_approved"}

    for workflow in workflows:
        if workflow.id in seen:
            errors.append(f"{workflow.id}: duplicate workflow id")
        seen.add(workflow.id)

        if workflow.posture not in valid_postures:
            errors.append(f"{workflow.id}: invalid posture {workflow.posture}")
        if workflow.posture == "preflight_required" and workflow.endpoint != "/api/second-brain/agent-preflight":
            errors.append(f"{workflow.id}: required preflight must use /api/second-brain/agent-preflight")
        if workflow.posture == "preflight_exempt_with_reason" and not workflow.reason.strip():
            errors.append(f"{workflow.id}: exemption must include a reason")
        if workflow.posture == "blocked_until_approved" and workflow.risk_class != "critical":
            errors.append(f"{workflow.id}: blocked workflows should be critical risk")
        if not workflow.canonical_plan.startswith("CP-"):
            errors.append(f"{workflow.id}: missing canonical CP id")
        if not workflow.owner.strip():
            errors.append(f"{workflow.id}: missing owner")
        if not workflow.evidence_path.strip():
            errors.append(f"{workflow.id}: missing evidence path")

    return errors
