# Dashboard Project Type Component Coverage Audit

Generated: 2026-08-03

## Question

Do we have component kits for all of our project dashboard types?

## Short Answer

We have broad shared-kit coverage for the dashboard types currently registered in the Hermes dashboard adoption registry, but we do not yet have equally deep, product-specific kits for every dashboard category we are likely to build.

The current kit is strongest for:

- Core shell/navigation/state/proof.
- Dense tables, filters, drawers, and queues.
- Market/trading intelligence.
- Media operations and content-package workflows.
- Media business operations, cost, postability, readiness, campaigns, learning, and source health.
- Command/control and execution queues.

The kit now includes v1 deep-kit coverage for:

- Meal/household planning.
- Business mapping/geospatial/network maps.
- TLC enterprise portfolio/readiness views.
- Hermes OS governance/control-plane dashboards.
- Advanced data science visualizations such as Sankey, treemap, sunburst, box/violin plots, candlestick/OHLC, and correlation matrices.
- Mobile-first operator dashboards.

These are implemented as reusable v1 shared components. The remaining gap is not component naming coverage; it is richer visual variants, project-specific data contracts, and adoption/proof inside each project.

## Current Registered Dashboard Types

| Project type | Primary project(s) | Current shared kit coverage | Coverage status | Notes |
| --- | --- | --- | --- | --- |
| Market/trading intelligence | Kashi VC | `MarketTape`, `MarketVolatilityDrawer`, `PriceMovementChart`, `SpreadBandChart`, `LiquidityDepthChart`, `VolumePulseChart`, `CategoryHeatmap`, `OpportunityMatrix`, `OrderBookLadder`, `ForecastConeChart`, `WaterfallChart`, `TimeWindowSelector` | Strong | Enough for current Live Command and Market Browser patterns. Remaining work is adoption/package-native migration and possibly true candlestick/OHLC if we store OHLC. |
| Media production operations | Media Engine | `DashboardShell`, `DataTableTabs`, `DataTable`, `ChartPanel`, `DetailDrawerShell`, `EntitySummaryCard`, `AiAssistantPanel`, `StateChecklist`, `ContentPackageWorkspace`, `PublishingQueuePanel`, `ApprovalQueuePanel`, `DirectPostingControlPanel` | Strong | Enough for Tier 3 migration. Remaining issue is adoption depth and visual proof, not missing component families. |
| Media business operations | Media Business OS | `ActionQueue`, `AlertQueue`, `BrandPortfolioGrid`, `ChannelPostabilityMatrix`, `OperationsFunnel`, `CostAttributionTable`, `BriefingPanel`, `ScheduleTimeline`, `CampaignEconomicsPanel`, `AttributionMatrix`, `ProspectBoard`, `ReadinessDomainMatrix`, `GateRunTimeline`, `RecommendationReviewPanel`, `SourceContractHealthTable`, `WasteCostPanel` | Strong after latest build | Cross-project component audit now shows `0` missing shared components for Media Business; remaining gaps are adoption evidence in that project. |
| Meal/household planning | Meal Assistant | `MealPlannerCalendar`, `MealWeekDrawer`, `MealLibrary`, `IngredientChecklist`, `HouseholdPreferencePanel`, `MealGenerationRulesPanel`, `PantryInventoryPanel`, `ShoppingListExportPanel`, plus general calendar/queue/drawer primitives | Strong v1 | Deep-kit components now exist. Remaining work is adoption in Meal Assistant and richer meal-specific interactions. |
| Business mapping/workspace | Business Mapper | `MapWorkspace`, `CoverageMap`, `EntityRelationshipGraph`, `TerritoryMatrix`, `LocationDetailDrawer`, `NetworkGraph`, plus shell/table/entity primitives | Strong v1 | Deep-kit components now exist. Remaining work is richer map/canvas behavior and adoption. |
| Hermes OS control plane | Hermes OS | `ServiceTopologyMap`, `DeploymentPromotionPanel`, `PermissionAuditPanel`, `IncidentCommandPanel`, `RunbookPanel`, `EnvironmentHealthMatrix`, plus command/proof primitives | Strong v1 | Deep-kit components now exist. Remaining work is adoption and live control-plane data contracts. |
| TLC enterprise/readiness portfolio | TLC Capital Group OS | `PortfolioCompanyGrid`, `OperatingCompanyScorecard`, `OwnerAccountabilityMatrix`, `ContractReadinessPanel`, `BoardDecisionQueue`, `StrategicInitiativeTimeline`, plus readiness/executive primitives | Strong v1 | Deep-kit components now exist. Remaining work is TLC-specific data contracts and adoption. |
| Cost/capacity intelligence | Nous Hermes Agent, Hermes Agent, Media Business | `ProviderSpendTimeline`, `BusinessUnitCostCard`, `CostAttributionTable`, `WasteCostPanel`, `CapacityMeter`, `ExecutiveCostCapacityRollup` | Strong | Strong shared baseline. Next level would add variance, budget envelope, anomaly, and forecast components. |
| AI-assisted/review workflows | Media Engine, Nous Hermes Agent, TLC OS | `AiAssistantPanel`, `GeneratedInsightCallout`, `EvidenceStack`, `RecommendationStack`, `RecommendationReviewPanel`, `LearningEvidenceStack`, `QaReviewPanel`, `ApprovalQueuePanel` | Strong | Good for dashboards that explain and recommend. Need stricter source/claim mapping components for high-stakes evidence. |
| Governance/adoption/proof dashboards | Nous Hermes Agent | `ProofStrip`, `ProofEvidencePanel`, `DataFreshnessStrip`, `SourceContractHealthTable`, `GovernanceChecklist`, `DashboardQueryBoundary`, `DashboardLoadingShell` | Strong | Tooling exists. Remaining gap is rendered screenshot-aware regression enforcement across every repo. |

## Taxonomy Family Coverage

| Taxonomy family | Coverage | Status |
| --- | --- | --- |
| Navigation and workspace structure | Shell, sidebar, header, breadcrumb, split layout, workspace switcher, command palette | Covered |
| Information architecture | Snapshot/module contracts and architecture assessment helpers | Partial |
| Cards and panels | KPI, evidence, recommendation, brand/entity, cost, readiness, proof, state cards | Covered |
| Tables and lists | Data table, tabs, expandable list, market tape, queues, audit/event lists | Covered |
| Charts and visualization | Line, area, bar, donut, heatmap, market/trading, waterfall, forecast, cost timeline | Partial |
| Drilldowns and drawers | Drawer, detail drawer, volatility drawer, drilldown panel | Covered |
| Command and control | Command bar, actions, run status, queues, approvals, alerts | Covered |
| State design | Loading, empty, error, stale, partial, proof/freshness, permission-limited | Covered |
| Search/filter/discovery | Search input, filter bar, segmented control, saved filters/views, global search | Covered |
| AI-assisted interaction | AI panel, evidence, recommendations, generated insight, learning review | Covered |
| Visual language/theme | Shared tokens, light/dark theme, CSS, catalog, visual QA docs | Covered |
| Reference research workflow | Mobbin/reference workflow and reference registries | Covered but not fully automated |
| Project retrofit tracks | Adoption registry, audit/report commands, starter command, validation scripts | Covered |

## Deep-Kit Families Added

These component families now exist as reusable v1 shared components. They are no longer missing kit categories, but each still needs project adoption, stronger visual variants, and proof once used in production dashboards.

### Meal And Household Planning

- `MealPlannerCalendar`
- `MealWeekDrawer`
- `MealLibrary`
- `IngredientChecklist`
- `HouseholdPreferencePanel`
- `MealGenerationRulesPanel`
- `PantryInventoryPanel`
- `ShoppingListExportPanel`

### Mapping, Graph, And Spatial Workspaces

- `MapWorkspace`
- `CoverageMap`
- `EntityRelationshipGraph`
- `TerritoryMatrix`
- `LocationDetailDrawer`
- `NetworkGraph`

### Enterprise Portfolio And Governance

- `PortfolioCompanyGrid`
- `OperatingCompanyScorecard`
- `OwnerAccountabilityMatrix`
- `ContractReadinessPanel`
- `BoardDecisionQueue`
- `StrategicInitiativeTimeline`

### Hermes OS Control Plane

- `ServiceTopologyMap`
- `DeploymentPromotionPanel`
- `PermissionAuditPanel`
- `IncidentCommandPanel`
- `RunbookPanel`
- `EnvironmentHealthMatrix`

### Advanced Analytics And Visualization

- `CandlestickChart`
- `SankeyFlow`
- `Treemap`
- `Sunburst`
- `CorrelationMatrix`
- `DistributionPlot`
- `BoxPlot`
- `ViolinPlot`
- `ScatterQuadrantChart`
- `AnomalyBandChart`

### Mobile-First Operator Surfaces

- `MobileDashboardShell`
- `BottomSheetDrawer`
- `MobileFilterSheet`
- `CompactActionRail`
- `SwipeableQueue`

## Current Cross-Project Audit Result

The current component-gap audit reports:

- Projects audited: `7`
- Covered projects: `5`
- Adoption-gap projects: `2`
- Kit-gap projects: `0`

Interpretation:

- We are no longer blocked by missing shared components for the currently declared Media Business gap audit.
- The next blocker is project adoption: Media Business and Meal Assistant still need to migrate local or legacy route surfaces to use the kit.
- Several projects still lack their own detailed `docs/dashboard-component-gap-audit.md`, so their future-specific gaps may not be fully visible yet.

## Recommendation

The kit now has broad v1 component coverage across our known project dashboard types. Do not call the design system “finished,” because project adoption, richer visual variants, and screenshot-regression proof still matter.

Next best sequence:

1. Commit the current Nous Hermes component-kit expansion.
2. Switch to Media Business and replace the remaining local route evidence with shared components.
3. Create the same `docs/dashboard-component-gap-audit.md` for Meal Assistant, Kashi VC, Media Engine, Business Mapper, Hermes OS, and TLC OS.
4. Build future kit batches only from repeated gaps found in those project audits.
5. Prioritize adoption and proof for Media Business and Meal Assistant next, since the central kit is no longer the immediate blocker.
