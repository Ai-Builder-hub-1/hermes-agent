"""Cross-project integration and credential registry for Hermes OS.

The registry is intentionally metadata-only: it records required credential
names, scope, storage recommendation, consuming projects, and current presence
signals without storing secret values.
"""

from __future__ import annotations

import os
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional


INTEGRATION_REGISTRY_SCHEMA = "hermes-integration-registry-v1"

SECRET_SCOPES = ["global_org", "shared_business_unit", "project_local", "human_owned"]
CREDENTIAL_STATES = ["present", "partial", "missing", "manual", "unknown"]
INTEGRATION_STATES = ["connected", "configured", "planned", "missing", "blocked", "manual", "unknown"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class CredentialRequirement:
    name: str
    required: bool = True
    description: str = ""
    scope: str = "global_org"
    storage: str = "github_org_secret"
    human_owned: bool = False


@dataclass(frozen=True)
class IntegrationRecord:
    integration_id: str
    name: str
    category: str
    scope: str
    used_by: List[str]
    planned_for: List[str] = field(default_factory=list)
    credentials: List[CredentialRequirement] = field(default_factory=list)
    current_state: str = "planned"
    storage_recommendation: str = "github_org_secret"
    notes: str = ""


@dataclass(frozen=True)
class ProjectIntegrationManifest:
    project_id: str
    integrations: List[str]
    planned_integrations: List[str] = field(default_factory=list)
    local_only_credentials: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class CredentialStatus:
    name: str
    state: str
    scope: str
    storage: str
    used_by: List[str]
    required_by: List[str]
    required: bool = True
    human_owned: bool = False


@dataclass(frozen=True)
class IntegrationStatus:
    integration_id: str
    name: str
    category: str
    scope: str
    state: str
    credential_state: str
    used_by: List[str]
    planned_for: List[str]
    missing_credentials: List[str]
    present_credentials: List[str]
    storage_recommendation: str
    notes: str = ""


def default_project_manifests() -> List[ProjectIntegrationManifest]:
    return [
        ProjectIntegrationManifest(
            "hermes",
            integrations=["openai-admin-billing", "google-cloud-billing", "hetzner-production-rail", "discord-operator-gateway", "telegram-operator-gateway", "remote-operator-runtime"],
            planned_integrations=["codex-worker-runtime", "github-actions-secrets"],
        ),
        ProjectIntegrationManifest(
            "tlc-capital-group-os",
            integrations=["hetzner-production-rail", "github-actions-secrets", "tlc-authority-matrix"],
            planned_integrations=["portfolio-readiness-feeds", "codex-worker-runtime"],
        ),
        ProjectIntegrationManifest(
            "media-engine",
            integrations=["meta-platform-access", "openai-runtime", "fireworks-runtime", "media-business-feed"],
            planned_integrations=["youtube-publishing", "snapchat-publishing", "discord-operator-gateway"],
        ),
        ProjectIntegrationManifest(
            "media-business-operations",
            integrations=["openai-admin-billing", "google-cloud-billing", "meta-platform-access", "media-engine-feed"],
            planned_integrations=["provider-cost-feeds", "youtube-analytics"],
        ),
        ProjectIntegrationManifest(
            "khashi-vc",
            integrations=["openai-runtime", "deepseek-runtime", "fireworks-runtime", "experiment-capacity-feed"],
            planned_integrations=["codex-worker-runtime", "research-source-feeds"],
        ),
        ProjectIntegrationManifest(
            "rinseables-os",
            integrations=["hetzner-production-rail", "github-actions-secrets"],
            planned_integrations=["google-search-console", "business-readiness-feed"],
        ),
        ProjectIntegrationManifest(
            "business-mapper",
            integrations=["openai-runtime"],
            planned_integrations=["portfolio-readiness-feeds"],
        ),
    ]


def default_integration_records() -> List[IntegrationRecord]:
    return [
        IntegrationRecord(
            "openai-admin-billing",
            "OpenAI Admin Billing",
            "billing",
            "global_org",
            used_by=["hermes", "media-business-operations", "media-engine", "tlc-capital-group-os"],
            credentials=[
                CredentialRequirement("OPENAI_ADMIN_KEY", description="OpenAI admin key for actual organization usage and cost imports"),
                CredentialRequirement("OPENAI_ORG_ID", description="OpenAI organization id for billing attribution"),
            ],
            current_state="missing",
            storage_recommendation="github_org_secret_or_billing_adapter_environment",
            notes="Runtime API keys are not enough for actual cost imports; admin billing credentials are separate.",
        ),
        IntegrationRecord(
            "google-cloud-billing",
            "Google Cloud And Gemini Billing",
            "billing",
            "global_org",
            used_by=["hermes", "media-business-operations"],
            planned_for=["media-engine", "business-mapper"],
            credentials=[
                CredentialRequirement("GOOGLE_APPLICATION_CREDENTIALS_JSON", description="Service account JSON with billing export read access"),
                CredentialRequirement("GOOGLE_CLOUD_BILLING_ACCOUNT_ID"),
                CredentialRequirement("GOOGLE_CLOUD_BILLING_EXPORT_DATASET"),
                CredentialRequirement("GOOGLE_CLOUD_BILLING_EXPORT_TABLE"),
            ],
            current_state="missing",
            storage_recommendation="github_org_secret_plus_google_billing_export_dataset",
        ),
        IntegrationRecord(
            "hetzner-production-rail",
            "Hetzner Production Rail",
            "deployment",
            "global_org",
            used_by=["hermes", "tlc-capital-group-os", "rinseables-os"],
            planned_for=["media-engine", "media-business-operations", "khashi-vc"],
            credentials=[
                CredentialRequirement("HETZNER_HOST", scope="global_org", storage="github_environment_or_vps_secret_store"),
                CredentialRequirement("HETZNER_USER", scope="global_org", storage="github_environment_or_vps_secret_store"),
                CredentialRequirement("HETZNER_SSH_KEY", scope="global_org", storage="github_environment_or_vps_secret_store"),
                CredentialRequirement("PRODUCTION_DOMAIN", scope="project_local", storage="project_environment"),
            ],
            current_state="configured",
            storage_recommendation="shared_production_environment_with_project_domain_overrides",
        ),
        IntegrationRecord(
            "discord-operator-gateway",
            "Discord Remote Operator Gateway",
            "remote_operator",
            "global_org",
            used_by=["hermes"],
            planned_for=["media-engine", "khashi-vc", "tlc-capital-group-os"],
            credentials=[
                CredentialRequirement("DISCORD_BOT_TOKEN", storage="vps_secret_store"),
                CredentialRequirement("DISCORD_ALLOWED_USER_IDS", storage="vps_secret_store"),
                CredentialRequirement("DISCORD_ALLOWED_CHANNEL_IDS", required=False, storage="vps_secret_store"),
            ],
            current_state="planned",
            storage_recommendation="vps_secret_store",
        ),
        IntegrationRecord(
            "telegram-operator-gateway",
            "Telegram Remote Operator Gateway",
            "remote_operator",
            "global_org",
            used_by=["hermes"],
            planned_for=["media-engine", "khashi-vc", "tlc-capital-group-os"],
            credentials=[
                CredentialRequirement("TELEGRAM_BOT_TOKEN", storage="vps_secret_store"),
                CredentialRequirement("TELEGRAM_ALLOWED_USER_IDS", storage="vps_secret_store"),
                CredentialRequirement("TELEGRAM_ALLOWED_CHAT_IDS", required=False, storage="vps_secret_store"),
            ],
            current_state="planned",
            storage_recommendation="vps_secret_store",
        ),
        IntegrationRecord(
            "remote-operator-runtime",
            "Hermes Remote Operator Runtime",
            "remote_operator",
            "global_org",
            used_by=["hermes"],
            planned_for=["tlc-capital-group-os", "media-engine", "media-business-operations", "khashi-vc", "rinseables-os"],
            credentials=[
                CredentialRequirement("HERMES_OPERATOR_API_URL", storage="vps_secret_store"),
                CredentialRequirement("HERMES_OPERATOR_API_TOKEN", storage="vps_secret_store"),
                CredentialRequirement("HERMES_WORKSPACE_ROOT", storage="vps_secret_store"),
            ],
            current_state="configured",
            storage_recommendation="vps_secret_store_and_hermes_production_config",
            notes="Local dry-run foundation is built; live service runner is not connected.",
        ),
        IntegrationRecord(
            "meta-platform-access",
            "Meta Platform Access",
            "publishing",
            "shared_business_unit",
            used_by=["media-engine", "media-business-operations"],
            credentials=[
                CredentialRequirement("META_ACCESS_TOKEN", scope="shared_business_unit", storage="media_shared_environment"),
                CredentialRequirement("META_APP_ID", required=False, scope="shared_business_unit", storage="media_shared_environment"),
                CredentialRequirement("META_APP_SECRET", required=False, scope="shared_business_unit", storage="media_shared_environment"),
            ],
            current_state="configured",
            storage_recommendation="media_business_shared_environment_or_org_secret",
        ),
        IntegrationRecord(
            "openai-runtime",
            "OpenAI Runtime API",
            "model_runtime",
            "global_org",
            used_by=["hermes", "media-engine", "khashi-vc", "business-mapper"],
            credentials=[CredentialRequirement("OPENAI_API_KEY", description="Runtime API key, not the admin billing key")],
            current_state="configured",
            storage_recommendation="github_org_secret_or_vps_secret_store",
        ),
        IntegrationRecord(
            "deepseek-runtime",
            "DeepSeek Runtime API",
            "model_runtime",
            "global_org",
            used_by=["hermes", "khashi-vc"],
            credentials=[CredentialRequirement("DEEPSEEK_API_KEY")],
            current_state="configured",
            storage_recommendation="github_org_secret_or_vps_secret_store",
        ),
        IntegrationRecord(
            "fireworks-runtime",
            "Fireworks Runtime API",
            "model_runtime",
            "global_org",
            used_by=["hermes", "media-engine", "khashi-vc"],
            credentials=[CredentialRequirement("FIREWORKS_API_KEY")],
            current_state="configured",
            storage_recommendation="github_org_secret_or_vps_secret_store",
        ),
        IntegrationRecord(
            "github-actions-secrets",
            "GitHub Actions Secret Store",
            "deployment",
            "global_org",
            used_by=["hermes", "tlc-capital-group-os", "rinseables-os"],
            planned_for=["media-engine", "media-business-operations", "khashi-vc"],
            credentials=[CredentialRequirement("GITHUB_TOKEN", required=False, storage="local_cli_or_github_app")],
            current_state="configured",
            storage_recommendation="github_org_secrets_and_environment_secrets",
        ),
        IntegrationRecord(
            "tlc-authority-matrix",
            "TLC Authority Matrix",
            "governance",
            "human_owned",
            used_by=["hermes", "tlc-capital-group-os"],
            credentials=[
                CredentialRequirement("production approval owner", human_owned=True, scope="human_owned", storage="tlc_authority_feed"),
                CredentialRequirement("spend approval owner", human_owned=True, scope="human_owned", storage="tlc_authority_feed"),
                CredentialRequirement("destructive action policy", human_owned=True, scope="human_owned", storage="tlc_authority_feed"),
            ],
            current_state="manual",
            storage_recommendation="tlc_capital_group_os_authority_feed",
        ),
        IntegrationRecord(
            "youtube-publishing",
            "YouTube Publishing And Analytics",
            "publishing",
            "shared_business_unit",
            used_by=[],
            planned_for=["media-engine", "media-business-operations"],
            credentials=[
                CredentialRequirement("YOUTUBE_CLIENT_ID", scope="shared_business_unit", storage="media_shared_environment"),
                CredentialRequirement("YOUTUBE_CLIENT_SECRET", scope="shared_business_unit", storage="media_shared_environment"),
                CredentialRequirement("YOUTUBE_REFRESH_TOKEN", scope="shared_business_unit", storage="media_shared_environment"),
            ],
            current_state="planned",
            storage_recommendation="media_business_shared_environment",
        ),
        IntegrationRecord(
            "google-search-console",
            "Google Search Console",
            "analytics",
            "project_local",
            used_by=[],
            planned_for=["rinseables-os"],
            credentials=[CredentialRequirement("GOOGLE_SEARCH_CONSOLE_SITE_URL", scope="project_local", storage="project_environment")],
            current_state="planned",
            storage_recommendation="rinseables_project_environment",
        ),
    ]


def credential_presence(requirement: CredentialRequirement, env: Optional[Mapping[str, str]] = None) -> str:
    if requirement.human_owned:
        return "manual"
    source = os.environ if env is None else env
    value = str(source.get(requirement.name, "")).strip()
    return "present" if value else "missing"


def credential_state(records: Iterable[CredentialRequirement], env: Optional[Mapping[str, str]] = None) -> str:
    requirements = list(records)
    required = [item for item in requirements if item.required and not item.human_owned]
    manual = [item for item in requirements if item.human_owned]
    if manual and not required:
        return "manual"
    if not required:
        return "unknown"
    states = [credential_presence(item, env) for item in required]
    if all(state == "present" for state in states):
        return "present"
    if any(state == "present" for state in states):
        return "partial"
    return "missing"


def integration_status(record: IntegrationRecord, env: Optional[Mapping[str, str]] = None) -> IntegrationStatus:
    cred_state = credential_state(record.credentials, env)
    missing = [
        credential.name
        for credential in record.credentials
        if credential.required and credential_presence(credential, env) == "missing"
    ]
    present = [
        credential.name
        for credential in record.credentials
        if credential_presence(credential, env) == "present"
    ]
    if record.current_state == "manual":
        state = "manual"
    elif missing and record.current_state in {"connected", "configured"}:
        state = "missing"
    else:
        state = record.current_state
    return IntegrationStatus(
        integration_id=record.integration_id,
        name=record.name,
        category=record.category,
        scope=record.scope,
        state=state,
        credential_state=cred_state,
        used_by=list(record.used_by),
        planned_for=list(record.planned_for),
        missing_credentials=missing,
        present_credentials=present,
        storage_recommendation=record.storage_recommendation,
        notes=record.notes,
    )


def credential_matrix(records: Iterable[IntegrationRecord], env: Optional[Mapping[str, str]] = None) -> List[CredentialStatus]:
    by_name: Dict[str, Dict[str, Any]] = {}
    for record in records:
        for requirement in record.credentials:
            row = by_name.setdefault(
                requirement.name,
                {
                    "requirement": requirement,
                    "used_by": set(),
                    "required_by": set(),
                },
            )
            row["used_by"].update(record.used_by)
            if requirement.required:
                row["required_by"].add(record.integration_id)
    matrix = []
    for name, row in sorted(by_name.items()):
        requirement = row["requirement"]
        matrix.append(
            CredentialStatus(
                name=name,
                state=credential_presence(requirement, env),
                scope=requirement.scope,
                storage=requirement.storage,
                used_by=sorted(row["used_by"]),
                required_by=sorted(row["required_by"]),
                required=requirement.required,
                human_owned=requirement.human_owned,
            )
        )
    return matrix


def project_integration_matrix(
    manifests: Optional[Iterable[ProjectIntegrationManifest]] = None,
    records: Optional[Iterable[IntegrationRecord]] = None,
    env: Optional[Mapping[str, str]] = None,
) -> List[Dict[str, Any]]:
    manifest_list = list(manifests or default_project_manifests())
    status_by_id = {status.integration_id: status for status in [integration_status(record, env) for record in (records or default_integration_records())]}
    rows = []
    for manifest in manifest_list:
        integrations = []
        for integration_id in manifest.integrations:
            status = status_by_id.get(integration_id)
            integrations.append(asdict(status) if status else {"integration_id": integration_id, "state": "unknown"})
        planned = []
        for integration_id in manifest.planned_integrations:
            status = status_by_id.get(integration_id)
            planned.append(asdict(status) if status else {"integration_id": integration_id, "state": "unknown"})
        rows.append(
            {
                "project_id": manifest.project_id,
                "integrations": integrations,
                "planned_integrations": planned,
                "local_only_credentials": list(manifest.local_only_credentials),
                "missing_credentials": sorted({credential for item in integrations + planned for credential in item.get("missing_credentials", [])}),
            }
        )
    return rows


def integration_registry_summary(
    records: Optional[Iterable[IntegrationRecord]] = None,
    manifests: Optional[Iterable[ProjectIntegrationManifest]] = None,
    env: Optional[Mapping[str, str]] = None,
) -> Dict[str, Any]:
    record_list = list(records or default_integration_records())
    manifest_list = list(manifests or default_project_manifests())
    statuses = [integration_status(record, env) for record in record_list]
    credentials = credential_matrix(record_list, env)
    missing_credentials = [credential for credential in credentials if credential.required and credential.state == "missing" and not credential.human_owned]
    global_candidates = [
        credential
        for credential in credentials
        if credential.required and credential.scope == "global_org" and len(credential.used_by) > 1
    ]
    return {
        "schema": INTEGRATION_REGISTRY_SCHEMA,
        "generated_at": _now(),
        "project_count": len(manifest_list),
        "integration_count": len(statuses),
        "credential_count": len(credentials),
        "missing_credential_count": len(missing_credentials),
        "global_candidate_count": len(global_candidates),
        "status_counts": _count_by([status.state for status in statuses]),
        "credential_state_counts": _count_by([credential.state for credential in credentials]),
        "integrations": [asdict(status) for status in statuses],
        "credentials": [asdict(credential) for credential in credentials],
        "projects": project_integration_matrix(manifest_list, record_list, env),
        "global_secret_candidates": [asdict(credential) for credential in global_candidates],
        "human_setup_items": [
            asdict(credential)
            for credential in credentials
            if credential.human_owned or (credential.required and credential.state == "missing")
        ],
    }


def simple_credential_lists(summary: Optional[Mapping[str, Any]] = None) -> Dict[str, Any]:
    payload = dict(summary or integration_registry_summary())
    credentials = list(payload.get("credentials", []))
    needed = [
        credential
        for credential in credentials
        if credential.get("required", True)
        and not credential.get("human_owned", False)
        and credential.get("state") == "missing"
    ]
    present = [
        credential
        for credential in credentials
        if credential.get("required", True)
        and not credential.get("human_owned", False)
        and credential.get("state") == "present"
    ]
    manual = [
        credential
        for credential in credentials
        if credential.get("human_owned", False)
    ]
    return {
        "schema": payload.get("schema", INTEGRATION_REGISTRY_SCHEMA),
        "needed_count": len(needed),
        "present_count": len(present),
        "manual_count": len(manual),
        "needed": sorted(needed, key=lambda item: str(item.get("name", ""))),
        "present": sorted(present, key=lambda item: str(item.get("name", ""))),
        "manual": sorted(manual, key=lambda item: str(item.get("name", ""))),
    }


def format_simple_credentials(credentials: Iterable[Mapping[str, Any]], *, title: str) -> str:
    rows = list(credentials)
    lines = [title, "=" * len(title)]
    if not rows:
        lines.append("None")
        return "\n".join(lines)
    for item in rows:
        used_by = ", ".join(item.get("used_by", [])) or "unassigned"
        required_by = ", ".join(item.get("required_by", [])) or "optional/registry"
        lines.append(
            f"- {item.get('name')} | scope: {item.get('scope')} | store: {item.get('storage')} | used by: {used_by} | required by: {required_by}"
        )
    return "\n".join(lines)


def _count_by(values: Iterable[str]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return counts


def integration_dashboard_panels(summary: Optional[Mapping[str, Any]] = None) -> List[Dict[str, Any]]:
    payload = dict(summary or integration_registry_summary())
    missing = payload.get("human_setup_items", [])
    return [
        {
            "panel_id": "integration-registry-summary",
            "title": "Integration Registry",
            "data": {
                "project_count": payload.get("project_count", 0),
                "integration_count": payload.get("integration_count", 0),
                "credential_count": payload.get("credential_count", 0),
                "missing_credential_count": payload.get("missing_credential_count", 0),
                "global_candidate_count": payload.get("global_candidate_count", 0),
                "status_counts": payload.get("status_counts", {}),
            },
        },
        {
            "panel_id": "integration-missing-credentials",
            "title": "Missing Credentials",
            "data": {
                "count": len(missing),
                "items": missing,
            },
        },
        {
            "panel_id": "integration-project-matrix",
            "title": "Project Integration Matrix",
            "data": {
                "projects": payload.get("projects", []),
            },
        },
    ]


def load_integration_records(path: str | Path) -> List[IntegrationRecord]:
    import json

    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    records = payload.get("integrations", payload if isinstance(payload, list) else [])
    result = []
    for item in records:
        credentials = [CredentialRequirement(**credential) for credential in item.get("credentials", [])]
        result.append(IntegrationRecord(**{**item, "credentials": credentials}))
    return result


def integration_registry_completion_evidence(project_root: str | Path = ".") -> Dict[str, Any]:
    return {
        "phase": 79,
        "tasks": [f"task-{number:03d}" for number in range(516, 526)],
        "evidence": [
            "hermes_os_integration/integration_registry.py",
            "hermes_cli/main.py",
            "hermes_os_integration/dashboard.py",
            "tests/hermes_os_integration/test_phase_79_integration_registry.py",
        ],
        "local_registry_complete": True,
        "live_secret_verification_complete": False,
        "project_root": str(Path(project_root).resolve()),
    }
