export const EXPERIENCE_TIERS =
  Object.freeze({
    legacyReport:
      "tier-0",
    oneShell:
      "tier-1",
    sharedComponents:
      "tier-2",
    productCockpit:
      "tier-3"
  });

export const DASHBOARD_KIT_REFERENCE_FAMILIES =
  Object.freeze([
    {
      id:
        "market-intelligence",
      label:
        "Market Intelligence",
      references:
        ["Kraken", "Binance", "OKX", "Coinbase", "Mixpanel"],
      extraction:
        "Market browsing should combine category navigation, watchlist/tape scanning, axis-bearing charts, selected-market detail, liquidity/spread context, proof state, and insufficient-data states."
    },
    {
      id:
        "media-operations",
      label:
        "Media Operations",
      references:
        ["Sprout Social", "Adobe Express", "Manus", "Replit", "PlanetScale"],
      extraction:
        "Content operations should separate command triage, approval queues, publishable channels, QA evidence, Discord handoff, posting status, and time-series output health."
    },
    {
      id:
        "business-operations",
      label:
        "Business Operations",
      references:
        ["Asana", "Linear", "Wrike", "Productboard", "Plane"],
      extraction:
        "Business cockpits should show executive rollups, accountability, work queues, decision logs, objective progress, and evidence behind readiness."
    },
    {
      id:
        "planning-calendar",
      label:
        "Planning And Calendar",
      references:
        ["Amie", "Motion", "Jobber", "Time2book", "Assembly"],
      extraction:
        "Planning views should use a real calendar/work surface, selected-day or range drawers, library-to-plan flows, manual override, and clear generated-versus-human state."
    },
    {
      id:
        "cost-performance",
      label:
        "Cost And Performance",
      references:
        ["Vercel", "LangChain", "Mixpanel", "Employment Hero"],
      extraction:
        "Cost dashboards should pair spend timelines with provider attribution, business-unit impact, efficiency ratios, anomaly states, freshness, and drilldowns."
    },
    {
      id:
        "proof-governance",
      label:
        "Proof And Governance",
      references:
        ["Linear", "PlanetScale", "Productboard", "Wrike"],
      extraction:
        "Governance surfaces should make ownership, proof, blockers, exceptions, adoption status, and next action visible without dumping raw audit text."
    }
  ]);

export const RESEARCH_DESK_WORKFLOW_ACTIONS =
  Object.freeze([
    {
      id: "define_research_plan",
      label: "Define plan",
      tab: "overview",
      phase: "Intake",
      fields: ["researchQuestion", "workingThesis", "sourceTargets", "unknowns"],
      description: "Clarify the story question, working thesis, source targets, and unknowns before research expands."
    },
    {
      id: "add_source",
      label: "Add source",
      tab: "evidence",
      phase: "Sourcing",
      fields: ["sourceTitle", "sourceUrl", "sourceClass", "sourceNote"],
      description: "Capture a source candidate, link, source class, and why it matters to the story."
    },
    {
      id: "review_evidence",
      label: "Review evidence",
      tab: "evidence",
      phase: "Evidence",
      fields: ["evidenceNote", "evidenceDisposition"],
      description: "Record whether the evidence supports, weakens, or changes the story direction."
    },
    {
      id: "lock_claims",
      label: "Lock claims",
      tab: "claims",
      phase: "Claim lock",
      fields: ["claim", "claimConfidence", "claimEvidence"],
      description: "Convert research into claims that are backed by evidence and ready for editorial use."
    },
    {
      id: "resolve_gaps",
      label: "Resolve gaps",
      tab: "research-gates",
      phase: "Evidence",
      fields: ["gap", "gapDisposition", "gapOwner"],
      description: "Close, defer, or block a known research gap before outline handoff."
    },
    {
      id: "approve_outline",
      label: "Approve outline",
      tab: "story-tree",
      phase: "Outline",
      fields: ["outlineReadinessNote"],
      description: "Mark the project ready to become an outline only after source, evidence, and claim gates are honest."
    }
  ]);

export function getResearchDeskWorkflowAction(actionId) {
  return RESEARCH_DESK_WORKFLOW_ACTIONS.find((action) => action.id === actionId) || null;
}

export const DASHBOARD_KIT_COMPONENT_INVENTORY =
  Object.freeze([
    {
      id:
        "shell-navigation",
      family:
        "Core Shell",
      status:
        "approved",
      targetTier:
        "tier-3",
      components:
        ["DashboardShell", "OperationalSidebar", "DashboardHeader", "ProofStrip", "DataFreshnessStrip"],
      references:
        ["Linear", "Asana", "Vercel"],
      good:
        "One shell, one sidebar, one route model, compact command header, bounded scroll owner, and proof/freshness visible above the primary work surface.",
      userRole:
        "Approve the navigation grouping, naming, density, collapsed behavior, and whether the page question is obvious."
    },
    {
      id:
        "metric-proof",
      family:
        "Metric And Proof Cards",
      status:
        "approved",
      targetTier:
        "tier-3",
      components:
        ["MetricCard", "StatusPill", "StatePanel", "StateChecklist", "KpiContractTable"],
      references:
        ["Mixpanel", "Vercel", "Wrike"],
      good:
        "Cards are compact, equal-height where useful, text-safe, visibly tied to data freshness, and do not expose implementation telemetry unless actionable.",
      userRole:
        "Reject any metric card that feels like debug noise, duplicate summary, or non-actionable decoration."
    },
    {
      id:
        "chart-suite",
      family:
        "Charts And Comparisons",
      status:
        "reviewing",
      targetTier:
        "tier-3",
      components:
        ["LineChart", "AreaChart", "BarChart", "DonutChart", "Heatmap", "ScatterQuadrantChart", "CandlestickChart", "AnomalyBandChart"],
      references:
        ["Kraken", "OKX", "Mixpanel", "LangChain"],
      good:
        "Primary charts have visible axes, units, time windows, legends, compare controls, hover/focus states, and clear loading/stale/empty/error versions.",
      userRole:
        "Pick the chart density and visual language before we roll it into Kashi, Media Engine, or cost dashboards."
    },
    {
      id:
        "tables-queues",
      family:
        "Tables And Queues",
      status:
        "approved",
      targetTier:
        "tier-3",
      components:
        ["DataTable", "DataTableTabs", "ApprovalQueue", "ActionQueue", "AlertQueue", "WorkOrderQueue"],
      references:
        ["Linear", "Asana", "Manus", "PlanetScale"],
      good:
        "Tables live inside one card, paginate after ten rows, use a toolbar for sort/filter/export, and pair with a trend surface when the data is time-series.",
      userRole:
        "Approve which columns are operator-facing and which details move into drawers."
    },
    {
      id:
        "drawers-drilldowns",
      family:
        "Drawers And Drilldowns",
      status:
        "reviewing",
      targetTier:
        "tier-3",
      components:
        ["DetailDrawer", "MarketVolatilityDrawer", "RunDrilldownPanel", "LocationDetailDrawer", "BottomSheetDrawer"],
      references:
        ["Coinbase", "Jobber", "Productboard"],
      good:
        "Browsing stays in context. Selecting a row opens focused detail with facts, charts, evidence, actions, and honest insufficient-data states.",
      userRole:
        "Tell us what should be visible immediately versus tucked behind evidence/actions."
    },
    {
      id:
        "market-browser",
      family:
        "Market Browser",
      status:
        "reviewing",
      targetTier:
        "tier-3",
      components:
        ["MarketExplorerPage", "MarketBrowserLayout", "MarketTape", "OrderBookLadder", "TimeWindowSelector"],
      references:
        ["Kraken", "Binance", "OKX", "Coinbase"],
      good:
        "Categories and subcategories are navigable without search-first behavior; the tape is scannable; detail charts use real snapshot/stream data and proof states.",
      userRole:
        "Approve the browse model before Kashi replaces static market-browser routes."
    },
    {
      id:
        "media-workflow",
      family:
        "Media Workflow",
      status:
        "reviewing",
      targetTier:
        "tier-3",
      components:
        ["ContentPackageWorkspace", "BrandPortfolioGrid", "ChannelPostabilityMatrix", "QaReviewPanel", "PublishingProofPanel", "ResearchDeskWorkspace"],
      references:
        ["Sprout Social", "Adobe Express", "Manus"],
      good:
        "The operator sees package readiness, approval/decline, publishable channels, QA reason, thumbnail/copy assets, posting success, and research workspaces without duplicate banners or local layout drift.",
      userRole:
        "Define what must show in Discord versus the dashboard and what counts as approve-ready."
    },
    {
      id:
        "calendar-planning",
      family:
        "Calendar And Planning",
      status:
        "draft",
      targetTier:
        "tier-3",
      components:
        ["MealPlannerCalendar", "MealWeekDrawer", "ScheduleTimeline", "CalendarQueue", "MealLibrary"],
      references:
        ["Amie", "Motion", "Jobber", "Time2book"],
      good:
        "Calendar views look like true calendar products, support selected day/range planning, and expose drawer-based planning forms rather than card piles.",
      userRole:
        "Approve the calendar interaction model and form density before Meal Assistant migrates."
    },
    {
      id:
        "governance-adoption",
      family:
        "Governance And Adoption",
      status:
        "approved",
      targetTier:
        "tier-3",
      components:
        ["GovernanceChecklist", "ReadinessDomainMatrix", "DeploymentPromotionPanel", "PermissionAuditPanel", "ComponentIntakeBoard"],
      references:
        ["Linear", "Wrike", "Productboard"],
      good:
        "Every project can see current tier, target tier, missing components, proof evidence, owner, reviewer, exception expiry, and next migration step.",
      userRole:
        "Use this to decide what is approved, what gets rebuilt, and what project should migrate next."
    }
  ]);

export function renderDashboardShell({
  title,
  subtitle = "",
  mark = "H",
  nav = [],
  navGroups = [],
  sidebarCollapsible = true,
  sidebarFooter = "",
  sidebarStatus = "",
  activeId = "",
  actions = "",
  children = "",
  reviewId = "hermes.dashboard-shell",
  tier = EXPERIENCE_TIERS.productCockpit
}) {
  const sidebar =
    renderOperationalSidebar({
      title,
      subtitle,
      mark,
      nav,
      navGroups,
      collapsible:
        sidebarCollapsible,
      activeId,
      footer:
        sidebarFooter,
      status:
        sidebarStatus
    });
  return `
    <div class="hdk-shell" data-hdk-component="DashboardShell" data-experience-tier="${escapeAttr(tier)}" data-review-id="${escapeAttr(reviewId)}">
      ${sidebar}
      <main class="hdk-main">
        <header class="hdk-header" data-hdk-component="Header">
          <div>
            <p class="hdk-eyebrow">Operator Workspace</p>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
          </div>
          ${actions ? `<div class="hdk-header__actions">${actions}</div>` : ""}
        </header>
        ${children}
      </main>
    </div>
  `;
}

export function renderOperationalSidebar({
  title,
  subtitle = "",
  mark = "H",
  nav = [],
  navGroups = [],
  collapsible = true,
  activeId = "",
  status = "",
  footer = "",
  ariaLabel = "Dashboard navigation"
}) {
  const groups =
    navGroups.length
      ? navGroups
      : [
          {
            id:
              "main",
            label:
              "Navigation",
            items:
              nav
          }
        ];

  return `
      <aside class="hdk-sidebar hdk-sidebar-rail" data-hdk-component="Sidebar" data-component="DashboardSidebar">
        <div class="hdk-brand hdk-sidebar-brand" data-sidebar-brand>
          <span class="hdk-brand__mark">${escapeHtml(mark)}</span>
          <span>
            <strong>${escapeHtml(title)}</strong>
            ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
          </span>
          ${collapsible ? `<button class="hdk-sidebar-toggle" type="button" data-sidebar-toggle aria-label="Collapse sidebar" aria-expanded="true">‹</button>` : ""}
        </div>
        <nav class="hdk-nav" aria-label="${escapeAttr(ariaLabel)}">
          ${groups.map((group) => `
            <section class="hdk-nav-group" data-nav-group="${escapeAttr(group.id || group.label || "group")}">
              <p class="hdk-nav-group-title">${escapeHtml(group.label || "Navigation")}</p>
              ${(group.items || []).map((item) => renderNavItem(item, activeId)).join("")}
            </section>
          `).join("")}
        </nav>
        ${(status || footer) ? `
          <div class="hdk-sidebar-footer" data-sidebar-footer>
            ${status ? `<div class="hdk-sidebar-status">${escapeHtml(status)}</div>` : ""}
            ${footer}
          </div>
        ` : ""}
      </aside>`;
}

export function renderSidebarRuntimeScript() {
  return `
    <script data-hdk-component="SidebarRuntime">
      (() => {
        const shell = document.querySelector(".hdk-shell");
        const toggle = document.querySelector("[data-sidebar-toggle]");
        if (!shell || !toggle) return;
        const storageKey = "hdkSidebarCollapsed";
        const apply = (collapsed) => {
          shell.classList.toggle("sidebar-collapsed", collapsed);
          shell.setAttribute("data-sidebar-state", collapsed ? "collapsed" : "expanded");
          toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
          toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
          toggle.textContent = collapsed ? "›" : "‹";
        };
        apply(localStorage.getItem(storageKey) === "true");
        toggle.addEventListener("click", () => {
          const collapsed = !shell.classList.contains("sidebar-collapsed");
          localStorage.setItem(storageKey, collapsed ? "true" : "false");
          apply(collapsed);
        });
      })();
    </script>
  `;
}

export function renderMetricCard({
  label,
  value,
  delta = "",
  tone = "neutral",
  detail = "",
  reviewId = ""
}) {
  return `
    <article class="hdk-card hdk-metric hdk-tone-${escapeAttr(tone)}" data-hdk-component="MetricCard"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${delta || detail ? `<p>${escapeHtml([delta, detail].filter(Boolean).join(" · "))}</p>` : ""}
    </article>
  `;
}

export function renderStatePanel({
  state = "empty",
  title,
  message = "",
  action = "",
  reviewId = ""
}) {
  return `
    <section class="hdk-card hdk-state hdk-state-${escapeAttr(state)}" data-hdk-component="StatePanel"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <span>${escapeHtml(state)}</span>
      <h2>${escapeHtml(title || humanize(state))}</h2>
      ${message ? `<p>${escapeHtml(message)}</p>` : ""}
      ${action ? `<div class="hdk-state__action">${action}</div>` : ""}
    </section>
  `;
}

export function renderProofStrip({
  items = [],
  reviewId = "hdk.proof-strip"
}) {
  return `
    <section class="hdk-proof-strip" data-hdk-component="ProofStrip" data-review-id="${escapeAttr(reviewId)}">
      ${items.map((item) => `
        <article class="hdk-proof hdk-tone-${escapeAttr(item.tone || statusTone(item.status))}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value || item.status || "unknown")}</strong>
          ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
        </article>
      `).join("")}
    </section>
  `;
}

export function renderDataFreshnessStrip({
  items = [],
  reviewId = "hdk.data-freshness"
}) {
  return `
    <section class="hdk-data-freshness-strip" data-hdk-component="DataFreshnessStrip" data-review-id="${escapeAttr(reviewId)}">
      ${items.map((item) => `
        <article class="hdk-freshness hdk-state-${escapeAttr(item.state || "unknown")} hdk-tone-${escapeAttr(item.tone || statusTone(item.state))}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value || item.state || "unknown")}</strong>
          ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
        </article>
      `).join("")}
    </section>
  `;
}

export function renderStaleDataBadge({
  label = "Stale",
  age = "",
  reviewId = ""
}) {
  return `<span class="hdk-stale-badge" data-hdk-component="StaleDataBadge"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>${escapeHtml(label)}${age ? ` · ${escapeHtml(age)}` : ""}</span>`;
}

export function renderPartialDataBanner({
  title = "Partial data",
  message = "Some data is still loading or unavailable. Visible metrics are safe to inspect but not complete.",
  action = "",
  reviewId = ""
}) {
  return `
    <section class="hdk-partial-banner" data-hdk-component="PartialDataBanner"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
      ${action ? `<div>${action}</div>` : ""}
    </section>
  `;
}

export function renderDashboardLoadingShell({
  title = "Loading dashboard",
  description = "Preparing the shell while data hydrates.",
  children = "",
  reviewId = "hdk.loading-shell"
}) {
  return `
    <section class="hdk-loading-shell" data-hdk-component="DashboardLoadingShell" data-review-id="${escapeAttr(reviewId)}">
      <header class="hdk-loading-shell__header">
        <span class="hdk-loading-shell__spinner" aria-hidden="true"></span>
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(description)}</p>
        </div>
      </header>
      <div class="hdk-loading-shell__body">${children || renderSkeletonDashboardGrid()}</div>
    </section>
  `;
}

export function renderSkeletonMetricCard({
  reviewId = ""
} = {}) {
  return `
    <article class="hdk-skeleton-card hdk-skeleton-metric" data-hdk-component="SkeletonMetricCard"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <span></span><strong></strong><p></p>
    </article>
  `;
}

export function renderSkeletonChart({
  reviewId = ""
} = {}) {
  return `
    <article class="hdk-skeleton-card hdk-skeleton-chart" data-hdk-component="SkeletonChart"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <span></span><div></div>
    </article>
  `;
}

export function renderSkeletonTable({
  rows = 5,
  reviewId = ""
} = {}) {
  return `
    <article class="hdk-skeleton-card hdk-skeleton-table" data-hdk-component="SkeletonTable"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${Array.from({ length: rows }).map(() => "<span></span>").join("")}
    </article>
  `;
}

export function renderSkeletonDashboardGrid({
  reviewId = ""
} = {}) {
  return `
    <div class="hdk-skeleton-dashboard-grid" data-hdk-component="SkeletonDashboardGrid"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${renderSkeletonMetricCard()}
      ${renderSkeletonMetricCard()}
      ${renderSkeletonMetricCard()}
      ${renderSkeletonChart()}
      ${renderSkeletonTable()}
    </div>
  `;
}

export function renderDashboardQueryBoundary({
  state = "ready",
  loadingLabel = "Loading data",
  emptyTitle = "No data yet",
  emptyDescription = "The system has not produced records for this view yet.",
  staleMessage = "Showing cached data while a refresh runs.",
  error = "",
  children = "",
  reviewId = ""
}) {
  if (state === "loading") {
    return renderDashboardLoadingShell({
      title:
        loadingLabel,
      reviewId
    });
  }
  if (state === "error") {
    return renderStatePanel({
      state:
        "error",
      title:
        "Unable to load data",
      message:
        error || "The data request failed.",
      reviewId
    });
  }
  if (state === "empty") {
    return renderStatePanel({
      state:
        "empty",
      title:
        emptyTitle,
      message:
        emptyDescription,
      reviewId
    });
  }
  return `
    <div class="hdk-query-boundary" data-hdk-component="DashboardQueryBoundary" data-data-state="${escapeAttr(state)}"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${state === "partial" ? renderPartialDataBanner() : ""}
      ${state === "stale" ? `<div class="hdk-stale-inline">${escapeHtml(staleMessage)}</div>` : ""}
      ${children}
    </div>
  `;
}

export function renderDataTable({
  columns = [],
  rows = [],
  caption = "",
  page = 1,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  total = rows.length,
  reviewId = ""
}) {
  const normalizedPage =
    Math.max(1, Number(page) || 1);
  const normalizedPageSize =
    Math.max(1, Number(pageSize) || 10);
  const start =
    (normalizedPage - 1) * normalizedPageSize;
  const visibleRows =
    rows.slice(start, start + normalizedPageSize);
  const rangeStart =
    total ? start + 1 : 0;
  const rangeEnd =
    total ? Math.min(start + visibleRows.length, total) : 0;
  return `
    <section class="hdk-card hdk-table-card" data-hdk-component="DataTable" data-page-size="${escapeAttr(normalizedPageSize)}" data-pagination="table-window"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${caption ? `<div class="hdk-card__header"><h2>${escapeHtml(caption)}</h2></div>` : ""}
      <div class="hdk-table-wrap" data-hdk-component="TableSurface">
        <table class="hdk-table">
          <thead><tr>${columns.map((column) => `<th scope="col">${escapeHtml(column.label || column.key)}</th>`).join("")}</tr></thead>
          <tbody>
            ${visibleRows.map((row) => `
              <tr>
                ${columns.map((column) => `<td>${formatCell(row[column.key], column)}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <footer class="hdk-pagination" data-hdk-component="Pagination">
        <span>Showing ${escapeHtml(rangeStart)}-${escapeHtml(rangeEnd)} of ${escapeHtml(total)}</span>
        <div>
          <label>Rows <select aria-label="Rows per page">${pageSizeOptions.map((size) => `<option value="${escapeAttr(size)}"${Number(size) === normalizedPageSize ? " selected" : ""}>${escapeHtml(size)}</option>`).join("")}</select></label>
          <button type="button"${normalizedPage <= 1 ? " disabled" : ""}>Previous</button>
          <button type="button"${start + visibleRows.length >= total ? " disabled" : ""}>Next</button>
        </div>
      </footer>
    </section>
  `;
}

export function renderDataTableTabs({
  tabs = [],
  activeId = "",
  reviewId = ""
}) {
  const normalized =
    tabs.filter(Boolean);
  const active =
    activeId || normalized[0]?.id || "";

  return `
    <section class="hdk-table-tabs" data-hdk-component="DataTableTabs"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <div class="hdk-tablist" role="tablist">
        ${normalized.map((tab) => `<button type="button" class="hdk-tab ${tab.id === active ? "is-active" : ""}" role="tab" aria-selected="${tab.id === active ? "true" : "false"}">${escapeHtml(tab.label || tab.id)}${tab.count === undefined ? "" : `<span>${escapeHtml(tab.count)}</span>`}</button>`).join("")}
      </div>
      ${normalized.map((tab) => `
        <div class="hdk-tab-panel ${tab.id === active ? "is-active" : ""}" role="tabpanel">
          ${tab.html || renderDataTable({
            caption:
              tab.label,
            columns:
              tab.columns || [],
            rows:
              tab.rows || [],
            page:
              tab.page || 1,
            pageSize:
              tab.pageSize || 10,
            total:
              tab.total ?? tab.rows?.length ?? 0
          })}
        </div>
      `).join("")}
    </section>
  `;
}

export function renderLineChart(options) {
  return renderCartesianChart({
    ...options,
    component:
      "LineChart",
    mode:
      "line"
  });
}

export function renderAreaChart(options) {
  return renderCartesianChart({
    ...options,
    component:
      "AreaChart",
    mode:
      "area"
  });
}

export function renderBarChart(options) {
  return renderCartesianChart({
    ...options,
    component:
      "BarChart",
    mode:
      "bar"
  });
}

export function renderSparkline({
  data = [],
  width = 240,
  height = 64,
  tone = "info",
  label = "trend"
}) {
  const points =
    normalizePoints(data, width, height, 6);
  const path =
    linePath(points);
  return `
    <svg class="hdk-sparkline hdk-chart-${escapeAttr(tone)}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(label)}">
      <path class="hdk-chart__line" d="${escapeAttr(path)}"></path>
    </svg>
  `;
}

export function renderDonutChart({
  title,
  data = [],
  size = 260,
  thickness = 34,
  reviewId = ""
}) {
  const radius =
    (size - thickness) / 2;
  const center =
    size / 2;
  const circumference =
    2 * Math.PI * radius;
  const total =
    data.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  let offset =
    0;
  const rings =
    data.map((item, index) => {
      const value =
        Number(item.value || 0);
      const dash =
        (value / total) * circumference;
      const ring =
        `<circle class="hdk-donut__segment hdk-fill-${index % 8}" cx="${center}" cy="${center}" r="${radius}" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" stroke-width="${thickness}" fill="none"></circle>`;
      offset += dash;
      return ring;
    }).join("");

  return `
    <section class="hdk-card hdk-chart-card" data-hdk-component="DonutChart"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${renderChartHeader(title, "Share of total")}
      <div class="hdk-donut-layout">
        <svg class="hdk-donut" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeAttr(title || "donut chart")}">
          <circle class="hdk-donut__track" cx="${center}" cy="${center}" r="${radius}" stroke-width="${thickness}" fill="none"></circle>
          ${rings}
        </svg>
        <ul class="hdk-legend">
          ${data.map((item, index) => `<li><span class="hdk-swatch hdk-fill-${index % 8}"></span>${escapeHtml(item.label)} <strong>${escapeHtml(item.value)}</strong></li>`).join("")}
        </ul>
      </div>
    </section>
  `;
}

export function renderHeatmap({
  title,
  xLabels = [],
  yLabels = [],
  values = [],
  reviewId = ""
}) {
  return `
    <section class="hdk-card hdk-chart-card" data-hdk-component="Heatmap"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${renderChartHeader(title, "Category pressure")}
      <div class="hdk-heatmap" style="--hdk-heatmap-cols:${Math.max(1, xLabels.length)}">
        <span></span>
        ${xLabels.map((label) => `<b>${escapeHtml(label)}</b>`).join("")}
        ${yLabels.map((rowLabel, rowIndex) => `
          <b>${escapeHtml(rowLabel)}</b>
          ${xLabels.map((_, colIndex) => {
            const cell =
              values.find((item) => item.x === colIndex && item.y === rowIndex) || {};
            const intensity =
              Math.max(0, Math.min(1, Number(cell.value || 0)));
            return `<span class="hdk-heatmap__cell" style="--hdk-heat:${intensity}" title="${escapeAttr(`${rowLabel}: ${cell.label || intensity}`)}">${escapeHtml(cell.label || "")}</span>`;
          }).join("")}
        `).join("")}
      </div>
    </section>
  `;
}

export function renderDrawer({
  title,
  subtitle = "",
  children = "",
  open = true,
  reviewId = ""
}) {
  return `
    <aside class="hdk-drawer ${open ? "is-open" : ""}" data-hdk-component="Drawer"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header>
        <div>
          <p class="hdk-eyebrow">Detail</p>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <button type="button" aria-label="Close detail panel">×</button>
      </header>
      ${children}
    </aside>
  `;
}

export function renderDetailDrawer({
  title,
  subtitle = "",
  facts = [],
  sections = [],
  actions = "",
  open = true,
  reviewId = ""
}) {
  return renderDrawer({
    title,
    subtitle,
    open,
    reviewId,
    children:
      `
        ${facts.length ? `<dl class="hdk-fact-grid">${facts.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join("")}</dl>` : ""}
        ${sections.map((section) => `
          <section class="hdk-drawer-section">
            <h3>${escapeHtml(section.title)}</h3>
            ${section.html ? section.html : `<p>${escapeHtml(section.body || "")}</p>`}
          </section>
        `).join("")}
        ${actions ? `<footer class="hdk-drawer-actions">${actions}</footer>` : ""}
      `
  });
}

export function renderStateChecklist({
  title = "State checklist",
  items = [],
  reviewId = ""
}) {
  return `
    <section class="hdk-state-checklist" data-hdk-component="StateChecklist"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title)}</h2></header>
      ${items.map((item) => `
        <article class="hdk-state-row hdk-tone-${escapeAttr(item.tone || statusTone(item.status))}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value || item.status || "unknown")}</strong>
          ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
        </article>
      `).join("")}
    </section>
  `;
}

export function renderApprovalQueue({
  title = "Approval queue",
  items = [],
  reviewId = ""
}) {
  return `
    <section class="hdk-approval-queue" data-hdk-component="ApprovalQueue"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(items.length)} item(s)</p></header>
      <div class="hdk-approval-list">
        ${items.length ? items.map((item) => `
          <article class="hdk-approval-item hdk-tone-${escapeAttr(item.tone || statusTone(item.status))}">
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
            </div>
            <span>${escapeHtml(item.status || "pending")}</span>
          </article>
        `).join("") : renderStatePanel({
          state:
            "empty",
          title:
            "No approvals waiting",
          message:
            "The approval queue is clear."
        })}
      </div>
    </section>
  `;
}

export function renderActionQueue({
  title = "Action queue",
  items = [],
  reviewId = ""
}) {
  const rows =
    items.length
      ? items.map((item) => `
        <article class="hdk-action-row hdk-tone-${escapeAttr(item.tone || priorityTone(item.priority) || statusTone(item.status))}">
          <div class="hdk-action-row__main">
            <span class="hdk-action-row__priority">${escapeHtml(item.priority || item.status || "open")}</span>
            <h3>${escapeHtml(item.title || item.label || "Untitled action")}</h3>
            ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
            <div class="hdk-action-row__meta">
              ${item.owner ? `<span>Owner: ${escapeHtml(item.owner)}</span>` : ""}
              ${item.due ? `<span>Due: ${escapeHtml(item.due)}</span>` : ""}
              ${item.source ? `<span>Source: ${escapeHtml(item.source)}</span>` : ""}
            </div>
          </div>
          <div class="hdk-action-row__status">
            <strong>${escapeHtml(item.status || "open")}</strong>
            ${item.action ? `<button type="button">${escapeHtml(item.action)}</button>` : ""}
          </div>
        </article>
      `).join("")
      : renderStatePanel({
          state:
            "empty",
          title:
            "No actions waiting",
          message:
            "The action queue is clear."
        });

  return `
    <section class="hdk-action-queue" data-hdk-component="ActionQueue"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(items.length)} item(s)</p></header>
      <div class="hdk-action-list">${rows}</div>
    </section>
  `;
}

export function renderAlertQueue({
  title = "Alert queue",
  alerts = [],
  reviewId = ""
}) {
  const rows =
    alerts.length
      ? alerts.map((alert) => `
        <article class="hdk-alert-row hdk-tone-${escapeAttr(alert.tone || severityTone(alert.severity) || statusTone(alert.status))}">
          <div>
            <span class="hdk-alert-row__severity">${escapeHtml(alert.severity || alert.status || "info")}</span>
            <h3>${escapeHtml(alert.title || "Untitled alert")}</h3>
            ${alert.detail ? `<p>${escapeHtml(alert.detail)}</p>` : ""}
            <div class="hdk-action-row__meta">
              ${alert.source ? `<span>${escapeHtml(alert.source)}</span>` : ""}
              ${alert.age ? `<span>${escapeHtml(alert.age)}</span>` : ""}
              ${alert.recurrence ? `<span>${escapeHtml(alert.recurrence)}</span>` : ""}
            </div>
          </div>
          <div class="hdk-alert-row__actions">
            <strong>${escapeHtml(alert.status || "open")}</strong>
            ${(alert.actions || ["Acknowledge"]).map((action) => `<button type="button">${escapeHtml(action)}</button>`).join("")}
          </div>
        </article>
      `).join("")
      : renderStatePanel({
          state:
            "empty",
          title:
            "No open alerts",
          message:
            "No active alerts match this view."
        });

  return `
    <section class="hdk-alert-queue" data-hdk-component="AlertQueue"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(alerts.length)} alert(s)</p></header>
      <div class="hdk-alert-list">${rows}</div>
    </section>
  `;
}

export function renderContentPackageWorkspace({
  title = "Content package workspace",
  package: contentPackage = {},
  assets = [],
  checklist = [],
  reviewId = ""
}) {
  const facts =
    [
      ["Brand", contentPackage.brand],
      ["Platform", contentPackage.platform],
      ["Status", contentPackage.status],
      ["SEO", contentPackage.seoScore],
      ["Transcript", contentPackage.transcriptStatus]
    ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  return `
    <section class="hdk-content-package" data-hdk-component="ContentPackageWorkspace"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${contentPackage.description ? `<p>${escapeHtml(contentPackage.description)}</p>` : ""}
        </div>
        ${contentPackage.status ? `<span class="hdk-package-status hdk-tone-${escapeAttr(statusTone(contentPackage.status))}">${escapeHtml(contentPackage.status)}</span>` : ""}
      </header>
      <div class="hdk-content-package__grid">
        <div class="hdk-package-preview">
          ${contentPackage.thumbnailUrl ? `<img src="${escapeAttr(contentPackage.thumbnailUrl)}" alt="${escapeAttr(contentPackage.thumbnailAlt || "Thumbnail preview")}">` : renderStatePanel({ state: "empty", title: "No thumbnail yet", message: "Thumbnail output has not been attached." })}
        </div>
        <div class="hdk-package-detail">
          ${facts.length ? `<dl class="hdk-fact-grid">${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}
          ${contentPackage.videoUrl ? `<a class="hdk-package-link" href="${escapeAttr(contentPackage.videoUrl)}">Video asset</a>` : ""}
          ${contentPackage.copy ? `<article class="hdk-package-copy"><h3>Upload copy</h3><p>${escapeHtml(contentPackage.copy)}</p></article>` : ""}
          ${assets.length ? `<div class="hdk-package-assets">${assets.map((asset) => `<a href="${escapeAttr(asset.href || "#")}">${escapeHtml(asset.label || asset.type || "Asset")}</a>`).join("")}</div>` : ""}
        </div>
      </div>
      ${checklist.length ? renderStateChecklist({ title: "Package readiness", items: checklist }) : ""}
    </section>
  `;
}

export function renderBrandPortfolioGrid({
  title = "Brand portfolio",
  brands = [],
  reviewId = ""
}) {
  return `
    <section class="hdk-brand-portfolio" data-hdk-component="BrandPortfolioGrid"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(brands.length)} brand(s)</p></header>
      <div class="hdk-brand-grid">
        ${brands.length ? brands.map((brand) => `
          <article class="hdk-brand-card hdk-tone-${escapeAttr(brand.tone || statusTone(brand.status))}">
            <div class="hdk-brand-card__head">
              <div>
                <h3>${escapeHtml(brand.name || brand.title || "Untitled brand")}</h3>
                ${brand.subtitle ? `<p>${escapeHtml(brand.subtitle)}</p>` : ""}
              </div>
              <strong>${escapeHtml(brand.status || "unknown")}</strong>
            </div>
            <dl class="hdk-mini-metrics">
              ${(brand.metrics || []).map((metric) => `<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}</dd></div>`).join("")}
            </dl>
            ${brand.blocker ? `<p class="hdk-brand-card__blocker">${escapeHtml(brand.blocker)}</p>` : ""}
          </article>
        `).join("") : renderStatePanel({ state: "empty", title: "No brands", message: "No brand records are available." })}
      </div>
    </section>
  `;
}

export function renderChannelPostabilityMatrix({
  title = "Channel postability",
  channels = [],
  platforms = [],
  reviewId = ""
}) {
  const resolvedPlatforms =
    platforms.length
      ? platforms
      : Array.from(new Set(channels.flatMap((channel) => Object.keys(channel.platforms || {}))));

  return `
    <section class="hdk-channel-matrix" data-hdk-component="ChannelPostabilityMatrix"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(channels.length)} channel(s)</p></header>
      <div class="hdk-channel-matrix__scroll">
        <table class="hdk-table hdk-channel-table">
          <thead><tr><th scope="col">Brand / account</th>${resolvedPlatforms.map((platform) => `<th scope="col">${escapeHtml(platform)}</th>`).join("")}</tr></thead>
          <tbody>
            ${channels.map((channel) => `
              <tr>
                <td><strong>${escapeHtml(channel.label || channel.brand || "Untitled")}</strong>${channel.detail ? `<small>${escapeHtml(channel.detail)}</small>` : ""}</td>
                ${resolvedPlatforms.map((platform) => {
                  const state = channel.platforms?.[platform] || {};
                  return `<td><span class="hdk-postability hdk-tone-${escapeAttr(statusTone(state.status))}">${escapeHtml(state.status || "unknown")}</span>${state.detail ? `<small>${escapeHtml(state.detail)}</small>` : ""}</td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderOperationsFunnel({
  title = "Operations funnel",
  stages = [],
  reviewId = ""
}) {
  const max =
    Math.max(1, ...stages.map((stage) => Number(stage.value || 0)));
  return `
    <section class="hdk-operations-funnel" data-hdk-component="OperationsFunnel"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(stages.length)} stage(s)</p></header>
      <div class="hdk-funnel">
        ${stages.map((stage, index) => {
          const value =
            Number(stage.value || 0);
          const width =
            Math.max(18, Math.round((value / max) * 100));
          const previous =
            index > 0 ? Number(stages[index - 1].value || 0) : value;
          const rate =
            previous ? Math.round((value / previous) * 100) : 0;
          return `
            <article class="hdk-funnel-stage hdk-tone-${escapeAttr(stage.tone || statusTone(stage.status))}" style="--hdk-funnel-width:${width}%">
              <div>
                <span>${escapeHtml(stage.label || `Stage ${index + 1}`)}</span>
                <strong>${escapeHtml(stage.value ?? 0)}</strong>
              </div>
              <p>${escapeHtml(stage.detail || (index ? `${rate}% from prior stage` : "entry stage"))}</p>
              <i></i>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

export function renderCostAttributionTable({
  title = "Cost attribution",
  rows = [],
  reviewId = ""
}) {
  const total =
    rows.reduce((sum, row) => sum + Number(row.cost || row.amount || 0), 0);
  return renderDataTable({
    caption:
      title,
    reviewId,
    columns:
      [
        { key: "source", label: "Source" },
        { key: "provider", label: "Provider" },
        { key: "purpose", label: "Purpose" },
        { key: "owner", label: "Owner" },
        { key: "cost", label: "Cost", format: "currency" },
        { key: "share", label: "Share" }
      ],
    rows:
      rows.map((row) => ({
        ...row,
        cost:
          Number(row.cost || row.amount || 0),
        share:
          total ? `${Math.round((Number(row.cost || row.amount || 0) / total) * 100)}%` : "0%"
      })),
    total:
      rows.length,
    pageSize:
      25
  }).replace('data-hdk-component="DataTable"', 'data-hdk-component="CostAttributionTable" data-hdk-table-kind="DataTable"');
}

export function renderBriefingPanel(options = {}) {
  return renderOperationalPanel({ component: "BriefingPanel", title: "Briefing", ...options });
}

export function renderNarrativeBriefing(options = {}) {
  return renderOperationalPanel({ component: "NarrativeBriefing", title: "Narrative briefing", ...options });
}

export function renderScheduleTimeline(options = {}) {
  return renderOperationalPanel({ component: "ScheduleTimeline", title: "Schedule timeline", ...options });
}

export function renderCalendarQueue(options = {}) {
  return renderOperationalPanel({ component: "CalendarQueue", title: "Calendar queue", ...options });
}

export function renderBenchmarkPanel(options = {}) {
  return renderOperationalPanel({ component: "BenchmarkPanel", title: "Benchmark panel", ...options });
}

export function renderPostPerformanceTable({ rows = [], title = "Post performance", reviewId = "" } = {}) {
  return renderDataTable({
    caption:
      title,
    reviewId,
    columns:
      [
        { key: "post", label: "Post" },
        { key: "platform", label: "Platform" },
        { key: "format", label: "Format" },
        { key: "score", label: "Score" },
        { key: "result", label: "Result" }
      ],
    rows,
    pageSize:
      25,
    total:
      rows.length
  }).replace('data-hdk-component="DataTable"', 'data-hdk-component="PostPerformanceTable" data-hdk-table-kind="DataTable"');
}

export function renderCampaignEconomicsPanel(options = {}) {
  return renderOperationalPanel({ component: "CampaignEconomicsPanel", title: "Campaign economics", ...options });
}

export function renderAttributionMatrix(options = {}) {
  return renderOperationalMatrix({ component: "AttributionMatrix", title: "Attribution matrix", ...options });
}

export function renderCampaignRiskRail(options = {}) {
  return renderOperationalPanel({ component: "CampaignRiskRail", title: "Campaign risk rail", ...options });
}

export function renderProspectBoard(options = {}) {
  return renderOperationalPanel({ component: "ProspectBoard", title: "Prospect board", ...options });
}

export function renderOutreachDraftPanel(options = {}) {
  return renderOperationalPanel({ component: "OutreachDraftPanel", title: "Outreach draft", ...options });
}

export function renderCoverageGapMatrix(options = {}) {
  return renderOperationalMatrix({ component: "CoverageGapMatrix", title: "Coverage gap matrix", ...options });
}

export function renderResponseLogPanel(options = {}) {
  return renderOperationalPanel({ component: "ResponseLogPanel", title: "Response log", ...options });
}

export function renderReadinessDomainMatrix(options = {}) {
  return renderOperationalMatrix({ component: "ReadinessDomainMatrix", title: "Readiness domain matrix", ...options });
}

export function renderKpiContractTable({ rows = [], title = "KPI contract table", reviewId = "" } = {}) {
  return renderDataTable({
    caption:
      title,
    reviewId,
    columns:
      [
        { key: "kpi", label: "KPI" },
        { key: "source", label: "Source" },
        { key: "cadence", label: "Cadence" },
        { key: "owner", label: "Owner" },
        { key: "status", label: "Status" }
      ],
    rows,
    pageSize:
      25,
    total:
      rows.length
  }).replace('data-hdk-component="DataTable"', 'data-hdk-component="KpiContractTable" data-hdk-table-kind="DataTable"');
}

export function renderGovernanceChecklist(options = {}) {
  return renderOperationalPanel({ component: "GovernanceChecklist", title: "Governance checklist", ...options });
}

export function renderAutomationReadinessMatrix(options = {}) {
  return renderOperationalMatrix({ component: "AutomationReadinessMatrix", title: "Automation readiness", ...options });
}

export function renderWorkOrderQueue(options = {}) {
  return renderOperationalPanel({ component: "WorkOrderQueue", title: "Work order queue", ...options });
}

export function renderGateRunTimeline(options = {}) {
  return renderOperationalPanel({ component: "GateRunTimeline", title: "Gate run timeline", ...options });
}

export function renderStageBlockerMatrix(options = {}) {
  return renderOperationalMatrix({ component: "StageBlockerMatrix", title: "Stage blocker matrix", ...options });
}

export function renderRunDrilldownPanel(options = {}) {
  return renderOperationalPanel({ component: "RunDrilldownPanel", title: "Run drilldown", ...options });
}

export function renderRecommendationReviewPanel(options = {}) {
  return renderOperationalPanel({ component: "RecommendationReviewPanel", title: "Recommendation review", ...options });
}

export function renderLearningEvidenceStack(options = {}) {
  return renderOperationalPanel({ component: "LearningEvidenceStack", title: "Learning evidence", ...options });
}

export function renderSignalClusterPanel(options = {}) {
  return renderOperationalPanel({ component: "SignalClusterPanel", title: "Signal clusters", ...options });
}

export function renderInsightGapPanel(options = {}) {
  return renderOperationalPanel({ component: "InsightGapPanel", title: "Insight gaps", ...options });
}

export function renderPartnerRankingTable({ rows = [], title = "Partner ranking", reviewId = "" } = {}) {
  return renderDataTable({
    caption:
      title,
    reviewId,
    columns:
      [
        { key: "partner", label: "Partner" },
        { key: "score", label: "Score" },
        { key: "margin", label: "Margin" },
        { key: "risk", label: "Risk" },
        { key: "action", label: "Action" }
      ],
    rows,
    pageSize:
      25,
    total:
      rows.length
  }).replace('data-hdk-component="DataTable"', 'data-hdk-component="PartnerRankingTable" data-hdk-table-kind="DataTable"');
}

export function renderPublishingProofPanel(options = {}) {
  return renderOperationalPanel({ component: "PublishingProofPanel", title: "Publishing proof", ...options });
}

export function renderSourceContractHealthTable({ rows = [], title = "Source contract health", reviewId = "" } = {}) {
  return renderDataTable({
    caption:
      title,
    reviewId,
    columns:
      [
        { key: "source", label: "Source" },
        { key: "freshness", label: "Freshness" },
        { key: "contract", label: "Contract" },
        { key: "status", label: "Status" },
        { key: "owner", label: "Owner" }
      ],
    rows,
    pageSize:
      25,
    total:
      rows.length
  }).replace('data-hdk-component="DataTable"', 'data-hdk-component="SourceContractHealthTable" data-hdk-table-kind="DataTable"');
}

export function renderWasteCostPanel(options = {}) {
  return renderOperationalPanel({ component: "WasteCostPanel", title: "Waste cost", ...options });
}

export function renderMealPlannerCalendar(options = {}) {
  return renderOperationalMatrix({ component: "MealPlannerCalendar", title: "Meal planner calendar", ...options });
}

export function renderMealWeekDrawer(options = {}) {
  return renderOperationalPanel({ component: "MealWeekDrawer", title: "Meal week drawer", ...options });
}

export function renderMealLibrary({ rows = [], title = "Meal library", reviewId = "" } = {}) {
  return renderDataTable({
    caption: title,
    reviewId,
    columns: [
      { key: "meal", label: "Meal" },
      { key: "protein", label: "Protein" },
      { key: "side", label: "Side" },
      { key: "tags", label: "Tags" },
      { key: "status", label: "Status" }
    ],
    rows,
    pageSize: 25,
    total: rows.length
  }).replace('data-hdk-component="DataTable"', 'data-hdk-component="MealLibrary" data-hdk-table-kind="DataTable"');
}

export function renderIngredientChecklist(options = {}) {
  return renderOperationalPanel({ component: "IngredientChecklist", title: "Ingredient checklist", ...options });
}

export function renderHouseholdPreferencePanel(options = {}) {
  return renderOperationalPanel({ component: "HouseholdPreferencePanel", title: "Household preferences", ...options });
}

export function renderMealGenerationRulesPanel(options = {}) {
  return renderOperationalPanel({ component: "MealGenerationRulesPanel", title: "Meal generation rules", ...options });
}

export function renderPantryInventoryPanel(options = {}) {
  return renderOperationalPanel({ component: "PantryInventoryPanel", title: "Pantry inventory", ...options });
}

export function renderShoppingListExportPanel(options = {}) {
  return renderOperationalPanel({ component: "ShoppingListExportPanel", title: "Shopping list export", ...options });
}

export function renderMapWorkspace(options = {}) {
  return renderOperationalPanel({ component: "MapWorkspace", title: "Map workspace", ...options });
}

export function renderCoverageMap(options = {}) {
  return renderOperationalMatrix({ component: "CoverageMap", title: "Coverage map", ...options });
}

export function renderEntityRelationshipGraph(options = {}) {
  return renderOperationalMatrix({ component: "EntityRelationshipGraph", title: "Entity relationship graph", ...options });
}

export function renderTerritoryMatrix(options = {}) {
  return renderOperationalMatrix({ component: "TerritoryMatrix", title: "Territory matrix", ...options });
}

export function renderLocationDetailDrawer(options = {}) {
  return renderOperationalPanel({ component: "LocationDetailDrawer", title: "Location detail", ...options });
}

export function renderNetworkGraph(options = {}) {
  return renderOperationalMatrix({ component: "NetworkGraph", title: "Network graph", ...options });
}

export function renderPortfolioCompanyGrid(options = {}) {
  return renderBrandPortfolioGrid({
    title:
      "Portfolio companies",
    brands:
      options.companies || options.brands || [],
    reviewId:
      options.reviewId
  }).replace('data-hdk-component="BrandPortfolioGrid"', 'data-hdk-component="PortfolioCompanyGrid" data-hdk-grid-kind="BrandPortfolioGrid"');
}

export function renderOperatingCompanyScorecard(options = {}) {
  return renderOperationalPanel({ component: "OperatingCompanyScorecard", title: "Operating company scorecard", ...options });
}

export function renderOwnerAccountabilityMatrix(options = {}) {
  return renderOperationalMatrix({ component: "OwnerAccountabilityMatrix", title: "Owner accountability", ...options });
}

export function renderContractReadinessPanel(options = {}) {
  return renderOperationalPanel({ component: "ContractReadinessPanel", title: "Contract readiness", ...options });
}

export function renderBoardDecisionQueue(options = {}) {
  return renderOperationalPanel({ component: "BoardDecisionQueue", title: "Board decision queue", ...options });
}

export function renderStrategicInitiativeTimeline(options = {}) {
  return renderOperationalPanel({ component: "StrategicInitiativeTimeline", title: "Strategic initiative timeline", ...options });
}

export function renderServiceTopologyMap(options = {}) {
  return renderOperationalMatrix({ component: "ServiceTopologyMap", title: "Service topology", ...options });
}

export function renderDeploymentPromotionPanel(options = {}) {
  return renderOperationalPanel({ component: "DeploymentPromotionPanel", title: "Deployment promotion", ...options });
}

export function renderPermissionAuditPanel(options = {}) {
  return renderOperationalPanel({ component: "PermissionAuditPanel", title: "Permission audit", ...options });
}

export function renderIncidentCommandPanel(options = {}) {
  return renderOperationalPanel({ component: "IncidentCommandPanel", title: "Incident command", ...options });
}

export function renderRunbookPanel(options = {}) {
  return renderOperationalPanel({ component: "RunbookPanel", title: "Runbook", ...options });
}

export function renderEnvironmentHealthMatrix(options = {}) {
  return renderOperationalMatrix({ component: "EnvironmentHealthMatrix", title: "Environment health", ...options });
}

export function renderCandlestickChart(options = {}) {
  return renderAdvancedViz({ component: "CandlestickChart", title: "Candlestick chart", ...options });
}

export function renderTradingTerminalWorkspace({
  title = "Trading terminal",
  subtitle = "Dominant chart workspace with compact controls, watchlist/details rail, and bottom broker state.",
  toolbar = "",
  toolRail = "",
  chart = "",
  rightRail = "",
  bottomPanel = "",
  reviewId = "hdk.trading-terminal-workspace"
} = {}) {
  return `
    <section class="hdk-trading-terminal" data-hdk-component="TradingTerminalWorkspace" data-domain-library="lightweight-charts" data-domain-library-family="financial-trading-charts" data-proof-signals="terminal-toolbar-visible dominant-chart-visible right-watchlist-visible bottom-orders-panel-visible candlestick-visible x-axis-visible y-axis-visible" data-review-id="${escapeHtml(reviewId)}">
      <header class="hdk-trading-terminal__toolbar" data-hdk-component="TradingTopToolbar">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="hdk-trading-terminal__toolbar-actions">${toolbar}</div>
      </header>
      <div class="hdk-trading-terminal__workspace" data-terminal-anatomy="tool-rail chart right-rail bottom-panel">
        <aside class="hdk-trading-terminal__tool-rail" data-hdk-component="TradingLeftToolRail">${toolRail}</aside>
        <main class="hdk-trading-terminal__chart" data-hdk-component="FinancialCandlestickChart" data-chart-role="dominant">${chart || renderCandlestickChart({ title: "Price chart" })}</main>
        <aside class="hdk-trading-terminal__right-rail" data-hdk-component="TradingWatchlistPanel">${rightRail}</aside>
        <section class="hdk-trading-terminal__bottom-panel" data-hdk-component="PositionsOrdersPanel">${bottomPanel}</section>
      </div>
    </section>
  `;
}

export function renderSankeyFlow(options = {}) {
  return renderOperationalMatrix({ component: "SankeyFlow", title: "Sankey flow", ...options });
}

export function renderTreemap(options = {}) {
  return renderOperationalMatrix({ component: "Treemap", title: "Treemap", ...options });
}

export function renderSunburst(options = {}) {
  return renderOperationalMatrix({ component: "Sunburst", title: "Sunburst", ...options });
}

export function renderCorrelationMatrix(options = {}) {
  return renderOperationalMatrix({ component: "CorrelationMatrix", title: "Correlation matrix", ...options });
}

export function renderDistributionPlot(options = {}) {
  return renderAdvancedViz({ component: "DistributionPlot", title: "Distribution plot", ...options });
}

export function renderBoxPlot(options = {}) {
  return renderAdvancedViz({ component: "BoxPlot", title: "Box plot", ...options });
}

export function renderViolinPlot(options = {}) {
  return renderAdvancedViz({ component: "ViolinPlot", title: "Violin plot", ...options });
}

export function renderScatterQuadrantChart(options = {}) {
  return renderAdvancedViz({ component: "ScatterQuadrantChart", title: "Scatter quadrant", ...options });
}

export function renderAnomalyBandChart(options = {}) {
  return renderAdvancedViz({ component: "AnomalyBandChart", title: "Anomaly band", ...options });
}

export function renderMobileDashboardShell(options = {}) {
  return renderOperationalPanel({ component: "MobileDashboardShell", title: "Mobile dashboard", ...options });
}

export function renderBottomSheetDrawer(options = {}) {
  return renderOperationalPanel({ component: "BottomSheetDrawer", title: "Bottom sheet", ...options });
}

export function renderMobileFilterSheet(options = {}) {
  return renderOperationalPanel({ component: "MobileFilterSheet", title: "Mobile filters", ...options });
}

export function renderCompactActionRail(options = {}) {
  return renderOperationalPanel({ component: "CompactActionRail", title: "Compact action rail", ...options });
}

export function renderSwipeableQueue(options = {}) {
  return renderOperationalPanel({ component: "SwipeableQueue", title: "Swipeable queue", ...options });
}

export function renderQaReviewPanel({
  title = "QA review",
  checks = [],
  reviewId = ""
}) {
  return `
    <section class="hdk-qa-panel" data-hdk-component="QaReviewPanel"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title)}</h2></header>
      <div class="hdk-qa-grid">
        ${checks.map((check) => `
          <article class="hdk-qa-check hdk-tone-${escapeAttr(check.tone || statusTone(check.status))}">
            <span>${escapeHtml(check.label)}</span>
            <strong>${escapeHtml(check.status || "unknown")}</strong>
            ${check.detail ? `<p>${escapeHtml(check.detail)}</p>` : ""}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderMarketTape({
  markets = [],
  columns = [],
  activeId = "",
  page = 1,
  pageSize = 25,
  total = markets.length,
  reviewId = ""
}) {
  const visible =
    markets.slice(0, pageSize);
  const resolvedColumns =
    columns.length
      ? columns
      : [
          {
            key:
              "title",
            label:
              "Market"
          },
          {
            key:
              "category",
            label:
              "Category"
          },
          {
            key:
              "mid",
            label:
              "Mid"
          },
          {
            key:
              "spread",
            label:
              "Spread"
          },
          {
            key:
              "volume",
            label:
              "Volume"
          },
          {
            key:
              "snapshots",
            label:
              "Snapshots"
          }
        ];

  return `
    <section class="hdk-market-tape" data-hdk-component="MarketTape"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <div class="hdk-market-tape-scroller">
        <div class="hdk-market-tape-header" style="--hdk-market-columns:${resolvedColumns.length}">
          ${resolvedColumns.map((column) => `<span>${escapeHtml(column.label || column.key)}</span>`).join("")}
        </div>
        <div class="hdk-market-tape-body">
          ${visible.map((market) => `
            <button type="button" class="hdk-market-tape-row ${market.id === activeId ? "active" : ""}" style="--hdk-market-columns:${resolvedColumns.length}" data-market-id="${escapeAttr(market.id || "")}">
              ${resolvedColumns.map((column) => `<span>${renderMarketCell(market, column)}</span>`).join("")}
            </button>
          `).join("")}
        </div>
      </div>
      <footer class="hdk-pagination" data-hdk-component="Pagination">
        <span>Page ${escapeHtml(page)} · ${escapeHtml(visible.length)} of ${escapeHtml(total)}</span>
        <div><button type="button">Previous</button><button type="button">Next</button></div>
      </footer>
    </section>
  `;
}

export function renderMarketBrowserLayout({
  filters = "",
  tape = "",
  detail = "",
  reviewId = ""
}) {
  return `
    <section class="hdk-market-browser" data-hdk-component="MarketBrowserLayout"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <aside class="hdk-market-browser__filters">${filters}</aside>
      <div class="hdk-market-browser__tape">${tape}</div>
      <aside class="hdk-market-browser__detail">${detail}</aside>
    </section>
  `;
}

export function renderMarketExplorerPage({
  note = "",
  categories = [],
  topics = [],
  topMovers = [],
  markets = [],
  tape = "",
  detail = "",
  title = "All live markets",
  visibleLabel = "0 visible",
  countLabel = "0 rows",
  activeCategory = "all",
  activeTopic = "all",
  activeId = "",
  searchPlaceholder = "Ticker, team, asset, event...",
  expired = "",
  reviewId = "hdk.market-explorer-page"
} = {}) {
  const categoryHtml =
    categories.length
      ? categories.map((category) => `
        <button class="hdk-browser-category ${category.key === activeCategory ? "is-active" : ""}" type="button" data-category-filter="${escapeAttr(category.key)}">
          <span>${escapeHtml(category.label)}</span>
          <strong>${escapeHtml(category.count ?? 0)}</strong>
        </button>
      `).join("")
      : renderStatePanel({ state: "empty", title: "No categories yet", message: "Live categories appear after the feed returns markets." });
  const topicHtml =
    topics.map((topic) => `
      <button class="hdk-topic-chip ${topic.key === activeTopic ? "is-active" : ""}" type="button" data-topic-filter="${escapeAttr(topic.key)}">
        ${escapeHtml(topic.label)} <span>${escapeHtml(topic.count ?? 0)}</span>
      </button>
    `).join("");
  const moverHtml =
    topMovers.length
      ? topMovers.map((market) => `
        <button class="hdk-browser-mover" type="button" data-market-id="${escapeAttr(market.id)}">
          <span>${escapeHtml(market.title || market.ticker || "Untitled market")}</span>
          <strong class="${Number(market.movementCents || 0) >= 0 ? "hdk-positive" : "hdk-negative"}">${escapeHtml(market.moveLabel || market.movement || "")}</strong>
        </button>
      `).join("")
      : `<p class="hdk-muted-note">Movement appears after repeated stream or orderbook points.</p>`;
  const detailHtml =
    detail || renderStatePanel({
      state: "empty",
      title: "Select a market",
      message: "Choose a live market to inspect price movement, spread, depth, snapshots, and proof state."
    });

  return `
    <div class="hdk-market-explorer-page" data-hdk-component="MarketExplorerPage" data-hdk-recipe="package-native-market-browser"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${note ? `<div class="hdk-partial-banner hdk-market-explorer-note" data-hdk-component="PartialDataBanner">${escapeHtml(note)}</div>` : ""}
      <section class="hdk-market-explorer" data-hdk-component="MarketBrowserLayout">
        <aside class="hdk-card hdk-browser-pane" data-hdk-component="CategoryBrowserPane" data-review-id="hdk.market-explorer.categories">
          <div class="hdk-card__header">
            <div>
              <h2>Browse markets</h2>
              <p>Start with a category, then narrow by topic or market text.</p>
            </div>
            <span class="hdk-status-badge" data-live="browserCount">${escapeHtml(visibleLabel)}</span>
          </div>
          <div class="hdk-browser-category-list" data-live="browserCategories">${categoryHtml}</div>
          <div class="hdk-browser-movers">
            <p class="hdk-section-kicker">Fast movers</p>
            <div data-live="browserTopMovers">${moverHtml}</div>
          </div>
        </aside>
        <section class="hdk-card hdk-browser-results" data-hdk-component="MarketTapeWorkspace" data-review-id="hdk.market-explorer.tape">
          <div class="hdk-card__header hdk-card__header-row">
            <div>
              <p class="hdk-section-kicker">Live market tape</p>
              <h2 data-live="marketTapeTitle">${escapeHtml(title)}</h2>
            </div>
            <span class="hdk-status-badge" data-live="marketCount">${escapeHtml(countLabel)}</span>
          </div>
          <label class="hdk-search">
            <span>Search within selection</span>
            <input type="search" data-live="marketSearch" placeholder="${escapeAttr(searchPlaceholder)}" autocomplete="off" />
          </label>
          <div class="hdk-topic-strip" data-live="browserTopics">${topicHtml}</div>
          ${tape || renderMarketTape({
            markets,
            activeId,
            pageSize: markets.length || 25,
            total: markets.length,
            reviewId: "hdk.market-explorer.market-tape"
          })}
        </section>
        <aside class="hdk-market-detail-panel" data-hdk-component="MarketDetailPanel" data-review-id="hdk.market-explorer.detail" data-live="detailDrawer">
          ${detailHtml}
        </aside>
      </section>
      ${expired}
    </div>
  `;
}

export function renderComponentQualityMaturityGraph({
  families = DASHBOARD_KIT_COMPONENT_INVENTORY,
  review = [],
  reviewId = "hdk.component-quality-maturity-graph"
} = {}) {
  const reviewById =
    new Map(review.map((item) => [item.id, item]));
  const dimensions =
    [
      "visualPolish",
      "interactionCompleteness",
      "stateCoverage",
      "domainIntelligence",
      "adoptionReadiness"
    ];
  const rows =
    families.map((family) => {
      const item =
        reviewById.get(family.id) || {};
      const scores =
        item.score || {};
      const values =
        dimensions.map((dimension) => {
          if (dimension === "adoptionReadiness") {
            return Number(scores.adoptionReadiness ?? scores.projectAdoption ?? 0);
          }
          if (dimension === "domainIntelligence") {
            return Number(scores.domainIntelligence ?? scores.interactionCompleteness ?? 0);
          }
          return Number(scores[dimension] ?? 0);
        });
      const level =
        values.length
          ? Math.min(5, Math.max(0, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length / 20)))
          : 0;
      const pct =
        Math.min(100, Math.max(0, level * 20));
      return {
        family,
        item,
        level,
        pct
      };
    });

  return `
    <section class="hdk-quality-graph" data-hdk-component="ComponentQualityMaturityGraph" data-review-id="${escapeAttr(reviewId)}">
      <header class="hdk-card__header">
        <div>
          <p class="hdk-eyebrow">Component Quality</p>
          <h2>Level 5 maturity graph</h2>
          <p>Tracks whether each family has moved from primitive rendering to adaptive, proof-backed operator components.</p>
        </div>
        <span class="hdk-status-badge">${escapeHtml(rows.filter((row) => row.level >= 5).length)} / ${escapeHtml(rows.length)} at L5</span>
      </header>
      <div class="hdk-quality-graph__rows">
        ${rows.map(({ family, item, level, pct }) => `
          <article class="hdk-quality-row" data-quality-family="${escapeAttr(family.id)}" data-quality-level="${escapeAttr(level)}">
            <div>
              <strong>${escapeHtml(family.family)}</strong>
              <span>${escapeHtml(item.reviewStatus || family.status)} · ${escapeHtml(family.targetTier)}</span>
            </div>
            <div class="hdk-quality-row__bar" aria-label="${escapeAttr(`${family.family} level ${level}`)}">
              <i style="width:${pct}%"></i>
            </div>
            <b>L${escapeHtml(level)}</b>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderPremiumComparisonChart({
  title = "Comparison trend",
  subtitle = "Compare metrics across brands, windows, or segments.",
  data = [],
  metrics = [],
  activeMetric = "",
  windows = ["1D", "7D", "14D", "30D"],
  activeWindow = "7D",
  reviewId = ""
} = {}) {
  const resolvedData =
    data.length
      ? data
      : [
          { label: "Mon", approved: 22, rejected: 7, posted: 19 },
          { label: "Tue", approved: 28, rejected: 5, posted: 21 },
          { label: "Wed", approved: 25, rejected: 8, posted: 23 },
          { label: "Thu", approved: 34, rejected: 4, posted: 30 },
          { label: "Fri", approved: 39, rejected: 6, posted: 35 },
          { label: "Sat", approved: 32, rejected: 9, posted: 28 },
          { label: "Sun", approved: 45, rejected: 3, posted: 42 }
        ];
  const resolvedMetrics =
    metrics.length
      ? metrics
      : [
          { key: "approved", label: "Approved", color: "var(--hdk-series-green)" },
          { key: "posted", label: "Posted", color: "var(--hdk-series-blue)" },
          { key: "rejected", label: "Rejected", color: "var(--hdk-series-red)" }
        ];
  const width =
    760;
  const height =
    300;
  const margin =
    { top: 26, right: 26, bottom: 46, left: 54 };
  const plotWidth =
    width - margin.left - margin.right;
  const plotHeight =
    height - margin.top - margin.bottom;
  const maxValue =
    Math.max(1, ...resolvedData.flatMap((row) => resolvedMetrics.map((metric) => Number(row[metric.key] || 0))));
  const ticks =
    [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      y:
        margin.top + plotHeight - ratio * plotHeight,
      value:
        ratio * maxValue
    }));
  const xTicks =
    resolvedData.filter((_, index) => index === 0 || index === resolvedData.length - 1 || index === Math.floor(resolvedData.length / 2));
  const lineFor =
    (metric) =>
      resolvedData.map((row, index) => {
        const x =
          margin.left + (resolvedData.length <= 1 ? plotWidth / 2 : index / (resolvedData.length - 1) * plotWidth);
        const y =
          margin.top + plotHeight - (Number(row[metric.key] || 0) / maxValue) * plotHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(" ");

  return `
    <section class="hdk-premium-chart" data-hdk-component="PremiumComparisonChart"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header hdk-card__header-row">
        <div>
          <p class="hdk-section-kicker">Comparison</p>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        ${renderTimeWindowSelector({ windows, active: activeWindow })}
      </header>
      <div class="hdk-chart-toolbar">
        <label>Metric
          <select aria-label="Metric to compare">
            ${resolvedMetrics.map((metric) => `<option value="${escapeAttr(metric.key)}"${metric.key === activeMetric ? " selected" : ""}>${escapeHtml(metric.label)}</option>`).join("")}
          </select>
        </label>
        <div class="hdk-chart-legend">
          ${resolvedMetrics.map((metric) => `<span class="hdk-chart-legend-item"><i class="hdk-chart-swatch" style="--hdk-series-color:${escapeAttr(metric.color)}"></i>${escapeHtml(metric.label)}</span>`).join("")}
        </div>
      </div>
      <svg class="hdk-premium-chart__svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(title)}">
        ${ticks.map((tick) => `
          <line class="hdk-chart__grid" x1="${margin.left}" x2="${width - margin.right}" y1="${tick.y}" y2="${tick.y}"></line>
          <text class="hdk-chart__axis" x="${margin.left - 10}" y="${tick.y + 4}" text-anchor="end">${formatCompact(tick.value)}</text>
        `).join("")}
        ${xTicks.map((tick, index) => {
          const sourceIndex =
            resolvedData.indexOf(tick);
          const x =
            margin.left + (resolvedData.length <= 1 ? plotWidth / 2 : sourceIndex / (resolvedData.length - 1) * plotWidth);
          return `<text class="hdk-chart__axis" x="${x}" y="${height - 16}" text-anchor="${index === 0 ? "start" : index === xTicks.length - 1 ? "end" : "middle"}">${escapeHtml(tick.label)}</text>`;
        }).join("")}
        <text class="hdk-chart__label" x="${margin.left}" y="${height - 4}">time</text>
        <text class="hdk-chart__label" x="14" y="${margin.top}" transform="rotate(-90 14 ${margin.top})">count</text>
        ${resolvedMetrics.map((metric) => `<path class="hdk-chart__line" d="${escapeAttr(lineFor(metric))}" style="--hdk-series-color:${escapeAttr(metric.color)}"></path>`).join("")}
      </svg>
    </section>
  `;
}

export function renderPremiumMarketBrowser({
  categories = [],
  markets = [],
  selected = null,
  snapshots = [],
  reviewId = "hdk.premium-market-browser"
} = {}) {
  const resolvedCategories =
    categories.length
      ? categories
      : [
          { label: "All live", count: 488, active: true },
          { label: "Sports", count: 240 },
          { label: "Politics", count: 62 },
          { label: "Financials", count: 41 },
          { label: "Movies", count: 23 }
        ];
  const resolvedMarkets =
    markets.length
      ? markets
      : [
          { title: "Will Team A win tonight?", category: "Sports", mid: "54c", spread: "3c", movement: "+8c", snapshots: 28 },
          { title: "Rate decision this week?", category: "Financials", mid: "47c", spread: "4c", movement: "-4c", snapshots: 17 },
          { title: "Will candidate lead poll?", category: "Politics", mid: "61c", spread: "5c", movement: "+6c", snapshots: 34 }
        ];
  const resolvedSelected =
    selected || resolvedMarkets[0];
  const resolvedSnapshots =
    snapshots.length
      ? snapshots
      : [
          { label: "10:00", mid: 48, spread: 3 },
          { label: "10:15", mid: 51, spread: 4 },
          { label: "10:30", mid: 54, spread: 3 },
          { label: "10:45", mid: 59, spread: 2 },
          { label: "11:00", mid: 56, spread: 3 }
        ];

  return `
    <section class="hdk-premium-market-browser" data-hdk-component="PremiumMarketBrowser"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <aside class="hdk-premium-market-browser__categories">
        <div class="hdk-card__header"><h2>Browse markets</h2><p>Category-first navigation.</p></div>
        ${resolvedCategories.map((category) => `
          <button class="hdk-browser-category ${category.active ? "is-active" : ""}" type="button">
            <span>${escapeHtml(category.label)}</span>
            <strong>${escapeHtml(category.count)}</strong>
          </button>
        `).join("")}
      </aside>
      <section class="hdk-premium-market-browser__tape">
        <header class="hdk-card__header hdk-card__header-row">
          <div><p class="hdk-section-kicker">Live tape</p><h2>Markets moving now</h2></div>
          <span class="hdk-status-badge">${escapeHtml(resolvedMarkets.length)} visible</span>
        </header>
        <div class="hdk-market-tape-body">
          ${resolvedMarkets.map((market, index) => `
            <button class="hdk-market-tape-row ${index === 0 ? "is-active" : ""}" style="--hdk-market-columns:6" type="button">
              <span><strong class="hdk-market-title">${escapeHtml(market.title)}</strong><small class="hdk-market-meta">${escapeHtml(market.category)}</small></span>
              <span>${escapeHtml(market.mid)}</span>
              <span>${escapeHtml(market.spread)}</span>
              <span class="${String(market.movement || "").startsWith("-") ? "hdk-negative" : "hdk-positive"}">${escapeHtml(market.movement)}</span>
              <span>${escapeHtml(market.snapshots)}</span>
              <span>inspect</span>
            </button>
          `).join("")}
        </div>
      </section>
      <aside class="hdk-premium-market-browser__detail">
        <header class="hdk-card__header">
          <div><p class="hdk-section-kicker">Selected market</p><h2>${escapeHtml(resolvedSelected.title)}</h2><p>${escapeHtml(resolvedSelected.category)}</p></div>
        </header>
        <dl class="hdk-mini-metrics">
          <div><dt>Mid</dt><dd>${escapeHtml(resolvedSelected.mid)}</dd></div>
          <div><dt>Spread</dt><dd>${escapeHtml(resolvedSelected.spread)}</dd></div>
          <div><dt>Snapshots</dt><dd>${escapeHtml(resolvedSelected.snapshots)}</dd></div>
        </dl>
        ${renderPremiumComparisonChart({
          title: "Price movement",
          subtitle: "X axis: time · Y axis: cents",
          data: resolvedSnapshots,
          metrics: [{ key: "mid", label: "Mid", color: "var(--hdk-series-green)" }, { key: "spread", label: "Spread", color: "var(--hdk-series-amber)" }],
          activeMetric: "mid",
          windows: ["15m", "30m", "1h", "4h"],
          activeWindow: "1h"
        })}
      </aside>
    </section>
  `;
}

export function renderPremiumMediaApprovalWorkspace({
  packageTitle = "Content package review",
  channels = [],
  checklist = [],
  reviewId = "hdk.premium-media-approval-workspace"
} = {}) {
  const resolvedChannels =
    channels.length
      ? channels
      : [
          { label: "Instagram", status: "postable", tone: "success" },
          { label: "Facebook", status: "postable", tone: "success" },
          { label: "YouTube", status: "manual upload", tone: "warning" }
        ];
  const resolvedChecklist =
    checklist.length
      ? checklist
      : [
          { label: "Thumbnail attached", status: "ready" },
          { label: "SEO copy uses full transcript", status: "ready" },
          { label: "Publishable channels resolved", status: "ready" },
          { label: "Posting proof pending", status: "partial" }
        ];

  return `
    <section class="hdk-premium-media-workspace" data-hdk-component="PremiumMediaApprovalWorkspace"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header hdk-card__header-row">
        <div><p class="hdk-section-kicker">Approval workspace</p><h2>${escapeHtml(packageTitle)}</h2><p>Review package, publish destinations, QA state, and posting result together.</p></div>
        <div class="hdk-panel-actions"><button type="button">Approve</button><button type="button">Decline with reason</button></div>
      </header>
      <div class="hdk-premium-media-workspace__grid">
        <article class="hdk-package-preview hdk-premium-media-workspace__preview">
          <div class="hdk-thumbnail-placeholder">Thumbnail</div>
          <div class="hdk-package-assets"><a href="#">Video asset</a><a href="#">Thumbnail PNG</a><a href="#">Copy packet</a></div>
        </article>
        <article class="hdk-premium-media-workspace__copy">
          <h3>Upload copy</h3>
          <p>Transcript-derived title, description, tags, hashtags, and channel notes sit here with no third-person analysis language.</p>
          <dl class="hdk-fact-grid"><div><dt>SEO</dt><dd>ready</dd></div><div><dt>Transcript</dt><dd>complete</dd></div><div><dt>QA</dt><dd>human review</dd></div></dl>
        </article>
        <article class="hdk-premium-media-workspace__channels">
          <h3>Publishable destinations</h3>
          ${resolvedChannels.map((channel) => `<p class="hdk-postability hdk-tone-${escapeAttr(channel.tone || statusTone(channel.status))}"><strong>${escapeHtml(channel.label)}</strong><span>${escapeHtml(channel.status)}</span></p>`).join("")}
        </article>
        <article class="hdk-premium-media-workspace__checklist">
          <h3>Readiness</h3>
          ${resolvedChecklist.map((item) => `<p class="hdk-state-line"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.status)}</strong></p>`).join("")}
        </article>
      </div>
    </section>
  `;
}

export function renderPremiumPlannerCalendar({
  days = [],
  selected = [],
  reviewId = "hdk.premium-planner-calendar"
} = {}) {
  const resolvedDays =
    days.length
      ? days
      : Array.from({ length: 35 }).map((_, index) => ({
          day:
            index + 1,
          label:
            index % 7 === 0 ? "Plan" : index % 5 === 0 ? "Cook" : "Open",
          status:
            index % 7 === 0 ? "planned" : index % 5 === 0 ? "cook" : "open"
        }));
  const selectedSet =
    new Set(selected.length ? selected : [8, 9, 10]);

  return `
    <section class="hdk-premium-planner" data-hdk-component="PremiumPlannerCalendar"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <div class="hdk-premium-planner__calendar">
        <header class="hdk-card__header hdk-card__header-row">
          <div><p class="hdk-section-kicker">Planner</p><h2>August 2026</h2><p>Select one or more days, then plan from the drawer.</p></div>
          <div class="hdk-panel-actions"><button type="button">Previous</button><button type="button">Next</button></div>
        </header>
        <div class="hdk-calendar-weekdays">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("")}</div>
        <div class="hdk-calendar-month-grid">
          ${resolvedDays.map((day) => `
            <button class="hdk-calendar-day ${selectedSet.has(day.day) ? "is-selected" : ""}" type="button">
              <strong>${escapeHtml(day.day)}</strong>
              <span>${escapeHtml(day.label)}</span>
            </button>
          `).join("")}
        </div>
      </div>
      <aside class="hdk-premium-planner__drawer">
        <header><p class="hdk-section-kicker">Selected days</p><h2>${escapeHtml(Array.from(selectedSet).join(", "))}</h2></header>
        <label>Protein <input value="Chicken" readonly></label>
        <label>Side <input value="Rice" readonly></label>
        <label>Notes <textarea readonly>Generated meals avoid back-to-back repeated proteins unless entered manually.</textarea></label>
        <button type="button">Generate remaining open days</button>
      </aside>
    </section>
  `;
}

export function renderPremiumDrilldownWorkspace({
  title = "Selected detail",
  reviewId = "hdk.premium-drilldown-workspace"
} = {}) {
  return `
    <section class="hdk-premium-drilldown" data-hdk-component="PremiumDrilldownWorkspace"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <div class="hdk-premium-drilldown__context">
        <header class="hdk-card__header"><h2>Browse context</h2><p>The list stays visible while detail is inspected.</p></header>
        ${renderDataTable({
          columns: [
            { key: "item", label: "Item" },
            { key: "status", label: "Status" },
            { key: "age", label: "Age" }
          ],
          rows: [
            { item: "Finance carousel", status: "approved", age: "1h" },
            { item: "Kashi market", status: "partial", age: "4m" },
            { item: "Video package", status: "reviewing", age: "2h" }
          ],
          pageSize: 10,
          total: 3
        })}
      </div>
      <aside class="hdk-premium-drilldown__drawer">
        <header><p class="hdk-section-kicker">Drilldown</p><h2>${escapeHtml(title)}</h2><p>Facts, evidence, trend, and actions are separated.</p></header>
        <dl class="hdk-fact-grid"><div><dt>Status</dt><dd>partial</dd></div><div><dt>Freshness</dt><dd>2m</dd></div><div><dt>Owner</dt><dd>Ops</dd></div></dl>
        ${renderPremiumComparisonChart({ title: "Detail trend", subtitle: "X axis: day · Y axis: count" })}
        <div class="hdk-panel-actions"><button type="button">Approve</button><button type="button">Open evidence</button><button type="button">Request revision</button></div>
      </aside>
    </section>
  `;
}

export function renderResearchDeskWorkspace({
  title = "Build and resume investigations",
  subtitle = "Start a story investigation, resume active work, and move it through source, evidence, claim-lock, visual, and outline gates.",
  summary = {},
  maturity = {},
  projects = [],
  selectedProjectId = "",
  activeTab = "overview",
  activeAction = "",
  directionVariant = 0,
  reviewId = "hdk.research-desk",
  help = true
} = {}) {
  const selectedProject =
    projects.find((project) => project.projectId === selectedProjectId || project.id === selectedProjectId) ||
    projects[0] ||
    null;
  const needsAction =
    projects
      .filter((project) => Number(project.pendingHumanDecisions || 0) > 0 || Number(project.criticalGaps || 0) > 0)
      .slice(0, 8);
  return `
    <section class="hdk-research-desk" data-hdk-component="ResearchDeskWorkspace" data-review-id="${escapeAttr(reviewId)}">
      <header class="hdk-research-command hdk-card" data-hdk-component="CompactCommandHeader" data-review-id="${escapeAttr(reviewId)}.command">
        <div>
          <p class="hdk-section-kicker">Research Desk ${help ? renderHelpTip({
            label: "Research Desk",
            text: "Start a story investigation, resume an active project, and move it through source, evidence, claim-lock, visual, and outline gates.",
            reviewId: `${reviewId}.help.overview`
          }) : ""}</p>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <div class="hdk-research-command__metrics" data-hdk-component="MetricCardGroup">
          ${renderMetricCard({ label: "Projects", value: summary.total || projects.length || 0, detail: `${summary.recent || 0} recent` })}
          ${renderMetricCard({ label: "Needs decision", value: summary.pendingHumanDecisions || 0, detail: "human gates", tone: summary.pendingHumanDecisions ? "warning" : "success" })}
          ${renderMetricCard({ label: "Ready rate", value: summary.viabilityRate || "0%", detail: "outline viability", tone: summary.viabilityRate === "0%" ? "warning" : "success" })}
          ${renderMetricCard({ label: "Evidence", value: summary.pendingEvidenceReviews || 0, detail: "pending review", tone: summary.pendingEvidenceReviews ? "warning" : "success" })}
        </div>
      </header>

      <div class="hdk-research-layout" data-hdk-component="ThreePaneWorkspace">
        ${renderResearchProjectNavigator({ projects, selectedProject, needsAction, reviewId, help })}
        <main class="hdk-research-main">
          ${renderResearchProjectComposer({ maturity, reviewId, help })}
          ${selectedProject ? renderResearchActiveProject({ project: selectedProject, reviewId }) : renderStatePanel({
            state: "empty",
            title: "No research project selected",
            message: "Start a project to create a working space for sources, claims, evidence, and outline readiness.",
            reviewId: `${reviewId}.empty`
          })}
          ${selectedProject ? renderResearchWorkboards({ project: selectedProject, activeTab, reviewId, help }) : ""}
        </main>
        ${renderResearchInspector({ selectedProject, maturity, events: summary.recentEvents || [], reviewId })}
      </div>
      ${selectedProject && activeAction ? renderResearchActionDrawer({ project: selectedProject, actionId: activeAction, directionVariant, reviewId }) : ""}
    </section>
  `;
}

function renderResearchProjectNavigator({
  projects,
  selectedProject,
  needsAction,
  reviewId,
  help
}) {
  const selectedId =
    selectedProject?.projectId || selectedProject?.id || "";
  const groups =
    [
      ["Needs decision", projects.filter((project) => Number(project.pendingHumanDecisions || 0) > 0)],
      ["Needs research", projects.filter((project) => ["needs_more_research", "operator_started", "unreviewed"].includes(project.operatorReviewStatus || project.status))],
      ["Ready for outline", projects.filter((project) => project.operatorReviewStatus === "ready_for_outline" || project.status === "approved_for_outline")],
      ["Blocked", projects.filter((project) => project.operatorReviewStatus === "blocked" || Number(project.criticalGaps || 0) > 0)]
    ];
  return `
    <aside class="hdk-research-navigator hdk-card" data-hdk-component="WorkspaceSwitcher" data-review-id="${escapeAttr(reviewId)}.navigator">
      <div class="hdk-research-panel-head">
        <div>
          <span>Project navigator ${help ? renderHelpTip({
            label: "Project navigator",
            text: "Select a project to load its workboards in the center workspace. Urgent groups jump to the first project in that state.",
            reviewId: `${reviewId}.help.navigator`
          }) : ""}</span>
          <strong>${formatCompact(projects.length)} investigations</strong>
        </div>
        <b>${formatCompact(needsAction.length)} urgent</b>
      </div>
      <div class="hdk-research-project-list">
        ${projects.length ? projects.map((project) => renderResearchNavigatorRow({ project, selectedId })).join("") : renderStatePanel({
          state: "empty",
          title: "No projects yet",
          message: "Start one from the desk."
        })}
      </div>
      <div class="hdk-research-filter-stack">
        ${groups.map(([label, items]) => `
          <button type="button" class="hdk-research-filter-row" ${items[0] ? `data-research-open="${escapeAttr(items[0].projectId || items[0].id)}"` : "disabled"}>
            <span>${escapeHtml(label)}</span>
            <strong>${formatCompact(items.length)}</strong>
          </button>
        `).join("")}
      </div>
    </aside>
  `;
}

function renderResearchNavigatorRow({
  project,
  selectedId
}) {
  const projectId =
    project.projectId || project.id;
  return `
    <button class="hdk-research-nav-project ${projectId === selectedId ? "is-selected" : ""}" type="button" data-research-open="${escapeAttr(projectId)}">
      <span>${escapeHtml(project.title || "Untitled project")}</span>
      <small>${escapeHtml(researchPhase(project))} · ${project.updatedAt ? escapeHtml(formatDateLabel(project.updatedAt)) : "not dated"}</small>
      <b>${escapeHtml(researchOperatorStatusLabel(project.operatorReviewStatus || project.status))}</b>
    </button>
  `;
}

function renderResearchProjectComposer({
  maturity,
  reviewId,
  help
}) {
  return `
    <section class="hdk-research-composer hdk-card" data-hdk-component="ResearchProjectComposer" data-review-id="${escapeAttr(reviewId)}.composer">
      <div class="hdk-card__header hdk-card__header-row">
        <div>
          <h2>Start a research project ${help ? renderHelpTip({
            label: "Start project",
            text: "Create the lightweight investigation shell first. Sources, claims, counterevidence, and outline readiness can mature after the project exists.",
            reviewId: `${reviewId}.help.start`
          }) : ""}</h2>
        </div>
        <span class="hdk-status-badge hdk-tone-${escapeAttr(maturity.tier === "T3" ? "success" : "warning")}">${escapeHtml(maturity.tier || "T0")}</span>
      </div>
      <form class="hdk-research-project-form" data-research-create>
        <label>
          <span>Project title</span>
          <input name="title" type="text" placeholder="Creator economy platform shakeup" required>
        </label>
        <label>
          <span>Master question</span>
          <input name="masterQuestion" type="text" placeholder="What are we trying to prove or disprove?">
        </label>
        <label>
          <span>Topic / beat</span>
          <input name="topic" type="text" placeholder="media, politics, tech, finance">
        </label>
        <button class="hdk-button hdk-button-primary" type="submit">Start project</button>
      </form>
    </section>
  `;
}

function renderResearchActiveProject({
  project,
  reviewId
}) {
  const nextAction =
    researchNextWorkflowAction(project);
  return `
    <section class="hdk-research-active hdk-card" data-hdk-component="EntitySummaryCard" data-review-id="${escapeAttr(reviewId)}.active-project">
      <div class="hdk-research-active__head">
        <div>
          <span class="hdk-status-badge hdk-tone-${escapeAttr(researchProjectTone(project))}">${escapeHtml(project.status || "unknown")}</span>
          <h2>${escapeHtml(project.title || "Untitled project")}</h2>
          <p>${escapeHtml(project.masterQuestion || "No master question recorded yet.")}</p>
        </div>
        <div class="hdk-research-active__actions">
          ${renderResearchReviewButton(project, "needs_more_research", "Research")}
          ${renderResearchReviewButton(project, "needs_claim_work", "Claims")}
          ${renderResearchReviewButton(project, "ready_for_outline", "Ready")}
        </div>
      </div>
      ${renderResearchPhaseStepper(project)}
      <div class="hdk-research-active__grid">
        <div class="hdk-research-next-card">
          <span>Next best action</span>
          <strong>${escapeHtml(project.recommendedNextAction || "Define the first evidence pass.")}</strong>
          <button type="button" class="hdk-button hdk-button-primary" data-research-action="${escapeAttr(nextAction.id)}" data-research-project-id="${escapeAttr(project.projectId || project.id || "")}">
            ${escapeHtml(nextAction.label)}
          </button>
        </div>
        <div class="hdk-research-next-card">
          <span>Operator state</span>
          <strong>${escapeHtml(researchOperatorStatusLabel(project.operatorReviewStatus || project.status))}</strong>
          <small>${escapeHtml(project.operatorNote || project.operatorOwner || "No operator note yet.")}</small>
        </div>
        ${renderResearchSavedPlanCard(project)}
      </div>
    </section>
  `;
}

function renderResearchSavedPlanCard(project) {
  const plan =
    project.researchPlan || {};
  const selectedOption =
    (plan.directionOptions || []).find((option) => option.id === plan.selectedDirection) ||
    null;
  if (!plan.question && !plan.workingThesis && !selectedOption && !project.lastWorkflowActionAt) {
    return "";
  }
  return `
    <div class="hdk-research-next-card hdk-research-saved-plan" data-hdk-component="ResearchPlanSummary">
      <span>Saved plan</span>
      <strong>${escapeHtml(selectedOption?.label || "Plan direction saved")}</strong>
      <small>${escapeHtml(selectedOption?.thesis || plan.workingThesis || plan.question || "Research plan details saved.")}</small>
      ${project.lastWorkflowActionAt ? `<em>Saved ${escapeHtml(formatDateLabel(project.lastWorkflowActionAt))}</em>` : ""}
    </div>
  `;
}

function renderResearchPhaseStepper(project) {
  const current =
    researchPhase(project);
  const phases =
    [
      ["Intake", "define_research_plan"],
      ["Sourcing", "add_source"],
      ["Evidence", "review_evidence"],
      ["Claim lock", "lock_claims"],
      ["Outline", "approve_outline"],
      ["Handoff", "approve_outline"]
    ];
  const currentIndex =
    Math.max(0, phases.findIndex(([phase]) => phase === current));
  return `
    <div class="hdk-research-phase-stepper" aria-label="Research phase" data-hdk-component="ResearchPhaseStepper">
      ${phases.map(([phase, actionId], index) => `
        <button type="button" class="${index <= currentIndex ? "is-active" : ""}" data-research-action="${escapeAttr(actionId)}">
          <b>${index + 1}</b>
          ${escapeHtml(phase)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderResearchWorkboards({
  project,
  activeTab,
  reviewId,
  help
}) {
  const tabs =
    [
      ["overview", "Overview"],
      ["sources", "Sources"],
      ["research-gates", "Gates"],
      ["evidence", "Evidence"],
      ["claims", "Claims"],
      ["story-tree", "Story tree"],
      ["visuals", "Visuals"]
    ];
  return `
    <section class="hdk-research-workboards hdk-card" data-hdk-component="DrilldownPanel" data-review-id="${escapeAttr(reviewId)}.workboards">
      <div class="hdk-card__header">
        <div>
          <h2>Project workboards ${help ? renderHelpTip({
            label: "Project workboards",
            text: "Work the selected project in context: overview, gates, evidence, claims, story tree, and visual planning.",
            reviewId: `${reviewId}.help.workboards`
          }) : ""}</h2>
        </div>
      </div>
      <div class="hdk-research-board-tabs">
        ${tabs.map(([id, label]) => `
          <button type="button" class="${activeTab === id ? "is-active" : ""}" data-research-tab="${escapeAttr(id)}">${escapeHtml(label)}</button>
        `).join("")}
      </div>
      <div class="hdk-research-board-body">
        ${renderResearchBoardTab(project, activeTab)}
      </div>
    </section>
  `;
}

function renderResearchBoardTab(project, activeTab) {
  if (activeTab === "sources") {
    const sources =
      project.reviewWorkbench?.sourceInbox || [];
    return `
      ${renderResearchBoardActions([["add_source", "Add source"]])}
      ${renderResearchMiniTable({
        columns: ["Source", "Evidence", "Type", "Review"],
        rows:
          sources.length
            ? sources.map((item) => [
                item.title || item.sourceId || "Source",
                item.evidence || item.recommendedAction || item.sourceUrl || item.url || "Review source before using it in the story.",
                item.sourceType || item.sourceClass || "source",
                item.reviewStatus || item.status || "needs_review"
              ])
            : []
      })}
    `;
  }
  if (activeTab === "research-gates") {
    const gates =
      Object.entries(project.gates || {}).map(([label, status]) => ({
        label,
        status
      }));
    return `
      ${renderResearchBoardActions([
        ["define_research_plan", "Define plan"],
        ["resolve_gaps", "Resolve gaps"],
        ["approve_outline", "Approve outline"]
      ])}
      ${renderStateChecklist({
        items:
          gates.length
            ? gates.map((gate) => ({
                label: humanize(gate.label),
                status: gate.status,
                detail: gate.status === "approved" ? "Ready" : "Needs operator review"
              }))
            : [{ label: "Research plan", status: "pending", detail: "No gates recorded yet." }]
      })}
    `;
  }
  if (activeTab === "evidence") {
    const evidence =
      project.reviewWorkbench?.evidenceReview || [];
    return `
      ${renderResearchBoardActions([
        ["add_source", "Add source"],
        ["review_evidence", "Review evidence"]
      ])}
      ${renderResearchMiniTable({
        columns: ["Evidence", "Source", "Review", "Next"],
        rows:
          evidence.length
            ? evidence.map((item) => [
                item.evidence || item.title || item.evidenceId || "Evidence",
                item.sourceId || item.sourceUrl || "source",
                item.reviewStatus || item.status || "pending",
                item.recommendedAction || item.weakClaims || "Review"
              ])
            : []
      })}
    `;
  }
  if (activeTab === "claims") {
    const claims =
      project.reviewWorkbench?.claimLock || [];
    return `
      ${renderResearchBoardActions([["lock_claims", "Lock claim"]])}
      ${renderResearchMiniTable({
        columns: ["Claim", "Support", "Limit", "Evidence"],
        rows:
          claims.length
            ? claims.map((item) => [
                item.claim || item.title || "Claim",
                item.support || item.confidence || item.status || "unknown",
                item.limit || item.recommendedAction || "No limit recorded",
                `${item.evidenceCount || 0} evidence`
              ])
            : []
      })}
    `;
  }
  if (activeTab === "story-tree") {
    const nodes =
      project.storyTree?.nodes || project.storyTree || [];
    return renderResearchStack({
      items:
        Array.isArray(nodes) && nodes.length
          ? nodes.map((item) => ({
              title: item.title || item.label || item.id || "Story node",
              detail: item.detail || item.summary || item.type || "Node"
            }))
          : [{ title: "Story tree not generated yet", detail: "Generate or import story nodes from the research pipeline." }]
    });
  }
  if (activeTab === "visuals") {
    const visuals =
      project.visualPlan?.shots || project.visualPlan || [];
    return renderResearchStack({
      items:
        Array.isArray(visuals) && visuals.length
          ? visuals.map((item) => ({
              title: item.title || item.label || item.id || "Visual",
              detail: item.detail || item.prompt || item.status || "Visual planning item"
            }))
          : [{ title: "No visual plan yet", detail: "Add thumbnail, chart, screenshot, or B-roll requirements before outline handoff." }]
    });
  }
  return renderResearchStack({
    items: [
      ...(project.researchPlan?.selectedDirection ? [{
        title: "Selected research direction",
        detail: researchSelectedDirectionLabel(project)
      }] : []),
      {
        title: "Recommended next action",
        detail: project.recommendedNextAction || "Define the first evidence pass."
      },
      {
        title: "Source posture",
        detail: `${project.sourceSummary?.total || 0} total sources · ${project.sourceSummary?.primary || 0} primary`
      },
      {
        title: "Risk posture",
        detail: `${project.criticalGaps || 0} critical gaps · ${project.pendingHumanDecisions || 0} human decisions`
      }
    ]
  });
}

function researchSelectedDirectionLabel(project) {
  const plan =
    project.researchPlan || {};
  const selected =
    (plan.directionOptions || []).find((option) => option.id === plan.selectedDirection);
  if (!selected) return plan.selectedDirection || "Direction selected";
  return `${selected.label}: ${selected.thesis}`;
}

function renderResearchBoardActions(actions) {
  return `
    <div class="hdk-research-board-actions" data-hdk-component="ActionRail">
      ${actions.map(([actionId, label]) => `
        <button type="button" class="hdk-button" data-research-action="${escapeAttr(actionId)}">${escapeHtml(label)}</button>
      `).join("")}
    </div>
  `;
}

function renderResearchActionDrawer({ project, actionId, directionVariant = 0, reviewId }) {
  const action =
    getResearchDeskWorkflowAction(actionId) || getResearchDeskWorkflowAction("define_research_plan");
  const projectId =
    project.projectId || project.id || "";
  return `
    <aside class="hdk-research-action-drawer" data-hdk-component="ResearchActionDrawer" data-review-id="${escapeAttr(reviewId)}.action-drawer">
      <div class="hdk-research-action-drawer__panel hdk-card">
        <div class="hdk-card__header hdk-card__header-row">
          <div>
            <p class="hdk-section-kicker">${escapeHtml(action.phase)}</p>
            <h2>${escapeHtml(action.label)}</h2>
            <p>${escapeHtml(action.description)}</p>
          </div>
          <button type="button" class="hdk-button" data-research-action-close>Close</button>
        </div>
        <form class="hdk-research-action-form" data-research-action-form>
          <input type="hidden" name="projectId" value="${escapeAttr(projectId)}">
          <input type="hidden" name="actionId" value="${escapeAttr(action.id)}">
          <input type="hidden" name="tab" value="${escapeAttr(action.tab)}">
          ${action.id === "define_research_plan" ? renderResearchDirectionOptions({ project, directionVariant }) : ""}
          ${renderResearchActionFields(action, project)}
          <label>
            <span>Operator note</span>
            <textarea name="operatorNote" rows="3" placeholder="What changed, what is still unknown, or what should happen next?"></textarea>
          </label>
          <div class="hdk-research-action-footer">
            <button type="button" class="hdk-button" data-research-action-close>Cancel</button>
            <button type="submit" class="hdk-button hdk-button-primary">Save workflow update</button>
          </div>
        </form>
      </div>
    </aside>
  `;
}

function renderResearchActionFields(action, project = {}) {
  return action.fields.map((field) => {
    const label =
      humanize(field);
    const existingValue =
      researchExistingFieldValue(project, field);
    if (["workingThesis", "sourceTargets", "unknowns", "sourceNote", "evidenceNote", "claimEvidence", "outlineReadinessNote"].includes(field)) {
      return `<label><span>${escapeHtml(label)}</span><textarea name="${escapeAttr(field)}" rows="3" placeholder="${escapeAttr(researchFieldPlaceholder(field))}">${escapeHtml(existingValue)}</textarea></label>`;
    }
    if (field === "sourceClass") {
      return `
        <label>
          <span>Source class</span>
          <select name="sourceClass">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="historical">Historical</option>
            <option value="expert">Expert</option>
          </select>
        </label>
      `;
    }
    if (field === "evidenceDisposition") {
      return `
        <label>
          <span>Evidence disposition</span>
          <select name="evidenceDisposition">
            <option value="supports">Supports</option>
            <option value="weakens">Weakens</option>
            <option value="changes_direction">Changes direction</option>
            <option value="needs_verification">Needs verification</option>
          </select>
        </label>
      `;
    }
    if (field === "claimConfidence") {
      return `
        <label>
          <span>Claim confidence</span>
          <select name="claimConfidence">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      `;
    }
    if (field === "gapDisposition") {
      return `
        <label>
          <span>Gap disposition</span>
          <select name="gapDisposition">
            <option value="closed">Closed</option>
            <option value="deferred">Deferred</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
      `;
    }
    return `<label><span>${escapeHtml(label)}</span><input name="${escapeAttr(field)}" type="${field === "sourceUrl" ? "url" : "text"}" value="${escapeAttr(existingValue)}" placeholder="${escapeAttr(researchFieldPlaceholder(field))}"></label>`;
  }).join("");
}

function renderResearchDirectionOptions({ project, directionVariant = 0 }) {
  const options =
    researchDirectionOptions(project, directionVariant);
  const selectedDirection =
    project.researchPlan?.selectedDirection || options[0]?.id || "";
  return `
    <section class="hdk-research-direction-flow" data-hdk-component="ResearchDirectionFlow" data-review-id="hdk.research-direction-flow">
      <div class="hdk-card__header hdk-card__header-row">
        <div>
          <p class="hdk-section-kicker">Direction flow</p>
          <h3>Pick a research direction</h3>
          <p>Generated from the master question. Select the strongest path, then save it into the plan.</p>
        </div>
        <button type="button" class="hdk-button" data-research-generate-directions>Regenerate options</button>
      </div>
      <input type="hidden" name="directionOptionsJson" value="${escapeAttr(JSON.stringify(options))}">
      <div class="hdk-research-direction-grid">
        ${options.map((option) => `
          <label class="hdk-research-direction-card ${option.id === selectedDirection ? "is-selected" : ""}">
            <input type="radio" name="selectedDirection" value="${escapeAttr(option.id)}" ${option.id === selectedDirection ? "checked" : ""}>
            <span>${escapeHtml(option.label)}</span>
            <strong>${escapeHtml(option.thesis)}</strong>
            <small>${escapeHtml(option.evidence)}</small>
          </label>
        `).join("")}
      </div>
    </section>
  `;
}

function researchDirectionOptions(project, directionVariant = 0) {
  const savedOptions =
    project.researchPlan?.directionOptions;
  if (Array.isArray(savedOptions) && savedOptions.length >= 3 && Number(directionVariant) === 0) {
    return savedOptions;
  }
  const question =
    project.masterQuestion || project.researchPlan?.question || project.title || "What is the story?";
  const subject =
    question
      .replace(/[?!.]+$/g, "")
      .replace(/^(what|why|how|when|where|who|is|are|did|does|do|can|should)\s+/i, "")
      .slice(0, 80) || "the story";
  const variants =
    [
      [
        ["Money trail", `Follow the incentives behind ${subject}.`, "Revenue, funding, contracts, ownership, spending, or compensation records."],
        ["Power map", `Identify who benefits, who loses, and who controls the outcome.`, "Decision makers, affected groups, public statements, timelines, and dependency maps."],
        ["Before and after", `Show what changed and why it matters now.`, "Historical baseline, latest change, measurable impact, and counterexamples."]
      ],
      [
        ["Accountability angle", `Test whether the public explanation matches the record.`, "Primary documents, direct quotes, chronology, contradictions, and missing disclosures."],
        ["Human impact", `Anchor the story in who is affected by ${subject}.`, "Examples, testimonials, local data, costs, access, and second-order effects."],
        ["Market signal", `Look for measurable behavior that proves the story is real.`, "Search demand, pricing, audience response, volume, filings, or operational metrics."]
      ],
      [
        ["Contrarian read", `Pressure-test the obvious narrative around ${subject}.`, "Best opposing evidence, alternative explanations, incentives, and weak assumptions."],
        ["Timeline build", `Reconstruct the chain of events that created this moment.`, "Dates, announcements, filings, policy changes, posts, videos, and corrections."],
        ["Evidence-first path", `Let the strongest available records decide the final angle.`, "Primary sources, ranked evidence cards, confidence scoring, and unresolved gaps."]
      ]
    ];
  const set =
    variants[Math.abs(Number(directionVariant || 0)) % variants.length];
  return set.map(([label, thesis, evidence], index) => ({
    id: `direction_${Math.abs(Number(directionVariant || 0))}_${index + 1}`,
    label,
    thesis,
    evidence
  }));
}

function researchExistingFieldValue(project, field) {
  const plan =
    project.researchPlan || {};
  const values = {
    researchQuestion: plan.question || project.masterQuestion || "",
    workingThesis: plan.workingThesis || "",
    sourceTargets: plan.sourceTargets || "",
    unknowns: plan.unknowns || "",
  };
  return values[field] || "";
}

function researchFieldPlaceholder(field) {
  const placeholders = {
    researchQuestion: "What exact question should this project answer?",
    workingThesis: "The current story angle, with room to be wrong.",
    sourceTargets: "Documents, people, data, clips, or pages to collect.",
    unknowns: "What could change or disprove the story?",
    sourceTitle: "SEC filing, interview, dataset, clip, article...",
    sourceUrl: "https://...",
    sourceNote: "Why this source belongs in the project.",
    evidenceNote: "What the evidence says and where it came from.",
    claim: "A claim that can be backed by evidence.",
    claimEvidence: "Evidence IDs, URLs, or notes backing the claim.",
    gap: "What is missing or blocking confidence?",
    gapOwner: "operator, VA, agent, editor...",
    outlineReadinessNote: "Why this can or cannot move into outline."
  };
  return placeholders[field] || "";
}

function researchNextWorkflowAction(project) {
  const gates =
    project.gates || {};
  if (!gates.researchPlan || ["not_started", "needs_review", "blocked"].includes(gates.researchPlan)) {
    return getResearchDeskWorkflowAction("define_research_plan");
  }
  if ((project.sourceSummary?.total || 0) === 0) {
    return getResearchDeskWorkflowAction("add_source");
  }
  if ((project.reviewWorkbench?.summary?.pendingEvidenceReviews || 0) > 0) {
    return getResearchDeskWorkflowAction("review_evidence");
  }
  if ((project.claimSummary?.unresolved || 0) > 0 || (project.claimSummary?.total || 0) === 0) {
    return getResearchDeskWorkflowAction("lock_claims");
  }
  if ((project.criticalGaps || 0) > 0) {
    return getResearchDeskWorkflowAction("resolve_gaps");
  }
  return getResearchDeskWorkflowAction("approve_outline");
}

function renderResearchInspector({
  selectedProject,
  maturity,
  events = [],
  reviewId
}) {
  return `
    <aside class="hdk-research-inspector" data-hdk-component="DetailInspector" data-review-id="${escapeAttr(reviewId)}.inspector">
      <section class="hdk-card hdk-research-inspector-card" data-hdk-component="StatePanel">
        <div class="hdk-card__header hdk-card__header-row"><h2>Inspector</h2><span class="hdk-status-badge">${escapeHtml(selectedProject ? researchPhase(selectedProject) : "none")}</span></div>
        ${selectedProject ? `
          <div class="hdk-research-inspector-stack">
            ${renderMetricCard({ label: "Sources", value: selectedProject.sourceSummary?.total || 0, detail: `${selectedProject.sourceSummary?.primary || 0} primary` })}
            ${renderMetricCard({ label: "Claims", value: selectedProject.claimSummary?.total || 0, detail: `${selectedProject.claimSummary?.unresolved || 0} unresolved`, tone: selectedProject.claimSummary?.unresolved ? "warning" : "success" })}
            ${renderMetricCard({ label: "Gaps", value: selectedProject.criticalGaps || 0, detail: "critical", tone: selectedProject.criticalGaps ? "critical" : "success" })}
          </div>
        ` : renderStatePanel({ state: "empty", title: "Select a project", message: "Source, claim, and gap health appears here." })}
      </section>
      <section class="hdk-card hdk-research-inspector-card" data-hdk-component="ExpandableDataList">
        <div class="hdk-card__header hdk-card__header-row"><h2>Recent events</h2><span class="hdk-status-badge">${formatCompact(events.length)}</span></div>
        ${renderResearchStack({
          items:
            events.length
              ? events.slice(0, 8).map((item) => ({
                  title: item.type || "event",
                  detail: item.message || item.projectId || "",
                  value: item.createdAt ? formatDateLabel(item.createdAt) : ""
                }))
              : [{ title: "No recent events", detail: "Research activity events appear after the feed updates." }]
        })}
      </section>
      <section class="hdk-card hdk-research-inspector-card" data-hdk-component="StateChecklist">
        <div class="hdk-card__header hdk-card__header-row"><h2>Maturity checks</h2><span class="hdk-status-badge">${escapeHtml(maturity.tier || "T0")}</span></div>
        ${renderStateChecklist({
          items: (maturity.checks || []).map((check) => ({
            label: check.label,
            status: check.pass ? "pass" : "blocked",
            detail: check.detail || ""
          }))
        })}
      </section>
    </aside>
  `;
}

function renderResearchReviewButton(project, status, label) {
  const projectId =
    project.projectId || project.id || "";
  return `<button type="button" class="hdk-button" data-research-review="${escapeAttr(status)}" data-research-project="${escapeAttr(projectId)}">${escapeHtml(label)}</button>`;
}

function renderResearchMiniTable({
  columns,
  rows
}) {
  if (!rows.length) {
    return renderStatePanel({
      state: "empty",
      title: "No records yet",
      message: "This workboard will fill as the research pipeline exports review records."
    });
  }
  return `
    <div class="hdk-research-mini-table" data-hdk-component="DataTable">
      <table>
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderResearchStack({ items }) {
  return `
    <div class="hdk-research-stack">
      ${items.map((item) => `
        <article class="hdk-research-stack-item">
          <div>
            <strong>${escapeHtml(item.title || item.label || "Item")}</strong>
            ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
          </div>
          ${item.value ? `<b>${escapeHtml(item.value)}</b>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function researchPhase(project) {
  const gates =
    project.gates || {};
  if (project.operatorReviewStatus === "ready_for_outline" || project.status === "approved_for_outline") return "Outline";
  if (project.status === "operator_started") return "Intake";
  if (gates.claimLock === "approved" || project.status === "claim_lock") return "Claim lock";
  if ((project.reviewWorkbench?.summary?.evidenceCards || 0) > 0 || gates.preliminaryEvidence === "approved") return "Evidence";
  if ((project.sourceSummary?.total || 0) > 0 || gates.researchPlan === "approved") return "Sourcing";
  return "Intake";
}

function researchProjectTone(project) {
  const status =
    project.operatorReviewStatus || project.status || "";
  if (status.includes("blocked")) return "critical";
  if (status.includes("ready") || status.includes("approved")) return "success";
  if (status.includes("research") || status.includes("claim") || Number(project.criticalGaps || 0) > 0) return "warning";
  return "neutral";
}

function researchOperatorStatusLabel(status = "") {
  return humanize(status || "unreviewed");
}

function formatDateLabel(value) {
  const date =
    new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    month:
      "short",
    day:
      "numeric"
  });
}

export function renderTimeWindowSelector({
  windows = ["1D", "7D", "14D", "30D"],
  active = "7D",
  reviewId = ""
}) {
  return `
    <div class="hdk-segmented" data-hdk-component="TimeWindowSelector"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${windows.map((window) => `<button type="button" class="${window === active ? "is-active" : ""}">${escapeHtml(window)}</button>`).join("")}
    </div>
  `;
}

export function renderChartPanel({
  title,
  type = "line",
  subtitle = "",
  xAxis = "",
  xAxisLabel = "",
  yAxis = "",
  yAxisLabel = "",
  dimension = "",
  measure = "",
  badge = "",
  legend = [],
  children = "",
  reviewId = ""
}) {
  const axisAttributes =
    xAxis || yAxis
      ? ` data-x-axis="${escapeAttr(xAxis)}" data-x-axis-label="${escapeAttr(xAxisLabel)}" data-y-axis="${escapeAttr(yAxis)}" data-y-axis-label="${escapeAttr(yAxisLabel)}"`
      : ` data-dimension="${escapeAttr(dimension)}" data-measure="${escapeAttr(measure)}"`;

  return `
    <article class="hdk-chart-panel" data-hdk-component="ChartPanel" data-chart-type="${escapeAttr(type)}"${axisAttributes}${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <div class="hdk-chart-header">
        <div>
          <h3 class="hdk-chart-title">${escapeHtml(title)}</h3>
          <p class="hdk-chart-meta">${escapeHtml(subtitle || chartContractSummary({ xAxisLabel, yAxisLabel, dimension, measure }))}</p>
        </div>
        ${badge ? `<span class="hdk-chart-badge">${escapeHtml(badge)}</span>` : ""}
      </div>
      ${children}
      ${legend.length ? `<div class="hdk-chart-legend">${legend.map((item) => `<span class="hdk-chart-legend-item"><i class="hdk-chart-swatch" style="--hdk-series-color:${escapeAttr(item.color || "var(--hdk-chart-series-primary)")};"></i>${escapeHtml(item.label)}</span>`).join("")}</div>` : ""}
    </article>
  `;
}

export function renderHelpTip({
  label = "Help",
  text = "",
  icon = "?",
  reviewId = ""
} = {}) {
  return `
    <span class="hdk-help" data-hdk-component="HelpTip"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <button class="hdk-help__trigger" type="button" aria-label="${escapeAttr(label)}" data-help="${escapeAttr(text)}">${escapeHtml(icon)}</button>
      <span class="hdk-help__bubble" role="tooltip">${escapeHtml(text)}</span>
    </span>
  `;
}

export function renderInfoPopover({
  label = "More information",
  title = "Details",
  body = "",
  icon = "i",
  reviewId = ""
} = {}) {
  return `
    <details class="hdk-info-popover" data-hdk-component="InfoPopover"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <summary aria-label="${escapeAttr(label)}">${escapeHtml(icon)}</summary>
      <div class="hdk-info-popover__panel">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(body)}</p>
      </div>
    </details>
  `;
}

function renderCartesianChart({
  title,
  subtitle = "",
  data = [],
  xKey = "x",
  yKey = "y",
  yLabel = "",
  xLabel = "",
  width = 760,
  height = 320,
  component = "LineChart",
  mode = "line",
  reviewId = ""
}) {
  const margin =
    {
      top:
        24,
      right:
        28,
      bottom:
        48,
      left:
        58
    };
  const plotWidth =
    width - margin.left - margin.right;
  const plotHeight =
    height - margin.top - margin.bottom;
  const values =
    data.map((item, index) => ({
      x:
        item[xKey] ?? index,
      y:
        Number(item[yKey] ?? item.value ?? 0),
      label:
        item.label || item[xKey] || String(index + 1)
    }));
  const yValues =
    values.map((item) => item.y);
  const yMin =
    Math.min(0, ...yValues);
  const yMax =
    Math.max(1, ...yValues);
  const points =
    values.map((item, index) => {
      const x =
        margin.left + (values.length <= 1 ? plotWidth / 2 : (index / (values.length - 1)) * plotWidth);
      const y =
        margin.top + plotHeight - ((item.y - yMin) / (yMax - yMin || 1)) * plotHeight;
      return {
        ...item,
        xPos:
          x,
        yPos:
          y
      };
    });
  const path =
    linePath(points.map((item) => [item.xPos, item.yPos]));
  const areaPath =
    points.length
      ? `${path} L ${points.at(-1).xPos} ${margin.top + plotHeight} L ${points[0].xPos} ${margin.top + plotHeight} Z`
      : "";
  const ticks =
    [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y =
        margin.top + plotHeight - ratio * plotHeight;
      const value =
        yMin + ratio * (yMax - yMin);
      return {
        y,
        value
      };
    });
  const xTicks =
    points.filter((_, index) =>
      index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)
    );

  return `
    <section class="hdk-card hdk-chart-card" data-hdk-component="${escapeAttr(component)}"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${renderChartHeader(title, subtitle)}
      ${data.length < 2 ? renderStatePanel({ state: "partial", title: "Not enough chart data yet", message: "At least two points are required for a meaningful time series." }) : `
        <svg class="hdk-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(title || component)}">
          ${ticks.map((tick) => `
            <line class="hdk-chart__grid" x1="${margin.left}" x2="${width - margin.right}" y1="${tick.y}" y2="${tick.y}"></line>
            <text class="hdk-chart__axis" x="${margin.left - 10}" y="${tick.y + 4}" text-anchor="end">${formatCompact(tick.value)}</text>
          `).join("")}
          ${xTicks.map((tick) => `<text class="hdk-chart__axis" x="${tick.xPos}" y="${height - 16}" text-anchor="middle">${escapeHtml(tick.label)}</text>`).join("")}
          <text class="hdk-chart__label" x="${margin.left}" y="${height - 4}">${escapeHtml(xLabel)}</text>
          <text class="hdk-chart__label" x="14" y="${margin.top}" transform="rotate(-90 14 ${margin.top})">${escapeHtml(yLabel)}</text>
          ${mode === "area" ? `<path class="hdk-chart__area" d="${escapeAttr(areaPath)}"></path>` : ""}
          ${mode === "bar"
            ? renderBars(points, margin, plotWidth, plotHeight, yMin, yMax)
            : `<path class="hdk-chart__line" d="${escapeAttr(path)}"></path>${points.map((point) => `<circle class="hdk-chart__point" cx="${point.xPos}" cy="${point.yPos}" r="4"><title>${escapeHtml(`${point.label}: ${point.y}`)}</title></circle>`).join("")}`}
        </svg>
      `}
    </section>
  `;
}

function renderBars(points, margin, plotWidth, plotHeight, yMin, yMax) {
  const barWidth =
    Math.max(12, plotWidth / Math.max(1, points.length) * 0.58);
  return points.map((point) => {
    const zeroY =
      margin.top + plotHeight - ((0 - yMin) / (yMax - yMin || 1)) * plotHeight;
    const height =
      Math.abs(zeroY - point.yPos);
    return `<rect class="hdk-chart__bar" x="${point.xPos - barWidth / 2}" y="${Math.min(point.yPos, zeroY)}" width="${barWidth}" height="${height}"><title>${escapeHtml(`${point.label}: ${point.y}`)}</title></rect>`;
  }).join("");
}

function renderMarketCell(market, column) {
  if (column.render) {
    return column.render(market);
  }
  const value =
    market[column.key];
  if (column.key === "title") {
    return `<strong class="hdk-market-title">${escapeHtml(value || market.name || "Untitled market")}</strong>${market.subtitle ? `<small class="hdk-market-meta">${escapeHtml(market.subtitle)}</small>` : ""}`;
  }
  if (column.format === "currency") {
    return escapeHtml(formatCurrency(Number(value || 0)));
  }
  if (column.format === "percent") {
    return escapeHtml(`${Number(value || 0).toFixed(1)}%`);
  }
  return escapeHtml(value ?? "");
}

function renderOperationalPanel({
  component,
  title,
  subtitle = "",
  items = [],
  metrics = [],
  actions = [],
  reviewId = ""
}) {
  return `
    <section class="hdk-operational-panel" data-hdk-component="${escapeAttr(component)}"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header">
        <div>
          <h2>${escapeHtml(title || component)}</h2>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        </div>
        ${actions.length ? `<div class="hdk-panel-actions">${actions.map((action) => `<button type="button">${escapeHtml(action.label || action)}</button>`).join("")}</div>` : ""}
      </header>
      ${metrics.length ? `<dl class="hdk-mini-metrics hdk-panel-metrics">${metrics.map((metric) => `<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}</dd></div>`).join("")}</dl>` : ""}
      <div class="hdk-operational-list">
        ${items.length ? items.map((item) => `
          <article class="hdk-operational-row hdk-tone-${escapeAttr(item.tone || statusTone(item.status))}">
            <div>
              <span>${escapeHtml(item.status || item.type || "item")}</span>
              <h3>${escapeHtml(item.title || item.label || "Untitled")}</h3>
              ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
            </div>
            ${item.value ? `<strong>${escapeHtml(item.value)}</strong>` : ""}
          </article>
        `).join("") : renderStatePanel({ state: "empty", title: "No records", message: "This component has no records for the selected view." })}
      </div>
    </section>
  `;
}

function renderOperationalMatrix({
  component,
  title,
  rows = [],
  columns = [],
  reviewId = ""
}) {
  const resolvedColumns =
    columns.length
      ? columns
      : Array.from(new Set(rows.flatMap((row) => Object.keys(row.values || {}))));
  return `
    <section class="hdk-operational-panel hdk-operational-matrix" data-hdk-component="${escapeAttr(component)}"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      <header class="hdk-card__header"><h2>${escapeHtml(title || component)}</h2><p>${escapeHtml(rows.length)} row(s)</p></header>
      <div class="hdk-channel-matrix__scroll">
        <table class="hdk-table">
          <thead><tr><th scope="col">Dimension</th>${resolvedColumns.map((column) => `<th scope="col">${escapeHtml(column.label || column.key || column)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td><strong>${escapeHtml(row.label || row.name || "Untitled")}</strong>${row.detail ? `<small>${escapeHtml(row.detail)}</small>` : ""}</td>
                ${resolvedColumns.map((column) => {
                  const key = column.key || column;
                  const cell = row.values?.[key] || {};
                  return `<td><span class="hdk-postability hdk-tone-${escapeAttr(cell.tone || statusTone(cell.status))}">${escapeHtml(cell.value || cell.status || "unknown")}</span>${cell.detail ? `<small>${escapeHtml(cell.detail)}</small>` : ""}</td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function getDashboardKitComponentInventory() {
  return DASHBOARD_KIT_COMPONENT_INVENTORY.map((item) => ({
    ...item,
    components:
      [...item.components],
    references:
      [...item.references]
  }));
}

export function getDashboardKitReferenceFamilies() {
  return DASHBOARD_KIT_REFERENCE_FAMILIES.map((item) => ({
    ...item,
    references:
      [...item.references]
  }));
}

export function renderComponentIntakeBoard({
  items = DASHBOARD_KIT_COMPONENT_INVENTORY,
  reviewId = "hdk.component-intake-board"
} = {}) {
  const counts =
    items.reduce((acc, item) => {
      acc[item.status] =
        (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  return `
    <section class="hdk-card hdk-component-intake" data-hdk-component="ComponentIntakeBoard" data-review-id="${escapeAttr(reviewId)}">
      <header class="hdk-card__header">
        <div>
          <p class="hdk-eyebrow">Component Intake</p>
          <h2>Approve the building blocks before projects reuse them</h2>
          <p>Each family carries status, references, target tier, acceptance language, and the exact place where human taste should enter the system.</p>
        </div>
        <div class="hdk-gallery-status-strip" aria-label="Component status summary">
          ${["approved", "reviewing", "draft", "needs-redesign", "deprecated"].map((status) => `
            <span class="hdk-gallery-status hdk-gallery-status-${escapeAttr(status)}">${escapeHtml(humanize(status))}<strong>${counts[status] || 0}</strong></span>
          `).join("")}
        </div>
      </header>
      <div class="hdk-component-intake__grid">
        ${items.map((item) => renderComponentInventoryCard(item)).join("")}
      </div>
    </section>
  `;
}

export function renderDashboardKitGallery({
  title = "Hermes Dashboard Kit Gallery",
  subtitle = "Shared component intake, approval status, and premium dashboard references.",
  activeId = "gallery",
  theme = "light",
  inventory = DASHBOARD_KIT_COMPONENT_INVENTORY,
  references = DASHBOARD_KIT_REFERENCE_FAMILIES,
  reviewId = "hdk.dashboard-kit-gallery"
} = {}) {
  const approved =
    inventory.filter((item) => item.status === "approved").length;
  const reviewing =
    inventory.filter((item) => item.status === "reviewing").length;
  const draft =
    inventory.filter((item) => item.status === "draft").length;
  const allComponents =
    new Set(inventory.flatMap((item) => item.components));
  const actions =
    `
      <a class="hdk-button hdk-button-primary" href="#component-intake">Review components</a>
      <a class="hdk-button" href="#references">Reference families</a>
      <a class="hdk-button" href="#preview">Preview states</a>
    `;
  const children =
    `
      <section class="hdk-gallery-hero" data-review-id="hdk.gallery.hero">
        ${renderMetricCard({ label: "Component families", value: String(inventory.length), detail: "Grouped by dashboard job-to-be-done", tone: "info" })}
        ${renderMetricCard({ label: "Approved", value: String(approved), detail: "Safe for project adoption", tone: "success" })}
        ${renderMetricCard({ label: "Reviewing", value: String(reviewing), detail: "Needs visual approval before scale", tone: "warning" })}
        ${renderMetricCard({ label: "Draft", value: String(draft), detail: "Known gaps to design next", tone: "neutral" })}
      </section>
      <section class="hdk-gallery-section" id="references" data-review-id="hdk.gallery.references">
        <header class="hdk-card__header">
          <div>
            <p class="hdk-eyebrow">Mobbin-informed Intake</p>
            <h2>Reference families</h2>
            <p>Mobbin is used as pattern input. We extract structure and interaction standards, not copied screens.</p>
          </div>
        </header>
        <div class="hdk-reference-family-grid">
          ${references.map((family) => `
            <article class="hdk-reference-family">
              <span>${escapeHtml(family.label)}</span>
              <strong>${escapeHtml(family.references.join(" · "))}</strong>
              <p>${escapeHtml(family.extraction)}</p>
            </article>
          `).join("")}
        </div>
      </section>
      ${renderComponentIntakeBoard({ items: inventory, reviewId: "hdk.gallery.component-intake" })}
      <section class="hdk-gallery-section" id="preview" data-review-id="hdk.gallery.preview">
        <header class="hdk-card__header">
          <div>
            <p class="hdk-eyebrow">Preview Surface</p>
            <h2>What projects should inherit</h2>
            <p>These examples show the minimum interaction and state density projects should import before they claim Tier 3.</p>
          </div>
          <span class="hdk-pill hdk-tone-info">${allComponents.size} named components</span>
        </header>
        <div class="hdk-gallery-preview-grid">
          ${renderChartPanel({
            title:
              "Axis-bearing time series",
            type:
              "line",
            xAxis:
              "day",
            xAxisLabel:
              "Day",
            yAxis:
              "approval rate",
            yAxisLabel:
              "Percent",
            children:
              renderLineChart({
                title:
                  "Approval trend",
                data:
                  [
                    { x: "1D", y: 71 },
                    { x: "7D", y: 78 },
                    { x: "14D", y: 82 },
                    { x: "30D", y: 86 }
                  ],
                xLabel:
                  "Window",
                yLabel:
                  "Approval rate"
              })
          })}
          ${renderDataTable({
            caption:
              "Approval queue",
            columns:
              [
                { key: "item", label: "Item" },
                { key: "owner", label: "Owner" },
                { key: "status", label: "Status" }
              ],
            rows:
              [
                { item: "Finance for Thought package", owner: "Media Engine", status: "needs review" },
                { item: "Kashi live market browser", owner: "Kashi VC", status: "reviewing" },
                { item: "Meal planner calendar", owner: "Meal Assistant", status: "draft" }
              ],
            total:
              3
          })}
          ${renderStateChecklist({
            title:
              "Tier 3 checklist",
            items:
              [
                { label: "One shell", status: "ready", detail: "No nested app route." },
                { label: "Approved components", status: "partial", detail: "Draft families need review." },
                { label: "Proof states", status: "ready", detail: "Fresh/stale/partial/error visible." }
              ]
          })}
          ${renderDataFreshnessStrip({
            items:
              [
                { label: "Gallery data", state: "ready", value: "package source" },
                { label: "Reference intake", state: "partial", value: "human approval needed" },
                { label: "Project adoption", state: "stale", value: "requires migrations" }
              ]
          })}
        </div>
      </section>
    `;
  return `<div class="hdk-theme-scope" data-theme="${escapeAttr(theme)}" style="--hdk-gallery-responsive:clamp(16px,2vw,32px)">${renderDashboardShell({
    title,
    subtitle,
    activeId,
    reviewId,
    actions,
    sidebarStatus:
      "Source of truth for dashboard component approval and project adoption.",
    navGroups:
      [
        {
          id:
            "system",
          label:
            "Design System",
          items:
            [
              { id: "gallery", label: "Kit Gallery", href: "#top", shortLabel: "Kit" },
              { id: "references", label: "References", href: "#references", shortLabel: "Ref" },
              { id: "component-intake", label: "Component Intake", href: "#component-intake", shortLabel: "Int" },
              { id: "preview", label: "Preview States", href: "#preview", shortLabel: "Pre" }
            ]
        }
      ],
    children
  })}</div>`;
}

export function renderDashboardKitGalleryDocument(options = {}) {
  const css =
    options.css || "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title || "Hermes Dashboard Kit Gallery")}</title>
  ${css ? `<style>${css}</style>` : `<link rel="stylesheet" href="../../packages/hermes-dashboard-kit/src/dashboard-kit.css">`}
</head>
<body>
  <a id="top"></a>
  ${renderDashboardKitGallery(options)}
</body>
</html>
`;
}

function renderComponentInventoryCard(item) {
  const status =
    item.status || "draft";
  return `
    <article class="hdk-component-card hdk-gallery-status-${escapeAttr(status)}" data-component-family="${escapeAttr(item.id)}">
      <header>
        <span>${escapeHtml(item.family)}</span>
        <strong>${escapeHtml(humanize(status))}</strong>
      </header>
      <p>${escapeHtml(item.good)}</p>
      <div class="hdk-component-card__chips" aria-label="${escapeAttr(item.family)} components">
        ${(item.components || []).map((component) => `<span>${escapeHtml(component)}</span>`).join("")}
      </div>
      <dl>
        <div><dt>Target</dt><dd>${escapeHtml(item.targetTier || "tier-3")}</dd></div>
        <div><dt>References</dt><dd>${escapeHtml((item.references || []).join(", "))}</dd></div>
        <div><dt>Your role</dt><dd>${escapeHtml(item.userRole || "Approve or reject before project rollout.")}</dd></div>
      </dl>
    </article>
  `;
}

function renderAdvancedViz({
  component,
  title,
  data = [],
  xLabel = "X",
  yLabel = "Y",
  reviewId = ""
}) {
  const values =
    data.length
      ? data
      : [
          { label: "P25", value: 25 },
          { label: "Median", value: 50 },
          { label: "P75", value: 75 }
        ];
  return renderChartPanel({
    title,
    type:
      component,
    xAxis:
      "dimension",
    xAxisLabel:
      xLabel,
    yAxis:
      "measure",
    yAxisLabel:
      yLabel,
    reviewId,
    children:
      `
        <div class="hdk-advanced-viz" data-hdk-viz-kind="${escapeAttr(component)}">
          ${values.map((item, index) => `<span style="--hdk-viz-value:${Math.max(4, Math.min(100, Number(item.value || 0)))}%; --hdk-viz-index:${index};"><b>${escapeHtml(item.label || index + 1)}</b><i></i><strong>${escapeHtml(item.value ?? "")}</strong></span>`).join("")}
        </div>
      `
  }).replace('data-hdk-component="ChartPanel"', `data-hdk-component="${escapeAttr(component)}" data-hdk-chart-kind="ChartPanel"`);
}

function chartContractSummary({
  xAxisLabel,
  yAxisLabel,
  dimension,
  measure
}) {
  if (xAxisLabel || yAxisLabel) {
    return `${xAxisLabel || "X axis"} by ${yAxisLabel || "Y axis"}`;
  }
  return `${dimension || "dimension"} by ${measure || "measure"}`;
}

function renderChartHeader(title, subtitle) {
  return `
    <header class="hdk-card__header">
      <div>
        <h2>${escapeHtml(title || "Chart")}</h2>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
    </header>
  `;
}

function renderNavItem(item, activeId) {
  const active =
    item.id === activeId ? "is-active" : "";
  const ariaCurrent =
    item.id === activeId ? ` aria-current="page"` : "";
  return `<a class="${active}" href="${escapeAttr(item.href || `#${item.id}`)}" data-short="${escapeAttr(item.shortLabel || item.short || String(item.label || item.id).slice(0, 4))}"${ariaCurrent}>${escapeHtml(item.label)}${item.badge ? `<span>${escapeHtml(item.badge)}</span>` : ""}</a>`;
}

function normalizePoints(data, width, height, padding = 0) {
  const values =
    data.map((item) => Number(typeof item === "number" ? item : item.value ?? item.y ?? 0));
  const min =
    Math.min(...values, 0);
  const max =
    Math.max(...values, 1);
  return values.map((value, index) => [
    padding + (values.length <= 1 ? (width - padding * 2) / 2 : (index / (values.length - 1)) * (width - padding * 2)),
    padding + (height - padding * 2) - ((value - min) / (max - min || 1)) * (height - padding * 2)
  ]);
}

function linePath(points) {
  return points.map((point, index) =>
    `${index === 0 ? "M" : "L"} ${Number(point[0]).toFixed(2)} ${Number(point[1]).toFixed(2)}`
  ).join(" ");
}

function formatCell(value, column) {
  if (column?.format === "currency") {
    return escapeHtml(formatCurrency(Number(value || 0)));
  }
  if (column?.format === "percent") {
    return escapeHtml(`${Number(value || 0).toFixed(1)}%`);
  }
  return escapeHtml(value ?? "");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style:
      "currency",
    currency:
      "USD",
    maximumFractionDigits:
      2
  }).format(value);
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation:
      "compact",
    maximumFractionDigits:
      1
  }).format(value);
}

function statusTone(status) {
  if (["pass", "ready", "healthy"].includes(status)) {
    return "success";
  }
  if (["fail", "error", "blocked"].includes(status)) {
    return "danger";
  }
  if (["partial", "stale", "warning"].includes(status)) {
    return "warning";
  }
  return "neutral";
}

function priorityTone(priority) {
  if (["p0", "critical", "urgent", "high"].includes(String(priority || "").toLowerCase())) {
    return "danger";
  }
  if (["p1", "medium", "soon"].includes(String(priority || "").toLowerCase())) {
    return "warning";
  }
  if (["low", "p3", "done"].includes(String(priority || "").toLowerCase())) {
    return "success";
  }
  return "neutral";
}

function severityTone(severity) {
  if (["critical", "error", "p0", "blocker"].includes(String(severity || "").toLowerCase())) {
    return "danger";
  }
  if (["warning", "warn", "p1", "degraded"].includes(String(severity || "").toLowerCase())) {
    return "warning";
  }
  if (["info", "notice", "healthy"].includes(String(severity || "").toLowerCase())) {
    return "info";
  }
  return "neutral";
}

function humanize(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value)
    .replace(/"/g, "&quot;");
}
