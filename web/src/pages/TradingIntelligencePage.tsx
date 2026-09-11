/**
 * Trading Command Center.
 *
 * One screen over Investing System and Khashi VC, built on the single
 * `/api/trading-intelligence/command-center` contract. Layout is the spec's
 * Version B: lane stack left, daily figures centre, action queue and blockers
 * right, merged event table along the bottom, controls preview-first.
 *
 * ── Deliberate deviation from the handoff ──────────────────────────────────
 *
 * The spec's KPI card #1 is `dailyMetrics.cashLeftUsd`. This page never renders
 * that field. It is a plain sum across sources and the backend's own payload
 * warns that it "can include real broker cash and internal simulated
 * bankrolls". Instead the page splits `bySource` by provenance and shows each
 * class separately — real broker cash is the headline, a simulated bankroll
 * sits beside it, visibly different, and the two are never added. A source that
 * reports cash without stating where it lives is shown as unclassified rather
 * than counted as real.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleHelp,
  Lock,
  RefreshCw,
  ShieldAlert,
  Wallet,
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
  COMMAND_STALE_SECONDS,
  EVENT_FILTERS,
  MIN_CONTROL_REASON,
  NO_DATA,
  POLL_COMMAND_MS,
  canChartHistory,
  controlIsDangerous,
  controlSucceeded,
  coverageLabel,
  coverageTone,
  eventSeverity,
  fetchCommandCenter,
  fetchControls,
  formatCount,
  formatUsd,
  isNum,
  isStale,
  khashiCashNote,
  missingSources,
  pnlDirection,
  requestControl,
  severityTone,
  sourceShort,
  splitCapital,
  splitMetric,
  statusTone,
  type CapitalBucket,
  type CapitalSplit,
  type MetricContribution,
  type MetricSplit,
  type ControlResponse,
  type ControlsResponse,
  type Coverage,
  type DailySeries,
  type DailySourceRow,
  type Lane,
  type Tone,
  type TradingCommandCenter,
  type TradingControl,
  type TradingEvent,
} from "@/lib/trading-command-center";

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

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

function ToneIcon({ tone }: { tone: Tone }) {
  const cls = "size-3 shrink-0";
  if (tone === "ready") return <CheckCircle2 className={cls} aria-hidden />;
  if (tone === "watch") return <AlertTriangle className={cls} aria-hidden />;
  if (tone === "blocked") return <Ban className={cls} aria-hidden />;
  if (tone === "unavailable") return <ShieldAlert className={cls} aria-hidden />;
  return <CircleHelp className={cls} aria-hidden />;
}

function Pill({ tone, label, title, className }: { tone: Tone; label: string; title?: string; className?: string }) {
  return (
    <span
      title={title ?? label}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        TONE_BADGE[tone],
        className,
      )}
    >
      <ToneIcon tone={tone} />
      <span>{label}</span>
    </span>
  );
}

function LockPill({ locked }: { locked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        locked ? "border-border bg-muted text-muted-foreground" : TONE_BADGE.blocked,
      )}
    >
      <Lock className="size-3 shrink-0" aria-hidden />
      <span>{locked ? "Live trading locked" : "Live trading UNLOCKED"}</span>
    </span>
  );
}

function Panel({
  title,
  count,
  tone,
  aside,
  children,
}: {
  title: string;
  count?: number | string;
  tone?: Tone;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="flex items-center gap-2 border-b border-border bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
        <span>{title}</span>
        {aside}
        {count !== undefined ? (
          <span className={cn("ml-auto tabular-nums", tone === "blocked" ? "text-destructive" : "text-foreground")}>
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

function pnlClass(v: unknown): string {
  const d = pnlDirection(v);
  return d === "up" ? "text-success" : d === "down" ? "text-destructive" : "";
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function useCommandCenter() {
  const [data, setData] = useState<TradingCommandCenter | null>(null);
  const [controls, setControls] = useState<ControlsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [cc, ctl] = await Promise.all([fetchCommandCenter(10), fetchControls().catch(() => null)]);
      setData(cc);
      if (ctl) setControls(ctl);
      setError(null);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const start = () => {
      timer = window.setInterval(() => void load(), POLL_COMMAND_MS);
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      stop();
      if (!document.hidden) {
        void load();
        start();
      }
    };
    void load();
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  return { data, controls, error, busy, reload: load, reloadControls: () => void fetchControls().then(setControls).catch(() => {}) };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TradingIntelligencePage() {
  const { data, controls, error, busy, reload, reloadControls } = useCommandCenter();
  const { setAfterTitle, setEnd } = usePageHeader();
  const [eventFilter, setEventFilter] = useState("all");
  const [activeControl, setActiveControl] = useState<TradingControl | null>(null);

  useLayoutEffect(() => {
    setAfterTitle(
      data ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={statusTone(data.status)} label={String(data.status)} />
          <LockPill locked={data.liveTradingLocked} />
        </div>
      ) : null,
    );
    setEnd(
      <div className="flex items-center gap-2">
        {data ? (
          <span
            className={cn(
              "text-[11px] tabular-nums",
              isStale(data.generatedAt, COMMAND_STALE_SECONDS) ? "font-bold text-warning" : "text-muted-foreground",
            )}
            title={data.generatedAt}
          >
            {isoTimeAgo(data.generatedAt)}
            {isStale(data.generatedAt, COMMAND_STALE_SECONDS) ? " · STALE" : ""}
          </span>
        ) : null}
        <Button
          type="button"
          ghost
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          disabled={busy}
          aria-label="Refresh trading command center"
          onClick={() => void reload()}
        >
          {busy ? <Spinner /> : <RefreshCw />}
        </Button>
      </div>,
    );
    return () => {
      setAfterTitle(null);
      setEnd(null);
    };
  }, [data, busy, reload, setAfterTitle, setEnd]);

  const split = useMemo(() => (data ? splitCapital(data.dailyMetrics) : null), [data]);

  if (error && !data) return <ErrorShell message={error} onRetry={() => void reload()} />;
  if (!data || !split) return <LoadingShell />;

  const m = data.dailyMetrics;
  const filter = EVENT_FILTERS.find((f) => f.id === eventFilter) ?? EVENT_FILTERS[0];
  const events = data.recentEvents.filter(filter.test);
  const khashiNote = khashiCashNote(split);

  return (
    <main
      className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-3 py-3 sm:px-4"
      data-review-id="hermes.trading-command-center"
    >
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        <span>
          Live trading is locked. This page inspects both systems and proxies approved project-owned controls; it cannot
          submit a live broker order.
        </span>
      </div>

      {error ? <PartialBanner detail={error} onDismiss={() => void reload()} /> : null}

      <CapitalBand split={split} metrics={m} khashiNote={khashiNote} />
      <KpiRibbon data={data} split={split} />

      <div className="grid min-h-0 gap-3 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="System lanes" count={data.lanes.length}>
            {data.lanes.length ? (
              <div className="max-h-[52vh] overflow-y-auto">
                {data.lanes.map((lane) => (
                  <LaneRow key={lane.id} lane={lane} />
                ))}
              </div>
            ) : (
              <EmptyNote>No lanes reported.</EmptyNote>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <DailyFigures series={data.dailySeries} metrics={m} split={split} />
          <ControlsPanel controls={controls} onPick={setActiveControl} />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <Panel
            title="Action queue"
            count={data.actionQueue.length}
            tone={data.actionQueue.length ? "blocked" : undefined}
          >
            {data.actionQueue.length ? (
              <div className="max-h-[38vh] overflow-y-auto">
                {data.actionQueue.map((item) => (
                  <div key={item.id} className="grid grid-cols-[3px_minmax(0,1fr)] gap-2 border-b border-border px-2.5 py-2 last:border-b-0">
                    <span className={cn("rounded-sm", TONE_RAIL[severityTone(item.severity)])} aria-hidden />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1">
                        <Pill tone={severityTone(item.severity)} label={item.severity} />
                        {item.sourceProject ? (
                          <Badge tone="outline" className="text-[9px]">
                            {sourceShort(item.sourceProject)}
                          </Badge>
                        ) : null}
                        <Badge tone="secondary" className="font-mono text-[9px]">
                          {item.type}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11.5px] font-semibold leading-snug">{item.title}</div>
                      <div className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">{item.recommendedAction}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyNote>Nothing is waiting on a human right now.</EmptyNote>
            )}
          </Panel>

          <Panel title="Recommendations" count={data.recommendations.length}>
            {data.recommendations.length ? (
              <ul className="m-0 max-h-52 list-none overflow-y-auto p-0">
                {data.recommendations.map((r, i) => (
                  <li key={`${i}-${r.slice(0, 20)}`} className="flex gap-2 border-b border-border px-2.5 py-1.5 text-[11.5px] leading-snug last:border-b-0">
                    <span className="w-[3px] shrink-0 self-stretch rounded-sm bg-foreground/40" aria-hidden />
                    <span className="min-w-0 break-words">{r}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote>No recommendations reported.</EmptyNote>
            )}
          </Panel>

          <FreshnessPanel rows={data.freshness} />
        </div>
      </div>

      <Panel
        title="Recent activity"
        count={`${events.length}/${data.recentEvents.length}`}
        aside={
          <span className="flex flex-wrap gap-1 normal-case tracking-normal">
            {EVENT_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={f.id === eventFilter}
                onClick={() => setEventFilter(f.id)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  f.id === eventFilter
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </span>
        }
      >
        {events.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-2.5 py-1.5 font-bold">When</th>
                  <th className="px-2.5 py-1.5 font-bold">Source</th>
                  <th className="px-2.5 py-1.5 font-bold">Severity</th>
                  <th className="px-2.5 py-1.5 font-bold">Event</th>
                  <th className="px-2.5 py-1.5 font-bold">Instrument</th>
                  <th className="px-2.5 py-1.5 font-bold">Summary</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyNote>
            {data.recentEvents.length ? "No events match this filter." : "No recent trading events found."}
          </EmptyNote>
        )}
      </Panel>

      {activeControl ? (
        <ControlDialog
          control={activeControl}
          onClose={() => setActiveControl(null)}
          onExecuted={() => {
            void reload();
            reloadControls();
          }}
        />
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Capital — the provenance-split band
// ---------------------------------------------------------------------------

function CapitalBand({
  split,
  metrics,
  khashiNote,
}: {
  split: ReturnType<typeof splitCapital>;
  metrics: TradingCommandCenter["dailyMetrics"];
  khashiNote: string | null;
}) {
  const money = split.buckets.filter((b) => b.capitalClass !== "not-configured");
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="flex flex-wrap items-center gap-2 border-b border-border bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
        <Wallet className="size-3.5" aria-hidden />
        <span>Capital today</span>
        <CoverageChip label="cash" coverage={split.coverage} rows={metrics.bySource} metricKey="cashLeftUsd" />
        <span className="ml-auto normal-case tracking-normal">
          {split.mixed ? (
            <Pill tone="watch" label="mixed provenance — not summed" />
          ) : (
            <Pill tone="ready" label="single provenance" />
          )}
        </span>
      </h2>

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {money.length ? (
          money.map((bucket) => <CapitalCard key={bucket.capitalClass} bucket={bucket} />)
        ) : (
          <div className="bg-card p-3 text-xs text-muted-foreground">No source is reporting cash today.</div>
        )}
      </div>

      {split.mixed || split.unclassified.length || khashiNote ? (
        <div className="space-y-1 border-t border-border px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
          {split.mixed ? (
            <p className="m-0">
              These figures are deliberately <strong className="text-foreground">not added together</strong>. Real broker
              cash, demo funds and a simulated bankroll are different kinds of money; one combined total would be true of
              nothing.
            </p>
          ) : null}
          {khashiNote ? <p className="m-0 text-warning">{khashiNote}</p> : null}
          {split.unclassified.length ? (
            <p className="m-0 text-warning">
              {split.unclassified.map((r) => r.sourceLabel ?? r.sourceProject).join(", ")} reported cash without stating
              its provenance, so it is not counted as real broker cash.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function CapitalCard({ bucket }: { bucket: CapitalBucket }) {
  const real = bucket.capitalClass === "real-broker";
  return (
    <div className={cn("bg-card p-3", !real && "bg-muted/40")}>
      <div className="flex items-center gap-1.5">
        <span className={cn("text-[10px] font-bold uppercase tracking-wide", real ? "text-foreground" : "text-muted-foreground")}>
          {bucket.label}
        </span>
        {!real ? <Pill tone="watch" label="not real cash" /> : null}
      </div>
      <div className={cn("mt-1 text-[24px] font-bold leading-none tabular-nums", !real && "text-muted-foreground")}>
        {formatUsd(bucket.cashUsd)}
      </div>
      <div className="mt-1.5 space-y-0.5 text-[10.5px] text-muted-foreground">
        <div>
          Risk-adjusted <span className="tabular-nums text-foreground">{formatUsd(bucket.riskAdjustedCashUsd)}</span>
        </div>
        <div>
          Buying power <span className="tabular-nums text-foreground">{formatUsd(bucket.buyingPowerUsd)}</span>
        </div>
        <div className="truncate" title={bucket.sources.map((s) => s.sourceLabel ?? s.sourceProject).join(", ")}>
          {bucket.sources.map((s) => s.sourceLabel ?? s.sourceProject).join(", ")}
        </div>
      </div>
      <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{bucket.note}</p>
    </div>
  );
}

function CoverageChip({
  label,
  coverage,
  rows,
  metricKey,
}: {
  label: string;
  coverage: Coverage;
  rows: DailySourceRow[];
  metricKey: keyof DailySourceRow;
}) {
  const missing = coverage === "partial" ? missingSources(rows, metricKey) : [];
  return (
    <span className="inline-flex items-center gap-1 normal-case tracking-normal">
      <Pill
        tone={coverageTone(coverage)}
        label={`${label} ${coverageLabel(coverage)}`}
        title={missing.length ? `Missing: ${missing.join(", ")}` : undefined}
      />
      {missing.length ? (
        <span className="text-[10px] text-warning">missing {missing.join(", ")}</span>
      ) : null}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

function KpiRibbon({ data, split }: { data: TradingCommandCenter; split: CapitalSplit }) {
  const m = data.dailyMetrics;
  // Every money metric goes through the provenance split, not just cash. The
  // raw dailyMetrics fields are cross-source sums: realizedPnlTodayUsd can be
  // entirely paper-bankroll profit while sitting next to real broker cash.
  const pnlToday = splitMetric(split, "realizedPnlTodayUsd");
  const netPnl = splitMetric(split, "netPnlUsd");
  const risk = splitMetric(split, "openRiskUsd");
  const equity = splitMetric(split, "totalEquityUsd");
  const real = (s: MetricSplit) => (s.real ? s.real.value : null);
  const cards: Array<{
    label: string;
    value: string;
    pnl?: unknown;
    tone?: Tone;
    note?: string;
    sim?: MetricContribution[];
  }> = [
    { label: "Realized P/L today", value: formatUsd(real(pnlToday)), pnl: real(pnlToday), note: coverageLabel(m.coverage.dailyPnl), sim: pnlToday.simulated },
    { label: "Net P/L", value: formatUsd(real(netPnl)), pnl: real(netPnl), sim: netPnl.simulated },
    { label: "Open risk", value: formatUsd(real(risk)), note: coverageLabel(m.coverage.risk), sim: risk.simulated },
    { label: "Total equity", value: formatUsd(real(equity)), note: coverageLabel(m.coverage.totalEquity), sim: equity.simulated },
    { label: "Open trades", value: formatCount(m.openTrades) },
    { label: "Closed trades", value: formatCount(m.closedTrades) },
    { label: "Events today", value: formatCount(m.eventsToday) },
    {
      label: "Human actions",
      value: formatCount(m.humanActionsRequired),
      tone: m.humanActionsRequired > 0 ? "blocked" : "ready",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4 xl:grid-cols-8">
      {cards.map((c) => (
        <div key={c.label} className={cn("bg-card px-3 py-2", c.tone === "blocked" && "bg-destructive/10")}>
          <div className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{c.label}</div>
          <div
            className={cn(
              "mt-0.5 font-bold tabular-nums",
              c.value === NO_DATA ? "text-[12px] text-muted-foreground" : "text-[19px]",
              c.pnl !== undefined ? pnlClass(c.pnl) : "",
              c.tone === "blocked" && "text-destructive",
            )}
          >
            {c.value}
          </div>
          {c.note ? <div className="mt-0.5 text-[10px] text-muted-foreground">{c.note}</div> : null}
          {(c.sim ?? []).map((s) => (
            <div
              key={s.label}
              className="mt-0.5 truncate text-[10px] text-muted-foreground"
              title={`${s.label} — simulated money, never added to the figure above`}
            >
              sim {s.label}: <span className="tabular-nums">{formatUsd(s.value)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lanes
// ---------------------------------------------------------------------------

function LaneRow({ lane }: { lane: Lane }) {
  const tone = statusTone(lane.available ? lane.status : "unavailable");
  const numeric = Object.entries(lane.kpis ?? {})
    .filter(([, v]) => isNum(v))
    .slice(0, 4) as Array<[string, number]>;
  return (
    <article className="grid grid-cols-[3px_minmax(0,1fr)] gap-2 border-b border-border px-2.5 py-2 last:border-b-0">
      <span className={cn("rounded-sm", TONE_RAIL[tone])} aria-hidden />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-bold">{lane.label}</span>
          <Pill tone={tone} label={lane.available ? lane.status : "unavailable"} />
          {lane.liveTradingLocked ? (
            <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
              <Lock className="size-2.5" aria-hidden />
              locked
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-muted-foreground">{lane.purpose}</p>

        {numeric.length ? (
          <div className="mt-1.5 grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border">
            {numeric.map(([k, v]) => (
              <div key={k} className="min-w-0 bg-card px-1.5 py-1" title={k}>
                <div className="truncate text-[9.5px] leading-tight text-muted-foreground">{k}</div>
                <div className={cn("text-[12px] font-bold leading-tight tabular-nums", /pnl/i.test(k) && !/risk/i.test(k) ? pnlClass(v) : "")}>
                  {/pnl|risk|usd/i.test(k) ? formatUsd(v) : formatCount(v)}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!lane.capitalKnown ? (
          <div className="mt-1.5 text-[10px] text-muted-foreground">Capital not reported by this lane.</div>
        ) : null}

        {lane.metricCoverage?.missing?.length ? (
          <div className="mt-1 text-[10px] text-warning">
            missing: {lane.metricCoverage.missing.slice(0, 4).join(", ")}
          </div>
        ) : null}

        {lane.blockers.length ? (
          <ul className="m-0 mt-1.5 list-none p-0">
            {lane.blockers.slice(0, 2).map((b, i) => (
              <li key={`${i}-${b.slice(0, 16)}`} className="flex gap-1.5 py-0.5 text-[10.5px] leading-snug">
                <span className="w-[2px] shrink-0 self-stretch rounded-sm bg-destructive" aria-hidden />
                <span className="min-w-0 break-words">{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Daily figures — tiles today, chart only once history exists
// ---------------------------------------------------------------------------

function DailyFigures({
  series,
  metrics,
  split,
}: {
  series: DailySeries;
  metrics: TradingCommandCenter["dailyMetrics"];
  split: CapitalSplit;
}) {
  const chartable = canChartHistory(series);
  const pnlToday = splitMetric(split, "realizedPnlTodayUsd");
  const risk = splitMetric(split, "openRiskUsd");
  return (
    <Panel
      title="Daily figures"
      aside={
        chartable ? null : (
          <span className="normal-case tracking-normal">
            <Pill tone="unknown" label="history collecting" title="Sources have not reported prior days yet" />
          </span>
        )
      }
      count={series.points.length}
    >
      {chartable ? (
        <div className="space-y-3 p-2.5">
          {series.recommendedCharts.map((chart) => (
            <DaySeriesChart key={chart.id} chart={chart} points={series.points} />
          ))}
        </div>
      ) : (
        <div className="p-2.5">
          <p className="m-0 mb-2 text-[11px] text-muted-foreground">
            Only the current UTC day has been reported, so there is no trend to draw yet. These are today&rsquo;s values.
          </p>
          <div className="grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-3">
            {/* Deliberately NOT dailyMetrics.riskAdjustedCashLeftUsd: that is
                cashLeftUsd (a cross-provenance sum) minus open risk, so it
                blends real and simulated money back together. Risk-adjusted
                cash is shown per provenance class on the capital cards. */}
            <DayTile
              label="Realized P/L today"
              value={formatUsd(pnlToday.real?.value ?? null)}
              pnl={pnlToday.real?.value ?? null}
              note={coverageLabel(metrics.coverage.dailyPnl)}
              sim={pnlToday.simulated}
            />
            <DayTile
              label="Open risk"
              value={formatUsd(risk.real?.value ?? null)}
              note={coverageLabel(metrics.coverage.risk)}
              sim={risk.simulated}
            />
            <DayTile label="Open / closed trades" value={`${formatCount(metrics.openTrades)} / ${formatCount(metrics.closedTrades)}`} />
          </div>
          <SourceTable rows={metrics.bySource} />
        </div>
      )}
    </Panel>
  );
}

function DayTile({
  label,
  value,
  note,
  pnl,
  sim,
}: {
  label: string;
  value: string;
  note?: string;
  pnl?: unknown;
  sim?: MetricContribution[];
}) {
  return (
    <div className="bg-card px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-bold tabular-nums",
          value === NO_DATA ? "text-[12px] text-muted-foreground" : "text-[18px]",
          pnl !== undefined ? pnlClass(pnl) : "",
        )}
      >
        {value}
      </div>
      {note ? <div className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{note}</div> : null}
      {(sim ?? []).map((s) => (
        <div
          key={s.label}
          className="mt-0.5 truncate text-[10px] leading-snug text-muted-foreground"
          title={`${s.label} — simulated money, never added to the figure above`}
        >
          sim {s.label}: <span className="tabular-nums">{formatUsd(s.value)}</span>
        </div>
      ))}
    </div>
  );
}

/** Source-by-source drilldown, with provenance stated on every cash figure. */
function SourceTable({ rows }: { rows: DailySourceRow[] }) {
  if (!rows.length) return <EmptyNote>No source rows reported.</EmptyNote>;
  return (
    <div className="mt-2.5 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[11px]">
        <caption className="sr-only">Daily metrics by source project</caption>
        <thead>
          <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <th className="px-2 py-1.5 font-bold">Source</th>
            <th className="px-2 py-1.5 font-bold">Capital</th>
            <th className="px-2 py-1.5 text-right font-bold">Cash</th>
            <th className="px-2 py-1.5 text-right font-bold">Open risk</th>
            <th className="px-2 py-1.5 text-right font-bold">P/L today</th>
            <th className="px-2 py-1.5 text-right font-bold">Open</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sourceProject} className="border-b border-border last:border-b-0">
              <td className="px-2 py-1.5">{r.sourceLabel ?? r.sourceProject}</td>
              <td className="px-2 py-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {r.capitalSource ?? (r.isRealBrokerCash === true ? "real broker" : "not stated")}
                </span>
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatUsd(r.cashLeftUsd)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatUsd(r.openRiskUsd)}</td>
              <td className={cn("px-2 py-1.5 text-right tabular-nums", pnlClass(r.realizedPnlTodayUsd))}>
                {formatUsd(r.realizedPnlTodayUsd)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatCount(r.openTrades)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Compact multi-series line. Recessive grid, thin marks, direct end labels,
 *  one shared y-axis — never two scales on one plot. */
function DaySeriesChart({
  chart,
  points,
}: {
  chart: { id: string; label: string; series: string[] };
  points: Array<Record<string, unknown> & { date: string }>;
}) {
  const W = 620;
  const H = 120;
  const PAD = { t: 10, r: 74, b: 18, l: 8 };
  const SERIES_COLOR = ["var(--color-primary)", "var(--color-warning)"];

  const values = chart.series.flatMap((key) => points.map((p) => p[key]).filter(isNum));
  if (!values.length) return <EmptyNote>No data for {chart.label.toLowerCase()}.</EmptyNote>;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const x = (i: number) => PAD.l + (i / Math.max(1, points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);

  return (
    <figure className="m-0">
      <figcaption className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {chart.label}
        <span className="flex gap-2 normal-case tracking-normal">
          {chart.series.map((key, i) => (
            <span key={key} className="inline-flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 rounded" style={{ background: SERIES_COLOR[i % SERIES_COLOR.length] }} aria-hidden />
              {key}
            </span>
          ))}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${chart.label} by day`}>
        <line x1={PAD.l} y1={y(0)} x2={W - PAD.r} y2={y(0)} className="stroke-border" strokeWidth="1" />
        {chart.series.map((key, si) => {
          const pts = points.map((p, i) => ({ i, v: p[key] })).filter((p) => isNum(p.v)) as Array<{ i: number; v: number }>;
          if (!pts.length) return null;
          const d = pts.map((p, idx) => `${idx ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
          const last = pts[pts.length - 1];
          return (
            <g key={key}>
              <path d={d} fill="none" stroke={SERIES_COLOR[si % SERIES_COLOR.length]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={x(last.i)} cy={y(last.v)} r="3.5" fill={SERIES_COLOR[si % SERIES_COLOR.length]} />
              <text x={x(last.i) + 7} y={y(last.v) + 3.5} className="fill-current text-[9px] text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatUsd(last.v)}
              </text>
            </g>
          );
        })}
        {points.map((p, i) => (
          <text key={p.date} x={x(i)} y={H - 4} textAnchor="middle" className="fill-current text-[8px] text-muted-foreground">
            {p.date.slice(5)}
          </text>
        ))}
      </svg>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Freshness, events, controls
// ---------------------------------------------------------------------------

function FreshnessPanel({ rows }: { rows: TradingCommandCenter["freshness"] }) {
  return (
    <Panel title="Source freshness" count={rows.length}>
      {rows.length ? (
        <div>
          {rows.map((r) => (
            <div key={r.sourceProject} className="flex items-center gap-2 border-b border-border px-2.5 py-1.5 last:border-b-0">
              <span className={cn("w-[3px] self-stretch rounded-sm", TONE_RAIL[statusTone(r.available ? r.status : "unavailable")])} aria-hidden />
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold">{r.sourceProject}</div>
                <div className="text-[10px] tabular-nums text-muted-foreground">
                  {r.available ? `${r.latencyMs ?? "?"}ms` : "unreachable"}
                  {r.generatedAt ? ` · ${isoTimeAgo(r.generatedAt)}` : " · no timestamp"}
                </div>
              </div>
              <span className="ml-auto shrink-0">
                <Pill tone={statusTone(r.available ? r.status : "unavailable")} label={r.available ? r.status : "down"} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyNote>No freshness rows reported.</EmptyNote>
      )}
    </Panel>
  );
}

function EventRow({ event }: { event: TradingEvent }) {
  const sev = eventSeverity(event);
  const tone = severityTone(sev);
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/50">
      <td className="whitespace-nowrap px-2.5 py-1.5 tabular-nums text-muted-foreground">{isoTimeAgo(event.occurredAt)}</td>
      <td className="px-2.5 py-1.5">
        <Badge tone="outline" className="text-[9px]">
          {sourceShort(event.sourceProject)}
        </Badge>
      </td>
      <td className="px-2.5 py-1.5">
        <Pill tone={tone} label={sev} />
      </td>
      <td className="px-2.5 py-1.5">
        <div className="font-semibold">{event.title}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{event.type}</div>
      </td>
      <td className="whitespace-nowrap px-2.5 py-1.5 font-mono text-[10.5px]">{event.instrument ?? "—"}</td>
      <td className="px-2.5 py-1.5 text-muted-foreground">{event.summary}</td>
    </tr>
  );
}

function ControlsPanel({
  controls,
  onPick,
}: {
  controls: ControlsResponse | null;
  onPick: (c: TradingControl) => void;
}) {
  if (!controls) {
    return (
      <Panel title="Controls">
        <EmptyNote>Controls are unavailable right now.</EmptyNote>
      </Panel>
    );
  }
  const list = controls.controls ?? [];
  return (
    <Panel
      title="Controls"
      count={list.length}
      aside={
        <span className="normal-case tracking-normal">
          <Pill tone="unknown" label="preview first" />
        </span>
      }
    >
      {list.length ? (
        <div className="p-2.5">
          {controls.projects.some((p) => !p.available) ? (
            <p className="m-0 mb-2 text-[10.5px] text-warning">
              {controls.projects.filter((p) => !p.available).map((p) => `${p.label} controls unavailable`).join(" · ")}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {list.map((c) => (
              <button
                key={c.namespacedId}
                type="button"
                onClick={() => onPick(c)}
                title={`${c.namespacedId} — ${c.intent ?? ""}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-semibold hover:bg-muted",
                  controlIsDangerous(c) ? "border-destructive/40" : "border-border",
                )}
              >
                <span className={cn("size-1.5 rounded-full", controlIsDangerous(c) ? TONE_RAIL.blocked : TONE_RAIL.ready)} aria-hidden />
                <span className="text-[9px] font-bold text-muted-foreground">{sourceShort(c.projectId)}</span>
                {c.label}
              </button>
            ))}
          </div>
          <p className="m-0 mt-2 text-[10px] text-muted-foreground">{controls.safety.note}</p>
        </div>
      ) : (
        <EmptyNote>No controls are available from these projects right now.</EmptyNote>
      )}
    </Panel>
  );
}

function ControlDialog({
  control,
  onClose,
  onExecuted,
}: {
  control: TradingControl;
  onClose: () => void;
  onExecuted: () => void;
}) {
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<ControlResponse | null>(null);
  const [executed, setExecuted] = useState<ControlResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const dangerous = controlIsDangerous(control);
  const tooShort = dangerous && reason.trim().length < MIN_CONTROL_REASON;

  const send = async (execute: boolean) => {
    setPending(true);
    setFailure(null);
    try {
      const res = await requestControl({ action: control.namespacedId, execute, reason });
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

  const ok = executed ? controlSucceeded(executed) : false;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{control.projectLabel}</span>
            <Pill tone={dangerous ? "blocked" : "ready"} label={dangerous ? "dangerous" : "routine"} />
            {control.requiresServiceRestart ? <Pill tone="watch" label="service restart" /> : null}
            <LockPill locked />
          </div>
          <DialogTitle className="mt-1.5 text-base">{control.label}</DialogTitle>
          <DialogDescription className="font-mono text-[11px]">{control.namespacedId}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          {control.intent ? <p className="m-0 text-muted-foreground">{control.intent}</p> : null}
          <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">Execution</dt>
            <dd className="m-0">{control.execution ?? "—"}</dd>
            <dt className="text-muted-foreground">Broker mutation</dt>
            <dd className="m-0">{control.brokerMutation ? "possible" : "no"}</dd>
            {control.effect ? (
              <>
                <dt className="text-muted-foreground">Effect</dt>
                <dd className="m-0 break-words">{control.effect}</dd>
              </>
            ) : null}
            {control.runbookCommand ? (
              <>
                <dt className="text-muted-foreground">Runbook</dt>
                <dd className="m-0 font-mono">{control.runbookCommand}</dd>
              </>
            ) : null}
          </dl>

          <div>
            <label htmlFor="tcc-reason" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Reason
            </label>
            <textarea
              id="tcc-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why now? Recorded with the request."
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
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Preview · execute:false</div>
              <pre className="m-0 max-h-44 overflow-auto rounded border border-border bg-muted p-2 font-mono text-[10.5px] text-muted-foreground">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
          ) : null}

          {executed ? (
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Execute response</span>
                <Pill tone={ok ? "ready" : "blocked"} label={ok ? "proxied + source confirmed" : "not confirmed"} />
              </div>
              <pre className="m-0 max-h-44 overflow-auto rounded border border-border bg-muted p-2 font-mono text-[10.5px] text-muted-foreground">
                {JSON.stringify(executed, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        <DialogFooter className="items-center">
          <span className="mr-auto text-[11px] text-muted-foreground">
            {executed ? "Command center refreshed." : preview ? "Preview returned. Confirm to execute." : "Step 1 of 2 — preview first."}
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
              destructive={dangerous}
              disabled={pending || tooShort}
              title={tooShort ? `A reason of at least ${MIN_CONTROL_REASON} characters is required` : undefined}
              onClick={() => void send(true)}
            >
              {pending ? <Spinner /> : null}
              Execute
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Shells
// ---------------------------------------------------------------------------

function PartialBanner({ detail, onDismiss }: { detail: string; onDismiss: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-warning/45 bg-warning/10 px-3 py-1.5 text-xs text-warning">
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      <span className="font-semibold">Refresh failed — showing the last good payload.</span>
      <span className="font-mono text-[10.5px] opacity-80">{detail}</span>
      <Button type="button" size="sm" outlined className="ml-auto" onClick={onDismiss}>
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
      data-review-id="hermes.trading-command-center"
      aria-busy="true"
    >
      <span className="sr-only">Loading trading command center…</span>
      <Skeleton className="h-8" />
      <Skeleton className="h-32" />
      <Skeleton className="h-14" />
      <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <Skeleton className="h-[26rem]" />
        <Skeleton className="h-[26rem]" />
        <Skeleton className="h-[26rem]" />
      </div>
    </main>
  );
}

function ErrorShell({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main
      className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-3 py-8 sm:px-4"
      data-review-id="hermes.trading-command-center"
    >
      <section className="mx-auto w-full max-w-lg rounded-lg border border-border bg-card p-7 text-center">
        <div className="mb-2 flex justify-center">
          <Pill tone="blocked" label="command center unavailable" />
        </div>
        <h2 className="m-0 text-base font-semibold">Trading command center is unavailable.</h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          No cash, P/L or risk figure on this page can be trusted until it loads.
        </p>
        <p className="mt-3 break-words font-mono text-[11px] text-destructive">{message}</p>
        <Button type="button" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </section>
    </main>
  );
}
