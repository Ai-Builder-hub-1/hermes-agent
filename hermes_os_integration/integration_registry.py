"""Cross-project integration and credential registry for Hermes OS.

The registry is intentionally metadata-only: it records required credential
names, scope, storage recommendation, consuming projects, and current presence
signals without storing secret values.
"""

from __future__ import annotations

import os
import re
import subprocess
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional


INTEGRATION_REGISTRY_SCHEMA = "hermes-integration-registry-v1"

SECRET_SCOPES = ["global_org", "shared_business_unit", "project_local", "human_owned"]
CREDENTIAL_STATES = [
    "present",
    "present_project_local",
    "present_project_secret",
    "needs_promotion_to_global",
    "needs_mapping",
    "needs_verification",
    "partial",
    "missing",
    "manual",
    "unknown",
]
INTEGRATION_STATES = ["connected", "configured", "planned", "missing", "blocked", "manual", "unknown"]
GLOBAL_EVIDENCE_SOURCES = {"hermes_global_config", "hermes_global_env"}
PRESENCE_EVIDENCE_SOURCES = {"project_env", "github_repo_secret", "github_repo_variable", *GLOBAL_EVIDENCE_SOURCES}
REFERENCE_ONLY_SOURCES = {"github_workflow_reference", "github_workflow_variable_reference"}

CREDENTIAL_ALIASES: Dict[str, List[str]] = {
    "DISCORD_ALLOWED_USER_IDS": ["DISCORD_ALLOWED_USERS", "GATEWAY_ALLOWED_USERS"],
    "DISCORD_BOT_TOKEN": ["DISCORD_TOKEN"],
    "FIREWORKS_API_KEY": ["FIREFALL_API_KEY", "FIREWORKS_KEY"],
    "HETZNER_HOST": [
        "DEPLOY_HOST",
        "HERMES_PRODUCTION_SSH_HOST",
        "HOSTINGER_HOST",
        "HOSTNER_HOST",
        "PRODUCTION_HOST",
        "SERVER_HOST",
        "VPS_HOST",
    ],
    "HETZNER_SSH_KEY": [
        "DEPLOY_KEY",
        "DEPLOY_SSH_KEY",
        "HERMES_PRODUCTION_SSH_KEY",
        "HETZNER_SSH_KEY_PATH",
        "HOSTINGER_SSH_KEY",
        "HOSTNER_SSH_KEY",
        "PRODUCTION_SSH_KEY",
        "SSH_PRIVATE_KEY",
    ],
    "HETZNER_USER": [
        "DEPLOY_USER",
        "HERMES_PRODUCTION_SSH_USER",
        "HOSTINGER_USER",
        "HOSTNER_USER",
        "PRODUCTION_USER",
        "SERVER_USER",
        "VPS_USER",
    ],
    "OPENAI_ADMIN_KEY": ["OPENAI_BILLING_ADMIN_KEY", "OPENAI_USAGE_ADMIN_KEY"],
    "PRODUCTION_DOMAIN": [
        "HERMES_PRODUCTION_BASE_DOMAIN",
        "HERMES_PRODUCTION_DOMAIN",
        "PRODUCTION_BASE_DOMAIN",
        "PRODUCTION_URL",
    ],
    "TELEGRAM_ALLOWED_USER_IDS": ["TELEGRAM_ALLOWED_USERS", "GATEWAY_ALLOWED_USERS"],
}


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
    project_locations: List[str] = field(default_factory=list)
    alias_locations: List[str] = field(default_factory=list)
    evidence_sources: List[str] = field(default_factory=list)
    aliases: List[str] = field(default_factory=list)


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


@dataclass(frozen=True)
class ProjectCredentialLocation:
    project_id: str
    path: str
    source: str = "project_env"
    credential_name: str = ""


def default_project_repositories() -> Dict[str, str]:
    return {
        "hermes": "Ai-Builder-hub-1/hermes",
        "tlc-capital-group-os": "Ai-Builder-hub-1/tlc-capital-group-os",
        "media-engine": "Ai-Builder-hub-1/media-engine",
        "media-business-operations": "Ai-Builder-hub-1/media-business-operations",
        "khashi-vc": "Ai-Builder-hub-1/khashi-vc",
        "rinseables-os": "Ai-Builder-hub-1/rinseables-os",
        "business-mapper": "Ai-Builder-hub-1/business-mapper",
        "investing-system": "Ai-Builder-hub-1/investing-system",
    }


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


def default_project_paths(workspace_root: str | Path = "/Users/hq/Workspace/projects") -> Dict[str, str]:
    root = Path(workspace_root)
    return {
        "hermes": str(root / "nous-hermes-agent"),
        "tlc-capital-group-os": str(root / "tlc-capital-group-os"),
        "media-engine": str(root / "media-engine"),
        "media-business-operations": str(root / "media-business-operations"),
        "khashi-vc": str(root / "khashi-vc"),
        "rinseables-os": str(root / "rinseables-os"),
        "business-mapper": str(root / "business-mapper"),
        "investing-system": str(root / "investing-system"),
    }


def default_project_alternate_paths(workspace_root: str | Path = "/Users/hq/Workspace/projects") -> Dict[str, List[str]]:
    root = Path(workspace_root)
    return {
        "hermes": [str(root / "hermes")],
    }


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
            "Google Cloud And Gemini Billing Export",
            "billing",
            "global_org",
            used_by=["hermes", "media-business-operations"],
            planned_for=["media-engine", "business-mapper"],
            credentials=[
                CredentialRequirement("GOOGLE_APPLICATION_CREDENTIALS_JSON", required=False, description="Deferred service account JSON for live billing export read access"),
                CredentialRequirement("GOOGLE_CLOUD_BILLING_ACCOUNT_ID", required=False),
                CredentialRequirement("GOOGLE_CLOUD_BILLING_EXPORT_DATASET", required=False),
                CredentialRequirement("GOOGLE_CLOUD_BILLING_EXPORT_TABLE", required=False),
            ],
            current_state="planned",
            storage_recommendation="github_org_secret_plus_google_billing_export_dataset",
            notes="Deferred by operating choice: Gemini can remain usage-estimated/manual until live Google billing export is worth the credential work.",
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
                CredentialRequirement("HETZNER_SSH_KEY", scope="global_org", storage="github_environment_or_vps_secret_store_or_local_key_path"),
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
                CredentialRequirement("HERMES_OPERATOR_API_URL", required=False, storage="vps_secret_store", description="Generated when the live Hermes operator service is deployed"),
                CredentialRequirement("HERMES_OPERATOR_API_TOKEN", required=False, storage="vps_secret_store", description="Generated by Hermes for the live operator service"),
                CredentialRequirement("HERMES_WORKSPACE_ROOT", required=False, storage="vps_secret_store", description="Configured by Hermes deployment from the production workspace map"),
            ],
            current_state="configured",
            storage_recommendation="vps_secret_store_and_hermes_production_config",
            notes="Internal Hermes-owned values, not vendor credentials. Local dry-run foundation is built; live service runner is not connected.",
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
            credentials=[CredentialRequirement("FIREWORKS_API_KEY", required=False, description="Optional model fallback key; only required if Fireworks is selected as an active runtime")],
            current_state="planned",
            storage_recommendation="github_org_secret_or_vps_secret_store",
            notes="Optional fallback provider. Keep deferred unless Hermes routing actually selects Fireworks.",
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
            "YouTube Publishing API",
            "publishing",
            "shared_business_unit",
            used_by=[],
            planned_for=["media-engine", "media-business-operations"],
            credentials=[
                CredentialRequirement("YOUTUBE_CLIENT_ID", required=False, scope="shared_business_unit", storage="media_shared_environment"),
                CredentialRequirement("YOUTUBE_CLIENT_SECRET", required=False, scope="shared_business_unit", storage="media_shared_environment"),
                CredentialRequirement("YOUTUBE_REFRESH_TOKEN", required=False, scope="shared_business_unit", storage="media_shared_environment"),
            ],
            current_state="manual",
            storage_recommendation="media_business_shared_environment",
            notes="Deferred by operating choice: video/post packages are prepared for human upload instead of direct API publishing.",
        ),
        IntegrationRecord(
            "google-search-console",
            "Google Search Console Manual Import",
            "analytics",
            "project_local",
            used_by=["media-business-operations"],
            planned_for=["rinseables-os", "media-engine"],
            credentials=[
                CredentialRequirement("GOOGLE_SEARCH_CONSOLE_SITE_URL", required=False, scope="project_local", storage="project_environment_or_global_config"),
                CredentialRequirement("GOOGLE_SEARCH_CONSOLE_IMPORT_DIR", required=False, scope="project_local", storage="project_environment_or_global_config"),
            ],
            current_state="manual",
            storage_recommendation="manual_export_drop_folder_plus_project_site_url",
            notes="Manual Search Console exports are the first-class path. Live API OAuth/service-account access is deferred.",
        ),
    ]


def credential_presence(requirement: CredentialRequirement, env: Optional[Mapping[str, str]] = None) -> str:
    if requirement.human_owned:
        return "manual"
    source = os.environ if env is None else env
    value = str(source.get(requirement.name, "")).strip()
    return "present" if value else "missing"


def parse_env_file_presence(path: str | Path) -> Dict[str, bool]:
    target = Path(path)
    if not target.exists() or not target.is_file():
        return {}
    presence: Dict[str, bool] = {}
    for raw in target.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip().removeprefix("export ").strip()
        if not key:
            continue
        value = value.strip().strip("\"'")
        presence[key] = bool(value)
    return presence


def parse_simple_yaml_presence(path: str | Path) -> Dict[str, bool]:
    target = Path(path).expanduser()
    if not target.exists() or not target.is_file():
        return {}
    presence: Dict[str, bool] = {}
    pattern = re.compile(r"^\s*['\"]?([A-Za-z0-9_.-]+)['\"]?\s*:\s*(.*?)\s*(?:#.*)?$")
    for raw in target.read_text(encoding="utf-8", errors="ignore").splitlines():
        match = pattern.match(raw)
        if not match:
            continue
        key, value = match.groups()
        normalized_key = key.strip().replace(".", "_").replace("-", "_").upper()
        value = value.strip().strip("\"'")
        if not normalized_key or value in {"", "{}", "[]", "null", "Null", "NULL", "~"}:
            continue
        presence[normalized_key] = True
    return presence


def scan_hermes_global_config_credentials(config_path: str | Path | None = None) -> Dict[str, List[ProjectCredentialLocation]]:
    target = Path(config_path).expanduser() if config_path else Path(os.environ.get("HERMES_HOME", Path.home() / ".hermes")) / "config.yaml"
    found: Dict[str, List[ProjectCredentialLocation]] = {}
    for key, present in parse_simple_yaml_presence(target).items():
        if not present:
            continue
        found.setdefault(key, []).append(
            ProjectCredentialLocation(
                project_id="hermes-global",
                path=str(target),
                source="hermes_global_config",
                credential_name=key,
            )
        )
    return found


def scan_hermes_global_env_credentials(env_path: str | Path | None = None) -> Dict[str, List[ProjectCredentialLocation]]:
    target = Path(env_path).expanduser() if env_path else Path(os.environ.get("HERMES_HOME", Path.home() / ".hermes")) / ".env"
    found: Dict[str, List[ProjectCredentialLocation]] = {}
    for key, present in parse_env_file_presence(target).items():
        if not present:
            continue
        found.setdefault(key, []).append(
            ProjectCredentialLocation(
                project_id="hermes-global",
                path=str(target),
                source="hermes_global_env",
                credential_name=key,
            )
        )
    return found


def scan_project_env_credentials(project_paths: Optional[Mapping[str, str]] = None) -> Dict[str, List[ProjectCredentialLocation]]:
    paths = dict(project_paths or default_project_paths())
    alternate_paths = {} if project_paths is not None else default_project_alternate_paths()
    found: Dict[str, List[ProjectCredentialLocation]] = {}
    for project_id, project_path in paths.items():
        roots = [Path(project_path).expanduser(), *[Path(path).expanduser() for path in alternate_paths.get(project_id, [])]]
        for root in roots:
            candidates = [root / ".env", root / ".env.local", root / ".env.production"]
            for candidate in candidates:
                for key, present in parse_env_file_presence(candidate).items():
                    if not present:
                        continue
                    found.setdefault(key, []).append(ProjectCredentialLocation(project_id=project_id, path=str(candidate), credential_name=key))
    return found


def scan_project_workflow_credential_references(project_paths: Optional[Mapping[str, str]] = None) -> Dict[str, List[ProjectCredentialLocation]]:
    paths = dict(project_paths or default_project_paths())
    alternate_paths = {} if project_paths is not None else default_project_alternate_paths()
    found: Dict[str, List[ProjectCredentialLocation]] = {}
    pattern = re.compile(r"\b(secrets|vars)\.([A-Z0-9_]+)")
    for project_id, project_path in paths.items():
        roots = [Path(project_path).expanduser(), *[Path(path).expanduser() for path in alternate_paths.get(project_id, [])]]
        for root in roots:
            workflow_dir = root / ".github" / "workflows"
            if not workflow_dir.exists():
                continue
            for candidate in workflow_dir.iterdir():
                if not candidate.is_file() or candidate.suffix.lower() not in {".yml", ".yaml"}:
                    continue
                text = candidate.read_text(encoding="utf-8", errors="ignore")
                for source_kind, key in sorted(set(pattern.findall(text))):
                    source = "github_workflow_reference" if source_kind == "secrets" else "github_workflow_variable_reference"
                    found.setdefault(key, []).append(
                        ProjectCredentialLocation(project_id=project_id, path=str(candidate), source=source, credential_name=key)
                    )
    return found


def _project_repo_secret_names(repo: str, kind: str) -> List[str]:
    command = ["gh", "secret", "list", "-R", repo] if kind == "secret" else ["gh", "variable", "list", "-R", repo]
    try:
        completed = subprocess.run(command, check=False, capture_output=True, text=True, timeout=6)
    except (FileNotFoundError, subprocess.SubprocessError):
        return []
    if completed.returncode != 0:
        return []
    names = []
    for line in completed.stdout.splitlines():
        name = line.split("\t", 1)[0].strip()
        if name:
            names.append(name)
    return sorted(set(names))


def scan_github_repo_credentials(project_repositories: Optional[Mapping[str, str]] = None) -> Dict[str, List[ProjectCredentialLocation]]:
    repositories = dict(project_repositories or default_project_repositories())
    found: Dict[str, List[ProjectCredentialLocation]] = {}
    for project_id, repo in repositories.items():
        for key in _project_repo_secret_names(repo, "secret"):
            found.setdefault(key, []).append(
                ProjectCredentialLocation(
                    project_id=project_id,
                    path=f"github:{repo}:secrets/{key}",
                    source="github_repo_secret",
                    credential_name=key,
                )
            )
        for key in _project_repo_secret_names(repo, "variable"):
            found.setdefault(key, []).append(
                ProjectCredentialLocation(
                    project_id=project_id,
                    path=f"github:{repo}:variables/{key}",
                    source="github_repo_variable",
                    credential_name=key,
                )
            )
    return found


def merge_project_credential_presence(*sources: Mapping[str, List[ProjectCredentialLocation]]) -> Dict[str, List[ProjectCredentialLocation]]:
    merged: Dict[str, List[ProjectCredentialLocation]] = {}
    seen = set()
    for source in sources:
        for key, locations in source.items():
            for location in locations:
                identity = (key, location.project_id, location.path, location.source, location.credential_name)
                if identity in seen:
                    continue
                seen.add(identity)
                merged.setdefault(key, []).append(location)
    return merged


def scan_project_credential_sources(
    project_paths: Optional[Mapping[str, str]] = None,
    *,
    include_workflow_references: bool = True,
    include_hermes_global_config: bool = True,
    hermes_config_path: str | Path | None = None,
    hermes_env_path: str | Path | None = None,
    include_github_repo_credentials: bool = False,
    project_repositories: Optional[Mapping[str, str]] = None,
) -> Dict[str, List[ProjectCredentialLocation]]:
    sources = [scan_project_env_credentials(project_paths)]
    if include_hermes_global_config:
        sources.append(scan_hermes_global_config_credentials(hermes_config_path))
        sources.append(scan_hermes_global_env_credentials(hermes_env_path))
    if include_workflow_references:
        sources.append(scan_project_workflow_credential_references(project_paths))
    if include_github_repo_credentials:
        sources.append(scan_github_repo_credentials(project_repositories))
    return merge_project_credential_presence(*sources)


def _location_project_ids(locations: Optional[Iterable[ProjectCredentialLocation]]) -> List[str]:
    return sorted({location.project_id for location in (locations or [])})


def _location_sources(locations: Optional[Iterable[ProjectCredentialLocation]]) -> List[str]:
    return sorted({location.source for location in (locations or [])})


def _presence_locations(locations: Iterable[ProjectCredentialLocation]) -> List[ProjectCredentialLocation]:
    return [location for location in locations if location.source in PRESENCE_EVIDENCE_SOURCES]


def credential_aliases(name: str) -> List[str]:
    return list(CREDENTIAL_ALIASES.get(name, []))


def credential_presence_state(
    requirement: CredentialRequirement,
    *,
    env: Optional[Mapping[str, str]] = None,
    project_locations: Optional[Iterable[ProjectCredentialLocation]] = None,
    alias_locations: Optional[Iterable[ProjectCredentialLocation]] = None,
) -> str:
    direct = credential_presence(requirement, env)
    if direct == "present" or direct == "manual":
        return direct
    locations = _presence_locations(project_locations or [])
    aliases = _presence_locations(alias_locations or [])
    reference_locations = [
        location for location in list(project_locations or []) + list(alias_locations or []) if location.source in REFERENCE_ONLY_SOURCES
    ]
    if not locations and not aliases:
        return "needs_verification" if reference_locations else "missing"
    if not locations and aliases:
        if requirement.scope == "project_local":
            if any(location.source in {"github_repo_secret", "github_repo_variable"} for location in aliases):
                return "present_project_secret"
            return "present_project_local"
        return "needs_mapping"
    if any(location.source in GLOBAL_EVIDENCE_SOURCES for location in locations):
        return "present"
    if any(location.source in {"github_repo_secret", "github_repo_variable"} for location in locations):
        return "present_project_secret"
    if requirement.scope == "global_org":
        return "needs_promotion_to_global"
    return "present_project_local"


def credential_state(
    records: Iterable[CredentialRequirement],
    env: Optional[Mapping[str, str]] = None,
    project_presence: Optional[Mapping[str, List[ProjectCredentialLocation]]] = None,
) -> str:
    requirements = list(records)
    required = [item for item in requirements if item.required and not item.human_owned]
    manual = [item for item in requirements if item.human_owned]
    if manual and not required:
        return "manual"
    if not required:
        return "unknown"
    states = []
    for item in required:
        alias_locations = [
            location
            for alias in credential_aliases(item.name)
            for location in (project_presence or {}).get(alias, [])
        ]
        states.append(
            credential_presence_state(
                item,
                env=env,
                project_locations=(project_presence or {}).get(item.name, []),
                alias_locations=alias_locations,
            )
        )
    if all(state == "present" for state in states):
        return "present"
    configured_states = {
        "present",
        "present_project_local",
        "present_project_secret",
        "needs_promotion_to_global",
        "needs_mapping",
        "needs_verification",
    }
    if all(state in configured_states for state in states):
        if any(state == "needs_verification" for state in states):
            return "needs_verification"
        if any(state == "needs_mapping" for state in states):
            return "needs_mapping"
        if any(state == "needs_promotion_to_global" for state in states):
            return "needs_promotion_to_global"
        if any(state == "present_project_secret" for state in states):
            return "present_project_secret"
        return "present_project_local"
    if any(state == "present" for state in states):
        return "partial"
    if any(state in configured_states for state in states):
        return "partial"
    return "missing"


def integration_status(
    record: IntegrationRecord,
    env: Optional[Mapping[str, str]] = None,
    project_presence: Optional[Mapping[str, List[ProjectCredentialLocation]]] = None,
) -> IntegrationStatus:
    cred_state = credential_state(record.credentials, env, project_presence)
    missing = []
    present = []
    for credential in record.credentials:
        alias_locations = [
            location
            for alias in credential_aliases(credential.name)
            for location in (project_presence or {}).get(alias, [])
        ]
        state = credential_presence_state(
            credential,
            env=env,
            project_locations=(project_presence or {}).get(credential.name, []),
            alias_locations=alias_locations,
        )
        if credential.required and state == "missing":
            missing.append(credential.name)
        if state in {
            "present",
            "present_project_local",
            "present_project_secret",
            "needs_promotion_to_global",
            "needs_mapping",
            "needs_verification",
        }:
            present.append(credential.name)
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
    return credential_matrix_with_project_presence(records, env=env)


def credential_matrix_with_project_presence(
    records: Iterable[IntegrationRecord],
    env: Optional[Mapping[str, str]] = None,
    project_presence: Optional[Mapping[str, List[ProjectCredentialLocation]]] = None,
) -> List[CredentialStatus]:
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
        locations = list((project_presence or {}).get(name, []))
        aliases = credential_aliases(name)
        alias_locations = [
            location
            for alias in aliases
            for location in (project_presence or {}).get(alias, [])
        ]
        matrix.append(
            CredentialStatus(
                name=name,
                state=credential_presence_state(requirement, env=env, project_locations=locations, alias_locations=alias_locations),
                scope=requirement.scope,
                storage=requirement.storage,
                used_by=sorted(row["used_by"]),
                required_by=sorted(row["required_by"]),
                required=requirement.required,
                human_owned=requirement.human_owned,
                project_locations=_location_project_ids(locations),
                alias_locations=_location_project_ids(alias_locations),
                evidence_sources=_location_sources(locations + alias_locations),
                aliases=aliases,
            )
        )
    return matrix


def project_integration_matrix(
    manifests: Optional[Iterable[ProjectIntegrationManifest]] = None,
    records: Optional[Iterable[IntegrationRecord]] = None,
    env: Optional[Mapping[str, str]] = None,
    project_presence: Optional[Mapping[str, List[ProjectCredentialLocation]]] = None,
) -> List[Dict[str, Any]]:
    manifest_list = list(manifests or default_project_manifests())
    status_by_id = {
        status.integration_id: status
        for status in [integration_status(record, env, project_presence) for record in (records or default_integration_records())]
    }
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
    project_presence: Optional[Mapping[str, List[ProjectCredentialLocation]]] = None,
    scan_project_env: bool = True,
    project_paths: Optional[Mapping[str, str]] = None,
    include_workflow_references: bool = True,
    include_hermes_global_config: bool = True,
    hermes_config_path: str | Path | None = None,
    hermes_env_path: str | Path | None = None,
    include_github_repo_credentials: bool = False,
    project_repositories: Optional[Mapping[str, str]] = None,
) -> Dict[str, Any]:
    record_list = list(records or default_integration_records())
    manifest_list = list(manifests or default_project_manifests())
    scanned_presence = project_presence
    if scanned_presence is None and scan_project_env:
        scanned_presence = scan_project_credential_sources(
            project_paths,
            include_workflow_references=include_workflow_references,
            include_hermes_global_config=include_hermes_global_config,
            hermes_config_path=hermes_config_path,
            hermes_env_path=hermes_env_path,
            include_github_repo_credentials=include_github_repo_credentials,
            project_repositories=project_repositories,
        )
    scanned_presence = scanned_presence or {}
    statuses = [integration_status(record, env, scanned_presence) for record in record_list]
    credentials = credential_matrix_with_project_presence(record_list, env=env, project_presence=scanned_presence)
    missing_credentials = [credential for credential in credentials if credential.required and credential.state == "missing" and not credential.human_owned]
    promotion_credentials = [
        credential
        for credential in credentials
        if credential.required
        and credential.scope == "global_org"
        and credential.state in {"needs_promotion_to_global", "present_project_secret"}
        and not credential.human_owned
    ]
    mapping_credentials = [
        credential
        for credential in credentials
        if credential.required and credential.state == "needs_mapping" and not credential.human_owned
    ]
    verification_credentials = [
        credential
        for credential in credentials
        if credential.required and credential.state == "needs_verification" and not credential.human_owned
    ]
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
        "needs_promotion_count": len(promotion_credentials),
        "needs_mapping_count": len(mapping_credentials),
        "needs_verification_count": len(verification_credentials),
        "global_candidate_count": len(global_candidates),
        "status_counts": _count_by([status.state for status in statuses]),
        "credential_state_counts": _count_by([credential.state for credential in credentials]),
        "integrations": [asdict(status) for status in statuses],
        "credentials": [asdict(credential) for credential in credentials],
        "projects": project_integration_matrix(manifest_list, record_list, env, scanned_presence),
        "global_secret_candidates": [asdict(credential) for credential in global_candidates],
        "needs_promotion": [asdict(credential) for credential in promotion_credentials],
        "needs_mapping": [asdict(credential) for credential in mapping_credentials],
        "needs_verification": [asdict(credential) for credential in verification_credentials],
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
    needs_promotion = [
        credential
        for credential in credentials
        if credential.get("required", True)
        and credential.get("scope") == "global_org"
        and not credential.get("human_owned", False)
        and credential.get("state") in {"needs_promotion_to_global", "present_project_secret"}
    ]
    needs_mapping = [
        credential
        for credential in credentials
        if credential.get("required", True)
        and not credential.get("human_owned", False)
        and credential.get("state") == "needs_mapping"
    ]
    needs_verification = [
        credential
        for credential in credentials
        if credential.get("required", True)
        and not credential.get("human_owned", False)
        and credential.get("state") == "needs_verification"
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
        "needs_promotion_count": len(needs_promotion),
        "needs_mapping_count": len(needs_mapping),
        "needs_verification_count": len(needs_verification),
        "manual_count": len(manual),
        "needed": sorted(needed, key=lambda item: str(item.get("name", ""))),
        "present": sorted(present, key=lambda item: str(item.get("name", ""))),
        "needs_promotion": sorted(needs_promotion, key=lambda item: str(item.get("name", ""))),
        "needs_mapping": sorted(needs_mapping, key=lambda item: str(item.get("name", ""))),
        "needs_verification": sorted(needs_verification, key=lambda item: str(item.get("name", ""))),
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
        locations = item.get("project_locations") or []
        alias_locations = item.get("alias_locations") or []
        sources = item.get("evidence_sources") or []
        if locations or alias_locations or sources:
            details = []
            if locations:
                details.append(f"projects: {', '.join(locations)}")
            if alias_locations:
                details.append(f"alias projects: {', '.join(alias_locations)}")
            if sources:
                details.append(f"sources: {', '.join(sources)}")
            lines.append(f"  evidence: {' | '.join(details)}")
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
                "needs_promotion_count": payload.get("needs_promotion_count", 0),
                "needs_mapping_count": payload.get("needs_mapping_count", 0),
                "needs_verification_count": payload.get("needs_verification_count", 0),
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
