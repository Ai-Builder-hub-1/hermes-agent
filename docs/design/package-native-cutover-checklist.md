# Package-Native Cutover Checklist

Use this checklist when moving a dashboard from static adapter, hybrid, or
server-rendered legacy delivery into `@hermes/dashboard-kit`.

- Register the dashboard in `packages/hermes-dashboard-kit/adoption/registry.json`.
- Confirm `.hermes-dashboard.json` declares target Tier 3C when product-grade cockpit delivery is expected.
- Create or update the package-native surface with `npm run dashboard:package-native:create`.
- Import `DashboardShell`, `DashboardSidebar`, `DashboardHeader`, charts, tables, states, and proof components from `@hermes/dashboard-kit`.
- Satisfy the Tier 3 operational sidebar standard.
- Add Mobbin/reference intake and design review artifacts.
- Declare health, snapshot, and proof endpoints in `hermes.dashboards.json`.
- Capture desktop expanded, desktop collapsed, and mobile visual baselines.
- Run package-native surface validation, rendered audit, visual quality score, accessibility route matrix, and adoption audit.
- Cut over the canonical production route only after proof and rollback are documented.
