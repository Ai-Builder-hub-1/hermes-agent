import type { OperatingSystemStage } from "@/pages/operating-system-data";

export type OperatingBlockerKind =
  | "roadmap_gate"
  | "safety_gate"
  | "manual_approval"
  | "infrastructure_dependency"
  | "live_readiness_gate"
  | "risk_review";

export interface OperatingBlockerExplanation {
  kind: OperatingBlockerKind;
  label: string;
  origin: string;
  meaning: string;
  clearingProof: string;
  isLiveFailure: boolean;
  gatedRows: Array<{
    id: string;
    capability: string;
    nextStep: string;
  }>;
}

const ORIGIN = "Static operating-system maturity roadmap";

const INFRA_PATTERN = /\b(secret|hetzner|dns|tls|caddy|artifact|storage|billing|provider|github|server|ssh|env)\b/i;
const APPROVAL_PATTERN = /\b(approval|approved|human|manual|explicit)\b/i;
const LIVE_READINESS_PATTERN = /\b(production|incident|sweep|deploy|promotion|release|screenshot|health)\b/i;
const SAFETY_PATTERN = /\b(permission|gate|breaker|kill switch|audit|autonomy|scheduler|secret)\b/i;

export function blockerStages(stages: OperatingSystemStage[]): OperatingSystemStage[] {
  return stages.filter((stage) => stage.risk === "high" || stage.status === "gated");
}

export function explainOperatingBlocker(stage: OperatingSystemStage): OperatingBlockerExplanation {
  const gatedRows = stage.rows
    .filter((row) => row.state === "gated" || row.state === "blocked")
    .map((row) => ({
      id: row.id,
      capability: row.capability,
      nextStep: row.nextStep,
    }));
  const searchable = [
    stage.title,
    stage.route,
    stage.description,
    stage.sectionDescription,
    stage.primaryMetric,
    ...stage.cards.map((card) => `${card.label} ${card.detail}`),
    ...stage.rows.flatMap((row) => [row.capability, row.nextStep]),
  ].join(" ");

  const kind = classifyKind(stage, searchable);

  return {
    kind,
    label: labelForKind(kind),
    origin: ORIGIN,
    meaning: meaningForKind(kind, stage),
    clearingProof: clearingProofForKind(kind, stage, gatedRows),
    isLiveFailure: false,
    gatedRows,
  };
}

export function blockerKindCounts(stages: OperatingSystemStage[]): Record<OperatingBlockerKind, number> {
  const counts: Record<OperatingBlockerKind, number> = {
    roadmap_gate: 0,
    safety_gate: 0,
    manual_approval: 0,
    infrastructure_dependency: 0,
    live_readiness_gate: 0,
    risk_review: 0,
  };
  for (const stage of stages) {
    counts[explainOperatingBlocker(stage).kind] += 1;
  }
  return counts;
}

function classifyKind(stage: OperatingSystemStage, searchable: string): OperatingBlockerKind {
  if (stage.status === "ready" && stage.risk === "high") return "risk_review";
  if (APPROVAL_PATTERN.test(searchable)) return "manual_approval";
  if (INFRA_PATTERN.test(searchable)) return "infrastructure_dependency";
  if (SAFETY_PATTERN.test(searchable)) return "safety_gate";
  if (LIVE_READINESS_PATTERN.test(searchable)) return "live_readiness_gate";
  return "roadmap_gate";
}

function labelForKind(kind: OperatingBlockerKind): string {
  switch (kind) {
    case "manual_approval":
      return "Manual approval gate";
    case "infrastructure_dependency":
      return "Infrastructure dependency";
    case "live_readiness_gate":
      return "Live-readiness gate";
    case "safety_gate":
      return "Safety gate";
    case "risk_review":
      return "High-risk review";
    case "roadmap_gate":
    default:
      return "Roadmap gate";
  }
}

function meaningForKind(kind: OperatingBlockerKind, stage: OperatingSystemStage): string {
  switch (kind) {
    case "manual_approval":
      return "This is intentionally held until an operator approves live use or enough successful runs prove it is safe.";
    case "infrastructure_dependency":
      return "This needs production infrastructure evidence such as secrets, server paths, storage, DNS, SSH, provider access, or billing data.";
    case "live_readiness_gate":
      return "This is not reporting a live outage; it says the production workflow needs repeatable proof before automation increases.";
    case "safety_gate":
      return "This protects high-risk commands, autonomy, deployment, secrets, or scheduler behavior from running without guardrails.";
    case "risk_review":
      return "The capability is marked ready, but it remains on the blockers page because the stage is still high risk.";
    case "roadmap_gate":
    default:
      return `${stage.version} is a maturity roadmap gate, not automatically a production failure.`;
  }
}

function clearingProofForKind(
  kind: OperatingBlockerKind,
  stage: OperatingSystemStage,
  gatedRows: OperatingBlockerExplanation["gatedRows"],
): string {
  const firstStep = gatedRows[0]?.nextStep;
  const prefix = firstStep ? `${firstStep}` : `Complete the ${stage.title} gate.`;
  switch (kind) {
    case "manual_approval":
      return `${prefix} Record the approval decision, run result, and rollback/stop condition.`;
    case "infrastructure_dependency":
      return `${prefix} Attach server/config proof without exposing secret values.`;
    case "live_readiness_gate":
      return `${prefix} Attach fresh production health, screenshot, incident, or deploy evidence.`;
    case "safety_gate":
      return `${prefix} Prove the gate blocks unsafe execution and writes an audit record.`;
    case "risk_review":
      return `${prefix} Lower risk only after live evidence shows the workflow is repeatable and bounded.`;
    case "roadmap_gate":
    default:
      return `${prefix} Update the roadmap stage only after the evidence exists.`;
  }
}
