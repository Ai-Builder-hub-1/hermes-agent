#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "hermes.dashboards.json");
const outputDir = path.join(root, "docs/design/production-dashboard-screenshots");
const reportPath = path.join(root, "docs/design/production-dashboard-screenshots-report.json");
const markdownPath = path.join(root, "docs/design/production-dashboard-screenshots-report.md");
const args = process.argv.slice(2);
const idArg = args.find((arg) => arg.startsWith("--id="));
const onlyId = idArg ? idArg.slice("--id=".length) : null;
const timeoutMs = Number(args.find((arg) => arg.startsWith("--timeout="))?.slice("--timeout=".length) ?? 30000);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slug(value) {
  return value.replace(/[^a-z0-9.-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function dashboardUrl(entry) {
  return entry.url ?? entry.productionUrl ?? entry.proofUrl ?? null;
}

function detectAuthWall(text, passwordFields) {
  const lower = text.toLowerCase();
  if (passwordFields > 0) return true;
  return (
    lower.includes("sign in") ||
    lower.includes("log in") ||
    lower.includes("login") ||
    lower.includes("password required") ||
    lower.includes("session rejected")
  ) && lower.includes("password");
}

function assessVisualState({ status, text, passwordFields, screenshot }) {
  const trimmed = text.trim();
  const authWall = detectAuthWall(trimmed, passwordFields);
  const blank = trimmed.length < 120;
  const blocked = !status || status >= 400 || authWall || blank;
  const issues = [];
  if (!status) issues.push("no-http-response");
  if (status >= 400) issues.push(`http-${status}`);
  if (authWall) issues.push("auth-wall");
  if (blank) issues.push("blank-or-low-content");
  if (!screenshot) issues.push("screenshot-missing");
  return {
    status: blocked ? "review-needed" : "captured",
    authWall,
    blank,
    issues
  };
}

function markdownTable(rows) {
  const lines = [
    "| Dashboard | Result | HTTP | Text | Issues | Screenshot |",
    "| --- | --- | ---: | ---: | --- | --- |"
  ];
  for (const row of rows) {
    lines.push(`| ${row.label} | ${row.result} | ${row.httpStatus ?? ""} | ${row.textLength ?? 0} | ${row.issues.join(", ") || "none"} | ${row.screenshot} |`);
  }
  return lines.join("\n");
}

if (!fs.existsSync(registryPath)) {
  console.error("Missing hermes.dashboards.json");
  process.exit(1);
}

const registry = readJson(registryPath);
const dashboards = (registry.dashboards ?? []).filter((entry) => !onlyId || entry.id === onlyId);
if (!dashboards.length) {
  console.error(onlyId ? `No dashboard found for ${onlyId}` : "No dashboards registered.");
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce"
});

const results = [];
for (const dashboard of dashboards) {
  const page = await context.newPage();
  const url = dashboardUrl(dashboard);
  const screenshotFile = `${slug(dashboard.id)}.png`;
  const screenshotPath = path.join(outputDir, screenshotFile);
  const relativeScreenshot = `docs/design/production-dashboard-screenshots/${screenshotFile}`;
  try {
    if (!url) throw new Error("dashboard url missing");
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 10000) }).catch(() => {});
    const text = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    const passwordFields = await page.locator("input[type='password']").count().catch(() => 0);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const assessment = assessVisualState({
      status: response?.status() ?? null,
      text,
      passwordFields,
      screenshot: fs.existsSync(screenshotPath)
    });
    results.push({
      id: dashboard.id,
      label: dashboard.label ?? dashboard.id,
      url,
      result: assessment.status,
      httpStatus: response?.status() ?? null,
      ok: Boolean(response?.ok()),
      textLength: text.trim().length,
      passwordFields,
      authWall: assessment.authWall,
      blank: assessment.blank,
      issues: assessment.issues,
      screenshot: relativeScreenshot
    });
  } catch (error) {
    results.push({
      id: dashboard.id,
      label: dashboard.label ?? dashboard.id,
      url,
      result: "failed",
      httpStatus: null,
      ok: false,
      textLength: 0,
      passwordFields: 0,
      authWall: false,
      blank: true,
      issues: [error instanceof Error ? error.message : String(error)],
      screenshot: relativeScreenshot
    });
  } finally {
    await page.close();
  }
}

await browser.close();

const generatedAt = new Date().toISOString();
const report = { generatedAt, source: "actual-dashboard-url", results };
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(markdownPath, `# Production Dashboard Actual Screenshot Report\n\nGenerated: ${generatedAt}\n\n${markdownTable(results)}\n`);

for (const result of results) {
  console.log(`${result.result}: ${result.id} -> ${result.screenshot}`);
  if (result.issues.length) console.log(`  issues: ${result.issues.join(", ")}`);
}

const failures = results.filter((result) => result.result === "failed");
if (failures.length) {
  console.error(`Actual dashboard screenshot capture failed for ${failures.length} dashboard(s).`);
  process.exit(1);
}
