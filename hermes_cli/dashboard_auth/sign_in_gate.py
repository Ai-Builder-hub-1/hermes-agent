"""Shared ``*.tlccapitalgroup.com`` sign-in gate ("sign in once").

The reverse proxy (Caddy) in front of the dashboard asks the shared sign-in
service at ``login.tlccapitalgroup.com`` about every browser request. It
strips any client-sent ``X-TLC-User`` / ``X-TLC-Gate`` headers first, then
— for a signed-in browser — forwards the request with ``X-TLC-User:
<username>`` and ``X-TLC-Gate: <shared secret>``. Requests carrying their
own credentials (``Authorization`` etc.) pass through without X-TLC headers
and authenticate exactly as before.

This module turns a valid gate into a dashboard :class:`Session`, so the
gate middleware, ``/api/auth/me``, ``/api/auth/ws-ticket`` and the login
page all treat the shared sign-in as an authenticated owner. It is NOT a
registered provider: it never appears in ``/api/auth/providers`` or the
``/api/status`` ``auth_providers`` list, mints no cookies, and the
existing providers (basic password login, tokens) keep working unchanged.

Trust rule: only when ``TLC_SIGN_IN_GATE_SECRET`` is non-empty AND
``X-TLC-Gate`` equals it (constant-time) AND ``X-TLC-User`` is non-empty.
With the secret unset the headers are ignored entirely.
"""
from __future__ import annotations

import hmac
import os
import time
from typing import Mapping, Optional

from hermes_cli.dashboard_auth.base import Session

GATE_SECRET_ENV = "TLC_SIGN_IN_GATE_SECRET"
GATE_HEADER = "x-tlc-gate"
USER_HEADER = "x-tlc-user"
PROVIDER_NAME = "tlc-sign-in"
SIGN_IN_URL = "https://login.tlccapitalgroup.com/"

# The gate is re-checked on every request, so the synthetic session only
# needs to outlive the request (and any ws-ticket minted from it).
_SESSION_TTL_SECONDS = 300


def gate_user(headers: Mapping[str, str]) -> Optional[str]:
    """Return the signed-in username when the gate is valid, else ``None``."""
    expected = os.environ.get(GATE_SECRET_ENV, "").strip()
    if not expected:
        return None
    presented = (headers.get(GATE_HEADER) or "").strip()
    user = (headers.get(USER_HEADER) or "").strip()
    if not presented or not user:
        return None
    if not hmac.compare_digest(presented.encode("utf-8"), expected.encode("utf-8")):
        return None
    return user


def gate_session(headers: Mapping[str, str]) -> Optional[Session]:
    """A full dashboard :class:`Session` for a valid gate, else ``None``."""
    user = gate_user(headers)
    if user is None:
        return None
    return Session(
        user_id=user,
        email="",
        display_name=user,
        org_id="",
        provider=PROVIDER_NAME,
        expires_at=int(time.time()) + _SESSION_TTL_SECONDS,
        access_token="",
        refresh_token="",
    )
