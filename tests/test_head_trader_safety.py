"""Regression tests for the Head Trader safety boundary.

Each test here corresponds to a defect found while reviewing the first cut of
`hermes_cli/head_trader.py`. They are deliberately behavioural: they assert on
whether a control was actually routed to the trading-intelligence proxy, not on
internal bookkeeping, because "did this reach the broker-adjacent surface" is
the only property that matters.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def _client(monkeypatch, tmp_path):
    monkeypatch.setenv("HEAD_TRADER_DATA_DIR", str(tmp_path / "head-trader"))
    from hermes_cli import web_server

    return TestClient(web_server.app), {"X-Hermes-Session-Token": web_server._SESSION_TOKEN}


def _summary_payload():
    return {
        "contractVersion": "trading-intelligence-control-plane.v1",
        "status": "blocked",
        "liveTradingLocked": True,
        "kpis": {"projectsAvailable": 2, "projectsTotal": 2},
        "projects": [
            {
                "projectId": "investing-system",
                "label": "Investing System",
                "available": True,
                "httpStatus": 200,
                "status": "watch",
                "liveTradingLocked": True,
                "kpis": {"openTrades": 1},
                "tabs": [],
                "blockers": ["OANDA strategy freshness is degraded."],
                "recommendations": ["Review OANDA runtime."],
            },
            {
                "projectId": "khashi-vc",
                "label": "Khashi VC",
                "available": True,
                "httpStatus": 200,
                "status": "blocked",
                "liveTradingLocked": True,
                "kpis": {"liveMarkets": 12},
                "tabs": [],
                "blockers": ["Market freshness is stale."],
                "recommendations": ["Run freshness proof."],
            },
        ],
        "blockers": [],
    }


@pytest.fixture()
def desk(monkeypatch, tmp_path):
    """A Head Trader with both desks live and every routed control recorded."""
    from hermes_cli import head_trader as ht

    routed: list[dict] = []

    async def fake_summary():
        return _summary_payload()

    async def fake_events(limit=10):
        return {"events": []}

    async def fake_control(payload):
        routed.append(payload)
        return {"status": "proxied", "httpStatus": 200, "result": {"status": "recorded"}}

    monkeypatch.setattr(ht, "trading_intelligence_summary", fake_summary)
    monkeypatch.setattr(ht, "trading_intelligence_events", fake_events)
    monkeypatch.setattr(ht, "trading_intelligence_control", fake_control)

    client, headers = _client(monkeypatch, tmp_path)
    client.post("/api/head-trader/refresh", headers=headers)
    incidents = client.get("/api/head-trader/incidents", headers=headers).json()["incidents"]
    return {
        "client": client,
        "headers": headers,
        "routed": routed,
        "khashi": next(i for i in incidents if i["desk"] == "khashi"),
        "oanda": next(i for i in incidents if i["desk"] == "oanda"),
    }


# ── live orders ────────────────────────────────────────────────────────────


def test_live_order_is_refused_while_the_control_plane_is_locked(desk):
    """The old guard only fired when liveTradingLocked was False, so in the
    normal locked state it contributed nothing at all."""
    risk = desk["client"].post(
        "/api/head-trader/risk-check",
        headers=desk["headers"],
        json={"actionId": "head_trader.place_live_order"},
    ).json()
    assert risk["allowed"] is False
    assert any("never routable" in blocker for blocker in risk["blockers"])


# ── confirm-once ───────────────────────────────────────────────────────────


def test_confirming_the_same_decision_twice_routes_one_control(desk):
    client, headers, routed = desk["client"], desk["headers"], desk["routed"]
    reply = client.post(
        f"/api/head-trader/incidents/{desk['khashi']['id']}/reply",
        headers=headers,
        json={"message": "run the freshness proof", "channel": "dashboard"},
    ).json()
    decision_id = reply["decision"]["id"]

    first = client.post(f"/api/head-trader/decisions/{decision_id}/confirm", headers=headers, json={"reason": "verify"}).json()
    assert first["status"] == "executed"
    assert len(routed) == 1

    second = client.post(f"/api/head-trader/decisions/{decision_id}/confirm", headers=headers, json={"reason": "again"}).json()
    assert second["status"] == "rejected"
    assert len(routed) == 1, "a replayed confirm must not route the control a second time"


def test_a_rejected_decision_cannot_be_confirmed_afterwards(desk):
    client, headers, routed = desk["client"], desk["headers"], desk["routed"]
    reply = client.post(
        f"/api/head-trader/incidents/{desk['khashi']['id']}/reply",
        headers=headers,
        json={"message": "run the freshness proof", "channel": "dashboard"},
    ).json()
    decision_id = reply["decision"]["id"]

    client.post(f"/api/head-trader/decisions/{decision_id}/reject", headers=headers, json={"reason": "changed my mind"})
    after = client.post(f"/api/head-trader/decisions/{decision_id}/confirm", headers=headers, json={"reason": "actually do it"}).json()
    assert after["status"] == "rejected"
    assert routed == [], "a rejected decision must stay rejected"


# ── intent parsing ─────────────────────────────────────────────────────────


def test_an_action_is_only_proposed_for_the_desk_that_owns_the_incident(desk):
    """"run the proof" on an OANDA incident used to draft a Khashi control."""
    from hermes_cli.head_trader import interpret_reply

    on_oanda = interpret_reply("run the freshness proof", desk["oanda"])
    assert on_oanda["actionId"] is None
    assert on_oanda["intent"] == "unsupported_for_desk"

    on_khashi = interpret_reply("run the freshness proof", desk["khashi"])
    assert on_khashi["actionId"] == "khashi.run_freshness_proof"


def test_pause_resolves_to_each_desks_own_control(desk):
    from hermes_cli.head_trader import interpret_reply

    assert interpret_reply("pause it", desk["khashi"])["actionId"] == "khashi.pause_collection"
    assert interpret_reply("pause it", desk["oanda"])["actionId"] == "investing.pause_oanda_runtime"


@pytest.mark.parametrize(
    "refusal",
    ["no, don't pause it yet", "do not pause", "hold off on the pause", "not yet - leave it running"],
)
def test_a_refusal_containing_the_verb_proposes_nothing(desk, refusal):
    from hermes_cli.head_trader import interpret_reply

    intent = interpret_reply(refusal, desk["khashi"])
    assert intent["intent"] == "decline"
    assert intent["actionId"] is None


# ── inbound channel webhooks ───────────────────────────────────────────────


def _telegram(desk, *, headers=None, text="pause it", incident_key="khashi", sender=42):
    body = {"message": {"chat": {"id": sender}, "from": {"id": sender}, "text": f"{text} {desk[incident_key]['id']}"}}
    return desk["client"].post("/api/head-trader/webhooks/telegram", headers=headers or {}, json=body)


def test_the_webhook_is_reachable_without_a_dashboard_session(desk):
    """Telegram and Discord cannot present a session token; a gated route 401s
    every callback and the conversational loop never runs."""
    response = _telegram(desk)
    assert response.status_code != 401 or response.json().get("code") is not None
    assert response.json()["id"] == "head-trader-channel-webhook"


def test_the_webhook_is_disabled_until_explicitly_enabled(desk):
    body = _telegram(desk).json()
    assert body["status"] == "disabled"
    assert body["code"] == "channel_disabled"


def test_an_enabled_webhook_still_refuses_an_unverified_caller(desk, monkeypatch):
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_ENABLED", "true")
    assert _telegram(desk).json()["code"] == "not_configured"

    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_WEBHOOK_SECRET", "s3cret")
    assert _telegram(desk).json()["code"] == "bad_signature"
    assert _telegram(desk, headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"}).json()["code"] == "bad_signature"


def test_a_verified_caller_still_needs_an_allow_listed_sender(desk, monkeypatch):
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_ENABLED", "true")
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_WEBHOOK_SECRET", "s3cret")
    good = {"X-Telegram-Bot-Api-Secret-Token": "s3cret"}

    assert _telegram(desk, headers=good).json()["code"] == "no_allowed_senders"

    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_ALLOWED_SENDERS", "99")
    assert _telegram(desk, headers=good).json()["code"] == "sender_not_allowed"


def test_a_verified_allow_listed_message_drafts_a_decision_but_routes_nothing(desk, monkeypatch):
    """The whole safety story in one test: chat can start a decision, chat can
    never finish one."""
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_ENABLED", "true")
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_WEBHOOK_SECRET", "s3cret")
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_ALLOWED_SENDERS", "42")

    body = _telegram(desk, headers={"X-Telegram-Bot-Api-Secret-Token": "s3cret"}).json()
    assert body["status"] == "accepted"
    assert body["reply"]["decision"]["status"] == "waiting_for_confirmation"
    assert desk["routed"] == [], "an inbound message must never route a control on its own"


def test_a_message_with_no_incident_reference_is_ignored(desk, monkeypatch):
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_ENABLED", "true")
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_WEBHOOK_SECRET", "s3cret")
    monkeypatch.setenv("HEAD_TRADER_TELEGRAM_ALLOWED_SENDERS", "42")

    response = desk["client"].post(
        "/api/head-trader/webhooks/telegram",
        headers={"X-Telegram-Bot-Api-Secret-Token": "s3cret"},
        json={"message": {"chat": {"id": 42}, "from": {"id": 42}, "text": "pause it"}},
    ).json()
    assert response["code"] == "no_incident_reference"


def test_discord_requires_a_valid_ed25519_signature(desk, monkeypatch):
    monkeypatch.setenv("HEAD_TRADER_DISCORD_ENABLED", "true")
    monkeypatch.setenv("HEAD_TRADER_DISCORD_PUBLIC_KEY", "aa" * 32)
    response = desk["client"].post(
        "/api/head-trader/webhooks/discord",
        headers={"X-Signature-Ed25519": "bb" * 64, "X-Signature-Timestamp": "1"},
        json={"content": "pause it", "author": {"id": "42"}},
    ).json()
    assert response["code"] == "bad_signature"


def test_channel_status_reports_why_inbound_is_not_ready(desk):
    channels = desk["client"].get("/api/head-trader/channels", headers=desk["headers"]).json()["channels"]
    for channel in channels:
        assert channel["inboundReady"] is False
        assert channel["verification"] in {"telegram_secret_token", "discord_ed25519"}
