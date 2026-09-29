import { describe, expect, it } from "vitest";
import {
  auditOperationalContract,
  auditOperationalPages,
  contractForRoute,
  OPERATIONAL_PAGE_CONTRACTS,
} from "./operational-page-contracts";

describe("operational page contracts", () => {
  it("tracks warehouse as a charted live surface", () => {
    const contract = contractForRoute("/system/warehouse");
    expect(contract?.maturity).toBe("charted");
    expect(contract?.liveSources).toContain("/api/system/warehouse/summary");
    expect(contract?.safeActions).toContain("/api/system/warehouse/prune-dry-run");
  });

  it("scores pages with missing live contracts lower", () => {
    const warehouse = auditOperationalContract(contractForRoute("/system/warehouse")!);
    const synthetic = auditOperationalContract({
      route: "/synthetic/static",
      group: "operate",
      label: "Synthetic Static",
      purpose: "Test scoring for missing live/evidence contracts.",
      maturity: "static",
      liveSources: [],
      requiredSignals: [],
      gaps: [],
      safeActions: [],
      evidence: [],
    });
    expect(warehouse.score).toBeGreaterThan(synthetic.score);
    expect(synthetic.missing).toContain("live data contract");
  });

  it("audits by group in lowest-maturity-first order", () => {
    const system = auditOperationalPages("system");
    expect(system.length).toBeGreaterThan(0);
    expect(system[0].score).toBeLessThanOrEqual(system[system.length - 1].score);
  });

  it("keeps every contract route unique", () => {
    const routes = OPERATIONAL_PAGE_CONTRACTS.map((contract) => contract.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("covers every operator nav route that should have maturity status", () => {
    const expected = [
      "/operate",
      "/operate/blockers",
      "/operate/actions",
      "/operate/incidents",
      "/operate/approvals",
      "/operate/runs",
      "/operate/evidence",
      "/second-brain",
      "/compounding-intelligence",
      "/operate/chat-actions",
      "/trading",
      "/trading/khashi",
      "/trading/investing",
      "/trading/strategies",
      "/trading/backtesting",
      "/trading/shadow-paper",
      "/trading/risk",
      "/trading/head-trader",
      "/trading/evidence",
      "/system/warehouse",
      "/system/freshness",
      "/system/storage",
      "/system/workers",
      "/system/deployments",
      "/system/credentials",
      "/system/models",
      "/system/automations",
      "/system/sessions",
      "/system/logs",
      "/system/plugins",
      "/system/admin",
      "/system/analytics",
    ];
    for (const route of expected) {
      expect(contractForRoute(route), route).toBeTruthy();
    }
  });
});
