import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Lock, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { usePageHeader } from "@/contexts/usePageHeader";
import { fetchPortfolioIntelligenceSummary, type PortfolioExposure, type PortfolioIntelligenceSummary } from "@/lib/portfolio-intelligence";
import { formatUsd } from "@/lib/trading-command-center";
import { cn, isoTimeAgo } from "@/lib/utils";

type Tone = "ready" | "warning" | "critical" | "neutral";

const toneClass: Record<Tone, string> = {
  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  critical: "border-red-500/35 bg-red-500/10 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

function tone(value?: string | boolean): Tone {
  if (value === true || value === "ready" || value === "known" || value === "low") return "ready";
  if (value === false || value === "critical" || value === "blocked" || value === "high" || value === "missing") return "critical";
  if (value === "warning" || value === "review" || value === "partial" || value === "medium") return "warning";
  return "neutral";
}

export default function PortfolioRiskPage() {
  const [data, setData] = useState<PortfolioIntelligenceSummary | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setAfterTitle, setEnd } = usePageHeader();

  const load = async () => {
    setBusy(true);
    try {
      setData(await fetchPortfolioIntelligenceSummary());
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useLayoutEffect(() => {
    setAfterTitle(
      data ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={tone(data.health)}>{data.health}</Pill>
          <Pill tone={tone(data.summary.allocationPosture)}>{data.summary.allocationPosture}</Pill>
          <Pill tone={data.liveTradingLocked ? "ready" : "critical"}>{data.liveTradingLocked ? "live locked" : "live unlocked"}</Pill>
        </div>
      ) : null,
    );
    setEnd(
      <Button size="sm" ghost onClick={() => void load()} disabled={busy}>
        {busy ? <Spinner /> : <RefreshCw className="mr-1 size-3.5" />}
        Refresh
      </Button>,
    );
    return () => {
      setAfterTitle(null);
      setEnd(null);
    };
  }, [busy, data, setAfterTitle, setEnd]);

  if (busy && !data) return <div className="grid h-full place-items-center text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><Spinner />Loading portfolio risk office</span></div>;

  if (!data) {
    return (
      <main className="p-4">
        <Panel title="Portfolio risk unavailable">
          <Callout title="Connection failed" detail={error ?? "The portfolio risk office did not load."} tone="critical" />
          <Button size="sm" onClick={() => void load()}>Retry</Button>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto grid h-full min-h-0 w-full max-w-[1700px] gap-3 p-3 xl:grid-cols-[0.8fr_1.2fr_0.9fr]" data-review-id="hermes.trading.portfolio-risk">
      <section className="flex min-h-0 flex-col gap-3">
        <Panel title="Risk office" aside={isoTimeAgo(data.generatedAt)}>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Real broker cash" value={formatUsd(data.summary.realBrokerCashUsd)} tone="ready" />
            <Metric label="Paper bankroll" value={formatUsd(data.summary.internalPaperBankrollUsd)} tone="warning" />
            <Metric label="Open risk" value={formatUsd(data.summary.openRiskUsd)} tone={tone(data.summary.openRiskUsd ? "medium" : "ready")} />
            <Metric label="Known exposure" value={formatUsd(data.summary.knownExposureUsd)} tone={tone(data.summary.exposureCoverage)} />
          </div>
          <div className="mt-3 space-y-2">
            <Callout title="Capital is not blended" detail="Real broker cash and internal simulated bankroll are displayed separately and should not be treated as one spendable balance." tone="ready" icon={Wallet} />
            {error ? <Callout title="Showing last loaded risk office" detail={error} tone="warning" /> : null}
          </div>
        </Panel>

        <Panel title="Coverage">
          <div className="grid gap-2">
            <MiniFact label="Exposure coverage" value={<Pill tone={tone(data.summary.exposureCoverage)}>{data.summary.exposureCoverage}</Pill>} />
            <MiniFact label="Broker coverage" value={`${data.brokerCoverage.accountVisible}/${data.brokerCoverage.brokers} accounts visible`} />
            <MiniFact label="Concentration" value={`${data.summary.concentrationRisk} / ${data.concentration.largestSourceProject || "none"}`} />
            <MiniFact label="Kill switch" value={data.riskOffice.killSwitchStatus} />
          </div>
        </Panel>
      </section>

      <section className="min-h-0">
        <Panel title="Exposure map" aside={data.exposures.length}>
          <div className="max-h-[calc(100vh-160px)] space-y-2 overflow-auto">
            {data.exposures.map((exposure) => <ExposureCard key={exposure.id} exposure={exposure} />)}
          </div>
        </Panel>
      </section>

      <section className="flex min-h-0 flex-col gap-3">
        <Panel title="Allocation recommendations" aside={data.allocationRecommendations.length}>
          <div className="space-y-2">
            {data.allocationRecommendations.map((rec) => (
              <Callout key={rec.id} title={rec.title} detail={`priority=${rec.priority}; confidence=${rec.confidence}; approval=${rec.requiresApproval ? "required" : "not required"}`} tone={tone(rec.priority)} icon={ShieldCheck} />
            ))}
          </div>
        </Panel>

        <Panel title="Dissenting evidence" aside={data.dissentingEvidence.length}>
          <div className="space-y-2">
            {data.dissentingEvidence.length ? data.dissentingEvidence.map((item) => (
              <Callout key={item} title="Evidence against expansion" detail={item} tone="warning" />
            )) : <Callout title="No dissenting evidence" detail="The portfolio contract did not return active blockers." tone="ready" />}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function ExposureCard({ exposure }: { exposure: PortfolioExposure }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={tone(exposure.coverage)}>{exposure.coverage}</Pill>
            <Pill tone={tone(exposure.capitalType === "real-broker-cash")}>{exposure.capitalType.replaceAll("-", " ")}</Pill>
          </div>
          <h2 className="mt-2 text-sm font-semibold text-foreground">{exposure.label}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{exposure.assetClass} / {exposure.sourceProject}</p>
        </div>
        <Pill tone={exposure.liveTradingLocked ? "ready" : "critical"}>{exposure.liveTradingLocked ? "locked" : "unlocked"}</Pill>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Cash" value={formatUsd(exposure.cashLeftUsd)} />
        <MiniFact label="Buying power" value={formatUsd(exposure.buyingPowerUsd)} />
        <MiniFact label="Known value" value={formatUsd(exposure.knownValueUsd)} />
        <MiniFact label="Open risk" value={formatUsd(exposure.openRiskUsd)} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{exposure.capitalSemantics}</p>
    </article>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {aside !== undefined ? <span className="text-xs font-semibold tabular-nums text-foreground">{aside}</span> : null}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Pill({ tone: t, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", toneClass[t])}>
      {t === "ready" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
      {children}
    </span>
  );
}

function Metric({ label, value, tone: t }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold tabular-nums", t === "critical" && "text-destructive", t === "ready" && "text-emerald-700")}>{value}</div>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card px-2 py-1.5 text-xs">
      <div className="font-semibold text-muted-foreground">{label}</div>
      <div className="mt-0.5 break-words text-foreground">{value}</div>
    </div>
  );
}

function Callout({ title, detail, tone: t, icon: Icon = Lock }: { title: string; detail: string; tone: Tone; icon?: typeof Lock }) {
  return (
    <div className={cn("rounded-md border p-2 text-xs", toneClass[t])}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <div>
          <div className="font-semibold">{title}</div>
          <div className="mt-0.5 leading-5 opacity-90">{detail}</div>
        </div>
      </div>
    </div>
  );
}
