# Fleet Maturity Status

Generated: 2026-08-08T21:55:55.117Z

Purpose: one fleet-wide tracker for production proof, deployment evidence, monitoring, credentials, live E2E evidence, outcome feeds, business/product maturity, and cross-project maturity triggers.

## Summary

- Projects tracked: 10
- Evidence entries: 110
- Current evidence entries: 94
- Missing evidence entries: 0
- Needs-review evidence entries: 6
- Blocked evidence entries: 2
- Maturity work items: 13
- Cross-project work items: 5
- Ready-to-build suggestions: 10
- Human-decision suggestions: 2

## Project Registry

| Project | Service | Dashboard Band | Deploy Evidence | Proof | Repo | Relationships |
| --- | --- | --- | --- | --- | --- | --- |
| TLC Capital Group OS | tlc-capital-group-os | T3C | current | baseline-present | clean | rolls-up:hermes-os; rolls-up:media-business-operations; rolls-up:media-engine; rolls-up:rinseables-os; rolls-up:business-mapper; rolls-up:investing-system |
| Nous Hermes Agent | nous-hermes-agent | T3C | current | baseline-present | 51 dirty | governs-dashboard-standards-for:*; tracks-maturity-for:*; feeds:hermes-os; feeds:tlc-capital-group-os |
| Hermes OS | hermes | T3C | current | baseline-present | clean | deploys:*; reports-to:tlc-capital-group-os; is-controlled-by:nous-hermes-agent |
| Media Engine | media-engine-dashboard | T3C | current | baseline-present | 19 dirty | feeds-output-status-to:media-business-operations; feeds-cost-telemetry-to:media-business-operations; uses-business-priorities-from:tlc-capital-group-os; may-produce-for:rinseables-os |
| Media Business Operations | media-business-operations | T3C | current | baseline-present | clean | consumes-output-status-from:media-engine; reports-brand-readiness-to:tlc-capital-group-os; may-operate-audience-layer-for:rinseables-os |
| Khashi VC | khashi | T3C | current | baseline-present | clean | reports-diagnostics-to:hermes-os; reports-opportunity-readiness-to:tlc-capital-group-os |
| Business Mapper / Consulting | business-mapper | T2B | current | baseline-present | clean | packages-capabilities-from:hermes-os; reports-offer-readiness-to:tlc-capital-group-os |
| Meal Assistant | meal-assistant | T3C | current | baseline-present | clean | reports-product-readiness-to:tlc-capital-group-os; uses-runtime-rail:hermes-os |
| Rinseables OS | rinseables-os | T3C | current | baseline-present | 5 dirty | may-consume-media-from:media-engine; may-report-audience-through:media-business-operations; reports-business-readiness-to:tlc-capital-group-os |
| Investing System | investing-system | T3C | current | baseline-present | 5 dirty | reports-investment-readiness-to:tlc-capital-group-os; uses-runtime-rail:hermes-os |

## Evidence Coverage

| Evidence Kind | Current | Missing | Needs Review | Stale | Blocked |
| --- | --- | --- | --- | --- | --- |
| production-health | 10 | 0 | 0 | 0 | 0 |
| deployment-evidence | 10 | 0 | 0 | 0 | 0 |
| readonly-proof | 10 | 0 | 0 | 0 | 0 |
| screenshot-baseline | 10 | 0 | 0 | 0 | 0 |
| dashboard-standard | 10 | 0 | 0 | 0 | 0 |
| static-route-debt | 5 | 0 | 5 | 0 | 0 |
| live-e2e | 9 | 0 | 1 | 0 | 0 |
| dns-proxy | 10 | 0 | 0 | 0 | 0 |
| monitoring | 10 | 0 | 0 | 0 | 0 |
| external-credentials | 0 | 0 | 0 | 0 | 2 |
| outcome-feed | 10 | 0 | 0 | 0 | 0 |

## Top Suggestions

| Suggestion | Owner | Status | Priority | Next Action |
| --- | --- | --- | --- | --- |
| Business Mapper / Consulting: static route debt is needs-review | business-mapper | ready-to-build | high | Codex can build or refresh this maturity work. |
| Investing System: static route debt is needs-review | investing-system | ready-to-build | high | Codex can build or refresh this maturity work. |
| Khashi VC: static route debt is needs-review | khashi-vc | ready-to-build | high | Codex can build or refresh this maturity work. |
| Rinseables OS: static route debt is needs-review | rinseables-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| TLC Capital Group OS: static route debt is needs-review | tlc-capital-group-os | ready-to-build | high | Codex can build or refresh this maturity work. |
| Khashi VC: live e2e is needs-review | khashi-vc | ready-to-build | medium | Codex can build or refresh this maturity work. |
| Promote Khashi production diagnostics into Hermes runtime evidence and TLC readiness. | hermes-os | recommended | medium | Close dependency evidence first, then execute the cross-project maturity item. |
| Media Engine: external credentials is blocked | media-engine | needs-human-decision | medium | Get human authority/credential decision before implementation. |
| Nous Hermes Agent: external credentials is blocked | nous-hermes-agent | needs-human-decision | medium | Get human authority/credential decision before implementation. |
| After Hermes deploy rail changes, refresh fleet deployment evidence and anti-loop status. | nous-hermes-agent | ready-to-build | low | Codex can build or refresh this maturity work. |
| Connect Rinseables product/audience maturity to Media Business, Media Engine, and TLC reporting. | tlc-capital-group-os | ready-to-build | low | Codex can build or refresh this maturity work. |
| Propagate Media Engine output/deploy maturity into Media Business readiness and TLC rollups. | media-business-operations | ready-to-build | low | Codex can build or refresh this maturity work. |
| Roll Media Business brand/readiness changes into TLC portfolio readiness. | tlc-capital-group-os | ready-to-build | low | Codex can build or refresh this maturity work. |
