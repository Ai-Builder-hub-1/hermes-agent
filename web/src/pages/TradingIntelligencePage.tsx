/**
 * Trading Intelligence Control Plane.
 *
 * One screen, no tabs: fleet numbers left, both systems centre, live activity
 * tape right, controls docked at the bottom of the centre column. Ported from
 * the variant-B prototype in
 * `docs/design/prototypes/trading-intelligence/variant-b-dense-grid.html`.
 *
 * Rules this page is built around, all of them load-bearing:
 *  - `null` renders "No data"; a real `0` renders `0`. Different answers.
 *  - Status is never colour-alone — every badge is icon + word + tone.
 *  - Signed P/L gets up/down colour; risk and counts stay neutral.
 *  - An unavailable project is shown as degraded, never hidden.
 *  - Controls preview first; execute is a second, separate request, and
 *    success is never inferred from transport alone.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleHelp,
  Lock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@nous-research/ui/ui/components/dialog";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, isoTimeAgo } from "@/lib/utils";
import {
  EVENT_FILTERS,
  EVENTS_STALE_SECONDS,
  POLL_EVENTS_MS,
  POLL_SUMMARY_MS,
  SUMMARY_STALE_SECONDS,
  buildControlRequest,
  controlExecutionSucceeded,
  controlRequiresConfirmation,
  controlRiskLevel,
  eventSeverity,
  fetchTradingControls,
  fetchTradingEvents,
  fetchTradingSummary,
  fleetKpiCards,
  formatCount,
  formatCurrency,
  formatPercent,
  humanizeKpiKey,
  isNum,
  isSignedPnlKey,
  isStale,
  pnlDirection,
  projectShortCode,
  requestTradingControl,
  riskTone,
  severityTone,
  statusTone,
  NO_DATA,
  type ControlResponse,
  type KnownStatus,
  type ProjectStatus,
  type TradingControl,
  type TradingControlsResponse,
  type TradingEvent,
  type TradingEventsResponse,
  type TradingIntelligenceSummary,
  type TradingProjectSummary,
} from "@/lib/trading-intelligence";

// ---------------------------------------------------------------------------
// Tone helpers
// ---------------------------------------------------------------------------

type Tone = KnownStatus | "unknown";

const TONE_BADGE: Record<Tone, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  watch: "border-warning/45 bg-warning/10 text-warning",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  unavailable: "border-destructive/50 bg-destructive/15 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

const TONE_RAIL: Record<Tone, string> = {
  ready: "bg-success",
  watch: "bg-warning",
  blocked: "bg-destructive",
  unavailable: "bg-destructive",
  unknown: "bg-border",
};

function ToneIcon({ tone, className }: { tone: Tone; className?: string }) {
  const cls = cn("size-3 shrink-0", className);
  if (tone === "ready") return <CheckCircle2 className={cls} aria-hidden />;
  if (tone === "watch") return <AlertTriangle className={cls} aria-hidden />;
  if (tone === "blocked") return <Ban className={cls} aria-hidden />;
  if (tone === "unavailable") return <ShieldAlert className={cls} aria-hidden />;
  return <CircleHelp className={cls} aria-hidden />;
}

/** Icon + word + tone. Colour never carries the meaning on its own. */
function StatusPill({
  status,
  label,
  title,
  className,
}: {
  status: ProjectStatus;
  label?: string;
  title?: string;
  className?: string;
}) {
  const tone = statusTone(status);
  return (
    <span
      title={title ?? `status: ${status}`}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        TONE_BADGE[tone],
        className,
      )}
    >
      <ToneIcon tone={tone} />
      <span>{label ?? status}</span>
    </span>
  );
}

function LockPill({ locked }: { locked: boolean }) {
  return locked ? (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      <Lock className="size-3 shrink-0" aria-hidden />
      <span>Live trading locked</span>
    </span>
  ) : (
    <StatusPill status="watch" label="Live trading UNLOCKED" />
  );
}

function pnlClass(v: unknown): string {
  const dir = pnlDirection(v);
  return dir === "up" ? "text-success" : dir === "down" ? "text-destructive" : "";
}

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

interface Resource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

const EMPTY: Resource<never> = { data: null, error: null, loading: true };

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function useTradingIntelligence() {
  const [summary, setSummary] = useState<Resource<TradingIntelligenceSummary>>(EMPTY);
  const [events, setEvents] = useState<Resource<TradingEventsResponse>>(EMPTY);
  const [controls, setControls] = useState<Resource<TradingControlsResponse>>(EMPTY);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadSummary = useCallback(async () => {
    setSummary((s) => ({ ...s, loading: true }));
    try {
      const data = await fetchTradingSummary();
      if (alive.current) setSummary({ data, error: null, loading: false });
    } catch (e) {
      // Keep the last good payload on screen and mark it — an empty shell is
      // worse than stale numbers that are labelled stale.
      if (alive.current) setSummary((s) => ({ data: s.data, error: errText(e), loading: false }));
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setEvents((s) => ({ ...s, loading: true }));
    try {
      const data = await fetchTradingEvents(10);
      if (alive.current) setEvents({ data, error: null, loading: false });
    } catch (e) {
      if (alive.current) setEvents((s) => ({ data: s.data, error: errText(e), loading: false }));
    }
  }, []);

  const loadControls = useCallback(async () => {
    setControls((s) => ({ ...s, loading: true }));
    try {
      const data = await fetchTradingControls();
      if (alive.current) setControls({ data, error: null, loading: false });
    } catch (e) {
      if (alive.current) setControls((s) => ({ data: s.data, error: errText(e), loading: false }));
    }
  }, []);

  const refreshAll = useCallback(() => {
    void loadSummary();
    void loadEvents();
    void loadControls();
  }, [loadSummary, loadEvents, loadControls]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Poll only while the tab is visible — a hidden dashboard should not keep
  // probing two trading systems.
  useEffect(() => {
    let summaryTimer: number | undefined;
    let eventsTimer: number | undefined;
    const start = () => {
      stop();
      summaryTimer = window.setInterval(() => void loadSummary(), POLL_SUMMARY_MS);
      eventsTimer = window.setInterval(() => void loadEvents(), POLL_EVENTS_MS);
    };
    const stop = () => {
      if (summaryTimer) window.clearInterval(summaryTimer);
      if (eventsTimer) window.clearInterval(eventsTimer);
      summaryTimer = undefined;
      eventsTimer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void loadSummary();
        void loadEvents();
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadSummary, loadEvents]);

  return { summary, events, controls, refreshAll, loadSummary, loadEvents, loadControls };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TradingIntelligencePage() {
  const { summary, events, controls, refreshAll, loadSummary, loadEvents, loadControls } =
    useTradingIntelligence();
  const { setAfterTitle, setEnd } = usePageHeader();
  const [eventFilter, setEventFilter] = useState("all");
  const [activeControl, setActiveControl] = useState<TradingControl | null>(null);

  const s = summary.data;
  const busy = summary.loading || events.loading || controls.loading;

  useLayoutEffect(() => {
    setAfterTitle(
      s ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={s.status} />
          <LockPill locked={s.liveTradingLocked} />
        </div>
      ) : null,
    );
    setEnd(
      <div className="flex items-center gap-2">
        {s ? <FreshnessStamp generatedAt={s.generatedAt} maxAgeSeconds={SUMMARY_STALE_SECONDS} /> : null}
        <Button
          type="button"
          ghost
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={refreshAll}
          disabled={busy}
          aria-label="Refresh trading intelligence"
        >
          {busy ? <Spinner /> : <RefreshCw />}
        </Button>
      </div>,
    );
    return () => {
      setAfterTitle(null);
      setEnd(null);
    };
  }, [s, busy, refreshAll, setAfterTitle, setEnd]);

  // Full-page degraded shell only when there is nothing at all to show.
  if (!s && summary.error) {
    return <SummaryErrorShell message={summary.error} onRetry={() => void loadSummary()} />;
  }
  if (!s) {
    return <LoadingShell />;
  }

  const filter = EVENT_FILTERS.find((f) => f.id === eventFilter) ?? EVENT_FILTERS[0];
  const allEvents = events.data?.events ?? [];
  const shownEvents = allEvents.filter(filter.test);

  return (
    <main
      className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-3 py-3 sm:px-4"
      data-review-id="hermes.trading-intelligence"
    >
      <SafetyBanner />

      {summary.error ? (
        <PartialBanner
          what="Fleet summary refresh failed — showing the last successful payload."
          detail={summary.error}
          onRetry={() => void loadSummary()}
        />
      ) : null}

      <div className="grid min-h-0 gap-3 xl:grid-cols-[270px_minmax(0,1fr)_340px]">
        {/* ---- left: fleet numbers, blockers, recommendations ---- */}
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="Fleet KPIs">
            <FleetKpiMatrix summary={s} />
          </Panel>
          <Panel title="Needs attention" count={s.blockers.length} tone={s.blockers.length ? "blocked" : "ready"}>
            {s.blockers.length ? (
              <ReasonList items={s.blockers} tone="blocked" />
            ) : (
              <EmptyNote>No blockers reported across the fleet.</EmptyNote>
            )}
          </Panel>
          <Panel title="Recommended next" count={s.recommendations.length}>
            {s.recommendations.length ? (
              <ReasonList items={s.recommendations} tone="info" />
            ) : (
              <EmptyNote>No recommendations reported.</EmptyNote>
            )}
          </Panel>
        </div>

        {/* ---- centre: the two systems + docked controls ---- */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid gap-3 lg:grid-cols-2">
            {s.projects.map((p) => (
              <SystemPanel key={p.projectId} project={p} />
            ))}
          </div>
          <ControlBar
            controls={controls}
            onPick={setActiveControl}
            onRetry={() => void loadControls()}
          />
        </div>

        {/* ---- right: activity tape ---- */}
        <div className="flex min-w-0 flex-col">
          <Panel
            title="Activity tape"
            count={allEvents.length}
            stamp={
              events.data ? (
                <FreshnessStamp generatedAt={events.data.generatedAt} maxAgeSeconds={EVENTS_STALE_SECONDS} />
              ) : null
            }
          >
            <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
              {EVENT_FILTERS.map((f) => {
                const n = allEvents.filter(f.test).length;
                const active = f.id === eventFilter;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setEventFilter(f.id)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.label}
                    <span className="ml-1 tabular-nums opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
            {events.error && !events.data ? (
              <EmptyNote>
                Events are unavailable — the rest of the page is unaffected.
                <p className="m-0 mt-2 font-mono text-[10px] text-destructive">{events.error}</p>
                <Button type="button" size="xs" outlined className="mt-2" onClick={() => void loadEvents()}>
                  Retry events
                </Button>
              </EmptyNote>
            ) : shownEvents.length ? (
              <div className="max-h-[62vh] overflow-y-auto xl:max-h-[calc(100vh-16rem)]">
                {shownEvents.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <EmptyNote>
                {allEvents.length
                  ? "No events match this filter."
                  : "No recent trading intelligence events found."}
              </EmptyNote>
            )}
          </Panel>
        </div>
      </div>

      <ControlDialog
        key={activeControl?.namespacedId ?? "no-control"}
        control={activeControl}
        onClose={() => setActiveControl(null)}
        onExecuted={() => {
          void loadSummary();
          void loadEvents();
          void loadControls();
        }}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function SafetyBanner() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      <Lock className="size-3.5 shrink-0" aria-hidden />
      <span>
        Live trading is locked. This page can inspect systems and proxy approved controls, but it
        cannot submit live broker orders.
      </span>
    </div>
  );
}

function FreshnessStamp({
  generatedAt,
  maxAgeSeconds,
}: {
  generatedAt: string;
  maxAgeSeconds: number;
}) {
  const stale = isStale(generatedAt, maxAgeSeconds);
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums",
        stale ? "font-bold text-warning" : "text-muted-foreground",
      )}
      title={generatedAt}
    >
      {isoTimeAgo(generatedAt)}
      {stale ? " · STALE" : ""}
    </span>
  );
}

function Panel({
  title,
  count,
  tone,
  stamp,
  children,
}: {
  title: string;
  count?: number;
  tone?: Tone;
  stamp?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="flex items-center gap-2 border-b border-border bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
        <span>{title}</span>
        {stamp}
        {count !== undefined ? (
          <span
            className={cn(
              "ml-auto tabular-nums",
              tone === "blocked" ? "text-destructive" : "text-foreground",
            )}
          >
            {count}
          </span>
        ) : null}
      </h2>
      <div className="min-h-0">{children}</div>
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-2.5 rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left column
// ---------------------------------------------------------------------------

function FleetKpiMatrix({ summary }: { summary: TradingIntelligenceSummary }) {
  const cards = fleetKpiCards(summary.kpis);
  return (
    <table className="w-full border-collapse tabular-nums">
      <caption className="sr-only">Fleet-level trading KPIs</caption>
      <tbody>
        {cards.map((c) => {
          const hot = c.key === "blockers" && summary.kpis.blockers > 0;
          const noData = c.value === NO_DATA;
          return (
            <tr key={c.key} className={cn("border-b border-border last:border-b-0", hot && "bg-destructive/10")}>
              <th
                scope="row"
                className="px-2.5 py-1.5 text-left text-[10.5px] font-normal uppercase tracking-wide text-muted-foreground"
                title={c.note}
              >
                {c.label}
              </th>
              <td
                className={cn(
                  "whitespace-nowrap px-2.5 py-1.5 text-right font-bold",
                  noData ? "text-[11px] text-muted-foreground" : "text-[15px]",
                  hot && "text-destructive",
                  "pnl" in c ? pnlClass(c.pnl) : "",
                )}
              >
                {c.value}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Blockers arrive already prefixed with the project label by the aggregator;
 *  split it back off so the source reads as a tag rather than repeated prose. */
function splitProjectPrefix(text: string): { code: string | null; body: string } {
  const m = /^(Investing System|Khashi VC):\s*([\s\S]*)$/.exec(text);
  if (!m) return { code: null, body: text };
  return { code: m[1] === "Khashi VC" ? "KHA" : "INV", body: m[2] };
}

function ReasonList({ items, tone }: { items: string[]; tone: "blocked" | "info" }) {
  return (
    <ul className="m-0 list-none p-0">
      {items.map((raw, i) => {
        const { code, body } = splitProjectPrefix(raw);
        return (
          <li
            key={`${i}-${raw.slice(0, 24)}`}
            className="flex gap-2 border-b border-border px-2.5 py-1.5 text-[11.5px] leading-snug last:border-b-0"
          >
            <span
              className={cn("w-[3px] shrink-0 self-stretch rounded-sm", tone === "blocked" ? "bg-destructive" : "bg-foreground/40")}
              aria-hidden
            />
            {code ? (
              <span
                className="w-7 shrink-0 pt-px text-[9.5px] font-bold tracking-wide text-muted-foreground"
                title={code === "KHA" ? "Khashi VC" : "Investing System"}
              >
                {code}
              </span>
            ) : null}
            <span className="min-w-0 break-words">{body}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Centre column
// ---------------------------------------------------------------------------

function SystemPanel({ project }: { project: TradingProjectSummary }) {
  const tone = statusTone(project.available ? project.status : "unavailable");
  const numeric = Object.entries(project.kpis).filter(([, v]) => isNum(v)) as Array<[string, number]>;
  const flags = Object.entries(project.kpis).filter(([, v]) => typeof v === "boolean") as Array<
    [string, boolean]
  >;
  const learning = project.kpis.learningProgressPct;

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-2.5 py-2">
        <span className={cn("w-[3px] self-stretch rounded-sm", TONE_RAIL[tone])} aria-hidden />
        <span className="text-[13px] font-bold">{project.label}</span>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-1">
          <StatusPill status={project.available ? project.status : "unavailable"} />
          {project.liveTradingLocked ? (
            <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <Lock className="size-3" aria-hidden />
              locked
            </span>
          ) : null}
        </span>
      </header>

      <div className="p-2.5">
        <div className="mb-2 flex flex-wrap gap-3 text-[10.5px] tabular-nums text-muted-foreground">
          <span>
            HTTP <b className="font-semibold text-foreground">{project.httpStatus || 0}</b>
          </span>
          <span title="Cumulative across base-URL fallback attempts, not a clean source RTT">
            <b className="font-semibold text-foreground">{project.latencyMs}ms</b> probe
          </span>
          <span className="truncate font-mono" title={project.sourceBaseUrl ?? ""}>
            {project.sourceBaseUrl ?? "no base url"}
          </span>
        </div>

        {!project.available ? (
          <div className="rounded-md border border-dashed border-destructive/50 bg-destructive/10 p-2.5">
            <div className="text-xs font-bold text-destructive">Stream missing — not empty</div>
            <p className="m-0 mt-1 break-words font-mono text-[10.5px] text-destructive">
              {project.error ?? "no error text"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border">
              {numeric.slice(0, 10).map(([k, v]) => {
                const money = /pnl|risk/i.test(k);
                return (
                  <div key={k} className="min-w-0 bg-card px-2 py-1" title={humanizeKpiKey(k)}>
                    {/* Key above value: side by side, a 150px cell truncates
                        "orderbookSnapshots" down to something unreadable. */}
                    <div className="truncate text-[10px] leading-tight text-muted-foreground">{k}</div>
                    <div
                      className={cn(
                        "whitespace-nowrap text-[13px] font-bold leading-tight tabular-nums",
                        isSignedPnlKey(k) ? pnlClass(v) : "",
                      )}
                    >
                      {money ? formatCurrency(v) : formatCount(v)}
                    </div>
                  </div>
                );
              })}
            </div>

            {flags.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {flags.map(([k, v]) => {
                  const good = /stale/i.test(k) ? !v : v;
                  return (
                    <StatusPill
                      key={k}
                      status={good ? "ready" : "watch"}
                      label={`${k} ${v}`}
                      title={`${humanizeKpiKey(k)}: ${v}`}
                    />
                  );
                })}
              </div>
            ) : null}

            {isNum(learning) ? (
              <div className="mt-2.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Learning sample {formatPercent(learning)}
                </div>
                <div
                  className="mt-1 h-1 overflow-hidden rounded-sm bg-muted"
                  role="meter"
                  aria-valuenow={Math.round(learning)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Learning sample progress"
                >
                  <div className="h-full bg-foreground/60" style={{ width: `${Math.min(100, learning)}%` }} />
                </div>
              </div>
            ) : null}
          </>
        )}

        {project.blockers.length ? (
          <>
            <div className="mt-3 text-[9.5px] font-bold uppercase tracking-[0.09em] text-destructive">
              Blockers · {project.blockers.length}
            </div>
            <ul className="m-0 mt-1 list-none p-0">
              {project.blockers.map((b, i) => (
                <li key={`${i}-${b.slice(0, 20)}`} className="flex gap-2 py-1 text-[11.5px] leading-snug">
                  <span className="w-[3px] shrink-0 self-stretch rounded-sm bg-destructive" aria-hidden />
                  <span className="min-w-0 break-words">{b}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {project.recommendations.length ? (
          <>
            <div className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
              Next
            </div>
            <ul className="m-0 mt-1 list-none p-0">
              {project.recommendations.slice(0, 3).map((r, i) => (
                <li key={`${i}-${r.slice(0, 20)}`} className="flex gap-2 py-1 text-[11.5px] leading-snug">
                  <span className="w-[3px] shrink-0 self-stretch rounded-sm bg-foreground/40" aria-hidden />
                  <span className="min-w-0 break-words">{r}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Right column
// ---------------------------------------------------------------------------

function EventRow({ event }: { event: TradingEvent }) {
  const sev = eventSeverity(event);
  const tone = severityTone(sev);
  return (
    <article className="grid grid-cols-[3px_46px_minmax(0,1fr)] gap-2 border-b border-border px-2.5 py-1.5 last:border-b-0 hover:bg-muted/60">
      <span className={cn("rounded-sm", TONE_RAIL[tone])} aria-hidden />
      <time className="text-[10px] tabular-nums text-muted-foreground" dateTime={event.occurredAt}>
        {isoTimeAgo(event.occurredAt)}
      </time>
      <div className="min-w-0">
        <div className="text-[11.5px] font-semibold leading-tight">{event.title}</div>
        <div className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">{event.summary}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Badge tone="outline" className="text-[9px]" title={String(event.sourceProject)}>
            {projectShortCode(event.sourceProject)}
          </Badge>
          <StatusPill status={tone} label={String(sev)} title={`severity: ${sev}`} />
          {event.instrument ? (
            <Badge tone="secondary" className="font-mono text-[9px]">
              {event.instrument}
            </Badge>
          ) : null}
          <Badge tone="secondary" className="font-mono text-[9px]">
            {event.type}
          </Badge>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function ControlBar({
  controls,
  onPick,
  onRetry,
}: {
  controls: Resource<TradingControlsResponse>;
  onPick: (c: TradingControl) => void;
  onRetry: () => void;
}) {
  const data = controls.data;
  const list = data?.controls ?? [];
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-2.5 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
          Controls
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <Lock className="size-3" aria-hidden />
          preview first
        </span>
        <span className="ml-auto text-[10.5px] text-muted-foreground">
          {list.length} project-owned {list.length === 1 ? "action" : "actions"}
        </span>
      </div>
      <div className="p-2.5">
        {controls.error && !data ? (
          <EmptyNote>
            Controls are unavailable.
            <p className="m-0 mt-2 font-mono text-[10px] text-destructive">{controls.error}</p>
            <Button type="button" size="xs" outlined className="mt-2" onClick={onRetry}>
              Retry controls
            </Button>
          </EmptyNote>
        ) : !list.length ? (
          <EmptyNote>No controls are available from this project right now.</EmptyNote>
        ) : (
          <>
            {data?.projects.some((p) => !p.available) ? (
              <div className="mb-2 text-[10.5px] text-warning">
                {data.projects
                  .filter((p) => !p.available)
                  .map((p) => `${p.label} controls unavailable (${p.error ?? "source down"})`)
                  .join(" · ")}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {list.map((c) => {
                const risk = controlRiskLevel(c);
                const tone = riskTone(risk);
                return (
                  <button
                    key={c.namespacedId}
                    type="button"
                    onClick={() => onPick(c)}
                    title={`${c.namespacedId} — ${risk} risk — ${c.intent ?? ""}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-muted",
                      tone === "blocked" ? "border-destructive/40" : "border-border",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", TONE_RAIL[tone])} aria-hidden />
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {projectShortCode(c.projectId)}
                    </span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

const MIN_REASON_LENGTH = 8;

function ControlDialog({
  control,
  onClose,
  onExecuted,
}: {
  control: TradingControl | null;
  onClose: () => void;
  onExecuted: () => void;
}) {
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<ControlResponse | null>(null);
  const [executed, setExecuted] = useState<ControlResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!control) return null;

  const risk = controlRiskLevel(control);
  const tone = riskTone(risk);
  const needsConfirmation = controlRequiresConfirmation(control);
  const reasonTooShort = needsConfirmation && reason.trim().length < MIN_REASON_LENGTH;

  const send = async (execute: boolean) => {
    setPending(true);
    setFailure(null);
    try {
      const res = await requestTradingControl(buildControlRequest(control, { execute, reason }));
      if (execute) {
        setExecuted(res);
        onExecuted();
      } else {
        setPreview(res);
      }
    } catch (e) {
      setFailure(errText(e));
    } finally {
      setPending(false);
    }
  };

  const succeeded = executed ? controlExecutionSucceeded(executed) : false;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
              {control.projectLabel}
            </span>
            <StatusPill status={tone} label={`${risk} risk`} title={`derived risk level: ${risk}`} />
            {control.requiresServiceRestart ? (
              <StatusPill status="watch" label="service restart" />
            ) : null}
            <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <Lock className="size-3" aria-hidden />
              live locked
            </span>
          </div>
          <DialogTitle className="mt-1.5 text-base">{control.label}</DialogTitle>
          <DialogDescription className="font-mono text-[11px]">{control.namespacedId}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          {control.intent || control.description ? (
            <p className="m-0 text-muted-foreground">{control.intent ?? control.description}</p>
          ) : null}

          <dl className="grid grid-cols-[132px_minmax(0,1fr)] gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">Execution</dt>
            <dd className="m-0">{control.execution ?? "—"}</dd>
            <dt className="text-muted-foreground">Broker mutation</dt>
            <dd className="m-0">{control.brokerMutation ? "possible" : "no"}</dd>
            <dt className="text-muted-foreground">Live trading</dt>
            <dd className="m-0">locked</dd>
            <dt className="text-muted-foreground">Confirmation</dt>
            <dd className="m-0">{needsConfirmation ? "required" : "not required"}</dd>
            {control.effect ? (
              <>
                <dt className="text-muted-foreground">Effect</dt>
                <dd className="m-0 break-words">{control.effect}</dd>
              </>
            ) : null}
            {control.runbookCommand ? (
              <>
                <dt className="text-muted-foreground">Runbook</dt>
                <dd className="m-0">
                  <code className="font-mono">{control.runbookCommand}</code>
                </dd>
              </>
            ) : null}
          </dl>

          <div>
            <label
              htmlFor="ti-control-reason"
              className="mb-1 block text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground"
            >
              Reason (sent with the request)
            </label>
            <textarea
              id="ti-control-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you running this? Recorded on the project ledger."
              className="w-full resize-y rounded border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-foreground/50"
            />
          </div>

          {failure ? (
            <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-destructive">
              <div className="font-bold">Request failed</div>
              <p className="m-0 font-mono text-[10.5px]">{failure}</p>
            </div>
          ) : null}

          {preview ? (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
                Preview response · execute:false
              </div>
              <PayloadBlock value={preview} />
            </div>
          ) : null}

          {executed ? (
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
                  Execute response
                </span>
                <StatusPill
                  status={succeeded ? "ready" : "blocked"}
                  label={succeeded ? "proxied + source confirmed" : "not confirmed"}
                />
              </div>
              <PayloadBlock value={executed} />
            </div>
          ) : null}
        </div>

        <DialogFooter className="items-center">
          <span className="mr-auto text-[11px] text-muted-foreground">
            {executed
              ? "Summary, events and controls have been refreshed."
              : preview
                ? "Preview returned. Confirm to send execute:true."
                : "Step 1 of 2 — preview first."}
          </span>
          <Button type="button" outlined onClick={onClose}>
            {executed ? "Close" : "Cancel"}
          </Button>
          {!preview ? (
            <Button type="button" disabled={pending} onClick={() => void send(false)}>
              {pending ? <Spinner /> : null}
              Preview
            </Button>
          ) : !executed ? (
            <Button
              type="button"
              destructive={risk !== "low"}
              disabled={pending || reasonTooShort}
              title={
                reasonTooShort
                  ? `A reason of at least ${MIN_REASON_LENGTH} characters is required at ${risk} risk`
                  : undefined
              }
              onClick={() => void send(true)}
            >
              {pending ? <Spinner /> : null}
              Execute {control.label}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayloadBlock({ value }: { value: unknown }) {
  return (
    <pre className="m-0 max-h-56 overflow-auto rounded border border-border bg-muted p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Loading / error shells
// ---------------------------------------------------------------------------

function PartialBanner({
  what,
  detail,
  onRetry,
}: {
  what: string;
  detail: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-warning/45 bg-warning/10 px-3 py-1.5 text-xs text-warning">
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      <span className="font-semibold">{what}</span>
      <code className="font-mono text-[10.5px] opacity-80">{detail}</code>
      <Button type="button" size="xs" outlined className="ml-auto" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} aria-hidden />;
}

function LoadingShell() {
  return (
    <main
      className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-3 py-3 sm:px-4"
      data-review-id="hermes.trading-intelligence"
      aria-busy="true"
    >
      <span className="sr-only">Loading trading intelligence…</span>
      <Skeleton className="h-8 w-full" />
      <div className="grid gap-3 xl:grid-cols-[270px_minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-40" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[28rem]" />
      </div>
    </main>
  );
}

function SummaryErrorShell({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main
      className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-3 py-8 sm:px-4"
      data-review-id="hermes.trading-intelligence"
    >
      <SafetyBanner />
      <section className="mx-auto w-full max-w-lg rounded-lg border border-border bg-card p-7 text-center">
        <div className="mb-2 flex justify-center">
          <StatusPill status="blocked" label="summary unavailable" />
        </div>
        <h2 className="m-0 text-base font-semibold">Trading intelligence summary is unavailable.</h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          The dashboard shell is intact — the fleet rollup did not return.
        </p>
        <p className="m-0 mt-3 break-words font-mono text-[11px] text-destructive">{message}</p>
        <Button type="button" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </section>
    </main>
  );
}
