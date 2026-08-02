# Dashboard Kit Adoption Standard

The dashboard kit is no longer just a governance idea. Each dashboard project that wants Tier 2 or Tier 3 status must adopt `@hermes/dashboard-kit` or a documented adapter that produces the same component markers, proof states, and visual behavior.

## Required Adoption Steps

1. Add the kit dependency or copy the canonical package through the approved local project sync path.
2. Import `dashboard-kit.css` once at the product shell level.
3. Replace local shell/sidebar/header markup with `DashboardShell` or a compatible adapter.
4. Replace primary charts with `LineChart`, `AreaChart`, `BarChart`, `DonutChart`, or `Heatmap`.
5. Replace dense tables with `DataTable`, including pagination or an explicit row limit.
6. Replace ad hoc stale/error/loading text with `StatePanel` and `ProofStrip`.
7. Add `data-hdk-component` and `data-review-id` markers to adopted surfaces.
8. Run local proof capture with Playwright and Chromium.
9. Run surface validation before calling the dashboard Tier 3.

## Project Scripts

Each adopted project should expose:

```json
{
  "dashboard:validate": "node path/to/validate-surface.js public src",
  "proof:doctor": "node tasks/check-playwright-proof.js",
  "proof:install": "npx playwright install chromium",
  "proof:capture": "node tasks/capture-dashboard-proof.js"
}
```

## Tier Rules

- Tier 1 can use a local shell but must not have nested shells.
- Tier 2 must use shared shell, card, state, and table components.
- Tier 3 must use approved charts, drilldowns/drawers where appropriate, proof states, Playwright screenshots, and no prototype-preview behavior for real data.

## Migration Order

Use this order for existing dashboards:

1. Shell and route registry
2. Theme tokens
3. Tables and pagination
4. Charts and chart states
5. Drawers/detail panels
6. Proof states
7. Playwright evidence
8. Surface validator gate

## Noncompliance

A project is not Tier 3 if it:

- uses hand-drawn primary charts
- has no axes on primary time/value charts
- shows prototype-preview language for real data
- embeds a standalone app inside another app shell
- loads the visual-selection bridge in production
- lacks local Playwright and Chromium proof capture
