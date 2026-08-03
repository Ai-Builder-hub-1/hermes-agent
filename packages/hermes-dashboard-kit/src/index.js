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

export function renderDashboardShell({
  title,
  subtitle = "",
  nav = [],
  navGroups = [],
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
      nav,
      navGroups,
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
  pageSize = 25,
  total = rows.length,
  reviewId = ""
}) {
  const visibleRows =
    rows.slice(0, pageSize);
  return `
    <section class="hdk-card hdk-table-card" data-hdk-component="DataTable"${reviewId ? ` data-review-id="${escapeAttr(reviewId)}"` : ""}>
      ${caption ? `<div class="hdk-card__header"><h2>${escapeHtml(caption)}</h2></div>` : ""}
      <div class="hdk-table-wrap">
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
        <span>Page ${escapeHtml(page)} · ${escapeHtml(visibleRows.length)} of ${escapeHtml(total)}</span>
        <div><button type="button">Previous</button><button type="button">Next</button></div>
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
              tab.pageSize || 25,
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
