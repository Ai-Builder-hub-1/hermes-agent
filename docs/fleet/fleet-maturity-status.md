# Fleet Maturity Status

Generated: 2026-08-05T14:33:21.128Z

Purpose: one fleet-wide tracker for production proof, deployment evidence, monitoring, credentials, live E2E evidence, outcome feeds, business/product maturity, and cross-project maturity triggers.

## Summary

- Projects tracked: 10
- Evidence entries: 100
- Current evidence entries: 61
- Missing evidence entries: 28
- Blocked evidence entries: 2
- Maturity work items: 36
- Cross-project work items: 5
- Ready-to-build suggestions: 31
- Human-decision suggestions: 2

## Project Registry

| Project | Service | Dashboard Band | Deploy Evidence | Proof | Repo | Relationships |
| --- | --- | --- | --- | --- | --- | --- |
| TLC Capital Group OS | tlc-capital-group-os | T3C | current | baseline-present | clean | rolls-up:hermes-os; rolls-up:media-business-operations; rolls-up:media-engine; rolls-up:rinseables-os; rolls-up:business-mapper; rolls-up:investing-system |
| Nous Hermes Agent | nous-hermes-agent | unknown | current | baseline-present | clean | governs-dashboard-standards-for:*; tracks-maturity-for:*; feeds:hermes-os; feeds:tlc-capital-group-os |
| Hermes OS | hermes | T3C | current | baseline-present | clean | deploys:*; reports-to:tlc-capital-group-os; is-controlled-by:nous-hermes-agent |
| Media Engine | media-engine-dashboard | T3C | current | baseline-present | clean | feeds-output-status-to:media-business-operations; feeds-cost-telemetry-to:media-business-operations; uses-business-priorities-from:tlc-capital-group-os; may-produce-for:rinseables-os |
| Media Business Operations | media-business-operations | T3C | current | baseline-present | clean | consumes-output-status-from:media-engine; reports-brand-readiness-to:tlc-capital-group-os; may-operate-audience-layer-for:rinseables-os |
| Khashi VC | khashi | T3C | current | baseline-present | clean | reports-diagnostics-to:hermes-os; reports-opportunity-readiness-to:tlc-capital-group-os |
| Business Mapper / Consulting | business-mapper | T2B | current | baseline-present | clean | packages-capabilities-from:hermes-os; reports-offer-readiness-to:tlc-capital-group-os |
| Meal Assistant | meal-assistant | T3C | current | baseline-present | clean | reports-product-readiness-to:tlc-capital-group-os; uses-runtime-rail:hermes-os |
| Rinseables OS | rinseables-os | unknown | current | not-in-proof-registry | clean | may-consume-media-from:media-engine; may-report-audience-through:media-business-operations; reports-business-readiness-to:tlc-capital-group-os |
| Investing System | investing-system | unknown | current | baseline-present | clean | reports-investment-readiness-to:tlc-capital-group-os; uses-runtime-rail:hermes-os |

## Evidence Coverage

| Evidence Kind | Current | Missing | Stale | Blocked |
| --- | --- | --- | --- | --- |
| production-health | 10 | 0 | 0 | 0 |
| deployment-evidence | 10 | 0 | 0 | 0 |
| readonly-proof | 9 | 0 | 1 | 0 |
| screenshot-baseline | 9 | 1 | 0 | 0 |
| dashboard-standard | 7 | 3 | 0 | 0 |
| live-e2e | 0 | 10 | 0 | 0 |
| dns-proxy | 10 | 0 | 0 | 0 |
| monitoring | 0 | 10 | 0 | 0 |
| external-credentials | 0 | 0 | 0 | 2 |
| outcome-feed | 6 | 4 | 0 | 0 |

## Top Suggestions

| Suggestion | Owner | Status | Priority | Next Action |
| --- | --- | --- | --- | --- |
| Investing System: dashboard standard is missing | investing-system | ready-to-build | high | Codex can build or refresh this maturity work. |
| Nous Hermes Agent: dashboard standard is missing | nous-hermes-agent | ready-to-build | high | Codex can build or refresh this maturity work. |
| Rinseables OS: dashboard standard is missing | rinseables-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| Rinseables OS: readonly proof is stale | rinseables-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| Business Mapper / Consulting: live e2e is missing | business-mapper | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Business Mapper / Consulting: monitoring is missing | business-mapper | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Hermes OS: live e2e is missing | hermes-os | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Hermes OS: monitoring is missing | hermes-os | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Hermes OS: outcome feed is missing | hermes-os | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Investing System: live e2e is missing | investing-system | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Investing System: monitoring is missing | investing-system | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Khashi VC: live e2e is missing | khashi-vc | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Khashi VC: monitoring is missing | khashi-vc | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Meal Assistant: live e2e is missing | meal-assistant | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Meal Assistant: monitoring is missing | meal-assistant | ready-to-build | medium | Codex can build or refresh this maturity work. |
