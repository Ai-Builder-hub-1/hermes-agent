#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dashboardsPath = path.join(root, "hermes.dashboards.json");
const outputPath = path.join(root, "docs/design/dashboard-production-proof-registry.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const dashboards = readJson(dashboardsPath).dashboards ?? [];
const previous = fs.existsSync(outputPath) ? readJson(outputPath) : { entries: [] };
const previousById = new Map((previous.entries ?? []).map((entry) => [entry.id, entry]));
const entries = dashboards.map((dashboard) => {
  const screenshotBaselinePath = `docs/design/production-screenshots/${dashboard.id}.png`;
  const screenshotExists = fs.existsSync(path.join(root, screenshotBaselinePath));
  const prior = previousById.get(dashboard.id);
  const priorProof = prior?.proof ?? {};
  const reviewNeeded = Boolean(priorProof.authWallDetected || priorProof.blankPrimaryDetected || prior?.status === "captured-review-needed");
  return {
    id: dashboard.id,
    label: dashboard.label,
    owner: dashboard.owner,
    url: dashboard.url,
    proofUrl: dashboard.proofUrl,
    proofAuth: dashboard.proofAuth,
    healthUrl: dashboard.healthUrl,
    snapshotUrl: dashboard.snapshotUrl,
    deployment: dashboard.deployment,
    screenshotBaselinePath,
    requiredProof: [
      "health-url-reachable",
      "screenshot-captured",
      "proof-endpoint-declared",
      "no-production-mock-copy",
      "no-blank-primary-region",
      "primary-data-freshness-visible"
    ],
    proof: {
      ...priorProof,
      proofEndpointDeclared: Boolean(dashboard.proofUrl),
      screenshotCaptured: screenshotExists,
      screenshotBaselinePath,
      authWallDetected: priorProof.authWallDetected ?? false,
      blankPrimaryDetected: priorProof.blankPrimaryDetected ?? false
    },
    status: screenshotExists ? reviewNeeded ? "captured-review-needed" : "baseline-present" : "baseline-needed"
  };
});

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  entries
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
