"""Key-rotation API: dashboard <-> host secret rotator (Unix-socket HTTP).

A fake rotator serves the documented contract on a temporary Unix socket,
so the real ``UnixSocketRotatorClient`` is exercised end to end. No live
providers, no real rotator.
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler
import json
import logging
import os
import shutil
import socketserver
import tempfile
import threading
from typing import Any

import pytest

FAKE_VALUE = "sk-FAKE-rotation-test-value-0123456789"
FAKE_PAIR_VALUE = "pk-FAKE-pair-half-value-9876543210"
ROTATOR_TOKEN = "fake-rotator-token-for-tests"


class _FakeRotatorState:
    def __init__(self) -> None:
        self.secrets: list[dict[str, Any]] = [
            {
                "name": "OPENAI_API_KEY",
                "provider": "openai",
                "kind": "api-key",
                "rotateUrl": "https://platform.openai.com/api-keys",
                "pairWith": [],
                "server": [
                    {"path": "/root/apps/hermes/.env", "present": True},
                    {"path": "/root/apps/khashi/.env", "present": False},
                ],
                "services": ["hermes-gateway", "khashi-worker"],
                "lastRotatedAt": "2026-01-01T00:00:00Z",
                "ageDays": 292,
                "lastVerify": {"status": "ok", "checkedAt": "2026-10-19T12:00:00Z"},
            },
            {
                "name": "ALPACA_API_KEY",
                "provider": "alpaca",
                "kind": "key-pair",
                "rotateUrl": "https://app.alpaca.markets/",
                "pairWith": ["ALPACA_SECRET_KEY"],
                "server": [{"path": "/root/apps/khashi/.env", "present": True}],
                "services": ["khashi-worker"],
                "lastRotatedAt": None,
                "ageDays": None,
                "lastVerify": None,
            },
        ]
        self.requests: list[dict[str, Any]] = []
        self.echo_values_in_messages = False
        self.rotate_status = 200
        self.fail_verify_step = False


def _make_handler(state: _FakeRotatorState):
    class Handler(BaseHTTPRequestHandler):
        def address_string(self) -> str:  # unix sockets have no peer address
            return "unix"

        def log_message(self, *args: Any) -> None:
            return

        def _send(self, code: int, body: Any) -> None:
            data = json.dumps(body).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _authorized(self) -> bool:
            if self.headers.get("Authorization") != f"Bearer {ROTATOR_TOKEN}":
                self._send(401, {"detail": "bad token"})
                return False
            return True

        def do_GET(self) -> None:
            if not self._authorized():
                return
            state.requests.append({"method": "GET", "path": self.path})
            if self.path == "/v1/secrets":
                self._send(200, state.secrets)
            else:
                self._send(404, {"detail": "not found"})

        def do_POST(self) -> None:
            if not self._authorized():
                return
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length) or b"{}")
            state.requests.append({"method": "POST", "path": self.path, "body": body})
            if self.path == "/v1/rotate":
                if state.rotate_status != 200:
                    self._send(state.rotate_status, {"detail": "rotator refused"})
                    return
                value = next(iter(body["values"].values()))
                message = f"wrote {value}" if state.echo_values_in_messages else "wrote 1 line"
                steps = [
                    {"kind": "file", "target": "/root/apps/hermes/.env", "status": "dry-run" if body.get("dryRun") else "ok", "message": message},
                    {"kind": "service", "target": "hermes-gateway", "status": "skipped" if body.get("dryRun") else "ok", "message": "restarted"},
                    {"kind": "verify", "target": body["name"], "status": "failed" if state.fail_verify_step else "ok", "message": "provider accepted key"},
                ]
                self._send(200, {"steps": steps})
            elif self.path == "/v1/verify":
                self._send(200, {"status": "ok", "checkedAt": "2026-10-20T10:00:00Z", "message": "accepted"})
            else:
                self._send(404, {"detail": "not found"})

    return Handler


class _UnixHTTPServer(socketserver.ThreadingMixIn, socketserver.UnixStreamServer):
    daemon_threads = True


@pytest.fixture
def fake_rotator(monkeypatch):
    # AF_UNIX paths are length-limited (~104 bytes on macOS); keep it short.
    sock_dir = tempfile.mkdtemp(prefix="rot")
    sock_path = os.path.join(sock_dir, "r.sock")
    state = _FakeRotatorState()
    server = _UnixHTTPServer(sock_path, _make_handler(state))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    monkeypatch.setenv("SECRET_ROTATOR_SOCKET", sock_path)
    monkeypatch.setenv("SECRET_ROTATOR_TOKEN", ROTATOR_TOKEN)
    try:
        yield state
    finally:
        server.shutdown()
        server.server_close()
        shutil.rmtree(sock_dir, ignore_errors=True)


@pytest.fixture
def client(monkeypatch, _isolate_hermes_home):
    from starlette.testclient import TestClient

    import hermes_cli.web_server as ws

    ws._rotate_timestamps.clear()
    monkeypatch.setattr(ws.app.state, "auth_required", False, raising=False)
    test_client = TestClient(ws.app)
    test_client.headers[ws._SESSION_HEADER_NAME] = ws._SESSION_TOKEN
    yield test_client
    ws._rotate_timestamps.clear()


def _rotate(client, name="OPENAI_API_KEY", **overrides):
    body = {"values": {name: FAKE_VALUE}, "confirm": name, "dryRun": False}
    body.update(overrides)
    return client.post(f"/api/secrets/rotation/{name}/rotate", json=body)


def _audit_log_text() -> str:
    from hermes_cli.dashboard_auth.audit import _resolve_log_path

    path = _resolve_log_path()
    return path.read_text(encoding="utf-8") if path.exists() else ""


def _ops_rows_text() -> str:
    from hermes_cli.operating_runtime import connect

    with connect() as conn:
        rows = conn.execute("SELECT * FROM ops_secret_rotations").fetchall()
    return json.dumps([dict(row) for row in rows])


# ---------------------------------------------------------------------------
# GET /api/secrets/rotation
# ---------------------------------------------------------------------------


def test_status_merges_rotator_inventory_with_dashboard_history(client, fake_rotator):
    assert _rotate(client, "ALPACA_API_KEY", values={"ALPACA_API_KEY": FAKE_VALUE, "ALPACA_SECRET_KEY": FAKE_PAIR_VALUE}).status_code == 200

    resp = client.get("/api/secrets/rotation")
    assert resp.status_code == 200
    data = resp.json()
    assert data["connected"] is True
    by_name = {s["name"]: s for s in data["secrets"]}

    openai = by_name["OPENAI_API_KEY"]
    assert openai["ageDays"] == 292
    assert openai["server"][1] == {"path": "/root/apps/khashi/.env", "present": False}
    assert openai["lastVerify"]["status"] == "ok"
    assert openai["history"] == []

    # The rotator has no lastRotatedAt for ALPACA; the dashboard's own
    # successful rotation fills it in and the age becomes 0.
    alpaca = by_name["ALPACA_API_KEY"]
    assert alpaca["pairWith"] == ["ALPACA_SECRET_KEY"]
    assert alpaca["lastRotatedAt"] is not None
    assert alpaca["ageDays"] == 0
    assert alpaca["history"][0]["result"] == "ok"
    assert alpaca["history"][0]["actor"] == "local-dashboard"
    assert FAKE_VALUE not in resp.text


def test_status_disconnected_falls_back_to_known_names(client, monkeypatch, tmp_path):
    monkeypatch.setenv("SECRET_ROTATOR_SOCKET", str(tmp_path / "missing.sock"))
    monkeypatch.setenv("SECRET_ROTATOR_TOKEN", ROTATOR_TOKEN)
    import hermes_cli.system_operations as so

    monkeypatch.setattr(so, "credentials_summary", lambda: {"runtimeVariables": [{"name": "OPENROUTER_API_KEY"}]})

    resp = client.get("/api/secrets/rotation")
    assert resp.status_code == 200
    data = resp.json()
    assert data["connected"] is False
    assert "not found" in data["reason"]
    assert data["readme"].startswith("deploy/secret-rotator/README.md")
    names = [s["name"] for s in data["secrets"]]
    assert names == ["OPENROUTER_API_KEY"]
    assert data["secrets"][0]["ageDays"] is None


def test_status_never_500s_when_rotator_rejects_token(client, fake_rotator, monkeypatch):
    monkeypatch.setenv("SECRET_ROTATOR_TOKEN", "wrong")
    resp = client.get("/api/secrets/rotation")
    assert resp.status_code == 200
    assert resp.json()["connected"] is False
    assert "token" in resp.json()["reason"]


def test_status_requires_session_token(fake_rotator, _isolate_hermes_home):
    from starlette.testclient import TestClient

    import hermes_cli.web_server as ws

    assert TestClient(ws.app).get("/api/secrets/rotation").status_code == 401


# ---------------------------------------------------------------------------
# POST /api/secrets/rotation/{name}/rotate
# ---------------------------------------------------------------------------


def test_rotate_happy_path_forwards_and_records_without_values(client, fake_rotator):
    resp = _rotate(client)
    assert resp.status_code == 200
    data = resp.json()
    assert data["result"] == "ok"
    assert [s["kind"] for s in data["steps"]] == ["file", "service", "verify"]
    assert data["macCommand"] == "hermes-keys rotate OPENAI_API_KEY --mac-only"

    forwarded = [r for r in fake_rotator.requests if r["path"] == "/v1/rotate"][0]["body"]
    assert forwarded["values"] == {"OPENAI_API_KEY": FAKE_VALUE}
    assert forwarded["confirm"] == "OPENAI_API_KEY"
    assert forwarded["actor"] == "local-dashboard"
    assert forwarded["dryRun"] is False

    rows = _ops_rows_text()
    assert "OPENAI_API_KEY" in rows and "local-dashboard" in rows
    assert FAKE_VALUE not in rows
    audit = _audit_log_text()
    assert "secret_rotation" in audit and "OPENAI_API_KEY" in audit
    assert FAKE_VALUE not in audit
    assert FAKE_VALUE not in resp.text


def test_rotate_dry_run_is_forwarded_and_not_counted_as_rotation(client, fake_rotator):
    resp = _rotate(client, dryRun=True)
    assert resp.status_code == 200
    assert resp.json()["result"] == "dry-run"
    forwarded = [r for r in fake_rotator.requests if r["path"] == "/v1/rotate"][0]["body"]
    assert forwarded["dryRun"] is True
    status = client.get("/api/secrets/rotation").json()
    openai = next(s for s in status["secrets"] if s["name"] == "OPENAI_API_KEY")
    assert openai["history"][0]["dryRun"] is True
    assert openai["lastRotatedAt"] == "2026-01-01T00:00:00Z"


def test_rotate_failed_step_reports_failed(client, fake_rotator):
    fake_rotator.fail_verify_step = True
    resp = _rotate(client)
    assert resp.status_code == 200
    assert resp.json()["result"] == "failed"


def test_rotate_confirm_mismatch_is_rejected_before_rotator(client, fake_rotator):
    resp = _rotate(client, confirm="OPENAI_API_KE")
    assert resp.status_code == 400
    assert "Confirmation" in resp.json()["detail"]
    assert not [r for r in fake_rotator.requests if r["path"] == "/v1/rotate"]
    assert FAKE_VALUE not in resp.text


def test_rotate_requires_value_for_named_secret(client, fake_rotator):
    resp = _rotate(client, values={"OTHER_KEY": FAKE_VALUE})
    assert resp.status_code == 400
    assert FAKE_VALUE not in resp.text


def test_rotate_without_session_token_is_rejected(fake_rotator, _isolate_hermes_home):
    from starlette.testclient import TestClient

    import hermes_cli.web_server as ws

    ws._rotate_timestamps.clear()
    anon = TestClient(ws.app)
    resp = anon.post(
        "/api/secrets/rotation/OPENAI_API_KEY/rotate",
        json={"values": {"OPENAI_API_KEY": FAKE_VALUE}, "confirm": "OPENAI_API_KEY"},
    )
    assert resp.status_code == 401
    bad = anon.post(
        "/api/secrets/rotation/OPENAI_API_KEY/rotate",
        json={"values": {"OPENAI_API_KEY": FAKE_VALUE}, "confirm": "OPENAI_API_KEY"},
        headers={ws._SESSION_HEADER_NAME: "wrong-token"},
    )
    assert bad.status_code == 401
    assert not fake_rotator.requests


def test_require_token_defers_to_gate_session_in_gated_mode(monkeypatch):
    """In gated mode the cookie session (not the SPA token) authorizes; no session -> 401."""
    from types import SimpleNamespace

    from fastapi import HTTPException

    import hermes_cli.web_server as ws

    request = SimpleNamespace(
        app=SimpleNamespace(state=SimpleNamespace(auth_required=True)),
        state=SimpleNamespace(session=None),
        headers={},
    )
    with pytest.raises(HTTPException) as exc:
        ws._require_token(request)  # type: ignore[arg-type]
    assert exc.value.status_code == 401

    request.state.session = SimpleNamespace(email="owner@example.test", display_name="Owner", user_id="u1")
    ws._require_token(request)  # type: ignore[arg-type]
    assert ws._rotation_actor(request) == "owner@example.test"  # type: ignore[arg-type]


def test_rotate_rate_limited_to_three_per_minute(client, fake_rotator):
    for _ in range(3):
        assert _rotate(client, dryRun=True).status_code == 200
    resp = _rotate(client, dryRun=True)
    assert resp.status_code == 429
    assert len([r for r in fake_rotator.requests if r["path"] == "/v1/rotate"]) == 3


def test_rotate_rotator_unavailable_returns_503_and_records_attempt(client, monkeypatch, tmp_path):
    monkeypatch.setenv("SECRET_ROTATOR_SOCKET", str(tmp_path / "missing.sock"))
    monkeypatch.setenv("SECRET_ROTATOR_TOKEN", ROTATOR_TOKEN)
    resp = _rotate(client)
    assert resp.status_code == 503
    assert resp.json()["result"] == "rotator-unavailable"
    assert FAKE_VALUE not in resp.text
    assert "rotator-unavailable" in _ops_rows_text()


def test_fake_value_never_leaks_into_responses_logs_or_validation_errors(client, fake_rotator, caplog):
    caplog.set_level(logging.DEBUG)
    fake_rotator.echo_values_in_messages = True  # a misbehaving rotator

    responses = [
        _rotate(client),  # happy path; rotator echoes the value in a step message
        client.post(  # pydantic-style bad shapes
            "/api/secrets/rotation/OPENAI_API_KEY/rotate",
            json={"values": [FAKE_VALUE], "confirm": "OPENAI_API_KEY"},
        ),
        client.post(
            "/api/secrets/rotation/OPENAI_API_KEY/rotate",
            json={"values": {"OPENAI_API_KEY": FAKE_VALUE}, "confirm": "OPENAI_API_KEY", "dryRun": FAKE_VALUE},
        ),
    ]
    import hermes_cli.web_server as ws

    ws._rotate_timestamps.clear()
    responses += [
        client.post(  # invalid JSON containing the value
            "/api/secrets/rotation/OPENAI_API_KEY/rotate",
            content=b'{"values": {"OPENAI_API_KEY": "' + FAKE_VALUE.encode() + b'"',
            headers={"Content-Type": "application/json"},
        ),
        client.post(  # invalid path segment + value in body
            f"/api/secrets/rotation/{FAKE_VALUE}/rotate",
            json={"values": {"OPENAI_API_KEY": FAKE_VALUE}, "confirm": FAKE_VALUE},
        ),
    ]
    assert responses[0].status_code == 200
    assert "[redacted]" in responses[0].text
    assert [r.status_code for r in responses[1:]] == [400, 400, 400, 400]
    for resp in responses:
        assert FAKE_VALUE not in resp.text
    assert FAKE_VALUE not in caplog.text
    assert FAKE_VALUE not in _audit_log_text()
    assert FAKE_VALUE not in _ops_rows_text()


def test_validation_handler_hides_inputs_only_for_rotation_routes(client):
    from fastapi.exceptions import RequestValidationError
    from starlette.requests import Request

    import asyncio

    import hermes_cli.web_server as ws

    exc = RequestValidationError([{"loc": ("body", "values"), "type": "dict_type", "msg": "bad", "input": FAKE_VALUE}])

    def _req(path: str) -> Request:
        return Request({"type": "http", "method": "POST", "path": path, "headers": [], "query_string": b""})

    hidden = asyncio.run(ws._validation_error_handler(_req("/api/secrets/rotation/X/rotate"), exc))
    assert FAKE_VALUE.encode() not in hidden.body
    assert hidden.status_code == 422
    default = asyncio.run(ws._validation_error_handler(_req("/api/config"), exc))
    assert FAKE_VALUE.encode() in default.body  # unchanged default behaviour elsewhere


# ---------------------------------------------------------------------------
# POST /api/secrets/rotation/{name}/verify
# ---------------------------------------------------------------------------


def test_verify_proxies_rotator(client, fake_rotator):
    resp = client.post("/api/secrets/rotation/OPENAI_API_KEY/verify")
    assert resp.status_code == 200
    assert resp.json() == {"name": "OPENAI_API_KEY", "status": "ok", "checkedAt": "2026-10-20T10:00:00Z", "message": "accepted"}
    assert fake_rotator.requests[-1]["body"] == {"name": "OPENAI_API_KEY"}


def test_verify_disconnected_returns_503(client, monkeypatch, tmp_path):
    monkeypatch.setenv("SECRET_ROTATOR_SOCKET", str(tmp_path / "missing.sock"))
    resp = client.post("/api/secrets/rotation/OPENAI_API_KEY/verify")
    assert resp.status_code == 503
    assert resp.json()["status"] == "unavailable"


def test_token_file_is_used_when_env_token_absent(client, fake_rotator, monkeypatch, tmp_path):
    token_file = tmp_path / "rotator.token"
    token_file.write_text(ROTATOR_TOKEN + "\n", encoding="utf-8")
    monkeypatch.delenv("SECRET_ROTATOR_TOKEN")
    monkeypatch.setenv("SECRET_ROTATOR_TOKEN_FILE", str(token_file))
    assert client.get("/api/secrets/rotation").json()["connected"] is True
