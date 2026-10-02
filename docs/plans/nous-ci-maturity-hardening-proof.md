# Nous CI Maturity Hardening Proof

Date: 2026-10-01

## Scope

This proof closes the CI maturity lane opened after the Nous Hermes GitHub run failed across dashboard auth, MCP OAuth, provider parity, SessionDB event-loop safety, and the web workspace checks.

Failed reference run:

- `https://github.com/Ai-Builder-hub-1/hermes-agent/actions/runs/36904150596`

## Eight-Phase Completion

1. Reproduced the failing CI areas locally with the exact focused Python test group.
2. Restored dashboard auth hardening so non-loopback binds require the OAuth gate even when `allow_public` is true.
3. Restored loopback WebSocket fail-closed behavior for missing or empty peer hosts.
4. Restored dashboard-hosted MCP OAuth flow support, including pending-flow registry, stable callback route, callback delivery, flow status, overlap protection, and bounded pending flow count.
5. Reconnected provider parity so `/api/env` and `/api/providers/oauth` derive membership from the canonical provider catalog.
6. Moved required SessionDB handlers onto `asyncio.to_thread` so DB open and work happen off the event loop.
7. Re-ran the web workspace check that failed in CI.
8. Added this proof packet and linked it from the canonical plan registry.

## Code Changes

- `hermes_cli/web_server.py`
  - Hardened `should_require_auth`.
  - Added pytest-only TestClient host alias handling without expanding the production loopback allowlist.
  - Added canonical provider rows to `/api/env`.
  - Added account-provider fallback rows to `/api/providers/oauth`.
  - Added dashboard MCP OAuth routes and pending-flow registry.
  - Added read-only/sandbox fallback for MCP server definitions when config persistence is unavailable.
  - Added `_run_sessiondb_work` and offloaded required SessionDB handlers.
- `hermes_cli/provider_catalog.py`
  - Added canonical env-row fallbacks for Vertex and Bedrock.

## Validation

Focused Python CI maturity gate:

```bash
UV_CACHE_DIR=/tmp/uv-cache uv run pytest \
  tests/hermes_cli/test_dashboard_auth_gate.py \
  tests/hermes_cli/test_dashboard_auth_ws_auth.py \
  tests/hermes_cli/test_mcp_dashboard_oauth.py \
  tests/hermes_cli/test_provider_parity.py \
  tests/test_web_server_sessiondb_eventloop.py -q
```

Result:

- `88 passed`

Web workspace CI gate:

```bash
npm run --prefix web check
```

Result:

- Typecheck passed.
- Vitest passed: `28` files, `197` tests.

## Residual Notes

- The local sandbox cannot write uv/pytest cache files under the default user cache path, so validation used `UV_CACHE_DIR=/tmp/uv-cache`.
- The web check required unsandboxed execution because Vite/Vitest writes temporary files under `web/node_modules/.vite-temp`.
