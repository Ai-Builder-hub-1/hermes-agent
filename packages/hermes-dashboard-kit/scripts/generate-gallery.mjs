import fs from "node:fs";
import path from "node:path";
import {
  getDashboardKitComponentInventory,
  getDashboardKitReferenceFamilies,
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
  const values =
    Object.values(score).filter((value) => Number.isFinite(value));
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
  const averageScore =
    scores.length
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : null;

  return {
    averageScore,
    approved:
      items.filter((item) => item.reviewStatus === "approved").length,
    reviewing:
      items.filter((item) => item.reviewStatus === "reviewing").length,
    draft:
      items.filter((item) => item.reviewStatus === "draft").length,
    needsRedesign:
      items.filter((item) => item.reviewStatus === "needs-redesign").length,
    blockedProjects:
      items.flatMap((item) => item.projectReadiness || []).filter((item) => item.status === "blocked").length
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
| Average review score | ${data.reviewSummary.averageScore || "n/a"} |
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
      renderLineChart({
        title:
          "Approval trend",
        subtitle:
          "X axis: day · Y axis: approvals",
        data:
          chartData,
        xKey:
          "x",
        yKey:
          "y",
        xLabel:
          "Day",
        yLabel:
          "Approvals",
        reviewId:
          "hdk.gallery.actual.line-chart"
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
    return `<section class="hdk-card" data-hdk-component="DetailDrawerDemo" data-review-id="hdk.gallery.actual.drawer">
      <div class="hdk-card__header"><h2>Selected detail drawer</h2><p>Preserve context while showing facts, proof, charts, and actions.</p></div>
      <div class="hdk-market-browser">
        <div class="hdk-market-browser__tape">${renderDataTable({
          columns:
            [
              { key: "item", label: "Item" },
              { key: "status", label: "Status" },
              { key: "age", label: "Age" }
            ],
          rows:
            tableRows,
          pageSize:
            10,
          total:
            tableRows.length
        })}</div>
        <aside class="hdk-market-browser__detail">${renderLineChart({
          title: "Selected item history",
          data: chartData,
          xKey: "x",
          yKey: "y",
          xLabel: "Day",
          yLabel: "Value"
        })}</aside>
      </div>
    </section>`;
  }

  if (id === "market-browser") {
    return renderMarketExplorerPage({
      note:
        "Actual kit output: browse first, then filter/search inside category.",
      categories:
        [
          { key: "all", label: "All live", count: 488 },
          { key: "sports", label: "Sports", count: 240 },
          { key: "politics", label: "Politics", count: 62 },
          { key: "financials", label: "Financials", count: 41 }
        ],
      topics:
        [
          { key: "all", label: "All", count: 488 },
          { key: "nba", label: "Basketball", count: 72 },
          { key: "elections", label: "Elections", count: 62 }
        ],
      topMovers:
        [
          { id: "m1", title: "Will Team A win tonight?", moveLabel: "+8c", movementCents: 8 },
          { id: "m2", title: "Rate decision this week?", moveLabel: "-4c", movementCents: -4 }
        ],
      markets:
        [
          { title: "Will Team A win tonight?", subtitle: "Sports · basketball", mid: "54c", spread: "3c", snapshots: "28" },
          { title: "Rate decision this week?", subtitle: "Financials · macro", mid: "47c", spread: "4c", snapshots: "17" }
        ],
      title:
        "Sports live markets",
      visibleLabel:
        "240 watched",
      countLabel:
        "488 live",
      reviewId:
        "hdk.gallery.actual.market-browser"
    });
  }

  if (id === "media-workflow") {
    return renderContentPackageWorkspace({
      title:
        "Content package review",
      package:
        {
          brand:
            "Unimportant News",
          platform:
            "YouTube",
          status:
            "reviewing",
          seoScore:
            "82",
          transcriptStatus:
            "complete",
          description:
            "Thumbnail, transcript-derived SEO, channel destinations, and posting proof.",
          copy:
            "A direct upload-ready description with title, summary, tags, and publishable channel state."
        },
      assets:
        [
          { label: "Thumbnail PNG", href: "#" },
          { label: "Video link", href: "#" }
        ],
      checklist:
        [
          { label: "Thumbnail attached", status: "approved" },
          { label: "SEO copy generated", status: "approved" },
          { label: "Posting result", status: "reviewing" }
        ],
      reviewId:
        "hdk.gallery.actual.media-workflow"
    });
  }

  if (id === "calendar-planning") {
    return renderMealPlannerCalendar({
      title:
        "Meal planner calendar",
      columns:
        [
          { key: "mon", label: "Mon" },
          { key: "tue", label: "Tue" },
          { key: "wed", label: "Wed" },
          { key: "thu", label: "Thu" },
          { key: "fri", label: "Fri" }
        ],
      rows:
        [
          {
            label:
              "Dinner",
            detail:
              "Manual plus generated planning",
            values:
              {
                mon: { value: "Chicken", status: "approved" },
                tue: { value: "Open", status: "draft" },
                wed: { value: "Salmon", status: "approved" },
                thu: { value: "Generate", status: "reviewing" },
                fri: { value: "Turkey", status: "approved" }
              }
          },
          {
            label:
              "Prep",
            detail:
              "Broad checklist",
            values:
              {
                mon: { value: "Rice", status: "approved" },
                tue: { value: "Skip", status: "muted" },
                wed: { value: "Greens", status: "approved" },
                thu: { value: "TBD", status: "draft" },
                fri: { value: "Potatoes", status: "approved" }
              }
          }
        ],
      reviewId:
        "hdk.gallery.actual.calendar"
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
