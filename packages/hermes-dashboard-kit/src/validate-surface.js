import fs from "node:fs";
import path from "node:path";

const args =
  parseArgs(process.argv.slice(2));
const files =
  expandInputs(args._);
const findings =
  [];

for (const filePath of files) {
  const text =
    fs.readFileSync(filePath, "utf8");
  validateFile(filePath, text);
}

const summary =
  {
    checked:
      files.length,
    status:
      findings.some((finding) => finding.severity === "error") ? "fail" : findings.length ? "warn" : "pass",
    findings
  };

console.log(JSON.stringify(summary, null, 2));

if (summary.status === "fail") {
  process.exit(1);
}

function validateFile(filePath, text) {
  if (filePath.endsWith(path.join("src", "validate-surface.js"))) {
    return;
  }
  const normalizedPath =
    filePath.split(path.sep).join("/");
  if (/packages\/hermes-dashboard-kit\/src\/.+\.(ts|tsx)$/.test(normalizedPath)) {
    return;
  }

  const isDashboard =
    /dashboard|cockpit|command|market|operations|planner|calendar|review/i.test(filePath) ||
    /data-experience-tier|data-hdk-component|data-review-id|dashboard-kit/i.test(text);
  if (!isDashboard) {
    return;
  }

  const hasKit =
    /dashboard-kit\.css|@hermes\/dashboard-kit|data-hdk-component|hdk-/.test(text);
  const claimsTier3 =
    /data-experience-tier=["'](?:tier-3|3)|Tier 3|product-grade cockpit/i.test(text);
  const hasChartLanguage =
    /chart|sparkline|timeline|heatmap|donut|bar|line|area|axis|trend/i.test(text);
  const hasApprovedChart =
    /data-hdk-component=["'](?:LineChart|AreaChart|BarChart|DonutChart|Heatmap)|hdk-chart|hdk-donut|hdk-heatmap/.test(text);
  const hasTableLanguage =
    /<table|DataTable|market tape|queue|log|rows|records|events/i.test(text);
  const hasApprovedPagination =
    /data-hdk-component=["']Pagination|hdk-pagination|pageSize|page-size|pagination/i.test(text);
  const hasTableToolbar =
    /data-table-sort-toolbar|data-hdk-component=["'](?:DataTable|DataTableTabs)|hdk-table-toolbar|Sort by[\s\S]{0,260}(?:Order|Ascending|Descending)|data-sort-direction/i.test(text);
  const hasSortableTable =
    /data-sortable-table|data-sort-key|data-table-sort-key|data-brand-sort-key|aria-sort|sortable/i.test(text);
  const sortableHeaderControls =
    (text.match(/<th\b[\s\S]{0,280}(?:data-sort-key|aria-sort|sort\b|Sort)/gi) || []).length +
    (text.match(/<button\b[^>]*(?:data-sort-key|class=["'][^"']*sort|aria-label=["'][^"']*sort)/gi) || []).length;
  const hasRowCountContext =
    /data-row-count|hdk-row-count|data-hdk-component=["']Pagination|Showing\s+\d|(?:\d+\s+)?(?:rows|brands|items|runs|approvals|records)<\//i.test(text);
  const hasPrimaryChartPanel =
    /data-hdk-component=["'](?:ChartPanel|LineChart|AreaChart|BarChart|DonutChart|Heatmap|ScatterQuadrantChart|AnomalyBandChart|DistributionPlot|BoxPlot|ViolinPlot|SankeyFlow|Treemap|Sunburst|CorrelationMatrix|CandlestickChart)|hdk-chart-panel|data-chart-type|data-x-axis|data-y-axis/i.test(text);
  const chartableEvidenceLanguage =
    /(activity|trend|exception|issue|error|usage|qa|approval|review|brand|market|snapshot|stream|capacity|story|crawl|cost|telemetry|queue)/i.test(text);
  const hasApprovedHelp =
    /data-hdk-component=["'](?:HelpTip|InfoPopover)|hdk-help|hdk-info-popover|HelpTip|InfoPopover/i.test(text);
  const hasVisibleHelperCopy =
    /<p[^>]*class=["'][^"']*(?:helper|description|meta)[^"']*["'][^>]*>[^<]{48,}</i.test(text);
  const hasLocalTooltip =
    /tooltip|data-help|help-tip|popover/i.test(text) && !hasApprovedHelp;
  const hasLoadingLanguage =
    /loading|hydrating|skeleton|spinner|please wait/i.test(text);
  const hasApprovedLoading =
    /data-hdk-component=["'](?:DashboardLoadingShell|SkeletonMetricCard|SkeletonChart|SkeletonTable|SkeletonDashboardGrid|DashboardQueryBoundary)|hdk-loading-shell|hdk-skeleton|DashboardLoadingShell|DashboardQueryBoundary/.test(text);
  const hasFreshnessState =
    /data-hdk-component=["'](?:DataFreshnessStrip|StaleDataBadge|PartialDataBanner|ProofStrip|StatePanel|DashboardQueryBoundary)|hdk-data-freshness-strip|hdk-stale-badge|hdk-partial-banner|data-data-state|updatedAt|lastUpdated|ageSeconds|freshness|stale|partial|empty|error/i.test(text);
  const hardCodedRows =
    (text.match(/<tr\b/gi) || []).length;
  const hasHardcodedDefault25 =
    /data-page-size=["']25["']|defaultPageSize\s*=\s*25|pageSize\s*=\s*25|pageSize:\s*25/i.test(text);
  const hasLocalOneOffSpacing =
    /(?:gap|padding|margin(?:-[a-z]+)?):\s*(?:14|15|17|18|19|21|22|23|26|27|28|29|30|31)px/i.test(text) &&
    !/--hdk-space|var\(--hdk-space|manifest exception|spacing exception/i.test(text);
  const inlinePayloadSize =
    Math.max(...(text.match(/\[[\s\S]{12000,}?\]|\{[\s\S]{12000,}?\}/g) || [""]).map((match) => match.length));
  const localSidebarOverride =
    /(?:\.|class(?:Name)?=["'][^"']*)(?:sidebar|sidebar-rail|sidebar-toggle|nav-item|topbar|app-shell|dashboard-shell|meal-sidebar|media-sidebar|kashi-sidebar|roc-sidebar)\b/i.test(text) &&
    !/hdk-sidebar|hdk-sidebar-rail|hdk-sidebar-toggle|data-sidebar-toggle|manifest exception|sidebar exception/i.test(text);
  const copiedKitCss =
    /hermes-dashboard-kit\.css/i.test(filePath) &&
    !/packages\/hermes-dashboard-kit\/(?:src|static)\/dashboard-kit\.css|packages\/hermes-dashboard-kit\/static\/hermes-dashboard-kit\.css/i.test(normalizedPath);
  const sidebarRuntimeEvidence =
    /renderSidebarRuntimeScript|data-hdk-component=["']SidebarRuntime|data-sidebar-toggle|sidebar-collapsed|hdkSidebarCollapsed|data-sidebar-state/i.test(text);

  if (claimsTier3 && !hasKit) {
    add("error", filePath, "tier3_without_dashboard_kit", "Tier 3 surfaces must use @hermes/dashboard-kit components or CSS.");
  }

  if (claimsTier3 && copiedKitCss) {
    add("error", filePath, "tier3_copied_dashboard_kit_css", "Tier 3 projects must consume the package dashboard-kit CSS instead of maintaining a project-local copied CSS file.");
  }

  if (claimsTier3 && localSidebarOverride) {
    add("error", filePath, "tier3_local_sidebar_override", "Tier 3 dashboards must declare routes and use the dashboard-kit sidebar instead of local sidebar/topbar/nav primitives.");
  }

  if (claimsTier3 && /DashboardSidebar|hdk-sidebar|hdk-sidebar-rail|data-hdk-component=["']Sidebar/i.test(text) && !sidebarRuntimeEvidence) {
    add("warn", filePath, "tier3_sidebar_runtime_missing", "Tier 3 sidebars should include collapse/drawer runtime evidence through renderSidebarRuntimeScript or data-sidebar-toggle.");
  }

  if (hasChartLanguage && !hasApprovedChart) {
    add("error", filePath, "chart_without_approved_component", "Chart-like surfaces must use approved dashboard-kit chart components.");
  }

  if (/prototype preview/i.test(text)) {
    add("error", filePath, "prototype_preview_in_surface", "Production/review surfaces must not show prototype-preview behavior for real data.");
  }

  if (/visual-selection-bridge\.js/.test(text) && !/dev-only|development only|NODE_ENV/.test(text)) {
    add("error", filePath, "visual_selector_not_dev_gated", "Visual selection bridge must be gated to development-only routes.");
  }

  if (/<svg[\s\S]{0,900}<path[\s\S]{0,900}<\/svg>/i.test(text) && !/hdk-chart|data-hdk-component/.test(text)) {
    add("warn", filePath, "raw_svg_chart_candidate", "Raw SVG chart candidate found. Use dashboard-kit chart components unless this is a non-chart icon.");
  }

  if (/height:\s*(?:40|48|56|64|72)px[\s\S]{0,400}(?:chart|sparkline)/i.test(text) && !/axis|hdk-sparkline/.test(text)) {
    add("warn", filePath, "axisless_micro_chart", "Micro charts are allowed only as secondary sparklines; primary charts require axes and labels.");
  }

  if (/display:\s*grid[\s\S]{0,500}grid-template-columns:\s*repeat\([^)]*,\s*1fr\)[\s\S]{0,900}<table/i.test(text) && !/hdk-table-wrap|tablist|tabs/i.test(text)) {
    add("warn", filePath, "crowded_table_layout", "Multiple tables should use tabs or full-width stacked layouts instead of cramped side-by-side cards.");
  }

  if (hasLoadingLanguage && !hasApprovedLoading) {
    add("warn", filePath, "loading_without_dashboard_loading_shell", "Dashboard loading states should use DashboardLoadingShell, skeletons, or DashboardQueryBoundary.");
  }

  if ((claimsTier3 || hasChartLanguage || hasTableLanguage) && !hasFreshnessState) {
    add("warn", filePath, "missing_data_freshness_state", "Dashboard data surfaces should expose freshness, stale, partial, empty, and error state evidence.");
  }

  if (claimsTier3 && hasTableLanguage && hardCodedRows > 11 && !hasApprovedPagination) {
    add("error", filePath, "tier3_table_over_10_without_pagination", "Tier 3 tables with more than 10 rows must use pagination with 10 / 25 / 50 controls.");
  } else if (hasTableLanguage && hardCodedRows > 100 && !hasApprovedPagination) {
    add("error", filePath, "unbounded_table_without_pagination", "Dashboard tables with large row counts must use pagination or a bounded table component.");
  }

  if (claimsTier3 && hasHardcodedDefault25) {
    add("error", filePath, "table_default_page_size_not_10", "Tier 3 table defaults must show 10 rows first, with 10 / 25 / 50 page-size controls.");
  }

  if (claimsTier3 && hasSortableTable && !hasTableToolbar) {
    add("warn", filePath, "sortable_table_without_toolbar", "Tier 3 sortable tables should use a card-level table toolbar for row count, Sort by, order, filters, and exports.");
  }

  if (claimsTier3 && sortableHeaderControls >= 3 && !hasTableToolbar) {
    add("warn", filePath, "noisy_column_sort_controls", "Dense Tier 3 tables should not repeat visible sort controls across every column header. Use a quiet table toolbar or accessible icon-only header sorting.");
  }

  if (claimsTier3 && hasSortableTable && !hasRowCountContext) {
    add("warn", filePath, "sortable_table_without_row_count_context", "Sortable evidence tables should show a row-count badge or range in the table card toolbar.");
  }

  if (claimsTier3 && hasTableLanguage && chartableEvidenceLanguage && !hasPrimaryChartPanel) {
    add("warn", filePath, "chartable_evidence_without_trend_panel", "Chartable evidence views should place an approved chart/trend panel above the raw table or queue.");
  }

  if (claimsTier3 && hasLocalOneOffSpacing) {
    add("warn", filePath, "tier3_one_off_spacing", "Tier 3 layouts must use dashboard-kit spacing tokens instead of one-off pixel gaps, margins, or padding.");
  }

  if (claimsTier3 && hasVisibleHelperCopy && !hasApprovedHelp) {
    add("warn", filePath, "tier3_helper_copy_without_help_component", "Tier 3 secondary helper copy should use HelpTip or InfoPopover instead of repeated visible helper paragraphs.");
  }

  if (claimsTier3 && hasLocalTooltip) {
    add("warn", filePath, "local_help_tooltip_without_kit_component", "Dashboard help affordances must use HelpTip or InfoPopover instead of local tooltip/help CSS.");
  }

  if (inlinePayloadSize > 12000 && !/deferred|lazy|hydrate|cache|rollup|snapshot/i.test(text)) {
    add("warn", filePath, "large_inline_payload_without_deferred_loading", "Large inline dashboard payloads should be cached, rolled up, or deferred instead of blocking the route.");
  }

  if (claimsTier3 && /(live|usage|issues|errors|orders|snapshots|markets|stories|approval|qa)/i.test(text) && !/DataFreshnessStrip|DashboardQueryBoundary|StaleDataBadge|PartialDataBanner|hdk-data-freshness-strip|data-data-state/i.test(text)) {
    add("warn", filePath, "tier3_without_loading_performance_contract", "Tier 3 operational routes must use dashboard-kit loading, freshness, stale, partial, and error state primitives.");
  }
}

function add(severity, filePath, rule, message) {
  findings.push({
    severity,
    file:
      path.relative(process.cwd(), filePath),
    rule,
    message
  });
}

function expandInputs(inputs) {
  const selected =
    inputs.length ? inputs : ["."];
  const output =
    [];
  for (const input of selected) {
    const resolved =
      path.resolve(input);
    if (!fs.existsSync(resolved)) {
      continue;
    }
    const stat =
      fs.statSync(resolved);
    if (stat.isDirectory()) {
      walk(resolved, output);
    } else if (isSurfaceFile(resolved)) {
      output.push(resolved);
    }
  }
  return output;
}

function walk(dir, output) {
  for (const entry of fs.readdirSync(dir, {
    withFileTypes:
      true
  })) {
    if (["node_modules", ".git", "dist", "build"].includes(entry.name)) {
      continue;
    }
    const fullPath =
      path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
    } else if (isSurfaceFile(fullPath)) {
      output.push(fullPath);
    }
  }
}

function isSurfaceFile(filePath) {
  return /\.(html|tsx|jsx|js|ts|css)$/.test(filePath);
}

function parseArgs(argv) {
  const parsed =
    {
      _:
        []
    };
  for (let index = 0; index < argv.length; index += 1) {
    const arg =
      argv[index];
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }
    const key =
      arg.slice(2);
    const next =
      argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] =
        true;
      continue;
    }
    parsed[key] =
      next;
    index += 1;
  }
  return parsed;
}
