import { describe, expect, it } from "vitest";
import {
  EXECUTIVE_INTELLIGENCE_PHASES,
  buildExecutiveIntelligenceMaturityPlan,
} from "./executive-intelligence";

describe("executive intelligence maturity plan", () => {
  it("contains exactly 12 ordered phases", () => {
    expect(EXECUTIVE_INTELLIGENCE_PHASES).toHaveLength(12);
    expect(EXECUTIVE_INTELLIGENCE_PHASES.map((phase) => phase.phase)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  for (const phase of EXECUTIVE_INTELLIGENCE_PHASES) {
    it(`phase ${phase.phase}: ${phase.title} is testable and ready`, () => {
      expect(phase.status).toBe("ready");
      expect(phase.score).toBeGreaterThanOrEqual(100);
      expect(phase.objective.length).toBeGreaterThan(30);
      expect(phase.operatingQuestion).toMatch(/\?$/);
      expect(phase.evidence.length).toBeGreaterThanOrEqual(2);
      expect(phase.gates.length).toBeGreaterThanOrEqual(1);
      expect(phase.metrics.length).toBeGreaterThanOrEqual(2);
      expect(phase.actions.length).toBeGreaterThanOrEqual(2);
      expect(phase.dashboardSurfaces.length).toBeGreaterThanOrEqual(1);
    });
  }

  it("builds executive rollup summary from the phases", () => {
    const plan = buildExecutiveIntelligenceMaturityPlan(new Date("2026-09-29T22:30:00.000Z"));

    expect(plan.generatedAt).toBe("2026-09-29T22:30:00.000Z");
    expect(plan.maturityScore).toBe(100);
    expect(plan.status).toBe("ready");
    expect(plan.summary.phases).toBe(12);
    expect(plan.summary.ready).toBe(12);
    expect(plan.summary.blocked).toBe(0);
    expect(plan.summary.evidenceItems).toBeGreaterThanOrEqual(24);
    expect(plan.summary.openActions).toBeGreaterThanOrEqual(24);
    expect(plan.decisionAgenda.length).toBeGreaterThanOrEqual(3);
    expect(plan.operatingCadence.map((item) => item.cadence)).toEqual([
      "Daily",
      "Weekly",
      "Incident-triggered",
    ]);
    expect(plan.boardNarrative.length).toBeGreaterThanOrEqual(6);
  });
});
