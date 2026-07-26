import json
from types import SimpleNamespace

from hermes_cli.main import cmd_remote_operator
from hermes_os_integration.dashboard import build_project_dashboard
from hermes_os_integration.phase_completion import complete_phases, completion_summary, phase_statuses, task_ids_for_phases
from hermes_os_integration.remote_operator import (
    REMOTE_OPERATOR_SCHEMA,
    authorize_remote_request,
    classify_remote_action,
    create_remote_workflow_job,
    normalize_remote_request,
    remote_audit_records,
    remote_gateway_adapter_contract,
    remote_operator_completion_evidence,
    remote_operator_config,
    remote_operator_dashboard_panels,
    remote_operator_deployment_topology,
    remote_operator_health,
    remote_operator_preview,
    remote_progress_events,
)


def test_remote_operator_contracts_normalize_and_authorize_requests():
    config = remote_operator_config(
        enabled_gateways=["discord", "telegram"],
        allowed_users=["owner"],
        allowed_projects=["khashi-vc"],
    )
    envelope = normalize_remote_request(
        "Ask the Khashi lead scientist what changed overnight",
        source="telegram",
        user_id="owner",
        project_id="khashi-vc",
        session_id="watch",
        platform_message_id="42",
    )

    assert envelope.request_id.startswith("remote:telegram:watch")
    assert envelope.action_class == "research"
    assert envelope.gateway.platform_message_id == "42"
    assert authorize_remote_request(envelope, config)["allowed"] is True
    assert authorize_remote_request(
        normalize_remote_request("status", source="discord", user_id="stranger", project_id="khashi-vc"),
        config,
    )["allowed"] is False


def test_remote_operator_job_progress_audit_and_health(tmp_path):
    (tmp_path / "project.md").write_text("# Khashi\n", encoding="utf-8")
    config = remote_operator_config(
        enabled_gateways=["telegram"],
        allowed_users=["owner"],
        allowed_projects=["khashi-vc"],
    )
    envelope = normalize_remote_request(
        "Build the next experiment report",
        source="telegram",
        user_id="owner",
        project_id="khashi-vc",
    )
    job = create_remote_workflow_job(envelope, config, project_path=str(tmp_path))
    events = remote_progress_events(job)
    audit = remote_audit_records(envelope, job)
    health = remote_operator_health(config, [job])

    assert job.workflow == "new_project_launch"
    assert job.requires_approval is True
    assert job.status == "waiting_for_approval"
    assert any(event.event_type == "approval.required" for event in events)
    assert audit[0].outcome == "accepted"
    assert health.waiting_for_approval == 1


def test_remote_operator_policy_blocks_live_unallowlisted_actions():
    config = remote_operator_config(
        enabled_gateways=["discord"],
        allowed_users=["owner"],
        allowed_projects=["media-engine"],
        dry_run=False,
    )
    envelope = normalize_remote_request(
        "Deploy media engine to production",
        source="discord",
        user_id="owner",
        project_id="media-engine",
        dry_run=False,
    )
    job = create_remote_workflow_job(envelope, config)

    assert classify_remote_action(envelope.message) == "deploy"
    assert job.status == "blocked"
    assert "live action is not allowlisted" in job.blocked_reason


def test_remote_operator_preview_gateway_topology_and_panels(tmp_path):
    result = remote_operator_preview(
        "status khashi",
        source="telegram",
        user_id="owner",
        project_id="khashi-vc",
        project_path=str(tmp_path),
        config=remote_operator_config(
            enabled_gateways=["telegram"],
            allowed_users=["owner"],
            allowed_projects=["khashi-vc"],
        ),
    )
    panels = remote_operator_dashboard_panels(remote_operator_config(), [])
    topology = remote_operator_deployment_topology("hermes.example.com")
    gateway = remote_gateway_adapter_contract("telegram")

    assert result["schema"] == REMOTE_OPERATOR_SCHEMA
    assert result["gateway_contract"]["direct_shell_access"] is False
    assert panels[0]["panel_id"] == "remote-operator-health"
    assert topology["host"] == "hermes.example.com"
    assert gateway["must_use_command_envelope"] is True


def test_project_dashboard_includes_remote_operator_panels(tmp_path):
    summary = build_project_dashboard(str(tmp_path))
    panel_ids = {panel["panel_id"] for panel in summary["panels"]}

    assert "remote-operator-health" in panel_ids
    assert "remote-operator-jobs" in panel_ids
    assert "remote-operator-inbox" in panel_ids


def test_cmd_remote_operator_preview_prints_json(tmp_path, capsys):
    args = SimpleNamespace(
        operator_command="preview",
        message=["Ask", "Khashi", "lead", "scientist", "for", "status"],
        source="telegram",
        project=str(tmp_path),
        project_id="khashi-vc",
        user_id="owner",
        session_id="watch",
        gateway=["telegram"],
        allowed_user=["owner"],
        allowed_project=["khashi-vc"],
        live=False,
        emergency_stop=False,
    )

    cmd_remote_operator(args)
    payload = json.loads(capsys.readouterr().out)

    assert payload["schema"] == REMOTE_OPERATOR_SCHEMA
    assert payload["request"]["source"] == "telegram"
    assert payload["job"]["workflow"] == "existing_project_work"
    assert payload["health"]["mode"] == "dry_run"


def test_phase_74_completion_tracking(tmp_path):
    (tmp_path / ".hermes").mkdir()
    (tmp_path / "TASKS.md").write_text(
        "\n".join(f"- `task-{number:03d}`: Task {number}" for number in range(478, 485)),
        encoding="utf-8",
    )
    (tmp_path / ".hermes" / "tasks.json").write_text(json.dumps({"tasks": []}), encoding="utf-8")

    result = complete_phases(tmp_path, [74])
    statuses = phase_statuses(json.loads((tmp_path / ".hermes" / "tasks.json").read_text(encoding="utf-8")), [74])
    summary = completion_summary(tmp_path, [74])
    evidence = remote_operator_completion_evidence(tmp_path)

    assert task_ids_for_phases([74]) == [f"task-{number:03d}" for number in range(478, 485)]
    assert result["completed"] == 7
    assert result["percent"] == 100
    assert summary["completed"] == 7
    assert statuses[0].percent == 100
    assert evidence["dry_run_foundation_complete"] is True
    assert evidence["live_gateways_complete"] is False
