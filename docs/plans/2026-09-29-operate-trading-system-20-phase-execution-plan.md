# Operate, Trading, and System 20-Phase Execution Plan

Generated: 2026-09-29

Purpose: execute all 20 dashboard maturity phases back to back, with clear dependencies, implementation scope, test gates, and commit checkpoints.

This plan assumes the dashboard should move from static maturity pages to live operational control surfaces, then into predictive/cause-aware/self-auditing operations.

## Execution Rules

1. Work in order unless a phase explicitly depends on production secrets, external infrastructure, or a missing upstream service.
2. Every phase must leave a typed API/client contract, UI implementation, and tests where code changes are involved.
3. Every page must expose loading, empty, error, stale, and partial-data states.
4. Every dangerous operation stays approval-gated.
5. Every safe action must write audit/evidence records.
6. Each phase should end with a commit-ready checkpoint.

## Standard Test Gate

Run the narrowest relevant checks after each phase, then run the broad checks before a commit:

- `uv run pytest <targeted backend tests>`
- `npm test --workspace web -- <targeted frontend tests>`
- `npm run typecheck --workspace web`
- `npm test --workspace web`
- `npm run build --workspace web`
- dashboard design-system status hook on commit

Use Playwright/dashboard route validation after UI-heavy phases:

- route renders
- no placeholder text
- loading/empty/error/stale states render
- charts have non-empty data or honest empty states
- safe actions produce evidence/audit records

## Phase 1: Page Contract Registry

Status: partially built in `web/src/lib/operational-page-contracts.ts`.

Build:

- Expand the route contract registry to every Operate, Trading, and System route.
- Add fields for owner, live sources, chart requirements, evidence contract, safe actions, dangerous actions, SLOs, and test coverage.
- Add route-level score calculation.
- Add visible page maturity strip to Operate, Trading, and System pages.
- Add regression tests that every registered route has a contract.

Done when:

- Every route has a contract.
- Every route can be classified as static, actionable, live, charted, controlled, or intelligent.
- Missing maturity is visible inside the UI, not only in docs.

Tests:

- `npm test --workspace web -- operational-page-contracts`
- `npm run typecheck --workspace web`

## Phase 2: System Warehouse

Status: first operational slice built in commit `424997e14`.

Build next:

- Replace inferred series with persisted warehouse job history when available.
- Add production collector/mirror/prune execution records.
- Add restore proof manifest detail drawer.
- Add project/source drilldown by Nous Hermes, Khashi VC, Investing System, Hermes Brain.
- Add Playwright validation for `/system/warehouse`.

Done when:

- Warehouse shows capacity, ingest, freshness, mirror, prune, restore proof, SLO, jobs, evidence, and safe actions.
- All warehouse safe actions write audit/evidence.
- Production and local roots are clearly labeled.

Tests:

- `uv run pytest tests/hermes_cli/test_system_warehouse.py`
- `npm test --workspace web -- system-warehouse`
- Playwright route validation for `/system/warehouse`

## Phase 3: System Storage, Freshness, and Workers

Build:

- Add `/api/system/storage/summary`, `/series`, `/artifacts`, `/cleanup-candidates`.
- Add `/api/system/freshness/summary`, `/sources`, `/series`, `/breaches`.
- Add `/api/system/workers/summary`, `/runs`, `/series`, `/logs`, `/actions`.
- Convert `/system/storage`, `/system/freshness`, and `/system/workers` from static maturity pages into live consoles.
- Add charts:
  - storage growth
  - freshness lag
  - worker run duration/failures
- Add safe actions:
  - storage scan
  - freshness check
  - worker dry-run/rerun where read-only or explicitly approved

Done when:

- Storage answers what is using space and what can be cleaned safely.
- Freshness answers what is stale and why.
- Workers answer what ran, what failed, and what runs next.

Tests:

- backend tests for storage/freshness/workers contracts
- frontend tests for clients and page states
- route validation for `/system/storage`, `/system/freshness`, `/system/workers`

## Phase 4: System Deployments and Credentials

Build:

- Add deployment summary contract:
  - deployed SHA
  - environment
  - health
  - last promotion
  - rollback proof
  - pending promotion queue
- Add credentials posture contract:
  - presence-only secret scan
  - missing secret classes
  - stale/rotation status
  - project coverage
  - safe test actions
- Convert `/system/deployments` and `/system/credentials` into live consoles.

Done when:

- Deployments page can answer what is currently deployed and whether rollback proof exists.
- Credentials page can answer what is missing without exposing secret values.

Tests:

- backend endpoint tests
- frontend client tests
- route validation for `/system/deployments`, `/system/credentials`

## Phase 5: Trading Strategies and Backtesting

Build:

- Add strategy candidate contract:
  - hypothesis
  - source evidence
  - expected edge
  - falsification criteria
  - readiness
  - promotion gate
- Add backtesting contract:
  - dataset window
  - assumptions
  - fees/slippage
  - run status
  - results
  - failures
  - comparison charts
- Convert `/trading/strategies` and `/trading/backtesting` from static proof-chain pages into live research consoles.

Done when:

- Strategies page shows actual candidates and what blocks promotion.
- Backtesting page shows actual runs, results, and assumptions.

Tests:

- backend strategy/backtest contract tests
- frontend strategy/backtest tests
- route validation for `/trading/strategies`, `/trading/backtesting`

## Phase 6: Trading Evidence

Build:

- Add trading evidence ledger:
  - source project
  - strategy
  - backtest
  - decision
  - risk event
  - broker/source feed
  - artifact
  - proof hash
- Add `/trading/evidence` dedicated route instead of reusing the generic trading surface.
- Link evidence from Khashi, Investing System, Head Trader, risk, strategies, and backtesting.

Done when:

- Every trading decision/risk warning/strategy/backtest can show its proof.

Tests:

- evidence contract tests
- route validation for `/trading/evidence`

## Phase 7: Operate Evidence and Runtime Hydration

Build:

- Make Operate pages server-first:
  - load `/api/operating-runtime/summary`
  - load evidence/audit/incidents/deployments/data-sources/evals/autonomy-controls
  - fall back to local/seed only when server is unavailable
- Add dedicated `/operate/evidence` page.
- Add drilldowns from blockers/actions/runs/incidents to evidence.
- Add closeout proof model.

Done when:

- Operate pages are backed by live runtime data.
- Evidence page answers what proof exists and what it closes.

Tests:

- Operate runtime hydration tests
- route validation for `/operate`, `/operate/evidence`, `/operate/actions`, `/operate/runs`

## Phase 8: Charts and Time Windows Everywhere

Build:

- Standardize time windows:
  - 1h
  - 24h
  - 7d
  - 30d
- Add approved chart components to:
  - Warehouse
  - Storage
  - Freshness
  - Workers
  - Deployments
  - Strategies
  - Backtesting
  - Trading risk
  - Operate incidents/runs
- Add honest empty states when history is not available.

Done when:

- Every operational page shows trend or explicitly explains why trend history is unavailable.

Tests:

- frontend chart rendering tests
- dashboard design-system adoption checks
- Playwright screenshot checks for chart non-empty states

## Phase 9: Safe Actions and Audit Writeback

Build:

- Define safe action registry.
- Add audit writeback for every safe action.
- Add permission checks for dangerous actions.
- Add result proof:
  - success
  - failure
  - no-op
  - superseded
  - denied
- Expose action result history in Operate and relevant System/Trading pages.

Done when:

- No page has an action button that fails to write audit/evidence.
- Dangerous actions are impossible without explicit approval.

Tests:

- backend permission/audit tests
- frontend action tests
- route action validation

## Phase 10: End-to-End Operational Proof

Build:

- Add E2E dashboard validation suite across all Operate, Trading, and System pages.
- Validate:
  - no page is placeholder unless explicitly classified static
  - no misleading metrics
  - all loading/error/empty/stale states exist
  - all live pages have API data or an honest degraded state
  - all actions write evidence
- Add maturity score report generated from contracts and route validation.

Done when:

- The dashboard can prove which pages are operational and which are still partial.

Tests:

- full web tests
- Playwright route suite
- generated maturity report assertions

## Phase 11: Predictive Operations

Build:

- Forecast warehouse capacity.
- Detect ingest slowdowns against historical baselines.
- Predict worker failure risk from recent failures, deploys, credential age, and stale evidence.
- Add forecast cards to Warehouse, Freshness, Workers, Operate.
- Add early warning records before hard alerts.

Done when:

- Pages tell what is likely to fail next, not only what already failed.

Tests:

- forecast algorithm unit tests
- stale/slowdown fixtures
- UI warning-state tests

## Phase 12: Cross-System Causality

Build:

- Add causal event graph:
  - collector
  - warehouse job
  - source stale state
  - dashboard stale state
  - blocker
  - Discord alert
  - operator action
  - evidence closeout
- Add correlation IDs to new runtime events.
- Add causal timeline components to Operate/System/Trading.

Done when:

- An operator can see the chain from root event to business impact.

Tests:

- causality graph tests
- timeline rendering tests
- correlation ID propagation tests

## Phase 13: Automated Evidence Capture

Build:

- Capture API snapshots after important state changes.
- Capture screenshots after route validation, deploys, production checks, warehouse actions, and restore proof.
- Attach logs, payload hashes, manifest hashes, and SHAs.
- Add retention/dedupe for evidence artifacts.

Done when:

- Important state changes automatically leave proof.

Tests:

- evidence capture tests
- screenshot artifact tests where Playwright is available
- dedupe/retention tests

## Phase 14: SLO and SLA Layer

Build:

- Define SLOs:
  - warehouse freshness
  - mirror lag
  - restore proof cadence
  - worker success rate
  - trading source freshness
  - alert acknowledgement
- Add SLO breach and burn-rate indicators.
- Add SLO history by source/project/page.

Done when:

- The dashboard shows whether the system is meeting its operating promises.

Tests:

- SLO calculation tests
- breach rendering tests
- SLO history tests

## Phase 15: Remediation Playbooks

Build:

- Add playbook registry:
  - issue type
  - diagnosis
  - read-only checks
  - safe actions
  - approval-gated actions
  - rollback
  - closeout proof
- Link playbooks to blockers, incidents, stale sources, workers, credentials, deployments, and trading source issues.
- Add guided remediation panels.

Done when:

- Every issue type tells the operator exactly what to check and how to close it safely.

Tests:

- playbook registry tests
- UI guidance tests
- action permission tests

## Phase 16: Autonomous Triage With Human Approval

Build:

- Add triage classifier:
  - severity
  - owner
  - likely cause
  - affected project
  - suggested next action
- Auto-create triage packets.
- Draft remediation commands without executing dangerous actions.
- Add approval, denial, superseded, and learning feedback.

Done when:

- Hermes can prepare the work, but dangerous execution still requires approval.

Tests:

- classifier tests
- approval packet tests
- denial/superseded audit tests

## Phase 17: Business Impact Layer

Build:

- Map technical sources to business units:
  - Khashi VC
  - Investing System
  - Nous Hermes
  - Hermes Brain
  - Second Brain
- Add impact severity next to technical severity.
- Show affected decisions/workflows.
- Tie stale/missing data to trading, analysis, memory, operations, and restoration confidence.

Done when:

- A technical problem explains what business capability is impaired.

Tests:

- impact mapping tests
- UI impact labels
- stale source to business impact fixtures

## Phase 18: Historical Reliability Score

Build:

- Score reliability by:
  - project
  - page
  - source
  - worker
  - business unit
- Inputs:
  - successful runs
  - failed runs
  - stale duration
  - incident count
  - unresolved blockers
  - restore proof age
  - evidence completeness
  - alert acknowledgement
- Add score trends and regressions after deploys/config changes.

Done when:

- The dashboard can rank reliability and show what changed it.

Tests:

- scoring tests
- regression detection tests
- score display tests

## Phase 19: Capacity and Cost Intelligence

Build:

- Attribute warehouse growth by project/source/type/retention class.
- Attribute compute/provider costs by project/workflow.
- Identify high-growth low-use datasets.
- Recommend archive/compress/prune/retain decisions.
- Link data value to retrieval, audit, restore, analysis, and trading use.

Done when:

- The system can explain what is growing, what it costs, and whether it is worth keeping.

Tests:

- attribution tests
- recommendation tests
- retention value tests

## Phase 20: Self-Auditing Dashboard

Build:

- Continuously audit:
  - pages without live data
  - pages without loading/error/empty/stale states
  - charts without real series
  - actions without audit writeback
  - routes without tests
  - labels that overpromise
  - pages without owners
- Generate maturity score by route.
- Auto-create actions/issues when a page regresses.

Done when:

- The dashboard can identify its own maturity gaps and create follow-up work automatically.

Tests:

- self-audit engine tests
- generated report tests
- regression fixture tests

## Back-to-Back Batch Order

To reduce context switching, execute the 20 phases in these batches:

### Batch A: Foundation and System Core

- Phase 1: Page Contract Registry
- Phase 2: System Warehouse
- Phase 3: System Storage/Freshness/Workers
- Phase 4: System Deployments/Credentials

Commit checkpoint:

- `Build system operational contracts and consoles`

### Batch B: Trading and Operate Core

- Phase 5: Trading Strategies/Backtesting
- Phase 6: Trading Evidence
- Phase 7: Operate Evidence/Runtime Hydration

Commit checkpoint:

- `Build trading and operate live evidence surfaces`

### Batch C: Operational Proof and Actions

- Phase 8: Charts/Time Windows
- Phase 9: Safe Actions/Audit Writeback
- Phase 10: End-to-End Operational Proof

Commit checkpoint:

- `Add operational proof and action audit gates`

### Batch D: Intelligence Layer

- Phase 11: Predictive Operations
- Phase 12: Cross-System Causality
- Phase 13: Automated Evidence Capture
- Phase 14: SLO/SLA Layer

Commit checkpoint:

- `Add predictive operations and evidence intelligence`

### Batch E: Autonomy, Impact, Reliability, Cost, Self-Audit

- Phase 15: Remediation Playbooks
- Phase 16: Autonomous Triage With Human Approval
- Phase 17: Business Impact Layer
- Phase 18: Historical Reliability Score
- Phase 19: Capacity and Cost Intelligence
- Phase 20: Self-Auditing Dashboard

Commit checkpoint:

- `Add self-auditing operational intelligence`

## Practical Constraints

Most of this can be built back to back. The only likely blockers are:

- production-only credentials or endpoints not available locally
- missing upstream project APIs from Khashi VC or Investing System
- external collector/mirror/prune jobs not deployed yet
- Playwright/browser availability in the environment
- production Discord alert/action integration requiring live credentials

When blocked by production-only access, still build:

- typed contract
- mock/degraded state
- UI surface
- test fixtures
- clear blocker/action row
- evidence expectation

## First Next Implementation Move

Continue from the work already done in commit `424997e14`:

1. Expand `operational-page-contracts.ts` to all routes.
2. Build `/system/storage`, `/system/freshness`, and `/system/workers` live contracts.
3. Convert those three System pages next.
4. Add route validation for Warehouse/Storage/Freshness/Workers.

That knocks out the rest of Batch A and gives the later phases a solid substrate.
