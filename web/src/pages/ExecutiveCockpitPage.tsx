import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Database,
  GitBranch,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { usePageHeader } from "@/contexts/usePageHeader";
import {
  buildExecutiveIntelligenceMaturityPlan,
  type ExecutiveMaturityPhase,
  type ExecutivePhaseRisk,
  type ExecutivePhaseStatus,
} from "@/lib/executive-intelligence";
import { cn } from "@/lib/utils";

type Tone = "ready" | "warning" | "critical" | "neutral";

const toneClass: Record<Tone, string> = {
  ready: "border-emerald-500/45 bg-emerald-500/10 text-foreground",
  warning: "border-amber-500/45 bg-amber-500/10 text-foreground",
  critical: "border-red-500/45 bg-red-500/10 text-foreground",
  neutral: "border-border bg-muted text-muted-foreground",
};

function toneForStatus(status: ExecutivePhaseStatus): Tone {
  if (status === "ready") return "ready";
  if (status === "blocked") return "critical";
  return "warning";
}

function toneForRisk(risk: ExecutivePhaseRisk): Tone {
  if (risk === "critical" || risk === "high") return "critical";
  if (risk === "medium") return "warning";
  return "ready";
}

export default function ExecutiveCockpitPage() {
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState("mission-context");
  const plan = useMemo(() => buildExecutiveIntelligenceMaturityPlan(), []);
  const selectedPhase =
    plan.phases.find((phase) => phase.id === selectedPhaseId) ?? plan.phases[0];
  const { setAfterTitle, setEnd } = usePageHeader();

  useLayoutEffect(() => {
    setAfterTitle(
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={toneForStatus(plan.status)}>{plan.status}</Pill>
        <Pill tone="ready">{plan.summary.ready}/12 ready</Pill>
        <Pill tone={plan.summary.blocked ? "critical" : "ready"}>{plan.summary.blocked} blocked</Pill>
      </div>,
    );
    setEnd(
      <Button size="sm" ghost onClick={() => setCheckedAt(new Date().toISOString())}>
        <RefreshCw className="mr-1 size-3.5" />
        Run readiness check
      </Button>,
    );
    return () => {
      setAfterTitle(null);
      setEnd(null);
    };
  }, [plan.status, plan.summary.blocked, plan.summary.ready, setAfterTitle, setEnd]);

  return (
    <main
      className="mx-auto grid h-full min-h-0 w-full max-w-[1680px] gap-3 p-3 xl:grid-cols-[0.78fr_1.25fr_0.9fr]"
      data-review-id="hermes.executive-intelligence.maturity"
    >
      <section className="flex min-h-0 flex-col gap-3">
        <Panel title="Executive Operating Cockpit" icon={Building2}>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Maturity score" value={`${plan.maturityScore}%`} tone="ready" />
            <Metric label="Phases" value={plan.summary.phases} tone="neutral" />
            <Metric label="Evidence items" value={plan.summary.evidenceItems} tone="ready" />
            <Metric label="Open actions" value={plan.summary.openActions} tone="warning" />
          </div>
          <div className="mt-3 rounded-md border border-border bg-background p-3">
            <h1 className="text-lg font-semibold text-foreground">Executive Cockpit</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The cockpit turns operating, system, trading, media, warehouse, and second-brain signals into a decision agenda with cited evidence.
            </p>
            {checkedAt ? (
              <p className="mt-2 text-xs font-semibold text-foreground">
                Readiness check recorded at {new Date(checkedAt).toLocaleString()}.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel title="Decision Agenda" icon={ClipboardCheck} aside={plan.decisionAgenda.length}>
          <div className="space-y-2">
            {plan.decisionAgenda.map((item) => (
              <article key={item.id} className="rounded-md border border-border bg-background p-2">
                <div className="flex items-start gap-2">
                  <Pill tone={toneForRisk(item.urgency)}>{item.urgency}</Pill>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.owner} / {item.sourcePhase}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.nextStep}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Operating Cadence" icon={CalendarClock}>
          <div className="space-y-2">
            {plan.operatingCadence.map((item) => (
              <MiniFact key={item.cadence} label={`${item.cadence}: ${item.ritual}`} value={`${item.owner} -> ${item.output}`} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="min-h-0">
        <Panel title="Ten-plus-two Phase Readiness" icon={ListChecks} aside={`${plan.summary.ready} ready`}>
          <div className="max-h-[calc(100vh-110px)] overflow-auto">
            <div className="grid min-w-[720px] grid-cols-[48px_1.1fr_0.8fr_88px_88px] gap-0 border border-border bg-background text-xs">
              <TableHead>Phase</TableHead>
              <TableHead>Executive layer</TableHead>
              <TableHead>Owner / risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              {plan.phases.map((phase) => (
                <PhaseRow
                  key={phase.id}
                  phase={phase}
                  selected={phase.id === selectedPhase.id}
                  onSelect={() => setSelectedPhaseId(phase.id)}
                />
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="flex min-h-0 flex-col gap-3">
        <Panel title="Runtime Evidence" icon={Database} aside={`Phase ${selectedPhase.phase}`}>
          <div className="space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill tone={toneForStatus(selectedPhase.status)}>{selectedPhase.status}</Pill>
                <Pill tone={toneForRisk(selectedPhase.risk)}>{selectedPhase.risk} risk</Pill>
              </div>
              <h2 className="mt-2 text-base font-semibold text-foreground">{selectedPhase.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedPhase.objective}</p>
            </div>
            <EvidenceGroup title="Operating question" items={[selectedPhase.operatingQuestion]} icon={GitBranch} />
            <EvidenceGroup title="Evidence" items={selectedPhase.evidence} icon={Database} />
            <EvidenceGroup title="Gates" items={selectedPhase.gates} icon={ShieldCheck} />
            <EvidenceGroup title="Actions" items={selectedPhase.actions} icon={CheckCircle2} />
          </div>
        </Panel>

        <Panel title="Metrics And Surfaces" icon={ShieldCheck}>
          <div className="space-y-2">
            {selectedPhase.metrics.map((metric) => (
              <MiniFact key={`${metric.label}-${metric.target}`} label={metric.label} value={`${metric.value} / target: ${metric.target}`} />
            ))}
            <div className="grid gap-1 pt-1">
              {selectedPhase.dashboardSurfaces.map((surface) => (
                <code key={surface} className="rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                  {surface}
                </code>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Board Narrative" icon={AlertTriangle} aside={plan.boardNarrative.length}>
          <ol className="space-y-2">
            {plan.boardNarrative.map((item, index) => (
              <li key={item} className="grid grid-cols-[24px_1fr] gap-2 text-sm leading-6 text-muted-foreground">
                <span className="rounded border border-border bg-background text-center text-xs font-semibold text-foreground">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </section>
    </main>
  );
}

function PhaseRow({
  phase,
  selected,
  onSelect,
}: {
  phase: ExecutiveMaturityPhase;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        "contents text-left transition-colors hover:bg-muted/70",
        selected && "[&>span]:bg-muted",
      )}
      onClick={onSelect}
      type="button"
    >
      <TableCell className="font-semibold tabular-nums">{phase.phase}</TableCell>
      <TableCell>
        <span className="block font-semibold text-foreground">{phase.title}</span>
        <span className="mt-0.5 line-clamp-1 text-muted-foreground">{phase.operatingQuestion}</span>
      </TableCell>
      <TableCell>
        <span className="block font-semibold text-foreground">{phase.owner}</span>
        <span className="mt-0.5 text-muted-foreground">{phase.risk}</span>
      </TableCell>
      <TableCell>
        <Pill tone={toneForStatus(phase.status)}>{phase.status}</Pill>
      </TableCell>
      <TableCell className="font-semibold tabular-nums">{phase.score}%</TableCell>
    </button>
  );
}

function Panel({
  title,
  icon: Icon,
  aside,
  children,
}: {
  title: string;
  icon: LucideIcon;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {aside !== undefined ? <span className="ml-auto text-xs font-semibold tabular-nums text-foreground">{aside}</span> : null}
      </div>
      <div className="min-h-0 overflow-auto p-3">{children}</div>
    </section>
  );
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", toneClass[tone])}>
      {tone === "ready" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
      {children}
    </span>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: Tone }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "critical" && "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xs leading-5 text-foreground">{value}</div>
    </div>
  );
}

function EvidenceGroup({ title, items, icon: Icon }: { title: string; items: string[]; icon: LucideIcon }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs leading-5 text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-border bg-muted px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("min-h-[54px] border-b border-border px-2 py-2 text-xs", className)}>
      {children}
    </span>
  );
}
