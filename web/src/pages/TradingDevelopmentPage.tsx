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
import type { ReactNode } from "react";
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
            <MiniStat label="Gated" value={gated} />
          </div>
        </div>
      </section>

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
  return (
    <Panel title="Research decision rules">
      <div className="grid gap-3 p-3">
        <PolicyCallout title="No strategy graduates on narrative alone" detail="Each candidate needs source data, hypothesis, expected edge, cost context, and falsification criteria before backtesting." tone="warning" />
        <PolicyCallout title="Learning can recommend, not approve" detail="Outcome feeds can suggest policy or strategy changes, but operator approval decides the next work." tone="critical" />
        <PolicyCallout title="Khashi and Investing System stay separate" detail="Evidence can be compared in one view without mixing real broker state, simulated bankrolls, and research-only records." tone="info" />
      </div>
    </Panel>
  );
}

function BacktestDecisionPanel() {
  return (
    <Panel title="Backtest readiness rules">
      <div className="grid gap-3 p-3">
        <PolicyCallout title="Backtest before shadow" detail="A strategy needs explicit dataset window, assumptions, fees/slippage model, metrics, and failure cases before shadow/paper consideration." tone="warning" />
        <PolicyCallout title="Paid provider runs are capped" detail="Golden/provider evals must pass budget breakers and leave scored artifacts before routing recommendations matter." tone="critical" />
        <PolicyCallout title="Operator decides deep work" detail="The system should surface candidates and evidence; it should not auto-escalate into deep dives or live trading." tone="success" />
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
