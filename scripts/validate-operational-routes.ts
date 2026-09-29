#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "@playwright/test";
import { OPERATIONAL_PAGE_CONTRACTS } from "../web/src/lib/operational-page-contracts.ts";

type RouteValidationStatus = "passed" | "failed" | "blocked";

interface RouteValidationResult {
  route: string;
  group: string;
  label: string;
  maturity: string;
  status: RouteValidationStatus;
  httpStatus: number | null;
  title: string;
  textLength: number;
  issues: string[];
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const outJson = path.join(root, "docs/design/operational-route-validation-report.json");
const outMd = path.join(root, "docs/design/operational-route-validation-report.md");

function argValue(name: string, fallback: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function markdownTable(headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => String(value).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

async function checkBaseUrl(baseUrl: string) {
  try {
    const response = await fetch(baseUrl, { method: "GET" });
    return { ok: response.ok, status: response.status, error: "" };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function validateRoute(browser: Browser, baseUrl: string, contract: (typeof OPERATIONAL_PAGE_CONTRACTS)[number]): Promise<RouteValidationResult> {
  const page = await browser.newPage();
  const issues: string[] = [];
  let httpStatus: number | null = null;
  let title = "";
  let bodyText = "";

  try {
    const response = await page.goto(new URL(contract.route, baseUrl).toString(), {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });
    httpStatus = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    title = await page.title().catch(() => "");
    bodyText = (await page.locator("body").innerText({ timeout: 5_000 }).catch(() => "")).trim();

    if (!response || !response.ok()) issues.push(`HTTP status ${httpStatus ?? "unknown"}`);
    if (bodyText.length < 120) issues.push("rendered body text is too short");
    if (/This route is registered for the Hermes dashboard governance system/i.test(bodyText)) {
      issues.push("placeholder governance route copy is still visible");
    }
    if (/ready for package-native component composition/i.test(bodyText)) {
      issues.push("package-native placeholder copy is still visible");
    }
    if (/404|Not Found/i.test(title) && bodyText.length < 500) issues.push("route appears to be a not-found page");
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  } finally {
    await page.close().catch(() => undefined);
  }

  return {
    route: contract.route,
    group: contract.group,
    label: contract.label,
    maturity: contract.maturity,
    status: issues.length ? "failed" : "passed",
    httpStatus,
    title,
    textLength: bodyText.length,
    issues,
  };
}

async function persistEvidence(apiBaseUrl: string, report: unknown) {
  const response = await fetch(new URL("/api/operating-runtime/evidence", apiBaseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: "quality",
      subject: "Operational route validation",
      state: "ready",
      owner: "Dashboard Operations",
      detail: "Browser route validation completed for Operate, Trading, System, Second Brain, and Compounding Intelligence surfaces.",
      payload: report,
    }),
  });
  return { ok: response.ok, status: response.status, text: await response.text().catch(() => "") };
}

async function main() {
  const baseUrl = argValue("--base-url", process.env.DASHBOARD_BASE_URL ?? "http://127.0.0.1:4177");
  const persist = hasFlag("--persist-evidence");
  const apiBaseUrl = argValue("--api-base-url", process.env.DASHBOARD_API_BASE_URL ?? baseUrl);
  const baseCheck = await checkBaseUrl(baseUrl);
  const results: RouteValidationResult[] = [];
  let browserStatus: "available" | "blocked" = "available";
  let evidencePersistStatus: { ok: boolean; status: number; text: string } | null = null;

  if (!baseCheck.ok) {
    for (const contract of OPERATIONAL_PAGE_CONTRACTS) {
      results.push({
        route: contract.route,
        group: contract.group,
        label: contract.label,
        maturity: contract.maturity,
        status: "blocked",
        httpStatus: baseCheck.status,
        title: "",
        textLength: 0,
        issues: [`Base URL unavailable: ${baseCheck.error || baseCheck.status || "unknown"}`],
      });
    }
  } else {
    try {
      const browser = await chromium.launch();
      for (const contract of OPERATIONAL_PAGE_CONTRACTS) {
        results.push(await validateRoute(browser, baseUrl, contract));
      }
      await browser.close();
    } catch (error) {
      browserStatus = "blocked";
      const message = error instanceof Error ? error.message : String(error);
      for (const contract of OPERATIONAL_PAGE_CONTRACTS) {
        results.push({
          route: contract.route,
          group: contract.group,
          label: contract.label,
          maturity: contract.maturity,
          status: "blocked",
          httpStatus: null,
          title: "",
          textLength: 0,
          issues: [`Browser unavailable: ${message}`],
        });
      }
    }
  }

  const summary = {
    routes: results.length,
    passed: results.filter((result) => result.status === "passed").length,
    failed: results.filter((result) => result.status === "failed").length,
    blocked: results.filter((result) => result.status === "blocked").length,
    baseUrl,
    browserStatus,
  };

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    summary,
    baseCheck,
    routes: results,
  };

  if (persist) {
    try {
      evidencePersistStatus = await persistEvidence(apiBaseUrl, report);
    } catch (error) {
      evidencePersistStatus = {
        ok: false,
        status: 0,
        text: error instanceof Error ? error.message : String(error),
      };
    }
    Object.assign(report, { evidencePersistStatus });
  }

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

  const md = `# Operational Route Validation Report

Generated: ${report.generatedAt}

## Summary

${markdownTable(
  ["Metric", "Value"],
  Object.entries(summary).map(([key, value]) => [key, value]),
)}

## Routes

${markdownTable(
  ["Route", "Group", "Maturity", "Status", "HTTP", "Text", "Issues"],
  results.map((result) => [
    result.route,
    result.group,
    result.maturity,
    result.status,
    result.httpStatus ?? "",
    result.textLength,
    result.issues.join("; ") || "none",
  ]),
)}
`;

  fs.writeFileSync(outMd, md);
  console.log(`Operational route validation wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
  console.log(`${summary.passed}/${summary.routes} routes passed (${summary.failed} failed, ${summary.blocked} blocked).`);

  if (hasFlag("--strict") && (summary.failed || summary.blocked)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
