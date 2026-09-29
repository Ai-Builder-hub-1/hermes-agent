import type {
  DecisionRecord,
  OperatingLoop,
  OperatingSystemStage,
  PermissionPolicy,
  RoutedTask,
} from "@/pages/operating-system-data";
import type { FleetOperatorSnapshot } from "@/pages/fleet-operator-data";
import type { OperatingRuntimeState, RuntimeEvidenceRecord } from "@/pages/operating-runtime";
import { blockerStages, explainOperatingBlocker } from "./operate-blockers";

export type OperateItemKind = "blocker" | "action" | "incident" | "approval" | "run" | "evidence";
export type OperateItemSeverity = "critical" | "warning" | "info" | "ready";
export type OperateItemState = "blocked" | "gated" | "queued" | "assigned" | "ready" | "done" | "stale" | "review";

export interface OperateItem {
  id: string;
  kind: OperateItemKind;
  title: string;
  source: string;
  owner: string;
  severity: OperateItemSeverity;
  state: OperateItemState;
  whyItMatters: string;
  nextAction: string;
  clearingProof: string;
  evidence: string;
  safeAction: string | null;
  requiresApproval: boolean;
  updatedAt: string | null;
  route?: string;
}

export interface BuildOperateItemsInput {
  stages: OperatingSystemStage[];
  tasks: RoutedTask[];
  decisions: DecisionRecord[];
  policies: PermissionPolicy[];
  loops: OperatingLoop[];
  runtime: OperatingRuntimeState;
  fleetSnapshots?: FleetOperatorSnapshot[];
}

const NOWISH = "roadmap baseline";

export function buildOperateItems(input: BuildOperateItemsInput): OperateItem[] {
  return [
    ...blockerStages(input.stages).map(stageToBlockerItem),
    ...input.tasks.map(taskToActionItem),
    ...input.stages.filter(isIncidentStage).map(stageToIncidentItem),
    ...input.decisions.filter((decision) => decision.status !== "superseded").map(decisionToApprovalItem),
    ...input.policies.filter((policy) => policy.approval !== "none" || policy.audit).map(policyToApprovalItem),
    ...input.loops.map(loopToRunItem),
    ...input.runtime.evidence.map(evidenceToOperateItem),
    ...(input.fleetSnapshots ?? []).map(fleetSnapshotToOperateItem),
  ];
}

export function itemsForKind(items: OperateItem[], kind: OperateItemKind): OperateItem[] {
  return items.filter((item) => item.kind === kind).sort(compareOperateItems);
}

export function attentionItems(items: OperateItem[]): OperateItem[] {
  return items
    .filter((item) => item.state !== "done" && item.severity !== "ready")
    .sort(compareOperateItems)
    .slice(0, 12);
}

export function operateSummary(items: OperateItem[]) {
  return {
    attention: attentionItems(items).length,
    blockers: itemsForKind(items, "blocker").length,
    approvals: itemsForKind(items, "approval").filter((item) => item.requiresApproval).length,
    executable: items.filter((item) => item.safeAction).length,
  };
}

function stageToBlockerItem(stage: OperatingSystemStage): OperateItem {
  const explanation = explainOperatingBlocker(stage);
  return {
    id: `blocker-${stage.version}`,
    kind: "blocker",
    title: `${stage.version} ${stage.title}`,
    source: explanation.origin,
    owner: stage.owner,
    severity: stage.risk === "high" ? "critical" : "warning",
    state: stage.status === "gated" ? "gated" : "review",
    whyItMatters: explanation.meaning,
    nextAction: explanation.gatedRows[0]?.nextStep ?? stage.sectionDescription,
    clearingProof: explanation.clearingProof,
    evidence: stage.primaryMetric,
    safeAction: stage.route,
    requiresApproval: stage.risk === "high" || stage.status === "gated",
    updatedAt: NOWISH,
    route: stage.route,
  };
}

function taskToActionItem(task: RoutedTask): OperateItem {
  return {
    id: `action-${task.id}`,
    kind: "action",
    title: task.title,
    source: task.source,
    owner: task.owner,
    severity: priorityToSeverity(task.priority),
    state: task.status,
    whyItMatters: "This is a routed operator task that should either move forward, be assigned, or be explicitly blocked.",
    nextAction: task.nextStep,
    clearingProof: task.status === "done" ? "No further proof required." : "Record completion evidence or the blocker preventing completion.",
    evidence: task.source,
    safeAction: null,
    requiresApproval: task.priority === "critical",
    updatedAt: NOWISH,
  };
}

function stageToIncidentItem(stage: OperatingSystemStage): OperateItem {
  const gated = stage.rows.find((row) => row.state === "gated" || row.state === "blocked");
  return {
    id: `incident-readiness-${stage.version}`,
    kind: "incident",
    title: `${stage.version} ${stage.title}`,
    source: "Incident readiness roadmap",
    owner: stage.owner,
    severity: stage.risk === "high" ? "critical" : "warning",
    state: stage.status === "ready" ? "ready" : stage.status === "gated" ? "gated" : "review",
    whyItMatters: stage.sectionDescription,
    nextAction: gated?.nextStep ?? "Attach severity, owner, rollback path, and evidence before enabling automation.",
    clearingProof: "An incident path is cleared when it has evidence capture, owner routing, dedupe/acknowledgement rules, and rollback or no-op proof.",
    evidence: stage.primaryMetric,
    safeAction: stage.route,
    requiresApproval: stage.risk === "high",
    updatedAt: NOWISH,
    route: stage.route,
  };
}

function decisionToApprovalItem(decision: DecisionRecord): OperateItem {
  return {
    id: `approval-${decision.id}`,
    kind: "approval",
    title: decision.decision,
    source: "Decision ledger",
    owner: decision.owner,
    severity: decision.status === "needs-review" ? "warning" : "info",
    state: decision.status === "needs-review" ? "review" : "ready",
    whyItMatters: decision.reason,
    nextAction: decision.status === "needs-review" ? "Review and either reaffirm or supersede this decision." : "No action unless conditions have changed.",
    clearingProof: "Record the review date, owner, and whether the decision remains active or is superseded.",
    evidence: `Reviewed ${decision.reviewedAt}`,
    safeAction: null,
    requiresApproval: decision.status === "needs-review",
    updatedAt: decision.reviewedAt,
  };
}

function policyToApprovalItem(policy: PermissionPolicy): OperateItem {
  return {
    id: `approval-policy-${policy.id}`,
    kind: "approval",
    title: policy.action,
    source: "Permission policy",
    owner: policy.level,
    severity: policy.approval === "explicit" ? "critical" : policy.approval === "confirm" ? "warning" : "info",
    state: policy.approval === "explicit" ? "gated" : "ready",
    whyItMatters: "Permission policy decides whether Hermes can view, refresh, deploy, or change credentials.",
    nextAction: policy.approval === "explicit" ? "Require explicit operator approval before execution." : "Keep audit policy visible for operator review.",
    clearingProof: policy.audit ? "Audit record must be written for this action." : "Policy can run without audit only while risk remains low.",
    evidence: `approval=${policy.approval}; audit=${policy.audit ? "required" : "not required"}`,
    safeAction: null,
    requiresApproval: policy.approval === "explicit",
    updatedAt: NOWISH,
  };
}

function loopToRunItem(loop: OperatingLoop): OperateItem {
  return {
    id: `run-${loop.id}`,
    kind: "run",
    title: loop.name,
    source: "Operating loop registry",
    owner: loop.owner,
    severity: loop.status === "ready" ? "ready" : loop.status === "paused" ? "warning" : "info",
    state: loop.status === "ready" ? "ready" : loop.status === "paused" ? "blocked" : "queued",
    whyItMatters: loop.output,
    nextAction: loop.status === "ready" ? "Run manually or keep on cadence with audit evidence." : "Define the missing gate before scheduling.",
    clearingProof: "Each run should finish with a report, changed state, or explicit no-op reason.",
    evidence: loop.cadence,
    safeAction: loop.status === "ready" ? "manual-run" : null,
    requiresApproval: loop.status !== "ready",
    updatedAt: NOWISH,
  };
}

function evidenceToOperateItem(record: RuntimeEvidenceRecord): OperateItem {
  const bad = ["blocked", "gated", "warning", "failed"].includes(record.state);
  return {
    id: `evidence-${record.id}`,
    kind: "evidence",
    title: record.subject,
    source: `Runtime evidence / ${record.kind}`,
    owner: record.owner,
    severity: record.state === "failed" || record.state === "blocked" ? "critical" : bad ? "warning" : "ready",
    state: record.state === "failed" ? "blocked" : record.state === "warning" ? "review" : record.state === "stored" || record.state === "allowed" ? "ready" : record.state,
    whyItMatters: record.detail,
    nextAction: bad ? "Review the evidence and either attach clearing proof or keep it gated." : "Use as supporting proof for related operating work.",
    clearingProof: bad ? "A fresh evidence record must show ready/stored/allowed before this stops needing attention." : "Evidence is currently acceptable.",
    evidence: record.detail,
    safeAction: null,
    requiresApproval: bad,
    updatedAt: record.updatedAt,
  };
}

function fleetSnapshotToOperateItem(snapshot: FleetOperatorSnapshot): OperateItem {
  const health = snapshot.latestCheck?.checks.health;
  const dashboard = snapshot.latestCheck?.checks.snapshot;
  const pressure = snapshot.latestCheck?.pressure;
  const failed = snapshot.latestCheck?.status !== "passed";
  const pressureFailed = pressure?.status === "failed";
  const severity: OperateItemSeverity = failed ? "critical" : pressureFailed ? "warning" : "ready";
  const state: OperateItemState = failed ? "blocked" : pressureFailed ? "review" : "ready";
  const pressureDetail = pressure?.violations.length
    ? pressure.violations.map((violation) => `${violation.check} ${violation.actual}/${violation.budget}${violation.unit}`).join("; ")
    : "health and snapshot are inside fleet pressure budget";
  const endpointDetail = [
    `health=${health?.status ?? health?.error ?? "missing"} ${health?.ms ?? 0}ms`,
    `snapshot=${dashboard?.status ?? dashboard?.error ?? "missing"} ${dashboard?.ms ?? 0}ms`,
  ].join("; ");

  return {
    id: `fleet-${snapshot.projectId}`,
    kind: failed ? "incident" : pressureFailed ? "action" : "evidence",
    title: `${snapshot.label} production snapshot`,
    source: "Fleet monitoring registry",
    owner: snapshot.owner,
    severity,
    state,
    whyItMatters: "Hermes daily operation depends on child-system health, freshness, and cheap dashboard snapshots matching production reality.",
    nextAction: failed
      ? "Repair or re-run the production health and dashboard snapshot check; keep child-system actions gated until monitoring passes."
      : pressureFailed
        ? "Trim the endpoint payload or latency, then rerun the strict fleet pressure check."
        : "Keep monitoring on cadence; use drill-through only when this system needs attention.",
    clearingProof: failed
      ? "Strict fleet monitoring check passes with health and snapshot status 200."
      : pressureFailed
        ? "Strict fleet pressure check passes with no latency or payload violations."
        : "Latest fleet monitoring check is passing.",
    evidence: `${endpointDetail}; ${pressureDetail}`,
    safeAction: "dashboard:monitoring:check:strict",
    requiresApproval: failed || pressureFailed,
    updatedAt: snapshot.latestCheck?.capturedAt ?? null,
    route: snapshot.projectId === "khashi-vc" || snapshot.projectId === "investing-system" ? "/trading" : "/system/freshness",
  };
}

function isIncidentStage(stage: OperatingSystemStage): boolean {
  return /incident|production|sweep|breaker|promotion|release|deploy/i.test(`${stage.title} ${stage.route}`);
}

function priorityToSeverity(priority: RoutedTask["priority"]): OperateItemSeverity {
  if (priority === "critical") return "critical";
  if (priority === "high") return "warning";
  if (priority === "normal") return "info";
  return "ready";
}

function compareOperateItems(left: OperateItem, right: OperateItem): number {
  return severityRank(right.severity) - severityRank(left.severity)
    || stateRank(right.state) - stateRank(left.state)
    || left.title.localeCompare(right.title);
}

function severityRank(severity: OperateItemSeverity): number {
  if (severity === "critical") return 4;
  if (severity === "warning") return 3;
  if (severity === "info") return 2;
  return 1;
}

function stateRank(state: OperateItemState): number {
  if (state === "blocked") return 7;
  if (state === "gated") return 6;
  if (state === "review") return 5;
  if (state === "stale") return 4;
  if (state === "assigned") return 3;
  if (state === "queued") return 2;
  if (state === "ready") return 1;
  return 0;
}
