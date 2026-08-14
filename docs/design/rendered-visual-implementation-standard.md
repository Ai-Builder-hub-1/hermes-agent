# Rendered Visual Implementation Standard

Version: V1

This standard closes the gap between "the project imports `@hermes/dashboard-kit`" and "the visible dashboard actually uses the shared system."

## Completion Rule

A dashboard is not component-native by implementation until the production route is visibly rendered through dashboard-kit primitives.

Package installation, copied CSS, hidden markers, or manifest claims are not enough.

## Required Layers

1. Shell layer
   - Use the dashboard-kit shell, sidebar, header, and page frame.
   - Do not ship nested shells, duplicate sidebars, or standalone prototype routes as the primary operator path.

2. Layout rhythm layer
   - Use `hdk-page-frame`, `hdk-page`, `hdk-route`, `hdk-section-stack`, and `hdk-section-grid`.
   - Cards, tables, forms, charts, drawers, and proof strips must share one spacing scale.

3. Component ownership layer
   - Use kit cards, metric cards, state panels, tables, charts, drawers, forms, proof strips, and loading/freshness states when the kit provides them.
   - Local components are only allowed as domain accents or declared exceptions.

4. Missing component layer
   - If a project needs a component the kit does not have, build or adopt the component in `@hermes/dashboard-kit` first.
   - Do not create a one-off local version and call the project complete.

5. Rendered proof layer
   - Capture desktop, collapsed-sidebar, mobile, and key route screenshots.
   - Screenshots must show no clipped text, no hidden card stacks, no card overflow, no duplicate shells, and no hand-drawn chart substitutes.

6. Promotion layer
   - Tier 3C requires passing package-native audit, rendered implementation audit, component-native audit, visual proof, and project tests.
   - Any static, bridge, compatibility, or local-primitive note keeps the project stale until the actual route is migrated.

## Deprecated Primary Patterns

- Local `.sidebar`, `.topbar`, `.card`, `.panel`, `.table`, or `.chart` systems controlling the main dashboard.
- Standalone HTML apps embedded inside another shell.
- Static route pages as production primary paths.
- Project-specific spacing systems that bypass `--hdk-space-*`.
- Project-specific charts when approved chart primitives exist.
- Project-specific forms/drawers when approved workflow primitives exist.

## Enforcement Commands

- `npm run dashboard-kit:component-native:report`
- `npm run dashboard:rendered-implementation:report`
- `npm run dashboard:standards:validate-all`
- `npm run dashboard:standards:validate-all:strict`

## Migration Order

1. Replace shell/sidebar/header.
2. Replace page frame and section rhythm.
3. Replace metrics/cards/states.
4. Replace tables and pagination.
5. Replace charts and chart contracts.
6. Replace forms/drawers/workflow panels.
7. Capture visual proof.
8. Remove stale bridge/static/local notes from manifests only after proof passes.
