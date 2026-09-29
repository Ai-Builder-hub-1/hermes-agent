import { describe, expect, it } from "vitest";

import {
  decisionLedger,
  operatingLoops,
  operatingSystemStages,
  permissionPolicies,
  routedTasks,
} from "@/pages/operating-system-data";
import { fleetOperatorSnapshots } from "@/pages/fleet-operator-data";
import { loadOperatingRuntimeState } from "@/pages/operating-runtime";
import { attentionItems, buildOperateItems, itemsForKind, operateSummary } from "./operate-items";

function items() {
  return buildOperateItems({
    stages: operatingSystemStages,
    tasks: routedTasks,
    decisions: decisionLedger,
    policies: permissionPolicies,
    loops: operatingLoops,
    runtime: loadOperatingRuntimeState(),
    fleetSnapshots: fleetOperatorSnapshots,
  });
}

describe("operate items", () => {
  it("normalizes operating sources into action contracts", () => {
    const all = items();

    expect(all.length).toBeGreaterThan(operatingSystemStages.length);
    expect(all.every((item) => item.nextAction && item.clearingProof && item.source)).toBe(true);
  });

  it("keeps overview attention focused on non-ready work", () => {
    const attention = attentionItems(items());

    expect(attention.length).toBeGreaterThan(0);
    expect(attention.every((item) => item.severity !== "ready" && item.state !== "done")).toBe(true);
  });

  it("supports operate tab-specific queues", () => {
    const all = items();
    const summary = operateSummary(all);

    expect(itemsForKind(all, "blocker").length).toBe(summary.blockers);
    expect(itemsForKind(all, "approval").filter((item) => item.requiresApproval).length).toBe(summary.approvals);
    expect(summary.executable).toBeGreaterThan(0);
  });

  it("turns fleet monitoring snapshots into operator attention items", () => {
    const all = items();
    const fleetItems = all.filter((item) => item.id.startsWith("fleet-"));

    expect(fleetItems.length).toBe(fleetOperatorSnapshots.length);
    expect(fleetItems.some((item) => item.title.includes("Khashi VC") && item.state === "ready")).toBe(true);
    expect(fleetItems.some((item) => item.title.includes("TLC Capital Group OS") && item.state === "blocked")).toBe(true);
    expect(fleetItems.every((item) => item.safeAction === "dashboard:monitoring:check:strict")).toBe(true);
  });
});
