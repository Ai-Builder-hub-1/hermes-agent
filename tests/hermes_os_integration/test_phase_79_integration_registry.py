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
    project_integration_matrix,
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

    for command in ["status", "missing", "projects", "dashboard", "needed", "present", "promote"]:
        cmd_integrations(SimpleNamespace(**base.__dict__, integrations_command=command))
        output = capsys.readouterr().out
        if command in {"needed", "present", "promote"}:
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

    assert needed["schema"] == "hermes-integration-registry-v1"
    assert "needed" in needed
    assert "present" in present
    assert "needs_promotion" in promote


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
