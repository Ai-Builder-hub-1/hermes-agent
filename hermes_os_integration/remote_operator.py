"""Remote Operator Runtime contracts for Hermes OS.

This module is the dry-run foundation for using Discord, Telegram, CLI, API,
and dashboard surfaces as remote control inputs. It normalizes inbound messages,
checks operator policy, creates workflow jobs, emits progress/audit records, and
summarizes runtime health without giving gateways direct shell access.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional

from .conversational import ChatEnvelope, chief_of_staff_plan, route_intent


REMOTE_OPERATOR_SCHEMA = "hermes-remote-operator-v1"

REMOTE_SOURCES = ["cli", "api", "dashboard", "discord", "telegram"]
REMOTE_ACTION_CLASSES = [
    "read_only",
    "research",
    "build",
    "commit",
    "push",
    "deploy",
    "destructive",
    "approval",
    "unknown",
]
REMOTE_JOB_STATES = [
    "queued",
    "running",
    "waiting_for_approval",
    "completed",
    "failed",
    "canceled",
    "timed_out",
    "blocked",
]
APPROVAL_REQUIRED_ACTIONS = {"build", "commit", "push", "deploy", "destructive"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slug(value: str) -> str:
    safe = "".join(char.lower() if char.isalnum() else "-" for char in value.strip())
    return "-".join(part for part in safe.split("-") if part) or "request"


@dataclass(frozen=True)
class RemoteGatewayIdentity:
    source: str
    user_id: str
    display_name: str = ""
    channel_id: str = ""
    chat_id: str = ""
    platform_message_id: str = ""


@dataclass(frozen=True)
class RemoteCommandEnvelope:
    request_id: str
    source: str
    message: str
    user_id: str
    project_id: str = "workspace"
    session_id: str = "remote"
    action_class: str = "unknown"
    gateway: RemoteGatewayIdentity = field(default_factory=lambda: RemoteGatewayIdentity("cli", "operator"))
    platform_message_id: str = ""
    dry_run: bool = True
    received_at: str = field(default_factory=_now)


@dataclass(frozen=True)
class RemoteOperatorConfig:
    enabled: bool = True
    dry_run: bool = True
    enabled_gateways: List[str] = field(default_factory=lambda: ["cli", "api", "dashboard"])
    allowed_users: List[str] = field(default_factory=lambda: ["operator"])
    allowed_projects: List[str] = field(default_factory=lambda: ["workspace"])
    allowed_workflows: List[str] = field(default_factory=lambda: ["status", "briefing", "existing_project_work", "research", "architecture_review"])
    live_allowed_actions: List[str] = field(default_factory=lambda: ["read_only", "research"])
    approval_required_actions: List[str] = field(default_factory=lambda: sorted(APPROVAL_REQUIRED_ACTIONS))
    budget_ceiling_usd: float = 0.0
    token_ceiling: int = 0
    emergency_stop: bool = False
    worker_allowlist: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class RemoteApprovalPrompt:
    approval_id: str
    request_id: str
    project_id: str
    action_class: str
    risk: str
    summary: str
    rollback_path: str = ""
    expected_cost_usd: float = 0.0
    timeout_seconds: int = 900
    status: str = "pending"
    actions: List[str] = field(default_factory=lambda: ["approve", "reject", "request-more-context"])


@dataclass(frozen=True)
class RemoteWorkflowJob:
    job_id: str
    request_id: str
    project_id: str
    workflow: str
    action_class: str
    status: str
    source: str
    dry_run: bool
    requires_approval: bool
    approvals: List[RemoteApprovalPrompt] = field(default_factory=list)
    steps: List[Dict[str, Any]] = field(default_factory=list)
    artifacts: List[str] = field(default_factory=list)
    blocked_reason: str = ""
    created_at: str = field(default_factory=_now)


@dataclass(frozen=True)
class RemoteProgressEvent:
    event_id: str
    job_id: str
    request_id: str
    event_type: str
    status: str
    message: str
    step_id: str = ""
    artifact_ref: str = ""
    timestamp: str = field(default_factory=_now)


@dataclass(frozen=True)
class RemoteAuditRecord:
    audit_id: str
    request_id: str
    job_id: str
    source: str
    user_id: str
    project_id: str
    action_class: str
    event_type: str
    outcome: str
    platform_message_id: str = ""
    artifact_refs: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=_now)


@dataclass(frozen=True)
class RemoteOperatorHealth:
    available: bool
    mode: str
    enabled_gateways: List[str]
    configured_gateways: Dict[str, str]
    active_jobs: int
    waiting_for_approval: int
    recent_failures: int
    policy_blocks: int
    emergency_stop: bool
    checked_at: str = field(default_factory=_now)


def remote_operator_config(
    *,
    enabled_gateways: Optional[Iterable[str]] = None,
    allowed_users: Optional[Iterable[str]] = None,
    allowed_projects: Optional[Iterable[str]] = None,
    allowed_workflows: Optional[Iterable[str]] = None,
    dry_run: bool = True,
    budget_ceiling_usd: float = 0.0,
    token_ceiling: int = 0,
    emergency_stop: bool = False,
    worker_allowlist: Optional[Iterable[str]] = None,
) -> RemoteOperatorConfig:
    return RemoteOperatorConfig(
        dry_run=dry_run,
        enabled_gateways=list(enabled_gateways or ["cli", "api", "dashboard"]),
        allowed_users=list(allowed_users or ["operator"]),
        allowed_projects=list(allowed_projects or ["workspace"]),
        allowed_workflows=list(allowed_workflows or ["status", "briefing", "existing_project_work", "research", "architecture_review"]),
        budget_ceiling_usd=budget_ceiling_usd,
        token_ceiling=token_ceiling,
        emergency_stop=emergency_stop,
        worker_allowlist=list(worker_allowlist or []),
    )


def classify_remote_action(message: str) -> str:
    text = message.strip().lower()
    if any(token in text for token in ("approve", "reject", "request more context")):
        return "approval"
    if any(token in text for token in ("delete", "remove secret", "drop database", "destroy")):
        return "destructive"
    if "deploy" in text or "production" in text:
        return "deploy"
    if "push" in text:
        return "push"
    if "commit" in text:
        return "commit"
    if any(token in text for token in ("build", "implement", "fix", "continue", "complete")):
        return "build"
    if any(token in text for token in ("research", "analyze", "investigate", "ask")):
        return "research"
    if any(token in text for token in ("status", "briefing", "summary", "what happened", "blocker")):
        return "read_only"
    return "unknown"


def normalize_remote_request(
    message: str,
    *,
    source: str = "cli",
    user_id: str = "operator",
    project_id: str = "workspace",
    session_id: str = "remote",
    channel_id: str = "",
    chat_id: str = "",
    display_name: str = "",
    platform_message_id: str = "",
    dry_run: bool = True,
) -> RemoteCommandEnvelope:
    if source not in REMOTE_SOURCES:
        source = "api"
    request_id = f"remote:{source}:{session_id}:{_slug(platform_message_id or message)[:48]}"
    gateway = RemoteGatewayIdentity(
        source=source,
        user_id=user_id,
        display_name=display_name,
        channel_id=channel_id,
        chat_id=chat_id,
        platform_message_id=platform_message_id,
    )
    return RemoteCommandEnvelope(
        request_id=request_id,
        source=source,
        message=message,
        user_id=user_id,
        project_id=project_id,
        session_id=session_id,
        action_class=classify_remote_action(message),
        gateway=gateway,
        platform_message_id=platform_message_id,
        dry_run=dry_run,
    )


def authorize_remote_request(envelope: RemoteCommandEnvelope, config: RemoteOperatorConfig) -> Dict[str, Any]:
    errors: List[str] = []
    if not config.enabled:
        errors.append("remote operator runtime is disabled")
    if config.emergency_stop:
        errors.append("emergency stop is active")
    if envelope.source not in config.enabled_gateways:
        errors.append(f"gateway is not enabled: {envelope.source}")
    if config.allowed_users and envelope.user_id not in config.allowed_users:
        errors.append(f"user is not authorized: {envelope.user_id}")
    if config.allowed_projects and envelope.project_id not in config.allowed_projects:
        errors.append(f"project is not allowed: {envelope.project_id}")
    if not config.dry_run and envelope.action_class not in config.live_allowed_actions:
        errors.append(f"live action is not allowlisted: {envelope.action_class}")
    return {"allowed": not errors, "errors": errors, "dry_run": config.dry_run or envelope.dry_run}


def approval_required_for(envelope: RemoteCommandEnvelope, config: RemoteOperatorConfig, workflow: str) -> bool:
    if envelope.action_class in set(config.approval_required_actions):
        return True
    if workflow not in set(config.allowed_workflows):
        return True
    return False


def create_remote_workflow_job(
    envelope: RemoteCommandEnvelope,
    config: RemoteOperatorConfig,
    *,
    project_path: str = ".",
) -> RemoteWorkflowJob:
    authz = authorize_remote_request(envelope, config)
    route = route_intent(envelope.message)
    plan = chief_of_staff_plan(
        ChatEnvelope(
            message=envelope.message,
            user_id=envelope.user_id,
            project_id=envelope.project_id,
            session_id=envelope.session_id,
            dry_run=authz["dry_run"],
        ),
        project_path=project_path,
    )
    job_id = f"job:{envelope.request_id.split(':', 1)[1]}"
    requires_approval = approval_required_for(envelope, config, route.workflow) or any(step.requires_approval for step in plan.steps)
    approvals = []
    if requires_approval:
        approvals.append(
            RemoteApprovalPrompt(
                approval_id=f"approval:{job_id}",
                request_id=envelope.request_id,
                project_id=envelope.project_id,
                action_class=envelope.action_class,
                risk="high" if envelope.action_class in {"deploy", "destructive"} else "medium",
                summary=f"{envelope.source} requested {route.workflow} for {envelope.project_id}",
                rollback_path="required-before-live" if envelope.action_class in {"deploy", "destructive"} else "",
            )
        )
    if not authz["allowed"]:
        status = "blocked"
        blocked_reason = "; ".join(authz["errors"])
    elif requires_approval and not authz["dry_run"]:
        status = "waiting_for_approval"
        blocked_reason = ""
    elif requires_approval and authz["dry_run"]:
        status = "waiting_for_approval"
        blocked_reason = "dry-run approval preview"
    else:
        status = "queued"
        blocked_reason = ""
    return RemoteWorkflowJob(
        job_id=job_id,
        request_id=envelope.request_id,
        project_id=envelope.project_id,
        workflow=route.workflow,
        action_class=envelope.action_class,
        status=status,
        source=envelope.source,
        dry_run=authz["dry_run"],
        requires_approval=requires_approval,
        approvals=approvals,
        steps=[asdict(step) for step in plan.steps],
        artifacts=[artifact for step in plan.steps for artifact in step.expected_artifacts],
        blocked_reason=blocked_reason,
    )


def remote_progress_events(job: RemoteWorkflowJob) -> List[RemoteProgressEvent]:
    events = [
        RemoteProgressEvent(
            event_id=f"event:{job.job_id}:received",
            job_id=job.job_id,
            request_id=job.request_id,
            event_type="remote.request.received",
            status=job.status,
            message=f"Remote request routed to {job.workflow}.",
        )
    ]
    for index, step in enumerate(job.steps[:5], start=1):
        events.append(
            RemoteProgressEvent(
                event_id=f"event:{job.job_id}:step-{index}",
                job_id=job.job_id,
                request_id=job.request_id,
                event_type="workflow.step.preview",
                status=str(step.get("status", "planned")),
                message=str(step.get("name", step.get("step_id", "workflow step"))),
                step_id=str(step.get("step_id", "")),
            )
        )
    if job.requires_approval:
        events.append(
            RemoteProgressEvent(
                event_id=f"event:{job.job_id}:approval",
                job_id=job.job_id,
                request_id=job.request_id,
                event_type="approval.required",
                status="waiting_for_approval",
                message="Operator approval is required before live execution.",
            )
        )
    return events


def remote_audit_records(envelope: RemoteCommandEnvelope, job: RemoteWorkflowJob) -> List[RemoteAuditRecord]:
    return [
        RemoteAuditRecord(
            audit_id=f"audit:{envelope.request_id}:received",
            request_id=envelope.request_id,
            job_id=job.job_id,
            source=envelope.source,
            user_id=envelope.user_id,
            project_id=envelope.project_id,
            action_class=envelope.action_class,
            event_type="remote.request.received",
            outcome="accepted" if job.status != "blocked" else "blocked",
            platform_message_id=envelope.platform_message_id,
        ),
        RemoteAuditRecord(
            audit_id=f"audit:{envelope.request_id}:routed",
            request_id=envelope.request_id,
            job_id=job.job_id,
            source=envelope.source,
            user_id=envelope.user_id,
            project_id=envelope.project_id,
            action_class=envelope.action_class,
            event_type="workflow.routed",
            outcome=job.workflow,
            platform_message_id=envelope.platform_message_id,
            artifact_refs=job.artifacts,
        ),
    ]


def remote_operator_health(
    config: RemoteOperatorConfig,
    jobs: Optional[Iterable[RemoteWorkflowJob]] = None,
    gateway_status: Optional[Mapping[str, str]] = None,
) -> RemoteOperatorHealth:
    job_list = list(jobs or [])
    status_by_gateway = {gateway: "configured" for gateway in config.enabled_gateways}
    status_by_gateway.update(dict(gateway_status or {}))
    active_states = {"queued", "running", "waiting_for_approval"}
    return RemoteOperatorHealth(
        available=config.enabled and not config.emergency_stop,
        mode="dry_run" if config.dry_run else "live",
        enabled_gateways=list(config.enabled_gateways),
        configured_gateways=status_by_gateway,
        active_jobs=sum(1 for job in job_list if job.status in active_states),
        waiting_for_approval=sum(1 for job in job_list if job.status == "waiting_for_approval"),
        recent_failures=sum(1 for job in job_list if job.status in {"failed", "timed_out"}),
        policy_blocks=sum(1 for job in job_list if job.status == "blocked"),
        emergency_stop=config.emergency_stop,
    )


def remote_operator_dashboard_panels(config: RemoteOperatorConfig, jobs: Optional[Iterable[RemoteWorkflowJob]] = None) -> List[Dict[str, Any]]:
    job_list = list(jobs or [])
    health = remote_operator_health(config, job_list)
    approvals = [approval for job in job_list for approval in job.approvals if approval.status == "pending"]
    return [
        {
            "panel_id": "remote-operator-health",
            "title": "Remote Operator Health",
            "data": asdict(health),
        },
        {
            "panel_id": "remote-operator-jobs",
            "title": "Remote Operator Jobs",
            "data": {
                "count": len(job_list),
                "jobs": [asdict(job) for job in job_list],
                "states": REMOTE_JOB_STATES,
            },
        },
        {
            "panel_id": "remote-operator-inbox",
            "title": "Remote Operator Inbox",
            "data": {
                "pending_approvals": [asdict(approval) for approval in approvals],
                "human_action_count": len(approvals),
            },
        },
    ]


def remote_gateway_adapter_contract(source: str) -> Dict[str, Any]:
    return {
        "source": source,
        "input": ["message", "user_id", "channel_id_or_chat_id", "platform_message_id"],
        "output": ["reply", "stream_update", "approval_prompt", "final_summary"],
        "must_use_command_envelope": True,
        "direct_shell_access": False,
    }


def remote_operator_deployment_topology(vps_host: str = "") -> Dict[str, Any]:
    return {
        "runtime": "hermes-operator-api",
        "host": vps_host or "vps",
        "processes": ["operator-api", "gateway-discord", "gateway-telegram", "worker-runner"],
        "persistence": ["job-queue", "audit-log", "approval-ledger", "progress-events"],
        "workspace_access": "project-registry-scoped",
        "health_checks": ["/health", "/operator/health", "/operator/jobs"],
    }


def remote_operator_preview(
    message: str,
    *,
    source: str = "cli",
    user_id: str = "operator",
    project_id: str = "workspace",
    session_id: str = "remote",
    project_path: str = ".",
    config: Optional[RemoteOperatorConfig] = None,
) -> Dict[str, Any]:
    cfg = config or remote_operator_config(
        enabled_gateways=[source, "api", "dashboard"],
        allowed_users=[user_id],
        allowed_projects=[project_id],
    )
    envelope = normalize_remote_request(
        message,
        source=source,
        user_id=user_id,
        project_id=project_id,
        session_id=session_id,
        dry_run=cfg.dry_run,
    )
    job = create_remote_workflow_job(envelope, cfg, project_path=project_path)
    events = remote_progress_events(job)
    audit = remote_audit_records(envelope, job)
    health = remote_operator_health(cfg, [job])
    return {
        "schema": REMOTE_OPERATOR_SCHEMA,
        "request": asdict(envelope),
        "job": asdict(job),
        "progress_events": [asdict(event) for event in events],
        "audit_records": [asdict(record) for record in audit],
        "health": asdict(health),
        "gateway_contract": remote_gateway_adapter_contract(source),
    }


def remote_operator_completion_evidence(project_root: str | Path = ".") -> Dict[str, Any]:
    root = Path(project_root)
    return {
        "phase": 74,
        "tasks": [f"task-{number:03d}" for number in range(478, 485)],
        "evidence": [
            "hermes_os_integration/remote_operator.py",
            "hermes_cli/main.py",
            "hermes_os_integration/dashboard.py",
            "tests/hermes_os_integration/test_phase_74_remote_operator.py",
        ],
        "dry_run_foundation_complete": True,
        "live_gateways_complete": False,
        "human_setup_required": [
            "DISCORD_BOT_TOKEN",
            "TELEGRAM_BOT_TOKEN",
            "allowed Discord user/channel IDs",
            "allowed Telegram user/chat IDs",
            "VPS secret store and service runner",
        ],
        "project_root": str(root.resolve()),
    }
