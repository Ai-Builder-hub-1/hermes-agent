import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { cn } from "./utils";
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingState } from "./states";
import { KpiCard, StatusPill, TrendDelta } from "./metrics";
const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
};
const toneToAccent = {
    neutral: "hsl(var(--muted-foreground))",
    success: "#237a4b",
    warning: "#9b6b18",
    critical: "#ad3d32",
    info: "#256f8d",
    unknown: "hsl(var(--muted-foreground))",
};
export function VisualizationStateFrame({ state = "ready", title, description, children, className, }) {
    if (state === "loading")
        return _jsx(DashboardLoadingState, { label: title ?? "Loading visualization", className: className });
    if (state === "empty")
        return _jsx(DashboardEmptyState, { title: title ?? "No visualization data", description: description ?? "No values are available yet.", className: className });
    if (state === "error")
        return _jsx(DashboardErrorState, { title: title ?? "Unable to render visualization", message: description, className: className });
    return (_jsxs("div", { className: cn("relative min-w-0", className), children: [state === "preview" ? (_jsx("div", { className: "mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-200", children: "Preview data is shown to demonstrate the intended visualization shape." })) : null, state === "stale" ? (_jsx("div", { className: "mb-3 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground", children: "Data is stale. The layout is still available for review." })) : null, children] }));
}
export function PriceMovementChart({ data, state = "ready", height = 260, title = "Mid price movement", }) {
    if (state === "ready" && data.length < 2) {
        return _jsx(VisualizationStateFrame, { state: "empty", title: "Not enough price movement", description: "At least two snapshots are required.", children: _jsx("div", {}) });
    }
    return (_jsx(VisualizationStateFrame, { state: state, title: title, children: _jsx("div", { className: "rounded-lg border border-border bg-card p-3", style: { height }, role: "img", "aria-label": title, children: _jsx(ResponsiveContainer, { height: "100%", width: "100%", children: _jsxs(AreaChart, { data: data, margin: { bottom: 4, left: -18, right: 10, top: 14 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "hdk-mid-price-fill", x1: "0", x2: "0", y1: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#237a4b", stopOpacity: 0.32 }), _jsx("stop", { offset: "100%", stopColor: "#237a4b", stopOpacity: 0.02 })] }) }), _jsx(CartesianGrid, { stroke: "hsl(var(--border))", strokeDasharray: "2 6", vertical: false }), _jsx(XAxis, { dataKey: "label", fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickLine: false }), _jsx(YAxis, { fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => `${value}c`, tickLine: false }), _jsx(Tooltip, { contentStyle: tooltipStyle, formatter: (value) => [`${Number(value).toFixed(1)}c`, "mid price"] }), _jsx(Area, { dataKey: "midPrice", fill: "url(#hdk-mid-price-fill)", name: "mid price", stroke: "#237a4b", strokeWidth: 3, type: "monotone" })] }) }) }) }));
}
export function SpreadBandChart({ data, state = "ready", height = 180, }) {
    const normalized = data.map((point) => ({ ...point, spreadCents: typeof point.spread === "number" ? point.spread * 100 : undefined }));
    return (_jsx(VisualizationStateFrame, { state: state, title: "Spread band", children: _jsx("div", { className: "rounded-lg border border-border bg-card p-3", style: { height }, role: "img", "aria-label": "spread band chart", children: _jsx(ResponsiveContainer, { height: "100%", width: "100%", children: _jsxs(BarChart, { data: normalized, margin: { bottom: 2, left: -18, right: 10, top: 10 }, children: [_jsx(CartesianGrid, { stroke: "hsl(var(--border))", strokeDasharray: "2 6", vertical: false }), _jsx(XAxis, { dataKey: "label", fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickLine: false }), _jsx(YAxis, { fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => `${value}c`, tickLine: false }), _jsx(Tooltip, { contentStyle: tooltipStyle, formatter: (value) => [`${Number(value).toFixed(1)}c`, "spread"] }), _jsx(Bar, { dataKey: "spreadCents", fill: "#9b6b18", name: "spread", radius: [6, 6, 0, 0] })] }) }) }) }));
}
export function LiquidityDepthChart({ data, state = "ready", height = 200, }) {
    const normalized = data.map((point) => ({
        ...point,
        bidDepth: point.bidDepth ?? 0,
        askDepth: point.askDepth ?? 0,
    }));
    return (_jsx(VisualizationStateFrame, { state: state, title: "Liquidity depth", children: _jsx("div", { className: "rounded-lg border border-border bg-card p-3", style: { height }, role: "img", "aria-label": "liquidity depth chart", children: _jsx(ResponsiveContainer, { height: "100%", width: "100%", children: _jsxs(BarChart, { data: normalized, margin: { bottom: 2, left: -10, right: 10, top: 10 }, children: [_jsx(CartesianGrid, { stroke: "hsl(var(--border))", strokeDasharray: "2 6", vertical: false }), _jsx(XAxis, { dataKey: "label", fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickLine: false }), _jsx(YAxis, { fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => compactNumber(Number(value)), tickLine: false }), _jsx(Tooltip, { contentStyle: tooltipStyle, formatter: (value, name) => [compactNumber(Number(value)), name === "bidDepth" ? "bid depth" : "ask depth"] }), _jsx(Bar, { dataKey: "bidDepth", fill: "#237a4b", name: "bidDepth", radius: [6, 6, 0, 0], stackId: "depth" }), _jsx(Bar, { dataKey: "askDepth", fill: "#256f8d", name: "askDepth", radius: [6, 6, 0, 0], stackId: "depth" })] }) }) }) }));
}
export function VolumePulseChart({ data, state = "ready", height = 160, }) {
    return (_jsx(VisualizationStateFrame, { state: state, title: "Volume pulse", children: _jsx("div", { className: "rounded-lg border border-border bg-card p-3", style: { height }, role: "img", "aria-label": "volume pulse chart", children: _jsx(ResponsiveContainer, { height: "100%", width: "100%", children: _jsxs(ComposedChart, { data: data, margin: { bottom: 2, left: -18, right: 10, top: 10 }, children: [_jsx(CartesianGrid, { stroke: "hsl(var(--border))", strokeDasharray: "2 6", vertical: false }), _jsx(XAxis, { dataKey: "label", fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickLine: false }), _jsx(YAxis, { fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => compactNumber(Number(value)), tickLine: false }), _jsx(Tooltip, { contentStyle: tooltipStyle, formatter: (value) => [compactNumber(Number(value)), "volume"] }), _jsx(Bar, { dataKey: "volume", fill: "#256f8d", name: "volume", radius: [5, 5, 0, 0] }), _jsx(Line, { dataKey: "volume", dot: false, stroke: "#172026", strokeWidth: 2, type: "monotone" })] }) }) }) }));
}
export function MarketTape({ rows, selectedId, onSelect, state = "ready", }) {
    if (state !== "ready" && state !== "preview" && state !== "stale") {
        return _jsx(VisualizationStateFrame, { state: state, title: "Market tape", children: _jsx("div", {}) });
    }
    if (!rows.length) {
        return _jsx(VisualizationStateFrame, { state: "empty", title: "No markets in tape", description: "No market rows match the active filters.", children: _jsx("div", {}) });
    }
    return (_jsxs("div", { className: "overflow-hidden rounded-lg border border-border bg-card", children: [_jsxs("div", { className: "grid grid-cols-[minmax(15rem,1.8fr)_repeat(5,minmax(6rem,1fr))] border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground", children: [_jsx("div", { children: "Market" }), _jsx("div", { children: "Mid" }), _jsx("div", { children: "Move" }), _jsx("div", { children: "Spread" }), _jsx("div", { children: "Depth" }), _jsx("div", { children: "Seen" })] }), _jsx("div", { className: "max-h-[30rem] overflow-auto", children: rows.map((row) => (_jsxs("button", { type: "button", className: cn("grid w-full grid-cols-[minmax(15rem,1.8fr)_repeat(5,minmax(6rem,1fr))] items-center gap-2 border-b border-border px-3 py-3 text-left text-sm last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none", selectedId === row.id && "bg-primary/5"), onClick: () => onSelect?.(row), children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate font-medium text-foreground", children: row.title }), _jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground", children: [row.ticker ? _jsx("span", { children: row.ticker }) : null, row.category ? _jsx("span", { children: row.category }) : null, _jsx(StatusPill, { tone: row.tone ?? marketStatusTone(row.status), children: row.status ?? "unknown" })] })] }), _jsx("div", { className: "font-mono text-foreground", children: formatCents(row.midPrice) }), _jsx("div", { children: _jsx(TrendDelta, { value: Number(row.movementCents ?? 0), suffix: "c" }) }), _jsx("div", { className: "font-mono text-muted-foreground", children: formatCents(row.spreadCents) }), _jsx("div", { className: "font-mono text-muted-foreground", children: compactNumber(row.totalDepth) }), _jsx("div", { className: "text-xs text-muted-foreground", children: row.lastSeenLabel ?? "n/a" })] }, row.id))) })] }));
}
export function MarketVolatilityDrawer({ title, subtitle, points, state = "ready", actions, }) {
    const latest = points.at(-1);
    const first = points.at(0);
    const movement = latest && first ? latest.midPrice - first.midPrice : 0;
    const latestSpread = typeof latest?.spread === "number" ? latest.spread * 100 : undefined;
    const latestDepth = (latest?.bidDepth ?? 0) + (latest?.askDepth ?? 0);
    return (_jsxs("aside", { className: "grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "truncate text-lg font-semibold text-foreground", children: title }), subtitle ? _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: subtitle }) : null] }), actions] }), _jsxs("div", { className: "grid gap-3 md:grid-cols-4", children: [_jsx(KpiCard, { label: "Movement", value: `${movement.toFixed(1)}c`, detail: "Selected window", className: "min-h-24" }), _jsx(KpiCard, { label: "Mid price", value: formatCents(latest?.midPrice), detail: "Latest snapshot", className: "min-h-24" }), _jsx(KpiCard, { label: "Spread", value: formatCents(latestSpread), detail: "Bid/ask width", className: "min-h-24" }), _jsx(KpiCard, { label: "Total depth", value: compactNumber(latestDepth), detail: "Bid + ask", className: "min-h-24" })] }), _jsx(PriceMovementChart, { data: points, state: state }), _jsxs("div", { className: "grid gap-3 xl:grid-cols-2", children: [_jsx(SpreadBandChart, { data: points, state: state }), _jsx(LiquidityDepthChart, { data: points, state: state })] })] }));
}
export function CategoryHeatmap({ rows, columns, cells, state = "ready", }) {
    if (state !== "ready" && state !== "preview" && state !== "stale") {
        return _jsx(VisualizationStateFrame, { state: state, title: "Category heatmap", children: _jsx("div", {}) });
    }
    const max = Math.max(...cells.map((cell) => cell.value), 1);
    const lookup = new Map(cells.map((cell) => [`${cell.row}:${cell.column}`, cell]));
    return (_jsx(VisualizationStateFrame, { state: state, title: "Category heatmap", children: _jsx("div", { className: "overflow-x-auto rounded-lg border border-border bg-card p-3", children: _jsxs("div", { className: "grid min-w-[42rem] gap-1", style: { gridTemplateColumns: `10rem repeat(${columns.length}, minmax(6rem, 1fr))` }, children: [_jsx("div", {}), columns.map((column) => _jsx("div", { className: "px-2 py-1 text-xs font-semibold text-muted-foreground", children: column }, column)), rows.map((row) => (_jsxs("div", { className: "contents", children: [_jsx("div", { className: "px-2 py-3 text-sm font-medium text-foreground", children: row }), columns.map((column) => {
                                const cell = lookup.get(`${row}:${column}`);
                                const value = cell?.value ?? 0;
                                const opacity = value > 0 ? 0.12 + (value / max) * 0.62 : 0.04;
                                const tone = cell?.tone ?? "info";
                                return (_jsx("div", { className: "rounded-md border border-border px-2 py-3 text-center font-mono text-sm text-foreground", title: cell?.label ?? `${row} / ${column}: ${value}`, style: { backgroundColor: colorWithOpacity(toneToAccent[tone], opacity) }, children: cell?.label ?? compactNumber(value) }, `${row}:${column}`));
                            })] }, row)))] }) }) }));
}
export function OpportunityMatrix(props) {
    return _jsx(CategoryHeatmap, { ...props });
}
export function ProviderSpendTimeline({ data, state = "ready", height = 240, }) {
    return (_jsx(VisualizationStateFrame, { state: state, title: "Provider spend timeline", children: _jsx("div", { className: "rounded-lg border border-border bg-card p-3", style: { height }, role: "img", "aria-label": "provider spend timeline", children: _jsx(ResponsiveContainer, { height: "100%", width: "100%", children: _jsxs(ComposedChart, { data: data, margin: { bottom: 2, left: -12, right: 10, top: 10 }, children: [_jsx(CartesianGrid, { stroke: "hsl(var(--border))", strokeDasharray: "2 6", vertical: false }), _jsx(XAxis, { dataKey: "label", fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickLine: false }), _jsx(YAxis, { fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => `$${Number(value).toFixed(0)}`, tickLine: false }), _jsx(Tooltip, { contentStyle: tooltipStyle, formatter: (value, name) => [name === "cost" ? `$${Number(value).toFixed(2)}` : compactNumber(Number(value)), name] }), _jsx(Bar, { dataKey: "cost", fill: "#256f8d", name: "cost", radius: [6, 6, 0, 0] }), _jsx(Line, { dataKey: "tokens", dot: false, stroke: "#237a4b", strokeWidth: 2, type: "monotone" })] }) }) }) }));
}
export function CrosshairTooltipFrame({ title, description, children, state = "ready", }) {
    return (_jsx(VisualizationStateFrame, { state: state, title: title, description: description, children: _jsxs("section", { className: "rounded-lg border border-border bg-card p-3 shadow-sm", children: [_jsxs("div", { className: "mb-3 flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-foreground", children: title }), description ? _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: description }) : null] }), _jsx(StatusPill, { tone: "info", children: "hover detail" })] }), _jsxs("div", { className: "relative min-w-0", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-2 left-1/2 z-10 hidden w-px bg-primary/30 md:block", "aria-hidden": "true" }), children] })] }) }));
}
export function OrderBookLadder({ levels, state = "ready", title = "Order book ladder", }) {
    const maxDepth = Math.max(...levels.map((level) => Math.max(level.bidSize ?? 0, level.askSize ?? 0)), 1);
    return (_jsx(VisualizationStateFrame, { state: state, title: title, children: _jsxs("section", { className: "overflow-hidden rounded-lg border border-border bg-card", "aria-label": title, children: [_jsxs("div", { className: "grid grid-cols-[1fr_6rem_1fr] border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground", children: [_jsx("span", { children: "Bid depth" }), _jsx("span", { className: "text-center", children: "Price" }), _jsx("span", { className: "text-right", children: "Ask depth" })] }), _jsx("div", { className: "divide-y divide-border", children: levels.map((level) => (_jsxs("div", { className: "grid grid-cols-[1fr_6rem_1fr] items-center gap-2 px-3 py-2 text-sm", children: [_jsxs("div", { className: "relative min-h-7 overflow-hidden rounded bg-muted", children: [_jsx("div", { className: "absolute inset-y-0 right-0 bg-emerald-500/25", style: { width: `${((level.bidSize ?? 0) / maxDepth) * 100}%` } }), _jsx("span", { className: "relative z-10 block px-2 py-1 font-mono text-foreground", children: compactNumber(level.bidSize) })] }), _jsx("div", { className: "text-center font-mono font-semibold text-foreground", children: formatCents(level.price) }), _jsxs("div", { className: "relative min-h-7 overflow-hidden rounded bg-muted text-right", children: [_jsx("div", { className: "absolute inset-y-0 left-0 bg-sky-500/25", style: { width: `${((level.askSize ?? 0) / maxDepth) * 100}%` } }), _jsx("span", { className: "relative z-10 block px-2 py-1 font-mono text-foreground", children: compactNumber(level.askSize) })] })] }, level.price))) })] }) }));
}
export function ForecastConeChart({ data, state = "ready", height = 240, title = "Forecast cone", }) {
    const normalized = data.map((point) => ({ ...point, band: Math.max(point.high - point.low, 0) }));
    return (_jsx(VisualizationStateFrame, { state: state, title: title, children: _jsx("div", { className: "rounded-lg border border-border bg-card p-3", style: { height }, role: "img", "aria-label": title, children: _jsx(ResponsiveContainer, { height: "100%", width: "100%", children: _jsxs(ComposedChart, { data: normalized, margin: { bottom: 2, left: -18, right: 10, top: 10 }, children: [_jsx(CartesianGrid, { stroke: "hsl(var(--border))", strokeDasharray: "2 6", vertical: false }), _jsx(XAxis, { dataKey: "label", fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickLine: false }), _jsx(YAxis, { fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => `${Number(value).toFixed(0)}c`, tickLine: false }), _jsx(Tooltip, { contentStyle: tooltipStyle, formatter: (value, name) => [`${Number(value).toFixed(1)}c`, name] }), _jsx(Area, { dataKey: "high", fill: "#256f8d", fillOpacity: 0.12, name: "high", stroke: "#256f8d", strokeOpacity: 0.24, type: "monotone" }), _jsx(Area, { dataKey: "low", fill: "#ffffff", fillOpacity: 1, name: "low", stroke: "#256f8d", strokeOpacity: 0.24, type: "monotone" }), _jsx(Line, { dataKey: "expected", dot: false, name: "expected", stroke: "#172026", strokeWidth: 2.5, type: "monotone" }), _jsx(Line, { dataKey: "actual", dot: false, name: "actual", stroke: "#237a4b", strokeDasharray: "4 4", strokeWidth: 2, type: "monotone" })] }) }) }) }));
}
export function WaterfallChart({ data, state = "ready", height = 240, title = "Waterfall", }) {
    let running = 0;
    const normalized = data.map((step) => {
        const start = running;
        running += step.value;
        return { ...step, start, end: running, absValue: Math.abs(step.value) };
    });
    return (_jsx(VisualizationStateFrame, { state: state, title: title, children: _jsx("div", { className: "rounded-lg border border-border bg-card p-3", style: { height }, role: "img", "aria-label": title, children: _jsx(ResponsiveContainer, { height: "100%", width: "100%", children: _jsxs(BarChart, { data: normalized, margin: { bottom: 2, left: -12, right: 10, top: 10 }, children: [_jsx(CartesianGrid, { stroke: "hsl(var(--border))", strokeDasharray: "2 6", vertical: false }), _jsx(XAxis, { dataKey: "label", fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickLine: false }), _jsx(YAxis, { fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickFormatter: (value) => compactNumber(Number(value)), tickLine: false }), _jsx(Tooltip, { contentStyle: tooltipStyle, formatter: (value, name) => [compactNumber(Number(value)), name === "value" ? "change" : name] }), _jsx(Bar, { dataKey: "value", name: "value", radius: [6, 6, 0, 0], children: normalized.map((step) => (_jsx(Cell, { fill: step.value >= 0 ? "#237a4b" : "#ad3d32", opacity: step.tone === "unknown" ? 0.45 : 0.88 }, step.id))) })] }) }) }) }));
}
export function BusinessUnitCostCard({ name, cost, revenue, tokenCount, tone = "neutral", }) {
    const margin = typeof revenue === "number" ? revenue - cost : undefined;
    return (_jsx(KpiCard, { label: name, value: `$${cost.toFixed(2)}`, tone: tone, detail: typeof margin === "number" ? `Net ${margin >= 0 ? "+" : ""}$${margin.toFixed(2)}` : "Cost tracked", footer: typeof tokenCount === "number" ? `${compactNumber(tokenCount)} tokens` : undefined }));
}
export function AlertRail({ items, state = "ready", }) {
    if (state !== "ready" && state !== "preview" && state !== "stale") {
        return _jsx(VisualizationStateFrame, { state: state, title: "Alert rail", children: _jsx("div", {}) });
    }
    if (!items.length)
        return _jsx(DashboardEmptyState, { title: "No alerts", description: "No current dashboard alerts are active." });
    return (_jsx("div", { className: "grid gap-2", children: items.map((item) => (_jsxs("article", { className: "rounded-lg border border-border bg-card p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-medium text-foreground", children: item.title }), item.detail ? _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: item.detail }) : null] }), _jsx(StatusPill, { tone: item.tone ?? "neutral", children: item.tone ?? "neutral" })] }), item.timestampLabel ? _jsx("div", { className: "mt-3 text-xs text-muted-foreground", children: item.timestampLabel }) : null] }, item.id))) }));
}
export function DrilldownPanel({ title, subtitle, children, footer, }) {
    return (_jsxs("section", { className: "rounded-lg border border-border bg-card p-4 shadow-sm", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-base font-semibold text-foreground", children: title }), subtitle ? _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: subtitle }) : null] }), _jsx("div", { className: "min-w-0", children: children }), footer ? _jsx("div", { className: "mt-4 border-t border-border pt-3 text-sm text-muted-foreground", children: footer }) : null] }));
}
export function TimeWindowSelector({ value, options, onChange, }) {
    return (_jsx("div", { className: "inline-flex flex-wrap rounded-lg border border-border bg-card p-1", role: "group", "aria-label": "Time window", children: options.map((option) => (_jsx("button", { type: "button", className: cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", option.value === value && "bg-primary text-primary-foreground hover:bg-primary"), onClick: () => onChange?.(option.value), children: option.label }, option.value))) }));
}
export function dashboardVizPreviewMarketPoints() {
    const mids = [48, 51, 49, 56, 61, 58, 66, 63];
    const spreads = [0.09, 0.07, 0.08, 0.055, 0.05, 0.064, 0.042, 0.046];
    const bidDepth = [1800, 2600, 2200, 4100, 5300, 4700, 6900, 6200];
    const askDepth = [2400, 2100, 2800, 2500, 2200, 3000, 2700, 3200];
    const volume = [320, 780, 560, 1300, 2100, 1600, 2900, 2400];
    return mids.map((midPrice, index) => ({
        label: `${index * 2}m`,
        midPrice,
        spread: spreads[index],
        bidDepth: bidDepth[index],
        askDepth: askDepth[index],
        volume: volume[index],
    }));
}
function marketStatusTone(status) {
    if (status === "live")
        return "success";
    if (status === "upcoming")
        return "info";
    if (status === "expired")
        return "neutral";
    return "unknown";
}
function compactNumber(value) {
    if (typeof value !== "number" || !Number.isFinite(value))
        return "n/a";
    return new Intl.NumberFormat("en", { maximumFractionDigits: value >= 1000 ? 1 : 0, notation: value >= 1000 ? "compact" : "standard" }).format(value);
}
function formatCents(value) {
    if (typeof value !== "number" || !Number.isFinite(value))
        return "n/a";
    return `${value.toFixed(Math.abs(value) < 10 ? 1 : 0)}c`;
}
function colorWithOpacity(color, opacity) {
    if (color.startsWith("#")) {
        const r = Number.parseInt(color.slice(1, 3), 16);
        const g = Number.parseInt(color.slice(3, 5), 16);
        const b = Number.parseInt(color.slice(5, 7), 16);
        return `rgb(${r} ${g} ${b} / ${opacity})`;
    }
    return color;
}
//# sourceMappingURL=data-visualization.js.map