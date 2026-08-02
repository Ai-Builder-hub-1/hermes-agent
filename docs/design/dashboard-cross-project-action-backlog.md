# Dashboard Cross-Project Action Backlog

Date: 2026-08-01T23:48:13.661Z  
Source: `packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json`  
Purpose: track required work that cannot be completed inside Nous Hermes Agent because it belongs in another project repository.

## Backlog

| Project | Priority | Current band | Target | Action | Reason |
|---|---:|---|---|---|---|
| Kashi VC | P0 | `T3A` | `T3C` | Repair audited Tier 3 surface markers for shell rail, command header, chart panels, semantic chart contracts, and overflow protection. | A Tier 3 cockpit with review warnings must remain a candidate rather than current. |
| Kashi VC | P1 | `T3A` | `T3C` | Plan package-native dashboard-kit adoption in the owning project. | Static/hybrid bridges are acceptable current delivery for some projects, but not the highest maturity target. |
| Media Engine | P1 | `T3B` | `T3C` | Plan package-native dashboard-kit adoption in the owning project. | Static/hybrid bridges are acceptable current delivery for some projects, but not the highest maturity target. |
| Media Business OS | P1 | `T1A` | `T3C` | Add `.hermes-dashboard.json` surfaces with required components, markers, owner/reviewer, proof route, and migration note. | Adapter sync proves CSS availability but not dashboard quality. |
| Media Business OS | P1 | `T1A` | `T3C` | Plan package-native dashboard-kit adoption in the owning project. | Static/hybrid bridges are acceptable current delivery for some projects, but not the highest maturity target. |
| Business Mapper | P2 | `T1A` | `T2B` | Add `.hermes-dashboard.json` surfaces with required components, markers, owner/reviewer, proof route, and migration note. | Adapter sync proves CSS availability but not dashboard quality. |
| Business Mapper | P2 | `T1A` | `T2B` | Plan package-native dashboard-kit adoption in the owning project. | Static/hybrid bridges are acceptable current delivery for some projects, but not the highest maturity target. |
| Meal Assistant | P1 | `T1A` | `T3C` | Add `.hermes-dashboard.json` surfaces with required components, markers, owner/reviewer, proof route, and migration note. | Adapter sync proves CSS availability but not dashboard quality. |
| Meal Assistant | P1 | `T1A` | `T3C` | Plan package-native dashboard-kit adoption in the owning project. | Static/hybrid bridges are acceptable current delivery for some projects, but not the highest maturity target. |
| Hermes OS | P1 | `T0P` | `T3C` | Create or confirm the production dashboard surface inventory in the owning project. | Central registry can track planned readiness, but implementation surfaces must live in the owning project. |
| Hermes OS | P1 | `T0P` | `T3C` | Plan package-native dashboard-kit adoption in the owning project. | Static/hybrid bridges are acceptable current delivery for some projects, but not the highest maturity target. |
| TLC Capital Group OS | P1 | `T0P` | `T3C` | Create or confirm the production dashboard surface inventory in the owning project. | Central registry can track planned readiness, but implementation surfaces must live in the owning project. |
| TLC Capital Group OS | P1 | `T0P` | `T3C` | Plan package-native dashboard-kit adoption in the owning project. | Static/hybrid bridges are acceptable current delivery for some projects, but not the highest maturity target. |

## Done Inside Nous Hermes Agent

- Refined tier bands are defined in the central dashboard-kit adoption registry.
- Adoption audit computes `currentBand`, `targetBand`, `implementationMode`, `nextAction`, and `externalWorkItems`.
- Latest adoption report is refreshed with computed tier-band fields.
- Design Intelligence UI reads generated project tier data from the latest report.
- Project tier assessment and external backlog artifacts are generated from the adoption report.

## Not Done Here By Design

- No sibling project source files were edited.
- No Kashi, Media Engine, Media Business OS, Business Mapper, Meal Assistant, Hermes OS, or TLC Capital Group OS implementation surfaces were changed.
- No project was promoted to a higher band unless the central audit evidence supported it.
