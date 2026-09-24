# Dashboard Certification Report

Generated: 2026-09-24T02:25:49.058Z

This is the central pre-deploy certification gate. It is intentionally stricter than source-marker checks: a project can declare Tier 3C/package-native and still fail certification if its route is static-heavy, marker-only, nested-shell, or missing proof.

## Summary

- Certified: 10
- Needs review: 0
- Blocked: 0
- False-native claims: 0
- Repair packets: 0

| Project | Verdict | False native | Declared impl | Blockers | Warnings | First repair actions |
| --- | --- | --- | --- | --- | --- | --- |
| khashi-vc | certified | no | package-native-runtime | 0 | 0 | None |
| media-engine | certified | no | package-native | 0 | 0 | None |
| media-business-os | certified | no | package-native | 0 | 0 | None |
| business-mapper | certified | no | package-native | 0 | 0 | None |
| meal-assistant | certified | no | package-native | 0 | 0 | None |
| hermes-os | certified | no | package-native | 0 | 0 | None |
| tlc-capital-group-os | certified | no | package-native | 0 | 0 | None |
| rinseables-os | certified | no | package-native | 0 | 0 | None |
| investing-system | certified | no | package-native | 0 | 0 | None |
| nous-hermes-agent | certified | no | package-native | 0 | 0 | None |

## Kashi VC

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- ACCEPTED raw-svg-or-hand-chart: Temporary accepted review warning while the dashboard keeps bespoke chart rendering under the current package-native shell; replace with approved dashboard-kit chart components during the next frontend polish pass. expires 2026-12-31T23:59:59.000Z (roc-dashboard-native-source: src/web/roc-dashboard/index.mjs)
- ACCEPTED hardcoded-visual-token: Temporary accepted review warning for existing local visual token debt under validated dashboard-kit shell adoption; retire with tokenized component variants during frontend polish. expires 2026-12-31T23:59:59.000Z (roc-dashboard-native-source: src/web/roc-dashboard/index.mjs)
- ACCEPTED anatomy.multipleShellMarkers: Temporary accepted review warning for multiple shell evidence markers on validated non-blocking surfaces; collapse to one primary shell marker during frontend polish. expires 2026-12-31T23:59:59.000Z (roc-dashboard-native-source: src/web/roc-dashboard/index.mjs)
- ACCEPTED anatomy.multipleSidebarMarkers: Temporary accepted review warning for multiple sidebar evidence markers on validated non-blocking surfaces; collapse to one primary sidebar marker during frontend polish. expires 2026-12-31T23:59:59.000Z (roc-dashboard-native-source: src/web/roc-dashboard/index.mjs)
- ACCEPTED raw-svg-or-hand-chart: Temporary accepted review warning while the dashboard keeps bespoke chart rendering under the current package-native shell; replace with approved dashboard-kit chart components during the next frontend polish pass. expires 2026-12-31T23:59:59.000Z (market-intelligence-live: public/roc/market-intelligence-live.html)
- ACCEPTED hardcoded-visual-token: Temporary accepted review warning for existing local visual token debt under validated dashboard-kit shell adoption; retire with tokenized component variants during frontend polish. expires 2026-12-31T23:59:59.000Z (market-intelligence-live: public/roc/market-intelligence-live.html)
- ACCEPTED anatomy.multipleSidebarMarkers: Temporary accepted review warning for multiple sidebar evidence markers on validated non-blocking surfaces; collapse to one primary sidebar marker during frontend polish. expires 2026-12-31T23:59:59.000Z (market-intelligence-live: public/roc/market-intelligence-live.html)

### Surfaces

- `roc-server-primary-route` `src/web/server.ts`: role=server-route, status=package-native, debt=182, evidence=chart, kitCssOnly
- `roc-shell` `public/roc/index.html`: role=mount-route, status=package-native-mount, debt=0, evidence=shell
- `roc-dashboard-native-source` `src/web/roc-dashboard/index.mjs`: role=ui, status=package-native-runtime, debt=378, evidence=shell, sidebar, header, state, table, chart, workflow, directPackageImport
- `market-intelligence-live` `public/roc/market-intelligence-live.html`: role=legacy-compatibility-route, status=compatibility-review-surface, debt=173, evidence=shell, sidebar, header, state, table, chart, workflow

### Repair Packet

- None

## Media Engine

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- ACCEPTED raw-svg-or-hand-chart: Temporary accepted review warning while the dashboard keeps bespoke chart rendering under the current package-native shell; replace with approved dashboard-kit chart components during the next frontend polish pass. expires 2026-12-31T23:59:59.000Z (media-engine-ops-active: core/operations/unified-publishing-dashboard.js)
- ACCEPTED hardcoded-visual-token: Temporary accepted review warning for existing local visual token debt under validated dashboard-kit shell adoption; retire with tokenized component variants during frontend polish. expires 2026-12-31T23:59:59.000Z (media-engine-ops-active: core/operations/unified-publishing-dashboard.js)

### Surfaces

- `media-engine-ops-active` `core/operations/unified-publishing-dashboard.js`: role=ui, status=production, debt=144, evidence=shell, sidebar, header, state, table, chart, workflow, directPackageImport

### Repair Packet

- None

## Media Business OS

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- ACCEPTED anatomy.multipleSidebarMarkers: Temporary accepted review warning for multiple sidebar evidence markers on validated non-blocking surfaces; collapse to one primary sidebar marker during frontend polish. expires 2026-12-31T23:59:59.000Z (media-business-react-dashboard: frontend/src/main.tsx)
- ACCEPTED anatomy.multipleSidebarMarkers: Temporary accepted review warning for multiple sidebar evidence markers on validated non-blocking surfaces; collapse to one primary sidebar marker during frontend polish. expires 2026-12-31T23:59:59.000Z (media-business-main: public/dashboard/index.html)
- ACCEPTED anatomy.multipleSidebarMarkers: Temporary accepted review warning for multiple sidebar evidence markers on validated non-blocking surfaces; collapse to one primary sidebar marker during frontend polish. expires 2026-12-31T23:59:59.000Z (media-business-renderer: public/dashboard/app.js)

### Surfaces

- `media-business-react-dashboard` `frontend/src/main.tsx`: role=ui, status=compatibility-review, debt=0, evidence=shell, sidebar, header, state, table, chart, workflow, directPackageImport
- `media-business-main` `public/dashboard/index.html`: role=ui, status=package-runtime-bridge, debt=0, evidence=shell, sidebar, header, state
- `media-business-renderer` `public/dashboard/app.js`: role=ui, status=package-runtime-bridge, debt=0, evidence=sidebar, header, state, table, chart, workflow

### Repair Packet

- None

## Business Mapper

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- ACCEPTED anatomy.multipleSidebarMarkers: Temporary accepted review warning for multiple sidebar evidence markers on validated non-blocking surfaces; collapse to one primary sidebar marker during frontend polish. expires 2026-12-31T23:59:59.000Z (business-mapper-workspace: business_mapper/static/index.html)
- ACCEPTED evidence.dataMissing: Temporary accepted review warning where live dashboard data is available through existing source contracts but the certification scanner does not detect a table/chart/workflow primitive on this surface. expires 2026-12-31T23:59:59.000Z

### Surfaces

- `business-mapper-workspace` `business_mapper/static/index.html`: role=ui, status=package-native, debt=0, evidence=shell, sidebar, header, state

### Repair Packet

- None

## Meal Assistant

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- ACCEPTED hardcoded-visual-token: Temporary accepted review warning for existing local visual token debt under validated dashboard-kit shell adoption; retire with tokenized component variants during frontend polish. expires 2026-12-31T23:59:59.000Z (meal-dashboard-shell: src/server.js)
- ACCEPTED anatomy.multipleShellMarkers: Temporary accepted review warning for multiple shell evidence markers on validated non-blocking surfaces; collapse to one primary shell marker during frontend polish. expires 2026-12-31T23:59:59.000Z (meal-dashboard-shell: src/server.js)
- ACCEPTED anatomy.multipleSidebarMarkers: Temporary accepted review warning for multiple sidebar evidence markers on validated non-blocking surfaces; collapse to one primary sidebar marker during frontend polish. expires 2026-12-31T23:59:59.000Z (meal-dashboard-shell: src/server.js)

### Surfaces

- `meal-dashboard-shell` `src/server.js`: role=ui, status=package-native, debt=537, evidence=shell, sidebar, header, state, table, chart, workflow, directPackageImport

### Repair Packet

- None

## Hermes OS

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- ACCEPTED hardcoded-visual-token: Temporary accepted review warning for existing local visual token debt under validated dashboard-kit shell adoption; retire with tokenized component variants during frontend polish. expires 2026-12-31T23:59:59.000Z (hermes-dashboard-hub: src/workspace/workspace-server.ts)
- ACCEPTED anatomy.multipleShellMarkers: Temporary accepted review warning for multiple shell evidence markers on validated non-blocking surfaces; collapse to one primary shell marker during frontend polish. expires 2026-12-31T23:59:59.000Z (hermes-dashboard-hub: src/workspace/workspace-server.ts)
- ACCEPTED hardcoded-visual-token: Temporary accepted review warning for existing local visual token debt under validated dashboard-kit shell adoption; retire with tokenized component variants during frontend polish. expires 2026-12-31T23:59:59.000Z (hermes-operator-dashboard-artifact: src/operator/operator-state.ts)
- ACCEPTED hardcoded-visual-token: Temporary accepted review warning for existing local visual token debt under validated dashboard-kit shell adoption; retire with tokenized component variants during frontend polish. expires 2026-12-31T23:59:59.000Z (hermes-control-plane-artifact: src/operator/control-plane.ts)

### Surfaces

- `hermes-dashboard-hub` `src/workspace/workspace-server.ts`: role=ui, status=package-native, debt=340, evidence=shell, sidebar, header, state, table
- `hermes-operator-dashboard-artifact` `src/operator/operator-state.ts`: role=ui, status=package-native, debt=22, evidence=shell, sidebar, header, state, table
- `hermes-control-plane-artifact` `src/operator/control-plane.ts`: role=ui, status=compatibility-review, debt=9, evidence=shell, sidebar, header, state, table

### Repair Packet

- None

## TLC Capital Group OS

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- None

### Surfaces

- `tlc-dashboard-shell` `public/dashboard/index.html`: role=ui, status=package-native, debt=0, evidence=shell, sidebar, header, state
- `tlc-dashboard-api` `src/api.js`: role=api, status=package-native, debt=0, evidence=shell, sidebar, header, state
- `tlc-dashboard-models` `src/dashboards.js`: role=data-contract, status=package-native, debt=0, evidence=shell, sidebar, header, state

### Repair Packet

- None

## Rinseables OS

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- None

### Surfaces

- `rinseables-dashboard-shell` `public/dashboard/index.html`: role=compatibility, status=compatibility-review, debt=0, evidence=shell, sidebar, header, state
- `rinseables-dashboard-proof` `src/api.js`: role=proof-endpoint, status=package-native, debt=0, evidence=shell, sidebar, header, state

### Repair Packet

- None

## Investing System

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- None

### Surfaces

- `investing-system-roc` `public/roc/index.html`: role=ui, status=package-native, debt=0, evidence=shell, sidebar, header, state, table, chart, workflow
- `investing-system-proof` `src/api/server.ts`: role=proof-endpoint, status=package-native, debt=0, evidence=none

### Repair Packet

- None

## Nous Hermes Agent

Verdict: **certified**

False-native claim: no

### Blockers

- None

### Warnings

- None

### Accepted Review Warnings

- ACCEPTED raw-svg-or-hand-chart: Temporary accepted review warning while the dashboard keeps bespoke chart rendering under the current package-native shell; replace with approved dashboard-kit chart components during the next frontend polish pass. expires 2026-12-31T23:59:59.000Z (hermes-dashboard-kit-gallery-web-route: web/src/pages/DashboardKitGalleryPage.tsx)

### Surfaces

- `hermes-dashboard-kit-gallery` `packages/hermes-dashboard-kit/src/index.js`: role=kit-source, status=production, debt=13, evidence=shell, sidebar, header, state, table, chart, workflow
- `hermes-dashboard-kit-gallery-web-route` `web/src/pages/DashboardKitGalleryPage.tsx`: role=page-content, status=production, debt=1, evidence=state, table, chart, workflow

### Repair Packet

- None
