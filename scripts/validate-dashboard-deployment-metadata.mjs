#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "hermes.dashboards.json");
const outputPath = path.join(root, "docs/design/dashboard-deployment-metadata-report.json");
const required = ["provider", "sshHost", "composeProject", "composeService", "buildContext", "promotionScript"];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (!fs.existsSync(registryPath)) {
  console.error("Missing hermes.dashboards.json.");
  process.exit(1);
}

const registry = readJson(registryPath);
const items = (registry.dashboards ?? []).map((dashboard) => {
  const deployment = dashboard.deployment ?? {};
  const missing = required.filter((field) => !deployment[field]);
  const planned = deployment.status === "planned";
  return {
    id: dashboard.id,
    label: dashboard.label,
    status: planned ? "planned" : missing.length ? "missing-metadata" : "ready",
    provider: deployment.provider,
    composeService: deployment.composeService,
    missing,
    note: deployment.note
  };
});
const failed = items.filter((item) => item.status === "missing-metadata");

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  requiredFields: required.map((field) => `deployment.${field}`),
  checkedCount: items.length,
  failedCount: failed.length,
  plannedCount: items.filter((item) => item.status === "planned").length,
  items
}, null, 2)}\n`);

if (failed.length) {
  console.error(`Dashboard deployment metadata validation failed (${failed.length})`);
  for (const item of failed) console.error(`- ${item.id}: missing ${item.missing.join(", ")}`);
  process.exit(1);
}

console.log(`Dashboard deployment metadata validation passed (${items.length}).`);
