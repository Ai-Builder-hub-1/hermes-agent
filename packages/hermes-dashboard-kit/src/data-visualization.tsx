import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "./utils";
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingState } from "./states";
import { KpiCard, StatusPill, TrendDelta, type DashboardTone } from "./metrics";

export type DashboardVizState = "ready" | "loading" | "empty" | "error" | "preview" | "stale";

export type MarketSnapshotPoint = {
  label: string;
  timestamp?: string;
  midPrice: number;
  spread?: number;
  bidDepth?: number;
  askDepth?: number;
  volume?: number;
};

export type MarketTapeRow = {
  id: string;
  title: string;
  ticker?: string;
  category?: string;
  status?: "live" | "expired" | "upcoming" | "unknown";
  midPrice?: number;
  movementCents?: number;
  spreadCents?: number;
  totalDepth?: number;
  volume24h?: number;
  openInterest?: number;
  lastSeenLabel?: string;
  tone?: DashboardTone;
};

export type OpportunityCell = {
  row: string;
  column: string;
  value: number;
  label?: string;
  tone?: DashboardTone;
};

export type AlertRailItem = {
  id: string;
  title: string;
  detail?: string;
  tone?: DashboardTone;
  timestampLabel?: string;
};

export type OrderBookLevel = {
  price: number;
  bidSize?: number;
  askSize?: number;
  bidCount?: number;
  askCount?: number;
};

export type ForecastConePoint = {
  label: string;
  low: number;
  expected: number;
  high: number;
  actual?: number;
};

export type WaterfallStep = {
  id: string;
  label: string;
  value: number;
  tone?: DashboardTone;
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--hdk-radius, 8px)",
  color: "hsl(var(--foreground))",
};

const toneToAccent: Record<DashboardTone, string> = {
  neutral: "hsl(var(--muted-foreground))",
  success: "var(--hdk-status-success, hsl(var(--primary)))",
  warning: "var(--hdk-status-warning, hsl(var(--primary)))",
  critical: "var(--hdk-status-error, hsl(var(--destructive, var(--primary))))",
  info: "var(--hdk-status-info, hsl(var(--primary)))",
  unknown: "hsl(var(--muted-foreground))",
};

export function VisualizationStateFrame({
  state = "ready",
  title,
  description,
  children,
  className,
}: {
  state?: DashboardVizState;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  if (state === "loading") return <DashboardLoadingState label={title ?? "Loading visualization"} className={className} />;
  if (state === "empty") return <DashboardEmptyState title={title ?? "No visualization data"} description={description ?? "No values are available yet."} className={className} />;
  if (state === "error") return <DashboardErrorState title={title ?? "Unable to render visualization"} message={description} className={className} />;
  return (
    <div className={cn("relative min-w-0", className)}>
      {state === "preview" ? (
        <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-200">
          Preview data is shown to demonstrate the intended visualization shape.
        </div>
      ) : null}
      {state === "stale" ? (
        <div className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          Data is stale. The layout is still available for review.
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function PriceMovementChart({
  data,
  state = "ready",
  height = 260,
  title = "Mid price movement",
}: {
  data: MarketSnapshotPoint[];
  state?: DashboardVizState;
  height?: number;
  title?: string;
}) {
  if (state === "ready" && data.length < 2) {
    return <VisualizationStateFrame state="empty" title="Not enough price movement" description="At least two snapshots are required."><div /></VisualizationStateFrame>;
  }
  return (
    <VisualizationStateFrame state={state} title={title}>
      <div className="rounded-lg border border-border bg-card p-3" style={{ height }} role="img" aria-label={title}>
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={data} margin={{ bottom: 4, left: -18, right: 10, top: 14 }}>
            <defs>
              <linearGradient id="hdk-mid-price-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--hdk-status-success, hsl(var(--primary)))" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--hdk-status-success, hsl(var(--primary)))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${value}c`} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)}c`, "mid price"]} />
            <Area dataKey="midPrice" fill="url(#hdk-mid-price-fill)" name="mid price" stroke="var(--hdk-status-success, hsl(var(--primary)))" strokeWidth={3} type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </VisualizationStateFrame>
  );
}

export function SpreadBandChart({
  data,
  state = "ready",
  height = 180,
}: {
  data: MarketSnapshotPoint[];
  state?: DashboardVizState;
  height?: number;
}) {
  const normalized = data.map((point) => ({ ...point, spreadCents: typeof point.spread === "number" ? point.spread * 100 : undefined }));
  return (
    <VisualizationStateFrame state={state} title="Spread band">
      <div className="rounded-lg border border-border bg-card p-3" style={{ height }} role="img" aria-label="spread band chart">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={normalized} margin={{ bottom: 2, left: -18, right: 10, top: 10 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${value}c`} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)}c`, "spread"]} />
            <Bar dataKey="spreadCents" fill="var(--hdk-status-warning, hsl(var(--primary)))" name="spread" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </VisualizationStateFrame>
  );
}

export function LiquidityDepthChart({
  data,
  state = "ready",
  height = 200,
}: {
  data: MarketSnapshotPoint[];
  state?: DashboardVizState;
  height?: number;
}) {
  const normalized = data.map((point) => ({
    ...point,
    bidDepth: point.bidDepth ?? 0,
    askDepth: point.askDepth ?? 0,
  }));
  return (
    <VisualizationStateFrame state={state} title="Liquidity depth">
      <div className="rounded-lg border border-border bg-card p-3" style={{ height }} role="img" aria-label="liquidity depth chart">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={normalized} margin={{ bottom: 2, left: -10, right: 10, top: 10 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => compactNumber(Number(value))} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [compactNumber(Number(value)), name === "bidDepth" ? "bid depth" : "ask depth"]} />
            <Bar dataKey="bidDepth" fill="var(--hdk-status-success, hsl(var(--primary)))" name="bidDepth" radius={[6, 6, 0, 0]} stackId="depth" />
            <Bar dataKey="askDepth" fill="var(--hdk-status-info, hsl(var(--primary)))" name="askDepth" radius={[6, 6, 0, 0]} stackId="depth" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </VisualizationStateFrame>
  );
}

export function VolumePulseChart({
  data,
  state = "ready",
  height = 160,
}: {
  data: MarketSnapshotPoint[];
  state?: DashboardVizState;
  height?: number;
}) {
  return (
    <VisualizationStateFrame state={state} title="Volume pulse">
      <div className="rounded-lg border border-border bg-card p-3" style={{ height }} role="img" aria-label="volume pulse chart">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ bottom: 2, left: -18, right: 10, top: 10 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => compactNumber(Number(value))} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [compactNumber(Number(value)), "volume"]} />
            <Bar dataKey="volume" fill="var(--hdk-status-info, hsl(var(--primary)))" name="volume" radius={[5, 5, 0, 0]} />
            <Line dataKey="volume" dot={false} stroke="hsl(var(--foreground))" strokeWidth={2} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </VisualizationStateFrame>
  );
}

export function MarketTape({
  rows,
  selectedId,
  onSelect,
  state = "ready",
}: {
  rows: MarketTapeRow[];
  selectedId?: string;
  onSelect?: (row: MarketTapeRow) => void;
  state?: DashboardVizState;
}) {
  if (state !== "ready" && state !== "preview" && state !== "stale") {
    return <VisualizationStateFrame state={state} title="Market tape"><div /></VisualizationStateFrame>;
  }
  if (!rows.length) {
    return <VisualizationStateFrame state="empty" title="No markets in tape" description="No market rows match the active filters."><div /></VisualizationStateFrame>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-[minmax(15rem,1.8fr)_repeat(5,minmax(6rem,1fr))] border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
        <div>Market</div>
        <div>Mid</div>
        <div>Move</div>
        <div>Spread</div>
        <div>Depth</div>
        <div>Seen</div>
      </div>
      <div className="max-h-[30rem] overflow-auto">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className={cn(
              "grid w-full grid-cols-[minmax(15rem,1.8fr)_repeat(5,minmax(6rem,1fr))] items-center gap-2 border-b border-border px-3 py-3 text-left text-sm last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none",
              selectedId === row.id && "bg-primary/5",
            )}
            onClick={() => onSelect?.(row)}
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{row.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {row.ticker ? <span>{row.ticker}</span> : null}
                {row.category ? <span>{row.category}</span> : null}
                <StatusPill tone={row.tone ?? marketStatusTone(row.status)}>{row.status ?? "unknown"}</StatusPill>
              </div>
            </div>
            <div className="font-mono text-foreground">{formatCents(row.midPrice)}</div>
            <div><TrendDelta value={Number(row.movementCents ?? 0)} suffix="c" /></div>
            <div className="font-mono text-muted-foreground">{formatCents(row.spreadCents)}</div>
            <div className="font-mono text-muted-foreground">{compactNumber(row.totalDepth)}</div>
            <div className="text-xs text-muted-foreground">{row.lastSeenLabel ?? "n/a"}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function MarketVolatilityDrawer({
  title,
  subtitle,
  points,
  state = "ready",
  actions,
}: {
  title: string;
  subtitle?: string;
  points: MarketSnapshotPoint[];
  state?: DashboardVizState;
  actions?: ReactNode;
}) {
  const latest = points.at(-1);
  const first = points.at(0);
  const movement = latest && first ? latest.midPrice - first.midPrice : 0;
  const latestSpread = typeof latest?.spread === "number" ? latest.spread * 100 : undefined;
  const latestDepth = (latest?.bidDepth ?? 0) + (latest?.askDepth ?? 0);
  return (
    <aside className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Movement" value={`${movement.toFixed(1)}c`} detail="Selected window" className="min-h-24" />
        <KpiCard label="Mid price" value={formatCents(latest?.midPrice)} detail="Latest snapshot" className="min-h-24" />
        <KpiCard label="Spread" value={formatCents(latestSpread)} detail="Bid/ask width" className="min-h-24" />
        <KpiCard label="Total depth" value={compactNumber(latestDepth)} detail="Bid + ask" className="min-h-24" />
      </div>
      <PriceMovementChart data={points} state={state} />
      <div className="grid gap-3 xl:grid-cols-2">
        <SpreadBandChart data={points} state={state} />
        <LiquidityDepthChart data={points} state={state} />
      </div>
    </aside>
  );
}

export function CategoryHeatmap({
  rows,
  columns,
  cells,
  state = "ready",
}: {
  rows: string[];
  columns: string[];
  cells: OpportunityCell[];
  state?: DashboardVizState;
}) {
  if (state !== "ready" && state !== "preview" && state !== "stale") {
    return <VisualizationStateFrame state={state} title="Category heatmap"><div /></VisualizationStateFrame>;
  }
  const max = Math.max(...cells.map((cell) => cell.value), 1);
  const lookup = new Map(cells.map((cell) => [`${cell.row}:${cell.column}`, cell]));
  return (
    <VisualizationStateFrame state={state} title="Category heatmap">
      <div className="overflow-x-auto rounded-lg border border-border bg-card p-3">
        <div className="grid min-w-[42rem] gap-1" style={{ gridTemplateColumns: `10rem repeat(${columns.length}, minmax(6rem, 1fr))` }}>
          <div />
          {columns.map((column) => <div key={column} className="px-2 py-1 text-xs font-semibold text-muted-foreground">{column}</div>)}
          {rows.map((row) => (
            <div key={row} className="contents">
              <div className="px-2 py-3 text-sm font-medium text-foreground">{row}</div>
              {columns.map((column) => {
                const cell = lookup.get(`${row}:${column}`);
                const value = cell?.value ?? 0;
                const opacity = value > 0 ? 0.12 + (value / max) * 0.62 : 0.04;
                const tone = cell?.tone ?? "info";
                return (
                  <div
                    key={`${row}:${column}`}
                    className="rounded-md border border-border px-2 py-3 text-center font-mono text-sm text-foreground"
                    title={cell?.label ?? `${row} / ${column}: ${value}`}
                    style={{ backgroundColor: colorWithOpacity(toneToAccent[tone], opacity) }}
                  >
                    {cell?.label ?? compactNumber(value)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </VisualizationStateFrame>
  );
}

export function OpportunityMatrix(props: Parameters<typeof CategoryHeatmap>[0]) {
  return <CategoryHeatmap {...props} />;
}

export function ProviderSpendTimeline({
  data,
  state = "ready",
  height = 240,
}: {
  data: { label: string; cost: number; tokens?: number }[];
  state?: DashboardVizState;
  height?: number;
}) {
  return (
    <VisualizationStateFrame state={state} title="Provider spend timeline">
      <div className="rounded-lg border border-border bg-card p-3" style={{ height }} role="img" aria-label="provider spend timeline">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ bottom: 2, left: -12, right: 10, top: 10 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `$${Number(value).toFixed(0)}`} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [name === "cost" ? `$${Number(value).toFixed(2)}` : compactNumber(Number(value)), name]} />
            <Bar dataKey="cost" fill="var(--hdk-status-info, hsl(var(--primary)))" name="cost" radius={[6, 6, 0, 0]} />
            <Line dataKey="tokens" dot={false} stroke="var(--hdk-status-success, hsl(var(--primary)))" strokeWidth={2} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </VisualizationStateFrame>
  );
}

export function CrosshairTooltipFrame({
  title,
  description,
  children,
  state = "ready",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  state?: DashboardVizState;
}) {
  return (
    <VisualizationStateFrame state={state} title={title} description={description}>
      <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <StatusPill tone="info">hover detail</StatusPill>
        </div>
        <div className="relative min-w-0">
          <div className="pointer-events-none absolute inset-y-2 left-1/2 z-10 hidden w-px bg-primary/30 md:block" aria-hidden="true" />
          {children}
        </div>
      </section>
    </VisualizationStateFrame>
  );
}

export function OrderBookLadder({
  levels,
  state = "ready",
  title = "Order book ladder",
}: {
  levels: OrderBookLevel[];
  state?: DashboardVizState;
  title?: string;
}) {
  const maxDepth = Math.max(...levels.map((level) => Math.max(level.bidSize ?? 0, level.askSize ?? 0)), 1);
  return (
    <VisualizationStateFrame state={state} title={title}>
      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label={title}>
        <div className="grid grid-cols-[1fr_6rem_1fr] border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
          <span>Bid depth</span>
          <span className="text-center">Price</span>
          <span className="text-right">Ask depth</span>
        </div>
        <div className="divide-y divide-border">
          {levels.map((level) => (
            <div key={level.price} className="grid grid-cols-[1fr_6rem_1fr] items-center gap-2 px-3 py-2 text-sm">
              <div className="relative min-h-7 overflow-hidden rounded bg-muted">
                <div className="absolute inset-y-0 right-0 bg-emerald-500/25" style={{ width: `${((level.bidSize ?? 0) / maxDepth) * 100}%` }} />
                <span className="relative z-10 block px-2 py-1 font-mono text-foreground">{compactNumber(level.bidSize)}</span>
              </div>
              <div className="text-center font-mono font-semibold text-foreground">{formatCents(level.price)}</div>
              <div className="relative min-h-7 overflow-hidden rounded bg-muted text-right">
                <div className="absolute inset-y-0 left-0 bg-sky-500/25" style={{ width: `${((level.askSize ?? 0) / maxDepth) * 100}%` }} />
                <span className="relative z-10 block px-2 py-1 font-mono text-foreground">{compactNumber(level.askSize)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </VisualizationStateFrame>
  );
}

export function ForecastConeChart({
  data,
  state = "ready",
  height = 240,
  title = "Forecast cone",
}: {
  data: ForecastConePoint[];
  state?: DashboardVizState;
  height?: number;
  title?: string;
}) {
  const normalized = data.map((point) => ({ ...point, band: Math.max(point.high - point.low, 0) }));
  return (
    <VisualizationStateFrame state={state} title={title}>
      <div className="rounded-lg border border-border bg-card p-3" style={{ height }} role="img" aria-label={title}>
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={normalized} margin={{ bottom: 2, left: -18, right: 10, top: 10 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${Number(value).toFixed(0)}c`} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${Number(value).toFixed(1)}c`, name]} />
            <Area dataKey="high" fill="var(--hdk-status-info, hsl(var(--primary)))" fillOpacity={0.12} name="high" stroke="var(--hdk-status-info, hsl(var(--primary)))" strokeOpacity={0.24} type="monotone" />
            <Area dataKey="low" fill="hsl(var(--card))" fillOpacity={1} name="low" stroke="var(--hdk-status-info, hsl(var(--primary)))" strokeOpacity={0.24} type="monotone" />
            <Line dataKey="expected" dot={false} name="expected" stroke="hsl(var(--foreground))" strokeWidth={2.5} type="monotone" />
            <Line dataKey="actual" dot={false} name="actual" stroke="var(--hdk-status-success, hsl(var(--primary)))" strokeDasharray="4 4" strokeWidth={2} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </VisualizationStateFrame>
  );
}

export function WaterfallChart({
  data,
  state = "ready",
  height = 240,
  title = "Waterfall",
}: {
  data: WaterfallStep[];
  state?: DashboardVizState;
  height?: number;
  title?: string;
}) {
  let running = 0;
  const normalized = data.map((step) => {
    const start = running;
    running += step.value;
    return { ...step, start, end: running, absValue: Math.abs(step.value) };
  });
  return (
    <VisualizationStateFrame state={state} title={title}>
      <div className="rounded-lg border border-border bg-card p-3" style={{ height }} role="img" aria-label={title}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={normalized} margin={{ bottom: 2, left: -12, right: 10, top: 10 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => compactNumber(Number(value))} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [compactNumber(Number(value)), name === "value" ? "change" : name]} />
            <Bar dataKey="value" name="value" radius={[6, 6, 0, 0]}>
              {normalized.map((step) => (
                <Cell key={step.id} fill={step.value >= 0 ? "var(--hdk-status-success, hsl(var(--primary)))" : "var(--hdk-status-error, hsl(var(--destructive, var(--primary))))"} opacity={step.tone === "unknown" ? 0.45 : 0.88} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </VisualizationStateFrame>
  );
}

export function BusinessUnitCostCard({
  name,
  cost,
  revenue,
  tokenCount,
  tone = "neutral",
}: {
  name: string;
  cost: number;
  revenue?: number;
  tokenCount?: number;
  tone?: DashboardTone;
}) {
  const margin = typeof revenue === "number" ? revenue - cost : undefined;
  return (
    <KpiCard
      label={name}
      value={`$${cost.toFixed(2)}`}
      tone={tone}
      detail={typeof margin === "number" ? `Net ${margin >= 0 ? "+" : ""}$${margin.toFixed(2)}` : "Cost tracked"}
      footer={typeof tokenCount === "number" ? `${compactNumber(tokenCount)} tokens` : undefined}
    />
  );
}

export function AlertRail({
  items,
  state = "ready",
}: {
  items: AlertRailItem[];
  state?: DashboardVizState;
}) {
  if (state !== "ready" && state !== "preview" && state !== "stale") {
    return <VisualizationStateFrame state={state} title="Alert rail"><div /></VisualizationStateFrame>;
  }
  if (!items.length) return <DashboardEmptyState title="No alerts" description="No current dashboard alerts are active." />;
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-foreground">{item.title}</div>
              {item.detail ? <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p> : null}
            </div>
            <StatusPill tone={item.tone ?? "neutral"}>{item.tone ?? "neutral"}</StatusPill>
          </div>
          {item.timestampLabel ? <div className="mt-3 text-xs text-muted-foreground">{item.timestampLabel}</div> : null}
        </article>
      ))}
    </div>
  );
}

export function DrilldownPanel({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
      {footer ? <div className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">{footer}</div> : null}
    </section>
  );
}

export function TimeWindowSelector({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-border bg-card p-1" role="group" aria-label="Time window">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            option.value === value && "bg-primary text-primary-foreground hover:bg-primary",
          )}
          onClick={() => onChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function dashboardVizPreviewMarketPoints(): MarketSnapshotPoint[] {
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

function marketStatusTone(status: MarketTapeRow["status"]): DashboardTone {
  if (status === "live") return "success";
  if (status === "upcoming") return "info";
  if (status === "expired") return "neutral";
  return "unknown";
}

function compactNumber(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return new Intl.NumberFormat("en", { maximumFractionDigits: value >= 1000 ? 1 : 0, notation: value >= 1000 ? "compact" : "standard" }).format(value);
}

function formatCents(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${value.toFixed(Math.abs(value) < 10 ? 1 : 0)}c`;
}

function colorWithOpacity(color: string, opacity: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}
