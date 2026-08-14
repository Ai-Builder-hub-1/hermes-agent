# Fleet Maturity Status

Generated: 2026-08-14T20:37:19.728Z

Purpose: one fleet-wide tracker for production proof, deployment evidence, monitoring, credentials, live E2E evidence, outcome feeds, business/product maturity, and cross-project maturity triggers.

## Summary

- Projects tracked: 10
- Evidence entries: 140
- Current evidence entries: 76
- Missing evidence entries: 0
- Needs-review evidence entries: 54
- Blocked evidence entries: 2
- Maturity work items: 61
- Cross-project work items: 5
- Ready-to-build suggestions: 57
- Human-decision suggestions: 2

## Project Registry

| Project | Service | Dashboard Band | Visual | Product | Company OS | Deploy Evidence | Proof | Repo | Relationships |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TLC Capital Group OS | tlc-capital-group-os | T3C | V4->V4 | P2->P4 | C2->C5 | current | baseline-present | 5 dirty | rolls-up:hermes-os; rolls-up:media-business-operations; rolls-up:media-engine; rolls-up:rinseables-os; rolls-up:business-mapper; rolls-up:investing-system |
| Nous Hermes Agent | nous-hermes-agent | T3C | V2->V3 | P3->P5 | C2->C5 | current | baseline-present | 56 dirty | governs-dashboard-standards-for:*; tracks-maturity-for:*; feeds:hermes-os; feeds:tlc-capital-group-os |
| Hermes OS | hermes | T3C | V4->V4 | P2->P4 | C1->C4 | current | baseline-present | 5 dirty | deploys:*; reports-to:tlc-capital-group-os; is-controlled-by:nous-hermes-agent |
| Media Engine | media-engine-dashboard | T3C | V4->V4 | P3->P4 | C1->C4 | current | baseline-present | 5 dirty | feeds-output-status-to:media-business-operations; feeds-cost-telemetry-to:media-business-operations; uses-business-priorities-from:tlc-capital-group-os; may-produce-for:rinseables-os |
| Media Business Operations | media-business-operations | T3C | V4->V4 | P2->P4 | C1->C4 | current | baseline-present | 5 dirty | consumes-output-status-from:media-engine; reports-brand-readiness-to:tlc-capital-group-os; may-operate-audience-layer-for:rinseables-os |
| Khashi VC | khashi | T3C | V4->V4 | P3->P4 | C1->C4 | current | baseline-present | 6 dirty | reports-diagnostics-to:hermes-os; reports-opportunity-readiness-to:tlc-capital-group-os |
| Business Mapper / Consulting | business-mapper | T3C | V4->V4 | P1->P3 | C0->C3 | current | baseline-present | 4 dirty | packages-capabilities-from:hermes-os; reports-offer-readiness-to:tlc-capital-group-os |
| Meal Assistant | meal-assistant | T3C | V1->V3 | P1->P3 | C0->C2 | current | baseline-present | 4 dirty | reports-product-readiness-to:tlc-capital-group-os; uses-runtime-rail:hermes-os |
| Rinseables OS | rinseables-os | T3C | V4->V4 | P1->P3 | C0->C3 | current | baseline-present | 4 dirty | may-consume-media-from:media-engine; may-report-audience-through:media-business-operations; reports-business-readiness-to:tlc-capital-group-os |
| Investing System | investing-system | T3C | V4->V4 | P3->P4 | C1->C4 | current | baseline-present | 4 dirty | reports-investment-readiness-to:tlc-capital-group-os; uses-runtime-rail:hermes-os |

## Evidence Coverage

| Evidence Kind | Current | Missing | Needs Review | Stale | Blocked |
| --- | --- | --- | --- | --- | --- |
| production-health | 10 | 0 | 0 | 0 | 0 |
| deployment-evidence | 10 | 0 | 0 | 0 | 0 |
| readonly-proof | 10 | 0 | 0 | 0 | 0 |
| screenshot-baseline | 10 | 0 | 0 | 0 | 0 |
| dashboard-standard | 3 | 0 | 7 | 0 | 0 |
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
| Business Mapper / Consulting: static route debt is needs-review | business-mapper | ready-to-build | high | Codex can build or refresh this maturity work. |
| Hermes OS: dashboard standard is needs-review | hermes-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| Investing System: dashboard standard is needs-review | investing-system | ready-to-build | high | Codex can build or refresh this maturity work. |
| Investing System: static route debt is needs-review | investing-system | ready-to-build | high | Codex can build or refresh this maturity work. |
| Khashi VC: dashboard standard is needs-review | khashi-vc | ready-to-build | high | Codex can build or refresh this maturity work. |
| Khashi VC: static route debt is needs-review | khashi-vc | ready-to-build | high | Codex can build or refresh this maturity work. |
| Meal Assistant: dashboard standard is needs-review | meal-assistant | ready-to-build | high | Codex can build or refresh this maturity work. |
| Media Business Operations: dashboard standard is needs-review | media-business-operations | ready-to-build | high | Codex can build or refresh this maturity work. |
| Rinseables OS: dashboard standard is needs-review | rinseables-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| Rinseables OS: static route debt is needs-review | rinseables-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| TLC Capital Group OS: dashboard standard is needs-review | tlc-capital-group-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| TLC Capital Group OS: static route debt is needs-review | tlc-capital-group-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| Business Mapper / Consulting: company os maturity is needs-review | business-mapper | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Business Mapper / Consulting: live e2e is needs-review | business-mapper | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Business Mapper / Consulting: monitoring is needs-review | business-mapper | ready-to-build | medium | Codex can build or refresh this maturity work. |
