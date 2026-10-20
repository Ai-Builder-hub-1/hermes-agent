# Key rotation page — 2026-10-20

Branch: `feat/key-rotation-page` (from `ai-builder/main`). Not merged, not deployed.

## Done

- **Rotator client**: `hermes_cli/secret_rotation.py`. HTTP over a Unix socket (httpx `uds=`),
  `Authorization: Bearer <token>`. It implements the rotator contract exactly:
  `GET /v1/secrets`, `POST /v1/rotate {name, values, confirm, actor, dryRun}`,
  `POST /v1/verify {name}`. A test override is available through `set_client_for_tests`.
- **API** (`hermes_cli/web_server.py`):
  - `GET /api/secrets/rotation` merges the rotator inventory with this dashboard's own rotation
    events from `ops_secret_rotations`. If the rotator is missing, unreachable or rejects the
    token, it returns `{connected:false, reason, secrets:[names from credential health + history]}`.
    It never returns a 500.
  - `POST /api/secrets/rotation/{name}/rotate` uses `_require_token`, the same check as
    `/api/env/reveal`: the auth gate session in gated mode, otherwise the ephemeral session token.
    It allows 3 requests a minute. `confirm` must equal `name`, and `values` must include `name`
    (plus any pair halves). The actor is the gate session's email, else `local-dashboard`.
    The route writes an `ops_secret_rotations` row with id `ops-secret-rotation-event-*` and
    payload `{kind:"rotation", actor, result, dryRun, at, stepCounts}`. It also logs with `_log.info`
    like reveal does, and writes an audit event `secret_rotation` to `dashboard-auth.log`.
  - `POST /api/secrets/rotation/{name}/verify` proxies the rotator's verify call.
  - Value safety:
    - The body is parsed by hand, so no Pydantic 422 can reflect input.
    - A scoped `RequestValidationError` handler strips `input` from errors on `/api/secrets/rotation*`. Other routes keep the default handler.
    - httpx exceptions are not chained, so their exception messages cannot carry values.
    - Rotator responses are scrubbed of the submitted values before they are returned.
- **UI**: `web/src/pages/KeyRotationPage.tsx`, route `/key-rotation`, with logic in `web/src/lib/key-rotation.ts`.
  - Nav entries: System group after Credentials, and next to Keys in `BUILTIN_NAV_REST`. Page metadata is added.
  - Status table: riskiest first. Age is amber above 90 days and red above 180 days or when never rotated. It also shows last verify, server copies present/total, services and a Mac hint. Filters cover provider, status and name.
  - Rotate dialog:
    1. Link to the provider's `rotateUrl`.
    2. Password inputs (both halves for a pair) with `autocomplete=off`. The values live in reducer state only and are wiped on submit and on close.
    3. Type the name to confirm.
    4. Dry run first (on by default), then file/service/verify step results.
    5. Reminder with `hermes-keys rotate NAME --mac-only` and a copy button.
  - Verify now is available in each row and in the dialog.
  - Disconnected banner "Rotator not connected on this server" points to
    `deploy/secret-rotator/README.md` in the hermes repo.
  - `/server-secret-posture-scanner` links to the new page. `/secrets-posture` still redirects
    to `/system/credentials`.
- **Tests**:
  - `tests/hermes_cli/test_secret_rotation.py` has 18 tests. They run against a fake rotator
    serving the contract on a temporary Unix socket, so the real client is exercised. They cover:
    merge, disconnected, token rejection, happy path, dry run, failed step, confirm mismatch,
    a missing or wrong session token, the gated-mode session requirement, the 3/min rate limit,
    rotator unavailable, the token file, and a fake value never appearing in responses,
    caplog, the audit log, ops rows or validation errors.
  - `web/src/lib/key-rotation.test.ts` covers thresholds, risk order, filters, confirm gating,
    and values clearing on submit, close and after a dry run.
- Checked by hand in a local dashboard against a fake rotator, at 1440px and 390px. Both the
  connected and disconnected states render. Mobile has no horizontal page scroll and there
  were no page errors.

## Environment / deploy wiring (not done here)

- `SECRET_ROTATOR_SOCKET`: defaults to `/run/secret-rotator/rotator.sock`.
- `SECRET_ROTATOR_TOKEN_FILE`: the preferred way to supply the token. `SECRET_ROTATOR_TOKEN` also works.
- The hermes repo's compose change must mount the rotator socket directory, and the token
  file, into the dashboard container. For example `/run/secret-rotator:/run/secret-rotator`,
  with the token file mounted read-only. Socket permissions must allow the dashboard's user.
  See `deploy/secret-rotator/README.md` in the hermes repo.

## Open

- The pair check is light. The dashboard requires `values[name]`, and the UI asks for all
  `pairWith` halves. Whether the pairing is complete is left to the rotator.
- In loopback mode the actor is `local-dashboard`. There is no per-user identity without the gate.
- The rate limit is per process and in memory, the same as reveal.
- The older credential scan writes placeholder `ops-secret-rotation-<NAME>` rows whose
  `last_rotated_at` is the scan time. This page ignores them. The credential-health
  `rotationAgeDays` field is still a placeholder.
- The web app does not import `@hermes/dashboard-kit` React components. The page follows the
  existing pages: `@nous-research/ui` plus `data-hdk-component` markers.

## Next steps

1. Land the rotator and compose socket mount in the hermes repo. Then set
   `SECRET_ROTATOR_TOKEN_FILE` on hermes-os.
2. Review and merge this branch, then deploy through the normal backbone.
3. On https://agent.tlccapitalgroup.com/key-rotation, confirm `connected:true`, run a dry run,
   then do one real rotation of a low-risk key. Then run `hermes-keys rotate NAME --mac-only`
   on the Mac.
