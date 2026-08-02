import fs from "node:fs";
import path from "node:path";

const root =
  path.resolve(new URL("..", import.meta.url).pathname);
const required =
  [
    "package.json",
    "DESIGN.md",
    "src/index.js",
    "src/dashboard-kit.css",
    "src/validate-surface.js",
    "references/mobbin-extraction.md",
    "tests/dashboard-kit.test.js"
  ];
const missing =
  required.filter((file) => !fs.existsSync(path.join(root, file)));

console.log(JSON.stringify({
  package:
    "@hermes/dashboard-kit",
  status:
    missing.length ? "incomplete" : "ready",
  missing,
  components:
    [
      "DashboardShell",
      "MetricCard",
      "StatePanel",
      "ProofStrip",
      "DataTable",
      "LineChart",
      "AreaChart",
      "BarChart",
      "DonutChart",
      "Heatmap",
      "Drawer",
      "TimeWindowSelector",
      "DashboardLoadingShell",
      "DataFreshnessStrip",
      "StaleDataBadge",
      "PartialDataBanner",
      "DashboardQueryBoundary"
    ],
  enforcement:
    [
      "tier3_without_dashboard_kit",
      "chart_without_approved_component",
      "prototype_preview_in_surface",
      "visual_selector_not_dev_gated",
      "raw_svg_chart_candidate",
      "axisless_micro_chart",
      "crowded_table_layout",
      "loading_without_dashboard_loading_shell",
      "missing_data_freshness_state",
      "unbounded_table_without_pagination",
      "large_inline_payload_without_deferred_loading",
      "tier3_without_loading_performance_contract",
      "tier3.loadingPerformanceContractMissing",
      "tier3.dataFreshnessMissing",
      "tier3.paginationEvidenceMissing"
    ]
}, null, 2));

if (missing.length) {
  process.exit(1);
}
