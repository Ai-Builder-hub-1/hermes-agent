#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "docs/design/dashboard-production-proof-registry.json");
const resolverConfigPath = path.join(root, "docs/design/dashboard-production-resolver.json");
const outputDir = path.join(root, "docs/design/production-screenshots");
const args = process.argv.slice(2);
const idArg = args.find((arg) => arg.startsWith("--id="));
const onlyId = idArg ? idArg.slice("--id=".length) : null;
const timeoutMs = Number(args.find((arg) => arg.startsWith("--timeout="))?.slice("--timeout=".length) ?? 30000);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readJsonIfExists(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return readJson(file);
}

function hostnameFromEntry(entry) {
  const configuredHost = entry.deployment?.caddyHost;
  if (configuredHost) return configuredHost;
  const targetUrl = entry.proofUrl || entry.url;
  if (!targetUrl) return null;
  try {
    return new URL(targetUrl).hostname;
  } catch {
    return null;
  }
}

function proofCaptureTarget(entry) {
  const targetUrl = entry.proofUrl || entry.url;
  const headers = {};
  const proofAuth = entry.proofAuth;
  if (!proofAuth) return { targetUrl, headers, proofEndpointUsed: Boolean(entry.proofUrl) };

  const token = proofAuth.env ? process.env[proofAuth.env] : undefined;
  if (!token) return { targetUrl, headers, proofEndpointUsed: Boolean(entry.proofUrl), authMissing: Boolean(proofAuth.env) };

  if (proofAuth.type === "bearer-env") {
    headers.authorization = `Bearer ${token}`;
    return { targetUrl, headers, proofEndpointUsed: Boolean(entry.proofUrl), authMissing: false };
  }

  if (proofAuth.type === "query-token-env") {
    const url = new URL(targetUrl);
    url.searchParams.set(proofAuth.param ?? "proofToken", token);
    return { targetUrl: url.toString(), headers, proofEndpointUsed: Boolean(entry.proofUrl), authMissing: false };
  }

  return { targetUrl, headers, proofEndpointUsed: Boolean(entry.proofUrl), authMissing: true };
}

if (!fs.existsSync(registryPath)) {
  console.error("Missing production proof registry. Run npm run dashboard:production-proof:registry first.");
  process.exit(1);
}

const registry = readJson(registryPath);
const entries = (registry.entries ?? []).filter((entry) => !onlyId || entry.id === onlyId);

if (!entries.length) {
  console.error(onlyId ? `No production dashboard found for id: ${onlyId}` : "No production dashboards found.");
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

function providerResolverRules(captureEntries) {
  const config = readJsonIfExists(resolverConfigPath, {});
  if (config.enabledForProductionProofCapture === false) return [];
  const providers = config.providers ?? {};
  const rules = [];
  for (const entry of captureEntries) {
    const provider = entry.deployment?.provider;
    const providerConfig = provider ? providers[provider] : null;
    if (!providerConfig?.edgeIp) continue;
    const hostname = hostnameFromEntry(entry);
    if (!hostname) continue;
    const allowedDomains = providerConfig.domains ?? [];
    if (allowedDomains.length && !allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) continue;
    rules.push(`MAP ${hostname} ${providerConfig.edgeIp}`);
  }
  return [...new Set(rules)];
}

const launchArgs = [];
const resolverRules = [
  ...providerResolverRules(entries),
  ...(process.env.HERMES_DASHBOARD_HOST_RESOLVER_RULES ? [process.env.HERMES_DASHBOARD_HOST_RESOLVER_RULES] : [])
].filter(Boolean);
if (resolverRules.length) {
  launchArgs.push(`--host-resolver-rules=${resolverRules.join(",")}`);
}

const browser = await chromium.launch({ args: launchArgs });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce"
});

const results = [];
for (const entry of entries) {
  const page = await context.newPage();
  const screenshotPath = path.join(root, entry.screenshotBaselinePath);
  const startedAt = new Date().toISOString();
  try {
    const target = proofCaptureTarget(entry);
    if (Object.keys(target.headers).length) {
      await page.setExtraHTTPHeaders(target.headers);
    }
    const response = await page.goto(target.targetUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    const httpStatus = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 10000) }).catch(() => {});
    const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    const lowerText = bodyText.toLowerCase();
    const passwordFields = await page.locator("input[type='password']").count().catch(() => 0);
    const authWallDetected = passwordFields > 0 || (
      lowerText.includes("sign in") &&
      (lowerText.includes("password") || lowerText.includes("username") || lowerText.includes("signed out"))
    );
    const blankPrimaryDetected = bodyText.trim().length < 120;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    if (httpStatus && httpStatus >= 400) {
      results.push({
        id: entry.id,
        url: entry.url,
        status: "failed",
        screenshotBaselinePath: entry.screenshotBaselinePath,
        proofEndpointUsed: target.proofEndpointUsed,
        proofAuthMissing: target.authMissing ?? false,
        httpStatus,
        authWallDetected,
        blankPrimaryDetected,
        textLength: bodyText.trim().length,
        error: `Proof endpoint returned HTTP ${httpStatus}`
      });
      continue;
    }
    results.push({
      id: entry.id,
      url: entry.url,
      status: authWallDetected || blankPrimaryDetected ? "captured-review-needed" : "captured",
      screenshotBaselinePath: entry.screenshotBaselinePath,
      capturedAt: startedAt,
      proofEndpointUsed: target.proofEndpointUsed,
      proofAuthMissing: target.authMissing ?? false,
      httpStatus,
      authWallDetected,
      blankPrimaryDetected,
      textLength: bodyText.trim().length
    });
  } catch (error) {
    results.push({
      id: entry.id,
      url: entry.url,
      status: "failed",
      screenshotBaselinePath: entry.screenshotBaselinePath,
      proofEndpointUsed: Boolean(entry.proofUrl),
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await page.close();
  }
}

await browser.close();

const byId = new Map(results.map((result) => [result.id, result]));
const updatedEntries = (registry.entries ?? []).map((entry) => {
  const result = byId.get(entry.id);
  if (!result) return entry;
  const captured = result.status === "captured";
  const reviewNeeded = result.status === "captured-review-needed";
  return {
    ...entry,
    proof: {
      ...(entry.proof ?? {}),
      screenshotCaptured: captured || reviewNeeded,
      screenshotBaselinePath: entry.screenshotBaselinePath,
      capturedAt: captured || reviewNeeded ? result.capturedAt : entry.proof?.capturedAt,
      proofEndpointDeclared: Boolean(entry.proofUrl),
      proofEndpointUsed: result.proofEndpointUsed ?? entry.proof?.proofEndpointUsed ?? false,
      proofAuthMissing: result.proofAuthMissing ?? entry.proof?.proofAuthMissing ?? false,
      httpStatus: result.httpStatus ?? entry.proof?.httpStatus,
      authWallDetected: result.authWallDetected ?? entry.proof?.authWallDetected ?? false,
      blankPrimaryDetected: result.blankPrimaryDetected ?? entry.proof?.blankPrimaryDetected ?? false,
      textLength: result.textLength ?? entry.proof?.textLength,
      lastError: captured || reviewNeeded ? undefined : result.error
    },
    status: captured ? "baseline-present" : reviewNeeded ? "captured-review-needed" : "baseline-needed"
  };
});

fs.writeFileSync(registryPath, `${JSON.stringify({
  ...registry,
  generatedAt: new Date().toISOString(),
  entries: updatedEntries,
  lastCapture: {
    generatedAt: new Date().toISOString(),
    requestedId: onlyId,
    capturedCount: results.filter((result) => result.status === "captured").length,
    reviewNeededCount: results.filter((result) => result.status === "captured-review-needed").length,
    failedCount: results.filter((result) => result.status === "failed").length,
    results
  }
}, null, 2)}\n`);

const failures = results.filter((result) => result.status === "failed");
for (const result of results) {
  console.log(`${result.status}: ${result.id} -> ${result.screenshotBaselinePath}`);
  if (result.proofEndpointUsed) console.log("  proof endpoint used");
  if (result.proofAuthMissing) console.log("  proof auth token missing");
  if (result.authWallDetected) console.log("  auth wall detected");
  if (result.blankPrimaryDetected) console.log("  blank primary region suspected");
  if (result.error) console.log(`  ${result.error}`);
}

if (failures.length) {
  console.error(`Production screenshot capture completed with ${failures.length} failure(s).`);
  process.exit(1);
}

console.log(`Production screenshot capture completed for ${results.length} dashboard(s).`);
