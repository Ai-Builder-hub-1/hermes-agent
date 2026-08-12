# Dashboard Design Debt Report

Generated: 2026-08-12T14:40:10.702Z

Status: pass

Active debt: 0
Expired debt: 0
Blocking debt: 0
Deprecated patterns: 4

## Active Debt

| ID | Scope | Owner | Impact | Expires | Replacement |
| --- | --- | --- | --- | --- | --- |
| none | - | - | - | - | No active design debt. |

## Deprecated Patterns

| ID | Scope | Replacement | Enforced |
| --- | --- | --- | --- |
| production-static-dashboard-route | production navigation, Tier 3 routes | package-native route composed with @hermes/dashboard-kit | 2026-08-12 |
| hand-drawn-primary-chart | Tier 3 charts, market/trading dashboards, analytics dashboards | approved chart/domain wrapper from @hermes/dashboard-kit | 2026-08-12 |
| fat-default-banner | Tier 3 command pages | compact DashboardHeader plus proof/action strips only when needed | 2026-08-12 |
| local-protected-visual-override | downstream project CSS | dashboard-kit token or component variant | 2026-08-12 |
