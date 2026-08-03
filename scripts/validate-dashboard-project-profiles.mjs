#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const profilesPath = path.join(root, "docs/design/dashboard-project-validation-profiles.json");
const reportPath = path.join(root, "docs/design/dashboard-project-validation-profiles-report.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (!fs.existsSync(profilesPath)) {
  console.error("Missing dashboard project validation profiles.");
  process.exit(1);
}

const profiles = readJson(profilesPath).profiles ?? [];
const items = profiles.map((profile) => {
  const absolutePath = path.resolve(root, profile.projectPath ?? "");
  const missing = [];
  if (!profile.project) missing.push("project");
  if (!profile.projectPath) missing.push("projectPath");
  if (!fs.existsSync(absolutePath)) missing.push("projectPath.exists");
  if (!Array.isArray(profile.validationCommands) || profile.validationCommands.length === 0) missing.push("validationCommands");
  if (!profile.healthUrl) missing.push("healthUrl");
  if (!profile.deploymentService && !profile.deploymentGap) missing.push("deploymentService-or-deploymentGap");
  return {
    project: profile.project,
    projectPath: profile.projectPath,
    status: missing.length ? "incomplete" : "ready",
    missing
  };
});
const failed = items.filter((item) => item.status !== "ready");

fs.writeFileSync(reportPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  checkedCount: items.length,
  failedCount: failed.length,
  items
}, null, 2)}\n`);

if (failed.length) {
  console.error(`Dashboard project validation profiles failed (${failed.length})`);
  for (const item of failed) console.error(`- ${item.project}: missing ${item.missing.join(", ")}`);
  process.exit(1);
}

console.log(`Dashboard project validation profiles passed (${items.length}).`);
