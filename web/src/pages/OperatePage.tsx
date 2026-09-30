import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  MessageSquare,
  Radio,
  RotateCw,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ActionResultHistory } from "@/components/ActionResultHistory";
import { fetchJSON } from "@/lib/api";
import {
  attentionItems,
  buildOperateItems,
  itemsForKind,
  operateSummary,
  type OperateItem,
} from "@/lib/operate-items";
import {
  auditOperationalContract,
  auditOperationalPages,
  contractForRoute,
  type OperationalPageAudit,
} from "@/lib/operational-page-contracts";
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
  loadUnifiedOperatorQueue,
  type FleetOperatorQueueResponse,
  type FleetOperatorQueueItem,
  type FleetOperatorSnapshot,
} from "./fleet-operator-data";
import { loadOperatingRuntimeState } from "./operating-runtime";
import {
  loadOperatingRuntimeStateFromServer,
  recordOperatorActionCloseout,
  recordChatActionIntent,
  recordOperatorQueueIntent,
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
type FreshnessState = "fresh" | "aging" | "stale" | "unknown";
type QueueLoadState = "loading" | "live" | "fallback" | "error";

interface OperateControlBackbone {
  contractVersion: string;
  generatedAt: string;
  summary: {
    categories: number;
    ready: number;
    partial: number;
    missing: number;
    controlPlaneEnough: boolean;
    posture: string;
  };
  items: Array<{
    id: string;
    label: string;
    status: string;
    controlPlaneEnough: boolean;
    evidence: string[];
    missing: string[];
    nextAction: string;
  }>;
  recommendations: string[];
}

type OperateStatusModel = {
  label: string;
  tone: Tone;
  detail: string;
  freshness: FreshnessState;
};

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
  const route = routeForMode(mode);
  const contract = contractForRoute(route);
  const audit = contract ? auditOperationalContract(contract) : null;
  const proof = operationalProofSummary();
  const blockers = blockerStages(operatingSystemStages);
  const runtime = useMemo(() => loadOperatingRuntimeState(), []);
  const [fleetSnapshots, setFleetSnapshots] = useState<FleetOperatorSnapshot[]>(fallbackFleetOperatorSnapshots);
  const [unifiedQueue, setUnifiedQueue] = useState<FleetOperatorQueueResponse | null>(null);
  const [queueLoadState, setQueueLoadState] = useState<QueueLoadState>("loading");
  const [queueLoadError, setQueueLoadError] = useState<string | null>(null);
  const [controlBackbone, setControlBackbone] = useState<OperateControlBackbone | null>(null);
  const [evidenceItem, setEvidenceItem] = useState<OperateItem | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadFleetOperatorSnapshots()
      .then((snapshots) => {
        if (!cancelled) setFleetSnapshots(snapshots);
      })
      .catch(() => {
        if (!cancelled) setFleetSnapshots(fallbackFleetOperatorSnapshots);
      });
    loadUnifiedOperatorQueue(50)
      .then((queue) => {
        if (!cancelled) {
          setUnifiedQueue(queue);
          setQueueLoadState(queue?.items.length ? "live" : "fallback");
          setQueueLoadError(null);
        }
      })
      .catch((exc) => {
        if (!cancelled) {
          setUnifiedQueue(null);
          setQueueLoadState("error");
          setQueueLoadError(exc instanceof Error ? exc.message : String(exc));
        }
      });
    fetchJSON<OperateControlBackbone>("/api/operate/control-backbone")
      .then((audit) => {
        if (!cancelled) setControlBackbone(audit);
      })
      .catch(() => {
        if (!cancelled) setControlBackbone(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const baselineOperateItems = useMemo(() => buildOperateItems({
    stages: operatingSystemStages,
    tasks: routedTasks,
    decisions: decisionLedger,
    policies: permissionPolicies,
    loops: operatingLoops,
    runtime,
    fleetSnapshots,
  }), [fleetSnapshots, runtime]);
  const liveOperateItems = useMemo(() => (unifiedQueue?.items ?? []).map(queueItemToOperateItem), [unifiedQueue]);
  const operateItems = liveOperateItems.length ? liveOperateItems : baselineOperateItems;
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
            <MiniStat label="Queue source" value={labelForQueueLoadState(queueLoadState)} />
            <MiniStat label={audit ? "Page maturity" : "Contract"} value={audit ? `${audit.score}%` : "missing"} />
            <MiniStat label="Proof routes" value={`${proof.readyRoutes}/${proof.routes}`} />
          </div>
        </div>
      </section>

      {audit ? <PageContractStrip audit={audit} proof={proof} /> : null}
      <ActionResultHistory route={route} compact />
      <QueueLoadBanner state={queueLoadState} error={queueLoadError} />
      {controlBackbone ? <ControlBackbonePanel audit={controlBackbone} /> : null}

      {mode === "overview" ? (
        <Overview blockers={blockers} items={operateItems} onOpenEvidence={setEvidenceItem} />
      ) : mode === "blockers" ? (
        <Blockers blockers={blockers} />
      ) : mode === "actions" ? (
        <Actions items={itemsForKind(operateItems, "action")} onOpenEvidence={setEvidenceItem} />
      ) : mode === "incidents" ? (
        <Incidents incidents={incidents} items={itemsForKind(operateItems, "incident")} onOpenEvidence={setEvidenceItem} />
      ) : mode === "approvals" ? (
        <Approvals items={itemsForKind(operateItems, "approval")} onOpenEvidence={setEvidenceItem} />
      ) : mode === "runs" ? (
        <Runs items={itemsForKind(operateItems, "run")} onOpenEvidence={setEvidenceItem} />
      ) : (
        <ChatActions />
      )}
      <EvidenceDrawer item={evidenceItem} onClose={() => setEvidenceItem(null)} />
    </main>
  );
}

function routeForMode(mode: OperateMode) {
  const routes: Record<OperateMode, string> = {
    overview: "/operate",
    blockers: "/operate/blockers",
    actions: "/operate/actions",
    incidents: "/operate/incidents",
    approvals: "/operate/approvals",
    runs: "/operate/runs",
    "chat-actions": "/operate/chat-actions",
  };
  return routes[mode];
}

function routeForOperateItemKind(kind: OperateItem["kind"]) {
  if (kind === "incident") return "/operate/incidents";
  if (kind === "approval") return "/operate/approvals";
  if (kind === "run") return "/operate/runs";
  if (kind === "action") return "/operate/actions";
  if (kind === "blocker") return "/operate/blockers";
  return "/operate/evidence";
}

function operationalProofSummary() {
  const audits = auditOperationalPages();
  const readyRoutes = audits.filter((item) => item.status === "ready").length;
  const failedRoutes = audits.length - readyRoutes;
  const operate = auditOperationalPages("operate");
  return {
    routes: audits.length,
    readyRoutes,
    failedRoutes,
    operateRoutes: operate.length,
    operateReady: operate.filter((item) => item.status === "ready").length,
  };
}

function Overview({
  blockers,
  items,
  onOpenEvidence,
}: {
  blockers: OperatingSystemStage[];
  items: OperateItem[];
  onOpenEvidence: (item: OperateItem) => void;
}) {
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
            {attention.length ? (
              attention.map((item) => <OperateItemRow key={item.id} item={item} onOpenEvidence={onOpenEvidence} />)
            ) : (
              <EmptyState title="No attention items" detail="The current queue has no blocked, gated, stale, review, or critical operator items." />
            )}
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

function queueItemToOperateItem(item: FleetOperatorQueueItem): OperateItem {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    source: item.source,
    owner: item.owner,
    severity: item.severity,
    state: item.state,
    whyItMatters: item.whyItMatters,
    nextAction: item.nextAction,
    clearingProof: item.clearingProof,
    evidence: item.evidence,
    safeAction: item.safeAction,
    requiresApproval: item.requiresApproval,
    updatedAt: item.updatedAt,
    route: item.route,
  };
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

function OperateItemRow({ item, onOpenEvidence }: { item: OperateItem; onOpenEvidence?: (item: OperateItem) => void }) {
  const status = statusForOperateItem(item);

  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusFreshnessCluster item={item} />
          <h2 className="mt-2 text-sm font-semibold text-foreground">{item.title}</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{item.source}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {onOpenEvidence ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted"
              onClick={() => onOpenEvidence(item)}
            >
              <Database className="h-3 w-3" aria-hidden />
              Evidence
            </button>
          ) : null}
          {item.route ? (
            <Link to={item.route} className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted">
              Open
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          ) : item.safeAction ? (
            <span className="rounded border border-border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">{item.safeAction}</span>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{status.detail}</p>
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

function StatusFreshnessCluster({ item }: { item: OperateItem }) {
  const status = statusForOperateItem(item);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToneBadge tone={status.tone}>{status.label}</ToneBadge>
      <FreshnessBadge freshness={status.freshness} />
      {item.requiresApproval ? <ToneBadge tone="warning">approval</ToneBadge> : null}
    </div>
  );
}

function FreshnessBadge({ freshness }: { freshness: FreshnessState }) {
  const copy: Record<FreshnessState, { label: string; tone: Tone }> = {
    fresh: { label: "fresh", tone: "success" },
    aging: { label: "aging", tone: "warning" },
    stale: { label: "stale", tone: "critical" },
    unknown: { label: "freshness unknown", tone: "neutral" },
  };
  const selected = copy[freshness];

  return <ToneBadge tone={selected.tone}>{selected.label}</ToneBadge>;
}

function EvidenceDrawer({ item, onClose }: { item: OperateItem | null; onClose: () => void }) {
  const [closeoutStatus, setCloseoutStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setCloseoutStatus(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item) return null;
  const status = statusForOperateItem(item);
  const checklist = checklistForOperateItem(item, status.freshness);
  const recordCloseout = async () => {
    setCloseoutStatus("Recording no-op closeout");
    try {
      const state = loadOperatingRuntimeState();
      await recordOperatorActionCloseout(state, item, "no-op");
      setCloseoutStatus("No-op closeout recorded");
    } catch (exc) {
      setCloseoutStatus(`Closeout failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 p-3 sm:p-4" role="presentation" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="operate-evidence-title"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-muted p-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence drilldown</div>
            <h2 id="operate-evidence-title" className="mt-1 text-lg font-semibold leading-6 text-foreground">
              {item.title}
            </h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{item.source}</p>
          </div>
          <button
            type="button"
            aria-label="Close evidence drawer"
            className="rounded border border-border bg-card p-2 text-muted-foreground hover:bg-background hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusFreshnessCluster item={item} />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{status.detail}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <MiniFact label="Owner" value={item.owner} />
            <MiniFact label="State" value={item.state} />
            <MiniFact label="Severity" value={item.severity} />
            <MiniFact label="Updated" value={item.updatedAt ?? "not reported"} />
          </div>

          <div className="mt-4 grid gap-3">
            <EvidenceSection title="Why it matters" detail={item.whyItMatters} />
            <EvidenceSection title="Next action" detail={item.nextAction} />
            <EvidenceSection title="Clearing proof" detail={item.clearingProof} />
            <EvidenceSection title="Evidence source" detail={item.evidence} />
            <EvidenceSection title="Safe action" detail={item.safeAction ?? "No direct safe action is registered for this item."} />
          </div>

          <section className="mt-4 rounded-lg border border-border bg-background p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closeout packet</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <MiniFact label="Result path" value="no-op / completed / denied / superseded" />
              <MiniFact label="Approval" value={item.requiresApproval ? "explicit or denied" : "none or confirm"} />
              <MiniFact label="Audit action" value={item.safeAction ?? `review:${item.id}`} />
              <MiniFact label="Route backlink" value={item.route ?? "not linked"} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Recording a closeout stores the result and proof in the operating runtime. It does not execute the underlying action.
            </p>
            <button
              type="button"
              className="mt-3 rounded border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              onClick={() => void recordCloseout()}
            >
              Record no-op closeout
            </button>
            {closeoutStatus ? <p className="mt-2 text-xs font-medium text-muted-foreground">{closeoutStatus}</p> : null}
          </section>

          <div className="mt-4">
            <ActionResultHistory route={item.route ?? routeForOperateItemKind(item.kind)} compact />
          </div>

          <section className="mt-4 rounded-lg border border-border bg-background p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operator checklist</h3>
            <div className="mt-3 grid gap-2">
              {checklist.map((entry) => (
                <div key={entry.label} className="flex items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2">
                  {entry.done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-foreground">{entry.label}</div>
                    <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{entry.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted p-4">
          {item.route ? (
            <Link
              to={item.route}
              className="inline-flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-card"
              onClick={onClose}
            >
              Open route
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
          <button
            type="button"
            className="rounded border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-background"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

function EvidenceSection({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="rounded-lg border border-border bg-background p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground">{detail}</p>
    </section>
  );
}

function Actions({ items, onOpenEvidence }: { items: OperateItem[]; onOpenEvidence: (item: OperateItem) => void }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.64fr)_minmax(320px,0.36fr)]">
      <Panel title="Routed actions" count={items.length}>
        <div className="grid gap-2 p-3">
          {items.length ? (
            items.map((item) => <OperateItemRow key={item.id} item={item} onOpenEvidence={onOpenEvidence} />)
          ) : (
            <EmptyState title="No routed actions" detail="No action items are currently available from the live queue or fallback operating registry." />
          )}
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

function Incidents({
  incidents,
  items,
  onOpenEvidence,
}: {
  incidents: OperatingSystemStage[];
  items: OperateItem[];
  onOpenEvidence: (item: OperateItem) => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
      <Panel title="Incident readiness" count={incidents.length}>
        <div className="grid gap-2 p-3">
          {items.length ? (
            items.map((item) => <OperateItemRow key={item.id} item={item} onOpenEvidence={onOpenEvidence} />)
          ) : (
            <EmptyState title="No incident queue items" detail="No incident rows are currently available. Check the response policy before treating this as full production health." />
          )}
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

function Approvals({ items, onOpenEvidence }: { items: OperateItem[]; onOpenEvidence: (item: OperateItem) => void }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.56fr)_minmax(380px,0.44fr)]">
      <Panel title="Approval inbox" count={items.length}>
        <div className="grid gap-2 p-3">
          {items.length ? (
            items.map((item) => <OperateItemRow key={item.id} item={item} onOpenEvidence={onOpenEvidence} />)
          ) : (
            <EmptyState title="No approval items" detail="No approval rows are currently available. High-risk actions still require explicit approval when they appear." />
          )}
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

function Runs({ items, onOpenEvidence }: { items: OperateItem[]; onOpenEvidence: (item: OperateItem) => void }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
      <Panel title="Loop registry" count={items.length}>
        <div className="grid gap-2 p-3">
          {items.length ? (
            items.map((item) => <OperateItemRow key={item.id} item={item} onOpenEvidence={onOpenEvidence} />)
          ) : (
            <EmptyState title="No loop registry items" detail="No run loops are currently available from the queue or operating registry." />
          )}
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
  const [queue, setQueue] = useState<FleetOperatorQueueResponse | null>(null);
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
    loadUnifiedOperatorQueue(6).then(setQueue);
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

  const recordQueueIntent = async (item: { id: string; title: string; safeAction: string | null; route?: string }) => {
    if (!runtime) return;
    setActionStatus(`${item.title} recording`);
    try {
      setRuntime(await recordOperatorQueueIntent(runtime, item));
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
            <MiniFact label="Fleet attention" value={queue?.summary.attention ?? "..."} />
            <MiniFact label="Blocked systems" value={queue?.summary.blocked ?? "..."} />
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
          {queue?.items.slice(0, 3).map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
                <ToneBadge tone={toneForOperateSeverity(item.severity)}>{item.state}</ToneBadge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.nextAction}</p>
              <button
                type="button"
                className="mt-3 rounded border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                onClick={() => void recordQueueIntent(item)}
              >
                Record queue intent
              </button>
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

function QueueLoadBanner({ state, error }: { state: QueueLoadState; error: string | null }) {
  if (state === "live") return null;
  const copy: Record<Exclude<QueueLoadState, "live">, { title: string; detail: string; tone: Tone }> = {
    loading: {
      title: "Loading live operator queue",
      detail: "The page is hydrating the live queue. Fallback rows remain visible so the operator surface does not go blank.",
      tone: "info",
    },
    fallback: {
      title: "Showing fallback registry",
      detail: "No live queue rows were returned, so the page is using the local operating registry as the visible control surface.",
      tone: "warning",
    },
    error: {
      title: "Live queue unavailable",
      detail: error ? `Showing fallback registry because the live queue request failed: ${error}` : "Showing fallback registry because the live queue request failed.",
      tone: "critical",
    },
  };
  const selected = copy[state];

  return <PolicyCallout title={selected.title} detail={selected.detail} tone={selected.tone} />;
}

function ControlBackbonePanel({ audit }: { audit: OperateControlBackbone }) {
  return (
    <section className="rounded-lg border border-border bg-card p-3 shadow-sm" data-review-id="hermes.operate.control-backbone">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]">
        <div className="grid gap-2 sm:grid-cols-4 xl:grid-cols-2">
          <MiniStat label="Control proof" value={`${audit.summary.ready}/${audit.summary.categories}`} />
          <MiniStat label="Posture" value={audit.summary.posture} />
          <MiniStat label="Partial" value={audit.summary.partial} />
          <MiniStat label="Missing" value={audit.summary.missing} />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {audit.items.map((item) => (
            <PolicyCallout
              key={item.id}
              title={`${item.label}: ${item.status}`}
              detail={item.controlPlaneEnough ? item.evidence.slice(0, 2).join(" | ") || "Local control-plane rows are present." : item.missing.join("; ") || item.nextAction}
              tone={toneForControlBackbone(item.status)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PageContractStrip({
  audit,
  proof,
}: {
  audit: OperationalPageAudit;
  proof: ReturnType<typeof operationalProofSummary>;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-3 shadow-sm" data-review-id={`hermes.page-contract.${audit.route}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge tone={audit.status === "ready" ? "success" : audit.status === "blocked" ? "critical" : "warning"}>{audit.status}</ToneBadge>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{audit.maturity} surface</span>
            <ToneBadge tone={proof.failedRoutes ? "warning" : "success"}>{proof.readyRoutes}/{proof.routes} proofed</ToneBadge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Next maturity action: <span className="font-medium text-foreground">{audit.nextAction}</span>
          </p>
        </div>
        <div className="grid min-w-[260px] gap-2 sm:grid-cols-3">
          <MiniStat label="Contract score" value={`${audit.score}%`} />
          <MiniStat label="Missing" value={audit.missing.length} />
          <MiniStat label="Operate proof" value={`${proof.operateReady}/${proof.operateRoutes}`} />
        </div>
      </div>
      {audit.missing.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {audit.missing.slice(0, 6).map((item) => (
            <span key={item} className="rounded border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function toneForControlBackbone(status: string): Tone {
  if (status === "ready") return "success";
  if (status === "missing") return "warning";
  if (status === "partial") return "info";
  return "neutral";
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <span className="rounded border border-border bg-card p-2 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
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

function statusForOperateItem(item: OperateItem): OperateStatusModel {
  const freshness = freshnessForUpdatedAt(item.updatedAt);
  const stateTone = toneForOperateState(item.state);
  const severityTone = toneForOperateSeverity(item.severity);
  const tone = item.state === "ready" || item.state === "done" ? stateTone : severityTone === "info" ? stateTone : severityTone;

  return {
    label: labelForOperateState(item.state),
    tone,
    freshness,
    detail: detailForOperateStatus(item, freshness),
  };
}

function labelForQueueLoadState(state: QueueLoadState) {
  switch (state) {
    case "loading":
      return "loading";
    case "live":
      return "live";
    case "fallback":
      return "fallback";
    case "error":
      return "fallback";
    default:
      return state;
  }
}

function checklistForOperateItem(item: OperateItem, freshness: FreshnessState) {
  return [
    {
      label: "Evidence source present",
      detail: item.evidence,
      done: Boolean(item.evidence),
    },
    {
      label: "Freshness confirmed",
      detail:
        freshness === "fresh"
          ? "Source timestamp is inside the daily operator window."
          : freshness === "aging"
            ? "Refresh before closing this item."
            : freshness === "stale"
              ? "Run a fresh proof check before action."
              : "Confirm source recency because no timestamp was reported.",
      done: freshness === "fresh",
    },
    {
      label: "Approval gate clear",
      detail: item.requiresApproval ? "Explicit approval is still required." : "No explicit approval gate is registered on this row.",
      done: !item.requiresApproval,
    },
    {
      label: "Closing proof defined",
      detail: item.clearingProof,
      done: Boolean(item.clearingProof),
    },
  ];
}

function labelForOperateState(state: OperateItem["state"]) {
  switch (state) {
    case "blocked":
      return "blocked";
    case "gated":
      return "gated";
    case "queued":
      return "queued";
    case "assigned":
      return "assigned";
    case "ready":
      return "ready";
    case "done":
      return "done";
    case "stale":
      return "stale";
    case "review":
      return "review";
    default:
      return state;
  }
}

function freshnessForUpdatedAt(updatedAt?: string | null): FreshnessState {
  if (!updatedAt) return "unknown";
  const timestamp = Date.parse(updatedAt);
  if (Number.isNaN(timestamp)) return "unknown";
  const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);
  if (ageHours <= 24) return "fresh";
  if (ageHours <= 72) return "aging";
  return "stale";
}

function detailForOperateStatus(item: OperateItem, freshness: FreshnessState) {
  const freshnessDetail: Record<FreshnessState, string> = {
    fresh: "Its source timestamp is inside the daily operator window.",
    aging: "Its source timestamp is older than the daily operator window and should be refreshed before closing.",
    stale: "Its source timestamp is stale enough to require a fresh proof check before action.",
    unknown: "Its source did not report a timestamp, so the operator should confirm recency before action.",
  };
  const approval = item.requiresApproval ? " It also requires explicit approval before execution." : "";

  return `${item.whyItMatters} ${freshnessDetail[freshness]}${approval}`;
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
