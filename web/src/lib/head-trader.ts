/**
 * Head Trader control plane — typed client.
 *
 * Contract source of truth is `hermes_cli/head_trader.py`. The Head Trader
 * proposes and routes; it never submits a live order, and the only controls it
 * can reach are the project-owned ones the trading-intelligence proxy already
 * publishes.
 *
 * Requests go through `fetchJSON`, never bare `fetch`: it attaches
 * `X-Hermes-Session-Token` for the loopback path, sends cookies for the gated
 * path, and prefixes `window.__HERMES_BASE_PATH__` behind a reverse proxy.
 */
import { fetchJSON } from "@/lib/api";

const BASE = "/api/head-trader";

export const HEAD_TRADER_CONTRACT = "head-trader-control-plane.v1";

// ---------------------------------------------------------------------------
// Contract types
// ---------------------------------------------------------------------------

export type DeskId = "oanda" | "khashi" | "cross_system" | (string & {});

export type IncidentStatus =
  | "open"
  | "waiting_for_human"
  | "approved"
  | "rejected"
  | "executing"
  | "executed"
  | "resolved"
  | "ignored"
  | "expired"
  | (string & {});

/** The ladder, least to most restricted. `hard_gate` and `forbidden` are never
 *  executable from this page — the backend refuses them at confirm time too. */
export type PermissionLevel =
  | "inform"
  | "auto_safe"
  | "approval_required"
  | "hard_gate"
  | "forbidden"
  | (string & {});

export type RiskLevel = "low" | "medium" | "high" | "critical" | (string & {});
export type IncidentSeverity = "info" | "watch" | "high" | "critical" | (string & {});
export type LiveTradingImpact = "none" | "paper_only" | "runtime_control" | "live_order" | (string & {});

export interface HeadTraderActionOption {
  id: string;
  label: string;
  actionId: string | null;
  expectedEffect: string;
  requiresConfirmation: boolean;
}

export interface HeadTraderIncident {
  id: string;
  sourceProject: string;
  desk: DeskId;
  type: string;
  severity: IncidentSeverity;
  title: string;
  summary: string;
  evidence: unknown;
  recommendation: string;
  options: HeadTraderActionOption[];
  status: IncidentStatus;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeskStatus {
  id: DeskId;
  label?: string;
  status?: string;
  projectId?: string;
  available?: boolean;
  blockers?: number | string[];
  [key: string]: unknown;
}

export interface HeadTraderSummary {
  id: string;
  contractVersion: string;
  frontendContractVersion: string;
  generatedAt: string;
  status: "ready" | "watch" | "blocked" | (string & {});
  liveTradingLocked: boolean;
  desks: DeskStatus[];
  kpis: {
    openIncidents: number;
    waitingForHuman: number;
    criticalIncidents: number;
    actionsAvailable: number;
    sourceProjectsAvailable: number | null;
    sourceProjectsTotal: number | null;
  };
  latestIncidents: HeadTraderIncident[];
  recommendations: string[];
}

export interface HeadTraderAction {
  id: string;
  label: string;
  desk: DeskId;
  projectId: string;
  permissionLevel: PermissionLevel;
  liveTradingImpact: LiveTradingImpact;
  requiresConfirmation: boolean;
  riskLevel: RiskLevel;
  backendControlId: string | null;
}

export interface ActionCatalogResponse {
  id: string;
  contractVersion: string;
  generatedAt: string;
  permissionLevels: PermissionLevel[];
  actions: HeadTraderAction[];
}

export interface RiskDecision {
  id: string;
  contractVersion: string;
  generatedAt: string;
  allowed: boolean;
  level: RiskLevel;
  permissionLevel: PermissionLevel;
  requiresConfirmation: boolean;
  blockers: string[];
  explanation: string;
  liveTradingLocked: boolean;
}

export type DecisionStatus =
  | "waiting_for_confirmation"
  | "approved"
  | "rejected"
  | "executing"
  | "executed"
  | "failed"
  | (string & {});

export interface HeadTraderDecision {
  id: string;
  incidentId?: string;
  actionId: string;
  backendControlId: string | null;
  actorId: string;
  channel: "dashboard" | "discord" | "telegram" | (string & {});
  reason: string;
  status: DecisionStatus;
  risk: RiskDecision;
  result: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId?: string;
  role: "human" | "head_trader" | (string & {});
  actorId?: string;
  text: string;
  metadata?: { intent?: ReplyIntent } & Record<string, unknown>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  incidentId: string;
  channel: string;
  createdAt?: string;
  messages?: ConversationMessage[];
}

/** What the backend understood a free-form reply to mean. Always shown to the
 *  operator before anything can be confirmed. */
export interface ReplyIntent {
  intent: "explain" | "status" | "ignore" | "action" | "decline" | "unsupported_for_desk" | "unknown" | (string & {});
  actionId: string | null;
  confidence: number;
  desk?: DeskId;
  reason?: string;
}

export interface ReplyResponse {
  id: string;
  contractVersion: string;
  generatedAt: string;
  status: string;
  error?: string;
  conversation?: Conversation;
  messages?: ConversationMessage[];
  intent?: ReplyIntent;
  decision?: HeadTraderDecision | null;
}

export interface AuditEntry {
  id?: string;
  type: string;
  actorId?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

export interface ChannelStatus {
  id: "discord" | "telegram" | (string & {});
  enabled: boolean;
  configured: boolean;
  senderAllowListSize?: number;
  /** Enabled + verification secret present + at least one allow-listed sender. */
  inboundReady?: boolean;
  verification?: string;
  mode?: string;
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export const fetchHeadTraderSummary = () => fetchJSON<HeadTraderSummary>(`${BASE}/summary`);

export const fetchIncidents = (status?: string) =>
  fetchJSON<{ incidents: HeadTraderIncident[] }>(
    status ? `${BASE}/incidents?status=${encodeURIComponent(status)}` : `${BASE}/incidents`,
  );

export const fetchIncident = (incidentId: string) =>
  fetchJSON<{ incident: HeadTraderIncident }>(`${BASE}/incidents/${encodeURIComponent(incidentId)}`);

export const fetchActionCatalog = () => fetchJSON<ActionCatalogResponse>(`${BASE}/action-catalog`);

export const fetchConversations = () => fetchJSON<{ conversations: Conversation[] }>(`${BASE}/conversations`);

export const fetchConversation = (conversationId: string) =>
  fetchJSON<{ conversation: Conversation; messages: ConversationMessage[] }>(
    `${BASE}/conversations/${encodeURIComponent(conversationId)}`,
  );

export const fetchAudit = (limit = 100) => fetchJSON<{ audit: AuditEntry[] }>(`${BASE}/audit?limit=${limit}`);

export const fetchChannels = () => fetchJSON<{ channels: ChannelStatus[] }>(`${BASE}/channels`);

export const fetchEvidence = (incidentId: string) =>
  fetchJSON<{ evidence: unknown }>(`${BASE}/evidence/${encodeURIComponent(incidentId)}`);

const post = <T,>(path: string, body?: unknown) =>
  fetchJSON<T>(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

export const refreshHeadTrader = () => post<{ createdOrUpdated: number }>("/refresh");

export const replyToIncident = (incidentId: string, message: string) =>
  post<ReplyResponse>(`/incidents/${encodeURIComponent(incidentId)}/reply`, { message, channel: "dashboard" });

export const ignoreIncident = (incidentId: string, reason: string) =>
  post<{ incident: HeadTraderIncident }>(`/incidents/${encodeURIComponent(incidentId)}/ignore`, { reason });

export const resolveIncident = (incidentId: string, reason: string) =>
  post<{ incident: HeadTraderIncident }>(`/incidents/${encodeURIComponent(incidentId)}/resolve`, { reason });

export const runRiskCheck = (actionId: string, incidentId?: string) =>
  post<RiskDecision>("/risk-check", { actionId, incidentId });

export const createDecision = (input: { actionId: string; incidentId?: string; reason: string }) =>
  post<{ decision: HeadTraderDecision }>("/decisions", { ...input, channel: "dashboard" });

export const confirmDecision = (decisionId: string, reason: string) =>
  post<{ status: string; decision: HeadTraderDecision; error?: string }>(
    `/decisions/${encodeURIComponent(decisionId)}/confirm`,
    { reason },
  );

export const rejectDecision = (decisionId: string, reason: string) =>
  post<{ decision: HeadTraderDecision }>(`/decisions/${encodeURIComponent(decisionId)}/reject`, { reason });

// ---------------------------------------------------------------------------
// Derivations — pure, unit-testable
// ---------------------------------------------------------------------------

export type Tone = "ready" | "watch" | "blocked" | "unavailable" | "unknown";

/** Executability is decided here once, and the UI has no other opinion.
 *  `hard_gate` needs a human step outside this conversation; `forbidden` never
 *  runs at all. Both are rendered, never hidden — an operator who cannot see
 *  the forbidden action does not learn that it is forbidden. */
export function isExecutable(level: PermissionLevel): boolean {
  return level === "inform" || level === "auto_safe" || level === "approval_required";
}

export function permissionTone(level: PermissionLevel): Tone {
  if (level === "inform" || level === "auto_safe") return "ready";
  if (level === "approval_required") return "watch";
  if (level === "hard_gate" || level === "forbidden") return "blocked";
  return "unknown";
}

export function permissionLabel(level: PermissionLevel): string {
  return String(level).replace(/_/g, " ");
}

export function riskTone(level: RiskLevel): Tone {
  if (level === "critical" || level === "high") return "blocked";
  if (level === "medium") return "watch";
  if (level === "low") return "ready";
  return "unknown";
}

export function severityTone(severity: IncidentSeverity): Tone {
  if (severity === "critical") return "blocked";
  if (severity === "high") return "blocked";
  if (severity === "watch") return "watch";
  if (severity === "info") return "unknown";
  return "unknown";
}

/** Rank for the queue: worst first, and within a severity the ones already
 *  waiting on a human come before the ones nobody has looked at. */
const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, watch: 2, info: 3 };
const STATUS_RANK: Record<string, number> = {
  waiting_for_human: 0,
  executing: 1,
  open: 2,
  approved: 3,
  executed: 4,
  rejected: 5,
  ignored: 6,
  resolved: 7,
  expired: 8,
};

export function incidentSortKey(incident: HeadTraderIncident): [number, number, string] {
  return [
    SEVERITY_RANK[String(incident.severity)] ?? 9,
    STATUS_RANK[String(incident.status)] ?? 9,
    // newest first within a bucket
    String(incident.updatedAt ?? ""),
  ];
}

export function sortIncidents(incidents: HeadTraderIncident[]): HeadTraderIncident[] {
  return [...incidents].sort((a, b) => {
    const ka = incidentSortKey(a);
    const kb = incidentSortKey(b);
    if (ka[0] !== kb[0]) return ka[0] - kb[0];
    if (ka[1] !== kb[1]) return ka[1] - kb[1];
    return kb[2].localeCompare(ka[2]);
  });
}

export const OPEN_STATUSES = new Set(["open", "waiting_for_human", "approved", "executing"]);

export function isOpen(incident: HeadTraderIncident): boolean {
  return OPEN_STATUSES.has(String(incident.status));
}

export function incidentStatusTone(status: IncidentStatus): Tone {
  const s = String(status);
  if (s === "waiting_for_human") return "watch";
  if (s === "executed" || s === "resolved" || s === "approved") return "ready";
  if (s === "rejected" || s === "expired") return "blocked";
  if (s === "ignored") return "unknown";
  if (s === "executing") return "watch";
  return "unknown";
}

export function decisionStatusTone(status: DecisionStatus): Tone {
  const s = String(status);
  if (s === "executed" || s === "approved") return "ready";
  if (s === "waiting_for_confirmation" || s === "executing") return "watch";
  if (s === "rejected" || s === "failed") return "blocked";
  return "unknown";
}

/** A decision is confirmable exactly once, from exactly two states — the same
 *  rule the backend enforces in `CONFIRMABLE_DECISION_STATUSES`. Mirrored here
 *  so the button disappears rather than producing a rejection. */
export const CONFIRMABLE_DECISION_STATUSES = new Set(["waiting_for_confirmation", "approved"]);

export function canConfirm(decision: HeadTraderDecision | null | undefined): boolean {
  if (!decision) return false;
  if (!CONFIRMABLE_DECISION_STATUSES.has(String(decision.status))) return false;
  return decision.risk?.allowed === true && isExecutable(decision.risk?.permissionLevel);
}

export const DESK_LABELS: Record<string, string> = {
  oanda: "OANDA Desk",
  khashi: "Khashi Perpetual Desk",
  cross_system: "Cross-System Risk",
};

export function deskLabel(desk: DeskId): string {
  return DESK_LABELS[String(desk)] ?? String(desk);
}

export function deskShort(desk: DeskId): string {
  if (desk === "oanda") return "OANDA";
  if (desk === "khashi") return "KHASHI";
  if (desk === "cross_system") return "RISK";
  return String(desk).toUpperCase().slice(0, 6);
}

/** Human-readable summary of what the backend understood, shown before any
 *  confirmation. An intent the operator cannot check is an intent they cannot
 *  refuse. */
export function describeIntent(intent: ReplyIntent | undefined, actionLabel?: string): string {
  if (!intent) return "No interpretation was returned.";
  switch (intent.intent) {
    case "action":
      return `Read as a request to run ${actionLabel ?? intent.actionId}. Confirmation is still required.`;
    case "decline":
      return intent.reason ?? "Read as a refusal — nothing was proposed.";
    case "unsupported_for_desk":
      return intent.reason ?? `That action is not available on the ${deskLabel(intent.desk ?? "")}.`;
    case "explain":
      return "Read as a request to explain the evidence.";
    case "status":
      return "Read as a status question.";
    case "ignore":
      return "Read as an ignore/snooze request.";
    default:
      return "Could not be mapped to an allowed action. Nothing was proposed.";
  }
}

export function confidenceLabel(confidence: number): string {
  if (!Number.isFinite(confidence)) return "unknown";
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.7) return "medium";
  if (confidence >= 0.4) return "low";
  return "very low";
}

export function channelBlocker(channel: ChannelStatus): string | null {
  if (channel.inboundReady) return null;
  if (!channel.enabled) return "disabled";
  if (!channel.configured) return "no verification secret";
  if (!channel.senderAllowListSize) return "no allow-listed sender";
  return "not ready";
}

export function isStale(generatedAt: string, maxAgeSeconds: number): boolean {
  const t = new Date(generatedAt).getTime();
  if (Number.isNaN(t)) return true;
  return (Date.now() - t) / 1000 > maxAgeSeconds;
}

export const POLL_SUMMARY_MS = 30_000;
export const SUMMARY_STALE_SECONDS = 90;
export const MIN_CONFIRM_REASON = 8;
