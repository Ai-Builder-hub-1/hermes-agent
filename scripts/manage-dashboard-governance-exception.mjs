#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-governance-exceptions.json");
const [command, ...args] = process.argv.slice(2);
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

function arg(name, fallback = "") {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

if (command === "list" || !command) {
  console.log(JSON.stringify(registry.exceptions ?? [], null, 2));
  process.exit(0);
}

if (command === "create") {
  const id = arg("id");
  if (!id) {
    console.error("Missing --id");
    process.exit(1);
  }
  if ((registry.exceptions ?? []).some((item) => item.id === id)) {
    console.error(`Exception already exists: ${id}`);
    process.exit(1);
  }
  registry.exceptions.push({
    id,
    owner: arg("owner", "design-system"),
    reviewer: arg("reviewer", "human-review-required"),
    blockedGate: arg("blocked-gate", "unknown"),
    reason: arg("reason", "Temporary exception pending replacement plan."),
    replacementPlan: arg("replacement-plan", "Resolve blocked gate and remove exception."),
    createdAt: new Date().toISOString().slice(0, 10),
    expiresAt: arg("expires-at")
  });
} else if (command === "expire") {
  const id = arg("id");
  registry.exceptions = (registry.exceptions ?? []).map((item) => item.id === id ? { ...item, expiresAt: "2000-01-01" } : item);
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Dashboard governance exception ${command} complete.`);
