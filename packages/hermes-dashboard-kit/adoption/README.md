# Dashboard Kit Adoption Registry

This folder is the executable adoption layer for `@hermes/dashboard-kit`.

The older dashboard adoption registry in `docs/design/dashboard-kit-adoption.json` answers whether copied CSS adapters are synced. This registry answers the more important question: whether each project surface is actually using the shared dashboard system instead of local one-off UI.

## Files

- `registry.json` lists downstream projects, local manifest paths, static adapter targets, required surfaces, and legacy patterns that should be flagged.
- `project-schema.json` documents the shape of each downstream `.hermes-dashboard.json` manifest.
- `../scripts/audit-adoption.mjs` audits all registered projects or one project.
- `../scripts/sync-project.mjs` syncs the canonical static CSS adapter and records the current hash in the project manifest.
- `../scripts/migrate-surface.mjs` generates a migration plan for a declared project surface.

## Commands

```bash
npm run dashboard-kit:adoption:audit
npm run dashboard-kit:adoption:audit -- --project khashi-vc
npm run dashboard-kit:adoption:audit:strict
npm run dashboard-kit:adoption:sync -- --project khashi-vc
npm run dashboard-kit:adoption:migrate -- --project khashi-vc --surface market-intelligence-live
```

## Rule

A project is not considered visually current just because its copied CSS matches the source adapter. The surface must also declare the shared components it is expected to use and must not keep local legacy chart/rendering patterns unless a temporary exception is documented.
