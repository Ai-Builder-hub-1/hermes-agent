import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, Lock, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { usePageHeader } from "@/contexts/usePageHeader";
import { fetchCompoundingSummary, runCompoundingReview, type CompoundingProposal, type CompoundingSummary } from "@/lib/compounding-intelligence";
import { cn, isoTimeAgo } from "@/lib/utils";

type Tone = "ready" | "warning" | "critical" | "neutral";

const toneClass: Record<Tone, string> = {
  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  critical: "border-red-500/35 bg-red-500/10 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

function tone(value?: string): Tone {
  if (value === "ready" || value === "low") return "ready";
  if (value === "critical" || value === "blocked" || value === "high") return "critical";
  if (value === "warning" || value === "review" || value === "medium" || value === "guarded" || value === "candidate" || value === "not_observed") return "warning";
  return "neutral";
}

export default function CompoundingIntelligencePage() {
  const [summary, setSummary] = useState<CompoundingSummary | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const { setAfterTitle, setEnd } = usePageHeader();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setSummary(await fetchCompoundingSummary());
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useLayoutEffect(() => {
    setAfterTitle(
      summary ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={tone(summary.health)}>{summary.health}</Pill>
          <Pill tone={summary.summary.executionEnabled ? "critical" : "ready"}>{summary.summary.executionEnabled ? "execution enabled" : "execution disabled"}</Pill>
          <Pill tone={summary.summary.liveTradingLocked ? "ready" : "critical"}>{summary.summary.liveTradingLocked ? "live locked" : "live unlocked"}</Pill>
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
  }, [busy, load, setAfterTitle, setEnd, summary]);

  const review = async () => {
    setActionStatus("Review recording");
    try {
      await runCompoundingReview();
      setActionStatus("Review evidence recorded");
      await load();
    } catch (exc) {
      setActionStatus(`Review failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  if (busy && !summary) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><Spinner />Loading compounding intelligence</span></div>;
  }

  if (!summary) {
    return (
      <main className="p-4">
        <Panel title="Compounding intelligence unavailable">
          <Callout title="Connection failed" detail={error ?? "The compounding summary did not load."} tone="critical" />
          <Button size="sm" onClick={() => void load()}>Retry</Button>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto grid h-full min-h-0 w-full max-w-[1600px] gap-3 p-3 xl:grid-cols-[0.85fr_1.15fr_0.9fr]" data-review-id="hermes.compounding.local">
      <section className="flex min-h-0 flex-col gap-3">
        <Panel title="Proposal posture" aside={isoTimeAgo(summary.generatedAt)}>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Proposals" value={summary.summary.proposals} tone={tone(summary.health)} />
            <Metric label="Approval" value={summary.summary.requiresApproval} tone={summary.summary.requiresApproval ? "warning" : "ready"} />
            <Metric label="Blocked" value={summary.summary.blocked} tone={summary.summary.blocked ? "critical" : "ready"} />
            <Metric label="Experiments" value={summary.summary.experiments} tone="neutral" />
            <Metric label="SLO breaches" value={summary.summary.sloBreaches} tone={summary.summary.sloBreaches ? "critical" : "ready"} />
            <Metric label="Triage" value={summary.summary.triagePackets} tone={summary.summary.triagePackets ? "warning" : "ready"} />
            <Metric label="Runbooks" value={summary.summary.runbookHistory} tone="neutral" />
            <Metric label="Baselines" value={summary.summary.visualBaselines} tone="neutral" />
            <Metric label="Reliability" value={`${summary.businessReliabilityCost.summary.averageReliability}%`} tone={summary.businessReliabilityCost.summary.averageReliability >= 80 ? "ready" : "warning"} />
            <Metric label="Launch ready" value={`${summary.launchReadiness.summary.ready}/${summary.launchReadiness.summary.systems}`} tone={summary.launchReadiness.summary.blocked ? "critical" : "warning"} />
          </div>
          <div className="mt-3 grid gap-2">
            <Callout title="Execution remains off" detail="This page proposes experiments and reviews. It does not execute strategy, autonomy, promotion, demotion, or trading changes." tone="ready" icon={Lock} />
            {error ? <Callout title="Showing last loaded summary" detail={error} tone="warning" /> : null}
          </div>
        </Panel>

        <Panel title="Committee packet">
          <div className="space-y-2">
            {summary.committeePacket.sections.map((section) => (
              <div key={section.id} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{section.id.replaceAll("-", " ")}</span>
                  <Pill tone={tone(section.health)}>{section.health ?? "unknown"}</Pill>
                </div>
                <div className="mt-1 text-muted-foreground">{Object.entries(section.summary ?? {}).slice(0, 4).map(([key, value]) => `${key}=${String(value)}`).join("; ")}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Evidence and SLOs" aside={`${summary.automatedEvidence.summary.breaches}/${summary.automatedEvidence.summary.objectives}`}>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <MiniFact label="Captures" value={summary.automatedEvidence.summary.captures} />
              <MiniFact label="Burn rate" value={summary.automatedEvidence.summary.burnRate} />
              <MiniFact label="SLO history" value={`${summary.automatedEvidence.sloHistory.summary.points} local points`} />
              <MiniFact label="Backbone" value={`${summary.automatedEvidence.summary.backboneReady ?? 0}/${summary.automatedEvidence.summary.backboneCategories ?? 0}`} />
            </div>
            {summary.automatedEvidence.captureBackbone ? (
              <div className="grid gap-2">
                {summary.automatedEvidence.captureBackbone.items.map((item) => (
                  <Callout
                    key={item.id}
                    title={`${item.label}: ${item.status}`}
                    detail={item.automatedEvidenceEnough ? item.evidence.slice(0, 2).join(" | ") || "Local evidence rows are present." : item.missing.join("; ") || item.nextAction}
                    tone={tone(item.status === "ready" ? "ready" : "warning")}
                  />
                ))}
              </div>
            ) : null}
            {summary.automatedEvidence.slos.objectives.map((slo) => (
              <Callout key={slo.id} title={slo.title} detail={`${slo.measurement} / ${slo.nextAction}`} tone={tone(slo.status === "breach" ? slo.severity : "ready")} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="min-h-0">
        <Panel title="Improvement proposals" aside={summary.proposals.length}>
          <div className="max-h-[calc(100vh-160px)] space-y-2 overflow-auto">
            {summary.proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} />)}
          </div>
        </Panel>
      </section>

      <section className="flex min-h-0 flex-col gap-3">
        <Panel title="Business reliability" aside={`${summary.businessReliabilityCost.summary.averageReliability}%`}>
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <MiniFact label="Backbone" value={`${summary.businessReliabilityCost.summary.backboneReady ?? 0}/${summary.businessReliabilityCost.summary.backboneCategories ?? 0}`} />
              <MiniFact label="Posture" value={summary.businessReliabilityCost.summary.businessReliabilityCostEnough ? "sufficient" : "needs proof"} />
            </div>
            {summary.businessReliabilityCost.businessBackbone ? summary.businessReliabilityCost.businessBackbone.items.map((item) => (
              <Callout
                key={item.id}
                title={item.label}
                detail={item.businessReliabilityCostEnough ? item.evidence.slice(0, 2).join(" | ") || "Local business/reliability/cost rows are present." : item.missing.join("; ") || item.nextAction}
                tone={tone(item.status === "ready" ? "ready" : "warning")}
              />
            )) : null}
            {summary.businessReliabilityCost.domains.map((domain) => (
              <Callout key={domain.id} title={`${domain.label}: ${domain.impact}`} detail={`${domain.businessUnit}; risks=${domain.openRisks}; ${domain.nextAction}`} tone={tone(domain.health)} />
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              {summary.businessReliabilityCost.selfAudit.slice(0, 4).map((gap) => (
                <MiniFact key={gap.id} label={gap.status} value={`${gap.title} / ${gap.nextAction}`} />
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {summary.businessReliabilityCost.regressionActions.slice(0, 4).map((action) => (
                <MiniFact key={action.id} label={action.status} value={`${action.title} / ${action.approval}`} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Fleet governance" aside={`${summary.fleetGovernance.summary.ready}/${summary.fleetGovernance.summary.controls}`}>
          <div className="space-y-2">
            <Callout title="Autonomy mode" detail={`${summary.fleetGovernance.autonomy.mode}; next gate: ${summary.fleetGovernance.autonomy.nextApprovalGate}`} tone={summary.fleetGovernance.summary.blocked ? "critical" : "warning"} icon={Lock} />
            <div className="grid gap-2 sm:grid-cols-2">
              <MiniFact label="Backbone" value={`${summary.fleetGovernance.summary.backboneReady ?? 0}/${summary.fleetGovernance.summary.backboneCategories ?? 0}`} />
              <MiniFact label="Posture" value={summary.fleetGovernance.summary.fleetGovernanceEnough ? "sufficient" : "needs proof"} />
            </div>
            {summary.fleetGovernance.fleetBackbone ? summary.fleetGovernance.fleetBackbone.items.map((item) => (
              <Callout
                key={item.id}
                title={item.label}
                detail={item.fleetGovernanceEnough ? item.evidence.slice(0, 2).join(" | ") || "Local fleet governance rows are present." : item.missing.join("; ") || item.nextAction}
                tone={tone(item.status === "ready" ? "ready" : "warning")}
                icon={ShieldCheck}
              />
            )) : null}
            {summary.fleetGovernance.controls.slice(0, 6).map((control) => (
              <MiniFact key={control.id} label={control.status} value={`${control.title} / ${control.proof}`} />
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              {summary.fleetGovernance.visualBaselines.slice(0, 4).map((baseline) => (
                <MiniFact key={baseline.id} label={baseline.status} value={`${baseline.route} / ${baseline.comparisonStorage}`} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Launch readiness" aside={summary.launchReadiness.decision.launchMode}>
          <div className="space-y-2">
            {summary.launchReadiness.systems.map((system) => (
              <Callout key={system.id} title={`${system.label}: ${system.status}`} detail={`${system.evidence.join("; ")} / ${system.nextAction}`} tone={tone(system.status)} icon={ShieldCheck} />
            ))}
          </div>
        </Panel>

        <Panel title="Predictive signals" aside={summary.predictiveIntelligence.summary.correlationId}>
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <MiniFact label="Graph nodes" value={summary.predictiveIntelligence.causalGraph.summary.nodes} />
              <MiniFact label="Graph edges" value={summary.predictiveIntelligence.causalGraph.summary.edges} />
              <MiniFact label="Backbone" value={`${summary.predictiveIntelligence.summary.backboneReady ?? 0}/${summary.predictiveIntelligence.summary.backboneCategories ?? 0}`} />
              <MiniFact label="Posture" value={summary.predictiveIntelligence.summary.predictiveCausalEnough ? "sufficient" : "needs proof"} />
            </div>
            {summary.predictiveIntelligence.predictiveBackbone ? summary.predictiveIntelligence.predictiveBackbone.items.map((item) => (
              <Callout
                key={item.id}
                title={`${item.label}: ${item.status}`}
                detail={item.predictiveCausalEnough ? item.evidence.slice(0, 2).join(" | ") || "Local predictive rows are present." : item.missing.join("; ") || item.nextAction}
                tone={tone(item.status === "ready" ? "ready" : "warning")}
              />
            )) : null}
            {summary.predictiveIntelligence.forecasts.length ? summary.predictiveIntelligence.forecasts.map((forecast) => (
              <Callout key={forecast.id} title={forecast.title} detail={`${forecast.horizon}; ${forecast.reason}`} tone={tone(forecast.severity)} />
            )) : <Callout title="No active forecasts" detail="The current evidence bundle does not predict an immediate operator-cycle failure." tone="ready" />}
            {summary.predictiveIntelligence.causalChains.map((chain) => (
              <div key={chain.id} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="font-semibold text-foreground">{chain.summary}</div>
                <div className="mt-1 text-muted-foreground">{chain.nodes.join(" -> ")}</div>
                <div className="mt-1 text-muted-foreground">{chain.nextAction}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Triage and playbooks" aside={summary.remediation.summary.triagePackets}>
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <MiniFact label="Backbone" value={`${summary.remediation.summary.backboneReady ?? 0}/${summary.remediation.summary.backboneCategories ?? 0}`} />
              <MiniFact label="Posture" value={summary.remediation.summary.remediationEnough ? "sufficient" : "needs proof"} />
            </div>
            {summary.remediation.remediationBackbone ? summary.remediation.remediationBackbone.items.map((item) => (
              <Callout
                key={item.id}
                title={item.label}
                detail={item.remediationEnough ? item.evidence.slice(0, 2).join(" | ") || "Local remediation outcomes are present." : item.missing.join("; ") || item.nextAction}
                tone={tone(item.status === "ready" ? "ready" : "warning")}
                icon={ShieldCheck}
              />
            )) : null}
            {summary.remediation.triagePackets.length ? summary.remediation.triagePackets.slice(0, 5).map((packet) => (
              <Callout key={packet.id} title={packet.title} detail={`${packet.playbookId}; ${packet.recommendedAction}`} tone={tone(packet.severity)} icon={ShieldCheck} />
            )) : <Callout title="No triage packets" detail="There are no guided remediation packets waiting for review." tone="ready" icon={ShieldCheck} />}
            <div className="grid gap-2 sm:grid-cols-2">
              {summary.remediation.playbooks.slice(0, 4).map((playbook) => (
                <MiniFact key={playbook.id} label={playbook.mode} value={`${playbook.title} / ${playbook.approval}`} />
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {summary.remediation.runbookHistory.slice(0, 4).map((entry) => (
                <MiniFact key={entry.id} label={entry.status} value={`${entry.playbookId} / pending=${entry.pendingPackets}`} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Interaction maturity" aside={`${summary.interactionMaturity.summary.routes} routes`}>
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <MiniFact label="Windows" value={summary.interactionMaturity.summary.windows} />
              <MiniFact label="Visual states" value={summary.interactionMaturity.summary.visualStates} />
            </div>
            {summary.interactionMaturity.routes.slice(0, 4).map((route) => (
              <MiniFact key={route.route} label={route.status} value={`${route.route} / ${route.windows.join(", ")}`} />
            ))}
          </div>
        </Panel>

        <Panel title="Review control">
          <div className="space-y-3">
            <Callout title="Operator review only" detail={summary.committeePacket.decisionMode.replaceAll("_", " ")} tone={summary.committeePacket.approvalRequired ? "warning" : "ready"} icon={ShieldCheck} />
            <Button size="sm" onClick={() => void review()}>Record compounding review</Button>
            {actionStatus ? <p className="text-xs font-medium text-muted-foreground">{actionStatus}</p> : null}
          </div>
        </Panel>

        <Panel title="Recommendations" aside={summary.recommendations.length}>
          <div className="space-y-2">
            {summary.recommendations.length ? summary.recommendations.map((item) => (
              <Callout key={item} title="Next action" detail={item} tone="warning" icon={Sparkles} />
            )) : <Callout title="No recommendations" detail="The compounding layer did not return any open recommendation." tone="ready" />}
          </div>
        </Panel>

        <Panel title="Blockers" aside={summary.blockers.length}>
          <div className="space-y-2">
            {summary.blockers.length ? summary.blockers.map((item) => (
              <Callout key={item} title="Blocked proposal" detail={item} tone="critical" />
            )) : <Callout title="No blocked proposals" detail="All current proposals are reviewable." tone="ready" />}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function ProposalCard({ proposal }: { proposal: CompoundingProposal }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={tone(proposal.priority)}>{proposal.priority}</Pill>
            <Pill tone={tone(proposal.status)}>{proposal.status}</Pill>
            <Pill tone={proposal.executionEnabled ? "critical" : "ready"}>{proposal.executionEnabled ? "exec on" : "exec off"}</Pill>
          </div>
          <h2 className="mt-2 text-sm font-semibold text-foreground">{proposal.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{proposal.type.replaceAll("_", " ")} / {proposal.sizing}</p>
        </div>
        {proposal.requiresApproval ? <Pill tone="warning">approval</Pill> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{proposal.nextAction}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MiniFact label="Policy action" value={proposal.policyAction} />
        <MiniFact label="Policy" value={`${proposal.policy.actionClass} / ${proposal.policy.approval}`} />
        <MiniFact label="Proof" value={proposal.policy.proofRequired} />
        <MiniFact label="Live effect" value={proposal.policy.liveEffect ? "yes" : "no"} />
      </div>
      {proposal.evidence.length ? (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          {proposal.evidence.map((item) => <div key={item}>{item}</div>)}
        </div>
      ) : null}
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

function Metric({ label, value, tone: t }: { label: string; value: string | number; tone: Tone }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", t === "critical" && "text-destructive", t === "ready" && "text-emerald-700")}>{value}</div>
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

function Callout({ title, detail, tone: t, icon: Icon = BrainCircuit }: { title: string; detail: string; tone: Tone; icon?: typeof BrainCircuit }) {
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
