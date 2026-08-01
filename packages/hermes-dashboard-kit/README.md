# Hermes Dashboard Kit

Shared React dashboard primitives for Hermes/TLC operational dashboards.

## Canonical Role

This package is the source of truth for the Hermes/TLC dashboard design system. The machine-readable and human-readable design contract lives in `DESIGN.md`.

Hermes OS should enforce and report adoption of this package. It should not maintain a competing dashboard component system.

## Install From This Workspace

Inside a workspace project:

```json
{
  "dependencies": {
    "@hermes/dashboard-kit": "file:../packages/hermes-dashboard-kit"
  }
}
```

For an external local project before publication:

```json
{
  "dependencies": {
    "@hermes/dashboard-kit": "file:../nous-hermes-agent/packages/hermes-dashboard-kit"
  }
}
```

The consuming app must provide:

- React
- lucide-react
- Tailwind-compatible utility classes
- Hermes/TLC theme tokens or compatible CSS variables
- one shell-level theme mode: `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"`

For static dashboards, use:

```text
packages/hermes-dashboard-kit/static/hermes-dashboard-kit.css
```

See `docs/design/static-dashboard-adapter.md` for the migration class map.

## Theme Modes

The kit exports `dashboardThemeModes` and `dashboardThemeModeCssVariables` for
light, dark, and system mode adoption.

The mode standard lives in:

```text
docs/design/dashboard-theme-mode-standard.md
```

Downstream dashboards should not invent local dark-mode colors. Shells, cards,
tables, drawers, forms, charts, chart axes, tooltips, status pills, and banners
must inherit the `--hdk-*` semantic token layer.

Validate the contract with:

```bash
npm run dashboard:theme-contract:validate
```

## Core Imports

```tsx
import {
  DashboardShell,
  DashboardHeader,
  MetricGrid,
  KpiCard,
  DataTable,
  ChartPanel,
  MarketTape,
  MarketVolatilityDrawer,
  PriceMovementChart,
  OrderBookLadder,
  ForecastConeChart,
  WaterfallChart,
  CommandPalette,
  GlobalSearchOverlay,
  SavedViewsManager,
  LiquidityDepthChart,
  CategoryHeatmap,
  WorkspaceSwitcher,
  BreadcrumbTrail,
  AiAssistantPanel,
  EvidenceStack,
  DashboardLauncher,
  CommandBar,
  DashboardWorkspaceOverview,
  assessDashboardArchitecture,
  assessDashboardPrototypeSet,
  validateDashboardSnapshot,
} from "@hermes/dashboard-kit";
```

## Shared Dashboard Contracts

The package also exports the shared Hermes/TLC dashboard data language:

```tsx
import {
  type DashboardSnapshotContract,
  type DashboardModuleContract,
  HERMES_DASHBOARD_WORKSPACES,
  summarizeDashboardSnapshot,
} from "@hermes/dashboard-kit";
```

Use these contracts before redesigning a dashboard. They define the common vocabulary for data sources, metrics, alerts, activity, cost, health, readiness, and the six shared workspaces: Command, Operations, Intelligence, Capacity, Projects, and Controls.

Use `DashboardPrototypeSet` and `assessDashboardPrototypeSet` before changing a production dashboard. A redesign should compare at least three variants, each tied to operator questions, workspace focus, and explicit data requirements.

Use `validateDashboardSnapshot` when a project exposes `/api/dashboard-architecture`. It catches unclassified workspaces, missing owners, empty data-source declarations, and duplicate module ids.

Use the data-visualization primitives before building local chart UI:

- `MarketTape`
- `MarketVolatilityDrawer`
- `PriceMovementChart`
- `SpreadBandChart`
- `LiquidityDepthChart`
- `VolumePulseChart`
- `CategoryHeatmap`
- `OpportunityMatrix`
- `ProviderSpendTimeline`
- `BusinessUnitCostCard`
- `AlertRail`
- `DrilldownPanel`
- `TimeWindowSelector`
- `CrosshairTooltipFrame`
- `OrderBookLadder`
- `ForecastConeChart`
- `WaterfallChart`
- `VisualizationStateFrame`

These components support real-data, preview, stale, loading, empty, and error states so prototypes can demonstrate intent without pretending mock data is production truth.

Use the product-interface primitives before building local dashboard interaction UI:

- `WorkspaceSwitcher`
- `BreadcrumbTrail`
- `SplitWorkspaceLayout`
- `DetailDrawerShell`
- `EntitySummaryCard`
- `EvidenceStack`
- `RecommendationStack`
- `SavedFilterChips`
- `CommandPalette`
- `GlobalSearchOverlay`
- `SavedViewsManager`
- `ExpandableDataList`
- `AiAssistantPanel`
- `StateChecklist`
- `PermissionLimitedPanel`
- `GeneratedInsightCallout`

See:

- `docs/design/dashboard-data-contracts.md`
- `docs/design/dashboard-information-architecture.md`
- `docs/design/mobbin-reference-workflow.md`
- `docs/design/dashboard-prototype-lab.md`
- `docs/design/dashboard-design-system-spine-plan.md`
- `docs/design/operating-interface-reference-library.json`
- `docs/design/operating-interface-state-coverage.json`
- `docs/design/operating-interface-adoption-score.json`

## Versioning Rule

- `0.x`: internal pre-release package while Khashi VC and Media Engine migrations are underway.
- Patch releases may add components or fix styling.
- Minor releases may add props.
- Breaking changes require a migration note in `CHANGELOG.md`.

## Migration Rule

Do not copy components into a project. Consume the package and extend the package when two or more dashboards need the same behavior.

Static dashboards may use `static/hermes-dashboard-kit.css` as a bridge, but copied CSS must be tracked in `docs/design/dashboard-kit-adoption.json` and checked with:

```bash
npm run dashboard:design-system:status
npm run dashboard:spine:validate
```

## New Dashboard Rule

New Tier 3 dashboard products should not start from static HTML/CSS adapters.
Use the package-native starter instead:

```bash
npm run dashboard:package-native:create -- --project-dir ../new-dashboard --project-id new-dashboard --name "New Dashboard"
```

This creates a React/Vite dashboard that imports `@hermes/dashboard-kit`
directly, declares the theme-mode contract, includes a Mobbin/reference intake,
includes a design-review checklist, creates a local dashboard route registry,
and provides Playwright proof scaffolding.

Starter templates:

- `cockpit`
- `operations-queue`
- `market-browser`
- `content-calendar`
- `cost-command`
- `household-planner`
- `approval-workflow`

Package-native surfaces should also pass:

```bash
npm run dashboard:package-native:surface:validate -- --project-dir ../new-dashboard
npm run dashboard:visual-baseline:capture -- --url http://127.0.0.1:4177 --out proof/dashboard-baseline
```

Static adapters remain useful for existing dashboards that need a bridge, but
they are not the modern UI target.
