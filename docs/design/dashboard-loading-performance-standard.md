# Dashboard Loading And Data Performance Standard

This standard applies to every Hermes-governed dashboard: Kashi, Media Engine, Media Business Operations, Meal Assistant, Business Mapper, Hermes OS, TLC OS, and future dashboard products.

The goal is simple: the dashboard shell should feel instant, heavy data should hydrate progressively, and operators should always know whether a view is live, cached, partial, stale, empty, or failed.

## Required Loading Model

Every production dashboard route must use this sequence:

1. Render the single app shell first: sidebar, route header, primary actions, and route skeleton.
2. Load critical summary data next: proof strip, freshness strip, top KPI cards, and current route status.
3. Hydrate primary tables and charts with bounded data windows.
4. Load secondary drilldowns, historical windows, raw logs, exports, and large detail payloads only after user intent or idle time.

Tier 3 dashboards must never block the full route behind one giant data request.

## Data Contract

Each routed dashboard view must declare these fields in its route data contract or manifest:

| Field | Meaning |
| --- | --- |
| `freshness.updatedAt` | Last successful source update. |
| `freshness.ageSeconds` | Age of the data being shown. |
| `freshness.state` | `ready`, `partial`, `stale`, `error`, `empty`, or `loading`. |
| `pageSize` | Default bounded page size for tables. |
| `maxInitialRows` | Maximum table rows allowed in first payload. |
| `chartWindows` | Supported chart windows, usually `1d`, `7d`, `14d`, `30d`. |
| `rollupCadence` | Rollup cadence for expensive time-series data. |
| `cacheTtlSeconds` | Fresh cache lifetime. |
| `staleTtlSeconds` | How long cached data can be shown with a stale badge. |
| `deferredModules` | Heavy panels loaded after shell and summary are visible. |

## Required Components

Use `@hermes/dashboard-kit` primitives before creating project-specific loading UI:

- `DashboardLoadingShell`
- `SkeletonMetricCard`
- `SkeletonChart`
- `SkeletonTable`
- `SkeletonDashboardGrid`
- `DataFreshnessStrip`
- `StaleDataBadge`
- `PartialDataBanner`
- `DashboardQueryBoundary`
- `DataTable` / `renderDataTable` with pagination
- `ChartPanel` / approved chart components with empty, partial, stale, loading, and error states

Bridge dashboards may use the string renderers:

- `renderDashboardLoadingShell`
- `renderSkeletonMetricCard`
- `renderSkeletonChart`
- `renderSkeletonTable`
- `renderSkeletonDashboardGrid`
- `renderDataFreshnessStrip`
- `renderStaleDataBadge`
- `renderPartialDataBanner`
- `renderDashboardQueryBoundary`

## Table Standard

Tables must be bounded and paginated by default.

- Default `pageSize`: `25`.
- Maximum first payload: `100` rows unless an approved exception exists.
- Tables with more than one logical dataset should use tabs, accordions, or stacked full-width sections.
- Raw logs should never load in the first route payload.
- Horizontal scroll belongs inside the table wrapper, not the document body.

## Chart Standard

Charts must load from pre-shaped series data, not recompute from raw event logs in the browser.

- Use rollups for 1, 7, 14, and 30 day views.
- The route may show a chart with fewer than two points only as a `partial` or `not enough data yet` state.
- Every chart must show unit, time window, freshness, and stale/error state.
- Expensive comparison charts should hydrate after primary route metrics.

## Caching Standard

Dashboard APIs should use stale-while-revalidate semantics:

- Serve cached data quickly when it is within `cacheTtlSeconds`.
- Serve cached data with `StaleDataBadge` when it is older than the fresh TTL but inside `staleTtlSeconds`.
- Show `PartialDataBanner` when some modules fail but the route still has useful data.
- Show `DashboardErrorState` only when the primary view cannot be trusted.

## Performance Budgets

Tier 3 routes should meet these targets unless documented otherwise:

| Budget | Target |
| --- | --- |
| First shell render | Under 1 second locally and under 2 seconds production. |
| Summary payload | Under 250 KB compressed. |
| Initial table rows | 25 default, 100 maximum. |
| Initial chart points | 500 per visible chart maximum. |
| Primary route modules | 3 to 6 modules before deferred hydration. |
| Raw event/log payloads | Never in initial route load. |

## Enforcement

The dashboard-kit surface validator flags:

- Dashboard surfaces with loading text but no `DashboardLoadingShell` or skeleton component.
- Chart/table routes with no freshness/proof state.
- Large inline payloads that look like raw event dumps.
- Tables with many hard-coded rows and no pagination.
- Tier 3 routes that mention live, usage, issues, errors, charts, or tables without loading, stale, partial, and error states.

Project CI should run:

```bash
npm run dashboard:surface:validate -- <dashboard-route-files>
npm run dashboard-kit:adoption:audit -- --project <project-id>
```

## Operator UX Rule

An operator should never ask, "Is this broken, still loading, stale, or just empty?"

Every route must answer that directly in the UI.

