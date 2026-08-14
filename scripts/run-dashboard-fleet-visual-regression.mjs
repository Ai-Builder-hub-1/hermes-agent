#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import { dashboardRegistry, designDir, markdownTable, readJson, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const args = parseArgs(process.argv.slice(2));
const matrixPath = path.join(designDir, "dashboard-visual-regression-matrix.json");
const outJson = path.join(designDir, "dashboard-fleet-visual-regression-run.json");
const outMd = path.join(designDir, "dashboard-fleet-visual-regression-run.md");
const matrix = readJson(matrixPath);
const dashboards = dashboardRegistry();
const selectedIds = new Set(String(args.id ?? args.dashboard ?? "").split(",").map((item) => item.trim()).filter(Boolean));
const mode = args.mode ?? (args.captureBaseline === "true" ? "baseline" : args.captureCurrent === "true" ? "current" : "compare");
const includeOptional = args.all === "true";
const timeoutMs = Number(args.timeout ?? 30000);
const strict = args.strict === "true";
const maxCaptures = args.maxCaptures ? Number(args.maxCaptures) : Infinity;
const captureEnabled = mode === "baseline" || mode === "current" || mode === "both";

const selectedDashboards = dashboards.filter((dashboard) => !selectedIds.size || selectedIds.has(dashboard.id));
if (!selectedDashboards.length) {
  console.error(selectedIds.size ? `No registered dashboard matched: ${[...selectedIds].join(", ")}` : "No registered dashboards found.");
  process.exit(1);
}

let browser = null;
if (captureEnabled) {
  browser = await chromium.launch({ args: resolverLaunchArgs(selectedDashboards) });
}

const items = [];
let captureCount = 0;
for (const dashboard of selectedDashboards) {
  const matrixItem = (matrix.items ?? []).find((item) => item.id === dashboard.id);
  if (!matrixItem) {
    items.push({
      id: dashboard.id,
      label: dashboard.label,
      status: "missing-matrix",
      score: 0,
      captures: [],
      findings: [finding("error", "matrix.missing", "Dashboard is not present in dashboard-visual-regression-matrix.json.")]
    });
    continue;
  }
  const requiredCaptures = (matrixItem.requiredCaptures ?? []).filter((capture) => includeOptional || capture.required);
  const captureResults = [];
  const findings = [];

  if (captureEnabled) {
    for (const capture of requiredCaptures) {
      if (captureCount >= maxCaptures) {
        captureResults.push({ ...capture, status: "skipped-max-captures" });
        continue;
      }
      if (mode === "baseline" || mode === "both") {
        captureResults.push(await captureOne(browser, dashboard, capture, "baseline"));
        captureCount += 1;
      }
      if (mode === "current" || mode === "both") {
        captureResults.push(await captureOne(browser, dashboard, capture, "current"));
        captureCount += 1;
      }
    }
  }

  for (const capture of requiredCaptures) {
    const comparison = compareCapture(capture);
    captureResults.push(comparison);
    if (comparison.findings?.length) findings.push(...comparison.findings);
  }

  const missingBaseline = captureResults.filter((item) => item.status === "missing-baseline").length;
  const missingCurrent = captureResults.filter((item) => item.status === "missing-current").length;
  const errors = findings.filter((item) => item.severity === "error").length;
  const warnings = findings.filter((item) => item.severity === "warning").length;
  const totalRequired = requiredCaptures.length;
  const comparable = totalRequired - Math.max(missingBaseline, missingCurrent);
  const score = Math.max(0, Math.round((comparable / Math.max(totalRequired, 1)) * 100) - errors * 5 - warnings * 2);
  const status = errors
    ? "fail"
    : missingBaseline || missingCurrent
      ? "missing-artifacts"
      : warnings
        ? "needs-review"
        : "pass";

  items.push({
    id: dashboard.id,
    label: dashboard.label,
    proofUrl: dashboard.proofUrl ?? null,
    status,
    score,
    requiredCaptureCount: totalRequired,
    missingBaseline,
    missingCurrent,
    findingCount: findings.length,
    captures: captureResults,
    findings
  });
}

if (browser) await browser.close();

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode,
  includeOptional,
  dashboardCount: items.length,
  summary: {
    passCount: items.filter((item) => item.status === "pass").length,
    needsReviewCount: items.filter((item) => item.status === "needs-review").length,
    missingArtifactsCount: items.filter((item) => item.status === "missing-artifacts").length,
    failCount: items.filter((item) => item.status === "fail" || item.status === "missing-matrix").length,
    averageScore: round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1))
  },
  items
};

writeJson(outJson, report);
writeMarkdown(outMd, renderMarkdown(report));
console.log(`Dashboard fleet visual regression: ${report.summary.averageScore}% average; ${report.summary.passCount}/${items.length} pass.`);
console.log(`Wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
if (strict && report.summary.passCount !== items.length) process.exit(1);

async function captureOne(activeBrowser, dashboard, capture, kind) {
  const targetUrl = proofUrlForCapture(dashboard, capture);
  const outputPath = path.join(root, kind === "baseline" ? capture.baselinePath : capture.currentPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const page = await activeBrowser.newPage({
    viewport: { width: capture.width, height: capture.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce"
  });
  try {
    const headers = proofHeaders(dashboard);
    if (Object.keys(headers).length) await page.setExtraHTTPHeaders(headers);
    const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 10000) }).catch(() => {});
    await page.evaluate(({ theme, state }) => {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("data-proof-state", state);
      document.body.setAttribute("data-proof-state", state);
    }, { theme: capture.theme, state: capture.state }).catch(() => {});
    const audit = await page.evaluate(() => ({
      textLength: document.body.innerText.trim().length,
      overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      passwordFields: document.querySelectorAll("input[type='password']").length
    })).catch(() => ({ textLength: 0, overflowX: 0, passwordFields: 0 }));
    await page.screenshot({ path: outputPath, fullPage: true });
    return {
      id: capture.id,
      kind,
      viewport: capture.viewport,
      theme: capture.theme,
      state: capture.state,
      path: path.relative(root, outputPath),
      status: audit.passwordFields || audit.textLength < 120 || audit.overflowX > 2 ? "captured-review-needed" : "captured",
      httpStatus: response?.status() ?? null,
      ...audit
    };
  } catch (error) {
    return {
      id: capture.id,
      kind,
      viewport: capture.viewport,
      theme: capture.theme,
      state: capture.state,
      path: path.relative(root, outputPath),
      status: "capture-failed",
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    await page.close();
  }
}

function compareCapture(capture) {
  const baseline = path.join(root, capture.baselinePath);
  const current = path.join(root, capture.currentPath);
  const findings = [];
  if (!fs.existsSync(baseline)) {
    findings.push(finding("error", "visual.baselineMissing", `${capture.id} missing baseline artifact.`));
    return { id: capture.id, kind: "compare", status: "missing-baseline", findings };
  }
  if (!fs.existsSync(current)) {
    findings.push(finding("error", "visual.currentMissing", `${capture.id} missing current artifact.`));
    return { id: capture.id, kind: "compare", status: "missing-current", findings };
  }
  const baselineHash = hash(baseline);
  const currentHash = hash(current);
  const baselineSize = fs.statSync(baseline).size;
  const currentSize = fs.statSync(current).size;
  const sizeDelta = baselineSize === 0 ? 100 : Math.round((Math.abs(currentSize - baselineSize) / baselineSize) * 100);
  if (baselineHash !== currentHash && sizeDelta > Number(args.sizeDeltaThreshold ?? 8)) {
    findings.push(finding("warning", "visual.changed", `${capture.id} changed ${sizeDelta}% by file size; review before approval.`, {
      baselineHash,
      currentHash,
      sizeDelta
    }));
  }
  return {
    id: capture.id,
    kind: "compare",
    viewport: capture.viewport,
    theme: capture.theme,
    state: capture.state,
    status: findings.length ? "needs-review" : "pass",
    baselinePath: capture.baselinePath,
    currentPath: capture.currentPath,
    findings
  };
}

function proofUrlForCapture(dashboard, capture) {
  const value = dashboard.proofUrl ?? dashboard.url;
  const url = new URL(value);
  url.searchParams.set("proofTheme", capture.theme);
  url.searchParams.set("proofState", capture.state);
  url.searchParams.set("proofViewport", capture.viewport);
  return url.toString();
}

function proofHeaders(dashboard) {
  const auth = dashboard.proofAuth;
  if (!auth?.env || auth.type !== "bearer-env") return {};
  const token = process.env[auth.env];
  return token ? { authorization: `Bearer ${token}` } : {};
}

function resolverLaunchArgs(captureDashboards) {
  const resolverConfigPath = path.join(designDir, "dashboard-production-resolver.json");
  if (!fs.existsSync(resolverConfigPath)) return [];
  const config = readJson(resolverConfigPath);
  if (config.enabledForProductionProofCapture === false) return [];
  const rules = [];
  for (const dashboard of captureDashboards) {
    const provider = dashboard.deployment?.provider;
    const providerConfig = provider ? config.providers?.[provider] : null;
    if (!providerConfig?.edgeIp) continue;
    const hostname = hostnameFor(dashboard);
    if (!hostname) continue;
    const allowedDomains = providerConfig.domains ?? [];
    if (allowedDomains.length && !allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) continue;
    rules.push(`MAP ${hostname} ${providerConfig.edgeIp}`);
  }
  const unique = [...new Set(rules)];
  return unique.length ? [`--host-resolver-rules=${unique.join(",")}`] : [];
}

function hostnameFor(dashboard) {
  const configuredHost = dashboard.deployment?.caddyHost;
  if (configuredHost) return configuredHost;
  try {
    return new URL(dashboard.proofUrl ?? dashboard.url).hostname;
  } catch {
    return null;
  }
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function finding(severity, code, message, data) {
  return { severity, code, message, data };
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function renderMarkdown(report) {
  return [
    "# Dashboard Fleet Visual Regression Run",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    "",
    `Average score: ${report.summary.averageScore}%`,
    `Pass: ${report.summary.passCount}/${report.dashboardCount}`,
    `Needs review: ${report.summary.needsReviewCount}`,
    `Missing artifacts: ${report.summary.missingArtifactsCount}`,
    `Fail: ${report.summary.failCount}`,
    "",
    markdownTable(
      ["Dashboard", "Status", "Score", "Required", "Missing Baseline", "Missing Current", "Findings"],
      report.items.map((item) => [
        item.label,
        item.status,
        `${item.score}%`,
        item.requiredCaptureCount,
        item.missingBaseline,
        item.missingCurrent,
        item.findingCount
      ])
    )
  ].join("\n");
}

function parseArgs(raw) {
  const parsed = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = raw[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = "true";
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
