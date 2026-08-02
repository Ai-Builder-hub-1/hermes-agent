# Kaoshi Live-Data Reference Capability

Status: V4 complete baseline
Owner: Nous Hermes Agent / Hermes Dashboard Kit

## Purpose

Live and near-live dashboards need a stronger standard than ordinary charts. The operator must always know whether they are seeing current data, stale data, partial data, preview/mock data, or an unavailable source.

## Live Capability Contract

Every live-data surface must define:

- source id and owner
- endpoint or file
- polling interval or stream mode
- stale threshold
- last successful refresh
- last failed refresh
- retry/backoff behavior
- snapshot retention window
- row count and pagination behavior
- selected-entity drilldown behavior
- telemetry events
- production proof route

## Required UI Pattern

### 1. Live Status Strip

Shows:

- current freshness class
- last updated timestamp
- next refresh estimate
- source health
- row count
- stale/partial/error warning when needed

### 2. Live Table Or Tape

Required:

- pagination or virtualization
- stable columns
- row selection
- source/category labels
- explicit unknown/category fallback
- snapshot count
- last seen time

### 3. Detail Drawer

Required:

- selected entity title and identifiers
- price/movement chart when snapshot series exists
- spread chart when spread exists
- depth chart when bid/ask depth exists
- volume chart when volume exists
- raw snapshot table or equivalent fallback
- clear preview label only when mock data is intentionally shown

### 4. Expired Or Recently Removed Section

Required for market systems:

- markets that were previously live and now expired/removed
- last snapshot time
- terminal price/state if known
- retained chart history
- reason if removed from live list

## Telemetry Events

Emit or expose:

- `live.refresh.success`
- `live.refresh.failure`
- `live.data.stale`
- `live.data.partial`
- `live.row.selected`
- `live.drawer.opened`
- `live.drawer.chart.rendered`
- `live.drawer.chart.empty`
- `live.pagination.changed`

## Kashi Reference Requirements

For Kashi live markets:

- Live markets should not be constrained by the old experiment horizon lanes.
- Horizon can appear as secondary metadata, but category, subcategory, liquidity, movement, and snapshot count must drive the primary view.
- The live view must show enough rows through pagination to cover the full live set.
- A selected market with two or more snapshots must render real charts, not a prototype preview.
- Unknown categories must be surfaced as data-quality issues and mapped through a taxonomy improvement backlog.

## Machine-Readable Source

The executable baseline lives in:

- `experience-audit/live-data-reference.yaml`

Validate with:

```bash
npm run dashboard:kaoshi:validate
```

