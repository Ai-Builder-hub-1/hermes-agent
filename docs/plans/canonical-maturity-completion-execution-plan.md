# Canonical Maturity Completion Execution Plan

Generated: 2026-10-02

Purpose: provide one trackable execution plan for moving the canonical cross-project registry toward 100% without repeatedly stopping after one slice. This plan covers Nous Hermes Agent, Hermes Brain, Investing System, Khashi VC, and the shared warehouse/command/second-brain layers.

## Operating Rules

1. Build in waves, not isolated one-off fixes.
2. Test each phase before moving to the next phase.
3. If a non-software dependency blocks runtime proof, record it in the blocker tracker and continue building adjacent software, docs, tests, mock contracts, or proof harnesses.
4. Do not mark a phase complete unless the test gate passes or the remaining blocker is explicitly documented with owner, command, evidence path, and next unblock action.
5. Keep destructive pruning, live trading, production broker execution, and autonomous release trains disabled until their explicit approval gates pass.
6. Every high-impact action path must either call second-brain agent preflight or be listed as a gap with an implementation owner.
7. Every phase should produce one of: passing tests, proof artifact, registry update, production smoke result, or blocker tracker entry.

## Blocker Tracker Standard

When a phase hits something that cannot be completed immediately, add a row with:

- `id`: stable blocker id.
- `canonicalPlan`: CP id.
- `type`: credential, production-env, external-service, approval, data-availability, policy, or unknown.
- `impact`: what cannot be proven yet.
- `continuePath`: what can still be built while blocked.
- `owner`: user, project, provider, or operations.
- `unblockCommand`: exact command or dashboard action where possible.
- `evidencePath`: where proof will land after unblocked.

Suggested artifact:

- `docs/plans/canonical-maturity-blocker-tracker.md`
- optional machine-readable mirror: `docs/plans/canonical-maturity-blocker-tracker.json`

## Wave 1: Enforcement Backbone

Goal: close the highest-risk gap first: high-impact workflows must not execute silently when second-brain memory is stale, contradicted, or missing.

### Phase 1.1: Agent Preflight Adapter Registry

Status: built and tested on 2026-10-02.

Scope:

- List every high-impact adapter class: chat, command runner, deploy, warehouse sync, pruning, report generation, provider backfill, trading research, Khashi market intelligence, Discord, Telegram.
- Define which paths are mandatory, optional, or exempt.
- Add a test that fails if a registered high-impact action has no preflight posture.

Test gate:

- Done: registry validator passes.
- Done: unit test proves every high-impact action has one of: `preflight_required`, `preflight_exempt_with_reason`, or `blocked_until_approved`.
- Done: `/api/second-brain/high-impact-workflows` exposes the registry to the dashboard.

### Phase 1.2: Chat And Command Runner Preflight

Status: partially built on 2026-10-02.

Scope:

- Insert `/api/second-brain/agent-preflight` before dashboard chat or command-runner actions that mutate production state, deploy, sync, prune, change credentials, trigger paid providers, or affect trading workflows.
- Show warnings and citations before execution.
- Block execution on `policy: block`.

Test gate:

- Done: `/api/second-brain/high-impact-workflows/{workflow_id}/preflight` lets registered adapters call preflight by stable workflow id.
- Done: locked workflows such as destructive pruning stop before Hermes Brain is called.
- Done: frontend client can call registered workflow preflight.
- Remaining: insert this wrapper directly into chat and command execution paths that mutate production state.

### Phase 1.3: Deploy And Warehouse Preflight

Status: enforcement proof backbone built on 2026-10-02; adapter insertion remains.

Scope:

- Require preflight before deploy/promote commands.
- Require preflight before warehouse mirror, restore, prune, and backfill jobs.
- Ensure blocked preflight writes operating-runtime evidence.

Test gate:

- Done: registered workflow preflight writes operating-runtime evidence for pass/warn, exempt, locked, and blocked outcomes.
- Done: simulated locked workflow prevents destructive action and writes blocked evidence.
- Remaining: wire deploy/promote and warehouse mirror/restore/prune/backfill handlers to call registered workflow preflight before execution.

### Phase 1.4: Messaging Command Layer Enforcement

Scope:

- Apply command authorization and preflight to Discord and Telegram high-impact commands.
- Normalize audit records across both channels.
- Verify reset/password commands remain allowed only to authorized users.

Test gate:

- Discord command auth test passes.
- Telegram command auth test passes or blocker recorded if production bot token/session proof is unavailable.
- Audit log includes actor, channel, command, decision, and outcome.

## Wave 2: Warehouse And Storage Runtime Proof

Goal: prove production does not depend on the local machine or the external drive being mounted, while still syncing durable warehouse artifacts when available.

### Phase 2.1: Production-Independent Runtime Check

Scope:

- Confirm production app/database/storage run without local external mirror.
- Treat external mirror lag as warning-level unless policy escalates it.
- Surface this in Nous System/Warehouse pages.

Test gate:

- CP04 runtime intelligence validator passes.
- Production smoke confirms app health while mirror path is unavailable or marked optional.

### Phase 2.2: Investing Earnings Warehouse Mirror And Restore Proof

Scope:

- Set/verify `EARNINGS_BACKFILL_ARCHIVE_ROOT` and `EARNINGS_WAREHOUSE_ARCHIVE_ROOT` in production.
- Run earnings warehouse mirror proof from production roots.
- Run restore proof and write artifact to Investing docs/proofs.

Test gate:

- Mirror proof passes.
- Restore proof passes.
- Registry updated with proof path.

### Phase 2.3: Khashi Storage And Collector Freshness Proof

Scope:

- Confirm Khashi mounts, collector freshness, retention/archive/recovery checks.
- Prove storage pressure is monitored and build-cache maintenance remains effective.
- Add stale collector alerts where missing.

Test gate:

- Khashi storage maturity proof passes.
- Collector freshness proof produces current timestamp and warning thresholds.

### Phase 2.4: Destructive Pruning Readiness Without Enabling Deletion

Scope:

- Keep deletion disabled.
- Prove dry-run policy, archive presence, backup presence, restore proof, rollup proof, and explicit approval gates.
- Dashboard should explain exactly why deletion remains disabled.

Test gate:

- Prune dry-run proof passes.
- Destructive prune remains disabled by default.

## Wave 3: Investing Earnings And Financial Intelligence

Goal: move CP-06 from built/tested software to production evidence and operational observability.

### Phase 3.1: Provider Capability Verification

Scope:

- Verify Massive stock/options access actually available under current subscription.
- Verify Finnhub or alternate earnings source access.
- Verify Robinhood/Kalshi/Khashi adapters are configured or explicitly blocked.
- Skip paid options quotes if not included; mark quote gap as accepted.

Test gate:

- Provider capability command writes pass/partial/fail per provider.
- Missing paid quote access is recorded as accepted constraint, not a software blocker.

### Phase 3.2: Historical Data Coverage Proof

Scope:

- For original five and first 23 tickers, report earliest/latest daily stock, minute stock, option contract reference, option EOD, earnings events, company structure fields, and provider lineage.
- Include missing coverage and retry plan.

Test gate:

- Coverage report generated.
- Gaps are classified as source unavailable, not collected yet, provider tier missing, or parser issue.

### Phase 3.3: Scaled Backfill Harness

Scope:

- Make backfill job resumable, idempotent, budget-aware, and warehouse-first.
- Add queueing/batching for 200-400 ticker expansion.
- Emit per-ticker storage estimate and projected warehouse growth.

Test gate:

- Dry-run over synthetic or limited universe passes.
- Resume/retry test proves no duplicate rows or corrupted archives.

### Phase 3.4: Frontend Observability

Scope:

- Add/finish dashboard surfaces for provider status, warehouse lifecycle, replay freshness, paper cycles, restricted-live blockers, and stale financial-analysis categories.

Test gate:

- Route validation passes.
- Frontend tests pass.
- Empty/stale/error states covered.

### Phase 3.5: Paper/Review Gate

Scope:

- Keep live execution disabled.
- Add review workflow for simulation outputs, earnings strategy readiness, and restricted-live dossier.

Test gate:

- Paper/review gate blocks live execution.
- Approval proof is required before any live mode.

## Wave 4: Khashi Market Intelligence And Reporting

Goal: move Khashi CP-07 and CP-10 from plan/partial maturity to visible intelligence feeding Nous.

### Phase 4.1: Khashi Collection Cadence

Scope:

- Define source list, cadence, evidence standards, freshness thresholds, and ownership.
- Add adapters or mocks for unavailable production sources.

Test gate:

- Cadence contract validates.
- Freshness report is generated.

### Phase 4.2: Signal Evidence Standard

Scope:

- Every Khashi signal should have source evidence, timestamp, confidence, decision use, and stale policy.
- Store signal outputs in warehouse and second-brain memory where appropriate.

Test gate:

- Signal without evidence fails validation.
- Signal with evidence appears in Nous visibility layer.

### Phase 4.3: Report-To-Memory Ingestion

Scope:

- Define Khashi/Investing report ingestion contract into Nous executive intelligence.
- Reports should become cited memory candidates and optionally decision records.

Test gate:

- Example Khashi report ingests to Hermes Brain candidate memory.
- Example Investing report ingests to decision lineage.

### Phase 4.4: Daily Briefing Integration

Scope:

- Surface report status, blocked items, hard-stop state, and action items in Nous executive cockpit.

Test gate:

- Executive briefing API/client tests pass.
- Dashboard route validation passes.

## Wave 5: Fleet Presentation Proof

Goal: move frontend maturity from “built” to “provably ready.”

### Phase 5.1: Route Validation Refresh

Scope:

- Run operational route validation after all backend changes.
- Ensure no registered page renders placeholder-only content.

Test gate:

- Route validation passes.
- Placeholder route audit passes.

### Phase 5.2: Visual Baseline And Current Screenshots

Scope:

- Capture required dashboard screenshots across desktop/mobile, light/dark if supported, and key states.
- Store baseline/current evidence.

Test gate:

- Screenshot script passes.
- No obvious overlap/blank/placeholder states in critical dashboards.

### Phase 5.3: Accessibility And State Coverage

Scope:

- Add accessibility checks for core pages.
- Verify loading, empty, stale, error, blocked, and partial-data states.

Test gate:

- Accessibility proof passes or blocker is recorded.
- State coverage proof passes.

### Phase 5.4: Khashi Final T3C Proof

Scope:

- Store Khashi final route, visual, and accessibility proof.
- Align Khashi dashboard status with fleet dashboard maturity.

Test gate:

- Khashi route/visual/accessibility proof stored.
- CP-09 reaches final-proof-ready or complete.

## Wave 6: OANDA Live-Readiness Lock

Goal: keep live trading safe while completing the proof needed to make live-readiness real.

### Phase 6.1: Risk Gate Refresh

Scope:

- Update risk-gate proof, exposure limits, kill switch, and incident process.

Test gate:

- Risk gate tests pass.
- Live execution remains locked.

### Phase 6.2: Live Ops Review And Incident Drill

Scope:

- Run incident drill and live ops review.
- Store evidence and operator decision.

Test gate:

- Incident drill proof exists.
- Approval remains required.

### Phase 6.3: Explicit Approval Packet

Scope:

- Build scoped approval packet for any future live move.
- Include restore proof, risk proof, preflight proof, and command authorization proof.

Test gate:

- Approval packet validates.
- No live execution flag is enabled automatically.

## Wave 7: Legacy Plan Cleanup

Goal: stop old plans from reintroducing duplicate work.

### Phase 7.1: Legacy Header Tagging

Scope:

- Add canonical CP IDs to old plans.
- Mark superseded/reference-only files.

Test gate:

- Registry validator confirms legacy plans are mapped.

### Phase 7.2: Registry Final Reconciliation

Scope:

- Update percentages, statuses, proof paths, blockers, and next proofs.
- Remove overlap where one CP already owns the work.

Test gate:

- Canonical registry validates.
- No active plan lacks owner, status, percent, next proof, or canonical source.

## End-To-End Completion Gate

Before calling the full effort complete, run:

- Nous backend targeted tests for second-brain, operating-runtime, dashboard auth, command/approval paths.
- Nous web tests for second-brain, operational contracts, route registry, dashboard pages touched.
- Nous web production build.
- Cross-project registry validation.
- Operational route validation.
- Operational live-source validation.
- CP04 runtime intelligence validation.
- Investing earnings provider/coverage/backfill/mirror/restore proofs.
- Khashi storage/freshness/reporting/market-intelligence proofs.
- Messaging command authorization E2E tests or documented production-token blocker.
- Production smoke checks for deployed services.

## Final Definition Of 100%

The canonical maturity work reaches 100% only when:

- Every CP plan has a current proof artifact.
- Every high-impact workflow has preflight or explicit exemption.
- Every warehouse/archive/restore/prune path has production proof or approval-gated blocker.
- Every investing earnings data lane has provider capability, coverage, warehouse, and observability proof.
- Every Khashi market/reporting lane feeds Nous or has a documented source blocker.
- Every dashboard claims operational maturity only with route, source, visual, accessibility, and state proof.
- Live trading and destructive pruning remain disabled unless their approval packets pass.
- Legacy plans no longer compete with canonical plans.
