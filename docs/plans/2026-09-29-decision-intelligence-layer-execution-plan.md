# Decision Intelligence Layer Execution Plan

Generated: 2026-09-29

Purpose: build the deeper second-brain maturity layer that connects evidence, memories, decisions, contradictions, research loops, and agent preflight checks into one governed decision intelligence system.

This plan starts from the current Nous Hermes proof state:

- Operational route validation: `32/32` routes passed.
- Operational live-source validation: `43/48` sources reachable.
- Remaining dependency blocker: Hermes Brain is not reachable at `HERMES_BRAIN_URL` / port `3115`.
- Blocked pages: `/second-brain` and `/compounding-intelligence`.
- Blocked source class: Hermes Brain second-brain APIs only.

## Execution Rules

1. Work in order unless a phase is explicitly blocked by production infrastructure, credentials, or upstream services.
2. Every phase must leave a testable contract: schema, API, UI, proof report, or operational evidence.
3. High-impact memory and decision changes must be reviewable and auditable.
4. Automated research can create candidates and tasks, but must not silently rewrite high-impact memory.
5. Agent preflight checks must never hide stale, contradictory, or missing critical memory.
6. Every phase should end with generated evidence and a commit-ready checkpoint.

## Standard Test Gate

Use the narrowest relevant checks after each phase, then run broad checks before commit:

- `npm test`
- `npm run build`
- `npm run proof:compounding-intelligence`
- `npm test --workspace web -- second-brain`
- `npm test --workspace web -- operational-page-contracts`
- `npm run typecheck --workspace web`
- `npm test --workspace web`
- `npm run build --workspace web`
- `npm run dashboard:operational-routes:validate -- --base-url <dashboard-url> --strict`
- `npm run dashboard:operational-sources:validate`
- production proof curls for `agent.tlccapitalgroup.com/api/second-brain/*`

## Phase 1: Restore Hermes Brain Runtime

Status: locally complete on 2026-09-29; production service wiring remains Phase 2.

Evidence:

- Hermes Brain local health: `GET http://127.0.0.1:3115/health` returned `ok: true` with warehouse configured at `.data/warehouse`.
- Nous Hermes dashboard ran with `HERMES_BRAIN_URL=http://127.0.0.1:3115`.
- Operational live-source validation moved from `43/48` reachable with `5` Hermes Brain dependency-unavailable sources to `48/48` reachable.
- Operational route validation passed `32/32` routes; `/second-brain` and `/compounding-intelligence` returned live content.
- Web gates passed: targeted operational tests, full web test suite, typecheck, and production build.

Build:

- Start Hermes Brain locally on port `3115`.
- Confirm `GET /health` returns `ok: true`.
- Set or confirm `HERMES_BRAIN_URL` for Nous Hermes.
- Re-run Nous live-source validation.
- Document whether runtime is local, Docker, or production.

Done when:

- `curl -sS http://127.0.0.1:3115/health` succeeds.
- Nous source validation moves from `dependency_unavailable` to reachable for second-brain APIs.
- `/second-brain` and `/compounding-intelligence` render live data.

Tests:

- `npm run dev` or `npm start` in `hermes-brain`
- `npm run dashboard:operational-sources:validate`

## Phase 2: Production Service Wiring

Build:

- Deploy or start `hermes-brain` as an internal service.
- Set production `HERMES_BRAIN_URL=http://hermes-brain:3115` or same-host fallback.
- Verify shared network reachability from Nous Hermes.
- Confirm production warehouse root and data file mounts.

Done when:

- `https://agent.tlccapitalgroup.com/api/second-brain/compounding-intelligence` returns a report.
- `https://agent.tlccapitalgroup.com/api/second-brain/retrieval-pack?q=production&project=nous-hermes-agent` returns cited context or honest empty state.

Tests:

- `curl -sS http://127.0.0.1:3115/health`
- `curl -sS https://agent.tlccapitalgroup.com/api/second-brain/compounding-intelligence`

## Phase 3: Decision Record Schema

Build:

- Add `decision_records` model in Hermes Brain.
- Fields: id, project, business unit, decision type, title, summary, decided at, owner, status, risk class, impact class.
- Add source evidence refs, prior memory refs, assumptions, expected outcome, actual outcome, review state.
- Add stable IDs for warehouse sync.

Done when:

- Decision records can represent investing, trading, operations, deployment, and governance decisions.
- Complete, partial, and blocked records are test-covered.

Tests:

- Unit tests for decision schema validation.
- Warehouse export shape tests.

## Phase 4: Decision Lineage Graph

Build:

- Add lineage edges: `source_event -> memory -> decision -> outcome`.
- Add edge types: supports, contradicts, supersedes, caused, mitigates, depends-on, informed.
- Add APIs for lineage readback by decision, memory, project, and source event.
- Add "why did we believe this?" and "what changed?" response builders.

Done when:

- A decision can explain supporting evidence, prior memories, assumptions, and outcome status.
- Changed assumptions are visible and linked.

Tests:

- Decision with full lineage returns complete graph.
- Decision with missing evidence is flagged.
- Superseded memory changes the "what changed" answer.

## Phase 5: Decision Lineage Warehouse Sync

Build:

- Add warehouse tables or snapshot sections for decisions, assumptions, outcomes, and lineage edges.
- Add idempotent sync for decision lineage.
- Add restore proof that lineage survives warehouse export/import.

Done when:

- Warehouse proof can count decision records and lineage edges.
- Re-running sync does not duplicate records.

Tests:

- Idempotent sync test.
- Restore proof test.

## Phase 6: Nous Decision Lineage UI

Build:

- Add dashboard panel or route for Decision Lineage.
- Show decision list, status, risk, source memories, assumptions, and outcome.
- Add drill-through from source event to memory to decision to result.
- Add loading, empty, error, stale, and partial states.

Done when:

- Operator can answer "why did we believe this?" from Nous.
- Operator can see which memories influenced a decision.

Tests:

- Frontend tests for complete/sparse/error states.
- Playwright route proof.

## Phase 7: Contradiction Model

Build:

- Add contradiction records or graph edges.
- Fields: conflicting node ids, contradiction type, severity, confidence, business risk, affected projects, affected decisions.
- Add contradiction status: open, acknowledged, resolved, superseded, false-positive.

Done when:

- Hermes Brain can represent contradictions without overwriting either side.
- Contradictions can be ranked and resolved.

Tests:

- Direct contradiction test.
- Cross-project contradiction test.
- False-positive resolution test.

## Phase 8: Contradiction Detection

Build:

- Detect conflicts across Investing System, Khashi VC, Nous Hermes, TLC, and Hermes Brain.
- Compare stale thesis vs new filing, strategy lesson vs new performance, operational assumption vs current runtime state.
- Add source-specific contradiction rules before semantic/vector detection.

Done when:

- At least one deterministic contradiction path exists for investing, trading, and operations.
- Contradictions include evidence refs and suggested resolution path.

Tests:

- Investing conflict fixture.
- Trading conflict fixture.
- Operations conflict fixture.

## Phase 9: Business-Risk Ranking

Build:

- Score contradictions by capital impact, operational impact, freshness gap, confidence delta, project criticality, and decision dependency.
- Add risk bands: low, medium, high, critical.
- Add "blocks high-impact use" flag.

Done when:

- High-risk contradictions are prioritized above low-risk semantic noise.
- Risk score is explainable.

Tests:

- Ranking tests with multiple contradictions.
- High-impact dependency blocks retrieval.

## Phase 10: Contradiction Resolution Workflow

Build:

- Add review queue for contradictions.
- Add actions: acknowledge, resolve by superseding, resolve by source correction, mark false-positive, create research task.
- Require human approval for high-impact resolution.
- Write audit records for all resolution changes.

Done when:

- Operator can resolve contradictions without losing the evidence trail.

Tests:

- Resolution audit test.
- High-impact approval-required test.

## Phase 11: Nous Contradiction Dashboard

Build:

- Add contradiction queue in Nous.
- Show severity, affected projects, affected decisions, evidence, and recommended action.
- Add drill-through to decision lineage and memory nodes.

Done when:

- Operator can see which contradictions block decisions.
- Resolved contradictions remain auditable.

Tests:

- UI states for no contradictions, low risk, high risk, blocked.
- Route validation.

## Phase 12: Stale Memory Research Triggers

Build:

- Add research-trigger records for stale, low-confidence, contradicted, or decision-critical memories.
- Add trigger policies by source system and memory type.
- Generate research tasks instead of silently modifying memory.

Done when:

- Stale memory can create a research task with source refs and required proof.

Tests:

- Stale memory creates research task.
- Fresh memory does not.
- High-impact memory requires review before update.

## Phase 13: Investing Research Adapter

Build:

- Add research adapter contract for filings, financials, news, valuation assumptions, thesis changes, and risk updates.
- Preserve citations and source timestamps.
- Create candidate memories from research results.

Done when:

- Investing stale thesis can trigger cited research and candidate update.

Tests:

- Filing/news fixture creates candidate.
- Missing source creates blocked research task.

## Phase 14: Trading Research Adapter

Build:

- Add research adapter contract for market data, strategy performance, paper/shadow results, freshness, and risk.
- Link findings to Khashi VC and trading memory.
- Create candidate memories for strategy lessons and blocker updates.

Done when:

- Trading stale strategy memory can trigger market/performance research.

Tests:

- Strategy performance fixture creates candidate.
- Risk breach creates review task.

## Phase 15: Operations Research Adapter

Build:

- Add adapter for incidents, deployments, logs, workers, warehouse, freshness, credentials, and automations.
- Link operational evidence to decision records and memory updates.
- Create operations candidates from incidents and repeated failures.

Done when:

- Operational stale assumption can trigger evidence gathering and memory candidate creation.

Tests:

- Incident fixture creates lesson candidate.
- Warehouse freshness failure creates review task.

## Phase 16: Research Queue UI

Build:

- Add research queue to Nous or Second Brain page.
- Show trigger reason, source system, required evidence, status, and linked memory.
- Add review actions for accepting/rejecting research-generated candidates.

Done when:

- Operators can manage research tasks from dashboard without reading raw logs.

Tests:

- UI tests for queued, running, blocked, completed, rejected.

## Phase 17: Agent Preflight Contract

Build:

- Define preflight request: task description, project, workflow, risk class, entities, ticker/strategy/source refs.
- Define preflight response: relevant memories, decisions, contradictions, stale assumptions, warnings, required acknowledgements, block reasons.
- Add policy levels: warn, acknowledge, block.

Done when:

- A task can ask Hermes Brain whether it is safe/context-ready to proceed.

Tests:

- Low-risk task warns.
- Medium-risk task requires acknowledgement.
- High-risk task blocks on unresolved contradiction.

## Phase 18: Agent Preflight API

Build:

- Add Hermes Brain API for preflight memory packs.
- Add Nous proxy route.
- Include cited retrieval pack and decision lineage references.
- Persist preflight proof to audit trail.

Done when:

- Preflight API returns cited context and blocking policy.

Tests:

- Complete preflight returns citations.
- Stale memory warning appears.
- Contradiction blocks high-risk request.

## Phase 19: Agent Runtime Integration

Build:

- Integrate preflight checks before selected agent tasks.
- Target workflows: production changes, investing analysis, Khashi strategy review, warehouse maintenance, dashboard maturity changes.
- Add override/acknowledgement policy with audit.

Done when:

- Agent does not silently proceed when critical memory is stale, contradicted, or missing.

Tests:

- Preflight called before high-impact workflow.
- Blocked preflight prevents action.
- Acknowledged preflight writes audit.

## Phase 20: Nous Preflight UI

Build:

- Add preflight panel to relevant pages.
- Show retrieved memories, warnings, contradictions, stale assumptions, and block state.
- Add "acknowledge and continue" only where policy permits.

Done when:

- Operator sees memory context before major work starts.

Tests:

- UI tests for pass, warn, acknowledge, block.
- Route validation.

## Phase 21: Evidence And Audit Packets

Build:

- Generate exportable audit packets for decisions, contradictions, research tasks, and preflight checks.
- Include source refs, memory refs, warehouse manifest hash, and outcome state.
- Add packet hash and restore proof.

Done when:

- A decision can be audited outside the live app.

Tests:

- Packet generation test.
- Packet restore/verification test.

## Phase 22: Operating Metrics And SLOs

Build:

- Track decision lineage coverage.
- Track unresolved contradictions by risk.
- Track stale-memory research age.
- Track preflight pass/warn/block rates.
- Track memory usefulness and outcome follow-up rates.

Done when:

- Nous can show whether the decision intelligence layer is improving or degrading.

Tests:

- Metrics report generation.
- Dashboard source validation.

## Phase 23: Production Automation

Build:

- Schedule staleness scans.
- Schedule contradiction scans.
- Schedule warehouse sync.
- Schedule research queue generation.
- Alert on failed scans, stale sync, or rising critical contradictions.

Done when:

- The system keeps checking itself without manual runs.

Tests:

- Cron/job records visible.
- Failed job writes evidence and alert.

## Phase 24: Cross-Project Source Coverage

Build:

- Ensure Investing System, Khashi VC, Nous Hermes, TLC OS, and Hermes Brain contribute candidates.
- Add project-level coverage and freshness.
- Add "memory-poor project" alerts.

Done when:

- Operator can see which projects are learning and which are silent.

Tests:

- Missing project source is flagged.
- Healthy project source is green.

## Phase 25: Final Decision Intelligence Proof

Build:

- Create one investing decision lineage.
- Create one Khashi/trading contradiction.
- Trigger one stale-memory research loop.
- Run one agent preflight check.
- Prove warn/ack/block policies.
- Sync everything to warehouse.
- Export audit packet and restore proof.

Done when:

- The system demonstrates source event -> memory -> decision -> result.
- Contradictions can block high-impact use.
- Stale memories trigger research.
- Agent preflight injects cited context and policy warnings.

Tests:

- Full proof command.
- Nous route/source validation.
- Warehouse restore proof.
- Audit packet verification.

## Completion Definition

The Decision Intelligence Layer is mature when:

- Every major decision can explain why it was made.
- Evidence, memories, assumptions, and outcomes are linked.
- Contradictions are detected, ranked, reviewed, and audited.
- Stale memories trigger research instead of silently aging.
- Agents receive relevant memory before high-impact work.
- High-impact work blocks on unresolved critical memory risks.
- Decision intelligence syncs to the warehouse and restores cleanly.
- Nous exposes all of this in operator-ready dashboards.
