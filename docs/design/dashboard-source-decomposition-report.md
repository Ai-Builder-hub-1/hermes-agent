# Dashboard Source Decomposition Report

Generated: 2026-08-21T20:34:26.598Z

This is the deeper source-native gate. Rendered certification proves what the browser shows; this report proves how the route is actually implemented.

## Summary

- Total projects: 10
- Total surfaces: 22
- Source-certified projects: 0
- Projects needing decomposition: 10
- Package-native route surfaces: 4
- Bridge/static/server/mount surfaces: 15
- High-priority repair packets: 10

## Fleet Matrix

| Project | Verdict | Score | Mode | Primary Surfaces | Blockers |
| --- | --- | --- | --- | --- | --- |
| khashi-vc | needs-source-decomposition | 40 | package-native-runtime | roc-dashboard-native-source: package-native-route | mode.notStrictPackageNative<br>localDebt.high |
| media-engine | needs-source-decomposition | 40 | package-native | media-engine-ops-active: package-native-route | localDebt.high |
| media-business-os | needs-source-decomposition | 2 | package-native | media-business-react-dashboard: package-native-route<br>media-business-main: static-html<br>media-business-renderer: server-rendered | localDebt.high<br>surface.notSourceNative<br>families.missing<br>surface.notSourceNative<br>localDebt.high |
| business-mapper | needs-source-decomposition | 8 | package-native | business-mapper-workspace: static-html | surface.notSourceNative<br>families.missing<br>localDebt.high |
| meal-assistant | needs-source-decomposition | 24 | package-native | meal-dashboard-shell: package-native-route | families.missing<br>localDebt.high |
| hermes-os | needs-source-decomposition | 0 | package-native | hermes-dashboard-hub: server-rendered<br>hermes-operator-dashboard-artifact: server-rendered<br>hermes-control-plane-artifact: server-rendered | surface.notSourceNative<br>localDebt.high<br>surface.notSourceNative<br>families.missing<br>surface.notSourceNative<br>families.missing |
| tlc-capital-group-os | needs-source-decomposition | 24 | package-native | tlc-dashboard-shell: static-html | surface.notSourceNative<br>families.missing |
| rinseables-os | needs-source-decomposition | 23 | package-native | rinseables-dashboard-shell: static-html | surface.notSourceNative<br>families.missing |
| investing-system | needs-source-decomposition | 0 | package-native | investing-system-roc: static-html | surface.notSourceNative<br>localDebt.high |
| nous-hermes-agent | needs-source-decomposition | 39 | package-native | hermes-dashboard-kit-gallery-web-route: runtime-bridge | surface.notSourceNative<br>localDebt.high |

## Project Details

### Kashi VC

Verdict: **needs-source-decomposition**  
Source score: 40

Blockers:
- mode.notStrictPackageNative: implementationMode is package-native-runtime; strict T3C source gate expects package-native.
- localDebt.high: roc-dashboard-native-source has local visual debt score 1132.

Warnings:
- compatibility.routeTracked: roc-shell remains a compatibility/review surface and must not be promoted as primary.
- compatibility.routeTracked: market-intelligence-live remains a compatibility/review surface and must not be promoted as primary.

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| roc-server-primary-route | server-route | server-rendered | no | tables | 316 | extract-server-html-into-package-native-components |
| roc-shell | mount-route | compatibility-only | no | shell, proof | 4 | retire-or-isolate-compatibility-route |
| roc-dashboard-native-source | ui | package-native-route | yes | shell, sidebar, header, state, metrics, tables, charts, workflow, proof | 1132 | reduce-local-visual-primitive-debt |
| market-intelligence-live | legacy-compatibility-route | compatibility-only | no | shell, sidebar, header, state, metrics, tables, charts, workflow, proof | 452 | retire-or-isolate-compatibility-route |

### Media Engine

Verdict: **needs-source-decomposition**  
Source score: 40

Blockers:
- localDebt.high: media-engine-ops-active has local visual debt score 536.

Warnings:
- families.partial: media-engine-ops-active is missing sidebar, proof.

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| media-engine-ops-active | ui | package-native-route | yes | shell, header, state, metrics, tables, charts, workflow | 536 | reduce-local-visual-primitive-debt |

### Media Business OS

Verdict: **needs-source-decomposition**  
Source score: 2

Blockers:
- localDebt.high: media-business-react-dashboard has local visual debt score 119.
- surface.notSourceNative: media-business-main is static-html, not package-native by source.
- families.missing: media-business-main is missing metrics, tables, charts, workflow, proof.
- surface.notSourceNative: media-business-renderer is server-rendered, not package-native by source.
- localDebt.high: media-business-renderer has local visual debt score 679.

Warnings:
- localDebt.moderate: media-business-main has local visual debt score 53.
- families.partial: media-business-renderer is missing shell, header.

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| media-business-react-dashboard | ui | package-native-route | yes | shell, sidebar, header, state, metrics, tables, charts, workflow, proof | 119 | reduce-local-visual-primitive-debt |
| media-business-main | ui | static-html | yes | shell, sidebar, header, state | 53 | replace-static-html-with-react-vite-route |
| media-business-renderer | ui | server-rendered | yes | sidebar, state, metrics, tables, charts, workflow, proof | 679 | extract-server-html-into-package-native-components |

### Business Mapper

Verdict: **needs-source-decomposition**  
Source score: 8

Blockers:
- surface.notSourceNative: business-mapper-workspace is static-html, not package-native by source.
- families.missing: business-mapper-workspace is missing tables, charts, workflow, proof.
- localDebt.high: business-mapper-workspace has local visual debt score 87.

Warnings:
- None

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| business-mapper-workspace | ui | static-html | yes | shell, sidebar, header, state, metrics | 87 | replace-static-html-with-react-vite-route |

### Meal Assistant

Verdict: **needs-source-decomposition**  
Source score: 24

Blockers:
- families.missing: meal-dashboard-shell is missing tables, charts, workflow, proof.
- localDebt.high: meal-dashboard-shell has local visual debt score 985.

Warnings:
- None

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| meal-dashboard-shell | ui | package-native-route | yes | shell, sidebar, header, state, metrics | 985 | reduce-local-visual-primitive-debt |

### Hermes OS

Verdict: **needs-source-decomposition**  
Source score: 0

Blockers:
- surface.notSourceNative: hermes-dashboard-hub is server-rendered, not package-native by source.
- localDebt.high: hermes-dashboard-hub has local visual debt score 1450.
- surface.notSourceNative: hermes-operator-dashboard-artifact is server-rendered, not package-native by source.
- families.missing: hermes-operator-dashboard-artifact is missing sidebar, charts, workflow, proof.
- surface.notSourceNative: hermes-control-plane-artifact is server-rendered, not package-native by source.
- families.missing: hermes-control-plane-artifact is missing sidebar, metrics, charts, workflow, proof.

Warnings:
- families.partial: hermes-dashboard-hub is missing charts, workflow, proof.
- localDebt.moderate: hermes-operator-dashboard-artifact has local visual debt score 61.
- localDebt.moderate: hermes-control-plane-artifact has local visual debt score 49.

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| hermes-dashboard-hub | ui | server-rendered | yes | shell, sidebar, header, state, metrics, tables | 1450 | extract-server-html-into-package-native-components |
| hermes-operator-dashboard-artifact | ui | server-rendered | yes | shell, header, state, metrics, tables | 61 | extract-server-html-into-package-native-components |
| hermes-control-plane-artifact | ui | server-rendered | yes | shell, header, state, tables | 49 | extract-server-html-into-package-native-components |

### TLC Capital Group OS

Verdict: **needs-source-decomposition**  
Source score: 24

Blockers:
- surface.notSourceNative: tlc-dashboard-shell is static-html, not package-native by source.
- families.missing: tlc-dashboard-shell is missing tables, charts, workflow, proof.

Warnings:
- None

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| tlc-dashboard-shell | ui | static-html | yes | shell, sidebar, header, state, metrics | 25 | replace-static-html-with-react-vite-route |
| tlc-dashboard-api | api | runtime-bridge | no | shell, sidebar, state | 19 | replace-runtime-markers-with-direct-kit-imports |
| tlc-dashboard-models | data-contract | runtime-bridge | no | shell, sidebar, state | 24 | replace-runtime-markers-with-direct-kit-imports |

### Rinseables OS

Verdict: **needs-source-decomposition**  
Source score: 23

Blockers:
- surface.notSourceNative: rinseables-dashboard-shell is static-html, not package-native by source.
- families.missing: rinseables-dashboard-shell is missing tables, charts, workflow, proof.

Warnings:
- None

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| rinseables-dashboard-shell | ui | static-html | yes | shell, sidebar, header, state, metrics | 28 | replace-static-html-with-react-vite-route |
| rinseables-dashboard-proof | proof-endpoint | unknown | no | shell, sidebar, header, state | 0 | complete-component-family-coverage |

### Investing System

Verdict: **needs-source-decomposition**  
Source score: 0

Blockers:
- surface.notSourceNative: investing-system-roc is static-html, not package-native by source.
- localDebt.high: investing-system-roc has local visual debt score 489.

Warnings:
- families.partial: investing-system-roc is missing workflow.

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| investing-system-roc | ui | static-html | yes | shell, sidebar, header, state, metrics, tables, charts, proof | 489 | replace-static-html-with-react-vite-route |
| investing-system-proof | proof-endpoint | server-rendered | no | none | 77 | extract-server-html-into-package-native-components |

### Nous Hermes Agent

Verdict: **needs-source-decomposition**  
Source score: 39

Blockers:
- surface.notSourceNative: hermes-dashboard-kit-gallery-web-route is runtime-bridge, not package-native by source.
- localDebt.high: hermes-dashboard-kit-gallery-web-route has local visual debt score 172.

Warnings:
- None

| Surface | Role | Level | Operator | Families | Debt | Next Layer |
| --- | --- | --- | --- | --- | --- | --- |
| hermes-dashboard-kit-gallery | kit-source | server-rendered | no | shell, sidebar, header, state, metrics, tables, charts, workflow, proof | 744 | extract-server-html-into-package-native-components |
| hermes-dashboard-kit-gallery-web-route | page-content | runtime-bridge | yes | shell, sidebar, header, state, metrics, tables, charts, workflow, proof | 172 | replace-runtime-markers-with-direct-kit-imports |
