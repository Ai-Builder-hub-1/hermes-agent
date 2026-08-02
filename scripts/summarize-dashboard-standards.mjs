#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = process.argv.slice(2);
const fast = args.includes("--fast");
const json = args.includes("--json");

const checks = [
  {
    id: "design-system-status",
    script: "dashboard:design-system:status",
    version: "V1",
    required: true,
  },
  {
    id: "architecture-standards",
    script: "architecture:standards:validate",
    version: "V1",
    required: true,
  },
  {
    id: "dashboard-governance",
    script: "dashboard:governance:validate",
    version: "V1",
    required: true,
  },
  {
    id: "interface-system",
    script: "dashboard:interface-system:validate",
    version: "V1",
    required: true,
  },
  {
    id: "recipe-score",
    script: "dashboard:recipe:score",
    version: "V2",
    required: true,
  },
  {
    id: "tier-assessment",
    script: "dashboard:tier-assessment:validate",
    version: "V6",
    required: true,
  },
  {
    id: "visual-evidence",
    script: "dashboard:visual-evidence:validate",
    version: "V7",
    required: true,
  },
  {
    id: "component-maturity",
    script: "dashboard:component-maturity:validate",
    version: "V8",
    required: true,
  },
  {
    id: "token-enforcement",
    script: "dashboard:token-enforcement:validate",
    version: "V9",
    required: true,
  },
  {
    id: "token-scan",
    script: "dashboard:token-scan:strict",
    version: "V9",
    required: true,
  },
  {
    id: "review-packet",
    script: "dashboard:review-packet:validate",
    version: "V10",
    required: true,
  },
  {
    id: "mobbin-reference-map",
    script: "dashboard:mobbin-reference-map:validate",
    version: "V11",
    required: true,
  },
  {
    id: "governance-ci",
    script: "dashboard:governance-ci:validate",
    version: "V12",
    required: true,
  },
  {
    id: "governance-exceptions",
    script: "dashboard:governance-exceptions:validate",
    version: "V12",
    required: true,
  },
  {
    id: "maturity-reports",
    script: "dashboard:maturity-reports:validate",
    version: "V12",
    required: true,
  },
  {
    id: "branch-protection",
    script: "dashboard:branch-protection:verify",
    version: "V12",
    required: true,
  },
  {
    id: "adoption-audit",
    script: "dashboard-kit:adoption:audit",
    version: "V6",
    required: !fast,
  },
  {
    id: "world-class-audit",
    script: "dashboard:world-class:audit",
    version: "V5",
    required: !fast,
  },
  {
    id: "v80-readiness",
    script: "dashboard:v80:validate",
    version: "V6",
    required: !fast,
  },
].filter((check) => check.required);

function importantLines(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const selected = lines.filter((line) => {
    const lower = line.toLowerCase();
    return (
      lower.includes("passed") ||
      lower.includes("failed") ||
      lower.includes("error") ||
      lower.includes("warning") ||
      lower.includes("score") ||
      lower.includes("status") ||
      lower.includes("current") ||
      lower.includes("stale")
    );
  });
  return (selected.length ? selected : lines.slice(-4)).slice(-8);
}

function runCheck(check) {
  const startedAt = Date.now();
  const result = spawnSync("npm", ["run", check.script], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 25 * 1024 * 1024,
    timeout: 120000,
  });
  const durationMs = Date.now() - startedAt;
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return {
    ...check,
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status ?? 1,
    durationMs,
    signal: result.signal ?? null,
    summary: importantLines(output),
  };
}

const results = checks.map(runCheck);
const failed = results.filter((result) => result.status !== "passed");

if (json) {
  console.log(JSON.stringify({
    status: failed.length ? "failed" : "passed",
    generatedAt: new Date().toISOString(),
    fast,
    results,
  }, null, 2));
} else {
  console.log(`Hermes dashboard standards summary (${fast ? "fast" : "full"})`);
  for (const result of results) {
    const symbol = result.status === "passed" ? "PASS" : "FAIL";
    console.log(`${symbol} ${result.version} ${result.id} (${Math.round(result.durationMs / 1000)}s)`);
    for (const line of result.summary) {
      console.log(`  ${line}`);
    }
  }
  console.log(failed.length ? `Standards summary failed: ${failed.length} check(s)` : "Standards summary passed.");
}

if (failed.length) process.exit(1);
