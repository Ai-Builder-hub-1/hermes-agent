import type { ReactNode } from "react";
import { AlertCircle, Clock3, Loader2, RefreshCw } from "lucide-react";
import { cn } from "./utils";
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingState } from "./states";

export type DashboardDataState = "loading" | "ready" | "partial" | "stale" | "error" | "empty";

export interface DataFreshnessItem {
  label: string;
  state: DashboardDataState;
  value?: ReactNode;
  detail?: string;
}

export function DashboardLoadingShell({
  title = "Loading dashboard",
  description = "Preparing the shell while data hydrates.",
  children,
  className,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("hdk-loading-shell", className)} data-hdk-component="DashboardLoadingShell">
      <div className="hdk-loading-shell__header">
        <Loader2 className="hdk-loading-shell__icon" aria-hidden="true" />
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="hdk-loading-shell__body">{children ?? <SkeletonDashboardGrid />}</div>
    </section>
  );
}

export function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <article className={cn("hdk-skeleton-card hdk-skeleton-metric", className)} data-hdk-component="SkeletonMetricCard">
      <span />
      <strong />
      <p />
    </article>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <article className={cn("hdk-skeleton-card hdk-skeleton-chart", className)} data-hdk-component="SkeletonChart">
      <span />
      <div />
    </article>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <article className={cn("hdk-skeleton-card hdk-skeleton-table", className)} data-hdk-component="SkeletonTable">
      {Array.from({ length: rows }).map((_, index) => <span key={index} />)}
    </article>
  );
}

export function SkeletonDashboardGrid() {
  return (
    <div className="hdk-skeleton-dashboard-grid" data-hdk-component="SkeletonDashboardGrid">
      <SkeletonMetricCard />
      <SkeletonMetricCard />
      <SkeletonMetricCard />
      <SkeletonChart />
      <SkeletonTable />
    </div>
  );
}

export function DataFreshnessStrip({
  items,
  className,
}: {
  items: DataFreshnessItem[];
  className?: string;
}) {
  return (
    <section className={cn("hdk-data-freshness-strip", className)} data-hdk-component="DataFreshnessStrip">
      {items.map((item) => (
        <article className={`hdk-freshness hdk-state-${item.state}`} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value ?? item.state}</strong>
          {item.detail ? <p>{item.detail}</p> : null}
        </article>
      ))}
    </section>
  );
}

export function StaleDataBadge({
  age,
  label = "Stale",
}: {
  age?: string;
  label?: string;
}) {
  return (
    <span className="hdk-stale-badge" data-hdk-component="StaleDataBadge">
      <Clock3 aria-hidden="true" />
      {label}
      {age ? ` · ${age}` : ""}
    </span>
  );
}

export function PartialDataBanner({
  title = "Partial data",
  message = "Some data is still loading or unavailable. Visible metrics are safe to inspect but not complete.",
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <section className="hdk-partial-banner" data-hdk-component="PartialDataBanner">
      <AlertCircle aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {action}
    </section>
  );
}

export function DashboardQueryBoundary({
  state,
  loadingLabel = "Loading data",
  emptyTitle = "No data yet",
  emptyDescription = "The system has not produced records for this view yet.",
  staleMessage = "Showing cached data while a refresh runs.",
  error,
  children,
}: {
  state: DashboardDataState;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  staleMessage?: string;
  error?: string;
  children: ReactNode;
}) {
  if (state === "loading") return <DashboardLoadingState label={loadingLabel} />;
  if (state === "error") return <DashboardErrorState message={error ?? "The data request failed."} />;
  if (state === "empty") return <DashboardEmptyState title={emptyTitle} description={emptyDescription} />;
  return (
    <div className="hdk-query-boundary" data-hdk-component="DashboardQueryBoundary" data-data-state={state}>
      {state === "partial" ? <PartialDataBanner /> : null}
      {state === "stale" ? (
        <div className="hdk-stale-inline">
          <RefreshCw aria-hidden="true" />
          {staleMessage}
        </div>
      ) : null}
      {children}
    </div>
  );
}

