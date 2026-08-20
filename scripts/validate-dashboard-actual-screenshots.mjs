#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "docs/design/production-dashboard-screenshots-report.json");
const strict = process.argv.includes("--strict");

function issue(severity, id, message, details = {}) {
  return { severity, id, message, details };
}

const issues = [];
if (!fs.existsSync(reportPath)) {
  issues.push(issue("error", "actualScreenshots.reportMissing", "Actual dashboard screenshot report is missing. Run dashboard:production-actual:capture."));
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const results = report.results ?? [];
  if (results.length < 10) {
    issues.push(issue("error", "actualScreenshots.coverage", "Actual screenshot report must cover the full dashboard fleet.", { count: results.length }));
  }
  for (const result of results) {
    const screenshotPath = path.join(root, result.screenshot ?? "");
    if (!result.screenshot || !fs.existsSync(screenshotPath)) {
      issues.push(issue("error", "actualScreenshots.screenshotMissing", `${result.id} screenshot file is missing.`, { screenshot: result.screenshot }));
    }
    if (result.result === "failed") {
      issues.push(issue("error", "actualScreenshots.captureFailed", `${result.id} actual dashboard capture failed.`, { issues: result.issues ?? [] }));
    }
    if (result.authWall) {
      issues.push(issue(strict ? "error" : "warn", "actualScreenshots.authWall", `${result.id} captured an auth wall instead of the dashboard experience.`, { screenshot: result.screenshot }));
    }
    if (result.blank) {
      issues.push(issue(strict ? "error" : "warn", "actualScreenshots.blank", `${result.id} captured a blank or low-content page.`, { textLength: result.textLength, screenshot: result.screenshot }));
    }
    if ((result.textLength ?? 0) < 400 && !result.authWall) {
      issues.push(issue("warn", "actualScreenshots.lowContent", `${result.id} rendered very little dashboard text; verify it is not a shell-only page.`, { textLength: result.textLength }));
    }
  }
}

for (const item of issues) {
  console.log(`${item.severity}: ${item.id} - ${item.message}`);
}

const errors = issues.filter((item) => item.severity === "error");
console.log(`Actual dashboard screenshot validation: ${errors.length} error(s), ${issues.length - errors.length} warning(s).`);
if (errors.length) process.exitCode = 1;
