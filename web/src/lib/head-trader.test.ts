import { describe, expect, it } from "vitest";
import {
  canConfirm,
  channelBlocker,
  confidenceLabel,
  describeIntent,
  incidentStatusTone,
  isExecutable,
  isOpen,
  permissionTone,
  riskTone,
  severityTone,
  sortIncidents,
  type ChannelStatus,
  type HeadTraderDecision,
  type HeadTraderIncident,
  type RiskDecision,
} from "./head-trader";

const risk = (over: Partial<RiskDecision> = {}): RiskDecision => ({
  id: "head-trader-risk-decision",
  contractVersion: "head-trader-control-plane.v1",
  generatedAt: new Date().toISOString(),
  allowed: true,
  level: "medium",
  permissionLevel: "approval_required",
  requiresConfirmation: true,
  blockers: [],
  explanation: "Allowed after confirmation.",
  liveTradingLocked: true,
  ...over,
});

const decision = (over: Partial<HeadTraderDecision> = {}): HeadTraderDecision => ({
  id: "decision-1",
  actionId: "khashi.run_freshness_proof",
  backendControlId: "khashi-vc:run_freshness_proof",
  actorId: "operator",
  channel: "dashboard",
  reason: "",
  status: "waiting_for_confirmation",
  risk: risk(),
  result: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...over,
});

const incident = (over: Partial<HeadTraderIncident> = {}): HeadTraderIncident => ({
  id: "incident-khashi-abc123",
  sourceProject: "khashi-vc",
  desk: "khashi",
  type: "blocker",
  severity: "high",
  title: "t",
  summary: "s",
  evidence: {},
  recommendation: "r",
  options: [],
  status: "open",
  createdAt: "2026-09-09T10:00:00Z",
  updatedAt: "2026-09-09T10:00:00Z",
  ...over,
});

describe("permission ladder", () => {
  it("only lets the three lower levels execute", () => {
    expect(isExecutable("inform")).toBe(true);
    expect(isExecutable("auto_safe")).toBe(true);
    expect(isExecutable("approval_required")).toBe(true);
    // needs a human step outside this conversation
    expect(isExecutable("hard_gate")).toBe(false);
    // never runs at all
    expect(isExecutable("forbidden")).toBe(false);
  });

  it("treats an unknown level as not executable", () => {
    expect(isExecutable("something_new" as never)).toBe(false);
  });

  it("tones hard_gate and forbidden as blocked, not as unknown", () => {
    expect(permissionTone("hard_gate")).toBe("blocked");
    expect(permissionTone("forbidden")).toBe("blocked");
    expect(permissionTone("approval_required")).toBe("watch");
    expect(permissionTone("auto_safe")).toBe("ready");
  });
});

describe("confirmability", () => {
  it("allows a waiting decision whose risk cleared", () => {
    expect(canConfirm(decision())).toBe(true);
    expect(canConfirm(decision({ status: "approved" }))).toBe(true);
  });

  it("refuses a decision that already ran, mirroring the backend guard", () => {
    expect(canConfirm(decision({ status: "executed" }))).toBe(false);
    expect(canConfirm(decision({ status: "executing" }))).toBe(false);
    expect(canConfirm(decision({ status: "rejected" }))).toBe(false);
    expect(canConfirm(decision({ status: "failed" }))).toBe(false);
  });

  it("refuses when risk blocked it, whatever the decision status says", () => {
    expect(canConfirm(decision({ risk: risk({ allowed: false, blockers: ["nope"] }) }))).toBe(false);
    expect(canConfirm(decision({ risk: risk({ permissionLevel: "hard_gate" }) }))).toBe(false);
    expect(canConfirm(decision({ risk: risk({ permissionLevel: "forbidden" }) }))).toBe(false);
  });

  it("refuses when there is no decision at all", () => {
    expect(canConfirm(null)).toBe(false);
    expect(canConfirm(undefined)).toBe(false);
  });
});

describe("incident queue ordering", () => {
  it("puts the worst severity first and waiting-on-human before untouched", () => {
    const ordered = sortIncidents([
      incident({ id: "a", severity: "watch", status: "open" }),
      incident({ id: "b", severity: "critical", status: "open" }),
      incident({ id: "c", severity: "critical", status: "waiting_for_human" }),
      incident({ id: "d", severity: "high", status: "open" }),
    ]).map((i) => i.id);
    expect(ordered).toEqual(["c", "b", "d", "a"]);
  });

  it("breaks ties on recency, newest first", () => {
    const ordered = sortIncidents([
      incident({ id: "old", updatedAt: "2026-09-09T09:00:00Z" }),
      incident({ id: "new", updatedAt: "2026-09-09T11:00:00Z" }),
    ]).map((i) => i.id);
    expect(ordered).toEqual(["new", "old"]);
  });

  it("does not mutate the input", () => {
    const input = [incident({ id: "a", severity: "watch" }), incident({ id: "b", severity: "critical" })];
    sortIncidents(input);
    expect(input.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("counts only live statuses as open", () => {
    expect(isOpen(incident({ status: "waiting_for_human" }))).toBe(true);
    expect(isOpen(incident({ status: "executing" }))).toBe(true);
    expect(isOpen(incident({ status: "resolved" }))).toBe(false);
    expect(isOpen(incident({ status: "ignored" }))).toBe(false);
  });
});

describe("tones", () => {
  it("separates a waiting incident from a finished one", () => {
    expect(incidentStatusTone("waiting_for_human")).toBe("watch");
    expect(incidentStatusTone("executed")).toBe("ready");
    expect(incidentStatusTone("rejected")).toBe("blocked");
    expect(incidentStatusTone("ignored")).toBe("unknown");
  });

  it("maps severity and risk consistently", () => {
    expect(severityTone("critical")).toBe("blocked");
    expect(severityTone("watch")).toBe("watch");
    expect(riskTone("critical")).toBe("blocked");
    expect(riskTone("low")).toBe("ready");
  });
});

describe("interpreted intent", () => {
  it("says plainly that a refusal proposed nothing", () => {
    const text = describeIntent({ intent: "decline", actionId: null, confidence: 0.8, reason: "reply reads as a refusal, so no action is proposed" });
    expect(text).toMatch(/refusal/);
  });

  it("names the action and still insists on confirmation", () => {
    const text = describeIntent({ intent: "action", actionId: "khashi.pause_collection", confidence: 0.75 }, "Pause Khashi collection");
    expect(text).toContain("Pause Khashi collection");
    expect(text).toMatch(/[Cc]onfirmation is still required/);
  });

  it("explains a cross-desk miss rather than silently proposing nothing", () => {
    const text = describeIntent({
      intent: "unsupported_for_desk",
      actionId: null,
      confidence: 0.6,
      desk: "oanda",
      reason: "that action is not available on the oanda desk",
    });
    expect(text).toMatch(/not available/);
  });

  it("bands confidence into words", () => {
    expect(confidenceLabel(0.9)).toBe("high");
    expect(confidenceLabel(0.75)).toBe("medium");
    expect(confidenceLabel(0.5)).toBe("low");
    expect(confidenceLabel(0.1)).toBe("very low");
    expect(confidenceLabel(Number.NaN)).toBe("unknown");
  });
});

describe("channel readiness", () => {
  const channel = (over: Partial<ChannelStatus>): ChannelStatus => ({
    id: "telegram",
    enabled: false,
    configured: false,
    senderAllowListSize: 0,
    inboundReady: false,
    ...over,
  });

  it("names the specific missing piece, not just 'not ready'", () => {
    expect(channelBlocker(channel({}))).toBe("disabled");
    expect(channelBlocker(channel({ enabled: true }))).toBe("no verification secret");
    expect(channelBlocker(channel({ enabled: true, configured: true }))).toBe("no allow-listed sender");
  });

  it("reports nothing missing once inbound is ready", () => {
    expect(
      channelBlocker(channel({ enabled: true, configured: true, senderAllowListSize: 1, inboundReady: true })),
    ).toBeNull();
  });
});
