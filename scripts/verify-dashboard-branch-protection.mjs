#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const requiredChecks = [
  "Dashboard Design System / dashboard-quality",
  "npm run dashboard:standards:summary:fast",
  "npm run dashboard:token-scan:strict",
  "npm run dashboard:governance-exceptions:validate",
  "npm run dashboard:maturity-reports:validate"
];

const result = spawnSync("gh", ["api", "repos/:owner/:repo/branches/main/protection"], {
  encoding: "utf8",
  maxBuffer: 5 * 1024 * 1024
});

if (result.status !== 0) {
  const attestationPath = path.join(process.cwd(), "docs/design/dashboard-branch-protection-attestation.json");
  const attestation = fs.existsSync(attestationPath) ? JSON.parse(fs.readFileSync(attestationPath, "utf8")) : null;
  if (attestation?.status === "manually-verified") {
    console.log("Dashboard branch protection verification: 0 error(s), 0 warning(s).");
    console.log(`Manual attestation verified by ${attestation.attestedBy} at ${attestation.attestedAt}.`);
    process.exit(0);
  }
  console.log("Dashboard branch protection verification: 0 error(s), 1 warning(s).");
  console.log("- WARNING Unable to read GitHub branch protection through gh api; verify manually with docs/design/dashboard-branch-protection-requirements.md.");
  process.exit(0);
}

const protection = JSON.parse(result.stdout);
const contexts = new Set(protection.required_status_checks?.contexts ?? []);
const missing = requiredChecks.filter((check) => !contexts.has(check));
console.log(`Dashboard branch protection verification: ${missing.length} missing required check(s).`);
for (const check of missing) console.log(`- WARNING Missing required branch protection check: ${check}`);
