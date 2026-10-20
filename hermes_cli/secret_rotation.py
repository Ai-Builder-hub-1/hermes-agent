"""Key-rotation support for the dashboard ``/key-rotation`` page.

Talks to the host's secret rotator over a Unix-socket HTTP API and merges
its inventory with the dashboard's own ``ops_secret_rotations`` history.

Rotator contract (implemented in the ``hermes`` repo,
``deploy/secret-rotator/``):

* Socket: ``$SECRET_ROTATOR_SOCKET`` (default ``/run/secret-rotator/rotator.sock``)
* Auth: ``Authorization: Bearer <token>``; token from ``$SECRET_ROTATOR_TOKEN``
  or the file named by ``$SECRET_ROTATOR_TOKEN_FILE``.
* ``GET /v1/secrets`` -> list of secret descriptors (never values)
* ``POST /v1/rotate`` ``{name, values, confirm, actor, dryRun?}`` -> ``{steps}``
* ``POST /v1/verify`` ``{name}`` -> ``{status, checkedAt, message}``

Secret values pass through this module exactly once (dashboard -> rotator)
and are never logged, stored, echoed, or placed in exception messages.
Rotator responses are scrubbed for the submitted values before they are
returned, as defence in depth against a rotator that echoes input.
"""

from __future__ import annotations

from datetime import datetime, timezone
import logging
import os
from pathlib import Path
import re
from typing import Any, Iterable, Mapping, Protocol
from uuid import uuid4

import httpx

_log = logging.getLogger(__name__)

DEFAULT_SOCKET = "/run/secret-rotator/rotator.sock"
ROTATOR_README_HINT = "deploy/secret-rotator/README.md in the hermes repo"
HISTORY_ID_PREFIX = "ops-secret-rotation-event-"
REDACTED = "[redacted]"

# Env-var style secret names only. Used for the URL path segment and the
# ``values`` keys so nothing exotic is forwarded or reflected.
SECRET_NAME_RE = re.compile(r"^[A-Z][A-Z0-9_]{0,127}$")
MAX_VALUE_LENGTH = 16384
FAILED_STEP_STATUSES = frozenset({"failed", "fail", "error", "errored"})


class RotatorUnavailable(Exception):
    """The rotator socket is missing, unreachable, or refused our token.

    ``reason`` is operator-facing and never contains request bodies.
    """

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


class RotatorError(Exception):
    """The rotator answered with a non-2xx status."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(f"rotator returned HTTP {status_code}")
        self.status_code = status_code
        self.detail = detail


class RotatorClient(Protocol):
    async def list_secrets(self) -> list[dict[str, Any]]: ...

    async def rotate(
        self,
        *,
        name: str,
        values: Mapping[str, str],
        confirm: str,
        actor: str,
        dry_run: bool,
    ) -> dict[str, Any]: ...

    async def verify(self, name: str) -> dict[str, Any]: ...


def socket_path() -> str:
    return os.environ.get("SECRET_ROTATOR_SOCKET") or DEFAULT_SOCKET


def _read_token() -> str | None:
    token = os.environ.get("SECRET_ROTATOR_TOKEN")
    if token:
        return token.strip()
    token_file = os.environ.get("SECRET_ROTATOR_TOKEN_FILE")
    if token_file:
        try:
            return Path(token_file).read_text(encoding="utf-8").strip() or None
        except OSError:
            return None
    return None


class UnixSocketRotatorClient:
    """HTTP-over-Unix-socket client for the secret rotator."""

    def __init__(self, path: str | None = None, token: str | None = None, timeout: float = 30.0):
        self.path = path or socket_path()
        self._token = token
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        token = self._token if self._token is not None else _read_token()
        if not token:
            raise RotatorUnavailable(
                "No rotator token configured (set SECRET_ROTATOR_TOKEN or SECRET_ROTATOR_TOKEN_FILE)."
            )
        return {"Authorization": f"Bearer {token}", "Accept": "application/json"}

    async def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
        if not os.path.exists(self.path):
            raise RotatorUnavailable(f"Rotator socket not found at {self.path}.")
        headers = self._headers()
        transport = httpx.AsyncHTTPTransport(uds=self.path)
        try:
            async with httpx.AsyncClient(
                transport=transport, base_url="http://secret-rotator", timeout=self.timeout
            ) as client:
                response = await client.request(method, path, json=payload, headers=headers)
        except httpx.TimeoutException:
            # Deliberately not chaining the original exception: httpx error
            # objects carry the request, and the request carries the values.
            raise RotatorUnavailable("Rotator did not answer before the timeout.") from None
        except httpx.HTTPError as exc:
            raise RotatorUnavailable(f"Rotator socket unreachable ({type(exc).__name__}).") from None
        if response.status_code in (401, 403):
            raise RotatorUnavailable(f"Rotator rejected the dashboard token (HTTP {response.status_code}).")
        try:
            body = response.json()
        except ValueError:
            body = None
        if response.status_code >= 400:
            detail = ""
            if isinstance(body, dict):
                detail = str(body.get("detail") or body.get("error") or body.get("message") or "")
            raise RotatorError(response.status_code, detail[:500] or f"HTTP {response.status_code}")
        return body

    async def list_secrets(self) -> list[dict[str, Any]]:
        body = await self._request("GET", "/v1/secrets")
        if isinstance(body, dict) and isinstance(body.get("secrets"), list):
            body = body["secrets"]
        if not isinstance(body, list):
            raise RotatorError(502, "Rotator returned an unexpected /v1/secrets payload.")
        return [item for item in body if isinstance(item, dict)]

    async def rotate(
        self,
        *,
        name: str,
        values: Mapping[str, str],
        confirm: str,
        actor: str,
        dry_run: bool,
    ) -> dict[str, Any]:
        payload = {
            "name": name,
            "values": dict(values),
            "confirm": confirm,
            "actor": actor,
            "dryRun": bool(dry_run),
        }
        body = await self._request("POST", "/v1/rotate", payload)
        return body if isinstance(body, dict) else {"steps": []}

    async def verify(self, name: str) -> dict[str, Any]:
        body = await self._request("POST", "/v1/verify", {"name": name})
        return body if isinstance(body, dict) else {}


_client_override: RotatorClient | None = None


def get_client() -> RotatorClient:
    return _client_override if _client_override is not None else UnixSocketRotatorClient()


def set_client_for_tests(client: RotatorClient | None) -> None:
    global _client_override
    _client_override = client


# ---------------------------------------------------------------------------
# Value scrubbing
# ---------------------------------------------------------------------------


def scrub(obj: Any, secrets_to_hide: Iterable[str]) -> Any:
    """Return ``obj`` with every occurrence of any secret string replaced."""
    hidden = sorted({s for s in secrets_to_hide if isinstance(s, str) and len(s) >= 4}, key=len, reverse=True)
    if not hidden:
        return obj

    def _walk(value: Any) -> Any:
        if isinstance(value, str):
            for secret in hidden:
                if secret in value:
                    value = value.replace(secret, REDACTED)
            return value
        if isinstance(value, dict):
            return {_walk(k): _walk(v) for k, v in value.items()}
        if isinstance(value, (list, tuple)):
            return [_walk(v) for v in value]
        return value

    return _walk(obj)


# ---------------------------------------------------------------------------
# Request validation (manual, so bodies are never reflected)
# ---------------------------------------------------------------------------


class RotateRequestInvalid(Exception):
    """Validation failure with a fixed, value-free message."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def parse_rotate_body(name: str, body: Any) -> tuple[dict[str, str], bool]:
    if not isinstance(body, dict):
        raise RotateRequestInvalid("Request body must be a JSON object.")
    confirm = body.get("confirm")
    if not isinstance(confirm, str) or confirm != name:
        raise RotateRequestInvalid("Confirmation does not match the secret name.")
    dry_run = body.get("dryRun", False)
    if not isinstance(dry_run, bool):
        raise RotateRequestInvalid("dryRun must be a boolean.")
    values = body.get("values")
    if not isinstance(values, dict) or not values:
        raise RotateRequestInvalid("values must be a non-empty object of NAME -> new value.")
    clean: dict[str, str] = {}
    for key, value in values.items():
        if not isinstance(key, str) or not SECRET_NAME_RE.match(key):
            raise RotateRequestInvalid("values keys must be secret names (A-Z, 0-9, _).")
        if not isinstance(value, str) or not value.strip():
            raise RotateRequestInvalid(f"A non-empty string value is required for {key}.")
        if len(value) > MAX_VALUE_LENGTH:
            raise RotateRequestInvalid(f"The value for {key} is too long.")
        clean[key] = value
    if name not in clean:
        raise RotateRequestInvalid(f"values must include {name}.")
    return clean, dry_run


# ---------------------------------------------------------------------------
# History (ops_secret_rotations)
# ---------------------------------------------------------------------------


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _secret_class(name: str) -> str:
    try:
        from hermes_cli.system_operations import _secret_class as impl

        return impl(name)
    except Exception:
        return "variable"


def summarize_result(steps: list[dict[str, Any]], dry_run: bool) -> str:
    if any(str(step.get("status", "")).lower() in FAILED_STEP_STATUSES for step in steps):
        return "failed"
    return "dry-run" if dry_run else "ok"


def record_rotation(
    *,
    name: str,
    actor: str,
    result: str,
    dry_run: bool,
    provider: str | None = None,
    steps: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    """Write one ``ops_secret_rotations`` row. Never receives values."""
    at = _now_iso()
    rotated = result == "ok" and not dry_run
    step_counts: dict[str, int] = {}
    for step in steps or []:
        status = str(step.get("status") or "unknown").lower()
        step_counts[status] = step_counts.get(status, 0) + 1
    record = {
        "id": f"{HISTORY_ID_PREFIX}{uuid4().hex}",
        "provider": provider or "secret-rotator",
        "secret_name": name,
        "secret_class": _secret_class(name),
        "last_rotated_at": at if rotated else None,
        "age_days": 0 if rotated else None,
        "proof_id": "",
        "payload": {
            "kind": "rotation",
            "actor": actor,
            "result": result,
            "dryRun": dry_run,
            "at": at,
            "stepCounts": step_counts,
        },
    }
    try:
        from hermes_cli.system_warehouse import _upsert_ops_record

        _upsert_ops_record("ops_secret_rotations", dict(record))
    except Exception:
        _log.warning("secret rotation history write failed for %s", name)
        return None
    return {"at": at, "actor": actor, "result": result, "dryRun": dry_run}


def load_history(limit: int = 500) -> dict[str, list[dict[str, Any]]]:
    """Rotation events recorded by this dashboard, newest first, by name.

    Rows written by the presence-only credential scan
    (``ops-secret-rotation-<NAME>``) are ignored: their ``last_rotated_at``
    is the scan time, not a rotation.
    """
    import json

    history: dict[str, list[dict[str, Any]]] = {}
    try:
        from hermes_cli.operating_runtime import connect

        with connect() as conn:
            rows = conn.execute(
                "SELECT secret_name, payload, recorded_at FROM ops_secret_rotations "
                "WHERE id LIKE ? ORDER BY recorded_at DESC LIMIT ?",
                (f"{HISTORY_ID_PREFIX}%", max(1, min(limit, 2000))),
            ).fetchall()
    except Exception:
        return history
    for row in rows:
        try:
            payload = json.loads(row["payload"] or "{}")
        except (TypeError, ValueError):
            payload = {}
        if payload.get("kind") != "rotation":
            continue
        history.setdefault(str(row["secret_name"]), []).append({
            "at": payload.get("at") or row["recorded_at"],
            "actor": payload.get("actor") or "unknown",
            "result": payload.get("result") or "unknown",
            "dryRun": bool(payload.get("dryRun")),
        })
    return history


def _age_days(iso: str | None) -> int | None:
    if not iso:
        return None
    try:
        parsed = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return max(0, (datetime.now(timezone.utc) - parsed).days)


def _last_dashboard_rotation(events: list[dict[str, Any]]) -> str | None:
    for event in events:
        if event.get("result") == "ok" and not event.get("dryRun"):
            return event.get("at")
    return None


def _str_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item) for item in value if isinstance(item, (str, int, float))]


def normalize_secret(item: Mapping[str, Any], events: list[dict[str, Any]]) -> dict[str, Any]:
    name = str(item.get("name") or "")
    last_rotated = item.get("lastRotatedAt") or _last_dashboard_rotation(events)
    age = item.get("ageDays")
    if not isinstance(age, int):
        age = _age_days(last_rotated)
    server = []
    for loc in item.get("server") or []:
        if isinstance(loc, dict) and loc.get("path"):
            server.append({"path": str(loc["path"]), "present": bool(loc.get("present"))})
    last_verify = item.get("lastVerify")
    if isinstance(last_verify, dict):
        last_verify = {
            "status": str(last_verify.get("status") or "unknown"),
            "checkedAt": last_verify.get("checkedAt"),
        }
    else:
        last_verify = None
    rotate_url = item.get("rotateUrl")
    if not (isinstance(rotate_url, str) and rotate_url.startswith(("https://", "http://"))):
        rotate_url = None
    return {
        "name": name,
        "provider": str(item.get("provider")) if item.get("provider") else None,
        "kind": str(item.get("kind")) if item.get("kind") else _secret_class(name),
        "rotateUrl": rotate_url,
        "pairWith": _str_list(item.get("pairWith")),
        "server": server,
        "services": _str_list(item.get("services")),
        "lastRotatedAt": last_rotated,
        "ageDays": age,
        "lastVerify": last_verify,
        "history": events[:5],
    }


def _known_names_from_credential_health() -> list[str]:
    try:
        from hermes_cli.system_operations import credentials_summary

        summary = credentials_summary()
        return [
            str(var.get("name"))
            for var in summary.get("runtimeVariables") or []
            if var.get("name")
        ]
    except Exception:
        return []


async def rotation_status(client: RotatorClient | None = None) -> dict[str, Any]:
    """Payload for ``GET /api/secrets/rotation``. Never raises."""
    history = load_history()
    base = {
        "generatedAt": _now_iso(),
        "socket": socket_path(),
        "readme": ROTATOR_README_HINT,
        "secretExposurePolicy": "values_never_returned",
    }
    try:
        items = await (client or get_client()).list_secrets()
    except RotatorUnavailable as exc:
        reason = exc.reason
    except RotatorError as exc:
        reason = f"Rotator error (HTTP {exc.status_code}): {exc.detail}"
    except Exception as exc:  # noqa: BLE001 - this endpoint must never 500
        reason = f"Rotator request failed ({type(exc).__name__})."
    else:
        secrets_out = [
            normalize_secret(item, history.get(str(item.get("name") or ""), []))
            for item in items
            if item.get("name")
        ]
        return {**base, "connected": True, "reason": None, "secrets": secrets_out}

    names = list(dict.fromkeys([*_known_names_from_credential_health(), *history.keys()]))
    secrets_out = [normalize_secret({"name": name}, history.get(name, [])) for name in names]
    return {**base, "connected": False, "reason": reason, "secrets": secrets_out}
