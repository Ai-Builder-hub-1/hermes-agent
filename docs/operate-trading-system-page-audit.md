# Operate, Trading, and System Page Audit

Generated: 2026-09-29

## Executive Finding

The dashboard has three different maturity levels mixed together:

1. **Live command surfaces**: pages that call real backend APIs and show current state.
2. **Action-oriented roadmap surfaces**: pages that explain gates, owners, next action, and proof, but still mostly depend on static maturity data.
3. **Static maturity surfaces**: pages that are registered and styled, but do not yet answer the operator question implied by the page name.

The user-facing issue is real: when a page is named **Data Warehouse**, **Workers**, **Freshness**, **Strategies**, or **Backtesting**, the operator expects live operational facts, trend charts, remaining capacity, current runs, failures, and safe actions. Several pages still show maturity-stage text instead.

The biggest gap is **System**, especially `/system/warehouse` and `/system/storage`.

## Maturity Scale Used In This Audit

| Level | Meaning | Operator Confidence |
| --- | --- | --- |
| L0 | Placeholder or redirect only | Not useful yet |
| L1 | Static maturity/roadmap surface | Explains intent, not current state |
| L2 | Action-oriented static surface | Shows owners, gates, next actions, clearing proof |
| L3 | Live read surface | Calls backend APIs and shows current state |
| L4 | Live operational console | Adds trends, charts, freshness, drilldowns, and stale/error states |
| L5 | Live control surface | Adds safe actions, approvals, audit writeback, and evidence capture |

## Operate Pages

| Route | Current Maturity | Current Behavior | Gap |
| --- | --- | --- | --- |
| `/operate` | L2 | Shows action-oriented operator summary from normalized static/runtime items | Needs live server runtime hydration and trend/freshness proof |
| `/operate/blockers` | L2 | Explains blocker origin, clearing proof, and that blockers are roadmap/gate data, not live outages | Needs per-blocker evidence links, owner SLA, and close/reopen audit state |
| `/operate/actions` | L2 | Shows routed actions with next step and proof | Needs real action inbox from server, status mutation, and completed-action history |
| `/operate/incidents` | L2 | Shows incident readiness and response policy | Needs live incident feed, current severity, assigned owner, timeline, acknowledgement, and resolution action |
| `/operate/approvals` | L2 | Shows approval gates and policies | Needs approval queue backed by `/api/operating-runtime/permission-decision` and audit result state |
| `/operate/runs` | L2 | Shows loop registry and run rules | Needs last run, next run, duration, failure, output artifact, and rerun action |
| `/operate/evidence` | L1/L2 mismatch | Routes to fleet maturity review instead of an evidence console | Needs dedicated evidence browser with artifact type, source, freshness, proof hash, and linked blockers/actions |
| `/second-brain` | L3 | Calls second-brain APIs and shows brain/warehouse status | Needs richer warehouse sync history and knowledge coverage drilldowns |
| `/compounding-intelligence` | L3 | Calls compounding intelligence report and retrieval-pack APIs | Needs scheduled freshness proof and cross-links to source pages |
| `/operate/chat-actions` | L1/L2 | Shows useful prompts | Needs executable command intents, permission preview, and result/audit writeback |

### Operate Recommendation

Operate is no longer the worst offender after the recent refactor, but it is still not fully operational. The next step is to replace local/static runtime loading with server-first runtime loading and add evidence-backed closeout.

Required work:

- Use `/api/operating-runtime/summary`, `/evidence`, `/audit`, `/incidents`, `/deployments`, `/data-sources`, `/evals`, and `/autonomy-controls` as live sources.
- Add loading, stale, empty, degraded, and API-error states to every Operate page.
- Add drilldowns from every action/blocker/run to evidence and audit records.
- Add safe mutation actions only where backend audit writeback exists.

## Trading Pages

| Route | Current Maturity | Current Behavior | Gap |
| --- | --- | --- | --- |
| `/trading` | L3 | Uses trading command center API and separates real broker cash, demo cash, and paper bankroll | Needs more historical charts and route-specific drilldowns |
| `/trading/khashi` | L3 | Uses shared trading intelligence surface | Needs Khashi-specific contracts, venue status, strategy state, account freshness, and blocker drilldowns |
| `/trading/investing` | L3 | Uses shared trading intelligence surface | Needs Investing System-specific financial analysis pipeline status and source coverage |
| `/trading/strategies` | L1 | Static research development proof chain | Needs live strategy candidates, hypothesis state, source evidence, backtest readiness, and promotion gates |
| `/trading/backtesting` | L1 | Static eval/backtest readiness page | Needs live backtest runs, datasets, assumptions, fees/slippage, results, failures, and comparison charts |
| `/trading/shadow-paper` | L3 | Uses shared trading intelligence surface | Needs dedicated shadow/paper ledger, order/event timeline, and performance vs baseline |
| `/trading/risk` | L3/L4 | Head Trader/Trading intelligence routes expose risk and capital APIs | Needs unified risk dashboard with live limits, breaches, open exposure, and acknowledgement workflow |
| `/trading/head-trader` | L3/L4 | Backend exposes incidents, actions, decisions, audit, channels, credentials | Needs tighter page-level audit of action-to-evidence flow |
| `/trading/evidence` | L2/L3 mismatch | Routes through trading intelligence rather than a dedicated evidence browser | Needs trading-specific evidence ledger across Khashi, Investing System, Head Trader, and broker/source feeds |

### Trading Recommendation

Trading has the strongest live backend contracts, especially:

- `/api/trading-intelligence/command-center`
- `/api/trading-intelligence/controls`
- `/api/trading-intelligence/events`
- `/api/head-trader/summary`
- `/api/head-trader/incidents`
- `/api/head-trader/action-catalog`
- `/api/head-trader/audit`
- `/api/head-trader/credential-status`

The weakness is not basic liveness. The weakness is that several named pages reuse a generic trading surface or static proof-chain surface. A page called **Backtesting** needs to show real backtests. A page called **Strategies** needs to show real strategy candidates and their maturity.

Required work:

- Split generic Trading Intelligence into route-specific panels.
- Build live Strategies and Backtesting contracts.
- Add charts for cash, buying power, risk, PnL, events, action count, and source freshness.
- Add a Trading Evidence page that can answer: what proof supports this strategy, event, risk warning, or decision?

## System Pages

| Route | Current Maturity | Current Behavior | Gap |
| --- | --- | --- | --- |
| `/system` | L2/L3 | System overview and registered subroutes | Needs clear live health summary by subsystem |
| `/system/warehouse` | L1 | Shows source catalog and maturity stages | Does not show storage left, bytes ingested, row counts, sync/mirror history, retention, prune state, restore proof, or charts |
| `/system/freshness` | L1 | Shows freshness rules | Needs actual source freshness matrix, last successful check, SLA breach, and stale trend |
| `/system/storage` | L1 | Routes to durable artifact backend maturity page | Needs real disk/volume/object-store usage, free space, growth rate, cleanup candidates, and retention forecast |
| `/system/workers` | L1 | Shows worker loop registry | Needs live worker status, last run, next run, duration, logs, failure, and rerun controls |
| `/system/deployments` | L1/L2 | Shows deployment rules and maturity stages | Needs live release history, current deployed SHA, health result, rollback proof, and promotion queue |
| `/system/credentials` | L1/L2 | Shows credential policy | Needs presence-only secret scans, missing/expired secrets, rotation status, and safe test actions |
| `/system/models` | L3 | Existing model/config surface | Needs page-specific audit for fallback behavior and provider health |
| `/system/automations` | L3 | Existing cron/automation surface | Needs unified schedule, last run, next run, disabled reason, and failure alerts |
| `/system/sessions` | L3 | Existing sessions surface | Needs retention/freshness linkage to second brain and warehouse |
| `/system/logs` | L3 | Existing logs surface | Needs severity aggregation and drillthrough into incidents/actions |
| `/system/plugins` | L3 | Existing plugin surface | Needs capability gaps and permission posture |
| `/system/admin` | L3 | Existing admin/system controls | Needs stronger safety rails and audit links |
| `/system/analytics` | L3 | Existing analytics surface | Needs operational correlation with workers, warehouse, and user activity |

### System Recommendation

System is where the page labels most overpromise. The current `/system/warehouse` page is a source catalog, not a data warehouse console.

## What The Data Warehouse Page Should Actually Show

The Data Warehouse page should answer these questions immediately:

1. **How much storage is used?**
   - Total capacity
   - Used bytes
   - Free bytes
   - Percent used
   - Estimated days until full
   - Production volume vs external/mirror volume

2. **How much data is coming in?**
   - Bytes ingested in 1h, 24h, 7d, 30d
   - Records/events ingested in 1h, 24h, 7d, 30d
   - Ingestion by project: Nous Hermes, Khashi VC, Investing System, Hermes Brain
   - Ingestion by source/type: logs, events, market data, filings, second-brain notes, artifacts

3. **Is anything stale or stopped?**
   - Last successful collector run per source
   - Expected cadence per source
   - Lag minutes/hours
   - Error count and last error
   - Material slowdown detection

4. **Is mirroring working?**
   - Last mirror run
   - Mirror bytes copied
   - Mirror destination
   - Mirror lag
   - Failed mirror jobs
   - External drive or production mounted-volume state

5. **Is retention/pruning safe?**
   - Current retention policy by dataset
   - Rows/files eligible for pruning
   - Dry-run savings
   - Protected datasets
   - Last prune proof

6. **Can we restore?**
   - Latest restore proof
   - Manifest hash
   - Restored object counts
   - Missing/corrupt objects
   - Last verified archive bundle

7. **What should I do next?**
   - Run warehouse sync
   - Run restore proof
   - Run prune dry-run
   - Investigate stale source
   - Open source page
   - Acknowledge capacity warning

## Required Warehouse API Contract

Add a dedicated warehouse telemetry contract instead of overloading static system stages.

Recommended endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/system/warehouse/summary` | Capacity, health, used/free bytes, forecast, last sync, last restore proof |
| `GET /api/system/warehouse/sources` | Per-project source status, cadence, last ingest, lag, bytes/records, errors |
| `GET /api/system/warehouse/series?window=24h|7d|30d` | Time-series for storage used, bytes ingested, records ingested, mirror bytes, prune bytes |
| `GET /api/system/warehouse/jobs` | Collector, mirror, prune, archive, restore-proof job history |
| `POST /api/system/warehouse/sync` | Safe manual sync with audit record |
| `POST /api/system/warehouse/restore-proof` | Safe restore verification with evidence output |
| `POST /api/system/warehouse/prune-dry-run` | Non-destructive prune assessment |

## Shared Page Standard

Every Operate, Trading, and System page should have the same minimum contract:

1. **Current state**: what is happening right now?
2. **Freshness**: how old is this data, and is it stale?
3. **Trend**: what changed over the selected time window?
4. **Coverage**: which sources are included, missing, or partial?
5. **Risk**: what is broken, blocked, or dangerous?
6. **Next action**: what should the operator do?
7. **Evidence**: what proof backs this page?
8. **Safe controls**: what can be run from here without violating approval rules?
9. **Audit trail**: who/what changed state and when?
10. **Drilldown**: can the operator get from summary to source record?

## Build Plan

### Phase 1: Page Contract Registry

- Create a route-to-contract registry for Operate, Trading, and System.
- Each route declares whether it is static, live-read, charted, actionable, or audited.
- Show a small page health badge in each page header: static, partial, live, stale, error.

### Phase 2: System Warehouse First

- Add `/api/system/warehouse/*` backend contract.
- Implement warehouse summary cards:
  - used storage
  - free storage
  - 24h ingest
  - stale sources
  - mirror lag
  - restore proof
- Add charts:
  - storage used over time
  - bytes ingested over time
  - records ingested over time
  - ingest by project
- Add source table with cadence, lag, bytes, records, last success, last error.

### Phase 3: System Storage/Freshness/Workers

- Convert `/system/storage` from durable-artifact maturity text into live storage operations.
- Convert `/system/freshness` into live source freshness matrix.
- Convert `/system/workers` into live scheduler/worker monitor.

### Phase 4: System Deployments/Credentials

- Wire deployments to live deployed SHA, release history, health, rollback evidence, and promotion status.
- Wire credentials to presence-only checks, missing secret classes, rotation state, and safe test actions.

### Phase 5: Trading Strategies/Backtesting

- Replace static Strategy and Backtesting pages with live strategy/backtest contracts.
- Track strategy candidates, hypotheses, evidence, promotion gates, datasets, assumptions, results, and failures.

### Phase 6: Trading Evidence

- Add a dedicated trading evidence ledger.
- Link every strategy, backtest, risk decision, and head-trader action to supporting evidence.

### Phase 7: Operate Evidence and Runtime Hydration

- Replace local/static runtime hydration with server-first runtime loading.
- Add a dedicated Operate Evidence page.
- Add action closeout, approval result, and run output drilldowns.

### Phase 8: Charts and Time Windows Everywhere

- Add consistent 1h, 24h, 7d, 30d windows where the data makes sense.
- Standardize empty/stale/error/loading states.
- Make each chart answer an operator question rather than decorating the page.

### Phase 9: Safe Actions and Audit Writeback

- Add safe controls only after backend audit endpoints exist.
- Every action writes an audit record and links to evidence.
- Dangerous actions remain approval-gated.

### Phase 10: End-to-End Operational Proof

- Add Playwright/dashboard validation coverage for:
  - no page renders as static-only unless intentionally classified that way
  - warehouse shows capacity and ingest metrics
  - stale/error states render correctly
  - actions create audit/evidence records
  - route-specific Trading pages no longer look interchangeable

## Priority Order

1. `/system/warehouse`
2. `/system/storage`
3. `/system/freshness`
4. `/system/workers`
5. `/trading/strategies`
6. `/trading/backtesting`
7. `/operate/evidence`
8. `/trading/evidence`
9. `/system/deployments`
10. `/system/credentials`

## Bottom Line

The dashboard route map is ahead of the operational data contracts. That is why many pages exist but do not yet answer the natural question implied by their name.

For the specific **Data Warehouse** complaint, the page should not be considered mature until it shows capacity, ingestion, freshness, mirroring, pruning, restore proof, source coverage, trends, and safe actions.
