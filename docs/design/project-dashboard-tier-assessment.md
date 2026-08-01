# Project Dashboard Tier Assessment

Date: 2026-08-01  
Source: `npm run dashboard-kit:adoption:report`  
Scope: registered Hermes dashboard-kit projects

## Refined Tier Bands

The original `0-3` experience tier is useful, but it hides important delivery status. A project can be "Tier 3" in operator experience while still being delivered through a static adapter, or "Tier 1" while only having synced CSS and no audited surface inventory. Use these bands for true project status.

| Band | Numeric tier | Label | Meaning |
|---|---:|---|---|
| `T0P` | 0 | Planned or governance-only | Project is registered for governance/readiness but has no audited operator surface yet. |
| `T0L` | 0 | Raw legacy surface | Dashboard exists as a raw report, debug table, prototype, or ungoverned screen. |
| `T1A` | 1 | Adapter-aligned shell | Canonical CSS/static adapter is synced, but no surface-level component inventory is enforceable. |
| `T1B` | 1 | Inventoried one-shell report | One-shell route and surfaces are inventoried, but the main operator path still reads as a report. |
| `T2A` | 2 | Hybrid shared-component dashboard | Primary surface uses shared-kit contracts through a static or hybrid implementation, but is not fully package-native. |
| `T2B` | 2 | Package-native shared-component dashboard | Primary surface imports shared components directly and covers required states, but is not yet a product-grade cockpit. |
| `T3A` | 3 | Cockpit candidate with review gaps | Dashboard targets product-grade cockpit behavior but still has Tier 3 visual, shell, chart, proof, or interaction warnings. |
| `T3B` | 3 | Current static/hybrid product cockpit | Audited product-grade cockpit is current, but delivery still depends on static or hybrid adapter infrastructure. |
| `T3C` | 3 | Package-native product cockpit | Highest maturity: audited Tier 3 cockpit implemented directly with shared package components and complete proof/validation. |

## Project Assessment

| Project | Audit status | Coarse tier | Refined band | Target band | Evidence | Next move |
|---|---|---:|---|---|---|---|
| Kashi VC | `needs-review` | `3 -> 3` | `T3A` | `T3C` | Registered surface `market-intelligence-live`; warnings for package-native bridge status, missing Tier 3 sidebar rail, compact command header, and `ChartPanel` evidence. | Repair Tier 3 visual/shell/chart markers in the live command surface; then plan package-native route migration. |
| Media Engine | `needs-review` | `3 -> 3` | `T3B` | `T3C` | Production renderer has shared-kit shell markers, sidebar rail, compact command header, overflow protection, drilldown, state checklist, AI review panel, chart telemetry, and proof-state surfaces, but remains a static/hybrid bridge. | Preserve as the current static/hybrid Tier 3 reference; next maturity step is package-native implementation. |
| Media Business OS | `needs-review` | `1 -> 3` | `T1A` | `T3C` | Synced static adapter exists, but no surface inventory is present and the project still needs a product-grade operating cockpit. | Add surface inventory, pick primary recipe, define data/state contracts, then build shared-component cockpit. |
| Business Mapper | `needs-review` | `1 -> 2` | `T1A` | `T2B` | Synced static adapter exists, no surface inventory, target is shared component dashboard rather than full cockpit. | Add surface inventory and migrate primary dashboard path to shared components. |
| Meal Assistant | `needs-review` | `1 -> 3` | `T1A` | `T3C` | Server-rendered/static dashboard UI exists as a legacy bridge and now requires package-native/shared-kit migration before it can be considered complete. | Add surface inventory, define the product cockpit routes, and migrate away from hand-authored server-rendered dashboard HTML/CSS. |
| Hermes OS | `needs-review` | `0 -> 3` | `T0P` | `T3C` | Registered as planned/governance-only; no audited dashboard surfaces. | Decide whether Hermes OS owns a production operator dashboard or remains governance-only; if dashboard-owned, add surfaces and target package-native cockpit. |
| TLC Capital Group OS | `needs-review` | `0 -> 3` | `T0P` | `T3C` | Registered as planned/readiness consumer; no audited dashboard surfaces. | Inventory executive/operator surfaces and define whether this becomes a package-native cockpit or remains a readiness consumer. |

## Current Ranking

1. `T3B` Media Engine: current product-grade cockpit, static/hybrid delivery, package-native migration still open.
2. `T3A` Kashi VC: cockpit candidate, but Tier 3 markers need review repairs before it should be called current.
3. `T1A` Media Business OS: adapter aligned, no enforceable surfaces yet.
4. `T1A` Business Mapper: adapter aligned, target is shared-component dashboard.
5. `T1A` Meal Assistant: adapter aligned, target is shared-component dashboard.
6. `T0P` Hermes OS: planned/governance-only in this registry.
7. `T0P` TLC Capital Group OS: planned/readiness consumer in this registry.

## System Updates Needed

- Use refined tier bands in handoffs and project status summaries.
- Do not call a project simply "Tier 3" unless it also reports the band.
- Treat `T3A` as not complete until warnings are gone.
- Treat `T3B` as complete for operator experience, but not complete for package-native maturity.
- Treat `T1A` as adapter readiness only; it does not prove page-level quality.
- Treat `T0P` as governance coverage, not dashboard implementation.

## Validation

Latest audit command:

```bash
npm run dashboard-kit:adoption:report
```

Result:

- Kashi VC: `needs-review`, `3->3 T3C`, 4 warnings.
- Media Engine: `needs-review`, `3->3 T3C`, 1 warning.
- Media Business OS: `needs-review`, `1->3 T3C`, 2 warnings.
- Business Mapper: `needs-review`, `1->2`, 1 warning.
- Meal Assistant: `needs-review`, `1->3 T3C`, 3 warnings.
- Hermes OS: `needs-review`, `0->3 T3C`, 2 warnings.
- TLC Capital Group OS: `needs-review`, `0->3 T3C`, 2 warnings.
