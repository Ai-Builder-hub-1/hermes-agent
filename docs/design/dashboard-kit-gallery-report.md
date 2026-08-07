# Dashboard Kit Gallery Report

Generated: 2026-08-07T20:20:50.172Z

Purpose: Visible component intake and approval status for package-native dashboard migrations.

## Summary

| Metric | Value |
| --- | ---: |
| Component families | 9 |
| Named components | 49 |
| Approved families | 4 |
| Reviewing families | 3 |
| Draft families | 2 |
| Average review score | 70 |
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

- **Charts And Comparisons** (reviewing, tier-3, score 62): Pick the chart density and visual language before we roll it into Kashi, Media Engine, or cost dashboards. Next: Build richer chart preview variants with hover, legend, comparison, and density states.
- **Drawers And Drilldowns** (reviewing, tier-3, score 68): Tell us what should be visible immediately versus tucked behind evidence/actions. Next: Add keyboard/focus rules for drawers and bottom sheets.
- **Market Browser** (reviewing, tier-3, score 61): Approve the browse model before Kashi replaces static market-browser routes. Next: Create a package-native market browser reference page.
- **Media Workflow** (draft, tier-3, score 62): Define what must show in Discord versus the dashboard and what counts as approve-ready. Next: Add approved Discord handoff and dashboard package review examples.
- **Calendar And Planning** (draft, tier-3, score 55): Approve the calendar interaction model and form density before Meal Assistant migrates. Next: Build premium calendar and planning drawer examples.

## Component Families

| Family | Status | Score | Target | Components | References |
| --- | --- | ---: | --- | --- | --- |
| Core Shell | approved | 81 | tier-3 | DashboardShell, OperationalSidebar, DashboardHeader, ProofStrip, DataFreshnessStrip | Linear, Asana, Vercel |
| Metric And Proof Cards | approved | 80 | tier-3 | MetricCard, StatusPill, StatePanel, StateChecklist, KpiContractTable | Mixpanel, Vercel, Wrike |
| Charts And Comparisons | reviewing | 62 | tier-3 | LineChart, AreaChart, BarChart, DonutChart, Heatmap, ScatterQuadrantChart, CandlestickChart, AnomalyBandChart | Kraken, OKX, Mixpanel, LangChain |
| Tables And Queues | approved | 78 | tier-3 | DataTable, DataTableTabs, ApprovalQueue, ActionQueue, AlertQueue, WorkOrderQueue | Linear, Asana, Manus, PlanetScale |
| Drawers And Drilldowns | reviewing | 68 | tier-3 | DetailDrawer, MarketVolatilityDrawer, RunDrilldownPanel, LocationDetailDrawer, BottomSheetDrawer | Coinbase, Jobber, Productboard |
| Market Browser | reviewing | 61 | tier-3 | MarketExplorerPage, MarketBrowserLayout, MarketTape, OrderBookLadder, TimeWindowSelector | Kraken, Binance, OKX, Coinbase |
| Media Workflow | draft | 62 | tier-3 | ContentPackageWorkspace, BrandPortfolioGrid, ChannelPostabilityMatrix, QaReviewPanel, PublishingProofPanel | Sprout Social, Adobe Express, Manus |
| Calendar And Planning | draft | 55 | tier-3 | MealPlannerCalendar, MealWeekDrawer, ScheduleTimeline, CalendarQueue, MealLibrary | Amie, Motion, Jobber, Time2book |
| Governance And Adoption | approved | 80 | tier-3 | GovernanceChecklist, ReadinessDomainMatrix, DeploymentPromotionPanel, PermissionAuditPanel, ComponentIntakeBoard | Linear, Wrike, Productboard |

## Registry Notes

### Core Shell

- Approved variants: expanded sidebar, collapsed sidebar, mobile drawer, command header, proof strip
- Blocked variants: nested shell, standalone prototype shell, duplicate dashboard switcher
- Notes: Keep one global shell per dashboard product. The main content pane owns vertical scrolling. Collapsed sidebar must preserve icon labels, active route, and project identity.
- Next actions: Add screenshot baselines for expanded, collapsed, and mobile drawer states. Fail project audits when a production route renders nested shell chrome.

### Metric And Proof Cards

- Approved variants: metric strip, proof strip, state checklist, freshness strip, overflow stress
- Blocked variants: debug telemetry cards, duplicate hero proof banners, unbounded card text
- Notes: Cards must answer an operator question, not expose implementation trivia. Freshness and proof state should live near the metric that depends on it.
- Next actions: Add regression cases for long labels, missing values, and mixed light/dark token usage. Add guidance for when proof state belongs in a card versus a table toolbar.

### Charts And Comparisons

- Approved variants: line, area, bar, donut, heatmap
- Blocked variants: hand-drawn placeholder chart, axisless primary chart, chart without unit labels
- Notes: Primary charts require axes, units, legends, and explicit time windows. Comparison mode must support adding/removing metrics or brands without rebuilding the page. Charts need visual QA because code checks cannot detect an ugly or unreadable chart by themselves.
- Next actions: Build richer chart preview variants with hover, legend, comparison, and density states. Add screenshot assertions for axis visibility and nonblank chart regions. Migrate Media Engine brand activity and Kashi market browser charts to approved kit components.

### Tables And Queues

- Approved variants: approval queue, evidence table, comparison table, toolbar sorting, pagination
- Blocked variants: duplicate table headers, two pagination footers, large evidence tables side-by-side
- Notes: Tables sit inside one card with one header, one toolbar, and one pagination footer. Default page size is 10 with 25 and 50 available. Sorting belongs in a toolbar control when many metrics are sortable.
- Next actions: Add audit checks for duplicate table headers and duplicate pagination footers. Add table-card composition examples for queues, evidence, and brand comparisons.

### Drawers And Drilldowns

- Approved variants: right drawer, market detail, approval detail, issue detail, mobile bottom sheet
- Blocked variants: page jump detail, modal that hides browse context, blank prototype drawer for real data
- Notes: A selected row should open a drilldown without losing the operator's place. Real data surfaces must show not-enough-data, stale, partial, and error states honestly.
- Next actions: Add keyboard/focus rules for drawers and bottom sheets. Create market-detail and approval-detail reference snapshots.

### Market Browser

- Approved variants: category browser, sub-category rail, market tape, selected market, stream proof
- Blocked variants: search-first empty browser, default blank selected chart, static market route
- Notes: Browsing should start with category/subcategory discovery, not an empty search field. Streaming and snapshots should be distinguishable but visually connected. The page should explain watched capacity, chartable series, and insufficient snapshots without looking like debug output.
- Next actions: Create a package-native market browser reference page. Add capacity governor and stream proof components to the chart/detail contract. Capture Kashi production proof screenshots after route migration.

### Media Workflow

- Approved variants: package card, approve/decline, publishable channels, posting proof, Discord handoff
- Blocked variants: package without approval actions, missing publishable channel list, Discord payload without posting result
- Notes: The dashboard and Discord message should agree on approval state, decline reason, publishable destinations, and posting success. Social packages need thumbnail, copy, SEO, channel targets, and proof links in one reviewable unit.
- Next actions: Add approved Discord handoff and dashboard package review examples. Add publishing proof states for success, partial, failed, skipped, and unavailable.

### Calendar And Planning

- Approved variants: month grid, selected day, multi-day range, right planning drawer, meal library
- Blocked variants: calendar made of disconnected cards, plan-week only interaction, form without multi-day navigation
- Notes: Calendar surfaces need a real month grid and selected day/range planning model. Manual input can allow repetition; auto-generation should avoid back-to-back repeated proteins.
- Next actions: Build premium calendar and planning drawer examples. Add Meal Assistant migration checklist for month, drawer, library, and shopping list export.

### Governance And Adoption

- Approved variants: adoption status, tier score, exception expiry, proof evidence, next action
- Blocked variants: unowned exception, tier complete without proof, static adapter marked complete
- Notes: Tier promotion should require proof, not only docs. Static adapters are compatibility bridges, not completion.
- Next actions: Tie gallery family approval to dashboard promotion checks. Add numeric design maturity scoring from manifest, proof, and visual baselines.


## Showroom Review

- **Core Shell** (81): There is exactly one shell and one route model. Navigation labels remain readable and the main pane owns scrolling. Variants: expanded sidebar, collapsed sidebar, mobile drawer, command header, proof strip.
- **Metric And Proof Cards** (80): Metrics are compact, text-safe, and tied to freshness. Debug telemetry is hidden unless it changes an operator decision. Variants: metric strip, proof strip, state checklist, freshness strip, overflow stress.
- **Charts And Comparisons** (62): Primary charts have visible axes, units, legends, and time windows. Charts never fall back to hand-drawn placeholder paths for Tier 3. Variants: line, area, bar, donut, heatmap, scatter, candlestick, anomaly.
- **Tables And Queues** (78): Tables sit inside one card, use toolbar controls, and paginate after ten rows. Large evidence tables do not sit side-by-side. Variants: approval queue, evidence table, comparison table, toolbar sorting, pagination.
- **Drawers And Drilldowns** (68): Drilldowns preserve browsing context. Immediate facts, evidence, charts, and actions are visually separated. Variants: right drawer, market detail, approval detail, issue detail, mobile bottom sheet.
- **Market Browser** (61): Operators can browse categories without search-first behavior. Snapshot and stream states explain whether chart data is live, partial, stale, or insufficient. Variants: category browser, sub-category rail, market tape, selected market, stream proof.
- **Media Workflow** (62): Approval, rejection reason, channel destination, asset readiness, and posting result are visible. Dashboard and Discord payloads do not duplicate non-actionable banners. Variants: package card, approve/decline, publishable channels, posting proof, Discord handoff.
- **Calendar And Planning** (55): Calendar views look like calendar products, not disconnected cards. Manual and generated planning states are clear. Variants: month grid, selected day, multi-day range, right planning drawer, meal library.
- **Governance And Adoption** (80): The route shows what is approved, blocked, stale, missing, and next. Exceptions have owner, reviewer, reason, and expiry. Variants: adoption status, tier score, exception expiry, proof evidence, next action.

## How To Use This

1. Open `docs/design/dashboard-kit-gallery.html`.
2. Review the status, density, chart/table/drawer examples, and reference families.
3. Mark component families as `approved`, `reviewing`, `draft`, `needs-redesign`, or `deprecated`.
4. Only migrate project dashboards with approved families unless the project manifest records an exception.
