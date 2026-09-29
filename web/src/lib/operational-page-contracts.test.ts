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
    const backtesting = auditOperationalContract(contractForRoute("/trading/backtesting")!);
    expect(warehouse.score).toBeGreaterThan(backtesting.score);
    expect(backtesting.missing).toContain("live data contract");
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
});
