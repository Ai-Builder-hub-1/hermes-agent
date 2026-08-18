# Dashboard Rendered Implementation Report

Generated: 2026-08-15T18:51:28.968Z

This report checks whether visible dashboard routes are still controlled by local layout/component primitives instead of dashboard-kit primitives.

## Summary

- Total projects: 10
- Pass: 10
- Need migration: 0
- Findings: 0

## Decomposition Summary

- Fully decomposed: 8
- Bridge aligned: 2
- False-native risk: 2

| Project | Status | Decomposition | Local signals | False-native risk | Findings | Sample |
| --- | --- | --- | ---: | --- | ---: | --- |
| khashi-vc | pass | fully-decomposed | 0 | no | 0 | None |
| media-engine | pass | fully-decomposed | 0 | no | 0 | None |
| media-business-os | pass | fully-decomposed | 0 | no | 0 | None |
| business-mapper | pass | fully-decomposed | 0 | no | 0 | None |
| meal-assistant | pass | bridge-aligned | 35 | yes | 0 | None |
| hermes-os | pass | fully-decomposed | 0 | no | 0 | None |
| tlc-capital-group-os | pass | fully-decomposed | 0 | no | 0 | None |
| rinseables-os | pass | fully-decomposed | 0 | no | 0 | None |
| investing-system | pass | fully-decomposed | 0 | no | 0 | None |
| nous-hermes-agent | pass | bridge-aligned | 7 | yes | 0 | None |

## Kashi VC

Status: **pass**

Decomposition: **fully-decomposed**

Local signal count: 0

False-native risk: no

Findings:
- None

Surface local signal counts:
- `roc-server-primary-route` `src/web/server.ts`: 0 local signal(s) (none)
- `roc-shell` `public/roc/index.html`: 0 local signal(s) (none)
- `market-intelligence-live` `public/roc/market-intelligence-live.html`: 0 local signal(s) (none)

## Media Engine

Status: **pass**

Decomposition: **fully-decomposed**

Local signal count: 0

False-native risk: no

Findings:
- None

Surface local signal counts:
- `media-engine-ops-active` `core/operations/unified-publishing-dashboard.js`: 0 local signal(s) (none)

## Media Business OS

Status: **pass**

Decomposition: **fully-decomposed**

Local signal count: 0

False-native risk: no

Findings:
- None

Surface local signal counts:
- `media-business-main` `public/dashboard/index.html`: 0 local signal(s) (none)
- `media-business-renderer` `public/dashboard/app.js`: 0 local signal(s) (none)

## Business Mapper

Status: **pass**

Decomposition: **fully-decomposed**

Local signal count: 0

False-native risk: no

Findings:
- None

Surface local signal counts:
- `business-mapper-workspace` `business_mapper/static/index.html`: 0 local signal(s) (none)

## Meal Assistant

Status: **pass**

Decomposition: **bridge-aligned**

Local signal count: 35

False-native risk: yes

Findings:
- None

Surface local signal counts:
- `meal-dashboard-shell` `src/server.js`: 35 local signal(s) (local-sidebar: 2, local-card: 9, local-grid-spacing: 24)

## Hermes OS

Status: **pass**

Decomposition: **fully-decomposed**

Local signal count: 0

False-native risk: no

Findings:
- None

Surface local signal counts:
- `hermes-dashboard-hub` `src/workspace/workspace-server.ts`: 0 local signal(s) (none)
- `hermes-operator-dashboard-artifact` `src/operator/operator-state.ts`: 0 local signal(s) (none)
- `hermes-control-plane-artifact` `src/operator/control-plane.ts`: 0 local signal(s) (none)

## TLC Capital Group OS

Status: **pass**

Decomposition: **fully-decomposed**

Local signal count: 0

False-native risk: no

Findings:
- None

Surface local signal counts:
- `tlc-dashboard-shell` `public/dashboard/index.html`: 0 local signal(s) (none)
- `tlc-dashboard-api` `src/api.js`: 0 local signal(s) (none)
- `tlc-dashboard-models` `src/dashboards.js`: 0 local signal(s) (none)

## Rinseables OS

Status: **pass**

Decomposition: **fully-decomposed**

Local signal count: 0

False-native risk: no

Findings:
- None

Surface local signal counts:
- `rinseables-dashboard-shell` `public/dashboard/index.html`: 0 local signal(s) (none)
- `rinseables-dashboard-proof` `src/api.js`: 0 local signal(s) (none)

## Investing System

Status: **pass**

Decomposition: **fully-decomposed**

Local signal count: 0

False-native risk: no

Findings:
- None

Surface local signal counts:
- `investing-system-roc` `public/roc/index.html`: 0 local signal(s) (none)
- `investing-system-proof` `src/api/server.ts`: 0 local signal(s) (none)

## Nous Hermes Agent

Status: **pass**

Decomposition: **bridge-aligned**

Local signal count: 7

False-native risk: yes

Findings:
- None

Surface local signal counts:
- `hermes-dashboard-kit-gallery` `packages/hermes-dashboard-kit/src/index.js`: 0 local signal(s) (none)
- `hermes-dashboard-kit-gallery-web-route` `web/src/pages/DashboardKitGalleryPage.tsx`: 7 local signal(s) (local-card: 1, local-table: 6)
