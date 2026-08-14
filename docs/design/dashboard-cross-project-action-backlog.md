# Dashboard Cross-Project Action Backlog

Date: 2026-08-14T17:16:35.078Z
Source: `packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json`
Purpose: track required work that cannot be completed inside Nous Hermes Agent because it belongs in another project repository.

## Backlog

| Project | Priority | Current band | Target | Action | Reason |
|---|---:|---|---|---|---|
| Kashi VC | P0 | `T3C` | `T3C` | Replace the production surface's local/static/bridge rendering with package-native dashboard-kit primitives, then update the manifest notes only after proof passes. | A dashboard cannot be marked T3C/current while its registry or surface notes still describe compatibility rendering, local primitives, or pending migration. |
| Media Engine | P0 | `T3C` | `T3C` | Replace the production surface's local/static/bridge rendering with package-native dashboard-kit primitives, then update the manifest notes only after proof passes. | A dashboard cannot be marked T3C/current while its registry or surface notes still describe compatibility rendering, local primitives, or pending migration. |
| Media Business OS | P0 | `T3C` | `T3C` | Replace the production surface's local/static/bridge rendering with package-native dashboard-kit primitives, then update the manifest notes only after proof passes. | A dashboard cannot be marked T3C/current while its registry or surface notes still describe compatibility rendering, local primitives, or pending migration. |
| Meal Assistant | P0 | `T3C` | `T3C` | Replace the production surface's local/static/bridge rendering with package-native dashboard-kit primitives, then update the manifest notes only after proof passes. | A dashboard cannot be marked T3C/current while its registry or surface notes still describe compatibility rendering, local primitives, or pending migration. |
| Hermes OS | P0 | `T3C` | `T3C` | Replace the production surface's local/static/bridge rendering with package-native dashboard-kit primitives, then update the manifest notes only after proof passes. | A dashboard cannot be marked T3C/current while its registry or surface notes still describe compatibility rendering, local primitives, or pending migration. |
| TLC Capital Group OS | P0 | `T3C` | `T3C` | Replace the production surface's local/static/bridge rendering with package-native dashboard-kit primitives, then update the manifest notes only after proof passes. | A dashboard cannot be marked T3C/current while its registry or surface notes still describe compatibility rendering, local primitives, or pending migration. |
| Rinseables OS | P0 | `T3C` | `T3C` | Replace the production surface's local/static/bridge rendering with package-native dashboard-kit primitives, then update the manifest notes only after proof passes. | A dashboard cannot be marked T3C/current while its registry or surface notes still describe compatibility rendering, local primitives, or pending migration. |
| Investing System | P0 | `T3C` | `T3C` | Replace the production surface's local/static/bridge rendering with package-native dashboard-kit primitives, then update the manifest notes only after proof passes. | A dashboard cannot be marked T3C/current while its registry or surface notes still describe compatibility rendering, local primitives, or pending migration. |

## Done Inside Nous Hermes Agent

- Refined tier bands are defined in the central dashboard-kit adoption registry.
- Adoption audit computes `currentBand`, `targetBand`, `implementationMode`, `nextAction`, and `externalWorkItems`.
- Latest adoption report is refreshed with computed tier-band fields.
- Design Intelligence UI reads generated project tier data from the latest report.
- Project tier assessment and external backlog artifacts are generated from the adoption report.

## Current Interpretation

- Empty backlog means no current adoption-blocking work is assigned to owning project repositories.
- Follow-up polish or expansion work should live in the roadmap, not in this blocking action backlog.
- No project should be promoted to a higher band unless the central audit evidence supports it.
