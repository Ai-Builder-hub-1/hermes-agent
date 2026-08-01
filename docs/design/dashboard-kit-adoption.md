# Dashboard Kit Adoption

This document tracks which dashboards are using the Hermes dashboard design system and how far each one is from the target state.

Run:

```bash
npm run dashboard:design-system:status
```

Run the deeper project/surface adoption audit:

```bash
npm run dashboard-kit:adoption:audit
npm run dashboard-kit:adoption:audit:strict
npm run dashboard-kit:adoption:report
```

The older `dashboard:design-system:status` command verifies that copied static CSS adapters match the canonical CSS file. The newer `dashboard-kit:adoption:audit` command verifies that projects also declare which dashboard surfaces use the kit, which components those surfaces are expected to adopt, which implementation mode they use, and which stale local patterns are still present.

Use `-- --strict` in CI when all listed dashboards are expected to be synced. Use `-- --sync` only when intentionally updating copied static adapters from the canonical CSS source.

## Experience Tiers

Adapter sync is not dashboard completion. Each priority dashboard also needs an experience tier.

| Tier | State | Meaning |
| --- | --- | --- |
| `0` | Raw legacy report | Static report output, debug table, or prototype-first screen. |
| `1` | One-shell organized report | One shell and grouped pages, but still mainly raw report sections. |
| `2` | Shared component dashboard | Uses shared dashboard-kit components for the primary operator path. |
| `3` | Product-grade cockpit | Purpose-built operating cockpit with drilldowns, charts/live data, proof states, polished interactions, and clear decisions. |

The one-shell rule is only a Tier 1 requirement. Priority dashboards should target Tier 3 unless an exception says otherwise.

Use refined bands when reporting true status:

| Band | Numeric tier | Meaning |
| --- | ---: | --- |
| `T0P` | 0 | Planned or governance-only; no audited operator surface yet. |
| `T0L` | 0 | Raw legacy or prototype surface. |
| `T1A` | 1 | Adapter-aligned shell; synced CSS but no enforceable surface inventory. |
| `T1B` | 1 | Inventoried one-shell report. |
| `T2A` | 2 | Hybrid/static shared-component dashboard. |
| `T2B` | 2 | Package-native shared-component dashboard. |
| `T3A` | 3 | Cockpit candidate with review warnings. |
| `T3B` | 3 | Current static/hybrid product cockpit. |
| `T3C` | 3 | Package-native product cockpit. |

Media Engine is currently tracked as `T3B`: a current product-grade cockpit delivered through static/hybrid adapter infrastructure. Its next maturity target is `T3C`, package-native cockpit delivery, not another shell-only redesign.

Kashi VC is currently tracked as `T3A`: a cockpit candidate that still has Tier 3 review warnings for shell/header/chart evidence before it should be treated as current.

## Package-Native Standard

Static adapters are bridge infrastructure. They keep legacy and server-rendered dashboards aligned while a project moves toward the shared component package, but they are not the highest standard.

For priority dashboards:

- Tier 1 can be a one-shell static or server-rendered report.
- Tier 2 needs shared component contracts or direct kit adoption.
- Tier 3 must behave like a product cockpit.
- `T3C` requires package-native adoption of `@hermes/dashboard-kit`.

Server-rendered HTML/CSS is acceptable only when it is explicitly marked as a bridge or emergency path. It should not be the default build strategy for dashboards we already know need Tier 3 quality.

## Mobbin-First Adoption Standard

Material redesigns need reference evidence before implementation. A migration plan should include:

- Mobbin/reference pattern selected
- extracted layout and interaction notes
- component mapping to dashboard-kit primitives
- data/state contracts
- visual acceptance criteria
- screenshot proof after implementation

Using Mobbin after a screen already looks generic is too late. The reference extraction belongs before build.

Install local pre-commit hooks across every registered dashboard repo:

```bash
npm run dashboard:design-system:hooks:install
```

Those hooks run the strict checker before commits in this repo and in registered sibling dashboard repos.

If drift is detected during a local commit, the hook will:

1. Run the controlled sync command.
2. Verify that all registered adapters now match the canonical CSS.
3. Stop the commit once so the healed files can be reviewed and staged.

CI remains check-only. It does not auto-heal files inside GitHub Actions.

## Adoption States

| State | Meaning |
| --- | --- |
| `package-native` | Dashboard imports `@hermes/dashboard-kit` components directly. |
| `hybrid` | Dashboard composes some package-native/shared kit pieces while legacy/static surfaces remain. |
| `static-adapter` | Dashboard uses copied or served `hermes-dashboard-kit.css` classes. |
| `server-rendered-legacy` | Dashboard renders hand-authored server HTML/CSS and needs an explicit migration path before it can reach the highest standard. |
| `planned` | Dashboard is registered but not yet adopted. |
| `needs-sync` | Dashboard has a copied adapter but it does not match the canonical CSS. |
| `missing` | Dashboard is registered but the target adapter file is absent. |
| `unknown` | Dashboard exists but has not been registered or audited yet. |

## Registered Dashboards

The canonical registry is `docs/design/dashboard-kit-adoption.json`.

The executable adoption registry is `packages/hermes-dashboard-kit/adoption/registry.json`.

Current known dashboard adapter targets:

- `khashi-vc`: `../khashi-vc/public/roc/hermes-dashboard-kit.css`
- `media-engine`: `../media-engine/core/operations/hermes-dashboard-kit.css`
- `media-business-operations`: `../media-business-operations/public/dashboard/hermes-dashboard-kit.css`
- `business-mapper`: `../business-mapper/business_mapper/static/hermes-dashboard-kit.css`
- `Meal-assistant`: `../Meal-assistant/src/hermes-dashboard-kit.css`

## Migration Rule

Static adapters are bridge infrastructure. They are acceptable when a dashboard is not React package-native yet, but they must be tracked and checked for drift.

Each downstream project should also include a local `.hermes-dashboard.json` manifest. That file declares:

- the project id
- the required `@hermes/dashboard-kit` version
- whether adoption is `package-native`, `static-adapter`, `hybrid`, `planned`, or `prototype`
- the static adapter path when one exists
- the dashboard surfaces that must adopt shared components
- temporary exceptions that explain why strict adoption is not yet possible

The central registry lives in Nous Hermes Agent so one command can answer which dashboards are stale without opening every project manually.

Tier 3 projects should also declare whether a static/hybrid path is a temporary bridge. If the target is `T3C`, the migration plan must identify the package-native route, shared components, and proof checks needed to retire local HTML/CSS.

## Remote Safety

Dashboard kit and design-intelligence work should be committed to the project-owned private remote/backbone, not the public upstream open-source repository. Validate the local clone before release work:

```bash
npm run repo:remote:validate
```

## Commands

Audit every registered project:

```bash
npm run dashboard-kit:adoption:audit
```

Audit one project:

```bash
npm run dashboard-kit:adoption:audit -- --project khashi-vc
```

Sync a project adapter and update the manifest hash:

```bash
npm run dashboard-kit:adoption:sync -- --project khashi-vc
```

Generate a concrete migration plan for a surface:

```bash
npm run dashboard-kit:adoption:migrate -- --project khashi-vc --surface market-intelligence-live
```

Write a machine-readable report for Hermes OS/readiness consumers:

```bash
npm run dashboard-kit:adoption:report
```

The report is written to `packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json`.

## Drift Handling

Drift is not fixed by editing copied dashboard CSS manually. The repair path is:

```bash
npm run dashboard:design-system:status -- --sync
npm run dashboard:design-system:status -- --strict
```

The GitHub Actions workflow validates the canonical registry and source package. Local hooks validate the full multi-project workspace because sibling dashboard projects are outside this repository's GitHub checkout.
