#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const fleetPath = path.join(root, "docs/fleet/fleet-registry.json");
const outputPath = path.join(root, "docs/design/dashboard-monitoring-registry.json");

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const fleet = readJson(fleetPath, { projects: [] });
const previous = readJson(outputPath, { entries: [] });
const previousByProject = new Map((previous.entries ?? []).map((entry) => [entry.projectId, entry]));

const entries = (fleet.projects ?? []).map((project) => {
  const prior = previousByProject.get(project.id) ?? {};
  const hasHealth = Boolean(project.production?.healthUrl);
  const hasSnapshot = Boolean(project.production?.snapshotUrl);
  const hasPassingCheck = prior.latestCheck?.status === "passed";
  const status = hasPassingCheck
    ? "current"
    : hasHealth && hasSnapshot
      ? "declared"
      : "missing";
  return {
    schemaVersion: 1,
    projectId: project.id,
    label: project.name,
    status,
    healthUrl: project.production?.healthUrl ?? null,
    snapshotUrl: project.production?.snapshotUrl ?? null,
    alertOwner: prior.alertOwner ?? project.ownerSystem ?? null,
    requiredSignals: prior.requiredSignals ?? [
      "health endpoint status",
      "snapshot freshness",
      "primary dashboard proof freshness",
      "deployment promotion status",
      "error rate or failure count"
    ],
    latestCheck: prior.latestCheck ?? null,
    recommendedFix: status === "current"
      ? null
      : "Connect dashboard health/snapshot signals to a monitoring job and persist latestCheck evidence."
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Dashboard monitoring evidence registry for production health, freshness, and alert ownership.",
  statusMeaning: {
    current: "Monitoring is connected and latestCheck evidence is present.",
    declared: "Health/snapshot contracts exist, but no monitoring check evidence is recorded.",
    missing: "The project lacks enough health/snapshot contract evidence for monitoring."
  },
  entries
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
