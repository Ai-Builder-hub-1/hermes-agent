# HDK-First Dashboard Standard

This is the fleet rule for dashboard creation and redesign.

## Baseline

Every dashboard starts from `@hermes/dashboard-kit`.

The shared kit owns:

- Shell and page frame
- Sidebar behavior
- Header/auth/session placement
- Spacing and density scale
- Theme tokens
- Cards, tables, tabs, drawers, forms, and state panels
- Chart containers and proof states
- Loading, empty, partial, stale, and error states
- Visual proof metadata

Project dashboards may add custom domain components, but those components must live inside HDK layout slots and use HDK tokens.

## What Is Not Enough

These states are not considered complete:

- `@hermes/dashboard-kit` exists in `package.json`, but the route does not render kit components.
- A static HTML route links `hermes-dashboard-kit.css`, but the shell/sidebar/cards/tables remain local.
- A runtime bridge injects HDK-looking markup while the actual route stays local and one-off.
- A route is visually redesigned without passing screenshot proof for desktop, mobile, overflow, and core workflow states.

## Completion Definition

A dashboard is package-native by implementation when:

- The operator route imports or renders HDK primitives directly.
- The route manifest marks the primary surface as package-native.
- No primary navigation depends on a static compatibility route.
- Local CSS is limited to domain-specific variants.
- Production serves HDK tokens/components or a protected authenticated equivalent.
- Visual proof confirms spacing, sidebar, table containment, chart readability, and state behavior.

## Custom Component Policy

Custom components are allowed when they are domain-specific.

Allowed examples:

- Trading terminal chart overlays
- Media QA approval queue
- Meal planning calendar cells
- OKR dependency graph
- Market browser opportunity lane

Not allowed as local one-offs:

- Sidebar
- Shell
- Card spacing
- Table pagination
- Generic chart frames
- Auth/session placement
- Theme mode handling
- Loading/error/empty state layout

## Required Audit

Run this from `projects/nous-hermes-agent` before promotion:

```bash
npm run dashboard:hdk-first:audit
```

Strict promotion gate:

```bash
npm run dashboard:hdk-first:audit:strict
```

Outputs:

- `docs/fleet/hdk-first-fleet-audit.json`
- `docs/fleet/hdk-first-fleet-audit.md`

The audit checks dependency, manifests, implementation markers, raw/static route debt, local styling drift, and production delivery.
