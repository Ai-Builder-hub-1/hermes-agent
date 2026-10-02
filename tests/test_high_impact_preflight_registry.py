from hermes_cli.high_impact_preflight_registry import (
    HIGH_IMPACT_WORKFLOWS,
    find_workflow,
    validate_high_impact_registry,
    workflows_by_posture,
)


def test_high_impact_registry_is_valid():
    assert validate_high_impact_registry() == []


def test_every_high_impact_workflow_has_enforcement_posture():
    postures = {workflow.posture for workflow in HIGH_IMPACT_WORKFLOWS}

    assert postures <= {
        "preflight_required",
        "preflight_exempt_with_reason",
        "blocked_until_approved",
    }
    assert all(workflow.canonical_plan.startswith("CP-") for workflow in HIGH_IMPACT_WORKFLOWS)
    assert all(workflow.owner for workflow in HIGH_IMPACT_WORKFLOWS)


def test_required_workflows_use_agent_preflight_endpoint():
    required = workflows_by_posture("preflight_required")

    assert required
    assert all(workflow.endpoint == "/api/second-brain/agent-preflight" for workflow in required)


def test_live_trading_and_destructive_pruning_stay_blocked():
    assert find_workflow("oanda-live-trading").posture == "blocked_until_approved"
    assert find_workflow("destructive-pruning").posture == "blocked_until_approved"
