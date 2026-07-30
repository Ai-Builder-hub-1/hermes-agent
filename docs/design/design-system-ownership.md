# Hermes Dashboard Design System Ownership

## Decision

`@hermes/dashboard-kit` in `projects/nous-hermes-agent/packages/hermes-dashboard-kit` is the canonical dashboard design-system implementation.

Hermes OS is the governance and enforcement layer. It should reference the kit, validate adoption, and report dashboard quality, but it should not maintain a competing set of dashboard components.

## Why This Split Exists

Nous Hermes Agent is the agent/runtime layer where shared agent-facing product capabilities live. The dashboard kit belongs there because it is the reusable package that Codex, Hermes, and project dashboards can consume.

Hermes OS is the control plane. It should answer whether projects are following the design system, which dashboards are drifted, and what needs migration next.

## Responsibilities

| Area | Owner | Notes |
| --- | --- | --- |
| React components | Nous Hermes Agent `@hermes/dashboard-kit` | Package-native source of truth. |
| Static dashboard CSS adapter | Nous Hermes Agent `packages/hermes-dashboard-kit/static` | Temporary bridge for non-React dashboards. |
| Design contract | Nous Hermes Agent `DESIGN.md` and `docs/design` | Rules agents must read before dashboard work. |
| Adapter registry | Nous Hermes Agent `docs/design/dashboard-kit-adoption.json` | Tracks copied CSS adapters and sync state. |
| Adoption registry | Nous Hermes Agent `packages/hermes-dashboard-kit/adoption/registry.json` plus project `.hermes-dashboard.json` manifests | Tracks which surfaces consume the kit, which components are required, and which local legacy patterns remain. |
| Enforcement and reporting | Hermes OS | Uses registry/status output to report maturity and drift. |
| Project-specific UX | Each project | Allowed when behavior is domain-specific and not reusable. |

## Cleanup Rule

When a dashboard uses copied CSS, it must be listed in the adoption registry. Copied CSS is acceptable only as an adapter phase. The target state is package-native consumption for React dashboards and controlled sync for static dashboards.

CSS sync is the minimum bar, not proof of visual adoption. A dashboard can be CSS-synced and still stale if a surface renders local chart, drawer, table, navigation, or state logic where a shared kit primitive exists.

Run:

```bash
npm run dashboard-kit:adoption:audit
```

Use strict mode when a release should fail on stale surfaces:

```bash
npm run dashboard-kit:adoption:audit:strict
```
