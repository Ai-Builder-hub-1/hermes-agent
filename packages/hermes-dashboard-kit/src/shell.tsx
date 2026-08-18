import type { ComponentType, ReactNode } from "react";
import { cn } from "./utils";

export interface DashboardNavItem {
  id: string;
  label: string;
  shortLabel?: string;
  href?: string;
  active?: boolean;
  icon?: ComponentType<{ className?: string }>;
  badge?: ReactNode;
  description?: string;
  onClick?: () => void;
}

export interface DashboardNavGroup {
  id: string;
  label: string;
  items: DashboardNavItem[];
}

export function DashboardShell({
  sidebar,
  header,
  children,
  className,
}: {
  sidebar?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-0 w-full", className)}>
      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        {sidebar ? <aside className="min-w-0">{sidebar}</aside> : null}
        <section className="min-w-0 space-y-4">
          {header}
          <DashboardMain>{children}</DashboardMain>
        </section>
      </div>
    </div>
  );
}

export function DashboardMain({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <main className={cn("min-w-0 space-y-4", className)}>{children}</main>;
}

export function DashboardSection({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}>
      {(title || description || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function DashboardHeader({
  title,
  eyebrow,
  description,
  actions,
  meta,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-card p-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function DashboardSessionControl({
  state = "locked",
  label,
  input,
  save,
  clear,
  className,
}: {
  state?: "locked" | "ready";
  label?: string;
  input?: ReactNode;
  save?: ReactNode;
  clear?: ReactNode;
  className?: string;
}) {
  const resolvedLabel = label ?? (state === "ready" ? "Session saved" : "Session required");

  return (
    <div
      className={cn("hdk-session-control", className)}
      data-hdk-component="DashboardSessionControl"
      data-session-state={state}
    >
      <span className="hdk-session-status">{resolvedLabel}</span>
      {input}
      {save}
      {clear}
    </div>
  );
}

export function DashboardSidebar({
  title,
  description,
  mark,
  items,
  groups,
  footer,
  status,
  className,
}: {
  title: string;
  description?: string;
  mark?: ReactNode;
  items?: DashboardNavItem[];
  groups?: DashboardNavGroup[];
  footer?: ReactNode;
  status?: ReactNode;
  className?: string;
}) {
  const resolvedGroups =
    groups?.length
      ? groups
      : [
          {
            id: "main",
            label: "Navigation",
            items: items ?? [],
          },
        ];

  return (
    <nav className={cn("rounded-lg border border-border bg-card p-3", className)} aria-label={title} data-hdk-component="DashboardSidebar">
      <div className="flex min-w-0 items-center gap-3 border-b border-border pb-3" data-sidebar-brand>
        {mark ? <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">{mark}</div> : null}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          {description ? <div className="mt-1 truncate text-xs text-muted-foreground">{description}</div> : null}
        </div>
      </div>
      <div className="mt-3 space-y-4">
        {resolvedGroups.map((group) => (
          <section key={group.id} className="space-y-1" data-nav-group={group.id}>
            <div className="px-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge}
                </>
              );
              const classes = cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              );
              const shortLabel =
                item.shortLabel ?? item.label.slice(0, 4);

              return item.href ? (
                <a key={item.id} aria-current={item.active ? "page" : undefined} className={classes} data-short={shortLabel} href={item.href} title={item.description ?? item.label}>
                  {content}
                </a>
              ) : (
                <button key={item.id} aria-current={item.active ? "page" : undefined} className={classes} data-short={shortLabel} onClick={item.onClick} title={item.description ?? item.label} type="button">
                  {content}
                </button>
              );
            })}
          </section>
        ))}
      </div>
      {(status || footer) ? (
        <div className="mt-4 border-t border-border pt-3" data-sidebar-footer>
          {status ? <div className="mb-3 rounded-md border border-border bg-muted/50 p-2 text-xs text-muted-foreground">{status}</div> : null}
          {footer}
        </div>
      ) : null}
    </nav>
  );
}

export function DashboardPageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn("text-2xl font-semibold text-foreground", className)}>{children}</h1>;
}
