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
  activeId = "",
  actions = "",
  children = "",
  reviewId = "hermes.dashboard-shell",
  tier = EXPERIENCE_TIERS.productCockpit
}) {
  return `
    <div class="hdk-shell" data-hdk-component="DashboardShell" data-experience-tier="${escapeAttr(tier)}" data-review-id="${escapeAttr(reviewId)}">
      <aside class="hdk-sidebar" data-hdk-component="Sidebar">
        <div class="hdk-brand">
          <span class="hdk-brand__mark">H</span>
          <span>
            <strong>${escapeHtml(title)}</strong>
            ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
          </span>
        </div>
        <nav class="hdk-nav" aria-label="Dashboard navigation">
          ${nav.map((item) => renderNavItem(item, activeId)).join("")}
        </nav>
      </aside>
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
  return `<a class="${active}" href="${escapeAttr(item.href || `#${item.id}`)}">${escapeHtml(item.label)}${item.badge ? `<span>${escapeHtml(item.badge)}</span>` : ""}</a>`;
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
