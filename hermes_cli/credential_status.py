"""Redacted fleet credential status for Head Trader and fleet dashboards.

This module intentionally never returns credential values. It reports only
whether required server-side variables are present, where that proof came from,
and when it was last verified.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


CONTRACT_VERSION = "fleet-credential-status.v1"
DEFAULT_STALE_HOURS = 24

REQUIRED_CREDENTIALS: list[dict[str, Any]] = [
    {
        "credentialId": "binance.trading-api",
        "label": "Binance Trading API",
        "provider": "binance",
        "variables": ["BINANCE_API_KEY", "BINANCE_SECRET_KEY"],
        "scope": "server-side-only",
        "secretExposurePolicy": "never_return_values",
        "consumers": [
            {
                "projectId": "investing-system",
                "label": "Investing System",
                "serviceIds": ["investing-system", "oanda-practice-runtime"],
                "productionContainers": ["deploy-investing-system-1", "deploy-oanda-practice-runtime-1"],
                "expectedSource": "hetzner:/root/apps/investing-system/.env",
            },
            {
                "projectId": "khashi-vc",
                "label": "Khashi VC",
                "serviceIds": [
                    "khashi",
                    "khashi-scheduler",
                    "khashi-sync-worker",
                    "khashi-poll-worker",
                    "khashi-stream-worker",
                    "khashi-maintenance-worker",
                ],
                "productionContainers": [
                    "deploy-khashi-1",
                    "deploy-khashi-scheduler-1",
                    "deploy-khashi-sync-worker-1",
                    "deploy-khashi-poll-worker-1",
                    "deploy-khashi-stream-worker-1",
                    "deploy-khashi-maintenance-worker-1",
                ],
                "expectedSource": "hetzner:/root/apps/khashi-vc/.env",
            },
        ],
    }
]


def credential_status() -> dict[str, Any]:
    """Return redacted runtime + latest production proof status."""

    proof = _read_latest_proof()
    projects = _project_statuses(proof)
    blockers = [
        blocker
        for project in projects
        for blocker in project.get("blockers", [])
    ]
    stale_projects = [project["projectId"] for project in projects if project.get("proofFreshness") == "stale"]
    status = "ready"
    if any(project.get("status") == "missing" for project in projects):
        status = "blocked"
    elif any(project.get("status") in {"unknown", "partial"} for project in projects):
        status = "watch"
    elif stale_projects:
        status = "watch"

    return {
        "id": "fleet-credential-status",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "status": status,
        "secretExposurePolicy": "values_never_returned",
        "credentials": REQUIRED_CREDENTIALS,
        "runtime": {
            "source": "nous-hermes-agent-process-env",
            "variables": [_runtime_variable_status(name) for name in _all_required_variables()],
        },
        "productionProof": _public_proof_summary(proof),
        "projects": projects,
        "blockers": blockers,
        "recommendations": _recommendations(status, stale_projects, blockers),
    }


def credential_frontend_spec() -> dict[str, Any]:
    return {
        "id": "fleet-credential-status-frontend-spec",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "basePath": "/api/head-trader/credential-status",
        "purpose": (
            "Show whether server-side trading credentials are configured for "
            "Investing System and Khashi VC without exposing secret values."
        ),
        "endpoints": [
            "GET /api/head-trader/credential-status",
            "GET /api/head-trader/credential-status/frontend-spec",
        ],
        "pageSections": [
            "credential readiness KPI",
            "project access matrix",
            "last production proof timestamp",
            "runtime variable status",
            "blockers and recommendations",
        ],
        "securityRules": [
            "Never render credential values.",
            "Never send credentials to browser code.",
            "Display configured/missing, source, lastVerifiedAt, and optional valueLength only.",
            "Use backend status before asking the operator for a key.",
        ],
        "primaryTypes": {
            "CredentialVariableStatus": {
                "name": "string",
                "configured": "boolean",
                "valueLength": "number",
                "source": "runtime_env | production_container | project_env | template",
            },
            "ProjectCredentialStatus": {
                "projectId": "string",
                "status": "ready | partial | missing | unknown",
                "proofFreshness": "fresh | stale | missing",
                "credentials": "CredentialConsumerStatus[]",
                "blockers": "string[]",
            },
        },
    }


def _project_statuses(proof: dict[str, Any] | None) -> list[dict[str, Any]]:
    projects: list[dict[str, Any]] = []
    proof_projects = {
        item.get("projectId"): item
        for item in (proof or {}).get("projects", [])
        if isinstance(item, dict)
    }
    for contract in REQUIRED_CREDENTIALS:
        for consumer in contract["consumers"]:
            proof_project = proof_projects.get(consumer["projectId"])
            variables = _variables_from_proof(proof_project, contract["variables"])
            missing = [item["name"] for item in variables if not item["configured"]]
            freshness = _proof_freshness((proof or {}).get("generatedAt") if proof_project else None)
            if not proof_project:
                status = "unknown"
            elif missing:
                status = "partial" if len(missing) < len(variables) else "missing"
            else:
                status = "ready"
            projects.append({
                "projectId": consumer["projectId"],
                "label": consumer["label"],
                "credentialId": contract["credentialId"],
                "status": status,
                "proofFreshness": freshness,
                "lastVerifiedAt": (proof or {}).get("generatedAt") if proof_project else None,
                "serviceIds": consumer["serviceIds"],
                "productionContainers": consumer["productionContainers"],
                "expectedSource": consumer["expectedSource"],
                "variables": variables,
                "blockers": [f"{consumer['projectId']} missing {name}" for name in missing],
            })
    return projects


def _variables_from_proof(proof_project: dict[str, Any] | None, names: list[str]) -> list[dict[str, Any]]:
    if not proof_project:
        return [
            {"name": name, "configured": False, "valueLength": 0, "source": "production_proof_missing"}
            for name in names
        ]
    variable_map = {
        item.get("name"): item
        for item in proof_project.get("variables", [])
        if isinstance(item, dict)
    }
    return [
        {
            "name": name,
            "configured": bool(variable_map.get(name, {}).get("configured")),
            "valueLength": int(variable_map.get(name, {}).get("valueLength") or 0),
            "source": variable_map.get(name, {}).get("source") or "production_container",
        }
        for name in names
    ]


def _runtime_variable_status(name: str) -> dict[str, Any]:
    value = os.environ.get(name) or ""
    return {
        "name": name,
        "configured": bool(value),
        "valueLength": len(value),
        "source": "runtime_env",
    }


def _read_latest_proof() -> dict[str, Any] | None:
    path = _proof_path()
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _public_proof_summary(proof: dict[str, Any] | None) -> dict[str, Any]:
    if not proof:
        return {
            "available": False,
            "source": str(_proof_path()),
            "generatedAt": None,
            "freshness": "missing",
        }
    return {
        "available": True,
        "source": str(_proof_path()),
        "generatedAt": proof.get("generatedAt"),
        "freshness": _proof_freshness(proof.get("generatedAt")),
        "mode": proof.get("mode"),
        "host": proof.get("host"),
    }


def _proof_freshness(generated_at: Any) -> str:
    if not generated_at:
        return "missing"
    try:
        generated = datetime.fromisoformat(str(generated_at).replace("Z", "+00:00"))
    except ValueError:
        return "stale"
    age_seconds = (datetime.now(timezone.utc) - generated).total_seconds()
    return "fresh" if age_seconds <= DEFAULT_STALE_HOURS * 60 * 60 else "stale"


def _recommendations(status: str, stale_projects: list[str], blockers: list[str]) -> list[str]:
    if status == "ready":
        return ["Credential proof is current and required projects report server-side Binance access."]
    recommendations = []
    if stale_projects:
        recommendations.append("Refresh production credential proof from Nous Hermes before relying on phone/chat status.")
    if blockers:
        recommendations.append("Update server-side env files and restart only affected services; do not paste secrets into chat.")
    if not recommendations:
        recommendations.append("Run fleet credential proof generation to establish current production status.")
    return recommendations


def _proof_path() -> Path:
    return Path(__file__).resolve().parents[1] / "docs" / "fleet" / "fleet-credential-status.json"


def _all_required_variables() -> list[str]:
    names: list[str] = []
    for credential in REQUIRED_CREDENTIALS:
        for name in credential["variables"]:
            if name not in names:
                names.append(name)
    return names


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
