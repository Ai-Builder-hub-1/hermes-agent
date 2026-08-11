# Dashboard Kit Gallery Report

Generated: 2026-08-08T21:55:50.550Z

Purpose: Visible component intake and approval status for package-native dashboard migrations.

## Summary

| Metric | Value |
| --- | ---: |
| Component families | 9 |
| Named components | 49 |
| Approved families | 9 |
| Reviewing families | 0 |
| Draft families | 0 |
| Central kit review score | 100 |
| Downstream adoption score | 52 |
| Level 5 ready | yes |
| Unresolved kit next actions | 0 |
| Blocked project adoptions | 3 |
| Required visual captures | 45 |

## Visual Baseline Matrix

- Route: `/dashboard-kit-gallery`
- Viewports: desktop 1440x1100, tablet 1024x1000, mobile 390x900
- Themes: light, dark
- Required states: default, loading, empty, stale, error, overflow

- Every approved family must have desktop and mobile light-mode screenshots.
- Dark mode screenshots are required before a project can ship the family in dark mode.
- Primary charts must prove visible axes, labels, legends, units, and nonblank plotted regions.
- Tables must prove one card wrapper, one header, one toolbar, and one pagination footer.
- Shell captures must prove there is one shell and the content pane owns scrolling.

## Human Review Queue

- No pending review items.

## Component Families

| Family | Status | Score | Target | Components | References |
| --- | --- | ---: | --- | --- | --- |
| Core Shell | approved | 100 | tier-3 | DashboardShell, OperationalSidebar, DashboardHeader, ProofStrip, DataFreshnessStrip | Linear, Asana, Vercel |
| Metric And Proof Cards | approved | 100 | tier-3 | MetricCard, StatusPill, StatePanel, StateChecklist, KpiContractTable | Mixpanel, Vercel, Wrike |
| Charts And Comparisons | approved | 100 | tier-3 | LineChart, AreaChart, BarChart, DonutChart, Heatmap, ScatterQuadrantChart, CandlestickChart, AnomalyBandChart | Kraken, OKX, Mixpanel, LangChain |
| Tables And Queues | approved | 100 | tier-3 | DataTable, DataTableTabs, ApprovalQueue, ActionQueue, AlertQueue, WorkOrderQueue | Linear, Asana, Manus, PlanetScale |
| Drawers And Drilldowns | approved | 100 | tier-3 | DetailDrawer, MarketVolatilityDrawer, RunDrilldownPanel, LocationDetailDrawer, BottomSheetDrawer | Coinbase, Jobber, Productboard |
| Market Browser | approved | 100 | tier-3 | MarketExplorerPage, MarketBrowserLayout, MarketTape, OrderBookLadder, TimeWindowSelector | Kraken, Binance, OKX, Coinbase |
| Media Workflow | approved | 100 | tier-3 | ContentPackageWorkspace, BrandPortfolioGrid, ChannelPostabilityMatrix, QaReviewPanel, PublishingProofPanel | Sprout Social, Adobe Express, Manus |
| Calendar And Planning | approved | 100 | tier-3 | MealPlannerCalendar, MealWeekDrawer, ScheduleTimeline, CalendarQueue, MealLibrary | Amie, Motion, Jobber, Time2book |
| Governance And Adoption | approved | 100 | tier-3 | GovernanceChecklist, ReadinessDomainMatrix, DeploymentPromotionPanel, PermissionAuditPanel, ComponentIntakeBoard | Linear, Wrike, Productboard |

## Registry Notes

### Core Shell

- Approved variants: expanded sidebar, collapsed sidebar, mobile drawer, command header, proof strip
- Blocked variants: nested shell, standalone prototype shell, duplicate dashboard switcher
- Notes: Keep one global shell per dashboard product. The main content pane owns vertical scrolling. Collapsed sidebar must preserve icon labels, active route, and project identity.
- Closure evidence: Gallery visual baseline matrix requires expanded, collapsed, mobile drawer, and proof-strip captures. Package-native surface validator and adoption audit enforce single-shell evidence for Tier 3 routes. One-shell, no-nested-shell, route registry, visual-selector dev-only, and overflow-owner rules are documented in dashboard governance.
- Next actions: 

### Metric And Proof Cards

- Approved variants: metric strip, proof strip, state checklist, freshness strip, overflow stress
- Blocked variants: debug telemetry cards, duplicate hero proof banners, unbounded card text
- Notes: Cards must answer an operator question, not expose implementation trivia. Freshness and proof state should live near the metric that depends on it.
- Closure evidence: Visual baseline matrix includes overflow stress, freshness strip, and proof-strip capture requirements. Theme standard requires token-driven light/dark surfaces and flags unsupported hardcoded colors. Metric and proof guidance is now part of the shared card, state checklist, and proof-strip contracts.
- Next actions: 

### Charts And Comparisons

- Approved variants: line, area, bar, donut, heatmap
- Blocked variants: hand-drawn placeholder chart, axisless primary chart, chart without unit labels
- Notes: Primary charts require axes, units, legends, and explicit time windows. Comparison mode must support adding/removing metrics or brands without rebuilding the page. Charts need visual QA because code checks cannot detect an ugly or unreadable chart by themselves.
- Closure evidence: Chart suite exports line, area, bar, donut, heatmap, scatter, candlestick, anomaly, distribution, box, violin, treemap, sunburst, Sankey, and topology variants. Visual baseline approval rules require axes, labels, legends, units, and nonblank plotted regions for primary charts. Component tests cover chart exports and gallery demos expose actual package-rendered chart output.
- Next actions: 

### Tables And Queues

- Approved variants: approval queue, evidence table, comparison table, toolbar sorting, pagination
- Blocked variants: duplicate table headers, two pagination footers, large evidence tables side-by-side
- Notes: Tables sit inside one card with one header, one toolbar, and one pagination footer. Default page size is 10 with 25 and 50 available. Sorting belongs in a toolbar control when many metrics are sortable.
- Closure evidence: Table standard requires one card, one header, one toolbar, and one pagination footer. Component showroom includes queue, comparison, sorting, pagination, and overflow examples. Governance standard now blocks duplicate table headers, duplicate pagination footers, and large evidence tables side-by-side.
- Next actions: 

### Drawers And Drilldowns

- Approved variants: right drawer, market detail, approval detail, issue detail, mobile bottom sheet
- Blocked variants: page jump detail, modal that hides browse context, blank prototype drawer for real data
- Notes: A selected row should open a drilldown without losing the operator's place. Real data surfaces must show not-enough-data, stale, partial, and error states honestly.
- Closure evidence: Drawer contract includes right drawer, market detail, approval detail, issue detail, and mobile bottom-sheet variants. State coverage requires not-enough-data, stale, partial, and error states for real-data drilldowns. Visual baseline matrix requires market-detail, approval-detail, and mobile bottom-sheet captures.
- Next actions: 

### Market Browser

- Approved variants: category browser, sub-category rail, market tape, selected market, stream proof
- Blocked variants: search-first empty browser, default blank selected chart, static market route
- Notes: Browsing should start with category/subcategory discovery, not an empty search field. Streaming and snapshots should be distinguishable but visually connected. The page should explain watched capacity, chartable series, and insufficient snapshots without looking like debug output.
- Closure evidence: Market browser contract now includes category browser, sub-category rail, market tape, selected-market, and stream proof variants. Capacity governor and stream proof expectations are encoded in the market-browser visual baseline matrix and component notes. Kashi production proof capture remains tracked as downstream project readiness, not a central kit blocker.
- Next actions: 

### Media Workflow

- Approved variants: package card, approve/decline, publishable channels, posting proof, Discord handoff
- Blocked variants: package without approval actions, missing publishable channel list, Discord payload without posting result
- Notes: The dashboard and Discord message should agree on approval state, decline reason, publishable destinations, and posting success. Social packages need thumbnail, copy, SEO, channel targets, and proof links in one reviewable unit.
- Closure evidence: Media workflow contract requires package card, approve/decline, publishable channels, posting proof, and Discord handoff variants. Publishing proof states include success, partial, failed, skipped, and unavailable outcomes. Dashboard and Discord payload parity is captured as a component-family acceptance rule.
- Next actions: 

### Calendar And Planning

- Approved variants: month grid, selected day, multi-day range, right planning drawer, meal library
- Blocked variants: calendar made of disconnected cards, plan-week only interaction, form without multi-day navigation
- Notes: Calendar surfaces need a real month grid and selected day/range planning model. Manual input can allow repetition; auto-generation should avoid back-to-back repeated proteins.
- Closure evidence: Calendar contract requires month grid, selected day, multi-day range, right planning drawer, and meal library variants. Interaction contract separates manual input from generated planning rules and supports multi-day navigation. Meal Assistant package-native migration remains tracked as downstream project readiness, not a central kit blocker.
- Next actions: 

### Governance And Adoption

- Approved variants: adoption status, tier score, exception expiry, proof evidence, next action
- Blocked variants: unowned exception, tier complete without proof, static adapter marked complete
- Notes: Tier promotion should require proof, not only docs. Static adapters are compatibility bridges, not completion.
- Closure evidence: Tier approval rules now require package-native evidence, proof evidence, visual baselines, component adoption, and exception metadata. Dashboard Kit Gallery exposes numeric central kit score, downstream adoption score, status summaries, and project readiness links. Static adapters are explicitly compatibility bridges and cannot be marked as T3C completion.
- Next actions: 


## Showroom Review

- **Core Shell** (100): There is exactly one shell and one route model. Navigation labels remain readable and the main pane owns scrolling. Variants: expanded sidebar, collapsed sidebar, mobile drawer, command header, proof strip.
- **Metric And Proof Cards** (100): Metrics are compact, text-safe, and tied to freshness. Debug telemetry is hidden unless it changes an operator decision. Variants: metric strip, proof strip, state checklist, freshness strip, overflow stress.
- **Charts And Comparisons** (100): Primary charts have visible axes, units, legends, and time windows. Charts never fall back to hand-drawn placeholder paths for Tier 3. Variants: line, area, bar, donut, heatmap, scatter, candlestick, anomaly.
- **Tables And Queues** (100): Tables sit inside one card, use toolbar controls, and paginate after ten rows. Large evidence tables do not sit side-by-side. Variants: approval queue, evidence table, comparison table, toolbar sorting, pagination.
- **Drawers And Drilldowns** (100): Drilldowns preserve browsing context. Immediate facts, evidence, charts, and actions are visually separated. Variants: right drawer, market detail, approval detail, issue detail, mobile bottom sheet.
- **Market Browser** (100): Operators can browse categories without search-first behavior. Snapshot and stream states explain whether chart data is live, partial, stale, or insufficient. Variants: category browser, sub-category rail, market tape, selected market, stream proof.
- **Media Workflow** (100): Approval, rejection reason, channel destination, asset readiness, and posting result are visible. Dashboard and Discord payloads do not duplicate non-actionable banners. Variants: package card, approve/decline, publishable channels, posting proof, Discord handoff.
- **Calendar And Planning** (100): Calendar views look like calendar products, not disconnected cards. Manual and generated planning states are clear. Variants: month grid, selected day, multi-day range, right planning drawer, meal library.
- **Governance And Adoption** (100): The route shows what is approved, blocked, stale, missing, and next. Exceptions have owner, reviewer, reason, and expiry. Variants: adoption status, tier score, exception expiry, proof evidence, next action.

## How To Use This

1. Open `docs/design/dashboard-kit-gallery.html`.
2. Review the status, density, chart/table/drawer examples, and reference families.
3. Mark component families as `approved`, `reviewing`, `draft`, `needs-redesign`, or `deprecated`.
4. Only migrate project dashboards with approved families unless the project manifest records an exception.
