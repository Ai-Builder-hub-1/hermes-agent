---
name: Hermes Dashboard Kit
version: 0.1.0
source_package: "@hermes/dashboard-kit"
source_css: "packages/hermes-dashboard-kit/static/hermes-dashboard-kit.css"
tokens:
  colors:
    background: "var(--hdk-bg)"
    surface: "var(--hdk-card)"
    surface_muted: "var(--hdk-card-muted)"
    border: "var(--hdk-border)"
    border_strong: "var(--hdk-border-strong)"
    text: "var(--hdk-text)"
    muted_text: "var(--hdk-muted)"
    primary: "var(--hdk-primary)"
    primary_soft: "var(--hdk-primary-soft)"
    success: "var(--hdk-success)"
    success_soft: "var(--hdk-success-soft)"
    warning: "var(--hdk-warning)"
    warning_soft: "var(--hdk-warning-soft)"
    critical: "var(--hdk-critical)"
    critical_soft: "var(--hdk-critical-soft)"
    surface_page: "var(--hdk-bg)"
    surface_panel: "var(--hdk-card)"
    surface_panel_muted: "var(--hdk-card-muted)"
    surface_panel_strong: "var(--hdk-panel-strong)"
    surface_inset: "var(--hdk-inset)"
    text_primary: "var(--hdk-text)"
    text_secondary: "var(--hdk-text-secondary)"
    text_inverse: "var(--hdk-inverse)"
    focus_ring: "var(--hdk-focus)"
    chart_axis: "var(--hdk-chart-axis)"
    chart_grid: "var(--hdk-chart-grid)"
    chart_tooltip_bg: "var(--hdk-chart-tooltip-bg)"
    chart_tooltip_text: "var(--hdk-chart-tooltip-text)"
  typography:
    font_family: "var(--hdk-font)"
    card_label: "12px"
    metric_value: "28px"
    table_header: "11px"
  radius:
    default: "var(--hdk-radius)"
    control: "6px"
  spacing:
    shell: "18px"
    sidebar: "14px"
    section: "16px"
    card: "14px"
    grid_gap: "12px"
  components:
    shell: "DashboardShell / .hdk-shell"
    sidebar: "DashboardSidebar / .hdk-sidebar / .hdk-sidebar-rail"
    header: "DashboardHeader / .hdk-header / .hdk-command-header"
    card: "KpiCard, ChartPanel, DataTable / .hdk-card"
    table: "DataTable / .hdk-table"
    data_visualization: "MarketTape, MarketVolatilityDrawer, PriceMovementChart, SpreadBandChart, LiquidityDepthChart, VolumePulseChart, CategoryHeatmap, OpportunityMatrix, ProviderSpendTimeline, BusinessUnitCostCard, AlertRail, DrilldownPanel, TimeWindowSelector, CrosshairTooltipFrame, OrderBookLadder, ForecastConeChart, WaterfallChart"
    product_interface: "WorkspaceSwitcher, BreadcrumbTrail, SplitWorkspaceLayout, DetailDrawerShell, EntitySummaryCard, EvidenceStack, RecommendationStack, SavedFilterChips, CommandPalette, GlobalSearchOverlay, SavedViewsManager, ExpandableDataList, AiAssistantPanel, StateChecklist, PermissionLimitedPanel, GeneratedInsightCallout"
    loading_performance: "DashboardLoadingShell, SkeletonMetricCard, SkeletonChart, SkeletonTable, SkeletonDashboardGrid, DataFreshnessStrip, StaleDataBadge, PartialDataBanner, DashboardQueryBoundary"
    button: "Command buttons / .hdk-button"
    status: "StatusPill / .hdk-pill"
---

# Hermes Dashboard Kit

This file is the machine-readable and human-readable design contract for Hermes/TLC operational dashboards. It follows the same intent as Google Labs `design.md`: keep a persistent design-system description that coding agents can read before creating UI.

## Product Intent

Hermes dashboards are operating surfaces, not landing pages. They should help a human operator understand business state, risk, cost, work queues, experiments, automation, and decisions quickly.

The interface should be compact, scannable, and evidence-oriented. It should avoid decorative layouts that make dashboards look modern while reducing operational clarity.

## Information Architecture

All Hermes/TLC operational dashboards should collapse into six workspaces:

| Workspace | Question |
| --- | --- |
| Command | What needs attention now? |
| Operations | What is running, blocked, stale, expensive, or failing? |
| Intelligence | What have we learned? |
| Capacity | What are we spending, consuming, scanning, generating, or storing? |
| Projects | How is each business unit doing? |
| Controls | What can I start, stop, approve, tune, or deploy? |

If a dashboard has a long sidebar, agents should first map the existing pages into these workspaces before adding more tabs.

## Source Of Truth

The canonical implementation lives in `packages/hermes-dashboard-kit`.

Dashboard products must consume `@hermes/dashboard-kit` directly in their
production dashboard route. Static dashboards may consume or sync from
`packages/hermes-dashboard-kit/static/hermes-dashboard-kit.css` only as a
temporary migration bridge until they are migrated to package-native React or an
approved package-native component frontend.

Hermes OS governs enforcement and adoption. It does not own a competing design-system implementation.

Dashboard products must be package-native. Static adapters are a temporary
bridge for existing dashboards, compatibility routes, and dev review; they are
not a completion state. Use
`docs/design/package-native-dashboard-starter-standard.md` and
`npm run dashboard:package-native:create` before creating a new dashboard
project.

## Layout Rules

- Use a stable left-navigation plus main-workspace shell for operational dashboards.
- Each dashboard product must have exactly one production app shell: one primary sidebar/top nav, one auth surface, one global header region, and one route model.
- Do not nest production app shells. Page content, embedded routes, iframes, and promoted prototypes must not bring their own sidebar, global nav, app title bar, login form, or dashboard switcher unless explicitly marked standalone/dev-only.
- When a prototype becomes production, decompose it into shell-level layout, page content, reusable components, and route config. Do not ship a full standalone prototype app inside another dashboard shell.
- Keep compatibility routes only as redirects, legacy links, or dev review pages. The primary operator path must use the canonical dashboard route declared by the route registry.
- Use dense metric grids, tables, charts, and insight panels.
- Do not use marketing heroes, oversized card stacks, or decorative page backgrounds in dashboard views.
- Tier 3 dashboards must use a real app-navigation rail, not a loose card stack. The sidebar should be visually persistent, width-bounded, text-safe, scroll-safe, and collapse to an explicit top navigation or drawer on small screens.
- Tier 3 dashboards must satisfy `docs/design/dashboard-operational-navigation-standard.md`: brand block, grouped navigation, active state, collapsed labels, footer/status area, text safety, keyboard states, mobile behavior, and expanded/collapsed/mobile proof.
- Tier 3 dashboards must use a compact command header, not a fat hero/banner. The header should answer the current page question, expose a small number of actions/filters, and keep summary metrics in a constrained grid below or beside the title.
- Global decision/output banners belong only on the canonical command center, overview, or home route. They must not repeat above every page in a routed dashboard. Secondary pages should use compact page headings and page-specific controls instead.
- Command/overview banners must align to the same content width and inset as the page components below them. Do not use a narrower shell-level banner that floats out of line with cockpit cards, tables, charts, or proof panels.
- Tier 3 dashboards must use a single viewport shell on desktop: the app shell owns `100dvh`, the sidebar and content column share the same visual height, the document body does not become the primary scroll surface, and the main content pane is the only vertical scroll owner. Mobile may switch back to normal document scrolling.
- Tier 3 dashboards must not redefine kit-owned visual primitives locally. Project CSS may compose page regions, but selectors such as `.hdk-*`, `.shell`, `.sidebar`, `.topbar`, `.command-header`, `.card`, `.metric`, `.table`, `.chart`, `.drawer`, `.button`, `.calendar`, and protected theme tokens require a manifest exception with owner, reviewer, reason, and expiry.
- Tier 3 dashboards with multiple evidence tables in one view must use a table composition pattern: table tabs, accordions, or full-width stacked sections. Do not place two large data tables side-by-side in a two-column grid. Tables should consume the page width and own their horizontal scroll inside `.hdk-table-wrap`.
- Banners inside dashboard pages are allowed only for alerts, proof states, or onboarding empty states. They must not become the primary layout container and must not push the real workspace below the fold.
- Do not nest cards inside cards.
- Cards, pills, table cells, nav labels, and action buttons must be text-safe. Long IDs, URLs, run names, titles, and recommendations must truncate or wrap inside their parent; they must not stretch cards, overflow the viewport, or cover adjacent controls.
- Preserve stable dimensions for KPI cards, tables, charts, buttons, tabs, and status controls.
- Tier 3 dashboard verification should capture at least desktop-expanded, desktop-collapsed, and mobile screenshots for the primary route. Verification must check for horizontal document overflow, clipped nav, card text overflow, table containment, and visible proof/error/empty states.
- Mobile layouts must keep the primary workflow usable before secondary analytics.

## Sidebar And Header Contract

The shell standard has two visible quality gates:

1. Navigation rail quality: a production sidebar must use `DashboardSidebar`, `.hdk-sidebar`, or `.hdk-sidebar-rail`; include a brand mark/block, grouped navigation, active route state, collapsed labels, footer/status context, mobile behavior, and text-safe labels. A plain list of buttons is not Tier 3.
2. Viewport shell quality: a desktop dashboard must have exactly one vertical scroll owner inside the app shell. The shell should be `100dvh`, the sidebar should not visually stop before the content, and raw body/page scrolling should not expose blank shell edges.
3. Table layout quality: large data tables must use `.hdk-table-wrap` inside full-width table sections, tabs, or stacked table groups. Avoid putting two raw tables next to each other.
4. Text containment quality: cards, tables, pills, buttons, and nav items must include overflow-safe wrapping or truncation so screenshots do not show content leaking outside containers.
5. Command header quality: a production page header must use `DashboardHeader`, `.hdk-header`, or `.hdk-command-header`; keep heading copy concise; avoid stacked marketing copy; and place metrics/actions in a compact, responsive layout.

If a dashboard cannot satisfy these gates, it cannot be considered Tier 3 even when it has one shell.

## Chart And Comparison Contract

Charts are decision surfaces, not decoration. A chart is not production-grade unless it makes the comparison, unit, and time basis obvious without the operator guessing.

- Every production chart must declare its type and data contract in markup or component props:
  - `data-chart-type` or component equivalent.
  - For axis charts: `data-x-axis`, `data-x-axis-label`, `data-y-axis`, and `data-y-axis-label`.
  - For part-to-whole charts: `data-dimension` and `data-measure`.
- Line and area charts require a visible X axis and Y axis with readable tick labels. A line chart with only a floating path is a sparkline, not a primary chart.
- Time-series charts should put time on the X axis and the measured unit on the Y axis: dollars, count, percent, rate, seconds, bytes/GB, or another explicit unit.
- Bar and column charts should be used for category comparisons, issue counts, provider spend, channel distribution, and ranked comparisons.
- Donut/ring charts should be used only for simple part-to-whole mixes with a small number of segments and a clear total. Do not use a donut when ranking or precise comparison matters.
- Heatmaps and matrices should be used for cross-category comparisons, calendar/time bucket intensity, market/category pressure, and opportunity maps.
- Scatter and bubble charts should be used for correlation or opportunity comparisons, such as cost versus output, liquidity versus volatility, or quality versus volume.
- Stacked bars or stacked areas should be used when the operator needs composition over time.
- Waterfall charts should be used when explaining drivers of change between two totals.
- Comparison charts must use a common scale and visible legend. Do not compare lines, bars, or rings with hidden or inconsistent units.
- Mini sparklines are allowed only inside metric cards as secondary micro-trends. They cannot replace an axis-bearing `ChartPanel` for the main dashboard view.
- Empty, partial, stale, loading, error, and mock-preview chart states must be visibly different from live chart states.
- Mobbin reference passes should inspect analytics/trading/reporting screens for chart density, legend placement, axis treatment, compact cards, and table/chart pairing before creating new chart patterns.

## Loading And Data Performance Contract

Dashboards must load like products, not scripts dumping a full report into the browser. The canonical implementation and review checklist live in `docs/design/dashboard-loading-performance-standard.md`.

- Render the single app shell first, then hydrate proof/freshness/KPI data, then hydrate bounded tables and charts, then defer raw logs and expensive drilldowns.
- Every route must tell the operator whether data is `loading`, `ready`, `partial`, `stale`, `error`, or `empty`.
- Use `DashboardLoadingShell`, `SkeletonMetricCard`, `SkeletonChart`, `SkeletonTable`, `SkeletonDashboardGrid`, `DataFreshnessStrip`, `StaleDataBadge`, `PartialDataBanner`, and `DashboardQueryBoundary` before creating local loading UI.
- Tables must be paginated by default. Default page size is 25; initial route payloads should not ship more than 100 visible rows without an approved exception.
- Charts should hydrate from pre-shaped series or rollups, not from raw event logs recomputed in the browser.
- Dashboard APIs should use stale-while-revalidate behavior: fast cached response, visible stale badge, partial state for module-level failure, and error state only when the primary view cannot be trusted.
- Tier 3 dashboard proof must include visible loading/skeleton, stale, partial, empty, and error states for at least one primary route or state lab.
- Raw event/log payloads, large JSON blobs, and export data must be deferred behind explicit user intent or idle hydration.

## Experience Tier Standard

The one-shell rule is a checkpoint, not the finish line. A dashboard can be structurally correct and still fail the product experience bar.

Every governed dashboard must declare a current and target experience tier:

| Tier | Name | Meaning | Completion Bar |
| --- | --- | --- | --- |
| `0` | Raw legacy report | Static report output, raw tables, or prototype pages with little product framing. | Allowed only as legacy/debug evidence. Not production complete. |
| `1` | One-shell organized report | One shell, one navigation model, and grouped report sections. | Passes structure only. Not product-grade. |
| `2` | Shared component dashboard | Uses dashboard-kit cards, tables, charts, filters, drawers, states, and route contracts for the main operator path. | Suitable for production review when states and proof routes are present. |
| `3` | Product-grade cockpit | Purpose-built cockpit with drilldowns, chartable/live data, proof states, polished interaction, clear operator decisions, and no raw-report primary surfaces. | Target completion tier for priority dashboards. |

Priority dashboards should target Tier 3 unless a documented exception sets a lower target. A Tier 1 migration must not be marked complete when the operator intent requires Tier 3.
Tier 3 requires explicit sidebar rail evidence and compact command-header evidence in addition to shared components, drilldowns, charts, proof states, and polished interaction.

## Component Rules

- Use `DashboardShell`, `DashboardHeader`, `MetricGrid`, `KpiCard`, `DataTable`, `ChartPanel`, and status primitives before creating local UI.
- Use the data-visualization primitives (`MarketTape`, `MarketVolatilityDrawer`, `PriceMovementChart`, `SpreadBandChart`, `LiquidityDepthChart`, `VolumePulseChart`, `CategoryHeatmap`, `OpportunityMatrix`, `ProviderSpendTimeline`, `BusinessUnitCostCard`, `AlertRail`, `DrilldownPanel`, `TimeWindowSelector`, `CrosshairTooltipFrame`, `OrderBookLadder`, `ForecastConeChart`, `WaterfallChart`, and preview/empty/error states) before creating one-off chart surfaces.
- Use the product-interface primitives (`WorkspaceSwitcher`, `BreadcrumbTrail`, `SplitWorkspaceLayout`, `DetailDrawerShell`, `EntitySummaryCard`, `EvidenceStack`, `RecommendationStack`, `SavedFilterChips`, `CommandPalette`, `GlobalSearchOverlay`, `SavedViewsManager`, `ExpandableDataList`, `AiAssistantPanel`, `StateChecklist`, `PermissionLimitedPanel`, and `GeneratedInsightCallout`) before creating local navigation, drilldown, evidence, AI-assist, search, saved-view, expandable-list, or state-review UI.
- Use `DashboardSnapshotContract`, `DashboardModuleContract`, `HERMES_DASHBOARD_WORKSPACES`, and `DashboardWorkspaceOverview` when a dashboard needs to report or audit its own structure.
- Use `DashboardPrototypeSet` before production redesigns that need Mobbin references or multiple layout directions.
- Use `validateDashboardSnapshot` before treating `/api/dashboard-architecture` output as trustworthy.
- Extend the kit when two or more dashboards need the same pattern.
- Keep local components only when they represent project-specific behavior or data.
- Icon-only controls require accessible names.
- Dangerous actions require explicit confirmation.

## Visual Rules

- Use the `--hdk-*` token layer or compatible app-level variables.
- Every production dashboard must declare one shell-level theme mode: `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"`.
- Light and dark modes must use the semantic theme contract in `docs/design/dashboard-theme-mode-standard.md`; local components must not invent separate dark or light palettes.
- Dark surfaces require `--hdk-text`, `--hdk-muted`, or an approved inverse pairing. Light surfaces require the same token family. Do not mix dark cards with dark text or light cards with light text.
- Charts must inherit `--hdk-chart-axis`, `--hdk-chart-grid`, `--hdk-chart-tooltip-bg`, `--hdk-chart-tooltip-text`, and series tokens. Chart axes, labels, legends, and tooltips are not allowed to hardcode black/white/gray.
- Theme QA must capture light and dark screenshots for Tier 3 dashboards when the product supports both modes.
- Status color is semantic: success, warning, critical, neutral, unknown.
- Border radius should stay at `8px` or below unless the kit changes the token.
- Do not use one-off gradients, decorative blobs, or viewport-scaled typography.
- Letter spacing should remain normal.

## Agent Rules

Before building or changing a dashboard, agents should:

1. Read this `DESIGN.md`.
2. Read `docs/design/hermes-dashboard-design-contract.md`.
3. Check `docs/design/dashboard-kit-adoption.md`.
4. Define or update the dashboard data contracts in `docs/design/dashboard-data-contracts.md`.
5. Read `docs/design/dashboard-theme-mode-standard.md` before changing color, chart, shell, card, table, drawer, or form styling.
6. Read `docs/design/dashboard-loading-performance-standard.md` before changing route data loading, tables, charts, proof states, cache behavior, or dashboard APIs.
7. For every production dashboard, read `docs/design/package-native-dashboard-starter-standard.md` and use package-native scaffolding instead of static adapters.
8. Map the dashboard into the six-workspace information architecture.
9. Declare the canonical route and confirm there is one production app shell.
10. Use Mobbin references only after the data model and operating questions are understood.
11. Prefer package primitives. Use the static adapter only for legacy bridge work.
12. Update adoption status when a dashboard imports `@hermes/dashboard-kit` directly and moves closer to package-native usage.
13. Run `npm run dashboard:spine:validate` from the Hermes agent project after changing adoption metadata or dashboard spine docs.
14. Run `npm run dashboard-kit:adoption:audit` when a downstream dashboard claims it has adopted the kit.
14. Run `npm run dashboard:package-native:validate` after changing package-native dashboard starter standards.
15. Run `npm run dashboard:package-native:surface:validate -- --project-dir <project>` before calling a Tier 3 package-native dashboard complete.
16. Capture a visual baseline with `npm run dashboard:visual-baseline:capture -- --url <local-or-proof-url>` before production approval.
17. Run `npm run dashboard:local-overrides:scan` before project redesign work and `npm run dashboard:local-overrides:validate` before Tier 3 promotion.

For Kaoshi-grade redesign work, agents should also read:

- `docs/design/kaoshi-experience-architecture-comparison.md`
- `docs/design/kaoshi-experience-architecture-build-plan.md`
- `docs/design/kaoshi-experience-architecture-gap-register.json`
- `docs/design/kaoshi-experience-contract-standard.md`
- `docs/design/kaoshi-visualization-decision-system.md`
- `docs/design/kaoshi-live-data-reference-capability.md`
- `docs/design/dashboard-governance-and-enforcement.md`
- `docs/design/dashboard-admission-rfc-template.md`

These files extend ordinary dashboard-kit adoption into a full experience-architecture audit: repository evidence, capability inventory, feature traces, cross-layer contracts, dependency ordering, proof endpoints, visual QA, and downstream adoption gates.

Run `npm run dashboard:kaoshi:validate` after changing Kaoshi experience-architecture artifacts.
Run `npm run dashboard:governance:validate` after changing dashboard governance gates, admission templates, proof requirements, surface ownership, reviewers, or exceptions.

## Research And Adoption Registries

The operating interface system is backed by:

- `docs/design/operating-interface-reference-library.json` for Mobbin-informed pattern research.
- `docs/design/operating-interface-system-registry.json` for canonical families and shared components.
- `docs/design/operating-interface-state-coverage.json` for ready/loading/empty/error/stale/preview/permission-limited/partial coverage.
- `docs/design/operating-interface-adoption-score.json` for project adoption scoring.
- `docs/design/operating-interface-visual-qa.md` for visual QA expectations.
- `packages/hermes-dashboard-kit/adoption/registry.json` plus downstream `.hermes-dashboard.json` manifests for executable project/surface adoption checks.
