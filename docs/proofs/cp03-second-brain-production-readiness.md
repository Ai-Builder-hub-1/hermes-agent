# CP-03 Second-Brain Production Readiness Proof

Generated: 2026-10-02

## Scope

This proof covers the CP-03 runtime blocker: Hermes Brain connectivity, service-token guarded endpoints, warehouse status, compounding intelligence, retrieval packs, decision intelligence, contradiction intelligence, research tasks, and preflight metrics.

## Production Runtime Evidence

Production containers:

- `deploy-hermes-brain-1`: healthy.
- `deploy-nous-hermes-agent-1`: healthy.
- Nous runtime env includes `HERMES_BRAIN_URL=http://hermes-brain:3115`.
- Nous and Hermes Brain both have a shared `HERMES_BRAIN_SERVICE_TOKEN` configured.

Direct service checks from the Nous container to Hermes Brain passed for:

- `/health`
- `/api/brain/audit`
- `/api/brain/warehouse/status`
- `/api/brain/compounding-intelligence`
- `/api/brain/retrieval-pack?q=production&project=nous-hermes-agent`
- `/api/brain/candidates/review-queue`
- `/api/brain/decisions`
- `/api/brain/contradictions`
- `/api/brain/research-tasks`
- `/api/brain/preflight-checks`
- `/api/brain/decision-intelligence/metrics`

Hermes Brain production proof commands passed:

- `npm run proof:second-brain`
- `npm run proof:decision-intelligence`
- `npm run proof:compounding-intelligence`

The compounding proof returned:

- maturity score: `100`
- status: `ready`
- phases ready: `10/10`
- source systems covered: Nous Hermes, Hermes Brain, Investing System, Khashi VC, TLC Capital Group OS
- retrieval-pack citations: present
- warehouse sync events: present

## Gap Found And Fixed

The Hermes Brain API process cached the JSON repository after first read. Production proof scripts update `/data/brain.json` out-of-process, so the running API could keep serving an older in-memory view until restart.

Fix:

- `JsonFileBrainRepository` now tracks the durable file mtime and reloads when another process updates the JSON file.
- Regression coverage proves records written by an external proof process are visible to the long-running repository instance.

Follow-up proof:

- Local Hermes Brain API served proof-script records without restart after external writes.
- `/api/brain/audit` returned `6` nodes, `2` edges, `7` candidates, and source coverage for the expected five systems.
- `/api/brain/compounding-intelligence` returned maturity score `100`, status `ready`, and `10/10` ready phases.

Operational note:

- Hermes Brain proof scripts should run sequentially against the same JSON repository. They are safe for proof seeding when run one at a time; concurrent proof-script execution can race on the same JSON file and should be avoided or moved behind a future file-locking/job-queue layer.

## Nous Operational Improvement

Hermes Brain already supported contradiction resolution, but Nous only exposed contradiction detection/read views. Nous now includes:

- backend proxy route: `POST /api/second-brain/contradictions/{id}/resolve`
- frontend client: `resolveContradiction(...)`
- contradiction dashboard actions: `Resolve` and `False positive`
- frontend and backend regression tests
- operational safe-action contract entry for contradiction resolution

## Tests

Hermes Brain:

- `npm test`: passed, `11/11`
- `npm run build`: passed

Nous Hermes:

- `npm run test --workspace web -- second-brain`: passed, `8/8`
- `uv run pytest -q tests/test_second_brain_proxy.py`: passed, `1/1`
- `npm run build --workspace web`: passed
- `npm run dashboard:operational-sources:validate -- --base-url http://127.0.0.1:9121`: passed, `55/55` reachable
- `npm run dashboard:operational-routes:validate -- --base-url http://127.0.0.1:9121`: passed, `36/36` routes
- `npm run dashboard:operational-proof:report`: passed, final report shows `55/55` live sources, `36/36` routes, `28` safe actions, `0` hardening gaps

## Remaining CP-03 Maturity

CP-03 is no longer blocked on basic Hermes Brain runtime connectivity or token availability. Remaining maturity is now higher-level operating proof:

- deploy the repository reload fix to Hermes Brain production
- deploy the Nous contradiction-resolution proxy/UI
- rerun production post-deploy smoke checks for Hermes Brain and Nous
- keep decision-intelligence maintenance on cadence
- prove automatic agent preflight injection before high-impact tasks, not only manual dashboard preflight
- expose report-to-memory and report-to-decision flows from Khashi/Investing into the second brain
