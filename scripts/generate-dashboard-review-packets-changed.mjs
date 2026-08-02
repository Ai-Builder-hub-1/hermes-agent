#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" });
const files = result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean) : [];
const routes = new Set();
if (files.some((file) => file.includes("DesignIntelligenceCommandCenterPage") || file.includes("design-intelligence-data"))) {
  routes.add("/design-intelligence");
}
if (files.some((file) => file.includes("project-tier-assessment") || file.includes("dashboard-cross-project-action-backlog"))) {
  routes.add("/dashboard-migrations");
}

if (routes.size === 0) {
  spawnSync("npm", ["run", "dashboard:review-packet:generate"], { stdio: "inherit" });
  process.exit(0);
}

for (const route of routes) {
  const run = spawnSync("npm", ["run", "dashboard:review-packet:generate", "--", "--route", route], { stdio: "inherit" });
  if (run.status !== 0) process.exit(run.status ?? 1);
}
console.log(`Dashboard changed review packets generated: ${routes.size} route(s).`);
