import fs from "node:fs";
import path from "node:path";
import {
  getDashboardKitComponentInventory,
  getDashboardKitReferenceFamilies,
  renderComponentQualityMaturityGraph,
  renderBarChart,
  renderContentPackageWorkspace,
  renderDashboardShell,
  renderDataTable,
  renderDashboardKitGalleryDocument,
  renderDonutChart,
  renderGovernanceChecklist,
  renderLineChart,
  renderMarketExplorerPage,
  renderMealPlannerCalendar,
  renderPremiumComparisonChart,
  renderPremiumDrilldownWorkspace,
  renderPremiumMarketBrowser,
  renderPremiumMediaApprovalWorkspace,
  renderPremiumPlannerCalendar,
  renderStateChecklist
} from "../src/index.js";

const root =
  path.resolve(new URL("../../..", import.meta.url).pathname);
const kitRoot =
  path.join(root, "packages/hermes-dashboard-kit");
const outputDir =
  path.join(root, "docs/design");
const webOutput =
  path.join(root, "web/src/pages/dashboard-kit-gallery-data.ts");
const webCssOutput =
  path.join(root, "web/src/pages/dashboard-kit-gallery-kit.css");
const css =
  fs.readFileSync(path.join(kitRoot, "src/dashboard-kit.css"), "utf8");
const reviewRegistry =
  readReviewRegistry();
const visualBaselines =
  readJsonFile("adoption/component-visual-baselines.json", {
    version:
      0,
    route:
      null,
    viewports:
      [],
    themes:
      [],
    families:
      []
  });
const inventory =
  mergeReviewRegistry(getDashboardKitComponentInventory(), reviewRegistry);
const references =
  getDashboardKitReferenceFamilies();
const summary =
  inventory.reduce((acc, item) => {
    acc[item.status] =
      (acc[item.status] || 0) + 1;
    return acc;
  }, {});
const componentCount =
  new Set(inventory.flatMap((item) => item.components)).size;
const showroom =
  buildShowroom(inventory);
const qualityGraphHtml =
  renderComponentQualityMaturityGraph({
    families:
      inventory,
    review:
      reviewRegistry.families || []
  });
const reviewSummary =
  summarizeReviewRegistry(inventory);
const report =
  {
    generatedAt:
      new Date().toISOString(),
    package:
      "@hermes/dashboard-kit",
    purpose:
      "Visible component intake and approval status for package-native dashboard migrations.",
    componentFamilies:
      inventory.length,
    namedComponents:
      componentCount,
    statusSummary:
      summary,
    reviewSummary,
    requiredHumanReview:
      inventory
        .filter((item) => item.status !== "approved")
        .map((item) => ({
          id:
            item.id,
          family:
            item.family,
          status:
            item.status,
          targetTier:
            item.targetTier,
          userRole:
            item.userRole,
          reviewStatus:
            item.reviewStatus,
          reviewScore:
            item.reviewScore,
          nextActions:
            item.nextActions || []
        })),
    references,
    reviewRegistry:
      {
        version:
          reviewRegistry.version,
        updatedAt:
          reviewRegistry.updatedAt,
        purpose:
          reviewRegistry.purpose
      },
    visualBaselines:
      {
        version:
          visualBaselines.version,
        route:
          visualBaselines.route,
        viewports:
          visualBaselines.viewports,
        themes:
          visualBaselines.themes,
        requiredStates:
          visualBaselines.requiredStates || [],
        approvalRules:
          visualBaselines.approvalRules || [],
        requiredCaptureCount:
          (visualBaselines.families || []).reduce((sum, family) => sum + (family.requiredCaptures || []).length, 0),
        families:
          visualBaselines.families || []
      },
    qualityGraphHtml,
    showroom,
    inventory
  };

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "dashboard-kit-gallery.html"),
  renderDashboardKitGalleryDocument({
    title:
      "Hermes Dashboard Kit Gallery",
    subtitle:
      "Shared component intake, approval status, and premium dashboard references.",
    css,
    inventory,
    references
  }),
  "utf8"
);
fs.writeFileSync(
  path.join(outputDir, "dashboard-kit-gallery-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
fs.writeFileSync(
  path.join(outputDir, "dashboard-kit-gallery-report.md"),
  renderMarkdownReport(report),
  "utf8"
);
fs.writeFileSync(
  webOutput,
  `export const dashboardKitGalleryReport = ${JSON.stringify(report, null, 2)} as const;\n`,
  "utf8"
);
fs.writeFileSync(
  webCssOutput,
  `/* Generated from packages/hermes-dashboard-kit/src/dashboard-kit.css. Do not edit directly. */\n${css}`,
  "utf8"
);

console.log(JSON.stringify({
  status:
    "ready",
  html:
    "docs/design/dashboard-kit-gallery.html",
  report:
    "docs/design/dashboard-kit-gallery-report.json",
  markdown:
    "docs/design/dashboard-kit-gallery-report.md",
  webData:
    "web/src/pages/dashboard-kit-gallery-data.ts",
  webCss:
    "web/src/pages/dashboard-kit-gallery-kit.css",
  componentFamilies:
    inventory.length,
  namedComponents:
    componentCount,
  statusSummary:
    summary,
  reviewSummary
}, null, 2));

function readReviewRegistry() {
  return readJsonFile("adoption/component-review-registry.json", {
    version:
      0,
    updatedAt:
      null,
    purpose:
      "No component review registry found.",
    families:
      []
  });
}

function readJsonFile(relativePath, fallback) {
  const filePath =
    path.join(kitRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function mergeReviewRegistry(items, registry) {
  const byId =
    new Map((registry.families || []).map((item) => [item.id, item]));

  return items.map((item) => {
    const review =
      byId.get(item.id) || {};
    const reviewStatus =
      review.reviewStatus || item.status;
    const reviewScore =
      scoreAverage(review.score);

    return {
      ...item,
      status:
        reviewStatus,
      reviewStatus,
      reviewer:
        review.reviewer || null,
      reviewedAt:
        review.reviewedAt || null,
      approvedVariants:
        review.approvedVariants || [],
      blockedVariants:
        review.blockedVariants || [],
      reviewScore,
      score:
        review.score || null,
      notes:
        review.notes || [],
      closureEvidence:
        review.closureEvidence || [],
      nextActions:
        review.nextActions || [],
      projectReadiness:
        review.projectReadiness || []
    };
  });
}

function scoreAverage(score) {
  if (!score) {
    return null;
  }
  const maturityDimensions =
    [
      "visualPolish",
      "interactionCompleteness",
      "stateCoverage",
      "domainIntelligence",
      "adoptionReadiness"
    ];
  const values =
    maturityDimensions
      .map((dimension) => {
        if (dimension === "domainIntelligence") {
          return score.domainIntelligence ?? score.interactionCompleteness;
        }
        if (dimension === "adoptionReadiness") {
          return score.adoptionReadiness ?? score.projectAdoption;
        }
        return score[dimension];
      })
      .filter((value) => Number.isFinite(value));
  if (!values.length) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function summarizeReviewRegistry(items) {
  const scores =
    items
      .map((item) => item.reviewScore)
      .filter((value) => Number.isFinite(value));
  const projectAdoptionScores =
    items
      .map((item) => item.score?.projectAdoption)
      .filter((value) => Number.isFinite(value));
  const averageScore =
    scores.length
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : null;
  const downstreamAdoptionScore =
    projectAdoptionScores.length
      ? Math.round(projectAdoptionScores.reduce((sum, value) => sum + value, 0) / projectAdoptionScores.length)
      : null;
  const unresolvedNextActions =
    items.flatMap((item) => item.nextActions || []);
  const familiesMissingClosureEvidence =
    items.filter((item) => !(item.closureEvidence || []).length).map((item) => item.id);

  return {
    averageScore,
    downstreamAdoptionScore,
    approved:
      items.filter((item) => item.reviewStatus === "approved").length,
    reviewing:
      items.filter((item) => item.reviewStatus === "reviewing").length,
    draft:
      items.filter((item) => item.reviewStatus === "draft").length,
    needsRedesign:
      items.filter((item) => item.reviewStatus === "needs-redesign").length,
    blockedProjects:
      items.flatMap((item) => item.projectReadiness || []).filter((item) => item.status === "blocked").length,
    unresolvedNextActions:
      unresolvedNextActions.length,
    familiesMissingClosureEvidence,
    level5Ready:
      averageScore === 100 &&
      items.every((item) => item.reviewStatus === "approved") &&
      !unresolvedNextActions.length &&
      !familiesMissingClosureEvidence.length
  };
}

function renderMarkdownReport(data) {
  return `# Dashboard Kit Gallery Report

Generated: ${data.generatedAt}

Purpose: ${data.purpose}

## Summary

| Metric | Value |
| --- | ---: |
| Component families | ${data.componentFamilies} |
| Named components | ${data.namedComponents} |
| Approved families | ${data.statusSummary.approved || 0} |
| Reviewing families | ${data.statusSummary.reviewing || 0} |
| Draft families | ${data.statusSummary.draft || 0} |
| Central kit review score | ${data.reviewSummary.averageScore || "n/a"} |
| Downstream adoption score | ${data.reviewSummary.downstreamAdoptionScore || "n/a"} |
| Level 5 ready | ${data.reviewSummary.level5Ready ? "yes" : "no"} |
| Unresolved kit next actions | ${data.reviewSummary.unresolvedNextActions || 0} |
| Blocked project adoptions | ${data.reviewSummary.blockedProjects || 0} |
| Required visual captures | ${data.visualBaselines.requiredCaptureCount || 0} |

## Visual Baseline Matrix

- Route: \`${data.visualBaselines.route || "not configured"}\`
- Viewports: ${data.visualBaselines.viewports.map((viewport) => `${viewport.id} ${viewport.width}x${viewport.height}`).join(", ") || "none"}
- Themes: ${data.visualBaselines.themes.join(", ") || "none"}
- Required states: ${data.visualBaselines.requiredStates.join(", ") || "none"}

${data.visualBaselines.approvalRules.map((rule) => `- ${rule}`).join("\n")}

## Human Review Queue

${data.requiredHumanReview.map((item) => `- **${item.family}** (${item.status}, ${item.targetTier}, score ${item.reviewScore || "n/a"}): ${item.userRole}${item.nextActions.length ? ` Next: ${item.nextActions[0]}` : ""}`).join("\n") || "- No pending review items."}

## Component Families

| Family | Status | Score | Target | Components | References |
| --- | --- | ---: | --- | --- | --- |
${data.inventory.map((item) => `| ${item.family} | ${item.status} | ${item.reviewScore || "n/a"} | ${item.targetTier} | ${item.components.join(", ")} | ${item.references.join(", ")} |`).join("\n")}

## Registry Notes

${data.inventory.map((item) => `### ${item.family}

- Approved variants: ${(item.approvedVariants || []).join(", ") || "none yet"}
- Blocked variants: ${(item.blockedVariants || []).join(", ") || "none"}
- Notes: ${(item.notes || []).join(" ")}
- Closure evidence: ${(item.closureEvidence || []).join(" ")}
- Next actions: ${(item.nextActions || []).join(" ")}
`).join("\n")}

## Showroom Review

${data.showroom.map((item) => `- **${item.family}** (${item.reviewScore || "n/a"}): ${item.acceptance.join(" ")} Variants: ${item.variants.join(", ")}.`).join("\n")}

## How To Use This

1. Open \`docs/design/dashboard-kit-gallery.html\`.
2. Review the status, density, chart/table/drawer examples, and reference families.
3. Mark component families as \`approved\`, \`reviewing\`, \`draft\`, \`needs-redesign\`, or \`deprecated\`.
4. Only migrate project dashboards with approved families unless the project manifest records an exception.
`;
}

function buildShowroom(items) {
  const defaults =
    {
      variants:
        ["default", "compact", "loading", "empty", "stale", "error", "mobile"],
      acceptance:
        [
          "The preview must make the operator decision obvious.",
          "Overflow, empty, stale, and error states must look intentional."
        ],
      projectUses:
        ["All governed dashboards"],
      previewKind:
        "state"
    };
  const byId =
    {
      "shell-navigation":
        {
          variants:
            ["expanded sidebar", "collapsed sidebar", "mobile drawer", "command header", "proof strip"],
          acceptance:
            [
              "There is exactly one shell and one route model.",
              "Navigation labels remain readable and the main pane owns scrolling."
            ],
          projectUses:
            ["Kashi VC", "Media Engine", "Media Business Operations", "Meal Assistant"],
          previewKind:
            "shell"
        },
      "metric-proof":
        {
          variants:
            ["metric strip", "proof strip", "state checklist", "freshness strip", "overflow stress"],
          acceptance:
            [
              "Metrics are compact, text-safe, and tied to freshness.",
              "Debug telemetry is hidden unless it changes an operator decision."
            ],
          projectUses:
            ["Media Business Operations", "Kashi VC", "Hermes OS", "TLC OS"],
          previewKind:
            "metrics"
        },
      "chart-suite":
        {
          variants:
            ["line", "area", "bar", "donut", "heatmap", "scatter", "candlestick", "anomaly"],
          acceptance:
            [
              "Primary charts have visible axes, units, legends, and time windows.",
              "Charts never fall back to hand-drawn placeholder paths for Tier 3."
            ],
          projectUses:
            ["Kashi Market Browser", "Media Engine Brand Activity", "Cost Intelligence", "Learning Ledger"],
          previewKind:
            "charts"
        },
      "tables-queues":
        {
          variants:
            ["approval queue", "evidence table", "comparison table", "toolbar sorting", "pagination"],
          acceptance:
            [
              "Tables sit inside one card, use toolbar controls, and paginate after ten rows.",
              "Large evidence tables do not sit side-by-side."
            ],
          projectUses:
            ["Media Engine QA Review", "Media Business Ops", "Kashi Experiments", "TLC OKRs"],
          previewKind:
            "table"
        },
      "drawers-drilldowns":
        {
          variants:
            ["right drawer", "market detail", "approval detail", "issue detail", "mobile bottom sheet"],
          acceptance:
            [
              "Drilldowns preserve browsing context.",
              "Immediate facts, evidence, charts, and actions are visually separated."
            ],
          projectUses:
            ["Kashi Market Detail", "Media Approval Review", "Meal Day Planner"],
          previewKind:
            "drawer"
        },
      "market-browser":
        {
          variants:
            ["category browser", "sub-category rail", "market tape", "selected market", "stream proof"],
          acceptance:
            [
              "Operators can browse categories without search-first behavior.",
              "Snapshot and stream states explain whether chart data is live, partial, stale, or insufficient."
            ],
          projectUses:
            ["Kashi VC Market Browser", "Kashi Live Command"],
          previewKind:
            "market"
        },
      "media-workflow":
        {
          variants:
            ["package card", "approve/decline", "publishable channels", "posting proof", "Discord handoff"],
          acceptance:
            [
              "Approval, rejection reason, channel destination, asset readiness, and posting result are visible.",
              "Dashboard and Discord payloads do not duplicate non-actionable banners."
            ],
          projectUses:
            ["Media Engine", "Media Business Operations", "Unimportant News video pipeline"],
          previewKind:
            "media"
        },
      "calendar-planning":
        {
          variants:
            ["month grid", "selected day", "multi-day range", "right planning drawer", "meal library"],
          acceptance:
            [
              "Calendar views look like calendar products, not disconnected cards.",
              "Manual and generated planning states are clear."
            ],
          projectUses:
            ["Meal Assistant", "Scheduling surfaces", "Media calendar"],
          previewKind:
            "calendar"
        },
      "governance-adoption":
        {
          variants:
            ["adoption status", "tier score", "exception expiry", "proof evidence", "next action"],
          acceptance:
            [
              "The route shows what is approved, blocked, stale, missing, and next.",
              "Exceptions have owner, reviewer, reason, and expiry."
            ],
          projectUses:
            ["Nous Hermes Agent", "Hermes OS", "All project migrations"],
          previewKind:
            "governance"
        }
    };

  return items.map((item) => ({
    id:
      item.id,
    family:
      item.family,
    status:
      item.status,
    targetTier:
      item.targetTier,
      components:
        item.components,
      references:
        item.references,
      reviewScore:
        item.reviewScore,
      reviewer:
        item.reviewer,
      reviewedAt:
        item.reviewedAt,
      approvedVariants:
        item.approvedVariants || [],
      blockedVariants:
        item.blockedVariants || [],
      notes:
        item.notes || [],
      nextActions:
        item.nextActions || [],
      projectReadiness:
        item.projectReadiness || [],
      demoHtml:
        buildActualDemoHtml(item.id),
      ...defaults,
      ...(byId[item.id] || {})
  }));
}

function buildActualDemoHtml(id) {
  const chartData =
    [
      { x: "Mon", y: 12, label: "Mon" },
      { x: "Tue", y: 18, label: "Tue" },
      { x: "Wed", y: 14, label: "Wed" },
      { x: "Thu", y: 27, label: "Thu" },
      { x: "Fri", y: 34, label: "Fri" },
      { x: "Sat", y: 30, label: "Sat" },
      { x: "Sun", y: 42, label: "Sun" }
    ];
  const tableRows =
    [
      { item: "Finance for Thought carousel", status: "approved", owner: "Ops", age: "1h" },
      { item: "Unimportant News video", status: "reviewing", owner: "Human", age: "2h" },
      { item: "Kashi live market", status: "partial", owner: "Kashi", age: "4m" },
      { item: "Media proof capture", status: "blocked", owner: "Hermes", age: "1d" }
    ];

  if (id === "shell-navigation") {
    return renderDashboardShell({
      title:
        "Live Command",
      subtitle:
        "Find the live market worth inspecting now.",
      activeId:
        "live",
      navGroups:
        [
          {
            id:
              "command",
            label:
              "Command",
            items:
              [
                { id: "live", label: "Live Command", shortLabel: "Live" },
                { id: "browser", label: "Market Browser", shortLabel: "Browse" },
                { id: "daily", label: "Daily Intelligence", shortLabel: "Daily" }
              ]
          }
        ],
      sidebarStatus:
        "Proof route ready",
      children:
        `<section class="hdk-card"><div class="hdk-card__header"><h2>Operator workspace</h2><p>Single shell, bounded page scroll, active route visible.</p></div></section>`,
      reviewId:
        "hdk.gallery.actual.shell"
    });
  }

  if (id === "metric-proof") {
    return renderStateChecklist({
      title:
        "Proof readiness",
      items:
        [
          { label: "Live data loaded", status: "approved", detail: "2 minutes ago" },
          { label: "Charts have axes", status: "approved", detail: "count by day" },
          { label: "Production proof", status: "reviewing", detail: "desktop pending" }
        ],
      reviewId:
        "hdk.gallery.actual.metric-proof"
    });
  }

  if (id === "chart-suite") {
    return [
      renderPremiumComparisonChart({
        title:
          "Brand output comparison",
        subtitle:
          "X axis: day · Y axis: count. Add or remove states and compare brands behind the same trend surface.",
        data:
          [
            { label: "Mon", approved: 22, posted: 18, rejected: 5 },
            { label: "Tue", approved: 28, posted: 21, rejected: 4 },
            { label: "Wed", approved: 24, posted: 22, rejected: 7 },
            { label: "Thu", approved: 34, posted: 29, rejected: 3 },
            { label: "Fri", approved: 39, posted: 35, rejected: 6 },
            { label: "Sat", approved: 32, posted: 28, rejected: 5 },
            { label: "Sun", approved: 45, posted: 41, rejected: 2 }
          ],
        activeMetric:
          "approved",
        reviewId:
          "hdk.gallery.actual.premium-comparison-chart"
      }),
      renderBarChart({
        title:
          "Issue volume",
        subtitle:
          "X axis: day · Y axis: issues",
        data:
          chartData.map((item, index) => ({ ...item, y: [7, 5, 11, 6, 3, 9, 4][index] })),
        xKey:
          "x",
        yKey:
          "y",
        xLabel:
          "Day",
        yLabel:
          "Issues",
        reviewId:
          "hdk.gallery.actual.bar-chart"
      }),
      renderDonutChart({
        title:
          "Channel mix",
        data:
          [
            { label: "Instagram", value: 42 },
            { label: "Facebook", value: 28 },
            { label: "YouTube", value: 30 }
          ],
        reviewId:
          "hdk.gallery.actual.donut-chart"
      })
    ].join("");
  }

  if (id === "tables-queues") {
    return renderDataTable({
      caption:
        "Approval queue",
      columns:
        [
          { key: "item", label: "Item" },
          { key: "status", label: "Status" },
          { key: "owner", label: "Owner" },
          { key: "age", label: "Age" }
        ],
      rows:
        tableRows,
      pageSize:
        10,
      total:
        24,
      reviewId:
        "hdk.gallery.actual.data-table"
    });
  }

  if (id === "drawers-drilldowns") {
    return renderPremiumDrilldownWorkspace({
      reviewId:
        "hdk.gallery.actual.premium-drilldown"
    });
  }

  if (id === "market-browser") {
    return renderPremiumMarketBrowser({
      reviewId:
        "hdk.gallery.actual.premium-market-browser"
    });
  }

  if (id === "media-workflow") {
    return renderPremiumMediaApprovalWorkspace({
      reviewId:
        "hdk.gallery.actual.premium-media-workflow"
    });
  }

  if (id === "calendar-planning") {
    return renderPremiumPlannerCalendar({
      reviewId:
        "hdk.gallery.actual.premium-planner-calendar"
    });
  }

  if (id === "governance-adoption") {
    return renderGovernanceChecklist({
      title:
        "Tier 3 promotion gate",
      subtitle:
        "Project cannot promote without component, proof, and visual evidence.",
      items:
        [
          { title: "Package-native import", detail: "@hermes/dashboard-kit detected", status: "approved" },
          { title: "Visual baseline", detail: "desktop and mobile required", status: "reviewing" },
          { title: "Static route drift", detail: "no production static app routes", status: "blocked" }
        ],
      metrics:
        [
          { label: "Readiness", value: "70%" },
          { label: "Blocked", value: "3" }
        ],
      reviewId:
        "hdk.gallery.actual.governance"
    });
  }

  return "";
}
