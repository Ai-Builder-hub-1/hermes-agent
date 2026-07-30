# Capacity Command Center Plan

## Purpose

The Capacity Command Center is the first redesign slice for the Hermes command prototype. It is not just a prettier token dashboard. It is the portfolio-level cockpit for understanding how much capacity the TLC/Hermes system is consuming across business units, models, providers, workflows, and time windows.

This plan belongs in Nous Hermes Agent because the dashboard kit and prototype lab live here. Hermes OS should consume the resulting contracts as the technical command rail. TLC Capital Group OS should consume the business rollups once the data is reliable.

## Design Read

Reading this as: enterprise operations cockpit for an owner/operator, with a dense but calm command-center language, leaning toward the shared Hermes dashboard kit plus chart-forward capacity modules.

## Operating Questions

The screen must answer these before any visual polish matters:

- What are we spending or consuming right now?
- Which business unit is consuming the most tokens, API calls, storage, scan capacity, or job throughput?
- Which model/provider/workflow is driving the increase?
- Is usage improving, flat, or getting worse over 3, 7, 14, 30, and 90 days?
- What budget or capacity thresholds are close to breaking?
- Which data is missing, stale, estimated, or not trusted yet?
- What should the operator do next?

## Workspace Placement

Primary workspace: `capacity`

Secondary workspaces:

- `command`: summary alerts and recommended next actions.
- `operations`: running jobs, queues, ingestion freshness, and failed telemetry collection.
- `projects`: business-unit comparison.
- `controls`: budget gates, model fallback gates, and data collection toggles.

## V1 Data Contract

The first implementation defines a `DashboardSnapshotContract` for the Capacity Command Center in:

```ts
import {
  buildCapacityCommandCenterSnapshot,
  buildSampleCapacityCommandCenterSnapshot,
  type CapacityCommandCenterInput,
} from "@hermes/dashboard-kit";
```

Required modules:

| Module | Workspace | Purpose |
| --- | --- | --- |
| Capacity Overview | `capacity` | Portfolio-wide tokens, cost estimate, API calls, storage, and throughput. |
| Business Unit Breakdown | `projects` | Rank business units by usage, cost pressure, missing data, and trend. |
| Provider And Model Usage | `capacity` | Compare OpenAI, Gemini, DeepSeek, local Codex, deterministic scripts, and future providers. |
| Workflow Cost Drivers | `capacity` | Show which workflows consume the most capacity: media generation, research scans, dashboard builds, coding tasks, social posting, etc. |
| Trend Windows | `capacity` | 3d, 7d, 14d, 30d, and 90d trend comparison. |
| Data Trust And Freshness | `operations` | Show which feeds are live, estimated, stale, missing, or manual. |
| Budget Gates | `controls` | Show caps, remaining budget, approvals needed, and hard stops. |
| Operator Attention | `command` | Show anomalies, spikes, missing feeds, and recommended actions. |

## Required Metrics

Minimum metrics:

- total tokens in
- total tokens out
- total tokens combined
- estimated dollar cost
- provider API calls
- external API calls
- storage used
- generated assets count
- jobs run
- failed jobs
- average cost per successful output
- budget remaining
- last refresh time

Breakdowns:

- by business unit
- by project
- by provider
- by model
- by workflow
- by agent/runtime lane
- by time window

## Chart Modules

Do not make charts decorative. Each chart must answer an operating question.

| Chart | Question |
| --- | --- |
| Portfolio Usage Trend | Is usage rising, falling, or flat? |
| Business Unit Stacked Bars | Which unit is driving capacity burn? |
| Provider/Model Donut Or Ranked Bar | Which provider/model is responsible? |
| Workflow Cost Driver Table | Which workflows are worth optimizing? |
| Budget Burn Gauge | Are we approaching a cap? |
| Freshness Heat Strip | Which feeds are stale or missing? |
| 90-Day Capacity Sparkline Grid | Which projects are changing over time? |

## Visual Pattern Board

The cockpit now has a dedicated visual vocabulary page:

```text
docs/design/prototype-gallery/hermes-visual-pattern-board.html
```

Use this page before adding new dashboard modules. It demonstrates the main display patterns Hermes can choose from:

- multi-line trends with event markers
- ranked comparison bars
- freshness and trust heat strips
- business-unit health radar
- provider-to-workflow flow maps
- alert timelines
- stacked usage bands
- KPI cards with sparklines
- cross-tab heat matrices
- budget burn gauges
- treemap-like distribution blocks
- decision queue card stacks

These are sample-data patterns. They are allowed to be visually rich, but they should not be promoted as truthful runtime telemetry until the producer project exports the matching `DashboardSnapshotContract` fields.

## Prototype Variants

Create at least four visual prototypes before promotion:

1. **Command Strip + Capacity Body**
   - Top attention rail, then dense capacity modules.
   - Best if the operator wants immediate action first.

2. **Portfolio Ledger**
   - Business units as rows, metrics as columns, sparklines embedded.
   - Best if comparison across businesses matters most.

3. **Provider/Model Observatory**
   - Provider lanes, model scorecards, budget gates, and fallback status.
   - Best if model routing and API cost control are the main concern.

4. **Temporal Capacity Map**
   - Time-window-first layout with 3d/7d/14d/30d/90d comparison.
   - Best if the operator wants to see whether things are improving.

5. **Business Unit Capacity Observatory**
   - Recommended hybrid of variants 2, 3, and 4.
   - Business-unit cards show tokens, estimated cost, reported revenue when available, cost/revenue status, data trust, and next action.
   - A comparative line chart shows business units over time so the operator can see which unit is getting more expensive or improving.
   - A selected-unit drilldown shows the same kind of KPI summary the underlying business-unit dashboard should expose.
   - Provider/model attribution stays attached to the selected unit instead of living in a disconnected provider-only tab.

6. **Command + Model Cost Cockpit**
   - Next review candidate based on operator preference for variants 1 and 3.
   - Leads with attention, budget gate, missing feed, and next decision cards.
   - Uses provider/model lanes as the main analytical body, so the operator immediately sees whether OpenAI, Gemini, DeepSeek, local Codex, or another lane is driving pressure.
   - Keeps business-unit and revenue context below the command/model view instead of making it the primary layout.
   - Best if the dashboard should answer: what needs my attention, which model/provider caused it, and what should I do next?

7. **Hermes Cost Cockpit V2**
   - Mobbin-informed next pass using OpenAI Platform, Vercel, Stripe, Postman, Cursor, and finance dashboard references.
   - Reframes the cockpit around a sharper command shell: business-unit cost cards, 24h/7d/30d/90d windows, comparative line chart, selected-unit drilldown, provider attribution, operating ledger, and trust warnings.
   - Keeps revenue first-class but explicitly marks it pending or unknown where business-unit feeds are not connected.
   - Best if the dashboard should answer: what is the portfolio spending, which business unit is driving it, which provider/model caused it, what revenue context exists, and what decision should the operator make?

8. **Hermes Cost Cockpit V3**
   - Authenticated Mobbin-backed refinement using Snowflake, StackAI, WRITER, Adaline, Cursor, and OpenAI Platform references.
   - Moves the design away from a component inventory and toward a real operating cockpit: concise left rail, live status strip, time-window controls, executive stance, decision queue, cost/revenue cards, business-unit trend comparison, provider attribution, operating ledger, and trust markers.
   - Keeps the same data-contract boundary as V2, but makes the visual hierarchy more product-grade and more useful for a founder/operator who wants to know what changed, what costs money, what is trusted, and what to do next.
   - Best if the dashboard should answer: where is spend happening, which business unit is driving it, which model/provider lane caused it, what business context is missing, and which action is safe today?

Visual mockups:

```text
docs/design/prototype-gallery/capacity-command-center.html
```

Direct anchors:

- `#command-strip-capacity-body`
- `#portfolio-ledger`
- `#provider-model-observatory`
- `#temporal-capacity-map`
- `#business-unit-capacity-observatory`
- `#command-model-cost-cockpit`

Standalone review page:

- `docs/design/prototype-gallery/command-model-cost-cockpit.html`
- `docs/design/prototype-gallery/command-model-cost-cockpit-v2.html`
- `docs/design/prototype-gallery/hermes-cost-cockpit-v3.html`
- `docs/design/prototype-gallery/hermes-cost-cockpit-active.html`

## Recommended Hybrid

The current next review candidate is **Command + Model Cost Cockpit**.

This does not replace the other prototypes. It combines the preferred parts:

- from Command Strip + Capacity Body: operator interpretation, budget pressure, and next-action cards
- from Provider/Model Observatory: provider/model lanes, fallback gates, and premium cost posture
- from Business Unit Capacity Observatory: secondary business-unit and revenue context

Revenue is included as an optional feed. Until Media Business OS, TLC Capital Group OS, or another source reports revenue, the dashboard should show `Unknown`, `Pending`, or `N/A` instead of pretending it knows ROI.

After the first Mobbin reference review, **Hermes Cost Cockpit V2** kept the command/model decision spine, but added the Stripe/OpenAI/Vercel-style operating density the first static prototype was missing:

- a sharper shell with search/status, time windows, and one active route
- portfolio headline with a decision stance instead of generic dashboard copy
- business-unit spend and token cards
- comparative trend chart across units
- selected-unit drilldown for KPI context
- provider/model attribution ranked by burn
- trust markers for estimated, missing, or stale feeds

Mobbin references used for the V2 direction:

- OpenAI Platform usage/billing screen: `https://mobbin.com/screens/32d80696-c660-4446-b56a-d58f8613ee0a`
- Vercel usage screen: `https://mobbin.com/screens/7ad577a5-36a3-4963-90f9-72248d2ba5b4`
- Stripe billing dashboard: `https://mobbin.com/screens/d61c0f22-6d42-4616-851e-d3bfe67b8e34`
- Postman API observability screen: `https://mobbin.com/screens/bc011630-14d2-45ef-8310-0ae194c4f1bb`
- Cursor usage/billing screen: `https://mobbin.com/screens/aab19640-0c58-40f8-a349-f7f81943900b`
- Midday finance dashboard: `https://mobbin.com/screens/514c372f-89f5-4182-9bbe-5ab3d1d0d397`

After Mobbin auth was repaired on 2026-07-28, **Hermes Cost Cockpit V3** was created as a sidebar-heavy exploration. After operator review, V2 is the preferred active visual direction because it keeps the business-unit spend cards, time-window cost comparison, provider/model attribution, revenue context, and trust warnings without overcorrecting into a heavier sidebar shell.

Active prototype rule:

- `hermes-cost-cockpit-active.html` is the only file to review for ongoing iteration.
- `command-model-cost-cockpit-v2.html` remains the preferred base direction.
- `hermes-cost-cockpit-v3.html` remains archived as a sidebar exploration.
- Do not create `v4`, `v5`, or similar files for small visual edits. Create a new numbered file only for a major fork that needs side-by-side review.

Review-handle rule:

- Major reviewable regions in `hermes-cost-cockpit-active.html` must include stable `data-review-id` handles.
- The canonical map lives at `docs/design/prototype-review-map.json`.
- Lavish feedback, screenshots, or operator notes should reference the nearest `data-review-id` when possible instead of brittle selectors like `body > main > section > div:nth-of-type(2)`.
- Hermes OS should consume the review map as routing metadata later, but Nous Hermes Agent remains the owner of dashboard prototype implementation.
- `npm run dashboard:spine:validate` must fail if mapped review IDs drift from the active prototype.

Mobbin references used for the V3 direction:

- Snowflake dashboard reference: `https://mobbin.com/screens/725959e2-fde7-4b89-a8e3-1d272d9ec735`
- StackAI dashboard reference: `https://mobbin.com/screens/0e6d8ddc-04bf-4e41-9398-37299d7feb26`
- WRITER dashboard reference: `https://mobbin.com/screens/f9487f47-07b7-4189-aa89-f4fc5bb88858`
- Adaline dashboard reference: `https://mobbin.com/screens/7483692e-1571-40a7-829d-468a0686e2d9`
- Cursor dashboard reference: `https://mobbin.com/screens/3a84294a-2371-44ba-8a09-fdfd163fb453`
- OpenAI Platform dashboard reference: `https://mobbin.com/screens/fe36ec31-b25c-4cf1-9932-85bf66cd89fc`

## Mobbin Reference Workflow

Mobbin can be used for visual reference only after the data contract and operator questions are accepted.

Recommended reference searches:

- cloud cost dashboard
- usage analytics dashboard
- infrastructure observability
- billing dashboard
- API usage dashboard
- enterprise admin analytics
- resource utilization dashboard

Mobbin output should influence layout density, chart composition, controls, and visual hierarchy. It should not define the data model or become a runtime dependency.

## Data Gaps To Expect

Some fields will start as estimated or missing:

- exact provider dollar cost where provider billing APIs are not connected
- local Codex usage where the local runtime does not expose a usage ledger
- external provider balances that require credentials
- per-business attribution if old usage records were not tagged with business unit
- storage cost if provider pricing is not configured

These should render as data trust warnings, not blank dashboards.

## Build Sequence

- [x] Define this Capacity Command Center plan.
- [x] Register the Capacity Command Center prototype set.
- [x] Define the first `DashboardSnapshotContract` example for capacity data.
- [x] Add prototype data requirements for business unit, provider, workflow, and trend modules.
- [x] Generate 3-4 visual prototype directions in the prototype lab.
- [x] Create static visual mockups for all four prototype directions.
- [x] Create a recommended hybrid prototype for business-unit cards, trend comparison, revenue context, and drilldown.
- [x] Create a command/model cost cockpit prototype from variants 1 and 3.
- [x] Create a Mobbin-informed V2 cockpit with business-unit spend, time windows, provider attribution, revenue context, and trust warnings.
- [x] Create a Mobbin-backed V3 cockpit with a more product-grade executive operating screen, actual authenticated references, cost/revenue cards, business-unit comparison, provider lanes, and trust markers.
- [x] Select one prototype direction with written rationale.
- [x] Add the active cockpit sidebar view model for cost overview, business units, provider lanes, alerts, Media Engine, Khashi VC, and TLC Group OS.
- [x] Add the first sample-data charting pass to the active cockpit: multi-line trend, heat strip, radar, provider flow, alert timeline, throughput, and readiness modules.
- [x] Add a Hermes visual pattern board for choosing future chart/display modules before production implementation.
- [ ] Promote reusable chart modules into `@hermes/dashboard-kit`.
- [ ] Wire Hermes OS technical central command to consume the capacity snapshot.
- [ ] Wire TLC Capital Group OS to consume business-unit rollups.

## Completion Boundary

This slice is complete when the operator can open one Capacity Command Center screen and quickly understand portfolio-wide capacity use, trends, cost pressure, missing data, and next actions without clicking through separate token, cost, storage, provider, and project dashboards.
