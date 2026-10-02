"""Shared high-impact command preflight policy.

Dashboard REST actions and embedded gateway slash commands enter the system
through different code paths. This module keeps their high-impact command
classification aligned so operator surfaces cannot drift.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Iterable, List, Optional

from hermes_cli.high_impact_preflight_registry import find_workflow


class HighImpactCommandPreflightError(RuntimeError):
    """Raised when a registered high-impact command may not proceed."""

    def __init__(self, status_code: int, detail: Dict[str, Any]):
        self.status_code = status_code
        self.detail = detail
        message = str(detail.get("message") or detail.get("error") or "high-impact command blocked")
        super().__init__(message)


def _normalized_tokens(tokens: Iterable[str]) -> List[str]:
    normalized = [str(token).strip().lower() for token in tokens if str(token).strip()]
    while normalized and normalized[0] == "-p":
        normalized = normalized[2:]
    return normalized


def classify_hermes_command_preflight_workflow(
    subcommand: Iterable[str],
    *,
    action_name: str = "",
) -> Optional[str]:
    """Return the registered workflow id needed before a command can run."""

    tokens = _normalized_tokens(subcommand)
    joined = " ".join(tokens)
    name = action_name.strip().lower()

    if name == "hermes-update" or joined.startswith("update"):
        return "production-deploy-promote"
    if name.startswith("gateway-") or joined.startswith("gateway "):
        return "command-runner-high-impact"
    if name == "backup" or joined.startswith("backup"):
        return "warehouse-sync-restore"
    if name == "import" or joined.startswith("import"):
        return "warehouse-sync-restore"
    if name == "checkpoints-prune" or "checkpoints prune" in joined:
        return "command-runner-high-impact"
    if name in {"skills-install", "skills-uninstall", "skills-update", "mcp-install", "tools-post-setup"}:
        return "command-runner-high-impact"
    if joined.startswith("skills ") or joined.startswith("mcp install") or joined.startswith("tools post-setup"):
        return "command-runner-high-impact"
    if name == "config-migrate" or joined.startswith("config migrate"):
        return "command-runner-high-impact"
    if name == "curator-run" or joined.startswith("curator run"):
        return "report-generation"
    if joined.startswith("snapshot restore") or joined.startswith("snapshot rewind"):
        return "destructive-pruning"
    return None


def classify_embedded_command_preflight_workflow(name: str, arg: str = "") -> Optional[str]:
    """Classify a gateway command.dispatch/slash.exec command."""

    clean_name = name.strip().lstrip("/").lower()
    clean_arg = arg.strip()
    tokens = [clean_name, *clean_arg.split()] if clean_name else clean_arg.split()
    action_name = clean_name.replace(" ", "-")
    if clean_name == "checkpoints" and clean_arg.lower().startswith("prune"):
        action_name = "checkpoints-prune"
    elif clean_name == "skills":
        verb = clean_arg.split(maxsplit=1)[0].lower() if clean_arg else ""
        action_name = f"skills-{verb}" if verb else "skills"
    elif clean_name == "mcp":
        verb = clean_arg.split(maxsplit=1)[0].lower() if clean_arg else ""
        action_name = f"mcp-{verb}" if verb else "mcp"
    elif clean_name == "tools" and clean_arg.lower().startswith("post-setup"):
        action_name = "tools-post-setup"
    elif clean_name == "config" and clean_arg.lower().startswith("migrate"):
        action_name = "config-migrate"
    elif clean_name == "curator" and clean_arg.lower().startswith("run"):
        action_name = "curator-run"
    elif clean_name == "gateway":
        verb = clean_arg.split(maxsplit=1)[0].lower() if clean_arg else ""
        action_name = f"gateway-{verb}" if verb else "gateway"

    return classify_hermes_command_preflight_workflow(tokens, action_name=action_name)


def _hermes_brain_base_url() -> str:
    return os.environ.get("HERMES_BRAIN_URL", "http://127.0.0.1:3115").rstrip("/")


def _hermes_brain_service_token() -> str:
    return os.environ.get("HERMES_BRAIN_SERVICE_TOKEN", "").strip()


def _agent_injection(check: Dict[str, Any]) -> Dict[str, Any]:
    warnings = check.get("warnings") if isinstance(check.get("warnings"), list) else []
    required_acknowledgements = (
        check.get("requiredAcknowledgements")
        if isinstance(check.get("requiredAcknowledgements"), list)
        else []
    )
    block_reasons = check.get("blockReasons") if isinstance(check.get("blockReasons"), list) else []
    return {
        "policy": check.get("policy") or "pass",
        "mustStop": check.get("policy") == "block" or bool(block_reasons),
        "mustAcknowledge": bool(required_acknowledgements),
        "warnings": warnings,
        "requiredAcknowledgements": required_acknowledgements,
        "blockReasons": block_reasons,
    }


def run_registered_high_impact_preflight_sync(
    workflow_id: str,
    *,
    task: str,
    actor: str = "Hermes operator",
    entities: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    timeout: float = 5.0,
) -> Dict[str, Any]:
    """Run the registered workflow preflight from synchronous gateway code."""

    workflow = find_workflow(workflow_id)
    if workflow is None:
        raise HighImpactCommandPreflightError(
            404,
            {
                "error": "high_impact_workflow_not_found",
                "workflowId": workflow_id,
                "message": f"Registered high-impact workflow not found: {workflow_id}",
            },
        )

    workflow_payload = workflow.to_dict()
    if workflow.posture == "blocked_until_approved":
        raise HighImpactCommandPreflightError(
            423,
            {
                "error": "high_impact_workflow_locked",
                "message": workflow.reason,
                "workflow": workflow_payload,
                "enforcement": {
                    "mode": "blocked-until-approved",
                    "mustStop": True,
                    "proceedSilentlyAllowed": False,
                },
            },
        )

    if workflow.posture == "preflight_exempt_with_reason":
        return {
            "workflow": workflow_payload,
            "check": None,
            "injection": {
                "policy": "pass",
                "mustStop": False,
                "mustAcknowledge": False,
                "warnings": [workflow.reason],
                "requiredAcknowledgements": [],
                "blockReasons": [],
            },
            "enforcement": {
                "mode": "preflight-exempt-with-reason",
                "mustStop": False,
                "mustAcknowledge": False,
                "proceedSilentlyAllowed": False,
            },
        }

    token = _hermes_brain_service_token()
    if not token:
        raise HighImpactCommandPreflightError(
            503,
            {
                "error": "hermes_brain_service_token_missing",
                "message": "Set HERMES_BRAIN_SERVICE_TOKEN before running embedded high-impact commands.",
                "workflow": workflow_payload,
            },
        )

    payload = {
        "task": task or workflow.reason,
        "project": workflow.project,
        "workflow": workflow.workflow,
        "riskClass": workflow.risk_class,
        "entities": entities or [workflow.adapter_class, workflow.canonical_plan],
        "sourceRefs": [],
        "metadata": {
            **(metadata or {}),
            "source": "embedded-command-preflight",
            "workflowId": workflow.id,
            "canonicalPlan": workflow.canonical_plan,
            "adapterClass": workflow.adapter_class,
            "actor": actor,
            "enforcement": "must-not-proceed-silently",
        },
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{_hermes_brain_base_url()}/api/brain/preflight",
        data=data,
        method="POST",
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {token}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            body = json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(raw)
        except Exception:
            detail = {"error": raw or str(exc)}
        raise HighImpactCommandPreflightError(exc.code, detail)
    except Exception as exc:
        raise HighImpactCommandPreflightError(
            503,
            {
                "error": "embedded_preflight_unavailable",
                "message": f"Embedded command preflight failed: {exc}",
                "workflow": workflow_payload,
            },
        )

    check = body.get("check", {}) if isinstance(body, dict) else {}
    if isinstance(check, dict) and check.get("policy") == "block":
        raise HighImpactCommandPreflightError(
            409,
            {
                "error": "second_brain_preflight_blocked",
                "message": "Hermes Brain blocked this high-impact command because critical memory is stale, contradicted, or missing.",
                "preflight": check,
                "injection": _agent_injection(check),
                "workflow": workflow_payload,
            },
        )

    injection = _agent_injection(check if isinstance(check, dict) else {})
    return {
        "workflow": workflow_payload,
        "check": check,
        "injection": injection,
        "enforcement": {
            "mode": "registered-workflow-preflight",
            "mustStop": injection["mustStop"],
            "mustAcknowledge": injection["mustAcknowledge"],
            "proceedSilentlyAllowed": False,
        },
    }
