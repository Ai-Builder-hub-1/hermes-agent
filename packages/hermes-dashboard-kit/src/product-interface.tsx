import type { ReactNode } from "react";
import { Bot, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, ClipboardCheck, Command, Filter, HelpCircle, Info, Lock, Search, Send, Sparkles, Star } from "lucide-react";
import { cn } from "./utils";
import { StatusPill, type DashboardTone } from "./metrics";

export type InterfaceStateStatus = "ready" | "loading" | "empty" | "error" | "stale" | "preview" | "permission-limited" | "partial";

export type WorkspaceOption = {
  id: string;
  label: string;
  description?: string;
  badge?: ReactNode;
  disabled?: boolean;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type EvidenceItem = {
  id: string;
  title: string;
  detail?: string;
  sourceLabel?: string;
  freshnessLabel?: string;
  tone?: DashboardTone;
};

export type RecommendationItem = {
  id: string;
  title: string;
  action: string;
  confidence?: number;
  tone?: DashboardTone;
};

export type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  group?: string;
  tone?: DashboardTone;
  disabled?: boolean;
};

export type SavedViewItem = {
  id: string;
  label: string;
  description?: string;
  filters?: string[];
  active?: boolean;
  shared?: boolean;
};

export type ExpandableDataListRow = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  status?: ReactNode;
  summary?: ReactNode;
  detail?: ReactNode;
};

export type CalendarDayItem = {
  id: string;
  label: string;
  dateLabel?: string;
  status?: "planned" | "open" | "blocked" | "complete";
  summary?: string;
  selected?: boolean;
  disabled?: boolean;
};

export type ApprovalQueueItem = {
  id: string;
  title: string;
  detail?: string;
  status: "pending" | "approved" | "rejected" | "needs-review";
  owner?: string;
  dueLabel?: string;
};

export type PublishingQueueItem = {
  id: string;
  title: string;
  destination: string;
  scheduledLabel?: string;
  status: "draft" | "ready" | "posted" | "blocked";
};

export type ProofEvidenceRecord = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone?: DashboardTone;
};

export type ActionQueueItem = {
  id: string;
  title: string;
  detail?: string;
  status?: string;
  priority?: "critical" | "high" | "medium" | "low" | string;
  owner?: string;
  dueLabel?: string;
  sourceLabel?: string;
  actionLabel?: string;
};

export type AlertQueueItem = {
  id: string;
  title: string;
  detail?: string;
  severity?: "critical" | "warning" | "info" | string;
  status?: string;
  sourceLabel?: string;
  ageLabel?: string;
  recurrenceLabel?: string;
  actions?: string[];
};

export type ContentPackageAsset = {
  id: string;
  label: string;
  href?: string;
  type?: string;
};

export type ContentPackageRecord = {
  id: string;
  title: string;
  brand?: string;
  platform?: string;
  status?: string;
  seoScore?: string | number;
  transcriptStatus?: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  videoUrl?: string;
  uploadCopy?: string;
};

export type BrandPortfolioItem = {
  id: string;
  name: string;
  subtitle?: string;
  status?: string;
  tone?: DashboardTone;
  metrics?: { label: string; value: ReactNode }[];
  blocker?: string;
};

export type ChannelPostabilityItem = {
  id: string;
  label: string;
  detail?: string;
  platforms: Record<string, { status: string; detail?: string; tone?: DashboardTone }>;
};

export type OperationsFunnelStage = {
  id: string;
  label: string;
  value: number;
  detail?: string;
  tone?: DashboardTone;
};

export type CostAttributionRow = {
  id: string;
  source: string;
  provider?: string;
  purpose?: string;
  owner?: string;
  cost: number;
};

export type OperatingPanelItem = {
  id: string;
  title: string;
  detail?: string;
  status?: string;
  value?: ReactNode;
  tone?: DashboardTone;
};

export type OperatingMetric = {
  label: string;
  value: ReactNode;
};

export type MatrixRow = {
  id: string;
  label: string;
  detail?: string;
  values: Record<string, { value?: ReactNode; status?: string; detail?: string; tone?: DashboardTone }>;
};

export function HelpTip({
  label = "Help",
  text,
  className,
}: {
  label?: string;
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("hdk-help", className)} data-hdk-component="HelpTip">
      <button className="hdk-help__trigger" type="button" aria-label={label} data-help={text}>
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="hdk-help__bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

export function InfoPopover({
  label = "More information",
  title = "Details",
  body,
  className,
}: {
  label?: string;
  title?: string;
  body: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("hdk-info-popover", className)} data-hdk-component="InfoPopover">
      <summary aria-label={label}>
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </summary>
      <div className="hdk-info-popover__panel">
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </details>
  );
}

export function WorkspaceSwitcher({
  label = "Workspace",
  value,
  options,
  onChange,
  className,
}: {
  label?: string;
  value: string;
  options: WorkspaceOption[];
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function BreadcrumbTrail({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-wrap items-center gap-1 text-sm text-muted-foreground", className)} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          {index > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          {item.href ? (
            <a className="hover:text-foreground" href={item.href}>{item.label}</a>
          ) : (
            <span className={index === items.length - 1 ? "font-medium text-foreground" : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SplitWorkspaceLayout({
  primary,
  secondary,
  ratio = "balanced",
  className,
}: {
  primary: ReactNode;
  secondary: ReactNode;
  ratio?: "balanced" | "primary-wide" | "secondary-wide";
  className?: string;
}) {
  const ratioClass = {
    balanced: "xl:grid-cols-2",
    "primary-wide": "xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,0.8fr)]",
    "secondary-wide": "xl:grid-cols-[minmax(22rem,0.8fr)_minmax(0,1.6fr)]",
  }[ratio];
  return (
    <div className={cn("grid gap-4", ratioClass, className)}>
      <div className="min-w-0">{primary}</div>
      <div className="min-w-0">{secondary}</div>
    </div>
  );
}

export function DetailDrawerShell({
  title,
  subtitle,
  status,
  actions,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {status}
          {actions}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
      {footer ? <div className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">{footer}</div> : null}
    </aside>
  );
}

export function EntitySummaryCard({
  title,
  subtitle,
  meta,
  tone = "neutral",
  children,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  tone?: DashboardTone;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <StatusPill tone={tone}>{tone}</StatusPill>
      </div>
      {meta ? <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{meta}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

function toneForStatus(status?: string): DashboardTone {
  const normalized = String(status ?? "").toLowerCase();
  if (["ready", "approved", "posted", "complete", "healthy", "pass", "low"].includes(normalized)) return "success";
  if (["critical", "error", "failed", "blocked", "rejected", "p0"].includes(normalized)) return "critical";
  if (["warning", "needs-review", "stale", "partial", "high", "medium", "p1"].includes(normalized)) return "warning";
  if (["running", "info", "draft"].includes(normalized)) return "info";
  return "neutral";
}

export function ActionQueue({
  title = "Action queue",
  items,
  empty = "The action queue is clear.",
}: {
  title?: string;
  items: ActionQueueItem[];
  empty?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{items.length} items</StatusPill>
      </div>
      <div className="grid gap-2">
        {items.length ? items.map((item) => (
          <article key={item.id} className="grid gap-3 rounded-md border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <StatusPill tone={toneForStatus(item.priority ?? item.status)}>{item.priority ?? item.status ?? "open"}</StatusPill>
              <h3 className="mt-2 text-sm font-semibold text-foreground">{item.title}</h3>
              {item.detail ? <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.owner ? <span>Owner: {item.owner}</span> : null}
                {item.dueLabel ? <span>Due: {item.dueLabel}</span> : null}
                {item.sourceLabel ? <span>{item.sourceLabel}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-2 sm:justify-end">
              {item.status ? <StatusPill tone={toneForStatus(item.status)}>{item.status}</StatusPill> : null}
              {item.actionLabel ? <button className="h-8 rounded-md border border-border px-3 text-xs font-medium text-foreground" type="button">{item.actionLabel}</button> : null}
            </div>
          </article>
        )) : <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{empty}</div>}
      </div>
    </section>
  );
}

export function AlertQueue({
  title = "Alert queue",
  alerts,
  empty = "No active alerts match this view.",
}: {
  title?: string;
  alerts: AlertQueueItem[];
  empty?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="warning">{alerts.length} alerts</StatusPill>
      </div>
      <div className="grid gap-2">
        {alerts.length ? alerts.map((alert) => (
          <article key={alert.id} className="grid gap-3 rounded-md border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <StatusPill tone={toneForStatus(alert.severity)}>{alert.severity ?? "info"}</StatusPill>
              <h3 className="mt-2 text-sm font-semibold text-foreground">{alert.title}</h3>
              {alert.detail ? <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {alert.sourceLabel ? <span>{alert.sourceLabel}</span> : null}
                {alert.ageLabel ? <span>{alert.ageLabel}</span> : null}
                {alert.recurrenceLabel ? <span>{alert.recurrenceLabel}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-2 sm:justify-end">
              {alert.status ? <StatusPill tone={toneForStatus(alert.status)}>{alert.status}</StatusPill> : null}
              {(alert.actions ?? ["Acknowledge"]).map((action) => <button key={action} className="h-8 rounded-md border border-border px-3 text-xs font-medium text-foreground" type="button">{action}</button>)}
            </div>
          </article>
        )) : <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{empty}</div>}
      </div>
    </section>
  );
}

export function ContentPackageWorkspace({
  record,
  assets = [],
  checklist,
  title = "Content package workspace",
}: {
  record: ContentPackageRecord;
  assets?: ContentPackageAsset[];
  checklist?: { id: InterfaceStateStatus; label?: string; supported: boolean; detail?: string }[];
  title?: string;
}) {
  const facts = [
    ["Brand", record.brand],
    ["Platform", record.platform],
    ["Status", record.status],
    ["SEO", record.seoScore],
    ["Transcript", record.transcriptStatus],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{record.description ?? record.title}</p>
        </div>
        {record.status ? <StatusPill tone={toneForStatus(record.status)}>{record.status}</StatusPill> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          {record.thumbnailUrl ? <img className="aspect-video w-full object-cover" src={record.thumbnailUrl} alt={record.thumbnailAlt ?? "Thumbnail preview"} /> : <div className="grid aspect-video place-items-center text-sm text-muted-foreground">No thumbnail yet</div>}
        </div>
        <div className="grid content-start gap-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-md border border-border bg-background p-3">
                <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
              </div>
            ))}
          </div>
          {record.videoUrl ? <a className="text-sm font-medium text-primary" href={record.videoUrl}>Video asset</a> : null}
          {record.uploadCopy ? <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">{record.uploadCopy}</div> : null}
          {assets.length ? <div className="flex flex-wrap gap-2">{assets.map((asset) => <a key={asset.id} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-primary" href={asset.href ?? "#"}>{asset.label}</a>)}</div> : null}
        </div>
      </div>
      {checklist?.length ? <div className="mt-4"><StateChecklist states={checklist} /></div> : null}
    </section>
  );
}

export function BrandPortfolioGrid({
  title = "Brand portfolio",
  brands,
}: {
  title?: string;
  brands: BrandPortfolioItem[];
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{brands.length} brands</StatusPill>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {brands.map((brand) => (
          <EntitySummaryCard key={brand.id} title={brand.name} subtitle={brand.subtitle} tone={brand.tone ?? toneForStatus(brand.status)} meta={brand.status ? <span>{brand.status}</span> : undefined}>
            {brand.metrics?.length ? <div className="grid gap-2 sm:grid-cols-2">{brand.metrics.map((metric) => <div key={metric.label} className="rounded-md border border-border bg-background p-2"><div className="text-xs text-muted-foreground">{metric.label}</div><div className="text-sm font-semibold text-foreground">{metric.value}</div></div>)}</div> : null}
            {brand.blocker ? <p className="mt-3 rounded-md bg-warning/10 p-2 text-sm text-muted-foreground">{brand.blocker}</p> : null}
          </EntitySummaryCard>
        ))}
      </div>
    </section>
  );
}

export function ChannelPostabilityMatrix({
  title = "Channel postability",
  channels,
  platforms,
}: {
  title?: string;
  channels: ChannelPostabilityItem[];
  platforms?: string[];
}) {
  const resolvedPlatforms = platforms?.length ? platforms : Array.from(new Set(channels.flatMap((channel) => Object.keys(channel.platforms))));
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{channels.length} channels</StatusPill>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="pb-2">Brand / account</th>{resolvedPlatforms.map((platform) => <th key={platform} className="pb-2">{platform}</th>)}</tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id} className="border-t border-border">
                <td className="py-3 pr-3"><div className="font-medium text-foreground">{channel.label}</div>{channel.detail ? <div className="text-xs text-muted-foreground">{channel.detail}</div> : null}</td>
                {resolvedPlatforms.map((platform) => {
                  const state = channel.platforms[platform];
                  return <td key={platform} className="py-3 pr-3"><StatusPill tone={state?.tone ?? toneForStatus(state?.status)}>{state?.status ?? "unknown"}</StatusPill>{state?.detail ? <div className="mt-1 text-xs text-muted-foreground">{state.detail}</div> : null}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OperationsFunnel({
  title = "Operations funnel",
  stages,
}: {
  title?: string;
  stages: OperationsFunnelStage[];
}) {
  const max = Math.max(1, ...stages.map((stage) => stage.value));
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{stages.length} stages</StatusPill>
      </div>
      <div className="grid gap-3">
        {stages.map((stage, index) => {
          const width = Math.max(18, Math.round((stage.value / max) * 100));
          const previous = index > 0 ? stages[index - 1].value : stage.value;
          const rate = previous ? Math.round((stage.value / previous) * 100) : 0;
          return (
            <div key={stage.id} className="grid gap-1.5">
              <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border bg-background px-3" style={{ width: `${width}%`, minWidth: "12rem" }}>
                <span className="text-sm font-medium text-muted-foreground">{stage.label}</span>
                <span className="text-lg font-semibold text-foreground">{stage.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stage.detail ?? (index ? `${rate}% from prior stage` : "entry stage")}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CostAttributionTable({
  rows,
  title = "Cost attribution",
}: {
  rows: CostAttributionRow[];
  title?: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.cost, 0);
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">${Math.round(total).toLocaleString()}</StatusPill>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="pb-2">Source</th><th className="pb-2">Provider</th><th className="pb-2">Purpose</th><th className="pb-2">Owner</th><th className="pb-2">Cost</th><th className="pb-2">Share</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="py-3 pr-3 font-medium text-foreground">{row.source}</td>
                <td className="py-3 pr-3 text-muted-foreground">{row.provider ?? "unknown"}</td>
                <td className="py-3 pr-3 text-muted-foreground">{row.purpose ?? "unknown"}</td>
                <td className="py-3 pr-3 text-muted-foreground">{row.owner ?? "unassigned"}</td>
                <td className="py-3 pr-3 font-semibold text-foreground">${row.cost.toLocaleString()}</td>
                <td className="py-3 pr-3 text-muted-foreground">{total ? `${Math.round((row.cost / total) * 100)}%` : "0%"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OperatingPanel({
  title,
  items = [],
  metrics = [],
}: {
  title: string;
  items?: OperatingPanelItem[];
  metrics?: OperatingMetric[];
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{items.length} records</StatusPill>
      </div>
      {metrics.length ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-md border border-border bg-background p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">{metric.label}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{metric.value}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-2">
        {items.length ? items.map((item) => (
          <article key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3">
            <div className="min-w-0">
              <StatusPill tone={item.tone ?? toneForStatus(item.status)}>{item.status ?? "item"}</StatusPill>
              <h3 className="mt-2 text-sm font-semibold text-foreground">{item.title}</h3>
              {item.detail ? <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p> : null}
            </div>
            {item.value ? <div className="shrink-0 text-sm font-semibold text-foreground">{item.value}</div> : null}
          </article>
        )) : <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No records for this view.</div>}
      </div>
    </section>
  );
}

function OperatingMatrix({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: MatrixRow[];
  columns?: string[];
}) {
  const resolvedColumns = columns?.length ? columns : Array.from(new Set(rows.flatMap((row) => Object.keys(row.values))));
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{rows.length} rows</StatusPill>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="pb-2">Dimension</th>{resolvedColumns.map((column) => <th key={column} className="pb-2">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="py-3 pr-3"><div className="font-medium text-foreground">{row.label}</div>{row.detail ? <div className="text-xs text-muted-foreground">{row.detail}</div> : null}</td>
                {resolvedColumns.map((column) => {
                  const cell = row.values[column];
                  return <td key={column} className="py-3 pr-3"><StatusPill tone={cell?.tone ?? toneForStatus(cell?.status)}>{cell?.value ?? cell?.status ?? "unknown"}</StatusPill>{cell?.detail ? <div className="mt-1 text-xs text-muted-foreground">{cell.detail}</div> : null}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BriefingPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Briefing"} items={props.items} metrics={props.metrics} />;
}

export function NarrativeBriefing(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Narrative briefing"} items={props.items} metrics={props.metrics} />;
}

export function ScheduleTimeline(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Schedule timeline"} items={props.items} metrics={props.metrics} />;
}

export function CalendarQueue(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Calendar queue"} items={props.items} metrics={props.metrics} />;
}

export function BenchmarkPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Benchmark panel"} items={props.items} metrics={props.metrics} />;
}

export function CampaignEconomicsPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Campaign economics"} items={props.items} metrics={props.metrics} />;
}

export function CampaignRiskRail(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Campaign risk rail"} items={props.items} metrics={props.metrics} />;
}

export function ProspectBoard(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Prospect board"} items={props.items} metrics={props.metrics} />;
}

export function OutreachDraftPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Outreach draft"} items={props.items} metrics={props.metrics} />;
}

export function ResponseLogPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Response log"} items={props.items} metrics={props.metrics} />;
}

export function GovernanceChecklist(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Governance checklist"} items={props.items} metrics={props.metrics} />;
}

export function WorkOrderQueue(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Work order queue"} items={props.items} metrics={props.metrics} />;
}

export function GateRunTimeline(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Gate run timeline"} items={props.items} metrics={props.metrics} />;
}

export function RunDrilldownPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Run drilldown"} items={props.items} metrics={props.metrics} />;
}

export function RecommendationReviewPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Recommendation review"} items={props.items} metrics={props.metrics} />;
}

export function LearningEvidenceStack(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Learning evidence"} items={props.items} metrics={props.metrics} />;
}

export function SignalClusterPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Signal clusters"} items={props.items} metrics={props.metrics} />;
}

export function InsightGapPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Insight gaps"} items={props.items} metrics={props.metrics} />;
}

export function PublishingProofPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Publishing proof"} items={props.items} metrics={props.metrics} />;
}

export function WasteCostPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Waste cost"} items={props.items} metrics={props.metrics} />;
}

export function AttributionMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Attribution matrix"} rows={props.rows} columns={props.columns} />;
}

export function CoverageGapMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Coverage gap matrix"} rows={props.rows} columns={props.columns} />;
}

export function ReadinessDomainMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Readiness domain matrix"} rows={props.rows} columns={props.columns} />;
}

export function AutomationReadinessMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Automation readiness matrix"} rows={props.rows} columns={props.columns} />;
}

export function StageBlockerMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Stage blocker matrix"} rows={props.rows} columns={props.columns} />;
}

export function MealPlannerCalendar(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Meal planner calendar"} rows={props.rows} columns={props.columns} />;
}

export function MealWeekDrawer(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Meal week drawer"} items={props.items} metrics={props.metrics} />;
}

export function MealLibrary(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Meal library"} items={props.items} metrics={props.metrics} />;
}

export function IngredientChecklist(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Ingredient checklist"} items={props.items} metrics={props.metrics} />;
}

export function HouseholdPreferencePanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Household preferences"} items={props.items} metrics={props.metrics} />;
}

export function MealGenerationRulesPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Meal generation rules"} items={props.items} metrics={props.metrics} />;
}

export function PantryInventoryPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Pantry inventory"} items={props.items} metrics={props.metrics} />;
}

export function ShoppingListExportPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Shopping list export"} items={props.items} metrics={props.metrics} />;
}

export function MapWorkspace(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Map workspace"} items={props.items} metrics={props.metrics} />;
}

export function CoverageMap(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Coverage map"} rows={props.rows} columns={props.columns} />;
}

export function EntityRelationshipGraph(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Entity relationship graph"} rows={props.rows} columns={props.columns} />;
}

export function TerritoryMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Territory matrix"} rows={props.rows} columns={props.columns} />;
}

export function LocationDetailDrawer(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Location detail"} items={props.items} metrics={props.metrics} />;
}

export function NetworkGraph(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Network graph"} rows={props.rows} columns={props.columns} />;
}

export function PortfolioCompanyGrid(props: { brands: BrandPortfolioItem[]; title?: string }) {
  return <BrandPortfolioGrid title={props.title ?? "Portfolio companies"} brands={props.brands} />;
}

export function OperatingCompanyScorecard(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Operating company scorecard"} items={props.items} metrics={props.metrics} />;
}

export function OwnerAccountabilityMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Owner accountability"} rows={props.rows} columns={props.columns} />;
}

export function ContractReadinessPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Contract readiness"} items={props.items} metrics={props.metrics} />;
}

export function BoardDecisionQueue(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Board decision queue"} items={props.items} metrics={props.metrics} />;
}

export function StrategicInitiativeTimeline(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Strategic initiative timeline"} items={props.items} metrics={props.metrics} />;
}

export function ServiceTopologyMap(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Service topology"} rows={props.rows} columns={props.columns} />;
}

export function DeploymentPromotionPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Deployment promotion"} items={props.items} metrics={props.metrics} />;
}

export function PermissionAuditPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Permission audit"} items={props.items} metrics={props.metrics} />;
}

export function IncidentCommandPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Incident command"} items={props.items} metrics={props.metrics} />;
}

export function RunbookPanel(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Runbook"} items={props.items} metrics={props.metrics} />;
}

export function EnvironmentHealthMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Environment health"} rows={props.rows} columns={props.columns} />;
}

function AdvancedVisualizationPanel({
  title,
  kind,
  data = [],
}: {
  title: string;
  kind: string;
  data?: { label: string; value: number | string }[];
}) {
  const rows = data.length ? data : [{ label: "P25", value: 25 }, { label: "Median", value: 50 }, { label: "P75", value: 75 }];
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{kind}</StatusPill>
      </div>
      <div className="grid min-h-48 content-end gap-2 rounded-md border border-border bg-background p-3" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
        {rows.map((row) => {
          const value = Math.max(4, Math.min(100, Number(row.value) || 0));
          return (
            <div key={row.label} className="grid content-end gap-2">
              <div className="rounded-t-md bg-primary/70" style={{ height: `${value}%`, minHeight: "1.5rem" }} />
              <div className="truncate text-center text-xs text-muted-foreground">{row.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CandlestickChart(props: { data?: { label: string; value: number | string }[]; title?: string }) {
  return <AdvancedVisualizationPanel title={props.title ?? "Candlestick chart"} kind="candlestick" data={props.data} />;
}

export function SankeyFlow(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Sankey flow"} rows={props.rows} columns={props.columns} />;
}

export function Treemap(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Treemap"} rows={props.rows} columns={props.columns} />;
}

export function Sunburst(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Sunburst"} rows={props.rows} columns={props.columns} />;
}

export function CorrelationMatrix(props: { rows: MatrixRow[]; columns?: string[]; title?: string }) {
  return <OperatingMatrix title={props.title ?? "Correlation matrix"} rows={props.rows} columns={props.columns} />;
}

export function DistributionPlot(props: { data?: { label: string; value: number | string }[]; title?: string }) {
  return <AdvancedVisualizationPanel title={props.title ?? "Distribution plot"} kind="distribution" data={props.data} />;
}

export function BoxPlot(props: { data?: { label: string; value: number | string }[]; title?: string }) {
  return <AdvancedVisualizationPanel title={props.title ?? "Box plot"} kind="box" data={props.data} />;
}

export function ViolinPlot(props: { data?: { label: string; value: number | string }[]; title?: string }) {
  return <AdvancedVisualizationPanel title={props.title ?? "Violin plot"} kind="violin" data={props.data} />;
}

export function ScatterQuadrantChart(props: { data?: { label: string; value: number | string }[]; title?: string }) {
  return <AdvancedVisualizationPanel title={props.title ?? "Scatter quadrant"} kind="scatter-quadrant" data={props.data} />;
}

export function AnomalyBandChart(props: { data?: { label: string; value: number | string }[]; title?: string }) {
  return <AdvancedVisualizationPanel title={props.title ?? "Anomaly band"} kind="anomaly-band" data={props.data} />;
}

export function MobileDashboardShell(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Mobile dashboard"} items={props.items} metrics={props.metrics} />;
}

export function BottomSheetDrawer(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Bottom sheet"} items={props.items} metrics={props.metrics} />;
}

export function MobileFilterSheet(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Mobile filters"} items={props.items} metrics={props.metrics} />;
}

export function CompactActionRail(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Compact action rail"} items={props.items} metrics={props.metrics} />;
}

export function SwipeableQueue(props: { items?: OperatingPanelItem[]; metrics?: OperatingMetric[]; title?: string }) {
  return <OperatingPanel title={props.title ?? "Swipeable queue"} items={props.items} metrics={props.metrics} />;
}

export function EvidenceStack({
  items,
  title = "Evidence",
}: {
  items: EvidenceItem[];
  title?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{items.length} items</StatusPill>
      </div>
      <div className="grid gap-2">
        {items.length ? items.map((item) => (
          <article key={item.id} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{item.title}</div>
                {item.detail ? <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p> : null}
              </div>
              <StatusPill tone={item.tone ?? "neutral"}>{item.tone ?? "evidence"}</StatusPill>
            </div>
            {(item.sourceLabel || item.freshnessLabel) ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.sourceLabel ? <span>{item.sourceLabel}</span> : null}
                {item.freshnessLabel ? <span>{item.freshnessLabel}</span> : null}
              </div>
            ) : null}
          </article>
        )) : <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No evidence captured yet.</div>}
      </div>
    </section>
  );
}

export function RecommendationStack({
  items,
  title = "Recommendations",
}: {
  items: RecommendationItem[];
  title?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{items.length} options</StatusPill>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{item.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{item.action}</p>
              </div>
              <StatusPill tone={item.tone ?? "info"}>{typeof item.confidence === "number" ? `${Math.round(item.confidence * 100)}%` : item.tone ?? "info"}</StatusPill>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SavedFilterChips({
  filters,
  activeId,
  onSelect,
}: {
  filters: { id: string; label: string; detail?: string }[];
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
            filter.id === activeId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
          title={filter.detail ?? filter.label}
          onClick={() => onSelect?.(filter.id)}
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export function CommandPalette({
  query,
  items,
  title = "Command palette",
  placeholder = "Search actions, dashboards, entities, or saved views",
  footer,
  onQueryChange,
  onSelect,
}: {
  query?: string;
  items: CommandPaletteItem[];
  title?: string;
  placeholder?: string;
  footer?: ReactNode;
  onQueryChange?: (value: string) => void;
  onSelect?: (item: CommandPaletteItem) => void;
}) {
  const groups = groupBy(items, (item) => item.group ?? "Suggested");
  return (
    <section className="rounded-xl border border-border bg-card p-3 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-primary/30 bg-primary/10 p-1.5 text-primary">
            <Command className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <StatusPill tone="info">global</StatusPill>
      </div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          className="h-10 w-full rounded-md border border-border bg-background px-9 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
          value={query}
          placeholder={placeholder}
          onChange={(event) => onQueryChange?.(event.target.value)}
        />
      </label>
      <div className="mt-3 grid gap-3">
        {Array.from(groups.entries()).map(([group, groupItems]) => (
          <div key={group}>
            <div className="mb-1 px-1 text-xs font-semibold uppercase text-muted-foreground">{group}</div>
            <div className="grid gap-1">
              {groupItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-transparent px-2 py-2 text-left text-sm transition hover:border-border hover:bg-muted focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => onSelect?.(item)}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{item.label}</span>
                    {item.description ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span> : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {item.tone ? <StatusPill tone={item.tone}>{item.tone}</StatusPill> : null}
                    {item.shortcut ? <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground">{item.shortcut}</kbd> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {footer ? <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{footer}</div> : null}
    </section>
  );
}

export function GlobalSearchOverlay({
  query,
  results,
  scopes,
  activeScope,
  onQueryChange,
  onScopeChange,
  onSelect,
}: {
  query?: string;
  results: CommandPaletteItem[];
  scopes?: { id: string; label: string; count?: number }[];
  activeScope?: string;
  onQueryChange?: (value: string) => void;
  onScopeChange?: (value: string) => void;
  onSelect?: (item: CommandPaletteItem) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Global search</h2>
          <p className="mt-1 text-sm text-muted-foreground">Find business units, markets, reports, alerts, runs, and docs from one surface.</p>
        </div>
        <StatusPill tone="info">{results.length} results</StatusPill>
      </div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          className="h-11 w-full rounded-md border border-border bg-background px-9 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
          value={query}
          placeholder="Search across Hermes..."
          onChange={(event) => onQueryChange?.(event.target.value)}
        />
      </label>
      {scopes?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {scopes.map((scope) => (
            <button
              key={scope.id}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                scope.id === activeScope ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onScopeChange?.(scope.id)}
            >
              {scope.label}{typeof scope.count === "number" ? ` ${scope.count}` : ""}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-2">
        {results.length ? results.map((result) => (
          <button
            key={result.id}
            type="button"
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => onSelect?.(result)}
          >
            <span className="min-w-0">
              <span className="block font-medium text-foreground">{result.label}</span>
              {result.description ? <span className="mt-1 block text-sm text-muted-foreground">{result.description}</span> : null}
            </span>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        )) : <DashboardEmptySearch />}
      </div>
    </section>
  );
}

export function SavedViewsManager({
  views,
  title = "Saved views",
  onSelect,
}: {
  views: SavedViewItem[];
  title?: string;
  onSelect?: (view: SavedViewItem) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{views.length} views</StatusPill>
      </div>
      <div className="grid gap-2">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            className={cn(
              "rounded-md border p-3 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              view.active ? "border-primary bg-primary/5" : "border-border bg-background",
            )}
            onClick={() => onSelect?.(view)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  {view.active ? <Star className="h-3.5 w-3.5 fill-current text-primary" aria-hidden="true" /> : null}
                  <span className="truncate">{view.label}</span>
                </div>
                {view.description ? <p className="mt-1 text-sm text-muted-foreground">{view.description}</p> : null}
              </div>
              <StatusPill tone={view.shared ? "success" : "neutral"}>{view.shared ? "shared" : "private"}</StatusPill>
            </div>
            {view.filters?.length ? <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted-foreground">{view.filters.map((filter) => <span key={filter} className="rounded-full border border-border px-2 py-0.5">{filter}</span>)}</div> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ExpandableDataList({
  rows,
  title = "Expandable data list",
}: {
  rows: ExpandableDataListRow[];
  title?: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{rows.length} rows</StatusPill>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <details key={row.id} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50">
              <span className="min-w-0">
                <span className="block font-medium text-foreground">{row.title}</span>
                {row.subtitle ? <span className="mt-1 block text-sm text-muted-foreground">{row.subtitle}</span> : null}
                {row.meta ? <span className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">{row.meta}</span> : null}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {row.status}
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" aria-hidden="true" />
              </span>
            </summary>
            <div className="grid gap-3 bg-background px-4 pb-4 pt-1">
              {row.summary ? <div className="text-sm text-muted-foreground">{row.summary}</div> : null}
              {row.detail}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function AiAssistantPanel({
  title = "Ask this dashboard",
  prompt,
  response,
  sources,
  actions,
}: {
  title?: string;
  prompt?: string;
  response?: ReactNode;
  sources?: EvidenceItem[];
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-primary/30 bg-primary/10 p-1.5 text-primary">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <StatusPill tone="info">AI assisted</StatusPill>
      </div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-background px-9 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
          defaultValue={prompt}
          placeholder="Ask for a summary, comparison, explanation, or next action."
        />
      </label>
      {response ? <div className="mt-3 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">{response}</div> : null}
      {sources?.length ? <div className="mt-3"><EvidenceStack title="Sources" items={sources} /></div> : null}
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

export function StateChecklist({
  states,
}: {
  states: { id: InterfaceStateStatus; label?: string; supported: boolean; detail?: string }[];
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-card p-3">
      {states.map((state) => (
        <div key={state.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-2">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{state.label ?? state.id}</div>
            {state.detail ? <div className="mt-1 text-xs text-muted-foreground">{state.detail}</div> : null}
          </div>
          <StatusPill tone={state.supported ? "success" : "warning"}>
            {state.supported ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <CircleAlert className="mr-1 h-3 w-3" />}
            {state.supported ? "supported" : "gap"}
          </StatusPill>
        </div>
      ))}
    </div>
  );
}

export function PermissionLimitedPanel({
  title = "Permission limited",
  description = "You can view this surface, but you do not have access to run this action.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function CalendarMonthGrid({
  days,
  title = "Calendar",
  onSelect,
}: {
  days: CalendarDayItem[];
  title?: string;
  onSelect?: (day: CalendarDayItem) => void;
}) {
  const toneByStatus: Record<NonNullable<CalendarDayItem["status"]>, DashboardTone> = {
    planned: "info",
    open: "neutral",
    blocked: "warning",
    complete: "success",
  };
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <StatusPill tone="info">{days.length} days</StatusPill>
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-border">
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            disabled={day.disabled}
            className={cn(
              "min-h-24 border-b border-r border-border bg-background p-2 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
              day.selected ? "bg-primary/10 ring-1 ring-primary" : undefined,
            )}
            onClick={() => onSelect?.(day)}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">{day.label}</span>
              {day.status ? <StatusPill tone={toneByStatus[day.status]}>{day.status}</StatusPill> : null}
            </div>
            {day.dateLabel ? <div className="mt-1 text-xs text-muted-foreground">{day.dateLabel}</div> : null}
            {day.summary ? <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{day.summary}</p> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ApprovalQueuePanel({
  items,
  title = "Approval queue",
  onApprove,
  onReject,
}: {
  items: ApprovalQueueItem[];
  title?: string;
  onApprove?: (item: ApprovalQueueItem) => void;
  onReject?: (item: ApprovalQueueItem) => void;
}) {
  const tones: Record<ApprovalQueueItem["status"], DashboardTone> = {
    pending: "info",
    approved: "success",
    rejected: "critical",
    "needs-review": "warning",
  };
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <StatusPill tone="info">{items.length} items</StatusPill>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{item.title}</div>
                {item.detail ? <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.owner ? <span>{item.owner}</span> : null}
                  {item.dueLabel ? <span>{item.dueLabel}</span> : null}
                </div>
              </div>
              <StatusPill tone={tones[item.status]}>{item.status}</StatusPill>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="hdk-button primary" type="button" onClick={() => onApprove?.(item)}>Approve</button>
              <button className="hdk-button" type="button" onClick={() => onReject?.(item)}>Reject</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PublishingQueuePanel({
  items,
  title = "Publishing queue",
}: {
  items: PublishingQueueItem[];
  title?: string;
}) {
  const tones: Record<PublishingQueueItem["status"], DashboardTone> = {
    draft: "neutral",
    ready: "success",
    posted: "info",
    blocked: "warning",
  };
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <StatusPill tone="info">{items.length} posts</StatusPill>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3">
            <div className="min-w-0">
              <div className="font-medium text-foreground">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.destination}{item.scheduledLabel ? ` · ${item.scheduledLabel}` : ""}</div>
            </div>
            <StatusPill tone={tones[item.status]}>{item.status}</StatusPill>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProofEvidencePanel({
  records,
  title = "Proof evidence",
}: {
  records: ProofEvidenceRecord[];
  title?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone="info">{records.length} checks</StatusPill>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {records.map((record) => (
          <div key={record.id} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">{record.label}</span>
              <StatusPill tone={record.tone ?? "neutral"}>{record.tone ?? "proof"}</StatusPill>
            </div>
            <div className="mt-2 text-lg font-semibold text-foreground">{record.value}</div>
            {record.detail ? <div className="mt-1 text-xs text-muted-foreground">{record.detail}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function DirectPostingControlPanel({
  enabled,
  destinations,
  title = "Direct posting",
}: {
  enabled: boolean;
  destinations: { id: string; label: string; status: "postable" | "manual" | "blocked"; detail?: string }[];
  title?: string;
}) {
  const tones: Record<"postable" | "manual" | "blocked", DashboardTone> = {
    postable: "success",
    manual: "warning",
    blocked: "critical",
  };
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <StatusPill tone={enabled ? "success" : "warning"}>{enabled ? "enabled" : "human review"}</StatusPill>
      </div>
      <div className="grid gap-2">
        {destinations.map((destination) => (
          <div key={destination.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3">
            <div className="min-w-0">
              <div className="font-medium text-foreground">{destination.label}</div>
              {destination.detail ? <div className="mt-1 text-sm text-muted-foreground">{destination.detail}</div> : null}
            </div>
            <StatusPill tone={tones[destination.status]}>{destination.status}</StatusPill>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GeneratedInsightCallout({
  children,
  label = "Generated insight",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function DashboardEmptySearch() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background p-5 text-center text-sm text-muted-foreground">
      No results match the current query.
    </div>
  );
}

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}
