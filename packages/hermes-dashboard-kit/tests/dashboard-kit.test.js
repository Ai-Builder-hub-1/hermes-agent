import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  renderAreaChart,
  renderActionQueue,
  renderAlertQueue,
  renderBarChart,
  renderBenchmarkPanel,
  renderBriefingPanel,
  renderBrandPortfolioGrid,
  renderCalendarQueue,
  renderCampaignEconomicsPanel,
  renderCampaignRiskRail,
  renderChartPanel,
  renderChannelPostabilityMatrix,
  renderContentPackageWorkspace,
  renderCostAttributionTable,
  renderCoverageGapMatrix,
  renderDashboardShell,
  renderDataTable,
  renderDataTableTabs,
  renderDetailDrawer,
  renderDonutChart,
  renderGateRunTimeline,
  renderGovernanceChecklist,
  renderHeatmap,
  renderInsightGapPanel,
  renderKpiContractTable,
  renderLearningEvidenceStack,
  renderLineChart,
  renderApprovalQueue,
  renderAttributionMatrix,
  renderAutomationReadinessMatrix,
  renderAnomalyBandChart,
  renderDashboardLoadingShell,
  renderDashboardQueryBoundary,
  renderDataFreshnessStrip,
  renderBoardDecisionQueue,
  renderBottomSheetDrawer,
  renderBoxPlot,
  renderCandlestickChart,
  renderCompactActionRail,
  renderContractReadinessPanel,
  renderCorrelationMatrix,
  renderMarketBrowserLayout,
  renderMarketTape,
  renderCoverageMap,
  renderDeploymentPromotionPanel,
  renderDistributionPlot,
  renderEntityRelationshipGraph,
  renderEnvironmentHealthMatrix,
  renderHouseholdPreferencePanel,
  renderIncidentCommandPanel,
  renderIngredientChecklist,
  renderLocationDetailDrawer,
  renderMapWorkspace,
  renderMealGenerationRulesPanel,
  renderMealLibrary,
  renderMealPlannerCalendar,
  renderMealWeekDrawer,
  renderMobileDashboardShell,
  renderMobileFilterSheet,
  renderNarrativeBriefing,
  renderNetworkGraph,
  renderOperationsFunnel,
  renderOperationalSidebar,
  renderOperatingCompanyScorecard,
  renderOwnerAccountabilityMatrix,
  renderOutreachDraftPanel,
  renderPartnerRankingTable,
  renderPantryInventoryPanel,
  renderPermissionAuditPanel,
  renderPortfolioCompanyGrid,
  renderPartialDataBanner,
  renderPostPerformanceTable,
  renderProspectBoard,
  renderProofStrip,
  renderPublishingProofPanel,
  renderQaReviewPanel,
  renderReadinessDomainMatrix,
  renderRecommendationReviewPanel,
  renderResponseLogPanel,
  renderRunDrilldownPanel,
  renderRunbookPanel,
  renderSankeyFlow,
  renderScheduleTimeline,
  renderScatterQuadrantChart,
  renderSignalClusterPanel,
  renderSkeletonChart,
  renderSkeletonTable,
  renderSourceContractHealthTable,
  renderStageBlockerMatrix,
  renderStrategicInitiativeTimeline,
  renderStateChecklist,
  renderStatePanel,
  renderStaleDataBadge,
  renderServiceTopologyMap,
  renderShoppingListExportPanel,
  renderSunburst,
  renderSwipeableQueue,
  renderTerritoryMatrix,
  renderTimeWindowSelector,
  renderTreemap,
  renderViolinPlot,
  renderWasteCostPanel,
  renderWorkOrderQueue
} from "../src/index.js";

test("renders a tier 3 dashboard shell with one shell marker", () => {
  const html =
    renderDashboardShell({
      title:
        "Market Intelligence",
      subtitle:
        "Live command",
      activeId:
        "live",
      nav:
        [
          {
            id:
              "live",
            label:
              "Live Command"
          }
        ],
      children:
        "<section>Content</section>"
    });

  assert.match(html, /data-hdk-component="DashboardShell"/);
  assert.match(html, /data-experience-tier="tier-3"/);
  assert.equal((html.match(/data-hdk-component="DashboardShell"/g) || []).length, 1);
  assert.match(html, /data-component="DashboardSidebar"/);
  assert.match(html, /data-sidebar-brand/);
  assert.match(html, /data-nav-group="main"/);
  assert.match(html, /data-short="Live"/);
  assert.match(html, /aria-current="page"/);
});

test("renders product-grade operational sidebar contract", () => {
  const html =
    renderOperationalSidebar({
      title:
        "Media Business",
      subtitle:
        "Operations",
      mark:
        "MBO",
      activeId:
        "overview",
      status:
        "Discord remains primary.",
      footer:
        "<div data-dashboard-list></div>",
      navGroups:
        [
          {
            id:
              "command",
            label:
              "Command",
            items:
              [
                {
                  id:
                    "overview",
                  label:
                    "CEO Overview",
                  shortLabel:
                    "CEO"
                }
              ]
          },
          {
            id:
              "production",
            label:
              "Production",
            items:
              [
                {
                  id:
                    "runs",
                  label:
                    "Runs",
                  shortLabel:
                    "Runs"
                }
              ]
          }
        ]
    });

  assert.match(html, /data-component="DashboardSidebar"/);
  assert.match(html, /data-sidebar-brand/);
  assert.match(html, /MBO/);
  assert.equal((html.match(/data-nav-group=/g) || []).length, 2);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /data-short="CEO"/);
  assert.match(html, /data-sidebar-footer/);
  assert.match(html, /hdk-sidebar-status/);
});

test("renders approved charts with axes and component markers", () => {
  const data =
    [
      {
        x:
          "9:00",
        y:
          33
      },
      {
        x:
          "9:15",
        y:
          58
      },
      {
        x:
          "9:30",
        y:
          45
      }
    ];
  const line =
    renderLineChart({
      title:
        "Mid price",
      data,
      xLabel:
        "Time",
      yLabel:
        "Cents"
    });
  const area =
    renderAreaChart({
      title:
        "Usage",
      data
    });
  const bar =
    renderBarChart({
      title:
        "Errors",
      data
    });

  for (const html of [line, area, bar]) {
    assert.match(html, /data-hdk-component="(?:LineChart|AreaChart|BarChart)"/);
    assert.match(html, /hdk-chart__axis/);
    assert.match(html, /hdk-chart__label/);
  }
});

test("renders non-cartesian chart and data controls", () => {
  assert.match(
    renderDonutChart({
      title:
        "Platform mix",
      data:
        [
          {
            label:
              "YouTube",
            value:
              4
          },
          {
            label:
              "Facebook",
            value:
              2
          }
        ]
    }),
    /data-hdk-component="DonutChart"/
  );
  assert.match(
    renderHeatmap({
      title:
        "Category pressure",
      xLabels:
        ["Live", "Recent"],
      yLabels:
        ["Sports"],
      values:
        [
          {
            x:
              0,
            y:
              0,
            value:
              0.8,
            label:
              "Hot"
          }
        ]
    }),
    /data-hdk-component="Heatmap"/
  );
  assert.match(renderTimeWindowSelector({ active: "14D" }), /data-hdk-component="TimeWindowSelector"/);
});

test("renders table pagination, proof, and state components", () => {
  assert.match(
    renderDataTable({
      caption:
        "Markets",
      columns:
        [
          {
            key:
              "name",
            label:
              "Name"
          }
        ],
      rows:
        [
          {
            name:
              "Cuba policy market"
          }
        ],
      pageSize:
        25,
      total:
        48
    }),
    /data-hdk-component="Pagination"/
  );
  assert.match(
    renderProofStrip({
      items:
        [
          {
            label:
              "Charts",
            status:
              "ready"
          }
        ]
    }),
    /data-hdk-component="ProofStrip"/
  );
  assert.match(
    renderStatePanel({
      state:
        "stale",
      title:
        "Data stale"
    }),
    /data-hdk-component="StatePanel"/
  );
});

test("renders loading performance and freshness primitives", () => {
  assert.match(renderDashboardLoadingShell({ title: "Loading command center" }), /data-hdk-component="DashboardLoadingShell"/);
  assert.match(renderSkeletonChart(), /data-hdk-component="SkeletonChart"/);
  assert.match(renderSkeletonTable({ rows: 3 }), /data-hdk-component="SkeletonTable"/);
  assert.match(
    renderDataFreshnessStrip({
      items:
        [
          {
            label:
              "Snapshots",
            state:
              "stale",
            value:
              "8m old"
          }
        ]
    }),
    /data-hdk-component="DataFreshnessStrip"/
  );
  assert.match(renderStaleDataBadge({ age: "8m" }), /data-hdk-component="StaleDataBadge"/);
  assert.match(renderPartialDataBanner({ title: "Partial stream" }), /data-hdk-component="PartialDataBanner"/);
  assert.match(
    renderDashboardQueryBoundary({
      state:
        "stale",
      children:
        "<section>Cached view</section>"
    }),
    /data-data-state="stale"/
  );
});

test("renders production cockpit components for package-native migrations", () => {
  assert.match(
    renderDataTableTabs({
      tabs:
        [
          {
            id:
              "ready",
            label:
              "Ready",
            rows:
              [
                {
                  title:
                    "Ready item"
                }
              ],
            columns:
              [
                {
                  key:
                    "title",
                  label:
                    "Title"
                }
              ]
          }
        ]
    }),
    /data-hdk-component="DataTableTabs"/
  );

  assert.match(
    renderDetailDrawer({
      title:
        "Selected market",
      facts:
        [
          {
            label:
              "Snapshots",
            value:
              "56"
          }
        ],
      sections:
        [
          {
            title:
              "Movement",
            body:
              "Mid price is moving."
          }
        ]
    }),
    /data-hdk-component="Drawer"/
  );

  assert.match(
    renderMarketBrowserLayout({
      filters:
        "<div>Filters</div>",
      tape:
        renderMarketTape({
          markets:
            [
              {
                id:
                  "m1",
                title:
                  "Will the market move?",
                category:
                  "Politics",
                mid:
                  "54c",
                spread:
                  "3c",
                volume:
                  "$12K",
                snapshots:
                  8
              }
            ]
        }),
      detail:
        "<aside>Detail</aside>"
    }),
    /data-hdk-component="MarketBrowserLayout"/
  );

  assert.match(
    renderChartPanel({
      title:
        "Mid price",
      type:
        "line",
      xAxis:
        "time",
      xAxisLabel:
        "Time",
      yAxis:
        "mid",
      yAxisLabel:
        "Cents",
      children:
        "<svg></svg>"
    }),
    /data-x-axis-label="Time"/
  );

  assert.match(renderApprovalQueue({ items: [{ title: "Package", status: "needs_review" }] }), /data-hdk-component="ApprovalQueue"/);
  assert.match(renderQaReviewPanel({ checks: [{ label: "Caption", status: "pass" }] }), /data-hdk-component="QaReviewPanel"/);
  assert.match(renderStateChecklist({ items: [{ label: "Proof", status: "ready" }] }), /data-hdk-component="StateChecklist"/);
});

test("renders media business shared component batch", () => {
  assert.match(
    renderActionQueue({
      items:
        [
          {
            title:
              "Review failed upload",
            priority:
              "high",
            status:
              "open",
            owner:
              "ops",
            due:
              "today"
          }
        ]
    }),
    /data-hdk-component="ActionQueue"/
  );
  assert.match(
    renderAlertQueue({
      alerts:
        [
          {
            title:
              "Publishing failed",
            severity:
              "critical",
            status:
              "open"
          }
        ]
    }),
    /data-hdk-component="AlertQueue"/
  );
  assert.match(
    renderContentPackageWorkspace({
      package:
        {
          brand:
            "Unimportant News",
          platform:
            "YouTube",
          status:
            "ready",
          copy:
            "Upload description"
        },
      assets:
        [
          {
            label:
              "Thumbnail",
            href:
              "#"
          }
        ]
    }),
    /data-hdk-component="ContentPackageWorkspace"/
  );
  assert.match(
    renderBrandPortfolioGrid({
      brands:
        [
          {
            name:
              "Finance for Thought",
            status:
              "healthy",
            metrics:
              [
                {
                  label:
                    "Audience",
                  value:
                    "12K"
                }
              ]
          }
        ]
    }),
    /data-hdk-component="BrandPortfolioGrid"/
  );
  assert.match(
    renderChannelPostabilityMatrix({
      channels:
        [
          {
            label:
              "Finance for Thought",
            platforms:
              {
                YouTube:
                  {
                    status:
                      "postable"
                  },
                Instagram:
                  {
                    status:
                      "manual"
                  }
              }
          }
        ]
    }),
    /data-hdk-component="ChannelPostabilityMatrix"/
  );
  assert.match(
    renderOperationsFunnel({
      stages:
        [
          {
            label:
              "Generated",
            value:
              120
          },
          {
            label:
              "Approved",
            value:
              74
          }
        ]
    }),
    /data-hdk-component="OperationsFunnel"/
  );
  assert.match(
    renderCostAttributionTable({
      rows:
        [
          {
            source:
              "thumbnail",
            provider:
              "openai",
            purpose:
              "image",
            owner:
              "media",
            cost:
              12.42
          }
        ]
    }),
    /data-hdk-component="CostAttributionTable"/
  );
});

test("renders expanded operating component kit batch", () => {
  const panelItem =
    {
      title:
        "Needs review",
      status:
        "warning",
      detail:
        "Operator should inspect this row.",
      value:
        "3"
    };
  const matrixRows =
    [
      {
        label:
          "Finance",
        values:
          {
            YouTube:
              {
                status:
                  "ready",
                value:
                  "ready"
              }
          }
      }
    ];
  const tableRows =
    [
      {
        post:
          "Video one",
        platform:
          "YouTube",
        format:
          "video",
        score:
          "82",
        result:
          "watch"
      }
    ];
  const renderers =
    [
      ["BriefingPanel", () => renderBriefingPanel({ items: [panelItem] })],
      ["NarrativeBriefing", () => renderNarrativeBriefing({ items: [panelItem] })],
      ["ScheduleTimeline", () => renderScheduleTimeline({ items: [panelItem] })],
      ["CalendarQueue", () => renderCalendarQueue({ items: [panelItem] })],
      ["BenchmarkPanel", () => renderBenchmarkPanel({ items: [panelItem] })],
      ["PostPerformanceTable", () => renderPostPerformanceTable({ rows: tableRows })],
      ["CampaignEconomicsPanel", () => renderCampaignEconomicsPanel({ items: [panelItem] })],
      ["AttributionMatrix", () => renderAttributionMatrix({ rows: matrixRows })],
      ["CampaignRiskRail", () => renderCampaignRiskRail({ items: [panelItem] })],
      ["ProspectBoard", () => renderProspectBoard({ items: [panelItem] })],
      ["OutreachDraftPanel", () => renderOutreachDraftPanel({ items: [panelItem] })],
      ["CoverageGapMatrix", () => renderCoverageGapMatrix({ rows: matrixRows })],
      ["ResponseLogPanel", () => renderResponseLogPanel({ items: [panelItem] })],
      ["ReadinessDomainMatrix", () => renderReadinessDomainMatrix({ rows: matrixRows })],
      ["KpiContractTable", () => renderKpiContractTable({ rows: [{ kpi: "Reach", source: "registry", cadence: "daily", owner: "ops", status: "ready" }] })],
      ["GovernanceChecklist", () => renderGovernanceChecklist({ items: [panelItem] })],
      ["AutomationReadinessMatrix", () => renderAutomationReadinessMatrix({ rows: matrixRows })],
      ["WorkOrderQueue", () => renderWorkOrderQueue({ items: [panelItem] })],
      ["GateRunTimeline", () => renderGateRunTimeline({ items: [panelItem] })],
      ["StageBlockerMatrix", () => renderStageBlockerMatrix({ rows: matrixRows })],
      ["RunDrilldownPanel", () => renderRunDrilldownPanel({ items: [panelItem] })],
      ["RecommendationReviewPanel", () => renderRecommendationReviewPanel({ items: [panelItem] })],
      ["LearningEvidenceStack", () => renderLearningEvidenceStack({ items: [panelItem] })],
      ["SignalClusterPanel", () => renderSignalClusterPanel({ items: [panelItem] })],
      ["InsightGapPanel", () => renderInsightGapPanel({ items: [panelItem] })],
      ["PartnerRankingTable", () => renderPartnerRankingTable({ rows: [{ partner: "Creator", score: "91", margin: "32%", risk: "low", action: "expand" }] })],
      ["PublishingProofPanel", () => renderPublishingProofPanel({ items: [panelItem] })],
      ["SourceContractHealthTable", () => renderSourceContractHealthTable({ rows: [{ source: "meta", freshness: "fresh", contract: "ready", status: "ready", owner: "ops" }] })],
      ["WasteCostPanel", () => renderWasteCostPanel({ items: [panelItem] })]
    ];

  for (const [component, render] of renderers) {
    assert.match(render(), new RegExp(`data-hdk-component="${component}"`));
  }
});

test("renders deep project-type component kits", () => {
  const item =
    {
      title:
        "Review item",
      status:
        "ready",
      detail:
        "Shared deep-kit record."
    };
  const matrixRows =
    [
      {
        label:
          "Primary",
        values:
          {
            A:
              {
                value:
                  "ready",
                status:
                  "ready"
              }
          }
      }
    ];
  const renderers =
    [
      ["MealPlannerCalendar", () => renderMealPlannerCalendar({ rows: matrixRows })],
      ["MealWeekDrawer", () => renderMealWeekDrawer({ items: [item] })],
      ["MealLibrary", () => renderMealLibrary({ rows: [{ meal: "Chicken bowl", protein: "Chicken", side: "Rice", tags: "quick", status: "ready" }] })],
      ["IngredientChecklist", () => renderIngredientChecklist({ items: [item] })],
      ["HouseholdPreferencePanel", () => renderHouseholdPreferencePanel({ items: [item] })],
      ["MealGenerationRulesPanel", () => renderMealGenerationRulesPanel({ items: [item] })],
      ["PantryInventoryPanel", () => renderPantryInventoryPanel({ items: [item] })],
      ["ShoppingListExportPanel", () => renderShoppingListExportPanel({ items: [item] })],
      ["MapWorkspace", () => renderMapWorkspace({ items: [item] })],
      ["CoverageMap", () => renderCoverageMap({ rows: matrixRows })],
      ["EntityRelationshipGraph", () => renderEntityRelationshipGraph({ rows: matrixRows })],
      ["TerritoryMatrix", () => renderTerritoryMatrix({ rows: matrixRows })],
      ["LocationDetailDrawer", () => renderLocationDetailDrawer({ items: [item] })],
      ["NetworkGraph", () => renderNetworkGraph({ rows: matrixRows })],
      ["PortfolioCompanyGrid", () => renderPortfolioCompanyGrid({ companies: [{ name: "TLC Ops", status: "healthy" }] })],
      ["OperatingCompanyScorecard", () => renderOperatingCompanyScorecard({ items: [item] })],
      ["OwnerAccountabilityMatrix", () => renderOwnerAccountabilityMatrix({ rows: matrixRows })],
      ["ContractReadinessPanel", () => renderContractReadinessPanel({ items: [item] })],
      ["BoardDecisionQueue", () => renderBoardDecisionQueue({ items: [item] })],
      ["StrategicInitiativeTimeline", () => renderStrategicInitiativeTimeline({ items: [item] })],
      ["ServiceTopologyMap", () => renderServiceTopologyMap({ rows: matrixRows })],
      ["DeploymentPromotionPanel", () => renderDeploymentPromotionPanel({ items: [item] })],
      ["PermissionAuditPanel", () => renderPermissionAuditPanel({ items: [item] })],
      ["IncidentCommandPanel", () => renderIncidentCommandPanel({ items: [item] })],
      ["RunbookPanel", () => renderRunbookPanel({ items: [item] })],
      ["EnvironmentHealthMatrix", () => renderEnvironmentHealthMatrix({ rows: matrixRows })],
      ["CandlestickChart", () => renderCandlestickChart({ data: [{ label: "Open", value: 45 }, { label: "Close", value: 61 }] })],
      ["SankeyFlow", () => renderSankeyFlow({ rows: matrixRows })],
      ["Treemap", () => renderTreemap({ rows: matrixRows })],
      ["Sunburst", () => renderSunburst({ rows: matrixRows })],
      ["CorrelationMatrix", () => renderCorrelationMatrix({ rows: matrixRows })],
      ["DistributionPlot", () => renderDistributionPlot({ data: [{ label: "P50", value: 50 }] })],
      ["BoxPlot", () => renderBoxPlot({ data: [{ label: "Median", value: 50 }] })],
      ["ViolinPlot", () => renderViolinPlot({ data: [{ label: "Dense", value: 64 }] })],
      ["ScatterQuadrantChart", () => renderScatterQuadrantChart({ data: [{ label: "High impact", value: 78 }] })],
      ["AnomalyBandChart", () => renderAnomalyBandChart({ data: [{ label: "Spike", value: 88 }] })],
      ["MobileDashboardShell", () => renderMobileDashboardShell({ items: [item] })],
      ["BottomSheetDrawer", () => renderBottomSheetDrawer({ items: [item] })],
      ["MobileFilterSheet", () => renderMobileFilterSheet({ items: [item] })],
      ["CompactActionRail", () => renderCompactActionRail({ items: [item] })],
      ["SwipeableQueue", () => renderSwipeableQueue({ items: [item] })]
    ];

  for (const [component, render] of renderers) {
    assert.match(render(), new RegExp(`data-hdk-component="${component}"`));
  }
});

test("surface validator rejects chart-like tier 3 surfaces without kit charts", () => {
  const dir =
    fs.mkdtempSync(path.join(os.tmpdir(), "hdk-validator-"));
  const badSurface =
    path.join(dir, "dashboard.html");
  fs.writeFileSync(
    badSurface,
    `<main data-experience-tier="tier-3"><h1>Dashboard</h1><div class="chart"><svg><path d="M0 0 L10 10"></path></svg></div></main>`,
    "utf8"
  );

  const result =
    spawnSync(
      process.execPath,
      [
        path.resolve("packages/hermes-dashboard-kit/src/validate-surface.js"),
        badSurface
      ],
      {
        cwd:
          path.resolve("."),
        encoding:
          "utf8"
      }
    );

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /chart_without_approved_component/);
  assert.match(result.stdout, /tier3_without_dashboard_kit/);
});

test("surface validator rejects unbounded dashboard tables without pagination", () => {
  const dir =
    fs.mkdtempSync(path.join(os.tmpdir(), "hdk-validator-table-"));
  const badSurface =
    path.join(dir, "operations-dashboard.html");
  const rows =
    Array.from({ length: 105 }).map((_, index) => `<tr><td>Row ${index}</td></tr>`).join("");
  fs.writeFileSync(
    badSurface,
    `<main data-experience-tier="tier-3" data-hdk-component="DashboardShell"><h1>Operations</h1><table>${rows}</table></main>`,
    "utf8"
  );

  const result =
    spawnSync(
      process.execPath,
      [
        path.resolve("packages/hermes-dashboard-kit/src/validate-surface.js"),
        badSurface
      ],
      {
        cwd:
          path.resolve("."),
        encoding:
          "utf8"
      }
    );

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /unbounded_table_without_pagination/);
});

test("local override scanner blocks protected dashboard CSS without a manifest exception", () => {
  const dir =
    fs.mkdtempSync(path.join(os.tmpdir(), "hdk-local-overrides-"));
  const publicDir =
    path.join(dir, "public");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(
    path.join(publicDir, "dashboard.html"),
    `<link rel="stylesheet" href="./dashboard.css"><main data-experience-tier="tier-3">Dashboard</main>`,
    "utf8"
  );
  fs.writeFileSync(
    path.join(publicDir, "dashboard.css"),
    `.sidebar { background: #111; }\n:root { --panel: #fff; }\n`,
    "utf8"
  );
  fs.writeFileSync(
    path.join(dir, ".hermes-dashboard.json"),
    JSON.stringify({
      schemaVersion:
        1,
      projectId:
        "fixture",
      dashboardKit:
        {
          package:
            "@hermes/dashboard-kit",
          requiredVersion:
            "0.1.0",
          adoptionMode:
            "package-native",
          implementationMode:
            "package-native",
          targetExperienceTier:
            3,
          blockUnreviewedLocalDashboardCss:
            true,
          localVisualOverridePolicy:
            "declared-exceptions-only"
        },
      surfaces:
        [
          {
            id:
              "fixture-dashboard",
            path:
              "public/dashboard.html",
            status:
              "package-native",
            requiredComponents:
              []
          }
        ],
      exceptions:
        []
    }, null, 2),
    "utf8"
  );

  const result =
    spawnSync(
      process.execPath,
      [
        path.resolve("scripts/scan-dashboard-local-overrides.mjs"),
        "--project-dir",
        dir,
        "--strict"
      ],
      {
        cwd:
          path.resolve("."),
        encoding:
          "utf8"
      }
    );

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /localVisualOverride\.protectedSelector/);
  assert.match(result.stdout, /localVisualOverride\.protectedToken/);
});
