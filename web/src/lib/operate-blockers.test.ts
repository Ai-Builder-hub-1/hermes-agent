import { describe, expect, it } from "vitest";

import { operatingSystemStages } from "@/pages/operating-system-data";
import { blockerKindCounts, blockerStages, explainOperatingBlocker } from "./operate-blockers";

describe("operate blockers", () => {
  it("derives blockers from gated or high-risk operating stages", () => {
    const blockers = blockerStages(operatingSystemStages);

    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.every((stage) => stage.status === "gated" || stage.risk === "high")).toBe(true);
  });

  it("classifies V80 as a manual approval gate rather than a live production failure", () => {
    const v80 = operatingSystemStages.find((stage) => stage.version === "V80");
    expect(v80).toBeTruthy();

    const explanation = explainOperatingBlocker(v80!);

    expect(explanation.kind).toBe("manual_approval");
    expect(explanation.isLiveFailure).toBe(false);
    expect(explanation.clearingProof).toContain("human approval");
  });

  it("keeps the blocker queue explainable by category", () => {
    const counts = blockerKindCounts(blockerStages(operatingSystemStages));

    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(blockerStages(operatingSystemStages).length);
    expect(counts.manual_approval + counts.infrastructure_dependency + counts.safety_gate + counts.risk_review).toBeGreaterThan(0);
  });
});
