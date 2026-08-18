# Dashboard Certification Report

Generated: 2026-08-15T18:51:38.843Z

This is the central pre-deploy certification gate. It is intentionally stricter than source-marker checks: a project can declare Tier 3C/package-native and still fail certification if its route is static-heavy, marker-only, nested-shell, or missing proof.

## Summary

- Certified: 0
- Needs review: 0
- Blocked: 10
- False-native claims: 9
- Repair packets: 10

| Project | Verdict | False native | Declared impl | Blockers | Warnings | First repair actions |
| --- | --- | --- | --- | --- | --- | --- |
| khashi-vc | blocked | yes | package-built | 7 | 5 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane. |
| media-engine | blocked | no | package-native | 1 | 2 | Replace local visual primitives with dashboard-kit component variants or create an expiring governance exception. |
| media-business-os | blocked | yes | package-native | 2 | 2 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Remove hidden compliance markers and replace them with rendered kit components or direct package imports. |
| business-mapper | blocked | yes | package-native | 3 | 1 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane. |
| meal-assistant | blocked | yes | package-native | 2 | 3 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Replace local visual primitives with dashboard-kit component variants or create an expiring governance exception. |
| hermes-os | blocked | yes | package-native | 6 | 6 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Demote compatibility/static routes to dev-review or redirect status and register the real package-native operator route. |
| tlc-capital-group-os | blocked | yes | package-native | 3 | 0 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane. |
| rinseables-os | blocked | yes | package-native | 4 | 0 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane. |
| investing-system | blocked | yes | package-native | 2 | 0 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Demote compatibility/static routes to dev-review or redirect status and register the real package-native operator route. |
| nous-hermes-agent | blocked | yes | package-native | 2 | 2 | Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.<br>Remove hidden compliance markers and replace them with rendered kit components or direct package imports. |

## Kashi VC

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER tier3c.implementationMode: T3C requires implementationMode package-native, not package-built/runtime/static bridge.
- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER surface.compatibilityClaim: Compatibility/legacy/bridge UI surface cannot be certified as package-native production surface. (roc-shell: public/roc/index.html)
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (4 occurrence(s).) (market-intelligence-live: public/roc/market-intelligence-live.html)
- BLOCKER local-shell-class: Primary shell/sidebar/header layout is still controlled by local primitives. (1 occurrence(s).) (market-intelligence-live: public/roc/market-intelligence-live.html)
- BLOCKER anatomy.secondShellLayout: Surface has a local .layout grid that can create an inner shell inside the dashboard shell. (market-intelligence-live: public/roc/market-intelligence-live.html)
- BLOCKER localDebt.excessive: T3C route has 178 local visual/layout signals; decompose into kit components or register expiring exceptions.

### Warnings

- WARNING anatomy.multipleShellMarkers: Surface has 2 shell markers; confirm exactly one real app shell. (roc-shell: public/roc/index.html)
- WARNING anatomy.multipleSidebarMarkers: Surface has 2 sidebar markers; confirm exactly one primary sidebar. (roc-shell: public/roc/index.html)
- WARNING raw-svg-or-hand-chart: Charts need approved dashboard-kit/domain chart components with axis and state contracts. (3 occurrence(s).) (market-intelligence-live: public/roc/market-intelligence-live.html)
- WARNING hardcoded-visual-token: Local hardcoded visual tokens must be replaced by dashboard-kit tokens or approved exceptions. (170 occurrence(s).) (market-intelligence-live: public/roc/market-intelligence-live.html)
- WARNING anatomy.multipleSidebarMarkers: Surface has 6 sidebar markers; confirm exactly one primary sidebar. (market-intelligence-live: public/roc/market-intelligence-live.html)

### Surfaces

- `roc-server-primary-route` `src/web/server.ts`: role=server-route, status=package-native, debt=138, evidence=chart, kitCssOnly
- `roc-shell` `public/roc/index.html`: role=compatibility-route, status=package-native, debt=0, evidence=shell, sidebar, header, state, chart, workflow
- `market-intelligence-live` `public/roc/market-intelligence-live.html`: role=legacy-compatibility-route, status=compatibility-review-surface, debt=178, evidence=shell, sidebar, header, state, table, chart, workflow

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane.
- Demote compatibility/static routes to dev-review or redirect status and register the real package-native operator route.
- Remove hidden compliance markers and replace them with rendered kit components or direct package imports.
- Replace local visual primitives with dashboard-kit component variants or create an expiring governance exception.

## Media Engine

Verdict: **blocked**

False-native claim: no

### Blockers

- BLOCKER localDebt.excessive: T3C route has 125 local visual/layout signals; decompose into kit components or register expiring exceptions.

### Warnings

- WARNING raw-svg-or-hand-chart: Charts need approved dashboard-kit/domain chart components with axis and state contracts. (2 occurrence(s).) (media-engine-ops-active: core/operations/unified-publishing-dashboard.js)
- WARNING hardcoded-visual-token: Local hardcoded visual tokens must be replaced by dashboard-kit tokens or approved exceptions. (123 occurrence(s).) (media-engine-ops-active: core/operations/unified-publishing-dashboard.js)

### Surfaces

- `media-engine-ops-active` `core/operations/unified-publishing-dashboard.js`: role=ui, status=production, debt=125, evidence=shell, sidebar, header, state, table, chart, workflow, directPackageImport

### Repair Packet

- Replace local visual primitives with dashboard-kit component variants or create an expiring governance exception.

## Media Business OS

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (3 occurrence(s).) (media-business-renderer: public/dashboard/app.js)

### Warnings

- WARNING anatomy.multipleSidebarMarkers: Surface has 7 sidebar markers; confirm exactly one primary sidebar. (media-business-main: public/dashboard/index.html)
- WARNING anatomy.multipleSidebarMarkers: Surface has 6 sidebar markers; confirm exactly one primary sidebar. (media-business-renderer: public/dashboard/app.js)

### Surfaces

- `media-business-main` `public/dashboard/index.html`: role=ui, status=package-runtime-bridge, debt=0, evidence=shell, sidebar, header, state
- `media-business-renderer` `public/dashboard/app.js`: role=ui, status=package-runtime-bridge, debt=3, evidence=sidebar, header, state, table, chart, workflow

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Remove hidden compliance markers and replace them with rendered kit components or direct package imports.

## Business Mapper

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (5 occurrence(s).) (business-mapper-workspace: business_mapper/static/index.html)
- BLOCKER anatomy.secondShellLayout: Surface has a local .layout grid that can create an inner shell inside the dashboard shell. (business-mapper-workspace: business_mapper/static/index.html)

### Warnings

- WARNING anatomy.multipleSidebarMarkers: Surface has 2 sidebar markers; confirm exactly one primary sidebar. (business-mapper-workspace: business_mapper/static/index.html)

### Surfaces

- `business-mapper-workspace` `business_mapper/static/index.html`: role=ui, status=package-native, debt=5, evidence=shell, sidebar, header, state, table, chart, workflow

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane.
- Remove hidden compliance markers and replace them with rendered kit components or direct package imports.

## Meal Assistant

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER localDebt.excessive: T3C route has 334 local visual/layout signals; decompose into kit components or register expiring exceptions.

### Warnings

- WARNING hardcoded-visual-token: Local hardcoded visual tokens must be replaced by dashboard-kit tokens or approved exceptions. (334 occurrence(s).) (meal-dashboard-shell: src/server.js)
- WARNING anatomy.multipleShellMarkers: Surface has 5 shell markers; confirm exactly one real app shell. (meal-dashboard-shell: src/server.js)
- WARNING anatomy.multipleSidebarMarkers: Surface has 6 sidebar markers; confirm exactly one primary sidebar. (meal-dashboard-shell: src/server.js)

### Surfaces

- `meal-dashboard-shell` `src/server.js`: role=ui, status=package-native, debt=334, evidence=shell, sidebar, header, state, table, chart, workflow, directPackageImport

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Replace local visual primitives with dashboard-kit component variants or create an expiring governance exception.

## Hermes OS

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (5 occurrence(s).) (hermes-dashboard-hub: src/workspace/workspace-server.ts)
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (5 occurrence(s).) (hermes-operator-dashboard-artifact: src/operator/operator-state.ts)
- BLOCKER surface.compatibilityClaim: Compatibility/legacy/bridge UI surface cannot be certified as package-native production surface. (hermes-control-plane-artifact: src/operator/control-plane.ts)
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (5 occurrence(s).) (hermes-control-plane-artifact: src/operator/control-plane.ts)
- BLOCKER localDebt.excessive: T3C route has 356 local visual/layout signals; decompose into kit components or register expiring exceptions.

### Warnings

- WARNING hardcoded-visual-token: Local hardcoded visual tokens must be replaced by dashboard-kit tokens or approved exceptions. (310 occurrence(s).) (hermes-dashboard-hub: src/workspace/workspace-server.ts)
- WARNING anatomy.multipleShellMarkers: Surface has 3 shell markers; confirm exactly one real app shell. (hermes-dashboard-hub: src/workspace/workspace-server.ts)
- WARNING hardcoded-visual-token: Local hardcoded visual tokens must be replaced by dashboard-kit tokens or approved exceptions. (22 occurrence(s).) (hermes-operator-dashboard-artifact: src/operator/operator-state.ts)
- WARNING anatomy.multipleShellMarkers: Surface has 2 shell markers; confirm exactly one real app shell. (hermes-operator-dashboard-artifact: src/operator/operator-state.ts)
- WARNING hardcoded-visual-token: Local hardcoded visual tokens must be replaced by dashboard-kit tokens or approved exceptions. (9 occurrence(s).) (hermes-control-plane-artifact: src/operator/control-plane.ts)
- WARNING anatomy.multipleShellMarkers: Surface has 2 shell markers; confirm exactly one real app shell. (hermes-control-plane-artifact: src/operator/control-plane.ts)

### Surfaces

- `hermes-dashboard-hub` `src/workspace/workspace-server.ts`: role=ui, status=package-native, debt=315, evidence=shell, sidebar, header, state, table, chart, workflow
- `hermes-operator-dashboard-artifact` `src/operator/operator-state.ts`: role=ui, status=package-native, debt=27, evidence=shell, sidebar, header, state, table, chart, workflow
- `hermes-control-plane-artifact` `src/operator/control-plane.ts`: role=ui, status=package-native, debt=14, evidence=shell, sidebar, header, state, table, chart, workflow

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Demote compatibility/static routes to dev-review or redirect status and register the real package-native operator route.
- Remove hidden compliance markers and replace them with rendered kit components or direct package imports.
- Replace local visual primitives with dashboard-kit component variants or create an expiring governance exception.

## TLC Capital Group OS

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (6 occurrence(s).) (tlc-dashboard-shell: public/dashboard/index.html)
- BLOCKER anatomy.secondShellLayout: Surface has a local .layout grid that can create an inner shell inside the dashboard shell. (tlc-dashboard-shell: public/dashboard/index.html)

### Warnings

- None

### Surfaces

- `tlc-dashboard-shell` `public/dashboard/index.html`: role=ui, status=package-native, debt=6, evidence=shell, sidebar, header, state, table, chart, workflow
- `tlc-dashboard-api` `src/api.js`: role=api, status=package-native, debt=0, evidence=shell, sidebar, header, state
- `tlc-dashboard-models` `src/dashboards.js`: role=data-contract, status=package-native, debt=0, evidence=shell, sidebar, header, state

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane.
- Remove hidden compliance markers and replace them with rendered kit components or direct package imports.

## Rinseables OS

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER surface.compatibilityClaim: Compatibility/legacy/bridge UI surface cannot be certified as package-native production surface. (rinseables-dashboard-shell: public/dashboard/index.html)
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (6 occurrence(s).) (rinseables-dashboard-shell: public/dashboard/index.html)
- BLOCKER anatomy.secondShellLayout: Surface has a local .layout grid that can create an inner shell inside the dashboard shell. (rinseables-dashboard-shell: public/dashboard/index.html)

### Warnings

- None

### Surfaces

- `rinseables-dashboard-shell` `public/dashboard/index.html`: role=compatibility, status=package-native, debt=6, evidence=shell, sidebar, header, state, table, chart, workflow
- `rinseables-dashboard-proof` `src/api.js`: role=proof-endpoint, status=package-native, debt=0, evidence=shell, sidebar, header, state

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane.
- Demote compatibility/static routes to dev-review or redirect status and register the real package-native operator route.
- Remove hidden compliance markers and replace them with rendered kit components or direct package imports.

## Investing System

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER surface.compatibilityClaim: Compatibility/legacy/bridge UI surface cannot be certified as package-native production surface. (investing-system-roc: public/roc/index.html)

### Warnings

- None

### Surfaces

- `investing-system-roc` `public/roc/index.html`: role=compatibility, status=package-native, debt=0, evidence=shell, sidebar, header, state, table, chart
- `investing-system-proof` `src/api/server.ts`: role=proof-endpoint, status=package-native, debt=23, evidence=workflow

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Demote compatibility/static routes to dev-review or redirect status and register the real package-native operator route.

## Nous Hermes Agent

Verdict: **blocked**

False-native claim: yes

### Blockers

- BLOCKER falseNative.migrationLanguage: Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt.
- BLOCKER hidden-compliance-marker: Hidden compliance markers cannot satisfy component-native certification. (8 occurrence(s).) (hermes-dashboard-kit-gallery-web-route: web/src/pages/DashboardKitGalleryPage.tsx)

### Warnings

- WARNING raw-svg-or-hand-chart: Charts need approved dashboard-kit/domain chart components with axis and state contracts. (1 occurrence(s).) (hermes-dashboard-kit-gallery-web-route: web/src/pages/DashboardKitGalleryPage.tsx)
- WARNING anatomy.multipleSidebarMarkers: Surface has 2 sidebar markers; confirm exactly one primary sidebar. (hermes-dashboard-kit-gallery-web-route: web/src/pages/DashboardKitGalleryPage.tsx)

### Surfaces

- `hermes-dashboard-kit-gallery` `packages/hermes-dashboard-kit/src/index.js`: role=kit-source, status=production, debt=13, evidence=shell, sidebar, header, state, table, chart, workflow
- `hermes-dashboard-kit-gallery-web-route` `web/src/pages/DashboardKitGalleryPage.tsx`: role=page-content, status=production, debt=9, evidence=shell, sidebar, header, state, table, chart, workflow

### Repair Packet

- Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.
- Remove hidden compliance markers and replace them with rendered kit components or direct package imports.
