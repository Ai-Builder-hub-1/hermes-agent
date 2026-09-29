import {
  AlertTriangle,
  ArrowRight,
  Database,
  MessageSquare,
  Radio,
  RotateCw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  attentionItems,
  buildOperateItems,
  itemsForKind,
  operateSummary,
  type OperateItem,
} from "@/lib/operate-items";
import {
  blockerKindCounts,
  blockerStages,
  explainOperatingBlocker,
  type OperatingBlockerKind,
} from "@/lib/operate-blockers";
import {
  businessScorecards,
  decisionLedger,
  liveSignalIntegrations,
  operatingLoops,
  operatingSystemStages,
  permissionPolicies,
  routedTasks,
  type LiveSignalIntegration,
  type OperatingSystemStage,
} from "./operating-system-data";
import {
  fallbackFleetOperatorSnapshots,
  loadFleetOperatorSnapshots,
  type FleetOperatorSnapshot,
} from "./fleet-operator-data";
import { loadOperatingRuntimeState } from "./operating-runtime";
import {
  loadOperatingRuntimeStateFromServer,
  recordChatActionIntent,
  type OperatingRuntimeState,
} from "./operating-runtime";

type OperateMode =
  | "overview"
  | "blockers"
  | "actions"
  | "incidents"
  | "approvals"
  | "runs"
  | "chat-actions";

type Tone = "success" | "info" | "warning" | "critical" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  critical: "border-red-500/35 bg-red-500/10 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

const modeCopy: Record<OperateMode, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Daily operator",
    title: "Operate",
    description:
      "A compact command view for what needs attention, what can be acted on, what is blocked, and which operating loops are safe to run.",
  },
  blockers: {
    eyebrow: "Blocked work",
    title: "Blockers",
    description:
      "Production-affecting items that need a gate, owner, evidence source, or explicit operator decision before the system should move.",
  },
  actions: {
    eyebrow: "Action queue",
    title: "Actions",
    description:
      "Routed operating tasks with priority, owner, current state, and the next concrete step.",
  },
  incidents: {
    eyebrow: "Response queue",
    title: "Incidents",
    description:
      "Incident and stale-signal readiness across production checks, rollback paths, and notification fanout.",
  },
  approvals: {
    eyebrow: "Decision control",
    title: "Approvals",
    description:
      "The decisions and permission policies that decide whether Hermes can view, refresh, deploy, or change credentials.",
  },
  runs: {
    eyebrow: "Operating loops",
    title: "Recent runs",
    description:
      "Daily and weekly loops, their readiness state, intended output, and the gate that must be true before scheduled execution.",
  },
  "chat-actions": {
    eyebrow: "Operator chat",
    title: "Chat actions",
    description:
      "Useful prompts and command intents for driving the operating system through Hermes chat while keeping approvals explicit.",
  },
};

export function OperateOverviewPage() {
  return <OperatePage mode="overview" />;
}

export function OperateBlockersPage() {
  return <OperatePage mode="blockers" />;
}

export function OperateActionsPage() {
  return <OperatePage mode="actions" />;
}

export function OperateIncidentsPage() {
  return <OperatePage mode="incidents" />;
}

export function OperateApprovalsPage() {
  return <OperatePage mode="approvals" />;
}

export function OperateRunsPage() {
  return <OperatePage mode="runs" />;
}

export function OperateChatActionsPage() {
  return <OperatePage mode="chat-actions" />;
}

function OperatePage({ mode }: { mode: OperateMode }) {
  const copy = modeCopy[mode];
  const blockers = blockerStages(operatingSystemStages);
  const runtime = useMemo(() => loadOperatingRuntimeState(), []);
  const [fleetSnapshots, setFleetSnapshots] = useState<FleetOperatorSnapshot[]>(fallbackFleetOperatorSnapshots);
  useEffect(() => {
    let cancelled = false;
    loadFleetOperatorSnapshots().then((snapshots) => {
      if (!cancelled) setFleetSnapshots(snapshots);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const operateItems = useMemo(() => buildOperateItems({
    stages: operatingSystemStages,
    tasks: routedTasks,
    decisions: decisionLedger,
    policies: permissionPolicies,
    loops: operatingLoops,
    runtime,
    fleetSnapshots,
  }), [fleetSnapshots, runtime]);
  const summary = operateSummary(operateItems);
  const incidents = operatingSystemStages.filter((stage) =>
    [
      "Incident Command",
      "Production Verification",
      "Production Sweep",
      "Circuit Breakers",
      "Hard Breaker Enforcement",
      "Incident Notification Fanout",
      "Incident Ingestion",
      "Incident Subscriptions",
      "Incident Automation",
    ].includes(stage.title),
  );
  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8" data-review-id={`hermes.operate.${mode}`}>
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Radio className="h-4 w-4" aria-hidden />
              {copy.eyebrow}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </div>
          <div className="grid min-w-[220px] gap-2 text-xs font-semibold text-muted-foreground sm:grid-cols-2">
            <MiniStat label="Needs attention" value={summary.attention} />
            <MiniStat label="Gated work" value={summary.blockers} />
          </div>
        </div>
      </section>

      {mode === "overview" ? (
        <Overview blockers={blockers} items={operateItems} />
      ) : mode === "blockers" ? (
        <Blockers blockers={blockers} />
      ) : mode === "actions" ? (
        <Actions items={itemsForKind(operateItems, "action")} />
      ) : mode === "incidents" ? (
        <Incidents incidents={incidents} items={itemsForKind(operateItems, "incident")} />
      ) : mode === "approvals" ? (
        <Approvals items={itemsForKind(operateItems, "approval")} />
      ) : mode === "runs" ? (
        <Runs items={itemsForKind(operateItems, "run")} />
      ) : (
        <ChatActions />
      )}
    </main>
  );
}

function Overview({ blockers, items }: { blockers: OperatingSystemStage[]; items: OperateItem[] }) {
  const attention = attentionItems(items);
  const summary = operateSummary(items);

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Operator summary">
        <MetricCard label="Needs attention" value={summary.attention} detail="non-ready items across Operate" tone="critical" icon={AlertTriangle} />
        <MetricCard label="Safe actions" value={summary.executable} detail="routes or manual actions available" tone="info" icon={ArrowRight} />
        <MetricCard label="Approval gates" value={summary.approvals} detail="explicit human decision required" tone="warning" icon={ShieldCheck} />
        <MetricCard label="Ready loops" value={itemsForKind(items, "run").filter((item) => item.state === "ready").length} detail="manual-safe loop definitions" tone="success" icon={RotateCw} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.6fr)_minmax(360px,0.4fr)]">
        <Panel title="Next operator actions" count={attention.length}>
          <div className="grid gap-2 p-3">
            {attention.map((item) => (
              <OperateItemRow key={item.id} item={item} />
            ))}
          </div>
        </Panel>
        <Panel title="Blocked or gated" count={blockers.length}>
          <div className="grid gap-2 p-3">
            {blockers.slice(0, 6).map((stage) => (
              <StageRow key={stage.version} stage={stage} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {businessScorecards.map((scorecard) => (
          <article key={scorecard.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Business unit</div>
                <h2 className="mt-1 text-base font-semibold text-foreground">{scorecard.business}</h2>
              </div>
              <span className="tabular-nums text-2xl font-semibold text-foreground">{scorecard.health}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{scorecard.operatingFocus}</p>
            <div className="mt-4 grid gap-2 text-xs">
              <MiniFact label="Revenue" value={scorecard.revenueSignal} />
              <MiniFact label="Cost" value={scorecard.costSignal} />
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function Blockers({ blockers }: { blockers: OperatingSystemStage[] }) {
  const counts = blockerKindCounts(blockers);
  const topCategories = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1]);

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.58fr)_minmax(360px,0.42fr)]">
      <div className="xl:col-span-2 grid gap-3 md:grid-cols-4">
        <MetricCard label="Total displayed" value={blockers.length} detail="gated or high-risk stages" tone="warning" icon={AlertTriangle} />
        <MetricCard label="Live failures" value={0} detail="this page is roadmap/gate data" tone="success" icon={ShieldCheck} />
        <MetricCard label="Manual gates" value={counts.manual_approval} detail="need operator approval/proof" tone="critical" icon={MessageSquare} />
        <MetricCard label="Infra dependencies" value={counts.infrastructure_dependency} detail="server, secrets, storage, provider proof" tone="warning" icon={Database} />
      </div>

      <Panel title="Blocker queue" count={blockers.length}>
        <div className="grid gap-2 p-3">
          {blockers.map((stage) => (
            <BlockerRow key={stage.version} stage={stage} />
          ))}
        </div>
      </Panel>
      <Panel title="How to read this">
        <div className="grid gap-3 p-3">
          <PolicyCallout
            title="These are not automatically live outages"
            detail="The queue comes from the static operating-system maturity roadmap. A stage appears here when it is gated or high risk."
            tone="info"
          />
          <PolicyCallout
            title="Unblocking means evidence, not optimism"
            detail="Clear a blocker only after the required proof exists: approval record, production health evidence, breaker result, secret-name proof, artifact pointer, or successful run history."
            tone="warning"
          />
          <div className="grid gap-2">
            {topCategories.map(([kind, count]) => (
              <MiniFact key={kind} label={labelForBlockerKind(kind as OperatingBlockerKind)} value={`${count} stage${count === 1 ? "" : "s"}`} />
            ))}
          </div>
        </div>
      </Panel>
      <Panel title="Clearing proof">
        <div className="grid gap-3 p-3">
          {blockers.slice(0, 5).map((stage) => (
            <article key={stage.version} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{stage.title}</h2>
                <ToneBadge tone={stage.risk === "high" ? "critical" : "warning"}>{stage.risk} risk</ToneBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{explainOperatingBlocker(stage).clearingProof}</p>
              <div className="mt-3 grid gap-2">
                {explainOperatingBlocker(stage).gatedRows.map((row) => (
                  <MiniFact key={row.id} label={row.capability} value={row.nextStep} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function BlockerRow({ stage }: { stage: OperatingSystemStage }) {
  const explanation = explainOperatingBlocker(stage);
  const tone = toneForBlockerKind(explanation.kind);

  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage.version}</span>
            <ToneBadge tone={tone}>{explanation.label}</ToneBadge>
            {explanation.isLiveFailure ? <ToneBadge tone="critical">live failure</ToneBadge> : <ToneBadge tone="info">not live failure</ToneBadge>}
          </div>
          <h2 className="mt-1 text-sm font-semibold text-foreground">{stage.title}</h2>
        </div>
        <ToneBadge tone={stage.status === "ready" ? "success" : stage.status === "gated" ? "warning" : "info"}>{stage.status}</ToneBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{explanation.meaning}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MiniFact label="Origin" value={explanation.origin} />
        <MiniFact label="Clears when" value={explanation.clearingProof} />
      </div>
    </article>
  );
}

function OperateItemRow({ item }: { item: OperateItem }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge tone={toneForOperateSeverity(item.severity)}>{item.severity}</ToneBadge>
            <ToneBadge tone={toneForOperateState(item.state)}>{item.state}</ToneBadge>
            {item.requiresApproval ? <ToneBadge tone="warning">approval</ToneBadge> : null}
          </div>
          <h2 className="mt-2 text-sm font-semibold text-foreground">{item.title}</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{item.source}</p>
        </div>
        {item.route ? (
          <Link to={item.route} className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted">
            Open
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        ) : item.safeAction ? (
          <span className="rounded border border-border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">{item.safeAction}</span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.whyItMatters}</p>
      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        <MiniFact label="Next action" value={item.nextAction} />
        <MiniFact label="Clearing proof" value={item.clearingProof} />
        <MiniFact label="Owner" value={item.owner} />
        <MiniFact label="Evidence" value={item.evidence} />
      </div>
      {item.updatedAt ? <p className="mt-2 text-[11px] font-medium text-muted-foreground">Updated: {item.updatedAt}</p> : null}
    </article>
  );
}

function Actions({ items }: { items: OperateItem[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.64fr)_minmax(320px,0.36fr)]">
      <Panel title="Routed actions" count={items.length}>
        <div className="grid gap-2 p-3">
          {items.map((item) => (
            <OperateItemRow key={item.id} item={item} />
          ))}
        </div>
      </Panel>
      <Panel title="Signal sources" count={liveSignalIntegrations.length}>
        <div className="grid gap-2 p-3">
          {liveSignalIntegrations.map((signal) => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Incidents({ incidents, items }: { incidents: OperatingSystemStage[]; items: OperateItem[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
      <Panel title="Incident readiness" count={incidents.length}>
        <div className="grid gap-2 p-3">
          {items.map((item) => (
            <OperateItemRow key={item.id} item={item} />
          ))}
        </div>
      </Panel>
      <Panel title="Response policy">
        <div className="grid gap-3 p-3">
          <PolicyCallout title="Manual first" detail="Auto-remediation stays locked until permission runtime, audit store, and kill switches are live." tone="critical" />
          <PolicyCallout title="Every incident needs an owner" detail="Incident rows should name severity, owner, next step, rollback path, and evidence location." tone="warning" />
          <PolicyCallout title="Promotion evidence matters" detail="Deploy failures should attach health checks, screenshots, and rollback evidence before closeout." tone="info" />
        </div>
      </Panel>
    </section>
  );
}

function Approvals({ items }: { items: OperateItem[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.56fr)_minmax(380px,0.44fr)]">
      <Panel title="Approval inbox" count={items.length}>
        <div className="grid gap-2 p-3">
          {items.map((item) => (
            <OperateItemRow key={item.id} item={item} />
          ))}
        </div>
      </Panel>
      <Panel title="Decision rules">
        <div className="grid gap-3 p-3">
          <PolicyCallout title="Approval is a queue" detail="Items here should end in an explicit approval, denial, superseded decision, or audit record." tone="warning" />
          <PolicyCallout title="High-risk stays gated" detail="Deploy, secret, scheduler, provider, autonomy, and release-train work should remain explicit-approval only." tone="critical" />
        </div>
      </Panel>
    </section>
  );
}

function Runs({ items }: { items: OperateItem[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
      <Panel title="Loop registry" count={items.length}>
        <div className="grid gap-2 p-3">
          {items.map((item) => (
            <OperateItemRow key={item.id} item={item} />
          ))}
        </div>
      </Panel>
      <Panel title="Run rules">
        <div className="grid gap-3 p-3">
          <PolicyCallout title="Manual dry runs first" detail="Run loops manually until permission runtime and audit persistence are active." tone="warning" />
          <PolicyCallout title="No silent production changes" detail="Deploy, rollback, secret, and live automation work stays explicit-approval only." tone="critical" />
          <PolicyCallout title="Evidence closes the loop" detail="Each run should end with a report, changed state, or a clear no-op reason." tone="info" />
        </div>
      </Panel>
    </section>
  );
}

function ChatActions() {
  const [runtime, setRuntime] = useState<OperatingRuntimeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const prompts = [
    {
      title: "Daily operator brief",
      prompt: "Summarize production health, open blockers, deploy risk, and the next three operator actions.",
      tone: "info" as Tone,
    },
    {
      title: "Review blockers",
      prompt: "Walk me through current gated/high-risk work and ask for decisions one at a time.",
      tone: "warning" as Tone,
    },
    {
      title: "Prepare deploy",
      prompt: "Build a deploy checklist for the selected project, including tests, health checks, screenshots, and rollback.",
      tone: "critical" as Tone,
    },
    {
      title: "Run maturity audit",
      prompt: "Audit dashboard pages against our daily operator, investing system, data warehouse, and action goals.",
      tone: "success" as Tone,
    },
  ];

  const load = async () => {
    try {
      setRuntime(await loadOperatingRuntimeStateFromServer());
      setError(null);
    } catch (exc) {
      setRuntime(loadOperatingRuntimeState());
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const recordIntent = async (item: { title: string; prompt: string }) => {
    if (!runtime) return;
    setActionStatus(`${item.title} recording`);
    try {
      setRuntime(await recordChatActionIntent(runtime, item));
      setActionStatus(`${item.title} recorded`);
    } catch (exc) {
      setActionStatus(`${item.title} failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  const chatEvidence = (runtime?.evidence ?? []).filter((record) => record.kind === "workbench" && record.subject.startsWith("Chat action intent:"));

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)]">
      <Panel title="Chat-ready operator prompts" count={prompts.length}>
        <div className="grid gap-2 p-3">
          {prompts.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
                <ToneBadge tone={item.tone}>prompt</ToneBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.prompt}</p>
              <button
                type="button"
                className="mt-3 rounded border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                onClick={() => void recordIntent(item)}
              >
                Record intent
              </button>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Open chat and evidence" count={chatEvidence.length}>
        <div className="grid gap-3 p-3">
          {error ? <PolicyCallout title="Showing cached runtime evidence" detail={error} tone="warning" /> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <MiniFact label="Runtime evidence" value={runtime?.evidence.length ?? "..."} />
            <MiniFact label="Recorded intents" value={chatEvidence.length} />
          </div>
          <Link
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:bg-primary/5"
            to="/chat"
          >
            <span className="inline-flex items-center gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden />
              Continue in Hermes chat
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {actionStatus ? <p className="text-xs font-medium text-muted-foreground">{actionStatus}</p> : null}
          {chatEvidence.slice(0, 4).map((record) => (
            <article key={record.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{record.subject.replace("Chat action intent: ", "")}</h2>
                <ToneBadge tone="success">{record.state}</ToneBadge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{record.detail}</p>
            </article>
          ))}
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use chat for judgment and approvals. Use the Operate pages for the compact state map.
          </p>
        </div>
      </Panel>
    </section>
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

function SignalRow({ signal }: { signal: LiveSignalIntegration }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{signal.project}</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{signal.endpoint}</p>
        </div>
        <ToneBadge tone={signal.status === "ready" ? "success" : signal.status === "partial" ? "warning" : "critical"}>{signal.status}</ToneBadge>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{signal.nextStep}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {signal.signals.map((item) => (
          <span key={item} className="rounded border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {item}
          </span>
        ))}
      </div>
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

function toneForOperateSeverity(severity: OperateItem["severity"]): Tone {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  if (severity === "ready") return "success";
  return "info";
}

function toneForOperateState(state: OperateItem["state"]): Tone {
  if (state === "blocked" || state === "gated") return "critical";
  if (state === "review" || state === "stale") return "warning";
  if (state === "ready" || state === "done") return "success";
  return "info";
}

function labelForBlockerKind(kind: OperatingBlockerKind) {
  switch (kind) {
    case "manual_approval":
      return "Manual approval";
    case "infrastructure_dependency":
      return "Infrastructure dependency";
    case "live_readiness_gate":
      return "Live readiness";
    case "safety_gate":
      return "Safety gate";
    case "risk_review":
      return "High-risk review";
    case "roadmap_gate":
    default:
      return "Roadmap gate";
  }
}

function toneForBlockerKind(kind: OperatingBlockerKind): Tone {
  switch (kind) {
    case "manual_approval":
    case "safety_gate":
      return "critical";
    case "infrastructure_dependency":
    case "live_readiness_gate":
      return "warning";
    case "risk_review":
      return "info";
    case "roadmap_gate":
    default:
      return "neutral";
  }
}
