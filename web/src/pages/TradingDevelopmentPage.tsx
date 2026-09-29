import {
  BarChart3,
  Brain,
  CandlestickChart,
  CircleDollarSign,
  GitBranch,
  LineChart,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  auditOperationalContract,
  contractForRoute,
  type OperationalPageAudit,
} from "@/lib/operational-page-contracts";
import {
  fetchBacktestingSnapshot,
  fetchStrategySnapshot,
  runBacktestReview,
  runStrategyReview,
  tradingResearchTone,
  type BacktestingSnapshot,
  type TradingResearchSeries,
  type StrategySnapshot,
} from "@/lib/trading-research";
import type { WarehouseWindow } from "@/lib/system-warehouse";
import {
  operatingSystemStages,
  type OperatingSystemStage,
} from "./operating-system-data";

type TradingDevelopmentMode = "research" | "backtesting";
type Tone = "success" | "info" | "warning" | "critical" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  critical: "border-red-500/35 bg-red-500/10 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

const modeCopy: Record<TradingDevelopmentMode, { eyebrow: string; title: string; description: string }> = {
  research: {
    eyebrow: "Strategy development",
    title: "Research development",
    description:
      "Turn Khashi and Investing System output into strategy candidates, evidence, learning records, and cost-aware research decisions.",
  },
  backtesting: {
    eyebrow: "Backtesting and evals",
    title: "Backtesting",
    description:
      "Track the proof chain needed before a strategy or model/provider workflow graduates from idea to backtest to shadow/paper readiness.",
  },
};

export function TradingResearchDevelopmentPage() {
  return <TradingDevelopmentPage mode="research" />;
}

export function TradingBacktestingPage() {
  return <TradingDevelopmentPage mode="backtesting" />;
}

function TradingDevelopmentPage({ mode }: { mode: TradingDevelopmentMode }) {
  const copy = modeCopy[mode];
  const stages = stagesForMode(mode);
  const gated = stages.filter((stage) => stage.status === "gated" || stage.risk === "high").length;
  const route = mode === "research" ? "/trading/strategies" : "/trading/backtesting";
  const contract = contractForRoute(route);
  const audit = contract ? auditOperationalContract(contract) : null;

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8" data-review-id={`hermes.trading-development.${mode}`}>
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {mode === "research" ? <Brain className="h-4 w-4" aria-hidden /> : <BarChart3 className="h-4 w-4" aria-hidden />}
              {copy.eyebrow}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </div>
          <div className="grid min-w-[220px] gap-2 text-xs font-semibold text-muted-foreground sm:grid-cols-2">
            <MiniStat label="Tracked stages" value={stages.length} />
            <MiniStat label={audit ? "Page maturity" : "Gated"} value={audit ? `${audit.score}%` : gated} />
          </div>
        </div>
      </section>

      {audit ? <PageContractStrip audit={audit} /> : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label={`${copy.title} summary`}>
        {summaryCards(mode, stages).map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
        <Panel title={mode === "research" ? "Research proof chain" : "Evaluation proof chain"} count={stages.length}>
          <div className="grid gap-2 p-3">
            {stages.map((stage) => (
              <StageRow key={stage.version} stage={stage} />
            ))}
          </div>
        </Panel>
        {mode === "research" ? <ResearchDecisionPanel /> : <BacktestDecisionPanel />}
      </section>
    </main>
  );
}

function stagesForMode(mode: TradingDevelopmentMode) {
  const routes = mode === "research"
    ? ["/finance-attribution", "/learning-engine", "/cost-attribution-engine", "/learning-ingestion", "/outcome-learning-feeds", "/project-outcome-emitter"]
    : ["/agent-eval-lab", "/evaluation-gates", "/model-eval-harness", "/golden-eval-execution", "/provider-eval-runner", "/provider-eval-execution"];
  const wanted = new Set(routes);
  return operatingSystemStages.filter((stage) => wanted.has(stage.route));
}

function summaryCards(mode: TradingDevelopmentMode, stages: OperatingSystemStage[]) {
  if (mode === "research") {
    return [
      { label: "Evidence feeds", value: stages.length, detail: "learning, cost, finance, outcomes", tone: "info" as Tone, icon: Brain },
      { label: "Auto policy", value: "gated", detail: "recommend, do not auto-change", tone: "critical" as Tone, icon: ShieldCheck },
      { label: "Cost context", value: "modeled", detail: "strategy work needs attribution", tone: "warning" as Tone, icon: CircleDollarSign },
      { label: "Strategy state", value: "candidate", detail: "needs backtest proof", tone: "success" as Tone, icon: CandlestickChart },
    ];
  }
  return [
    { label: "Golden tasks", value: 10, detail: "representative eval runs", tone: "info" as Tone, icon: BarChart3 },
    { label: "Provider runs", value: "capped", detail: "budget breaker before paid runs", tone: "critical" as Tone, icon: ShieldCheck },
    { label: "Verdicts", value: "scored", detail: "quality, cost, latency", tone: "success" as Tone, icon: LineChart },
    { label: "Promotion", value: "manual", detail: "operator decides graduation", tone: "warning" as Tone, icon: GitBranch },
  ];
}

function ResearchDecisionPanel() {
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<StrategySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const load = async (nextWindow = window) => {
    try {
      setSnapshot(await fetchStrategySnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  if (!snapshot && !error) return <LoadingPanel title="Strategy research telemetry" />;
  if (!snapshot && error) return <ErrorPanel title="Strategy research unavailable" error={error} retry={() => void load(window)} />;
  if (!snapshot) return null;

  const { summary, series } = snapshot;
  const review = async () => {
    setActionStatus("Strategy review running");
    try {
      await runStrategyReview();
      setActionStatus("Strategy review recorded");
      await load(window);
    } catch (exc) {
      setActionStatus(`Strategy review failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"} data-review-id="hermes.trading.strategies.telemetry">
      <Panel title="Strategy live status">
        <div className="grid gap-3 p-3">
          {error ? <PolicyCallout title="Showing last strategy snapshot" detail={error} tone="warning" /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{new Date(summary.generatedAt).toLocaleString()}</div>
            </div>
            <ToneBadge tone={tradingResearchTone(summary.health)}>{summary.health}</ToneBadge>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <MetricCard label="Candidates" value={summary.summary.candidates} detail={`${summary.summary.sourceProjects} source projects`} tone="info" icon={Brain} />
            <MetricCard label="Ready" value={summary.summary.ready} detail="operator-review candidates" tone="success" icon={ShieldCheck} />
            <MetricCard label="Watch" value={summary.summary.watch} detail="needs proof or criteria" tone={summary.summary.watch ? "warning" : "success"} icon={LineChart} />
            <MetricCard label="Blocked" value={summary.summary.blocked} detail="source or evidence blockers" tone={summary.summary.blocked ? "critical" : "success"} icon={GitBranch} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void review()}>
              Record strategy review
            </button>
            {actionStatus ? <span className="self-center text-xs font-medium text-muted-foreground">{actionStatus}</span> : null}
          </div>
        </div>
      </Panel>
      <Panel title="Candidate trend">
        <div className="grid gap-3 p-3">
          <WindowButtons value={window} onChange={setWindow} />
          <TrendChart series={series} primaryKey="candidates" secondaryKey="ready" />
        </div>
      </Panel>
      <Panel title="Strategy candidates" count={summary.candidates.length}>
        <div className="grid gap-2 p-3">
          {summary.candidates.map((candidate) => (
            <article key={candidate.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">{candidate.hypothesis}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{candidate.sourceProject} / {candidate.promotionGate}</p>
                </div>
                <ToneBadge tone={tradingResearchTone(candidate.status)}>{candidate.status}</ToneBadge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{candidate.falsificationCriteria}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniFact label="Evidence" value={candidate.evidenceCount} />
                <MiniFact label="Win rate" value={candidate.winRate === null ? "unknown" : `${Math.round(candidate.winRate * 100)}%`} />
                <MiniFact label="Expected edge" value={candidate.expectedEdge} />
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <SourceAndBlockerPanels coverage={summary.sourceCoverage} blockers={summary.blockers} recommendations={summary.recommendations} />
    </div>
  );
}

function BacktestDecisionPanel() {
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<BacktestingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const load = async (nextWindow = window) => {
    try {
      setSnapshot(await fetchBacktestingSnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  if (!snapshot && !error) return <LoadingPanel title="Backtesting telemetry" />;
  if (!snapshot && error) return <ErrorPanel title="Backtesting unavailable" error={error} retry={() => void load(window)} />;
  if (!snapshot) return null;

  const { summary, series } = snapshot;
  const review = async () => {
    setActionStatus("Backtest review running");
    try {
      await runBacktestReview();
      setActionStatus("Backtest review recorded");
      await load(window);
    } catch (exc) {
      setActionStatus(`Backtest review failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"} data-review-id="hermes.trading.backtesting.telemetry">
      <Panel title="Backtesting live status">
        <div className="grid gap-3 p-3">
          {error ? <PolicyCallout title="Showing last backtesting snapshot" detail={error} tone="warning" /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{new Date(summary.generatedAt).toLocaleString()}</div>
            </div>
            <ToneBadge tone={tradingResearchTone(summary.health)}>{summary.health}</ToneBadge>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <MetricCard label="Runs" value={summary.summary.runs} detail={summary.comparison.coverage.replaceAll("_", " ")} tone="info" icon={BarChart3} />
            <MetricCard label="Passed" value={summary.summary.passed} detail="promotion review ready" tone="success" icon={ShieldCheck} />
            <MetricCard label="Review" value={summary.summary.review} detail="needs operator review" tone={summary.summary.review ? "warning" : "success"} icon={LineChart} />
            <MetricCard label="Blocked" value={summary.summary.blocked} detail="missing dataset/proof" tone={summary.summary.blocked ? "critical" : "success"} icon={GitBranch} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void review()}>
              Record backtest review
            </button>
            {actionStatus ? <span className="self-center text-xs font-medium text-muted-foreground">{actionStatus}</span> : null}
          </div>
        </div>
      </Panel>
      <Panel title="Backtest trend">
        <div className="grid gap-3 p-3">
          <WindowButtons value={window} onChange={setWindow} />
          <TrendChart series={series} primaryKey="runs" secondaryKey="passed" />
        </div>
      </Panel>
      <Panel title="Backtest runs" count={summary.runs.length}>
        <div className="overflow-x-auto p-3">
          <table className="w-full min-w-[760px] text-left text-xs" data-hdk-component="DataTable" data-pagination="table-window">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Strategy</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Dataset</th>
                <th className="py-2 pr-3">Trades</th>
                <th className="py-2 pr-3">Gate</th>
              </tr>
            </thead>
            <tbody>
              {summary.runs.map((run) => (
                <tr key={run.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3">
                    <div className="font-semibold text-foreground">{run.strategyId}</div>
                    <div className="text-muted-foreground">{run.sourceProject}</div>
                  </td>
                  <td className="py-2 pr-3"><ToneBadge tone={tradingResearchTone(run.status)}>{run.status}</ToneBadge></td>
                  <td className="py-2 pr-3">{run.datasetWindow}</td>
                  <td className="py-2 pr-3 tabular-nums">{run.trades}</td>
                  <td className="py-2 pr-3">{run.promotionGate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Blockers and recommendations" count={summary.blockers.length + summary.recommendations.length}>
        <div className="grid gap-2 p-3">
          {summary.blockers.length ? summary.blockers.map((blocker) => (
            <PolicyCallout key={blocker} title="Backtest blocker" detail={blocker} tone="critical" />
          )) : <PolicyCallout title="No source blockers" detail="No trading source blockers were reported for this snapshot." tone="success" />}
          {summary.recommendations.map((recommendation) => (
            <PolicyCallout key={recommendation} title="Recommendation" detail={recommendation} tone="info" />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PageContractStrip({ audit }: { audit: OperationalPageAudit }) {
  return (
    <section className="rounded-lg border border-border bg-card p-3 shadow-sm" data-review-id={`hermes.page-contract.${audit.route}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge tone={audit.status === "ready" ? "success" : audit.status === "blocked" ? "critical" : "warning"}>{audit.status}</ToneBadge>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{audit.maturity} surface</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Next maturity action: <span className="font-medium text-foreground">{audit.nextAction}</span>
          </p>
        </div>
        <div className="grid min-w-[220px] gap-2 sm:grid-cols-2">
          <MiniStat label="Contract score" value={`${audit.score}%`} />
          <MiniStat label="Missing" value={audit.missing.length} />
        </div>
      </div>
    </section>
  );
}

function SourceAndBlockerPanels({
  coverage,
  blockers,
  recommendations,
}: {
  coverage: StrategySnapshot["summary"]["sourceCoverage"];
  blockers: string[];
  recommendations: string[];
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Panel title="Source coverage" count={coverage.length}>
        <div className="grid gap-2 p-3">
          {coverage.map((source) => (
            <article key={source.projectId} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{source.label}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{source.projectId}</p>
                </div>
                <ToneBadge tone={source.available ? tradingResearchTone(source.status) : "critical"}>{source.available ? source.status : "unavailable"}</ToneBadge>
              </div>
              <MiniFact label="Blockers" value={source.blockers.length} />
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Blockers and recommendations" count={blockers.length + recommendations.length}>
        <div className="grid gap-2 p-3">
          {blockers.length ? blockers.map((blocker) => (
            <PolicyCallout key={blocker} title="Strategy blocker" detail={blocker} tone="critical" />
          )) : <PolicyCallout title="No source blockers" detail="No trading source blockers were reported for this snapshot." tone="success" />}
          {recommendations.map((recommendation) => (
            <PolicyCallout key={recommendation} title="Recommendation" detail={recommendation} tone="info" />
          ))}
        </div>
      </Panel>
    </section>
  );
}

function WindowButtons({ value, onChange }: { value: WarehouseWindow; onChange: (window: WarehouseWindow) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" data-hdk-component="TimeWindowSelector">
      {(["1h", "24h", "7d", "30d"] as WarehouseWindow[]).map((item) => (
        <button
          key={item}
          type="button"
          className={`rounded border px-2.5 py-1 text-xs font-semibold ${value === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function TrendChart({ series, primaryKey, secondaryKey }: { series: TradingResearchSeries; primaryKey: string; secondaryKey: string }) {
  if (series.points.length < 2) {
    return <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-border bg-background text-sm text-muted-foreground">Not enough chart data yet</div>;
  }
  return (
    <div className="rounded-lg border border-border bg-background p-3" data-hdk-component="LineChart" data-chart-type="line" data-x-axis="timestamp" data-y-axis={primaryKey}>
      <svg viewBox="0 0 720 220" className="h-56 w-full" role="img" aria-label={`${primaryKey} trend`}>
        <line x1="42" x2="700" y1="188" y2="188" className="stroke-border" />
        <line x1="42" x2="42" y1="18" y2="188" className="stroke-border" />
        <path d={buildLine(series.points, primaryKey)} fill="none" className="stroke-emerald-500" strokeWidth="3" />
        <path d={buildLine(series.points, secondaryKey)} fill="none" className="stroke-sky-500" strokeWidth="3" />
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> {primaryKey}</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-500" /> {secondaryKey}</span>
        <span>{series.historyStatus.replaceAll("_", " ")}</span>
      </div>
    </div>
  );
}

function buildLine(points: Array<Record<string, number | string>>, key: string) {
  const values = points.map((point) => Number(point[key] ?? 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = 658;
  const height = 170;
  return points.map((point, index) => {
    const x = 42 + (points.length === 1 ? 0 : (index / (points.length - 1)) * width);
    const value = Number(point[key] ?? 0);
    const ratio = (value - min) / Math.max(1, max - min);
    const y = 188 - ratio * height;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function LoadingPanel({ title }: { title: string }) {
  return (
    <Panel title={title}>
      <div className="grid min-h-[260px] place-items-center p-4 text-sm text-muted-foreground" data-data-state="loading">
        Loading {title.toLowerCase()}
      </div>
    </Panel>
  );
}

function ErrorPanel({ title, error, retry }: { title: string; error: string; retry: () => void }) {
  return (
    <Panel title={title}>
      <div className="grid gap-3 p-3" data-data-state="error">
        <PolicyCallout title={title} detail={error} tone="critical" />
        <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground" onClick={retry}>
          Retry
        </button>
      </div>
    </Panel>
  );
}

function StageRow({ stage }: { stage: OperatingSystemStage }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage.version}</div>
          <h2 className="mt-1 text-sm font-semibold text-foreground">{stage.title}</h2>
        </div>
        <ToneBadge tone={stage.status === "ready" ? "success" : stage.status === "gated" ? "warning" : "info"}>{stage.status}</ToneBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.description}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MiniFact label="Owner" value={stage.owner} />
        <MiniFact label="Metric" value={stage.primaryMetric} />
      </div>
    </article>
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

function MetricCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: Tone;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`rounded border p-1.5 ${toneClasses[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="mt-3 tabular-nums text-3xl font-semibold text-foreground">{value}</div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </article>
  );
}

function PolicyCallout({ title, detail, tone }: { title: string; detail: string; tone: Tone }) {
  return (
    <article className={`rounded-lg border p-3 ${toneClasses[tone]}`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{detail}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 tabular-nums text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium leading-5 text-foreground">{value}</div>
    </div>
  );
}

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
