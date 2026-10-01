# Canonical Cross-Project Plan Registry

Generated: 2026-09-30

This registry consolidates the active and historical maturity plans across Nous Hermes Agent, Investing System, and Khashi VC. Its purpose is to prevent overlapping plans from becoming separate sources of truth. The rule is:

- Canonical plans are the operating source of truth.
- Supporting plans, audits, scorecards, and runbooks provide evidence or implementation detail.
- Superseded plans should not drive work unless they are explicitly mapped back into a canonical plan.

## Current Registry Status

| ID | Canonical plan | Primary owner | Status | Current readout |
| --- | --- | --- | --- | --- |
| CP-01 | Fleet Dashboard / Frontend Maturity | Nous Hermes Agent | Active | Dashboard quality system is mature, but proof hardening remains the gating item before treating dashboards as fully T3C-ready. |
| CP-02 | Operate / Trading / System Control Plane | Nous Hermes Agent | Active, partially built | System pages and contracts exist for warehouse, storage, freshness, workers, deployments, and credentials; route validation needs to be regenerated after Playwright/browser fixes. |
| CP-03 | Executive / Decision / Second-Brain Intelligence | Nous Hermes Agent | Active | Decision intelligence and compounding intelligence work is in progress; final production proof depends on Hermes Brain connectivity, second-brain sync, and preflight memory enforcement. |
| CP-04 | Cross-Project Data Warehouse / Storage / Archive | Cross-project | Active, ready | Warehouse/storage standards exist, Investing storage proof is ready, OANDA archive trust has bounded production proof, Khashi storage pressure is cleared by Docker build-cache maintenance proof, and Khashi backup/targeted restore proof is ready; destructive pruning stays approval-gated. |
| CP-05 | Investing Trading / OANDA Live-Readiness | Investing System | Active, should be merged | OANDA, FX risk, trading desk, pre-fund, and practice-to-live plans overlap and should be operated as one live-readiness track with levels 7-9 locked. |
| CP-06 | Investing Financial Analysis Maturity | Investing System | Active | Institutional financial analysis plan is the canonical investing analysis engine roadmap; should feed dashboard, memory, and executive intelligence. |
| CP-07 | Khashi Trading / Market Intelligence | Khashi VC | Active, should be merged | Khashi trading maturity, market intelligence, and research workspace plans overlap and should become one market-intelligence implementation lane. |
| CP-08 | Khashi Data Operations / Infrastructure Reliability | Khashi VC | Active | Khashi data ops, storage recovery, infrastructure split, lane split, and warehouse maturity should roll under the cross-project data operations standard. |
| CP-09 | Khashi Dashboard / T3C UI Readiness | Khashi VC + Nous Hermes Agent | Active | Khashi dashboard redesign, Mobbin research, and T3C readiness belong under the fleet dashboard/frontend maturity plan. |
| CP-10 | Reporting / Briefing / Daily Hard Stop | Khashi VC + Nous Hermes Agent | Active | Khashi reporting and daily hard-stop work should feed the Nous executive cockpit instead of remaining an isolated reporting surface. |
| CP-11 | Messaging / Agent Command Layer | Nous Hermes Agent | Active support layer | Discord, Telegram, reset commands, alerts, and approvals are shared infrastructure for all operating plans. |
| CP-12 | Legacy Umbrella / Historical Plans | Cross-project | Superseded / reference | Older execution and staged-build plans are retained for context, but should be mapped into CP-01 through CP-11 before driving new work. |

## CP-01 Fleet Dashboard / Frontend Maturity

Purpose: make the dashboards operationally useful, visually stable, tested, and ready for real executive/operator usage.

Canonical inputs:

- `nous-hermes-agent/docs/plans/wave-4-presentation-contract.json`
- `nous-hermes-agent/docs/fleet/tlc-operating-system-maturity-build-plan.md`
- `nous-hermes-agent/docs/fleet/tlc-operating-system-maturity-build-assessment.md`
- `nous-hermes-agent/docs/design/dashboard-fleet-ui-maturity-scorecard.md`
- `nous-hermes-agent/docs/design/dashboard-product-quality-control-plane.md`
- `nous-hermes-agent/docs/design/dashboard-product-quality-control-plane-report.md`
- `nous-hermes-agent/docs/design/dashboard-visual-maturity-rubric.md`
- `nous-hermes-agent/docs/design/dashboard-component-maturity-registry.json`
- `nous-hermes-agent/docs/design/dashboard-component-evidence-backlog.md`
- `nous-hermes-agent/docs/design/dashboard-cross-project-action-backlog.md`
- `nous-hermes-agent/docs/design/package-native-dashboard-migration-backlog.md`
- `nous-hermes-agent/docs/design/world-class-dashboard-system-backlog.md`

Merged or supporting inputs:

- `khashi-vc/docs/design/KHASHI_DASHBOARD_REDESIGN_PLAN.md`
- `khashi-vc/docs/design/KHASHI_MOBBIN_RESEARCH_PLAN.md`
- `khashi-vc/docs/khashi-t3c-readiness-audit-2026-09-26.md`
- `nous-hermes-agent/docs/design/static-dashboard-route-audit.json`
- `nous-hermes-agent/docs/design/dashboard-project-type-component-coverage-audit.md`
- `nous-hermes-agent/docs/design/dashboard-token-debt-backlog.md`

Current status:

- Active.
- The design system and migration standards exist.
- The remaining gating work is proof hardening: current/baseline visual evidence, route validation, accessibility evidence, and state coverage.

Next proof needed:

- Regenerate route validation after Playwright/browser setup.
- Store baseline/current screenshots for required viewports, themes, and states.
- Mark which dashboards are truly T3C-ready versus merely visually improved.

## CP-02 Operate / Trading / System Control Plane

Purpose: turn Operate, Trading, and System pages into actionable control-plane pages instead of passive overview pages.

Canonical inputs:

- `nous-hermes-agent/docs/plans/wave-2-operational-safety-contract.json`
- `nous-hermes-agent/docs/plans/2026-09-29-operate-trading-system-20-phase-execution-plan.md`
- `nous-hermes-agent/docs/operate-trading-system-page-audit.md`
- `nous-hermes-agent/docs/design/v71-v80-operational-readiness-build-plan.md`
- `nous-hermes-agent/docs/trading-intelligence-control-plane-frontend-spec.md`

Merged or supporting inputs:

- `nous-hermes-agent/docs/design/dashboard-downstream-platform-assessment.md`
- `nous-hermes-agent/docs/design/dashboard-cross-project-component-audit.md`
- `nous-hermes-agent/docs/design/dashboard-ultimate-gap-assessment.md`

Current status:

- Active, partially built.
- System warehouse, storage, freshness, workers, deployments, and credentials pages appear represented in the frontend code and supporting libraries.
- The original 20-phase plan should be updated with verified completion status instead of being treated as all-open.

Next proof needed:

- Re-run route validation for all Operate, Trading, and System routes.
- Update the 20-phase plan with `complete`, `partial`, `blocked`, or `not-started` for each phase.
- Confirm pages expose live data, stale/empty/error states, charts, actions, and audit writeback where appropriate.

## CP-03 Executive / Decision / Second-Brain Intelligence

Purpose: create compounding intelligence: cited memory, decision lineage, contradiction detection, stale-memory research loops, and agent preflight context injection.

Canonical inputs:

- `nous-hermes-agent/docs/plans/wave-3-intelligence-contract.json`
- `nous-hermes-agent/docs/plans/2026-09-29-decision-intelligence-layer-execution-plan.md`
- `nous-hermes-agent/docs/compounding-intelligence-dashboard-contract.md`
- `nous-hermes-agent/docs/design/dashboard-design-intelligence-registry.md`
- `nous-hermes-agent/docs/design/dashboard-design-intelligence-report.md`
- `nous-hermes-agent/docs/design/dashboard-platform-intelligence-system.md`
- `nous-hermes-agent/docs/design/dashboard-platform-intelligence-report.md`

Merged or supporting inputs:

- Second-brain/Obsidian sync work from the configured local vault.
- Hermes Brain service configuration and production URL work.
- Executive cockpit frontend/backend work.

Current status:

- Active.
- The conceptual layers are defined, but production readiness depends on proving Hermes Brain connectivity, second-brain warehouse sync, retrieval-pack preview, stale-memory states, and decision-lineage traceability.

Next proof needed:

- Verify `HERMES_BRAIN_URL` in local and production.
- Verify the second-brain sync path writes durable warehouse records.
- Add dashboard proof for source coverage, retrieval readiness, operating cadence, warehouse sync, and open memory actions.

## CP-04 Cross-Project Data Warehouse / Storage / Archive

Purpose: make data collection, storage, pruning, mirroring, archive, and restore behavior reliable across all projects.

Canonical inputs:

- `nous-hermes-agent/docs/plans/cross-project-warehouse-truth-contract.md`
- `nous-hermes-agent/docs/plans/cross-project-warehouse-truth-contract.json`
- `nous-hermes-agent/docs/plans/cross-project-storage-proof-registry.md`
- `nous-hermes-agent/docs/plans/cross-project-storage-proof-registry.json`
- `khashi-vc/docs/production-data-warehouse-maturity.md`
- `khashi-vc/docs/design/KHASHI_DATA_OPERATIONS_MATURITY_STANDARD.md`
- `khashi-vc/docs/ops/KHASHI_STORAGE_MATURITY_RUNBOOK.md`
- `khashi-vc/docs/ops/KHASHI_STORAGE_RECOVERY_AND_PREVENTION_PLAN.md`
- `investing-system/docs/ops/INVESTING_STORAGE_MATURITY_RUNBOOK.md`

Merged or supporting inputs:

- `khashi-vc/docs/proofs/khashi-storage-maturity-production.json`
- System warehouse/storage/freshness/workers pages in Nous.
- OANDA archive catalog and restore proof work in Investing System.

Current status:

- Active, ready with destructive pruning still approval-gated.
- OANDA bounded archive/restore and database restore proof are ready, Investing storage maturity is ready, Khashi storage pressure is cleared by Docker build-cache maintenance proof, Khashi backup/targeted restore proof is ready, and Nous has a ready cross-project storage proof registry. Destructive prune execution remains gated by archive, backup, restore, rollup, and explicit approval proof.

Next proof needed:

- Keep storage proof registry and Docker build-cache maintenance proof fresh.
- Keep destructive prune execution approval-gated after dry-run review.
- Surface the storage proof registry in Nous warehouse jobs and operator evidence.

## CP-05 Investing Trading / OANDA Live-Readiness

Purpose: safely move from practice/pre-fund readiness toward live-capable OANDA trading with risk, evidence, and operational gates.

Canonical inputs:

- `investing-system/docs/oanda-live-readiness-canonical-matrix.md`
- `investing-system/docs/oanda-live-readiness-canonical-matrix.json`
- `investing-system/docs/oanda-practice-to-live-level-0-9-build-plan.md`
- `investing-system/docs/oanda-pre-fund-maturity-build-plan.md`
- `investing-system/docs/oanda-trading-desk-plan.md`
- `investing-system/docs/fx-automated-risk-layer-adoption-plan.md`

Merged or supporting inputs:

- `investing-system/docs/leon-trading-boundary-split-build-plan.md`
- `investing-system/docs/leon-non-trading-maturity-plan.md`
- `investing-system/docs/execution-plan.md`
- `investing-system/docs/staged-build-plan.md`

Current status:

- Active, partially consolidated and locked.
- Bounded archive and backup restore proof exist; levels 7-9 stay blocked until fresh risk gates, live ops review, incident drill, and explicit scoped human approval exist.

Next proof needed:

- Keep the live-readiness matrix synced to warehouse, risk, and dashboard evidence.
- Add current risk-gate, live ops review, incident drill, and approval proof.
- Keep live trading blocked until all runtime, risk, restore, and human gates are green.

## CP-06 Investing Financial Analysis Maturity

Purpose: build institutional-grade financial statement analysis across growth, profitability, financial health, cash quality, capital allocation, forensic review, and valuation.

Canonical inputs:

- `investing-system/docs/wave-3-financial-analysis-intelligence-lane.md`
- `investing-system/docs/wave-3-financial-analysis-intelligence-lane.json`
- `investing-system/docs/institutional-financial-analysis-maturity-plan.md`
- `investing-system/docs/external-deep-dive-and-commodities-assessment.md`

Merged or supporting inputs:

- Investing dashboard/frontend work.
- Decision intelligence and second-brain memory work.

Current status:

- Active.
- This is separate from OANDA execution, but it should feed the same evidence, memory, and executive reporting layers.

Next proof needed:

- Convert each financial analysis category into testable engines or contracts.
- Store outputs in the warehouse and second-brain memory layer.
- Surface company-level analysis status and stale-data warnings in Nous.

## CP-07 Khashi Trading / Market Intelligence

Purpose: mature Khashi VC's trading and market intelligence workflow around source-backed research, signal quality, dashboard visibility, and operational evidence.

Canonical inputs:

- `khashi-vc/docs/ops/KHASHI_CP07_MARKET_INTELLIGENCE_LANE.md`
- `khashi-vc/docs/ops/KHASHI_CP07_MARKET_INTELLIGENCE_LANE.json`
- `khashi-vc/docs/design/KHASHI_COMPREHENSIVE_TRADING_MATURITY_PLAN_2026-09-03.md`
- `khashi-vc/docs/design/KHASHI_MARKET_INTELLIGENCE_IMPLEMENTATION_PLAN.md`
- `khashi-vc/docs/design/KHASHI_MARKET_INTELLIGENCE_AUDIT_SUMMARY.md`
- `khashi-vc/docs/market-intelligence-research-workspace-assessment.md`

Merged or supporting inputs:

- `khashi-vc/docs/design/KHASHI_CURRENT_DIRECTION_BUILD_BACKLOG_2026-08-04.md`
- `khashi-vc/docs/design/KHASHI_PLAN_RECONCILIATION_2026-08-04.md`
- `khashi-vc/docs/design/KHASHI_MATURITY_WORK_ASSESSMENT_2026-08-04.md`
- `khashi-vc/docs/design/KHASHI_MATURITY_ASSESSMENT_2026-09-04.md`
- `khashi-vc/docs/design/KHASHI_MATURITY_REASSESSMENT_2026-09-04.md`

Current status:

- Active, fragmented.
- The plan reconciliation document should be used as supporting evidence, but the canonical plan should now be this merged market-intelligence track.

Next proof needed:

- Define which market-intelligence signals are collected, how often, from which sources, and what qualifies as usable evidence.
- Connect Khashi status to Nous dashboards and warehouse freshness views.

## CP-08 Khashi Data Operations / Infrastructure Reliability

Purpose: make Khashi's infrastructure/data lanes reliable, observable, recoverable, and aligned with the cross-project warehouse standard.

Canonical inputs:

- `khashi-vc/docs/ops/KHASHI_CP08_DATA_OPS_IMPLEMENTATION_LANE.md`
- `khashi-vc/docs/ops/KHASHI_CP08_DATA_OPS_IMPLEMENTATION_LANE.json`
- `khashi-vc/docs/design/INFRASTRUCTURE_SPLIT_MATURITY_AUDIT_2026-09-09.md`
- `khashi-vc/docs/design/LANE_SPLIT_MATURITY_WORK_ANALYSIS_2026-09-09.md`
- `khashi-vc/docs/design/END_TO_END_MATURITY_WORK_AUDIT_2026-09-09.md`
- `khashi-vc/docs/design/KHASHI_DATA_OPERATIONS_MATURITY_STANDARD.md`

Merged or supporting inputs:

- `khashi-vc/docs/production-data-warehouse-maturity.md`
- `khashi-vc/docs/ops/KHASHI_STORAGE_RECOVERY_AND_PREVENTION_PLAN.md`
- `khashi-vc/docs/ops/KHASHI_STORAGE_MATURITY_RUNBOOK.md`

Current status:

- Active.
- Should be operated as the Khashi implementation lane under CP-04, not as a standalone competing infrastructure plan.

Next proof needed:

- Confirm production mounts, retention, archive, collector, and recovery checks.
- Surface Khashi-specific data health in Nous and Khashi dashboards.

## CP-09 Khashi Dashboard / T3C UI Readiness

Purpose: bring Khashi dashboard pages to the same component, evidence, visual QA, and operational actionability standard as the rest of the fleet.

Canonical inputs:

- `nous-hermes-agent/docs/plans/wave-4-presentation-contract.json`
- `khashi-vc/docs/design/KHASHI_DASHBOARD_REDESIGN_PLAN.md`
- `khashi-vc/docs/khashi-t3c-readiness-audit-2026-09-26.md`
- `khashi-vc/docs/design/KHASHI_MOBBIN_RESEARCH_PLAN.md`

Merged or supporting inputs:

- CP-01 Fleet Dashboard / Frontend Maturity.

Current status:

- Active, but should not remain separate from fleet UI standards.

Next proof needed:

- Store visual/accessibility/route proof for Khashi pages.
- Mark Khashi route readiness in the fleet scorecard.

## CP-10 Reporting / Briefing / Daily Hard Stop

Purpose: turn generated reports, daily hard stops, and operating summaries into a connected executive intelligence feed.

Canonical inputs:

- `khashi-vc/docs/ops/KHASHI_CP10_REPORTING_LANE.md`
- `khashi-vc/docs/ops/KHASHI_CP10_REPORTING_LANE.json`
- `khashi-vc/docs/design/KHASHI_REPORT_GENERATOR_MATURITY_PLAN.md`
- `khashi-vc/docs/reports/khashi-daily-hard-stop/2026-07-31-0600-assessment.md`

Merged or supporting inputs:

- Nous executive cockpit.
- Hermes Brain/second-brain memory layer.

Current status:

- Active.
- Reporting should feed CP-03 instead of living only as Khashi documents.

Next proof needed:

- Define report ingestion contract.
- Store report outputs as durable warehouse/memory events.
- Expose report freshness, coverage, unresolved risks, and decisions in Nous.

## CP-11 Messaging / Agent Command Layer

Purpose: make Discord, Telegram, alerting, password reset, approvals, and agent operations available as shared project infrastructure.

Canonical inputs:

- `nous-hermes-agent/docs/plans/wave-2-operational-safety-contract.json`
- `nous-hermes-agent/docs/plans/2026-06-09-003-fix-telegram-stream-overflow-continuations-plan.md`
- Discord password reset and dashboard access work already implemented in Nous.

Merged or supporting inputs:

- Production alerting and resource critical messages.
- Project-specific action commands.

Current status:

- Active support layer.
- Should support CP-01 through CP-10 but should not become its own product roadmap unless messaging itself is the feature.

Next proof needed:

- Verify command coverage across dashboards/projects.
- Confirm role/user authorization and audit logging.
- Add end-to-end tests for high-impact commands.

## CP-12 Legacy Umbrella / Historical Plans

Purpose: retain older plans for traceability without letting them compete with the active registry.

Historical/reference inputs:

- `investing-system/docs/execution-plan.md`
- `investing-system/docs/staged-build-plan.md`
- `khashi-vc/docs/execution-plan.md`
- `khashi-vc/docs/staged-build-plan.md`
- Older maturity assessments and reassessments after their findings are mapped into CP-01 through CP-11.

Current status:

- Superseded/reference.

Operating rule:

- Do not drive new work directly from these files.
- If a legacy item still matters, map it to a canonical plan, give it an owner/status/proof requirement, then execute from the canonical plan.

## De-Duplication Rules

1. A plan with both `.md` and `.json` forms counts as one plan.
2. A scorecard, audit, assessment, or proof file is evidence unless it contains a concrete phased build plan.
3. Khashi and Investing storage plans roll up into CP-04.
4. Khashi dashboard plans roll up into CP-01 and CP-09.
5. Investing OANDA, FX risk, trading desk, and pre-fund plans roll up into CP-05.
6. Executive cockpit, Hermes Brain, Obsidian/second brain, and decision intelligence roll up into CP-03.
7. Legacy execution/staged-build files should be treated as reference until mapped.

## Immediate Next Actions

1. Update each source plan header with `Canonical plan: CP-XX`.
2. Add `Superseded by: CP-XX` to legacy plans that should no longer be operated directly.
3. Regenerate dashboard route validation and fleet UI proof artifacts.
4. Update the 20-phase Operate/Trading/System plan with verified phase status.
5. Consolidate Investing OANDA/live-readiness documents into a single CP-05 status matrix.
6. Consolidate Khashi market-intelligence and data-operations documents into CP-07 and CP-08 implementation lanes.
7. Add this registry to dashboard documentation so Nous can show the active roadmap without surfacing duplicate plans as separate work.
