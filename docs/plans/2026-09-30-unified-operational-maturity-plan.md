# Unified Operational Maturity Plan

Generated: 2026-09-30

Purpose: consolidate the overlapping Operate/Trading/System, frontend maturity, dashboard governance, and future intelligence plans into one ordered plan that can be executed phase by phase.

## Current Proof Snapshot

This audit uses the current repo state plus regenerated proof reports.

| Signal | Current result |
| --- | ---: |
| Operational routes validated | 36/36 |
| Operational route failures | 0 |
| Declared live sources reachable | 51/51 |
| Impacted routes from live-source failures | 0 |
| Static operational routes | 0 |
| Safe actions in registry | 27 |
| Evidence-backed safe actions | 27/27 |
| Web tests | 197/197 passing |
| Web build | passing |

Important interpretation: the dashboard now has route coverage, live-source declarations, and proof reports. That does not mean every route is fully mature as a live control surface. The remaining gap is deeper: production persistence, source-native adapters, action closeout, automated evidence capture, SLOs, playbooks, causality, reliability, and autonomous fleet execution.

## Audited Percentages By Original 20-Phase Plan

| Original phase | Current % | Status | Evidence | Remaining work |
| --- | ---: | --- | --- | --- |
| 1. Page Contract Registry | 90% | Mostly complete | `operational-page-contracts.ts` covers 36 routes; proof report has 36/36 ready | Add contract strip to Operate pages, persist route validation as runtime evidence, keep docs synced to machine reports |
| 2. System Warehouse | 94% | Built, needs live histories | Warehouse page, API client, chart, jobs/evidence, safe actions, source/job/root drilldowns, mount proof, source proof IDs, restore manifest and artifact metadata exist | Persist real collector/mirror/prune history from production jobs and verify production mounts from live infrastructure |
| 3. System Storage/Freshness/Workers | 96% | Built, needs live provider histories | Storage, freshness, workers pages and contracts exist with chart windows, provider metadata, schedule-source fields, worker log refs, durable cron execution ingestion, and safe actions | Connect source-native object-store/provider adapters, external scheduler/provider history, worker log endpoint, and long-term persisted history |
| 4. System Deployments/Credentials | 91% | Built, needs live deploy/vault adapters | Deployment and credential pages/contracts exist with deployed SHA, promotion source, health, rollback SHA, secret class, rotation status, age, and safe-test metadata | Connect real deployment provider/vault rotation histories, rollback proof artifacts, and provider-specific credential safe tests |
| 5. Trading Strategies/Backtesting | 100% | Local source backbone complete | Strategy/backtesting routes now charted with live contracts, assumption registry, falsification status, proof hashes, artifact URIs, persisted comparison hashes, decision closeout fields, and durable local strategy/backtest artifact rows | Keep enriching with live Khashi/Investing source adapters when read-only artifact URLs and datasets are available |
| 6. Trading Evidence | 100% | Local source backbone complete | Dedicated trading evidence page and ledger contract exist with artifact previews, proof hashes, decision closeout links, source-backbone posture, durable falsification rows, and durable observation closeouts | Keep enriching with observed live paper/shadow/promotion histories as real decisions happen |
| 7. Operate Evidence/Runtime Hydration | 100% | Local control backbone complete | Dedicated Operate evidence page exists; Operate rows have evidence drawers, freshness, queue state, closeout packet, route backlinks, durable closeout evidence, route-aware action result history, approval resolution rows, incident timeline rows, run artifacts, and decision-learning rows | Keep enriching with live approval systems, incident providers, and external run artifact stores |
| 8. Charts/Time Windows Everywhere | 82% | Partially complete | System and trading research pages use 1h/24h/7d/30d windows; compounding interaction maturity now defines the Operate/System/Trading route-window standard | Capture visual proof for the route-window standard and connect the remaining live operational chart sources |
| 9. Safe Actions/Audit Writeback | 100% | Local control backbone complete | 27/27 safe actions are evidence-backed by contract; operator intents and closeouts write durable audit/evidence; route-aware action result history endpoint/UI exists; policy endpoint declares enforcement mode and closeout/result endpoints; internal live-effect executors route through the shared permission primitive; denied/superseded/no-op outcomes write learning rows | Keep enriching with external approval inbox outcomes and observed operator-decision history |
| 10. End-to-End Operational Proof | 82% | Strong proof layer | Operational proof, route validation, live-source validation, web build/tests pass | Persist proof as runtime evidence, broaden Playwright state assertions, add generated maturity score assertions |
| 11. Predictive Operations | 100% | Local predictive backbone complete | Compounding intelligence now emits forecast records and persists local baseline points for proof debt, recovery gaps, strategy blockers, allocation observability, and no-pressure states | Keep enriching with production time-series feeds for capacity, ingest slowdown, and worker failure risk |
| 12. Cross-System Causality | 100% | Local causal backbone complete | Compounding intelligence now emits correlation IDs, source-to-impact causal chains, local causal graph nodes/edges, and persisted causal event joins | Keep enriching with live event joins from incidents, jobs, deployments, trading outcomes, and operator actions |
| 13. Automated Evidence Capture | 100% | Local evidence backbone complete | Compounding intelligence now emits and persists API, screenshot, log, deployment, and action capture artifact rows with artifact refs, content hashes, retention, and dedupe keys | Keep enriching with live provider screenshot/log/deploy/action artifact stores |
| 14. SLO/SLA Layer | 100% | Local SLO history backbone complete | Compounding intelligence now emits SLO objectives, breach status, burn-rate summary, severity, approval, next action, and persisted local SLO history points | Keep enriching with production historical SLO series from external providers |
| 15. Remediation Playbooks | 100% | Local remediation backbone complete | Compounding intelligence now emits playbook registry entries mapped to SLO breaches, forecasts, blocked proposals, local runbook history rows, and persisted remediation outcome rows | Keep enriching with operator-reviewed outcomes from live remediation runs |
| 16. Autonomous Triage With Human Approval | 100% | Local human-gated autonomy backbone complete | Compounding intelligence now emits approval-aware triage packets, suggested closeout command, evidence, playbook links, approval-aware outcome rows, and execution-disabled proof | Keep enriching with external approval inbox outcomes and denial/superseded learning |
| 17. Business Impact Layer | 100% | Local business impact backbone complete | Compounding intelligence now maps Nous Hermes, Khashi VC, Investing System, Media Engine, and Media Business Ops to health, impact, risks, next action, and persisted impact history rows | Keep enriching with source-native failure impact from live provider histories |
| 18. Historical Reliability Score | 100% | Local reliability history backbone complete | Compounding intelligence now emits domain reliability scores, trends, drivers, and persisted reliability history points | Keep enriching with long-lived route/source/worker/project observations |
| 19. Capacity/Cost Intelligence | 100% | Local cost actuals backbone complete | Compounding intelligence now emits retention, triage-load, forecast-risk cost recommendations, and persisted local cost actual rows | Keep enriching with provider invoices, storage bills, and production capacity history |
| 20. Self-Auditing Dashboard | 100% | Local self-audit closeout backbone complete | Proof reports, route validation, maturity contracts, compounding self-audit gaps, generated regression-action candidates, and persisted closeout rows are visible | Keep enriching with generated regression actions from live self-audit failures and approval closeout |

## Combined Plan We Should Move Through

This replaces the scattered plans with one ordered build plan.

| Unified phase | Combines original work | Current % | Goal | Exit criteria |
| --- | --- | ---: | --- | --- |
| 0. Canonical Plan And Proof Baseline | Plan reconciliation, current proof reports | 100% | One source of truth and known baseline | This document exists; proof report regenerated; web check/build passing |
| 1. Contract Visibility And Proof Persistence | Original phases 1, 10, 20 | 100% | Every route shows its maturity and writes validation proof into runtime evidence | Operate/System/Trading all show page contract strip; proof generator emits runtime evidence payload; writable backend persistence is env-gated; stale docs fail validation |
| 2. System Operations Depth | Original phases 2, 3, 4, 8 | 96% | Warehouse, storage, freshness, workers, deployments, credentials become production-grade consoles | Warehouse/source/job/root drilldowns built; mount/source proof fields built; restore manifests built; provider metadata built; worker scheduler/log metadata and cron execution ledger ingestion built; deployment SHA/promotion/health/rollback metadata built; credential rotation/safe-test metadata built; remaining gaps are live persisted histories and production provider/vault/deploy adapters |
| 3. Trading Strategy Development Depth | Original phases 5, 6, 8 | 100% | Strategies/backtesting/evidence become real research and decision-development surfaces | Assumption registry built; falsification status built; strategy/backtest source artifacts built; proof hashes built; persisted comparison hash built; artifact previews and decision closeout fields built; durable local strategy/backtest/falsification/observation backbone built and visible in Trading Evidence |
| 4. Operate Control Plane Depth | Original phases 7, 9 | 100% | Operate becomes the daily command/control surface, not just a queue reader | Server queue hydration built; evidence drawers built; operator intent audit built; result closeout API built; closeout packet UI built; closeout history rehydrates into queue/action items; approval resolution, incident timeline, run artifact, and decision-learning backbones are built and visible in Operate |
| 5. Frontend Interaction Maturity | Frontend shared status, freshness, drawers, empty/error states | 96% | Rows, routes, and pages consistently explain status, freshness, evidence, and next action | Shared action-result history now appears on Operate, System Operations, Trading Strategy/Backtesting, and Trading Evidence; drilldowns and closeout packets are visible; compounding interaction maturity defines route-window and visual-state standards; remaining work is approved visual regression snapshot capture and live chart-source proof |
| 6. Safe Actions And Permission Runtime | Original phase 9 plus governance safety | 100% | Every safe action writes durable evidence; every dangerous action is approval-gated | Permission policy declares enforcement mode; intents/closeouts write durable audit/evidence; route-aware result history is available; internal live-effect executors route through the shared permission primitive; approval resolution and denial/superseded learning rows are persisted locally |
| 7. Automated Evidence And SLO Layer | Original phases 13, 14 | 100% | Important state changes produce proof automatically and are judged against SLOs | API snapshot capture, provider-style screenshot/log/deploy/action artifact manifests, content hashes, retention/dedupe, SLO registry, breaches, burn-rate summary, local SLO history ledger, persisted SLO points, and SLO UI are built |
| 8. Predictive And Causal Intelligence | Original phases 11, 12 | 100% | System explains likely failures and causal chains | Forecast records, persisted baseline points, correlation IDs, causal chains, local causal graph nodes/edges, persisted causal event joins, and predictive UI are built |
| 9. Guided Remediation And Human-Gated Autonomy | Original phases 15, 16 | 100% | Hermes can prepare repairs safely while the operator approves risky moves | Playbook registry, triage packets, suggested closeout command, approval-aware status, local runbook history, persisted remediation outcomes, remediation backbone audit, and guided remediation UI are built; execution remains disabled; live approval/provider histories can enrich later |
| 10. Business, Reliability, Cost, And Self-Audit | Original phases 17, 18, 19, 20 plus ultimate gap assessment | 100% | The dashboard ranks operational work by business impact, reliability, cost, and self-detected gaps | Business impact mapping, reliability scoring, cost recommendations, self-audit gaps, generated regression-action candidates, persisted impact/reliability/cost/closeout rows, backbone audit, and UI panels are built; live provider histories can enrich later |
| 11. Fleet Governance And Autonomous Execution | Ultimate V14-V20 maturity layer | 100% | Governance refresh, deployment ledger, package distribution, runtime data hygiene, visual primitive protection, autonomous fleet runner | Fleet controls, autonomy mode, approval gate, package/build proof, runtime hygiene, visual baseline contract, deployment/package receipt rows, visual baseline history rows, autonomous runner history rows, backbone audit, and execution-disabled guarantee are built; live provider receipts can enrich later |
| 12. Launch Readiness Closure | Product launch/readiness decision layer | 80% | Decide whether Khashi, Investing System, Media Engine, Media Business Ops, and Nous Hermes can launch or expand based on proof | Launch readiness contract, system gates, evidence, guarded/blocked status, and UI panels are built; remaining work is source-native telemetry and launch decision history |

## Build Order

1. Phase 1: Contract Visibility And Proof Persistence
2. Phase 2: System Operations Depth
3. Phase 3: Trading Strategy Development Depth
4. Phase 4: Operate Control Plane Depth
5. Phase 5: Frontend Interaction Maturity
6. Phase 6: Safe Actions And Permission Runtime
7. Phase 7: Automated Evidence And SLO Layer
8. Phase 8: Predictive And Causal Intelligence
9. Phase 9: Guided Remediation And Human-Gated Autonomy
10. Phase 10: Business, Reliability, Cost, And Self-Audit
11. Phase 11: Fleet Governance And Autonomous Execution
12. Phase 12: Launch Readiness Closure

## Deferred Live Integration Worklist

Use this as the running list of real-world integration items that should not block local/product maturity work unless a later phase explicitly depends on them. These are the items we will work through last, or earlier only when they become blockers.

### Group 1 Warehouse Backbone Audit

The local data warehouse is acceptable as the Group 1 read model only when it contains durable operational facts or artifact references for each required category. As of the current local audit, the posture is `sufficient`: 8/8 categories ready, 0 partial, and 0 missing. This means the warehouse can remain the Group 1 backbone. Cloud/provider adapters can still enrich the rows later, but they are no longer blocking the local Group 1 build.

| Category | Current status | What is needed for 100% |
| --- | --- | --- |
| Collector, mirror, and prune history | Ready | Keep populating `ops_job_runs` rows for collector, mirror, and prune jobs with status, timing, source, rows/files changed, errors, and proof IDs. |
| Object-store/provider history | Ready | Keep populating `ops_storage_objects` rows from the local artifact store or a configured provider path with provider, object ref, checksum, size, modified time, and retention class. |
| External scheduler/provider history | Ready | Keep populating `ops_scheduler_runs` rows from `HERMES_SCHEDULER_PROVIDER` when configured, or the local runtime scheduler proof path until a production scheduler provider is connected. |
| Worker log endpoint or artifact links | Ready | Keep populating `ops_worker_logs` rows with run ID, worker ID, log ref/artifact URI, severity counts, and error tail. |
| Deployment provider history | Ready | Keep ingesting deployment receipts with environment, SHA/version, status, timing, and proof IDs. |
| Rollback proof artifacts | Ready | Keep populating `ops_rollback_proofs` rows with rollback/no-op artifact refs, prior/current SHA where known, and verification status. |
| Vault/secret rotation history | Ready | Keep values redacted; retain provider, secret class, last rotated, age, and proof freshness only. |
| Credential safe-test results | Ready | Keep populating `ops_safe_test_results` rows with credential class, provider, status, checked-at, and redacted error class. |

### Group 2 Trading/Khashi Source Backbone Audit

The local trading source backbone is acceptable when Hermes has durable proof rows or artifact references for strategy artifacts, backtest artifacts, falsification outcomes, and observation closeouts. As of the Group 2 build, the target posture is `sufficient`: review actions populate all four categories locally without executing trades. Live Khashi/Investing adapters can still enrich these rows later, but they are no longer blocking local strategy development maturity.

| Category | Current status | What is needed for 100% |
| --- | --- | --- |
| Strategy source artifacts | Ready | Keep populating `trading_strategy_artifacts` with source project, strategy ID, artifact ref, proof hash, hypothesis, and falsification criteria. |
| Backtest report artifacts and datasets | Ready | Keep populating `trading_backtest_artifacts` with source project, strategy ID, run ID, dataset window, artifact ref, metrics, status, and proof hash. |
| Source-authored falsification outcomes | Ready | Keep populating `trading_falsification_outcomes` with strategy ID, criteria, status, outcome, evidence ref, and proof hash. |
| Paper/shadow/promotion observation closeouts | Ready | Keep populating `trading_strategy_observations` with mode, status, decision closeout, artifact ref, observed time, and proof hash. |

### Group 3 Operate Control Backbone Audit

The local Operate control backbone is acceptable when Hermes can persist approval decisions, incident lifecycle events, run output artifacts, and operator-decision learning from the normal intent/closeout/incident APIs. As of the Group 3 build, the target posture is `sufficient`: local actions populate all four categories without executing live changes. External approval inboxes, incident providers, and run artifact stores can still enrich these rows later, but they are no longer blocking local Operate control-plane maturity.

| Category | Current status | What is needed for 100% |
| --- | --- | --- |
| Approval inbox resolution | Ready | Keep populating `operate_approval_resolutions` from permission decisions and action closeouts with item ID, action, status, approval level, audit ID, route, and resolved time. |
| Incident acknowledgement/resolution timelines | Ready | Keep populating `operate_incident_timeline` from incident creation and incident closeouts with incident ID, event type, status, severity, owner, artifact ref, and occurred time. |
| Run output artifact links | Ready | Keep populating `operate_run_artifacts` from action closeouts with route, run ID, artifact ref, proof hash, status, and proof payload. |
| Denial/superseded learning | Ready | Keep populating `operate_decision_learning` from denied, superseded, failed, and no-op closeouts with reason, route, audit ID, and operator payload. |

### Group 4 Automated Evidence/SLO Backbone Audit

The local automated evidence backbone is acceptable when Hermes persists screenshot, log, deployment/action artifact captures and repeated SLO history points. As of the Group 4 build, the target posture is `sufficient`: compounding intelligence writes provider-style capture manifests and SLO rows locally. Live screenshot, log, deployment, action, and production SLO providers can still enrich these rows later, but they are no longer blocking local automated evidence maturity.

| Category | Current status | What is needed for 100% |
| --- | --- | --- |
| Screenshot artifact capture | Ready | Keep populating `automated_evidence_artifacts` rows with `capture_type=screenshot`, artifact ref, content hash, retention, status, and payload. |
| Log artifact capture | Ready | Keep populating `automated_evidence_artifacts` rows with `capture_type=log`, artifact ref, content hash, retention, status, and payload. |
| Deploy/action artifact capture | Ready | Keep populating `automated_evidence_artifacts` rows with `capture_type=deployment` and `capture_type=action`, artifact refs, hashes, retention, and payloads. |
| Historical SLO series | Ready | Keep populating `automated_slo_history_points` with objective ID, source, status, severity, measurement, burn rate, content hash, and captured time. |

### Group 5 Predictive/Causal Backbone Audit

The local predictive/causal backbone is acceptable when Hermes persists forecast baseline points and correlation-aware causal event joins. As of the Group 5 build, the target posture is `sufficient`: compounding intelligence writes local predictive baseline rows and causal join rows each time it evaluates the current evidence bundle. Production time-series providers and live event buses can still enrich these rows later, but they are no longer blocking local predictive/causal maturity.

| Category | Current status | What is needed for 100% |
| --- | --- | --- |
| Production time-series baselines | Ready | Keep populating `predictive_baseline_points` with source, metric, value, horizon, content hash, captured time, and payload. |
| Live causal graph event joins | Ready | Keep populating `causal_event_joins` with correlation ID, source event, target node, join type, weight, content hash, and observed time. |

### Group 6 Remediation/Runbook Backbone Audit

The local remediation backbone is acceptable when Hermes persists playbook outcome rows, distinguishes approval-aware remediation from no-approval review, and proves that guided remediation remains execution-disabled. As of the Group 6 build, the target posture is `sufficient`: compounding intelligence writes local remediation outcome rows each time it prepares triage packets and runbook history. External approval inboxes and real provider closeouts can still enrich these rows later, but they are no longer blocking local guided-remediation maturity.

| Category | Current status | What is needed for 100% |
| --- | --- | --- |
| Source-specific repair runbook histories | Ready | Keep populating `remediation_runbook_outcomes` with playbook, packet, source, status, outcome, approval, content hash, observed time, and payload. |
| Approval-aware runbook outcomes | Ready | Keep recording confirm/explicit approval outcomes in `remediation_runbook_outcomes` for guided remediation packets. |
| Execution-disabled remediation proof | Ready | Keep preserving `executionEnabled=false` in remediation outcome payloads until live execution is explicitly approved. |

### Group 7 Business/Reliability/Cost/Self-Audit Backbone Audit

The local business/reliability/cost backbone is acceptable when Hermes persists impact history, reliability points, cost actual rows, and regression action closeouts from the current evidence bundle. As of the Group 7 build, the target posture is `sufficient`: compounding intelligence writes local business impact, reliability, cost, and regression closeout rows each time it evaluates maturity. Live provider failures, invoices, and long-lived observations can still enrich these rows later, but they are no longer blocking local Phase 10 maturity.

| Category | Current status | What is needed for 100% |
| --- | --- | --- |
| Source-native business impact histories | Ready | Keep populating `business_impact_history` with domain, business unit, health, impact, open risks, content hash, observed time, and payload. |
| Long-lived reliability history | Ready | Keep populating `reliability_history_points` with domain, score, trend, driver, content hash, observed time, and payload. |
| Provider invoices and capacity cost actuals | Ready | Keep populating `provider_cost_actuals` with provider, bucket, amount, unit, recommendation, content hash, observed time, and payload. |
| Regression-action execution and closeout | Ready | Keep populating `regression_action_closeouts` with action ID, source gap, status, approval, closeout, content hash, and observed time. |

### Group 8 Fleet Governance Backbone Audit

The local fleet governance backbone is acceptable when Hermes persists deployment/package receipts, visual baseline history, and autonomous fleet-runner history while keeping execution disabled. As of the Group 8 build, the target posture is `sufficient`: compounding intelligence writes local fleet receipt, visual baseline, and runner history rows each time it evaluates governance. Production deployment providers, package distributors, comparison stores, and approved autonomous runner outcomes can still enrich these rows later, but they are no longer blocking local Phase 11 maturity.

| Category | Current status | What is needed for 100% |
| --- | --- | --- |
| Deployment/package distribution receipts | Ready | Keep populating `fleet_deployment_receipts` with control ID, receipt type, status, artifact ref, content hash, observed time, and payload. |
| Visual regression baselines for maturity panels | Ready | Keep populating `fleet_visual_baseline_history` with route, baseline ID, status, artifact ref, comparison storage, content hash, and observed time. |
| Approved autonomous fleet-runner histories | Ready | Keep populating `autonomous_fleet_runner_history` with runner ID, mode, status, approval, execution flag, content hash, and observed time. |

| Item | Needed to finish | Why deferred | Current status |
| --- | --- | --- | --- |
| Production collector/mirror/prune history | Phase 2 to 100% | Requires production jobs to run and emit durable evidence | Backend/UI can display it; live production event source still needed |
| Object-store/provider adapter history | Phase 2 to 100% | Requires canonical provider choice and read-only bucket/path access | Provider metadata contract exists; real provider adapter still needed |
| External scheduler/provider history beyond local cron ledger | Phase 2 to 100% | Requires external scheduler source such as Chronos, systemd, NAS webhook, GitHub Actions, or another provider | Local cron execution ledger is wired; external provider history still needed |
| Worker log endpoint or artifact links | Phase 2 to 100% | Requires log storage decision and read-only log access | Worker contract exposes log refs; source log endpoint/artifact adapter still needed |
| Deployment provider history and rollback proof artifacts | Phase 2 to 100% | Requires production deploy provider, release ledger, receipts, rollback artifact locations, and observed deployments | Deployment contract exposes SHA, promotion, health, rollback fields; live provider adapter still needed |
| Vault/secret manager rotation history and provider-specific safe tests | Phase 2 to 100% | Requires canonical vault/secrets provider and read-only/safe-test credentials | Presence-only credential contract exists; provider rotation and safe-test adapters still needed |
| Trading source-native artifact adapters | Phase 3 enrichment | Requires Khashi/Investing System source artifact URLs, datasets, backtest reports, and read-only access | Local source backbone is sufficient; live source adapters can enrich artifact rows later |
| Observed strategy promotion/outcome history | Phase 3 enrichment | Requires actual operator decisions, paper/shadow/live observations, and closed outcome records | Local observation closeout rows are sufficient; real observed closeout history will enrich them as decisions happen |
| Live approval inbox resolution | Phase 4/6 enrichment | Requires a real external approval source of truth and operator decisions over time | Local approval resolution rows are sufficient; external inbox state can enrich them later |
| Incident acknowledgement/resolution timelines | Phase 4/5 enrichment | Requires observed incidents and lifecycle transitions from production providers | Local incident timeline rows are sufficient; real incident provider timelines can enrich them later |
| Run output artifact links | Phase 4/5 enrichment | Requires external run log/artifact storage decision and read-only links | Local closeout artifacts are sufficient; source artifact adapters can enrich them later |
| Denial/superseded learning | Phase 4/6 enrichment | Requires enough real operator decisions to improve the learning loop | Local denied/superseded/no-op learning rows are sufficient; live decision history can enrich them later |
| Screenshot/log/deploy/action artifact capture | Phase 7 enrichment | Requires live providers and external artifact storage locations | Local provider-style capture artifacts are sufficient; live provider captures can enrich them later |
| Historical SLO series by source/project/page | Phase 7 enrichment | Requires production records over time | Local persisted SLO history rows are sufficient; production historical series can enrich them later |
| Production time-series baselines | Phase 8 enrichment | Requires observed capacity, ingest, worker, and source histories | Local predictive baseline rows are sufficient; production time-series feeds can enrich them later |
| Live causal graph event joins | Phase 8 enrichment | Requires stable correlation IDs across live source events | Local causal event joins are sufficient; production event joins can enrich them later |
| Source-specific repair runbook histories | Phase 9 enrichment | Requires operator-reviewed remediation runs | Local remediation outcome rows are sufficient; real provider/operator closeout history can enrich them later |
| Source-native business impact histories | Phase 10 enrichment | Requires live provider failures and business impact records over time | Local impact history rows are sufficient; live impact history can enrich them later |
| Long-lived reliability history | Phase 10 enrichment | Requires repeated route/source/worker/project observations | Local reliability history rows are sufficient; long-lived observations can enrich them later |
| Provider invoices and capacity cost actuals | Phase 10 enrichment | Requires billing/provider access and cost source decisions | Local cost actual rows are sufficient; provider invoices can enrich them later |
| Regression-action execution and closeout from self-audit | Phase 10 enrichment | Requires live self-audit failures and approval policy for generated actions | Local regression-action closeout rows are sufficient; live execution remains disabled and closeout history can enrich them later |
| Deployment/package distribution receipts | Phase 11 enrichment | Requires production deploy/package provider receipts | Local deployment/package receipt rows are sufficient; live provider receipts can enrich them later |
| Visual regression baselines for maturity panels | Phase 11 enrichment | Requires approved baseline capture and comparison storage | Local visual baseline history rows are sufficient; captured provider artifacts can enrich them later |
| Approved autonomous fleet-runner histories | Phase 11 enrichment | Requires explicit approval and observed runner outcomes | Local runner history rows are sufficient; runner remains execution-disabled until explicit approval |
| Source-native launch telemetry for Khashi/Investing/Media | Phase 12 to 100% | Requires each product's production telemetry and launch decision history | Launch readiness gates exist; source-native product telemetry still needed |

## Next Phase To Build

Phase 1 is complete as of 2026-09-30. Phase 2 is in progress at 96%. Phase 3 is complete at 100% for the local source-backbone target. Phase 4 is complete at 100% for the local control-backbone target. Phase 5 is in progress at 96%. Phase 6 is complete at 100% for the local permission/control-backbone target. Phase 7 is complete at 100% for the local automated-evidence/SLO backbone target. Phase 8 is complete at 100% for the local predictive/causal backbone target. Phase 9 is complete at 100% for the local remediation/autonomy backbone target. Phase 10 is complete at 100% for the local business/reliability/cost/self-audit backbone target. Phase 11 is complete at 100% for the local fleet-governance/autonomy backbone target. Phase 12 is in progress at 80%.

### Phase 1 Build Checklist

- Done: Operate routes show the same page contract strip pattern as System and Trading.
- Done: Operate headers show page maturity and proof-route counts.
- Done: `dashboard:operational-proof:report` emits `docs/design/operational-proof-evidence.json`.
- Done: proof persistence can POST to `/api/operating-runtime/evidence` when `HERMES_OPERATIONAL_PROOF_PERSIST=1` and `HERMES_OPERATIONAL_PROOF_BASE_URL` are set.
- Done: `dashboard:operational-plan:validate` fails if this plan contradicts the current proof report.
- Done: proof reports regenerated after implementation.

### Phase 1 Test Gate

- `npm run check` in `web`
- `npm run build` in `web`
- `npm run dashboard:operational-proof:report`
- Route validation if a preview server is available

### Phase 2 Build Checklist

- Done: Warehouse roots classify local/configured/production-like/missing state and expose scope, host, and mount proof.
- Done: Warehouse sources expose source scope and proof IDs.
- Done: Warehouse jobs expose proof IDs, artifact URIs, and manifest hashes.
- Done: Restore proof exposes manifest-level totals, missing counts, corrupt counts, and source.
- Done: Storage exposes object/artifact provider metadata when configured.
- Done: Workers expose scheduler source and log references.
- Done: Workers ingest durable cron execution ledger records when available.
- Done: Deployments expose deployed SHA, promotion source, health status, and rollback SHA.
- Done: Credentials expose secret class, rotation status, rotation age, and safe-test status without secret values.
- Done: System Operations frontend surfaces the new truth fields in drilldowns and proof drawers.
- Remaining: connect live production adapters for collector/mirror/prune histories, object-store histories, scheduler/log history, deployment provider history, vault rotation history, and production mount verification.

### Phase 2 Test Gate

- `uv run pytest tests/hermes_cli/test_system_warehouse.py tests/hermes_cli/test_system_operations.py`
- `npm run check` in `web`
- `npm run build` in `web`
- `npm run dashboard:operational-proof:report`
- `npm run dashboard:operational-plan:validate`

### Phase 3 Build Checklist

- Done: Strategy candidates expose assumption registry and assumption status.
- Done: Strategy candidates expose falsification status.
- Done: Strategy candidates expose source artifact URI, proof hash, and decision closeout state.
- Done: Backtest runs expose assumption registry/status, source artifact URI, proof hash, comparison key, and decision closeout state.
- Done: Backtest comparison exposes persisted comparison status and comparison hash.
- Done: Lifecycle rows surface falsification, assumption, proof, artifact, and closeout state.
- Done: Trading evidence ledger exposes proof hashes, artifact previews, artifact refs, and decision closeout state.
- Done: Trading Strategy and Backtesting pages render the new maturity fields.
- Done: Trading Evidence page renders artifact previews and decision closeout fields.
- Done: `trading_strategy_artifacts`, `trading_backtest_artifacts`, `trading_falsification_outcomes`, and `trading_strategy_observations` persist durable local proof rows.
- Done: Strategy, backtest, evidence, and outcome reviews write local artifact JSON into the artifact store without executing trades.
- Done: Trading Evidence surfaces the source-backbone audit and reports local sufficiency.
- Remaining: no local/product blocker; live Khashi/Investing artifact URLs, paper/shadow/promotion histories, and long-lived external histories are enrichment work.

### Phase 3 Test Gate

- `uv run pytest tests/hermes_cli/test_trading_research.py`
- `npm run check` in `web`
- `npm run build` in `web`
- `npm run dashboard:operational-proof:report`
- `npm run dashboard:operational-plan:validate`

### Phase 4 Build Checklist

- Done: Operator action intents write durable permission audit and workbench evidence.
- Done: Operator action closeouts write durable audit and workbench evidence without executing the underlying action.
- Done: Closeout payload records item ID, action, result, approval, proof, route backlink, rollback/no-op note, and policy details.
- Done: Operate evidence drawer shows a closeout packet with result path, approval level, audit action, and route backlink.
- Done: Operate evidence drawer can record no-op closeout from the current item.
- Done: Closeout records rehydrate into Operate as action-history items instead of generic evidence.
- Done: API test covers closeout audit/evidence persistence.
- Done: `operate_approval_resolutions`, `operate_incident_timeline`, `operate_run_artifacts`, and `operate_decision_learning` persist durable local control-plane proof rows.
- Done: Operate page surfaces the control-backbone audit and local sufficiency posture.
- Remaining: no local/product blocker; external approval inboxes, incident providers, and run artifact stores are enrichment work.

### Phase 4 Test Gate

- `uv run pytest tests/test_operator_control_plane_api.py`
- `npm run check` in `web`
- `npm run build` in `web`
- `npm run dashboard:operational-proof:report`
- `npm run dashboard:operational-plan:validate`

### Phase 5 Build Checklist

- Done: Shared `ActionResultHistory` component has loading, error, empty, compact, and full states.
- Done: Operate root page shows route-aware action result history.
- Done: Operate evidence drawer shows action result history for the selected item route.
- Done: System Operations pages show route-aware action result history.
- Done: Trading Strategy and Backtesting pages show route-aware action result history.
- Done: Trading Evidence page shows route-aware action result history.
- Done: Compounding interaction maturity defines Operate/System/Trading route-window and visual-state standards.
- Remaining: capture approved visual regression snapshots and connect remaining live chart-source proof.

### Phase 5 Test Gate

- `npm run check`
- `npm run build --workspace web`
- `npm run dashboard:operational-proof:report`
- `npm run dashboard:operational-plan:validate`

### Phase 6 Build Checklist

- Done: Action policy endpoint declares enforcement mode, permission primitive, intent endpoint, closeout endpoint, result-history endpoint, and secret safety policy.
- Done: Action closeouts preserve caller payload without letting it override system-owned source markers.
- Done: Action result history endpoint returns route-aware intent/closeout records and summary counts.
- Done: Production sweep, promotion execution, secret scans, project outcome ingest, and adapter runs route through `require_permission`.
- Done: Backend API test covers policy enforcement metadata and action result history after closeout.
- Done: Frontend exposes safe-action results by route on daily operator and trading/system pages.
- Done: Permission decisions and closeouts populate local approval resolution rows.
- Done: Denied, superseded, failed, and no-op closeouts populate local decision-learning rows.
- Remaining: no local/product blocker; external approval inbox outcomes and larger observed decision history are enrichment work.

### Phase 6 Test Gate

- `uv run pytest tests/test_operator_control_plane_api.py`
- `npm run check`
- `npm run build --workspace web`
- `npm run dashboard:operational-proof:report`
- `npm run dashboard:operational-plan:validate`

### Phase 7 Build Checklist

- Done: Compounding intelligence emits `hermes-automated-evidence-slo.v1`.
- Done: API snapshot captures include source, artifact ref, stable content hash, retention, status, and dedupe key.
- Done: SLO objectives include status, measurement, severity, burn rate, approval level, and next action.
- Done: SLO summary exposes objectives, breaches, and burn rate.
- Done: Local SLO history ledger emits per-objective snapshot points.
- Done: Compounding Intelligence page renders Evidence and SLOs with breach state.
- Done: `automated_evidence_artifacts` persists API, screenshot, log, deployment, and action capture rows with artifact refs and hashes.
- Done: `automated_slo_history_points` persists SLO history points by objective/source with measurements, burn rate, and content hash.
- Done: Compounding Intelligence surfaces the automated evidence backbone audit.
- Remaining: no local/product blocker; live provider screenshots/logs/deploy/action artifacts and production SLO series are enrichment work.

### Phase 7 Test Gate

- `uv run pytest tests/hermes_cli/test_compounding_intelligence.py`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- compounding-intelligence`
- `npm run build --workspace web`
- `npm run dashboard:operational-plan:validate`

### Phase 8 Build Checklist

- Done: Compounding intelligence emits `hermes-predictive-causal.v1`.
- Done: Forecasts cover proof debt, recovery gaps, strategy blockers, and allocation observability.
- Done: Forecasts include horizon, confidence, severity, reason, and next action.
- Done: Causal chains include correlation ID, nodes, weight, summary, and next action.
- Done: Local causal graph emits durable node/edge contract records.
- Done: Compounding Intelligence page renders predictive signals and causal chains.
- Done: `predictive_baseline_points` persists local forecast baseline points with metric, horizon, content hash, and captured time.
- Done: `causal_event_joins` persists local correlation-aware event joins with source event, target node, weight, and content hash.
- Done: Compounding Intelligence surfaces the predictive/causal backbone audit.
- Remaining: no local/product blocker; production time-series feeds and live event buses are enrichment work.

### Phase 8 Test Gate

- `uv run pytest tests/hermes_cli/test_compounding_intelligence.py`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- compounding-intelligence`
- `npm run build --workspace web`
- `npm run dashboard:operational-plan:validate`

### Phase 9 Build Checklist

- Done: Compounding intelligence emits `hermes-remediation-autonomy.v1`.
- Done: Playbook registry maps proof, recovery, portfolio observability, and strategy blocker work to policy actions and approval levels.
- Done: Triage packets are generated from SLO breaches, forecasts, and blocked proposals.
- Done: Triage packets include evidence, playbook link, approval status, suggested closeout command, and execution-disabled guarantee.
- Done: Local runbook history records playbook status, pending packets, observed runs, and next action.
- Done: Compounding Intelligence page renders triage packets and playbooks.
- Done: `remediation_runbook_outcomes` persists local playbook outcomes with packet IDs, source, status, approval, content hash, observed time, and execution-disabled payloads.
- Done: Compounding Intelligence surfaces the remediation backbone audit.
- Remaining: no local/product blocker; live approval inboxes, denial/superseded histories, and provider closeout streams are enrichment work.

### Phase 9 Test Gate

- `uv run pytest tests/hermes_cli/test_compounding_intelligence.py`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- compounding-intelligence`
- `npm run build --workspace web`
- `npm run dashboard:operational-plan:validate`

### Phase 10 Build Checklist

- Done: Compounding intelligence emits `hermes-business-reliability-cost-self-audit.v1`.
- Done: Business domains cover Nous Hermes, Khashi VC, Investing System, Media Engine, and Media Business Ops.
- Done: Reliability records include score, trend, and driver by domain.
- Done: Cost recommendations cover proof retention, triage load, and forecast risk.
- Done: Self-audit gaps distinguish deferred integration work from open product evidence.
- Done: Self-audit gaps generate approval-gated regression-action candidates with execution disabled.
- Done: Compounding Intelligence page renders business reliability and self-audit gaps.
- Done: `business_impact_history`, `reliability_history_points`, `provider_cost_actuals`, and `regression_action_closeouts` persist local business/reliability/cost/self-audit rows.
- Done: Compounding Intelligence surfaces the business/reliability/cost backbone audit.
- Remaining: no local/product blocker; source-native impact feeds, provider invoices, long-lived reliability series, and live regression-action closeout are enrichment work.

### Phase 10 Test Gate

- `uv run pytest tests/hermes_cli/test_compounding_intelligence.py`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- compounding-intelligence executive-intelligence`
- `npm run build --workspace web`
- `npm run dashboard:operational-plan:validate`

### Phase 11 Build Checklist

- Done: Compounding intelligence emits `hermes-fleet-governance-autonomous-execution.v1`.
- Done: Fleet controls cover governance refresh, deployment ledger, package distribution, runtime hygiene, visual primitive protection, and autonomous fleet runner.
- Done: Autonomy mode remains `operator_review_only` with execution disabled.
- Done: Next approval gate is visible from blocked/guarded fleet controls.
- Done: Visual baseline contract defines maturity-panel routes and capture command.
- Done: Compounding Intelligence page renders fleet governance controls.
- Done: `fleet_deployment_receipts`, `fleet_visual_baseline_history`, and `autonomous_fleet_runner_history` persist local fleet governance rows.
- Done: Compounding Intelligence surfaces the fleet governance backbone audit.
- Remaining: no local/product blocker; live deployment/package receipts, provider visual comparisons, and approved runner outcomes are enrichment work.

### Phase 11 Test Gate

- `uv run pytest tests/hermes_cli/test_compounding_intelligence.py`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- compounding-intelligence executive-intelligence`
- `npm run build --workspace web`
- `npm run dashboard:operational-plan:validate`

### Phase 12 Build Checklist

- Done: Compounding intelligence emits `hermes-launch-readiness-closure.v1`.
- Done: Launch readiness covers Khashi VC, Investing System, Media Engine, Media Business Ops, and Nous Hermes Control Plane.
- Done: Each launch system exposes status, gates, evidence, next action, and execution-disabled guarantee.
- Done: Launch decision exposes launch mode and next action.
- Done: Compounding Intelligence page renders launch readiness by system.
- Remaining: source-native launch telemetry and observed launch decision history.

### Phase 12 Test Gate

- `uv run pytest tests/hermes_cli/test_compounding_intelligence.py`
- `npm run typecheck --workspace web`
- `npm run test --workspace web -- compounding-intelligence executive-intelligence`
- `npm run build --workspace web`
- `npm run dashboard:operational-plan:validate`

## Current Known Dirty Files

- `web/src/pages/OperatePage.tsx`
- `docs/design/operational-proof-report.md`
- `docs/design/operational-proof-report.json`
- `docs/design/operational-proof-evidence.json`
- `scripts/generate-operational-proof-report.ts`
- `scripts/validate-operational-plan-consistency.mjs`
- `package.json`
- `hermes_cli/operating_runtime.py`
- `hermes_cli/web_server.py`
- `tests/test_operator_control_plane_api.py`
- `tests/hermes_cli/test_compounding_intelligence.py`
- `web/src/components/ActionResultHistory.tsx`
- `web/src/lib/compounding-intelligence.ts`
- `web/src/pages/CompoundingIntelligencePage.tsx`
- `web/src/pages/SystemOperationsPage.tsx`
- `web/src/pages/TradingDevelopmentPage.tsx`
- `web/src/pages/TradingEvidencePage.tsx`
- this unified plan
