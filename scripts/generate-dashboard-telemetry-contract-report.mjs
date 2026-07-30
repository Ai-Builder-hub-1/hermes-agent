#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dashboardsPath = path.join(root, "hermes.dashboards.json");
const outputPath = path.join(root, "docs/design/dashboard-telemetry-contract-report.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const registry = readJson(dashboardsPath);
const required = ["healthUrl", "snapshotUrl", "projectPath", "projectName"];
const items = (registry.dashboards ?? []).map((dashboard) => {
  const missing = required.filter((field) => !dashboard[field]);
  return {
    id: dashboard.id,
    label: dashboard.label,
    owner: dashboard.owner,
    status: missing.length ? "partial" : "ready",
    missing,
    telemetryContract: {
      health: Boolean(dashboard.healthUrl),
      dashboardSnapshot: Boolean(dashboard.snapshotUrl),
      localProject: Boolean(dashboard.projectPath),
      projectIdentity: Boolean(dashboard.projectName)
    }
  };
});

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  requiredFields: required,
  readyCount: items.filter((item) => item.status === "ready").length,
  partialCount: items.filter((item) => item.status !== "ready").length,
  items
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
