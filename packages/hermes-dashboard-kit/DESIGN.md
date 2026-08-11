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
    space_1: "var(--hdk-space-1) / 4px"
    space_2: "var(--hdk-space-2) / 8px"
    space_3: "var(--hdk-space-3) / 12px"
    space_4: "var(--hdk-space-4) / 16px"
    space_5: "var(--hdk-space-5) / 20px"
    space_6: "var(--hdk-space-6) / 24px"
    space_8: "var(--hdk-space-8) / 32px"
    shell: "var(--hdk-space-page-x)"
    sidebar: "var(--hdk-space-4)"
    section: "var(--hdk-space-section)"
    card: "var(--hdk-space-card)"
    grid_gap: "var(--hdk-space-grid)"
  components:
    shell: "DashboardShell / .hdk-shell"
    sidebar: "DashboardSidebar / .hdk-sidebar / .hdk-sidebar-rail"
    header: "DashboardHeader / .hdk-header / .hdk-command-header"
    card: "KpiCard, ChartPanel, DataTable / .hdk-card"
    table: "DataTable, DataTableTabs, Pagination / .hdk-table / .hdk-table-wrap / .hdk-pagination"
    data_visualization: "MarketTape, MarketVolatilityDrawer, PriceMovementChart, SpreadBandChart, LiquidityDepthChart, VolumePulseChart, CategoryHeatmap, OpportunityMatrix, ProviderSpendTimeline, BusinessUnitCostCard, AlertRail, DrilldownPanel, TimeWindowSelector, CrosshairTooltipFrame, OrderBookLadder, ForecastConeChart, WaterfallChart"
    product_interface: "WorkspaceSwitcher, BreadcrumbTrail, SplitWorkspaceLayout, DetailDrawerShell, EntitySummaryCard, EvidenceStack, RecommendationStack, SavedFilterChips, CommandPalette, GlobalSearchOverlay, SavedViewsManager, ExpandableDataList, AiAssistantPanel, StateChecklist, PermissionLimitedPanel, GeneratedInsightCallout, HelpTip, InfoPopover"
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

## Component Gallery And Intake Workflow

Better components are not a background engineering task. They must pass through
a visible intake workflow before they are scaled across Kashi, Media Engine,
Media Business Operations, Meal Assistant, TLC OS, or Hermes OS.

The canonical review surface is generated by:

```bash
npm run dashboard:design-system:gallery
```

That command writes:

- `docs/design/dashboard-kit-gallery.html`
- `docs/design/dashboard-kit-gallery-report.json`
- `docs/design/dashboard-kit-gallery-report.md`

The gallery must show:

- Mobbin/reference families used as pattern input.
- Component families, named components, target tier, and status.
- A Level 5 maturity graph for each component family.
- What makes each family good enough for Tier 3.
- The human operator's approval role for that family.
- Preview examples for charts, tables, proof states, and state handling.

Level 5 is an evidence state, not an aesthetic claim. A family reaches Level 5
only when the review registry shows production-quality scores for:

- visual polish
- interaction completeness
- state coverage
- domain intelligence
- adoption readiness

The gallery renders the maturity graph from
`adoption/component-review-registry.json`. If the graph shows a family below
Level 5, the correct next move is to improve the component or adoption proof,
not to relabel the family as complete.

Component family statuses:

| Status | Meaning |
| --- | --- |
| `draft` | Known pattern exists, but visual/product quality is not approved. Do not scale without explicit exception. |
| `reviewing` | Usable for focused implementation, but needs human review before fleet rollout. |
| `approved` | Safe for Tier 3 dashboard migrations. |
| `needs-redesign` | Do not reuse. Replace or redesign before migration. |
| `deprecated` | Compatibility only. Remove from primary dashboards. |

Human alignment should happen at the component-family level first. If a user
rejects a chart, table, sidebar, calendar, drawer, or approval-flow pattern in
the gallery, projects must not keep rebuilding that same rejected pattern in
local CSS.

Project dashboards should only claim Tier 3 when their required component
families are `approved` or when a project manifest records a reviewed exception
with owner, reviewer, reason, and expiry.

Premium component families currently available for Level 5 review include:

- `ComponentQualityMaturityGraph`
- `PremiumComparisonChart`
- `PremiumMarketBrowser`
- `PremiumMediaApprovalWorkspace`
- `PremiumPlannerCalendar`
- `PremiumDrilldownWorkspace`

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
- Tier 3 tables with more than 10 rows must paginate. Default visible rows must be 10, with 10 / 25 / 50 page-size controls. Pagination controls must stay inside the table surface and use `DataTable`, `DataTableTabs`, `Pagination`, `.hdk-table-wrap`, and `.hdk-pagination` markers.
- Tier 3 table pages must use one active table title aligned with the tab controls when switching between evidence tables. Do not add explanatory headings such as "review one table at a time" above the table when the tab labels already define the surface.
- Tier 3 sortable tables must use a quiet table toolbar for sorting and comparison controls. Put row count, `Sort by`, order, filter, and export controls in the card/header toolbar. Do not repeat visible "sort" controls beside every column header on dense operational tables. Header sorting is allowed only when it is icon-only, accessible, and visually subordinate.
- Tier 3 metric-comparison surfaces should convert repeated metric cards into a sortable evidence table when there are more than six comparable entities or when the operator needs to compare by a data point. The table should sit in one card, include a row-count badge, and expose deterministic sort values for each sortable metric.
- Tier 3 layout spacing must use the dashboard-kit spacing scale: `--hdk-space-1` through `--hdk-space-8`, `--hdk-space-page-x`, `--hdk-space-section`, `--hdk-space-card`, and `--hdk-space-grid`. Page layouts own section-to-section spacing; components own their internal padding. Project CSS must not introduce one-off gutters such as `gap: 14px`, arbitrary card padding, or uneven top/side spacing without a manifest exception.
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
6. Help affordance quality: secondary explanations must use `HelpTip` or `InfoPopover` instead of repeated visible helper paragraphs. Critical blockers, errors, statuses, and required instructions must remain visible and must not be hidden in help text.
7. Table toolbar quality: sortable operational tables must put sort/filter/page controls in a card-level toolbar. The toolbar must keep the table title, tabs, row-count badge, sort key, and sort direction visually aligned instead of scattering controls across every header cell.

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
- Analysis pages that include time-series or comparison decisions should place the chart or trend panel before the raw evidence table. The table is evidence; the chart is the decision surface. Raw queues, brand activity, approval evidence, market tapes, and issue logs should not be the first or only visual when the same data has a meaningful time basis.
- Chart controls must be scoped to the chart card: time window, grouping, metric/state toggles, brand/entity selector, and comparison controls belong in the chart header or control rail. Avoid page-global controls that change unrelated tables without visible context.
- Multi-series comparisons must provide a visible legend, bounded series count, and readable contrast. If the operator can select all brands/states/metrics, the chart must handle dense legends through wrapping, scrolling, grouping, or an explicit "top N plus selected" rule.
- Mini sparklines are allowed only inside metric cards as secondary micro-trends. They cannot replace an axis-bearing `ChartPanel` for the main dashboard view.
- Empty, partial, stale, loading, error, and mock-preview chart states must be visibly different from live chart states.
- Mobbin reference passes should inspect analytics/trading/reporting screens for chart density, legend placement, axis treatment, compact cards, and table/chart pairing before creating new chart patterns.

## Loading And Data Performance Contract

Dashboards must load like products, not scripts dumping a full report into the browser. The canonical implementation and review checklist live in `docs/design/dashboard-loading-performance-standard.md`.

- Render the single app shell first, then hydrate proof/freshness/KPI data, then hydrate bounded tables and charts, then defer raw logs and expensive drilldowns.
- Every route must tell the operator whether data is `loading`, `ready`, `partial`, `stale`, `error`, or `empty`.
- Use `DashboardLoadingShell`, `SkeletonMetricCard`, `SkeletonChart`, `SkeletonTable`, `SkeletonDashboardGrid`, `DataFreshnessStrip`, `StaleDataBadge`, `PartialDataBanner`, and `DashboardQueryBoundary` before creating local loading UI.
- Tables must be paginated by default. Default page size is 10 with 10 / 25 / 50 controls. Initial route payloads should not ship more than 100 visible rows without an approved exception.
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
- Use `HelpTip` for short secondary context and `InfoPopover` for richer context. Help controls should sit beside section titles, metric labels, chart titles, table column headers, or form labels. They must be keyboard reachable, tap-safe on mobile, and use the shared `.hdk-help` / `.hdk-info-popover` styles. Do not create local `?` buttons, random tooltip CSS, or long visible helper paragraphs on Tier 3 pages.
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
