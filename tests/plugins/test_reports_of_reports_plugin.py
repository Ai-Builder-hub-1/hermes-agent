"""Tests for the read-only Reports of Reports dashboard status endpoint."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

PLUGIN_MODULE_PATH = (
    Path(__file__).resolve().parents[2]
    / "plugins"
    / "reports-of-reports"
    / "dashboard"
    / "plugin_api.py"
)

RUN = {
    "id": "run-1",
    "name": "Weekly scan",
    "state": "succeeded",
    "updated_at": "2026-11-12T10:00:00Z",
    "spend_usd": 0.42,
    "error_code": None,
    "report_doc_id": "abc_DEF-123",
}
SNAPSHOT = {
    "schema_version": 1,
    "generated_at": "2026-11-12T10:05:00Z",
    "last_scan": "2026-11-12T10:00:00Z",
    "scan_exit_code": -9,
    "month_spend_usd": 2.5,
    "runs": [RUN],
}


@pytest.fixture
def client_for(tmp_path):
    spec = importlib.util.spec_from_file_location(
        f"reports_plugin_api_{id(tmp_path)}", PLUGIN_MODULE_PATH
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.SNAPSHOT = tmp_path / "status.json"
    app = FastAPI()
    app.include_router(module.router)

    def make(payload):
        if payload is not None:
            module.SNAPSHOT.write_text(json.dumps(payload))
        return TestClient(app)

    return make


def test_missing_snapshot_reports_unavailable(client_for):
    response = client_for(None).get("/status")
    assert response.status_code == 200
    assert response.json() == {"available": False}


def test_valid_snapshot_returns_only_rendered_fields(client_for):
    payload = {
        **SNAPSHOT,
        "worker_secret_path": "/etc/worker/creds.json",
        "runs": [{**RUN, "prompt": "internal"}],
    }
    response = client_for(payload).get("/status")
    assert response.status_code == 200
    assert response.json() == {**SNAPSHOT, "available": True}


@pytest.mark.parametrize(
    "payload",
    [
        {**SNAPSHOT, "schema_version": 2},
        {k: v for k, v in SNAPSHOT.items() if k != "runs"},
        {**SNAPSHOT, "runs": None},
        {**SNAPSHOT, "runs": {"run-1": RUN}},
        {**SNAPSHOT, "runs": ["run-1"]},
        {k: v for k, v in SNAPSHOT.items() if k != "generated_at"},
        {k: v for k, v in SNAPSHOT.items() if k != "month_spend_usd"},
        {**SNAPSHOT, "month_spend_usd": "2.50"},
        {**SNAPSHOT, "scan_exit_code": True},
        {**SNAPSHOT, "runs": [{k: v for k, v in RUN.items() if k != "spend_usd"}]},
        {**SNAPSHOT, "runs": [{**RUN, "name": {"text": "x"}}]},
        {**SNAPSHOT, "runs": [{**RUN, "state": ["succeeded"]}]},
        {**SNAPSHOT, "runs": [{**RUN, "error_code": 7}]},
    ],
)
def test_malformed_snapshot_is_rejected(client_for, payload):
    response = client_for(payload).get("/status")
    assert response.status_code == 503
