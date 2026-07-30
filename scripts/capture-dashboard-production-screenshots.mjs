#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "docs/design/dashboard-production-proof-registry.json");
const outputDir = path.join(root, "docs/design/production-screenshots");
const args = process.argv.slice(2);
const idArg = args.find((arg) => arg.startsWith("--id="));
const onlyId = idArg ? idArg.slice("--id=".length) : null;
const useLocalProof = args.includes("--local");
const timeoutMs = Number(args.find((arg) => arg.startsWith("--timeout="))?.slice("--timeout=".length) ?? 30000);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function proofCaptureTarget(entry) {
  const targetUrl = useLocalProof ? entry.localProofUrl || entry.proofUrl || entry.url : entry.proofUrl || entry.url;
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

const browser = await chromium.launch();
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
    const httpStatus = response?.status();
    const proofAuthFailed = httpStatus === 401 || httpStatus === 403;
    await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 10000) }).catch(() => {});
    const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    const lowerText = bodyText.toLowerCase();
    const passwordFields = await page.locator("input[type='password']").count().catch(() => 0);
    const authWallDetected = passwordFields > 0 || (
      lowerText.includes("sign in") &&
      (lowerText.includes("password") || lowerText.includes("username") || lowerText.includes("signed out"))
    );
    const blankPrimaryDetected = bodyText.trim().length < 120;
    if (proofAuthFailed) {
      results.push({
        id: entry.id,
        url: entry.url,
        status: "proof-auth-failed",
        screenshotBaselinePath: entry.screenshotBaselinePath,
        capturedAt: startedAt,
        localProofUsed: useLocalProof,
        proofEndpointUsed: target.proofEndpointUsed,
        proofAuthMissing: target.authMissing ?? false,
        httpStatus,
        authWallDetected: true,
        blankPrimaryDetected: false,
        textLength: bodyText.trim().length,
        error: `proof endpoint returned HTTP ${httpStatus}`
      });
      continue;
    }
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.push({
      id: entry.id,
      url: entry.url,
      status: authWallDetected || blankPrimaryDetected ? "captured-review-needed" : "captured",
      screenshotBaselinePath: entry.screenshotBaselinePath,
      capturedAt: startedAt,
      httpStatus,
      localProofUsed: useLocalProof,
      proofEndpointUsed: target.proofEndpointUsed,
      proofAuthMissing: target.authMissing ?? false,
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
      localProofUsed: useLocalProof,
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
  const authFailed = result.status === "proof-auth-failed";
  return {
    ...entry,
    proof: {
      ...(entry.proof ?? {}),
      screenshotCaptured: captured || reviewNeeded,
      screenshotBaselinePath: entry.screenshotBaselinePath,
      capturedAt: captured || reviewNeeded ? result.capturedAt : entry.proof?.capturedAt,
      proofEndpointDeclared: Boolean(entry.proofUrl),
      proofEndpointUsed: result.proofEndpointUsed ?? entry.proof?.proofEndpointUsed ?? false,
      localProofUsed: result.localProofUsed ?? entry.proof?.localProofUsed ?? false,
      proofAuthMissing: result.proofAuthMissing ?? entry.proof?.proofAuthMissing ?? false,
      proofAuthFailed: authFailed,
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
const authFailures = results.filter((result) => result.status === "proof-auth-failed");
for (const result of results) {
  console.log(`${result.status}: ${result.id} -> ${result.screenshotBaselinePath}`);
  if (result.proofEndpointUsed) console.log("  proof endpoint used");
  if (result.proofAuthMissing) console.log("  proof auth token missing");
  if (result.status === "proof-auth-failed") console.log("  proof auth failed");
  if (result.authWallDetected) console.log("  auth wall detected");
  if (result.blankPrimaryDetected) console.log("  blank primary region suspected");
  if (result.httpStatus) console.log(`  http ${result.httpStatus}`);
  if (result.error) console.log(`  ${result.error}`);
}

if (failures.length || authFailures.length) {
  console.error(`Production screenshot capture completed with ${failures.length} failure(s) and ${authFailures.length} auth failure(s).`);
  process.exit(1);
}

console.log(`Production screenshot capture completed for ${results.length} dashboard(s).`);
