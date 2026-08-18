# Fleet Maturity Status

Generated: 2026-08-15T18:51:30.612Z

Purpose: one fleet-wide tracker for production proof, deployment evidence, monitoring, credentials, live E2E evidence, outcome feeds, business/product maturity, and cross-project maturity triggers.

## Summary

- Projects tracked: 10
- Evidence entries: 140
- Current evidence entries: 64
- Missing evidence entries: 10
- Needs-review evidence entries: 56
- Blocked evidence entries: 2
- Maturity work items: 73
- Cross-project work items: 5
- Ready-to-build suggestions: 67
- Human-decision suggestions: 2

## Project Registry

| Project | Service | Dashboard Band | Visual | Product | Company OS | Deploy Evidence | Proof | Repo | Relationships |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TLC Capital Group OS | tlc-capital-group-os | T3C | V4->V4 | P2->P4 | C2->C5 | missing | baseline-present | clean | rolls-up:hermes-os; rolls-up:media-business-operations; rolls-up:media-engine; rolls-up:rinseables-os; rolls-up:business-mapper; rolls-up:investing-system |
| Nous Hermes Agent | nous-hermes-agent | T3C | V2->V3 | P3->P5 | C2->C5 | missing | baseline-present | 44 dirty | governs-dashboard-standards-for:*; tracks-maturity-for:*; feeds:hermes-os; feeds:tlc-capital-group-os |
| Hermes OS | hermes | T3C | V4->V4 | P2->P4 | C1->C4 | missing | baseline-present | clean | deploys:*; reports-to:tlc-capital-group-os; is-controlled-by:nous-hermes-agent |
| Media Engine | media-engine-dashboard | T3C | V4->V4 | P3->P4 | C1->C4 | missing | baseline-present | clean | feeds-output-status-to:media-business-operations; feeds-cost-telemetry-to:media-business-operations; uses-business-priorities-from:tlc-capital-group-os; may-produce-for:rinseables-os |
| Media Business Operations | media-business-operations | T3C | V4->V4 | P2->P4 | C1->C4 | missing | baseline-present | clean | consumes-output-status-from:media-engine; reports-brand-readiness-to:tlc-capital-group-os; may-operate-audience-layer-for:rinseables-os |
| Khashi VC | khashi | T3C | V4->V4 | P3->P4 | C1->C4 | missing | baseline-present | clean | reports-diagnostics-to:hermes-os; reports-opportunity-readiness-to:tlc-capital-group-os |
| Business Mapper / Consulting | business-mapper | T3C | V4->V4 | P1->P3 | C0->C3 | missing | baseline-present | clean | packages-capabilities-from:hermes-os; reports-offer-readiness-to:tlc-capital-group-os |
| Meal Assistant | meal-assistant | T3C | V1->V3 | P1->P3 | C0->C2 | missing | baseline-present | clean | reports-product-readiness-to:tlc-capital-group-os; uses-runtime-rail:hermes-os |
| Rinseables OS | rinseables-os | T3C | V4->V4 | P1->P3 | C0->C3 | missing | baseline-present | clean | may-consume-media-from:media-engine; may-report-audience-through:media-business-operations; reports-business-readiness-to:tlc-capital-group-os |
| Investing System | investing-system | T3A | V4->V4 | P3->P4 | C1->C4 | missing | baseline-present | 3 dirty | reports-investment-readiness-to:tlc-capital-group-os; uses-runtime-rail:hermes-os |

## Evidence Coverage

| Evidence Kind | Current | Missing | Needs Review | Stale | Blocked |
| --- | --- | --- | --- | --- | --- |
| production-health | 10 | 0 | 0 | 0 | 0 |
| deployment-evidence | 0 | 10 | 0 | 0 | 0 |
| readonly-proof | 10 | 0 | 0 | 0 | 0 |
| screenshot-baseline | 10 | 0 | 0 | 0 | 0 |
| dashboard-standard | 1 | 0 | 9 | 0 | 0 |
| visual-maturity | 8 | 0 | 2 | 0 | 0 |
| product-maturity | 0 | 0 | 10 | 0 | 0 |
| company-os-maturity | 0 | 0 | 10 | 0 | 0 |
| static-route-debt | 5 | 0 | 5 | 0 | 0 |
| live-e2e | 0 | 0 | 10 | 0 | 0 |
| dns-proxy | 10 | 0 | 0 | 0 | 0 |
| monitoring | 0 | 0 | 10 | 0 | 0 |
| external-credentials | 0 | 0 | 0 | 0 | 2 |
| outcome-feed | 10 | 0 | 0 | 0 | 0 |

## Top Suggestions

| Suggestion | Owner | Status | Priority | Next Action |
| --- | --- | --- | --- | --- |
| Business Mapper / Consulting: dashboard standard is needs-review | business-mapper | ready-to-build | high | Codex can build or refresh this maturity work. |
| Business Mapper / Consulting: deployment evidence is missing | business-mapper | ready-to-build | high | Codex can build or refresh this maturity work. |
| Business Mapper / Consulting: static route debt is needs-review | business-mapper | ready-to-build | high | Codex can build or refresh this maturity work. |
| Hermes OS: dashboard standard is needs-review | hermes-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| Hermes OS: deployment evidence is missing | hermes-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| Investing System: dashboard standard is needs-review | investing-system | ready-to-build | high | Codex can build or refresh this maturity work. |
| Investing System: deployment evidence is missing | investing-system | ready-to-build | high | Codex can build or refresh this maturity work. |
| Investing System: static route debt is needs-review | investing-system | ready-to-build | high | Codex can build or refresh this maturity work. |
| Khashi VC: dashboard standard is needs-review | khashi-vc | ready-to-build | high | Codex can build or refresh this maturity work. |
| Khashi VC: deployment evidence is missing | khashi-vc | ready-to-build | high | Codex can build or refresh this maturity work. |
| Khashi VC: static route debt is needs-review | khashi-vc | ready-to-build | high | Codex can build or refresh this maturity work. |
| Meal Assistant: dashboard standard is needs-review | meal-assistant | ready-to-build | high | Codex can build or refresh this maturity work. |
| Meal Assistant: deployment evidence is missing | meal-assistant | ready-to-build | high | Codex can build or refresh this maturity work. |
| Media Business Operations: dashboard standard is needs-review | media-business-operations | ready-to-build | high | Codex can build or refresh this maturity work. |
| Media Business Operations: deployment evidence is missing | media-business-operations | ready-to-build | high | Codex can build or refresh this maturity work. |
