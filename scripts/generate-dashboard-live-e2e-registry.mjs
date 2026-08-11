#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const fleetPath = path.join(root, "docs/fleet/fleet-registry.json");
const outputPath = path.join(root, "docs/design/dashboard-live-e2e-registry.json");

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const fleet = readJson(fleetPath, { projects: [] });
const previous = readJson(outputPath, { entries: [] });
const previousByProject = new Map((previous.entries ?? []).map((entry) => [entry.projectId, entry]));

const entries = (fleet.projects ?? []).map((project) => {
  const prior = previousByProject.get(project.id) ?? {};
  const hasProof = project.proof?.status === "baseline-present" && project.proof?.httpStatus === 200;
  const hasSnapshot = Boolean(project.production?.snapshotUrl);
  const hasHealth = Boolean(project.production?.healthUrl);
  const hasPassingRun = prior.latestRun?.status === "passed";
  const status = hasPassingRun
    ? "current"
    : hasProof && hasSnapshot && hasHealth
      ? "declared"
      : "missing";
  return {
    schemaVersion: 1,
    projectId: project.id,
    label: project.name,
    scenarioId: prior.scenarioId ?? `${project.id}.primary-operator-flow`,
    status,
    route: project.production?.url ?? null,
    proofUrl: project.production?.proofUrl ?? null,
    healthUrl: project.production?.healthUrl ?? null,
    snapshotUrl: project.production?.snapshotUrl ?? null,
    requiredAssertions: prior.requiredAssertions ?? [
      "primary route loads",
      "readonly proof route loads",
      "snapshot or outcome feed returns data",
      "primary empty/error/stale state is visible when data is unavailable",
      "no blank primary region"
    ],
    latestRun: prior.latestRun ?? null,
    recommendedFix: status === "current"
      ? null
      : "Add a Playwright or API-backed live E2E run and persist latestRun status/capturedAt evidence."
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Live E2E evidence registry for primary production dashboard workflows.",
  statusMeaning: {
    current: "A recent live E2E run passed and latestRun evidence is present.",
    declared: "The route/proof/snapshot contract exists, but no recent live E2E run is recorded.",
    missing: "The project lacks enough route/proof/snapshot contract evidence to run live E2E."
  },
  entries
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
