# Kaoshi Experience Architecture Build Plan

Status: active planning baseline
Current central-system score: `82.4/100` per `docs/design/world-class-dashboard-system-backlog.md`
Target: governed, evidence-backed, machine-readable experience architecture that can drive Kashi and other dashboard redesigns without one-off guessing.

## Version Ladder

| Version | Goal | Status |
| --- | --- | --- |
| V1 | Evidence and architecture baseline | Complete |
| V2 | Experience contract foundation | Complete |
| V3 | Visualization decision and wrapper layer | Complete |
| V4 | Live-data reference capability | Complete - central standard plus Kashi VC live reference implemented |
| V5 | Screen-level Kashi reference migration | Live Market Intelligence reference complete with Kashi-owned contracts and production proof |
| V6 | Governance and enforcement | Complete - admission gates, ownership, proof, exceptions, and strict local validation are in place |
| V7 | Broad adoption across priority dashboards | Planned |
| V8 | Advanced capability modules | Deferred until V1-V7 proof exists |

## V1 - Evidence And Architecture Baseline

Goal: make the current system legible before more redesign work.

Deliverables:

- [x] `experience-audit/repository-map.yaml`
- [x] `experience-audit/surfaces.yaml`
- [x] `experience-audit/components.yaml`
- [x] `experience-audit/visualizations.yaml`
- [x] `experience-audit/contracts.yaml`
- [x] `experience-audit/evidence-ledger.yaml`
- [x] current commit, runtime, package manager, dashboard commands, and active plans
- [x] complete product-surface classification by workspace and user purpose across downstream projects
- [x] trace imports and consumers beyond the central dashboard kit
- [x] `experience-audit/feature-traces.yaml`
- [x] `experience-audit/dependency-graph.yaml`
- [x] `experience-audit/verification-pack.yaml`

Exit evidence:

- `npm run dashboard:spine:validate`
- `npm run dashboard-kit:adoption:report`
- `npm run dashboard:kaoshi:validate`
- Repository map includes evidence paths for every major claim.

## V2 - Experience Contract Foundation

Goal: make every reusable dashboard capability describe what it is allowed to do and what proof it must provide.

Deliverables:

- [x] experience contract schema covering purpose, data, state, interaction, freshness, responsive, accessibility, performance, security, observability, quality, and governance
- [x] state taxonomy for initial, loading, partial, empty, success, refreshing, stale, offline, unauthorized, unavailable, and error
- [x] freshness taxonomy for static, manual, periodic, near-live, live, historical, forecast, and unknown
- [x] standard metadata format for dashboard capabilities
- [x] validation rules for missing owner, freshness, data source, interaction contract, and proof evidence
- [x] `docs/design/kaoshi-experience-contract-standard.md`
- [x] `experience-audit/experience-contract.schema.json`
- [x] `experience-audit/experience-contracts.yaml`

Exit evidence:

- schema validates example contracts
- Kashi Market Intelligence has a draft experience contract
- dashboard-kit docs reference the contract before UI work
- `npm run dashboard:kaoshi:validate`

## V3 - Visualization Decision And Wrapper Layer

Goal: make chart choice intentional instead of generic.

Deliverables:

- [x] visualization intent matrix
- [x] chart admission rules by user question and data shape
- [x] approved chart families and variants
- [x] accessible fallback requirements for every visualization
- [x] standard tooltip, crosshair, legend, axis, empty, stale, and preview patterns
- [x] chart quality checklist informed by Mobbin references but implemented in Hermes kit language
- [x] `docs/design/kaoshi-visualization-decision-system.md`
- [x] `experience-audit/visualization-intent-matrix.yaml`

Required chart families:

- [x] time-series: line, area, stepped, sparkline, multi-series, comparison, event-annotated
- [x] market microstructure: price movement, spread band, order book ladder, depth, volume pulse
- [x] category comparison: heatmap, ranked table, grouped bar, treemap, matrix
- [x] uncertainty and forecast: forecast cone, confidence band, scenario range
- [x] distribution: histogram, box/violin-style summary, percentile strip
- [x] flow and dependency: sankey, dependency graph, funnel, handoff timeline
- [x] executive finance: provider spend timeline, waterfall, budget burn, cost/revenue ratio
- [x] readiness and quality: radar, scorecard, maturity ladder, gate checklist

Exit evidence:

- visualizations inventory has owner, use case, data shape, state behavior, and fallback for each chart.
- direct one-off chart usage is reported.
- Kashi chart set maps to the matrix.
- `npm run dashboard:kaoshi:validate`

## V4 - Live-Data Reference Capability

Goal: define one reusable pattern for live or near-live dashboards and prove it inside Kashi VC.

Important status note: the central reference standard is complete in Nous Hermes Agent and the Kashi VC live Market Intelligence reference now implements the live-data capability.

Deliverables:

- [x] polling/streaming contract
- [x] last-updated and data-age standard
- [x] stale threshold and retry behavior
- [x] snapshot-series contract for chart drawers
- [x] live table pagination and virtualization standard
- [x] degraded-source and partial-data display standard
- [x] telemetry events for refresh success, refresh failure, stale duration, and drilldown selection
- [x] `docs/design/kaoshi-live-data-reference-capability.md`
- [x] `experience-audit/live-data-reference.yaml`
- [x] Kashi VC live market source emits the required live-data fields
- [x] Kashi VC live market table uses the live table pagination/virtualization rule
- [x] Kashi VC selected-market drawer renders real snapshot charts when `snapshotCount >= 2`
- [x] Kashi VC distinguishes real, stale, partial, empty, error, and preview states
- [x] Kashi VC production proof route proves live-data state without interactive login

Exit evidence:

- Kashi live market list can distinguish live data, stale data, preview data, and no-data states.
- chart drawers render real snapshot series when present and explicit preview only when mock mode is intentionally selected.
- `npm run dashboard:kaoshi:validate`
- Kashi-specific implementation smoke/proof checks pass from the Kashi VC project.

## V5 - Screen-Level Kashi Reference Migration

Goal: prove the model on the highest-friction surface before broad adoption.

Reference surface:

- Kashi VC Market Intelligence / Live Volatility

Deliverables:

- [x] six-workspace mapping for Kashi dashboard - Kashi VC `docs/design/KHASHI_WORKSPACE_MAPPING_CONTRACT.md`
- [x] live market table with pagination
- [x] selected-market drilldown drawer with real chart data
- [x] category and subcategory taxonomy contract - Kashi VC `docs/design/KHASHI_MARKET_TAXONOMY_CONTRACT.md`
- [x] market snapshot-series contract - Kashi VC `docs/design/KHASHI_MARKET_SNAPSHOT_SERIES_CONTRACT.md`
- [x] visual selection bridge loaded for review
- [x] production proof endpoint
- [x] screenshot baseline
- [x] visual-quality score of at least 90
- [x] adoption-current report

Exit evidence:

- `npm run dashboard-kit:adoption:report`
- `npm run dashboard:production-proof:registry`
- `npm run dashboard:production-proof:capture -- --id=khashi-vc.roc`
- `HERMES_DASHBOARD_PROOF_TOKEN=dev-dashboard-proof-token npm run dashboard:production-proof:capture -- --id=khashi-vc.roc --local`
- `npm run dashboard:visual-quality:score`
- Kashi-specific smoke test for live market drilldown chart rendering

Evidence note:

- Production readonly proof screenshot captured at `docs/design/production-screenshots/khashi-vc.roc.png`.
- Production registry status is `baseline-present` for `khashi-vc.roc` with `localProofUsed: false` and `httpStatus: 200`.
- Kashi VC owns the workspace, taxonomy, and snapshot-series contracts that close the remaining V5 reference gaps.
- Captured proof includes the Live Market Intelligence summary, live market tape, selected-market drawer, real chart-readiness fields, and chart surfaces without prototype-preview behavior for real data.

## V6 - Governance And Enforcement

Goal: make standards hard to bypass.

Deliverables:

- [x] admission RFC template - `docs/design/dashboard-admission-rfc-template.md`
- [x] owner and reviewer fields for each surface/capability - `experience-audit/surfaces.yaml` and `experience-audit/governance-gates.yaml`
- [x] required dashboard recipe selection - `experience-audit/governance-gates.yaml`
- [x] required data contract before UI build - `experience-audit/governance-gates.yaml`
- [x] required proof route for production dashboards - `experience-audit/governance-gates.yaml`
- [x] CI or local strict gate for adoption, contract, and proof failures - `scripts/validate-dashboard-governance.mjs`
- [x] exception/deprecation process - `docs/design/dashboard-governance-and-enforcement.md`

Exit evidence:

- `npm run dashboard:governance:validate`
- `npm run dashboard:kaoshi:validate`
- strict audit can fail unowned, unreviewed, uncontracted, unproven, or expired-exception dashboard changes
- governed backlog includes owner, reviewer, severity, dependency, expiration, replacement plan, and validation for each exception

## V7 - Broad Adoption

Goal: migrate priority dashboards by dependency cluster, not scattered page tweaks.

Priority clusters:

1. Kashi VC Market Intelligence and System Operations
2. Media Engine Operations and Human Video Package workflow
3. Hermes Cost Cockpit / Capacity Command Center
4. Media Business OS executive rollups
5. TLC Capital Group OS readiness and enterprise overview

Deliverables:

- [ ] project manifests are current
- [ ] telemetry normalized where available
- [ ] production proof endpoints declared
- [ ] screenshot baselines captured
- [ ] visual QA thresholds met
- [ ] package-native migration plan for each priority dashboard

Exit evidence:

- maturity report reaches level 8+ for Kashi and Media Engine
- world-class dashboard score reaches 90+

## V8 - Advanced Capability Modules

Status: deferred until V1-V7 are stable.

Potential modules:

- relationship graphs
- dependency maps
- portfolio radars
- scenario simulation
- collaborative review
- AI-generated investigation plans
- 3D or spatial views where they solve a real operator problem

Admission rule:

Advanced visuals must answer a user decision that cannot be answered clearly with table, card, timeline, matrix, or standard chart patterns.

## Build Order Recommendation

Start with V1-V3 in Nous Hermes Agent. V4 and the first V5 Kashi reference are now complete for Live Market Intelligence. Return to Nous Hermes Agent for V6 enforcement, then use Kashi VC as the first downstream proof target for broader adoption.

## Backlog Items Held For Later

- direct publishing integrations
- credentialed production auth bypass beyond readonly proof routes
- full package-native migrations for every downstream dashboard
- advanced 3D/spatial visualization
- AI agent execution controls beyond review and recommendation states
