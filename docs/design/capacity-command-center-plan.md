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

## Recommended Hybrid

The current next review candidate is **Command + Model Cost Cockpit**.

This does not replace the other prototypes. It combines the preferred parts:

- from Command Strip + Capacity Body: operator interpretation, budget pressure, and next-action cards
- from Provider/Model Observatory: provider/model lanes, fallback gates, and premium cost posture
- from Business Unit Capacity Observatory: secondary business-unit and revenue context

Revenue is included as an optional feed. Until Media Business OS, TLC Capital Group OS, or another source reports revenue, the dashboard should show `Unknown`, `Pending`, or `N/A` instead of pretending it knows ROI.

After Mobbin reference review, the next visual review candidate is **Hermes Cost Cockpit V2**. It keeps the command/model decision spine, but adds the Stripe/OpenAI/Vercel-style operating density the first static prototype was missing:

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
- [ ] Select one prototype direction with written rationale.
- [ ] Promote reusable chart modules into `@hermes/dashboard-kit`.
- [ ] Wire Hermes OS technical central command to consume the capacity snapshot.
- [ ] Wire TLC Capital Group OS to consume business-unit rollups.

## Completion Boundary

This slice is complete when the operator can open one Capacity Command Center screen and quickly understand portfolio-wide capacity use, trends, cost pressure, missing data, and next actions without clicking through separate token, cost, storage, provider, and project dashboards.
