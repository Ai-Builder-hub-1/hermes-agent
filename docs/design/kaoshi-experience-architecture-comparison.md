# Kaoshi Experience Architecture Comparison

Status: baseline comparison created from `Kaoshi_Experience_Architecture_Gap_Analysis_Handoff.docx`
Source commit: `c420cd91d`
Owner: Nous Hermes Agent / Hermes Dashboard Kit

## Executive Summary

The Kaoshi handoff is asking for a full experience-architecture operating layer, not only a nicer chart kit. The current Nous Hermes Agent dashboard system is materially ahead of where it started: it has a canonical package, design contract, adoption registry, visual QA, proof endpoint concept, workspace model, dashboard contracts, and reusable visualization components.

The remaining gap is that those pieces are not yet organized into the complete Kaoshi audit workflow: repository inventories, feature traces, experience contracts, dependency graph, risk register, work-package roadmap, and verification evidence pack. That is why downstream projects can still adopt the kit yet produce dashboards that feel incomplete, too generic, or disconnected from live operator questions.

## What The Handoff Requires

The handoff defines a layered Experience Architecture System:

| Layer | Required Outcome |
| --- | --- |
| Product and experience principles | User outcomes, trust model, density, human/AI boundaries, decision hierarchy |
| Information architecture | Route model, navigation, drilldowns, object hierarchy, context retention |
| Design system | Tokens, primitives, variants, states, responsive behavior, contribution rules |
| Visualization system | Chart decision rules, semantic colors, analytical interactions, uncertainty, fallbacks |
| Capability layer | Live monitoring, graphing, simulations, AI-assisted workflows, high-risk actions |
| Cross-layer contracts | Data, permissions, freshness, failures, telemetry, accessibility, state machines |
| Governance and quality | Admission, adoption, versioning, deprecation, CI checks, evidence |

The handoff also requires eight audit outputs:

1. Current-state repository map
2. Existing capability inventory
3. Gap register
4. Dependency graph
5. Decision and risk register
6. Sequenced build roadmap
7. Machine-readable standards
8. Verification pack

## Current Nous Hermes Agent Coverage

| Required Area | Current Evidence | Current State |
| --- | --- | --- |
| Canonical shared kit | `packages/hermes-dashboard-kit` | Strong foundation exists |
| Machine-readable design contract | `packages/hermes-dashboard-kit/DESIGN.md` | Exists, needs Kaoshi audit extension |
| Shared data contracts | `packages/hermes-dashboard-kit/src/contracts.ts`, `docs/design/dashboard-data-contracts.md` | Exists for dashboard snapshots, cost, health, telemetry |
| Visualization primitives | `packages/hermes-dashboard-kit/src/data-visualization.tsx`, `src/charts.tsx` | Exists, but chart admission and interaction contracts are not yet strict enough |
| Product interface primitives | `src/product-interface.tsx`, `DESIGN.md` registry | Exists, but deeper feature traces are not yet required |
| Adoption registry | `packages/hermes-dashboard-kit/adoption/registry.json` | Exists and covers priority projects |
| Runtime proof concept | `docs/design/dashboard-production-proof-endpoints.md` | Exists, downstream endpoints and baselines incomplete |
| Visual QA | `docs/design/dashboard-visual-quality-report.json` | Exists, but still heuristic and not enough for premium approval |
| World-class audit | `docs/design/world-class-dashboard-system-audit.json` | Exists, score currently limited by downstream proof, telemetry, and adoption gates |
| IA model | `docs/design/dashboard-information-architecture.md` | Exists with six shared workspaces |
| Mobbin workflow | `docs/design/mobbin-reference-workflow.md` | Exists as a reference process |

## Main Mismatch

The current system answers: "Do we have a shared dashboard kit and can projects adopt it?"

The Kaoshi handoff asks: "Can a human or agent prove the current experience architecture, identify every gap with evidence, and start large implementation stretches without rediscovering hidden dependencies?"

That difference matters because the current kit can still be used poorly. A dashboard can import the CSS, show charts, and pass basic adoption checks while still failing the product-level questions:

- What decision does this view support?
- Is this data live, near-live, periodic, historical, forecast, or manual?
- What is stale, partial, uncertain, permission-limited, or blocked?
- What should the operator do next?
- What evidence proves the UI is rendering real data and not placeholder/prototype states?
- Which component or chart is allowed for this use case, and why?

## Evidence-Backed Gap Themes

### 1. Audit Artifacts Are Not Yet First-Class

The handoff expects `experience-audit/*` inventories and evidence ledgers. The repo has several reports, but not a consolidated Kaoshi audit package with repository map, surfaces, components, visualizations, contracts, gaps, decisions, roadmap, and verification evidence.

Evidence:

- Existing reports live under `docs/design/*`.
- No canonical `experience-audit/` package exists yet.

### 2. Experience Contracts Are Partial

The kit has dashboard data contracts, but it does not yet require the full contract families for every reusable component or dashboard capability: purpose, data, state, interaction, freshness, responsive, accessibility, performance, security, observability, quality, and governance.

Evidence:

- `DashboardSnapshotContract` covers modules, metrics, alerts, activity, cost, health, readiness, telemetry.
- `DashboardDataSourceState` covers owner, endpoint, freshness, status, failure mode.
- Missing: component-level admission rules, prohibited use, interaction affordances, performance budgets, observability events, field masking, and equivalent table/text requirements.

### 3. Visualization Governance Needs Stronger Admission Rules

The kit has chart components, but the Kaoshi handoff requires a visualization decision matrix and proof that each visual solves a product problem rather than novelty.

Evidence:

- `PriceMovementChart`, `SpreadBandChart`, `LiquidityDepthChart`, `VolumePulseChart`, `CategoryHeatmap`, `OpportunityMatrix`, and others exist.
- `docs/design/mobbin-reference-workflow.md` guides references, but there is not yet a strict chart intent matrix tied to user questions, data shape, freshness, and fallback behavior.

### 4. Feature Traces Are Missing

The handoff requires at least five end-to-end traces: simple CRUD, analytical dashboard, live/frequently refreshed view, AI-assisted workflow, and high-risk action.

Evidence:

- Current docs define contracts and migration plans.
- No single artifact traces five representative features across data source, schema, API, cache, state machine, UI, permissions, telemetry, accessibility, tests, and failure modes.

### 5. Production Proof Is Designed But Not Fully Adopted

The proof endpoint contract exists, but the current maturity report shows several projects lack screenshot baselines or telemetry-normalized maturity.

Evidence:

- `docs/design/dashboard-maturity-report.json` shows Kashi at level 6 with production screenshot baseline missing.
- Several projects are current in adoption but missing complete telemetry or production baselines.

### 6. Visual Quality Is Still Heuristic

The visual-quality report is useful, but the handoff requires evidence strong enough for production-grade visual approval.

Evidence:

- `docs/design/dashboard-visual-quality-report.json` notes the score is heuristic and human/Mobbin review is still required.
- Kashi and Media Engine score 83 and need review.

### 7. Downstream Dashboard Enforcement Is Not Yet Hard Enough

The central registry can detect stale surfaces, but downstream projects still need local manifests, proof routes, telemetry endpoints, package-native migration, and adoption gates.

Evidence:

- `docs/design/world-class-dashboard-system-backlog.md` lists remaining blockers across adoption, runtime proof, design quality, data contract, governance, and observability.

## Recommendation

Proceed with the Kaoshi Experience Architecture layer inside Nous Hermes Agent first. Do not start by redesigning every downstream dashboard. Build the audit and contract system centrally, then use Kashi VC as the first full reference migration.

Recommended sequence:

1. Create Kaoshi audit package and machine-readable inventories.
2. Add full experience contract schemas and validation expectations.
3. Add a visualization intent matrix and chart admission rules.
4. Trace five representative features end to end.
5. Create the dependency graph and risk register.
6. Promote Kashi Market Intelligence as the first reference implementation.
7. Use proof endpoints, production screenshots, telemetry, accessibility, and visual QA as required exit evidence.

## First Reference Implementation

Reference surface: Kashi VC Market Intelligence / Live Volatility.

Why this surface:

- It exposes the problem most clearly: live vs stale data, prototype vs production chart states, pagination, category taxonomy, chart quality, drilldowns, and operator decision-making.
- It uses market data where freshness and evidence matter.
- It is already registered as a priority dashboard surface in `packages/hermes-dashboard-kit/adoption/registry.json`.

The reference implementation should prove:

- live data contract
- snapshot history contract
- chart intent mapping
- table pagination standard
- drilldown/drawer state
- stale/empty/partial/error treatment
- production proof endpoint
- screenshot evidence
- visual-quality threshold
- adoption-current report

