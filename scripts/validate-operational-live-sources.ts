#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OPERATIONAL_PAGE_CONTRACTS } from "../web/src/lib/operational-page-contracts.ts";

type SourceStatus = "reachable" | "auth_required" | "dependency_unavailable" | "failed" | "blocked";

interface SourceResult {
  source: string;
  status: SourceStatus;
  httpStatus: number | null;
  contentType: string;
  pages: string[];
  issue: string;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const outJson = path.join(root, "docs/design/operational-live-source-validation-report.json");
const outMd = path.join(root, "docs/design/operational-live-source-validation-report.md");
const SESSION_TOKEN_RE = /window\.__HERMES_SESSION_TOKEN__\s*=\s*"([^"]+)"/;

function argValue(name: string, fallback: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

async function discoverLoopbackSessionToken(baseUrl: string) {
  if (process.env.HERMES_DASHBOARD_SESSION_TOKEN) return process.env.HERMES_DASHBOARD_SESSION_TOKEN;
  if (process.env.DASHBOARD_SESSION_TOKEN) return process.env.DASHBOARD_SESSION_TOKEN;
  if (hasFlag("--no-discover-session-token")) return "";
  try {
    const response = await fetch(baseUrl, { method: "GET" });
    const html = await response.text();
    return html.match(SESSION_TOKEN_RE)?.[1] ?? "";
  } catch {
    return "";
  }
}

function requestHeaders(sessionToken: string) {
  const headers: Record<string, string> = { accept: "application/json,text/plain,*/*" };
  const bearer = process.env.DASHBOARD_BEARER_TOKEN;
  const cookie = process.env.DASHBOARD_AUTH_COOKIE;
  const header = argValue("--header", "");
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  if (cookie) headers.cookie = cookie;
  if (sessionToken) headers["X-Hermes-Session-Token"] = sessionToken;
  if (header.includes(":")) {
    const [name, ...valueParts] = header.split(":");
    headers[name.trim()] = valueParts.join(":").trim();
  }
  return headers;
}

function markdownTable(headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => String(value).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

function sourcePages() {
  const pagesBySource = new Map<string, Set<string>>();
  for (const contract of OPERATIONAL_PAGE_CONTRACTS) {
    for (const source of contract.liveSources) {
      const pages = pagesBySource.get(source) ?? new Set<string>();
      pages.add(contract.route);
      pagesBySource.set(source, pages);
    }
  }
  return [...pagesBySource.entries()]
    .map(([source, pages]) => ({ source, pages: [...pages].sort() }))
    .sort((left, right) => left.source.localeCompare(right.source));
}

async function validateSource(baseUrl: string, source: string, pages: string[], sessionToken: string): Promise<SourceResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(new URL(source, baseUrl), {
      method: "GET",
      headers: requestHeaders(sessionToken),
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";
    let issue = "";
    if (!response.ok) issue = `HTTP status ${response.status}`;
    if (response.ok && response.status === 204) issue = "empty 204 response";
    const status = response.ok
      ? "reachable"
      : response.status === 401 || response.status === 403
        ? "auth_required"
        : response.status === 503
          ? "dependency_unavailable"
          : "failed";
    return {
      source,
      status,
      httpStatus: response.status,
      contentType,
      pages,
      issue,
    };
  } catch (error) {
    return {
      source,
      status: "blocked",
      httpStatus: null,
      contentType: "",
      pages,
      issue: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const baseUrl = argValue("--base-url", process.env.DASHBOARD_API_BASE_URL ?? process.env.HERMES_DASHBOARD_URL ?? "http://127.0.0.1:9119");
  const sessionToken = await discoverLoopbackSessionToken(baseUrl);
  const sources = sourcePages();
  const results: SourceResult[] = [];
  for (const source of sources) {
    results.push(await validateSource(baseUrl, source.source, source.pages, sessionToken));
  }

  const authRequiredSources = results.filter((result) => result.status === "auth_required");
  const dependencyUnavailableSources = results.filter((result) => result.status === "dependency_unavailable");
  const failedSources = results.filter((result) => result.status === "failed");
  const blockedSources = results.filter((result) => result.status === "blocked");
  const reachableSources = results.filter((result) => result.status === "reachable");
  const impactedRoutes = new Set([...authRequiredSources, ...dependencyUnavailableSources, ...failedSources, ...blockedSources].flatMap((result) => result.pages));
  const summary = {
    baseUrl,
    sources: results.length,
    reachable: reachableSources.length,
    authRequired: authRequiredSources.length,
    dependencyUnavailable: dependencyUnavailableSources.length,
    failed: failedSources.length,
    blocked: blockedSources.length,
    impactedRoutes: impactedRoutes.size,
    status: failedSources.length || blockedSources.length
      ? "attention"
      : dependencyUnavailableSources.length
        ? "dependency_unavailable"
        : authRequiredSources.length
          ? "auth_required"
          : "ready",
    authMode: process.env.DASHBOARD_BEARER_TOKEN
      ? "bearer"
      : process.env.DASHBOARD_AUTH_COOKIE
        ? "cookie"
        : sessionToken
          ? "loopback_session_token"
          : argValue("--header", "")
          ? "custom_header"
          : "none",
    sessionTokenDiscovered: Boolean(sessionToken),
  };
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    summary,
    sources: results,
    routeImpacts: [...impactedRoutes].sort().map((route) => ({
      route,
      blockedSources: results
        .filter((result) => result.pages.includes(route) && result.status !== "reachable")
        .map((result) => result.source),
    })),
  };

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

  const md = `# Operational Live Source Validation Report

Generated: ${report.generatedAt}

## Summary

${markdownTable(
  ["Metric", "Value"],
  Object.entries(summary).map(([key, value]) => [key, value]),
)}

## Sources

${markdownTable(
  ["Source", "Status", "HTTP", "Pages", "Issue"],
  results.map((result) => [
    result.source,
    result.status,
    result.httpStatus ?? "",
    result.pages.join(", "),
    result.issue || "none",
  ]),
)}

## Impacted Routes

${report.routeImpacts.length
  ? markdownTable(
      ["Route", "Blocked sources"],
      report.routeImpacts.map((impact) => [impact.route, impact.blockedSources.join(", ")]),
    )
  : "No routes have unreachable declared live sources."}
`;

  fs.writeFileSync(outMd, md);
  console.log(`Operational live source validation wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
  console.log(
    `${summary.reachable}/${summary.sources} sources reachable (${summary.authRequired} auth required, ${summary.dependencyUnavailable} dependency unavailable, ${summary.failed} failed, ${summary.blocked} blocked).`,
  );

  if (hasFlag("--strict") && (summary.failed || summary.blocked)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
