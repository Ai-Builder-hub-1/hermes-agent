import json
from types import SimpleNamespace

from hermes_cli.main import cmd_integrations
from hermes_os_integration.dashboard import build_project_dashboard
from hermes_os_integration.integration_registry import (
    CredentialRequirement,
    IntegrationRecord,
    credential_matrix,
    credential_state,
    default_integration_records,
    default_project_manifests,
    integration_dashboard_panels,
    integration_registry_completion_evidence,
    integration_registry_summary,
    integration_status,
    load_integration_records,
    parse_env_file_presence,
    parse_simple_yaml_presence,
    project_integration_matrix,
    scan_github_repo_credentials,
    scan_hermes_global_config_credentials,
    scan_hermes_global_env_credentials,
    scan_project_credential_sources,
    scan_project_env_credentials,
    simple_credential_lists,
)
from hermes_os_integration.phase_completion import complete_phases, completion_summary, phase_statuses, task_ids_for_phases


def test_integration_registry_summary_tracks_missing_and_global_credentials():
    summary = integration_registry_summary(env={"OPENAI_API_KEY": "runtime-key", "META_ACCESS_TOKEN": "meta"}, scan_project_env=False)
    simple = simple_credential_lists(summary)

    assert summary["schema"] == "hermes-integration-registry-v1"
    assert summary["project_count"] >= 7
    assert summary["integration_count"] >= 10
    assert summary["missing_credential_count"] > 0
    assert any(item["name"] == "OPENAI_API_KEY" for item in summary["global_secret_candidates"])
    assert any(item["name"] == "OPENAI_ADMIN_KEY" for item in summary["human_setup_items"])
    assert not any(item["name"] == "DISCORD_ALLOWED_CHANNEL_IDS" for item in summary["human_setup_items"])
    assert any(item["name"] == "OPENAI_ADMIN_KEY" for item in simple["needed"])
    assert any(item["name"] == "OPENAI_API_KEY" for item in simple["present"])


def test_credential_state_and_integration_status_do_not_store_values():
    record = IntegrationRecord(
        "sample",
        "Sample",
        "billing",
        "global_org",
        used_by=["alpha", "beta"],
        credentials=[
            CredentialRequirement("SAMPLE_KEY"),
            CredentialRequirement("SAMPLE_OPTIONAL", required=False),
        ],
        current_state="configured",
    )
    status = integration_status(record, env={"SAMPLE_KEY": "secret-value"})
    matrix = credential_matrix([record], env={"SAMPLE_KEY": "secret-value"})

    assert credential_state(record.credentials, env={"SAMPLE_KEY": "secret-value"}) == "present"
    assert status.state == "configured"
    assert status.present_credentials == ["SAMPLE_KEY"]
    assert "secret-value" not in json.dumps(status.__dict__)
    assert matrix[0].used_by == ["alpha", "beta"]
    assert next(item for item in matrix if item.name == "SAMPLE_OPTIONAL").required is False


def test_project_integration_matrix_groups_missing_credentials_by_project():
    rows = project_integration_matrix(default_project_manifests(), default_integration_records(), env={})
    media = next(row for row in rows if row["project_id"] == "media-engine")
    hermes = next(row for row in rows if row["project_id"] == "hermes")

    assert any(item["integration_id"] == "meta-platform-access" for item in media["integrations"])
    assert "META_ACCESS_TOKEN" in media["missing_credentials"]
    assert any(item["integration_id"] == "discord-operator-gateway" for item in hermes["integrations"])


def test_integration_dashboard_panels_and_project_dashboard_include_registry(tmp_path):
    panels = integration_dashboard_panels(integration_registry_summary(env={}, scan_project_env=False))
    dashboard = build_project_dashboard(str(tmp_path))
    dashboard_ids = {panel["panel_id"] for panel in dashboard["panels"]}

    assert panels[0]["panel_id"] == "integration-registry-summary"
    assert panels[1]["data"]["count"] > 0
    assert "integration-registry-summary" in dashboard_ids
    assert "integration-project-matrix" in dashboard_ids


def test_cmd_integrations_outputs_status_missing_projects_dashboard_and_simple_lists(capsys):
    base = SimpleNamespace(registry="")

    for command in ["status", "missing", "projects", "dashboard", "needed", "present", "promote", "map", "verify"]:
        cmd_integrations(SimpleNamespace(**base.__dict__, integrations_command=command))
        output = capsys.readouterr().out
        if command in {"needed", "present", "promote", "map", "verify"}:
            assert "Credentials" in output
            continue
        payload = json.loads(output)
        assert payload["schema"] == "hermes-integration-registry-v1"
        if command == "missing":
            assert "human_setup_items" in payload
        if command == "projects":
            assert "projects" in payload
        if command == "dashboard":
            assert "panels" in payload


def test_cmd_integrations_simple_lists_can_emit_json(capsys):
    cmd_integrations(SimpleNamespace(registry="", integrations_command="needed", json=True))
    needed = json.loads(capsys.readouterr().out)
    cmd_integrations(SimpleNamespace(registry="", integrations_command="present", json=True))
    present = json.loads(capsys.readouterr().out)
    cmd_integrations(SimpleNamespace(registry="", integrations_command="promote", json=True))
    promote = json.loads(capsys.readouterr().out)
    cmd_integrations(SimpleNamespace(registry="", integrations_command="map", json=True))
    mapping = json.loads(capsys.readouterr().out)
    cmd_integrations(SimpleNamespace(registry="", integrations_command="verify", json=True))
    verify = json.loads(capsys.readouterr().out)

    assert needed["schema"] == "hermes-integration-registry-v1"
    assert "needed" in needed
    assert "present" in present
    assert "needs_promotion" in promote
    assert "needs_mapping" in mapping
    assert "needs_verification" in verify


def test_project_env_scan_marks_global_credentials_for_promotion(tmp_path):
    investing = tmp_path / "investing-system"
    media = tmp_path / "media-engine"
    investing.mkdir()
    media.mkdir()
    (investing / ".env").write_text("DISCORD_BOT_TOKEN=abc\nEMPTY_TOKEN=\n", encoding="utf-8")
    (media / ".env").write_text("DISCORD_BOT_TOKEN=def\n", encoding="utf-8")

    parsed = parse_env_file_presence(investing / ".env")
    presence = scan_project_env_credentials({
        "investing-system": str(investing),
        "media-engine": str(media),
    })
    summary = integration_registry_summary(env={}, project_presence=presence, scan_project_env=False)
    simple = simple_credential_lists(summary)
    discord = next(item for item in summary["credentials"] if item["name"] == "DISCORD_BOT_TOKEN")

    assert parsed["DISCORD_BOT_TOKEN"] is True
    assert parsed["EMPTY_TOKEN"] is False
    assert discord["state"] == "needs_promotion_to_global"
    assert discord["project_locations"] == ["investing-system", "media-engine"]
    assert any(item["name"] == "DISCORD_BOT_TOKEN" for item in simple["needs_promotion"])
    assert not any(item["name"] == "DISCORD_BOT_TOKEN" for item in simple["needed"])


def test_hermes_global_config_counts_as_global_presence(tmp_path):
    config = tmp_path / "config.yaml"
    config.write_text(
        "\n".join(
            [
                "HETZNER_HOST: 192.0.2.10",
                "HETZNER_USER: root",
                "HETZNER_SSH_KEY_PATH: /Users/example/.ssh/hetzner_hermes",
                "PRODUCTION_DOMAIN: tlccapitalgroup.com",
            ]
        ),
        encoding="utf-8",
    )

    parsed = parse_simple_yaml_presence(config)
    presence = scan_hermes_global_config_credentials(config)
    summary = integration_registry_summary(env={}, hermes_config_path=config, project_presence=presence, scan_project_env=False)
    simple = simple_credential_lists(summary)
    ssh_key = next(item for item in summary["credentials"] if item["name"] == "HETZNER_SSH_KEY")

    assert parsed["HETZNER_SSH_KEY_PATH"] is True
    assert ssh_key["state"] == "needs_mapping"
    assert ssh_key["alias_locations"] == ["hermes-global"]
    assert "hermes_global_config" in ssh_key["evidence_sources"]
    assert any(item["name"] == "HETZNER_SSH_KEY" for item in simple["needs_mapping"])
    assert not any(item["name"] == "HETZNER_SSH_KEY" for item in simple["needed"])


def test_hermes_global_env_counts_as_global_presence(tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text("OPENAI_ADMIN_KEY=admin\nOPENAI_ORG_ID=org\n", encoding="utf-8")

    presence = scan_hermes_global_env_credentials(env_file)
    summary = integration_registry_summary(env={}, project_presence=presence, scan_project_env=False)
    simple = simple_credential_lists(summary)
    admin_key = next(item for item in summary["credentials"] if item["name"] == "OPENAI_ADMIN_KEY")

    assert admin_key["state"] == "present"
    assert admin_key["project_locations"] == ["hermes-global"]
    assert "hermes_global_env" in admin_key["evidence_sources"]
    assert any(item["name"] == "OPENAI_ADMIN_KEY" for item in simple["present"])
    assert not any(item["name"] == "OPENAI_ADMIN_KEY" for item in simple["needs_promotion"])


def test_deferred_credentials_do_not_pollute_missing_list():
    summary = integration_registry_summary(env={}, scan_project_env=False)
    simple = simple_credential_lists(summary)
    needed_names = {item["name"] for item in simple["needed"]}
    firework = next(item for item in summary["credentials"] if item["name"] == "FIREWORKS_API_KEY")
    youtube_client = next(item for item in summary["credentials"] if item["name"] == "YOUTUBE_CLIENT_ID")
    search_site = next(item for item in summary["credentials"] if item["name"] == "GOOGLE_SEARCH_CONSOLE_SITE_URL")

    assert firework["required"] is False
    assert youtube_client["required"] is False
    assert search_site["required"] is False
    assert "FIREWORKS_API_KEY" not in needed_names
    assert "YOUTUBE_CLIENT_ID" not in needed_names
    assert "GOOGLE_SEARCH_CONSOLE_SITE_URL" not in needed_names


def test_alias_credentials_need_mapping_instead_of_counting_as_missing(tmp_path):
    hermes = tmp_path / "hermes"
    hermes.mkdir()
    (hermes / ".env").write_text("HERMES_PRODUCTION_SSH_HOST=host.example\nHERMES_PRODUCTION_BASE_DOMAIN=example.com\n", encoding="utf-8")

    presence = scan_project_credential_sources({"hermes": str(hermes)}, include_workflow_references=False)
    summary = integration_registry_summary(env={}, project_presence=presence, scan_project_env=False)
    simple = simple_credential_lists(summary)
    hetzner_host = next(item for item in summary["credentials"] if item["name"] == "HETZNER_HOST")
    production_domain = next(item for item in summary["credentials"] if item["name"] == "PRODUCTION_DOMAIN")

    assert hetzner_host["state"] == "needs_mapping"
    assert hetzner_host["alias_locations"] == ["hermes"]
    assert production_domain["state"] == "present_project_local"
    assert any(item["name"] == "HETZNER_HOST" for item in simple["needs_mapping"])
    assert not any(item["name"] == "HETZNER_HOST" for item in simple["needed"])
    assert not any(item["name"] == "PRODUCTION_DOMAIN" for item in simple["needs_mapping"])


def test_github_repo_secret_names_count_as_project_secret_evidence(monkeypatch):
    def fake_repo_names(repo, kind):
        if repo == "Ai-Builder-hub-1/khashi-vc" and kind == "secret":
            return ["HETZNER_HOST", "HETZNER_SSH_KEY", "HETZNER_USER"]
        if repo == "Ai-Builder-hub-1/khashi-vc" and kind == "variable":
            return ["PRODUCTION_BASE_DOMAIN"]
        return []

    monkeypatch.setattr("hermes_os_integration.integration_registry._project_repo_secret_names", fake_repo_names)

    presence = scan_github_repo_credentials({"khashi-vc": "Ai-Builder-hub-1/khashi-vc"})
    summary = integration_registry_summary(env={}, project_presence=presence, scan_project_env=False)
    simple = simple_credential_lists(summary)
    host = next(item for item in summary["credentials"] if item["name"] == "HETZNER_HOST")
    domain = next(item for item in summary["credentials"] if item["name"] == "PRODUCTION_DOMAIN")

    assert host["state"] == "present_project_secret"
    assert host["project_locations"] == ["khashi-vc"]
    assert "github_repo_secret" in host["evidence_sources"]
    assert domain["state"] == "present_project_secret"
    assert any(item["name"] == "HETZNER_HOST" for item in simple["needs_promotion"])
    assert not any(item["name"] == "HETZNER_HOST" for item in simple["needed"])


def test_load_integration_records_from_json(tmp_path):
    registry = tmp_path / "registry.json"
    registry.write_text(
        json.dumps(
            {
                "integrations": [
                    {
                        "integration_id": "custom",
                        "name": "Custom",
                        "category": "test",
                        "scope": "project_local",
                        "used_by": ["alpha"],
                        "credentials": [{"name": "CUSTOM_TOKEN", "scope": "project_local"}],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    records = load_integration_records(registry)

    assert records[0].integration_id == "custom"
    assert records[0].credentials[0].name == "CUSTOM_TOKEN"


def test_phase_79_completion_tracking(tmp_path):
    (tmp_path / ".hermes").mkdir()
    (tmp_path / "TASKS.md").write_text(
        "\n".join(f"- `task-{number:03d}`: Task {number}" for number in range(516, 526)),
        encoding="utf-8",
    )
    (tmp_path / ".hermes" / "tasks.json").write_text(json.dumps({"tasks": []}), encoding="utf-8")

    result = complete_phases(tmp_path, [79])
    statuses = phase_statuses(json.loads((tmp_path / ".hermes" / "tasks.json").read_text(encoding="utf-8")), [79])
    summary = completion_summary(tmp_path, [79])
    evidence = integration_registry_completion_evidence(tmp_path)

    assert task_ids_for_phases([79]) == [f"task-{number:03d}" for number in range(516, 526)]
    assert result["completed"] == 10
    assert result["percent"] == 100
    assert summary["completed"] == 10
    assert statuses[0].percent == 100
    assert evidence["local_registry_complete"] is True
    assert evidence["live_secret_verification_complete"] is False
