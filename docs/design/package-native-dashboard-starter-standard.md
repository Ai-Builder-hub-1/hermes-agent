# Package-Native Dashboard Starter Standard

Dashboard products must be package-native. Every registered dashboard project
must import `@hermes/dashboard-kit` directly for its production dashboard
surface. Static adapters are a legacy bridge for existing dashboards, not the
default build path and not an acceptable completion state.

This standard now depends on
`docs/design/hdk-first-dashboard-baseline-standard.md`. The HDK-first baseline
is the default creation and enforcement contract for future dashboard projects.

## Rule

Any dashboard surface moving toward production completion must:

- use React/Vite or another approved component frontend
- depend on `@hermes/dashboard-kit`
- declare `dashboardKit.baseline="hdk-first"` in `.hermes-dashboard.json`
- import `@hermes/dashboard-kit` directly in the production dashboard route
- render `DashboardShell`, `DashboardSidebar`, `DashboardHeader`, and
  dashboard-kit page primitives directly
- expose `npm run hdk:check`, `npm run hdk:proof`, and `npm run hdk:visual`
- satisfy `docs/design/dashboard-operational-navigation-standard.md` for the
  primary navigation rail
- declare `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"`
- include a Mobbin/reference intake before implementation
- include a design-review checklist before production approval
- include proof routes, Playwright screenshot tests, and visual baseline capture
- keep visual-selection/debug tooling development-only
- avoid unreviewed local dashboard CSS, hardcoded colors, and one-off shell/sidebar/table/chart patterns

## Static Adapter Policy

Static adapters are allowed only for:

- existing dashboards moving through migration
- compatibility routes
- dev-only prototype review
- emergency visual stabilization while package-native migration is planned

Static adapters are not allowed as the primary implementation for a newly
created Tier 3 dashboard. A new dashboard that starts as static HTML/CSS must be
registered as Tier 0 or Tier 1 and cannot be called complete.

For existing dashboards, a synced static adapter may keep the UI stable during
migration, but the project remains incomplete until its primary production route
imports `@hermes/dashboard-kit` directly and passes package-native validation.

## Mobbin Intake

Before implementation, create a reference intake at:

```text
docs/design/mobbin-reference-intake.md
```

The intake must include:

- dashboard product type
- operator question
- search briefs used
- Mobbin links reviewed
- extracted layout patterns
- extracted interaction patterns
- component mapping into `@hermes/dashboard-kit`
- theme-mode decision
- acceptance criteria

References are input for pattern extraction, not copied UI.

## Starter Templates

The starter supports multiple product-native dashboard templates so projects do
not begin from a generic cockpit:

- `cockpit`
- `operations-queue`
- `market-browser`
- `content-calendar`
- `cost-command`
- `household-planner`
- `approval-workflow`

Each template sets the operator question, sidebar model, starter metrics,
primary table, starter chart, and Mobbin search briefs.

## Design Review

Every Tier 3 dashboard must include:

```text
docs/design/design-review-checklist.md
```

The checklist must capture:

- the target experience tier
- Mobbin references and extracted patterns
- one-shell proof
- component mapping
- chart/table/form/drawer review
- light/dark/system screenshot evidence
- approved exceptions

## Visual Baseline

Every package-native dashboard must be able to capture:

- desktop expanded light
- desktop expanded dark
- desktop expanded system
- desktop collapsed light
- desktop collapsed dark
- desktop collapsed system
- mobile light
- mobile dark
- mobile system

Use:

```bash
npm run dashboard:visual-baseline:capture -- --url http://127.0.0.1:4177 --out proof/dashboard-baseline
```

Generated dashboards also include:

```bash
npm run proof:screenshots
```

Compare approved and current screenshots with:

```bash
npm run dashboard:visual-baseline:compare -- --baseline proof/dashboard-baseline/approved --current proof/dashboard-baseline/current
```

Rendered browser quality should be audited with:

```bash
npm run dashboard:rendered:audit -- --url http://127.0.0.1:4177
```

## Tier 3 Score

Every package-native dashboard should produce a numeric Tier 3 score:

```bash
npm run dashboard:tier3:score -- --project-dir ../new-dashboard
```

The score combines package-native adoption, shell/component coverage,
Mobbin/reference intake, design-review artifacts, proof capture, rendered
browser audit, visual baseline comparison, state coverage, and theme evidence.

## Project Creation Gate

New dashboards must pass:

```bash
npm run dashboard:creation-gate -- --project-dir ../new-dashboard
```

The gate blocks new Tier 3 dashboards that start as standalone static shells,
omit `@hermes/dashboard-kit`, omit the canonical route registry, or allow a
static adapter as the primary runtime.

## CI Template

Use `docs/design/dashboard-tier3-ci-template.yml` as the starting workflow for
downstream dashboard repos. It runs package-native validation, creation gate,
proof tests, and Tier 3 score checks.

## Starter Command

Use:

```bash
npm run dashboard:package-native:create -- --project-dir ../new-dashboard --project-id new-dashboard --name "New Dashboard"
```

The scaffold creates:

- `package.json`
- `index.html`
- `src/App.tsx`
- `src/main.tsx`
- `src/dashboard-theme.css`
- `.hermes-dashboard.json`
- `hermes.dashboards.json`
- `docs/design/mobbin-reference-intake.md`
- `docs/design/design-review-checklist.md`
- `tests/dashboard.spec.ts`
- `scripts/capture-proof-screenshots.mjs`
- `playwright.config.ts`

The generated `package.json` must include:

```json
{
  "scripts": {
    "hdk:check": "node ../nous-hermes-agent/scripts/enforce-dashboard-creation-gate.mjs --project-dir .",
    "hdk:proof": "npm run test && npm run proof:screenshots",
    "hdk:visual": "npm run proof:screenshots"
  }
}
```

Validate a package-native surface with:

```bash
npm run dashboard:package-native:surface:validate -- --project-dir ../new-dashboard
```

## Completion Gate

A new Tier 3 dashboard is not complete until:

- the HDK-first baseline gate passes
- adoption mode is `package-native`
- production route imports `@hermes/dashboard-kit` directly
- current and target tiers are both `3`
- Mobbin intake is present and references are recorded
- one-shell route is proven
- operational navigation proof exists for brand block, grouped nav, active
  state, collapsed labels, footer/status context, and mobile behavior
- design-review checklist is present
- light/dark theme mode contract passes
- screenshot proof exists for primary routes
- no static adapter is the primary runtime dependency
- local CSS and hardcoded colors have been reviewed or replaced with tokens
- rendered audit and visual baseline comparison are passing or reviewed with an approved exception
