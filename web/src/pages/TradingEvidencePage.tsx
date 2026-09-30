import { Database, FileCheck2, GitBranch, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ActionResultHistory } from "@/components/ActionResultHistory";
import {
  fetchTradingEvidenceSnapshot,
  runOutcomeLearningReview,
  runTradingEvidenceReview,
  tradingResearchTone,
  type TradingEvidenceSnapshot,
  type TradingResearchSeries,
} from "@/lib/trading-research";
import type { WarehouseWindow } from "@/lib/system-warehouse";

type Tone = "success" | "info" | "warning" | "critical" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  critical: "border-red-500/35 bg-red-500/10 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

export default function TradingEvidencePage() {
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<TradingEvidenceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<string | null>(null);

  const load = async (nextWindow = window) => {
    try {
      setSnapshot(await fetchTradingEvidenceSnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  const review = async () => {
    setActionStatus("Evidence review running");
    try {
      await runTradingEvidenceReview();
      setActionStatus("Evidence review recorded");
      await load(window);
    } catch (exc) {
      setActionStatus(`Evidence review failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  const reviewOutcome = async () => {
    setOutcomeStatus("Outcome review running");
    try {
      await runOutcomeLearningReview();
      setOutcomeStatus("Outcome review recorded");
      await load(window);
    } catch (exc) {
      setOutcomeStatus(`Outcome review failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8" data-review-id="hermes.trading.evidence">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Database className="h-4 w-4" aria-hidden />
              Trading proof ledger
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Trading Evidence</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Browse source events, strategy candidates, backtest readiness, and runtime proof records across Khashi VC, Investing System, and Head Trader.
            </p>
          </div>
          {snapshot ? (
            <div className="grid min-w-[220px] gap-2 text-xs font-semibold text-muted-foreground sm:grid-cols-2">
              <MiniStat label="Records" value={snapshot.ledger.summary.records} />
              <MiniStat label="Missing hashes" value={snapshot.ledger.summary.missingProofHashes} />
              <MiniStat label="Backbone" value={`${snapshot.ledger.summary.sourceBackboneReady ?? 0}/${snapshot.ledger.summary.sourceBackboneCategories ?? 0}`} />
            </div>
          ) : null}
        </div>
      </section>

      <ActionResultHistory route="/trading/evidence" compact />

      {!snapshot && !error ? <LoadingPanel /> : null}
      {!snapshot && error ? <ErrorPanel error={error} retry={() => void load(window)} /> : null}
      {snapshot ? (
        <EvidenceContent
          snapshot={snapshot}
          window={window}
          setWindow={setWindow}
          error={error}
          review={review}
          reviewOutcome={reviewOutcome}
          actionStatus={actionStatus}
          outcomeStatus={outcomeStatus}
        />
      ) : null}
    </main>
  );
}

function EvidenceContent({
  snapshot,
  window,
  setWindow,
  error,
  review,
  reviewOutcome,
  actionStatus,
  outcomeStatus,
}: {
  snapshot: TradingEvidenceSnapshot;
  window: WarehouseWindow;
  setWindow: (window: WarehouseWindow) => void;
  error: string | null;
  review: () => void;
  reviewOutcome: () => void;
  actionStatus: string | null;
  outcomeStatus: string | null;
}) {
  const { ledger, series, outcome } = snapshot;
  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"}>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Records" value={ledger.summary.records} detail="ledger rows" tone="info" icon={Database} />
        <MetricCard label="Source events" value={ledger.summary.sourceEvents} detail="project-owned events" tone="info" icon={GitBranch} />
        <MetricCard label="Strategies" value={ledger.summary.strategies} detail="candidate proof rows" tone="success" icon={ShieldCheck} />
        <MetricCard label="Backtests" value={ledger.summary.backtests} detail="readiness proof rows" tone="warning" icon={FileCheck2} />
        <MetricCard
          label="Backbone"
          value={`${ledger.summary.sourceBackboneReady ?? 0}/${ledger.summary.sourceBackboneCategories ?? 0}`}
          detail={ledger.summary.sourceNativeEnough ? "local proof sufficient" : "needs proof rows"}
          tone={ledger.summary.sourceNativeEnough ? "success" : "warning"}
          icon={FileCheck2}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
        <Panel title="Evidence trend">
          <div className="grid gap-3 p-3">
            <WindowButtons value={window} onChange={setWindow} />
            <TrendChart series={series} primaryKey="records" secondaryKey="missingProofHashes" />
          </div>
        </Panel>
        <Panel title="Evidence controls">
          <div className="grid gap-3 p-3">
            {error ? <PolicyCallout title="Showing last evidence snapshot" detail={error} tone="warning" /> : null}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{new Date(ledger.generatedAt).toLocaleString()}</div>
              </div>
              <ToneBadge tone={tradingResearchTone(ledger.health)}>{ledger.health}</ToneBadge>
            </div>
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={review}>
              Record evidence review
            </button>
            {actionStatus ? <p className="text-xs font-medium text-muted-foreground">{actionStatus}</p> : null}
          </div>
        </Panel>
      </section>

      {ledger.sourceBackbone ? (
        <Panel title="Source backbone" count={ledger.sourceBackbone.items.length}>
          <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)]">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <MiniStat label="Ready" value={`${ledger.sourceBackbone.summary.ready}/${ledger.sourceBackbone.summary.categories}`} />
              <MiniStat label="Posture" value={ledger.sourceBackbone.summary.posture} />
              <MiniStat label="Missing" value={ledger.sourceBackbone.summary.missing} />
              <MiniStat label="Enough" value={ledger.sourceBackbone.summary.sourceNativeEnough ? "yes" : "no"} />
            </div>
            <div className="grid gap-2">
              {ledger.sourceBackbone.items.map((item) => (
                <PolicyCallout
                  key={item.id}
                  title={`${item.label}: ${item.status}`}
                  detail={item.sourceNativeEnough ? item.evidence.slice(0, 2).join(" | ") || "Local proof rows are present." : item.missing.join("; ") || item.nextAction}
                  tone={tradingResearchTone(item.status)}
                />
              ))}
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel title="Outcome learning" count={outcome.signals.length + outcome.researchTasks.length}>
        <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)]">
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <MiniStat label="Reliability" value={`${outcome.summary.reliabilityScore}%`} />
              <MiniStat label="Calibration" value={outcome.summary.calibration} />
              <MiniStat label="Passed tests" value={`${outcome.summary.passedBacktests}/${outcome.summary.backtestRuns}`} />
              <MiniStat label="Missing hashes" value={outcome.summary.missingProofHashes} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome health</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{new Date(outcome.generatedAt).toLocaleString()}</div>
              </div>
              <ToneBadge tone={tradingResearchTone(outcome.health)}>{outcome.health}</ToneBadge>
            </div>
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={reviewOutcome}>
              Record outcome review
            </button>
            {outcomeStatus ? <p className="text-xs font-medium text-muted-foreground">{outcomeStatus}</p> : null}
          </div>
          <div className="grid gap-2">
            {outcome.signals.length ? outcome.signals.map((signal) => (
              <PolicyCallout key={signal.id} title={signal.status} detail={signal.detail} tone={tradingResearchTone(signal.status)} />
            )) : <PolicyCallout title="No outcome signals" detail="Outcome learning has not reported calibration signals yet." tone="warning" />}
            {outcome.researchTasks.map((task) => (
              <PolicyCallout key={task.id} title={`${task.priority}: ${task.title}`} detail={task.nextAction} tone={tradingResearchTone(task.status)} />
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Ledger records" count={ledger.records.length}>
        <div className="overflow-x-auto p-3">
          <table className="w-full min-w-[1040px] text-left text-xs" data-hdk-component="DataTable" data-pagination="table-window">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Kind</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Proof</th>
                <th className="py-2 pr-3">Closeout</th>
                <th className="py-2 pr-3">Occurred</th>
              </tr>
            </thead>
            <tbody>
              {ledger.records.map((record) => (
                <tr key={`${record.kind}-${record.id}`} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3">
                    <div className="font-semibold text-foreground">{record.subject}</div>
                    <div className="line-clamp-2 text-muted-foreground">{record.detail}</div>
                  </td>
                  <td className="py-2 pr-3">{record.kind}</td>
                  <td className="py-2 pr-3">{record.sourceProject}</td>
                  <td className="py-2 pr-3"><ToneBadge tone={tradingResearchTone(record.status)}>{record.status}</ToneBadge></td>
                  <td className="py-2 pr-3">
                    <div>{record.proofHash || "missing"}</div>
                    <div className="max-w-[260px] truncate text-muted-foreground">{record.artifact || "no artifact"}</div>
                    <div className="line-clamp-1 max-w-[260px] text-muted-foreground">{record.artifactPreview || "no preview"}</div>
                  </td>
                  <td className="py-2 pr-3">{record.decisionCloseout}</td>
                  <td className="py-2 pr-3">{new Date(record.occurredAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Blockers and recommendations" count={ledger.blockers.length + ledger.recommendations.length}>
        <div className="grid gap-2 p-3">
          {ledger.blockers.length ? ledger.blockers.map((blocker) => (
            <PolicyCallout key={blocker} title="Evidence blocker" detail={blocker} tone="warning" />
          )) : <PolicyCallout title="Evidence hashes clear" detail="No missing proof hashes were reported in the current ledger snapshot." tone="success" />}
          {ledger.recommendations.map((recommendation) => (
            <PolicyCallout key={recommendation} title="Recommendation" detail={recommendation} tone="info" />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function WindowButtons({ value, onChange }: { value: WarehouseWindow; onChange: (window: WarehouseWindow) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" data-hdk-component="TimeWindowSelector">
      {(["1h", "24h", "7d", "30d"] as WarehouseWindow[]).map((item) => (
        <button key={item} type="button" className={`rounded border px-2.5 py-1 text-xs font-semibold ${value === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"}`} onClick={() => onChange(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}

function TrendChart({ series, primaryKey, secondaryKey }: { series: TradingResearchSeries; primaryKey: string; secondaryKey: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3" data-hdk-component="LineChart" data-chart-type="line" data-x-axis="timestamp" data-y-axis={primaryKey}>
      <svg viewBox="0 0 720 220" className="h-56 w-full" role="img" aria-label={`${primaryKey} trend`}>
        <line x1="42" x2="700" y1="188" y2="188" className="stroke-border" />
        <line x1="42" x2="42" y1="18" y2="188" className="stroke-border" />
        <path d={buildLine(series.points, primaryKey)} fill="none" className="stroke-emerald-500" strokeWidth="3" />
        <path d={buildLine(series.points, secondaryKey)} fill="none" className="stroke-sky-500" strokeWidth="3" />
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{series.historyStatus.replaceAll("_", " ")}</span>
      </div>
    </div>
  );
}

function buildLine(points: Array<Record<string, number | string>>, key: string) {
  const values = points.map((point) => Number(point[key] ?? 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  return points.map((point, index) => {
    const x = 42 + (points.length === 1 ? 0 : (index / (points.length - 1)) * 658);
    const ratio = (Number(point[key] ?? 0) - min) / Math.max(1, max - min);
    const y = 188 - ratio * 170;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function LoadingPanel() {
  return <Panel title="Evidence ledger"><div className="grid min-h-[260px] place-items-center p-4 text-sm text-muted-foreground">Loading trading evidence</div></Panel>;
}

function ErrorPanel({ error, retry }: { error: string; retry: () => void }) {
  return (
    <Panel title="Evidence ledger unavailable">
      <div className="grid gap-3 p-3">
        <PolicyCallout title="Evidence ledger unavailable" detail={error} tone="critical" />
        <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground" onClick={retry}>Retry</button>
      </div>
    </Panel>
  );
}

function Panel({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {count !== undefined ? <span className="tabular-nums text-xs font-semibold text-foreground">{count}</span> : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, detail, tone, icon: Icon }: { label: string; value: string | number; detail: string; tone: Tone; icon: typeof Database }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`rounded border p-1.5 ${toneClasses[tone]}`}><Icon className="h-4 w-4" aria-hidden /></span>
      </div>
      <div className="mt-3 tabular-nums text-3xl font-semibold text-foreground">{value}</div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </article>
  );
}

function PolicyCallout({ title, detail, tone }: { title: string; detail: string; tone: Tone }) {
  return <article className={`rounded-lg border p-3 ${toneClasses[tone]}`}><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-sm leading-6">{detail}</p></article>;
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-border bg-background px-3 py-2"><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 tabular-nums text-lg font-semibold text-foreground">{value}</div></div>;
}

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>{children}</span>;
}
