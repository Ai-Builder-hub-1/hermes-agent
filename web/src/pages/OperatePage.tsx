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
import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  businessScorecards,
  decisionLedger,
  liveSignalIntegrations,
  operatingLoops,
  operatingSystemStages,
  permissionPolicies,
  routedTasks,
  type DecisionRecord,
  type LiveSignalIntegration,
  type OperatingLoop,
  type OperatingSystemStage,
  type PermissionPolicy,
  type RoutedTask,
} from "./operating-system-data";

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
  const blockers = operatingSystemStages.filter((stage) => stage.risk === "high" || stage.status === "gated");
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
  const approvalPolicies = permissionPolicies.filter((policy) => policy.approval !== "none" || policy.audit);

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
            <MiniStat label="Open actions" value={routedTasks.filter((task) => task.status !== "done").length} />
            <MiniStat label="Gated work" value={blockers.length} />
          </div>
        </div>
      </section>

      {mode === "overview" ? (
        <Overview blockers={blockers} />
      ) : mode === "blockers" ? (
        <Blockers blockers={blockers} />
      ) : mode === "actions" ? (
        <Actions tasks={routedTasks} />
      ) : mode === "incidents" ? (
        <Incidents incidents={incidents} />
      ) : mode === "approvals" ? (
        <Approvals decisions={decisionLedger} policies={approvalPolicies} />
      ) : mode === "runs" ? (
        <Runs loops={operatingLoops} />
      ) : (
        <ChatActions />
      )}
    </main>
  );
}

function Overview({ blockers }: { blockers: OperatingSystemStage[] }) {
  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Operator summary">
        <MetricCard label="Signal integrations" value={liveSignalIntegrations.length} detail="project feeds registered" tone="info" icon={Database} />
        <MetricCard label="Critical tasks" value={routedTasks.filter((task) => task.priority === "critical").length} detail="operator attention required" tone="critical" icon={AlertTriangle} />
        <MetricCard label="Approval policies" value={permissionPolicies.filter((policy) => policy.approval !== "none").length} detail="confirm or explicit gates" tone="warning" icon={ShieldCheck} />
        <MetricCard label="Ready loops" value={operatingLoops.filter((loop) => loop.status === "ready").length} detail="manual-safe loop definitions" tone="success" icon={RotateCw} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.6fr)_minmax(360px,0.4fr)]">
        <Panel title="Next operator actions" count={routedTasks.length}>
          <div className="grid gap-2 p-3">
            {routedTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
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
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.58fr)_minmax(360px,0.42fr)]">
      <Panel title="Blocker queue" count={blockers.length}>
        <div className="grid gap-2 p-3">
          {blockers.map((stage) => (
            <StageRow key={stage.version} stage={stage} />
          ))}
        </div>
      </Panel>
      <Panel title="Why blocked">
        <div className="grid gap-3 p-3">
          {blockers.slice(0, 5).map((stage) => (
            <article key={stage.version} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{stage.title}</h2>
                <ToneBadge tone={stage.risk === "high" ? "critical" : "warning"}>{stage.risk} risk</ToneBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.sectionDescription}</p>
              <div className="mt-3 grid gap-2">
                {stage.rows.filter((row) => row.state === "gated" || row.state === "blocked").map((row) => (
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

function Actions({ tasks }: { tasks: RoutedTask[] }) {
  const ordered = [...tasks].sort((left, right) => priorityRank(right.priority) - priorityRank(left.priority));
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.64fr)_minmax(320px,0.36fr)]">
      <Panel title="Routed actions" count={ordered.length}>
        <div className="grid gap-2 p-3">
          {ordered.map((task) => (
            <TaskRow key={task.id} task={task} />
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

function Incidents({ incidents }: { incidents: OperatingSystemStage[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
      <Panel title="Incident readiness" count={incidents.length}>
        <div className="grid gap-2 p-3">
          {incidents.map((stage) => (
            <StageRow key={stage.version} stage={stage} />
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

function Approvals({ decisions, policies }: { decisions: DecisionRecord[]; policies: PermissionPolicy[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.56fr)_minmax(380px,0.44fr)]">
      <Panel title="Decision ledger" count={decisions.length}>
        <div className="grid gap-2 p-3">
          {decisions.map((decision) => (
            <article key={decision.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{decision.decision}</h2>
                <ToneBadge tone={decision.status === "active" ? "success" : decision.status === "needs-review" ? "warning" : "neutral"}>{decision.status}</ToneBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{decision.reason}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MiniFact label="Owner" value={decision.owner} />
                <MiniFact label="Reviewed" value={decision.reviewedAt} />
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Permission policies" count={policies.length}>
        <div className="grid gap-2 p-3">
          {policies.map((policy) => (
            <article key={policy.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{policy.action}</h2>
                <ToneBadge tone={policy.approval === "explicit" ? "critical" : policy.approval === "confirm" ? "warning" : "info"}>{policy.approval}</ToneBadge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MiniFact label="Level" value={policy.level} />
                <MiniFact label="Audit" value={policy.audit ? "required" : "not required"} />
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Runs({ loops }: { loops: OperatingLoop[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
      <Panel title="Loop registry" count={loops.length}>
        <div className="grid gap-2 p-3">
          {loops.map((loop) => (
            <article key={loop.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{loop.name}</h2>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{loop.cadence}</p>
                </div>
                <ToneBadge tone={loop.status === "ready" ? "success" : loop.status === "paused" ? "warning" : "neutral"}>{loop.status}</ToneBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{loop.output}</p>
              <div className="mt-3">
                <MiniFact label="Owner" value={loop.owner} />
              </div>
            </article>
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
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Open chat">
        <div className="p-3">
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

function TaskRow({ task }: { task: RoutedTask }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{task.title}</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{task.source}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ToneBadge tone={task.priority === "critical" ? "critical" : task.priority === "high" ? "warning" : "info"}>{task.priority}</ToneBadge>
          <ToneBadge tone={task.status === "blocked" ? "critical" : task.status === "done" ? "success" : "neutral"}>{task.status}</ToneBadge>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{task.nextStep}</p>
      <div className="mt-3">
        <MiniFact label="Owner" value={task.owner} />
      </div>
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

function priorityRank(priority: RoutedTask["priority"]) {
  return priority === "critical" ? 4 : priority === "high" ? 3 : priority === "normal" ? 2 : 1;
}
