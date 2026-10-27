"""Shared sign-in gate ("sign in once") through the real dashboard server.

Caddy forwards a signed-in browser with ``X-TLC-User`` + ``X-TLC-Gate``.
The dashboard must treat a valid gate as the signed-in owner, ignore the
headers when ``TLC_SIGN_IN_GATE_SECRET`` is unset or wrong, and keep the
existing basic username/password login working.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from fastapi.testclient import TestClient

from hermes_cli import web_server
from hermes_cli.dashboard_auth import clear_providers, register_provider
from hermes_cli.dashboard_auth.routes import _reset_password_rate_limit
from hermes_cli.dashboard_auth.ws_tickets import _reset_for_tests
from plugins.dashboard_auth.basic import BasicAuthProvider, hash_password

GATE_SECRET = "gate-secret-for-tests-0123456789"
GATE = {"X-TLC-User": "edward", "X-TLC-Gate": GATE_SECRET}
WRONG_GATE = {"X-TLC-User": "edward", "X-TLC-Gate": "not-the-secret"}


@pytest.fixture
def gated_app(monkeypatch):
    """web_server.app in gated mode with the real basic provider."""
    monkeypatch.setenv("TLC_SIGN_IN_GATE_SECRET", GATE_SECRET)
    _reset_for_tests()
    _reset_password_rate_limit()
    clear_providers()
    register_provider(
        BasicAuthProvider(
            username="admin",
            password_hash=hash_password("hunter2"),
            secret=b"x" * 32,
        )
    )
    prev = {
        k: getattr(web_server.app.state, k, None)
        for k in ("bound_host", "bound_port", "auth_required")
    }
    web_server.app.state.bound_host = "agent.tlccapitalgroup.com"
    web_server.app.state.bound_port = 443
    web_server.app.state.auth_required = True
    yield TestClient(web_server.app, base_url="https://agent.tlccapitalgroup.com")
    clear_providers()
    _reset_for_tests()
    _reset_password_rate_limit()
    for k, v in prev.items():
        setattr(web_server.app.state, k, v)


class TestGateAccepted:
    def test_api_is_authenticated_as_the_owner(self, gated_app):
        me = gated_app.get("/api/auth/me", headers=GATE)
        assert me.status_code == 200
        assert me.json()["user_id"] == "edward"
        assert me.json()["provider"] == "tlc-sign-in"

    def test_html_route_is_served_not_redirected_to_login(self, gated_app):
        resp = gated_app.get("/sessions", headers=GATE, follow_redirects=False)
        assert resp.status_code != 302
        assert "/login" not in resp.headers.get("location", "")

    def test_login_page_skips_the_form(self, gated_app):
        resp = gated_app.get(
            "/login?next=%2Fsessions", headers=GATE, follow_redirects=False
        )
        assert resp.status_code == 302
        assert resp.headers["location"] == "/sessions"

    def test_ws_ticket_can_be_minted(self, gated_app):
        resp = gated_app.post("/api/auth/ws-ticket", headers=GATE)
        assert resp.status_code == 200
        assert resp.json()["ticket"]

    def test_websocket_upgrade_accepts_the_gate(self, gated_app):
        ws = SimpleNamespace(
            query_params={},
            headers={"x-tlc-user": "edward", "x-tlc-gate": GATE_SECRET},
            client=SimpleNamespace(host="203.0.113.5"),
            url=SimpleNamespace(path="/api/pty"),
        )
        assert web_server._ws_auth_reason(ws) == (None, "sign_in_gate")

    def test_logout_sends_owner_to_the_shared_sign_in(self, gated_app):
        resp = gated_app.post("/auth/logout", headers=GATE, follow_redirects=False)
        assert resp.status_code == 302
        assert resp.headers["location"] == "https://login.tlccapitalgroup.com/"

    def test_status_still_reports_basic_auth(self, gated_app):
        body = gated_app.get("/api/status", headers=GATE).json()
        assert body["auth_required"] is True
        assert body["auth_providers"] == ["basic"]


class TestGateRejected:
    @pytest.mark.parametrize(
        "headers",
        [
            WRONG_GATE,
            {"X-TLC-Gate": GATE_SECRET},  # no user
            {"X-TLC-User": "edward"},  # no gate
        ],
    )
    def test_bad_gate_gets_existing_401_and_redirect(self, gated_app, headers):
        api = gated_app.get("/api/auth/me", headers=headers)
        assert api.status_code == 401
        html = gated_app.get("/sessions", headers=headers, follow_redirects=False)
        assert html.status_code == 302
        assert html.headers["location"].startswith("/login")
        login = gated_app.get("/login", headers=headers, follow_redirects=False)
        assert login.status_code == 200

    def test_secret_unset_ignores_headers(self, gated_app, monkeypatch):
        monkeypatch.delenv("TLC_SIGN_IN_GATE_SECRET")
        assert gated_app.get("/api/auth/me", headers=GATE).status_code == 401
        # Even an empty gate can't match an unset secret.
        empty = {"X-TLC-User": "edward", "X-TLC-Gate": ""}
        assert gated_app.get("/api/auth/me", headers=empty).status_code == 401
        ws = SimpleNamespace(
            query_params={},
            headers={"x-tlc-user": "edward", "x-tlc-gate": GATE_SECRET},
            client=SimpleNamespace(host="203.0.113.5"),
            url=SimpleNamespace(path="/api/pty"),
        )
        assert web_server._ws_auth_reason(ws)[0] == "no_credential"


class TestExistingLoginStillWorks:
    def test_basic_password_login_session(self, gated_app):
        login = gated_app.post(
            "/auth/password-login",
            json={"provider": "basic", "username": "admin", "password": "hunter2"},
        )
        assert login.status_code == 200
        me = gated_app.get("/api/auth/me")
        assert me.status_code == 200
        assert me.json()["user_id"] == "admin"
        assert me.json()["provider"] == "basic"

    def test_login_form_still_renders_without_gate(self, gated_app):
        resp = gated_app.get("/login")
        assert resp.status_code == 200
        assert 'data-provider="basic"' in resp.text
