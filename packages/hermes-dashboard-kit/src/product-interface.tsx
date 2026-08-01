import type { ReactNode } from "react";
import { Bot, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, ClipboardCheck, Command, Filter, Lock, Search, Send, Sparkles, Star } from "lucide-react";
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
