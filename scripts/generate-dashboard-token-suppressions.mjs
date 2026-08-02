#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const suppressionPath = path.join(root, "docs/design/dashboard-token-suppressions.json");
const result = spawnSync("node", ["scripts/scan-dashboard-tokens.mjs", "--all", "--no-suppressions"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024
});
const counts = new Map();
for (const line of `${result.stdout ?? ""}${result.stderr ?? ""}`.split(/\r?\n/)) {
  const match = line.match(/^- WARNING ([^ ]+) ([^:]+):/);
  if (!match) continue;
  const key = `${match[2]}::${match[1]}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
const suppressions = [...counts.entries()].map(([key, maxAllowed]) => {
  const [file, rule] = key.split("::");
  return {
    file,
    rule,
    maxAllowed,
    reason: "Legacy token debt baseline. New findings above this count are blocked.",
    owner: "design-system",
    createdAt: new Date().toISOString().slice(0, 10)
  };
});
const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "node scripts/scan-dashboard-tokens.mjs --all --no-suppressions",
  suppressions
};
fs.writeFileSync(suppressionPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Dashboard token suppressions generated: ${suppressions.length} baseline group(s).`);
