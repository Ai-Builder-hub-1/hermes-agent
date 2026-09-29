import { describe, expect, it } from "vitest";
import { auditSafeActions, buildSafeActionRegistry, riskForEndpoint } from "./operational-safe-actions";

describe("operational safe actions", () => {
  it("builds a route-owned registry from operational contracts", () => {
    const actions = buildSafeActionRegistry();
    expect(actions.length).toBeGreaterThan(10);
    expect(actions.some((action) => action.route === "/system/warehouse" && action.endpoint.includes("prune-dry-run"))).toBe(true);
    expect(actions.some((action) => action.route === "/operate/evidence" && action.endpoint === "/api/operating-runtime/evidence")).toBe(true);
  });

  it("requires safe actions to be evidence backed", () => {
    const audit = auditSafeActions();
    expect(audit.totals.evidenceBacked).toBe(audit.totals.actions);
    expect(audit.totals.auditExpected).toBe(audit.totals.actions);
    expect(audit.totals.needsHardening).toBe(0);
  });

  it("classifies endpoint risk by behavior", () => {
    expect(riskForEndpoint("/api/system/workers/dry-run")).toBe("read_only");
    expect(riskForEndpoint("/api/operating-runtime/evidence")).toBe("evidence_write");
    expect(riskForEndpoint("/api/trading-intelligence/control")).toBe("proxy_control");
    expect(riskForEndpoint("/api/custom/action")).toBe("review_required");
  });
});
