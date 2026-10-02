from fastapi import HTTPException
from fastapi.testclient import TestClient


def test_promotion_execution_calls_registered_preflight_before_planning(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    preflights = []

    async def fake_preflight(workflow_id, *, task, actor="Hermes operator", entities=None, metadata=None):
        preflights.append({
            "workflow_id": workflow_id,
            "task": task,
            "actor": actor,
            "entities": entities,
            "metadata": metadata,
        })
        return {"enforcement": {"mustStop": False}}

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/operating-runtime/promotion-execution",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={
            "project": "nous-hermes-agent",
            "version": "test-sha",
            "environment": "production",
            "app_dir": "/root/apps/nous-hermes-agent",
            "url": "https://agent.tlccapitalgroup.com",
            "actor": "test-operator",
            "actor_role": "admin",
            "explicit_approval": True,
        },
    )

    assert response.status_code == 200
    assert preflights[0]["workflow_id"] == "production-deploy-promote"
    assert preflights[0]["actor"] == "test-operator"
    assert preflights[0]["metadata"]["project"] == "nous-hermes-agent"


def test_promotion_execution_stops_when_registered_preflight_blocks(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    async def fake_preflight(*args, **kwargs):
        raise HTTPException(
            status_code=409,
            detail={"error": "second_brain_preflight_blocked", "workflow": "production-deploy-promote"},
        )

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/operating-runtime/promotion-execution",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={
            "project": "nous-hermes-agent",
            "version": "test-sha",
            "environment": "production",
            "app_dir": "/root/apps/nous-hermes-agent",
            "url": "https://agent.tlccapitalgroup.com",
            "actor": "test-operator",
            "actor_role": "admin",
            "explicit_approval": True,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"]["error"] == "second_brain_preflight_blocked"


def test_system_warehouse_actions_call_registered_preflight(monkeypatch):
    from hermes_cli import system_warehouse, web_server

    preflights = []

    async def fake_preflight(workflow_id, *, task, actor="Hermes operator", entities=None, metadata=None):
        preflights.append({
            "workflow_id": workflow_id,
            "task": task,
            "entities": entities,
            "metadata": metadata,
        })
        return {"enforcement": {"mustStop": False}}

    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)
    monkeypatch.setattr(system_warehouse, "record_sync", lambda: {"ok": True, "action": "sync"})
    monkeypatch.setattr(system_warehouse, "record_restore_proof", lambda: {"ok": True, "action": "restore"})
    monkeypatch.setattr(system_warehouse, "record_prune_dry_run", lambda: {"ok": True, "action": "prune-dry-run"})

    client = TestClient(web_server.app)
    headers = {"X-Hermes-Session-Token": web_server._SESSION_TOKEN}

    assert client.post("/api/system/warehouse/sync", headers=headers).status_code == 200
    assert client.post("/api/system/warehouse/restore-proof", headers=headers).status_code == 200
    assert client.post("/api/system/warehouse/prune-dry-run", headers=headers).status_code == 200

    assert [item["workflow_id"] for item in preflights] == [
        "warehouse-sync-restore",
        "warehouse-sync-restore",
        "warehouse-sync-restore",
    ]
    assert preflights[0]["metadata"]["route"] == "/api/system/warehouse/sync"
    assert preflights[2]["metadata"]["destructive"] is False


def test_system_warehouse_action_stops_when_registered_preflight_blocks(monkeypatch):
    from hermes_cli import system_warehouse, web_server

    executed = {"sync": False}

    async def fake_preflight(*args, **kwargs):
        raise HTTPException(
            status_code=409,
            detail={"error": "second_brain_preflight_blocked", "workflow": "warehouse-sync-restore"},
        )

    def fake_sync():
        executed["sync"] = True
        return {"ok": True}

    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)
    monkeypatch.setattr(system_warehouse, "record_sync", fake_sync)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/system/warehouse/sync",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 409
    assert executed["sync"] is False


def test_second_brain_warehouse_sync_uses_registered_preflight(monkeypatch):
    from hermes_cli import web_server

    calls = []

    async def fake_preflight(workflow_id, *, task, actor="Hermes operator", entities=None, metadata=None):
        calls.append({"workflow_id": workflow_id, "task": task, "entities": entities, "metadata": metadata})
        return {"enforcement": {"mustStop": False}}

    async def fake_brain_request(path, method="GET", payload=None):
        calls.append({"path": path, "method": method, "payload": payload})
        return {"ok": True}

    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)
    monkeypatch.setattr(web_server, "_hermes_brain_request", fake_brain_request)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/second-brain/warehouse/sync",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
    )

    assert response.status_code == 200
    assert calls[0]["workflow_id"] == "warehouse-sync-restore"
    assert calls[0]["metadata"]["route"] == "/api/second-brain/warehouse/sync"
    assert calls[1]["path"] == "/api/brain/warehouse/sync"


def test_adapter_run_calls_registered_preflight_for_provider_backfill(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    preflights = []

    async def fake_preflight(workflow_id, *, task, actor="Hermes operator", entities=None, metadata=None):
        preflights.append({
            "workflow_id": workflow_id,
            "task": task,
            "actor": actor,
            "entities": entities,
            "metadata": metadata,
        })
        return {"enforcement": {"mustStop": False}}

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/operating-runtime/adapter-run",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={
            "adapter": "massive-provider-backfill",
            "project": "investing-system",
            "status": "planned",
            "actor": "test-operator",
        },
    )

    assert response.status_code == 200
    assert preflights[0]["workflow_id"] == "investing-provider-backfill"
    assert preflights[0]["actor"] == "test-operator"
    assert preflights[0]["metadata"]["route"] == "/api/operating-runtime/adapter-run"
    assert preflights[0]["metadata"]["adapter"] == "massive-provider-backfill"


def test_adapter_run_stops_when_registered_preflight_blocks(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    executed = {"recorded": False}

    async def fake_preflight(*args, **kwargs):
        raise HTTPException(
            status_code=409,
            detail={"error": "second_brain_preflight_blocked", "workflow": "investing-provider-backfill"},
        )

    def fake_record_adapter_run(*args, **kwargs):
        executed["recorded"] = True
        return {"ok": True}

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)
    monkeypatch.setattr(operating_runtime, "record_adapter_run", fake_record_adapter_run)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/operating-runtime/adapter-run",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={"adapter": "massive-provider-backfill", "project": "investing-system"},
    )

    assert response.status_code == 409
    assert response.json()["detail"]["error"] == "second_brain_preflight_blocked"
    assert executed["recorded"] is False


def test_release_train_execution_calls_registered_preflight(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    preflights = []

    async def fake_preflight(workflow_id, *, task, actor="Hermes operator", entities=None, metadata=None):
        preflights.append({
            "workflow_id": workflow_id,
            "task": task,
            "entities": entities,
            "metadata": metadata,
        })
        return {"enforcement": {"mustStop": False}}

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/operating-runtime/release-train-execution",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={
            "train": "canonical-maturity-wave",
            "projects": ["nous-hermes-agent", "investing-system"],
            "version": "test-sha",
            "gates_passed": True,
            "approved": True,
        },
    )

    assert response.status_code == 200
    assert preflights[0]["workflow_id"] == "production-deploy-promote"
    assert preflights[0]["metadata"]["route"] == "/api/operating-runtime/release-train-execution"
    assert preflights[0]["metadata"]["projects"] == ["nous-hermes-agent", "investing-system"]


def test_release_train_execution_stops_when_registered_preflight_blocks(monkeypatch, tmp_path):
    from hermes_cli import operating_runtime, web_server

    executed = {"recorded": False}

    async def fake_preflight(*args, **kwargs):
        raise HTTPException(
            status_code=409,
            detail={"error": "second_brain_preflight_blocked", "workflow": "production-deploy-promote"},
        )

    def fake_execute_release_train_record(*args, **kwargs):
        executed["recorded"] = True
        return {"ok": True}

    monkeypatch.setattr(operating_runtime, "db_path", lambda: tmp_path / "operating_runtime.db")
    monkeypatch.setattr(web_server, "_run_registered_high_impact_preflight", fake_preflight)
    monkeypatch.setattr(operating_runtime, "execute_release_train_record", fake_execute_release_train_record)

    client = TestClient(web_server.app)
    response = client.post(
        "/api/operating-runtime/release-train-execution",
        headers={"X-Hermes-Session-Token": web_server._SESSION_TOKEN},
        json={"train": "canonical-maturity-wave", "projects": ["nous-hermes-agent"], "version": "test-sha"},
    )

    assert response.status_code == 409
    assert response.json()["detail"]["error"] == "second_brain_preflight_blocked"
    assert executed["recorded"] is False
