#!/usr/bin/env node
import dns from "node:dns/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dashboardsPath = path.join(root, "hermes.dashboards.json");
const resolverConfigPath = path.join(root, "docs/design/dashboard-production-resolver.json");
const outputPath = path.join(root, "docs/design/dashboard-production-dns-report.json");

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hostnameFromDashboard(dashboard) {
  if (dashboard.deployment?.caddyHost) return dashboard.deployment.caddyHost;
  const targetUrl = dashboard.proofUrl || dashboard.url;
  if (!targetUrl) return null;
  try {
    return new URL(targetUrl).hostname;
  } catch {
    return null;
  }
}

function resolverFallbackFor(dashboard, hostname, resolverConfig) {
  const provider = dashboard.deployment?.provider;
  const providerConfig = provider ? resolverConfig.providers?.[provider] : null;
  if (!providerConfig?.edgeIp) return null;
  const allowedDomains = providerConfig.domains ?? [];
  if (allowedDomains.length && !allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) return null;
  return {
    provider,
    edgeIp: providerConfig.edgeIp,
    chromiumRule: `MAP ${hostname} ${providerConfig.edgeIp}`
  };
}

const dashboards = readJson(dashboardsPath, { dashboards: [] }).dashboards ?? [];
const resolverConfig = readJson(resolverConfigPath, {});
const items = [];

for (const dashboard of dashboards) {
  const hostname = hostnameFromDashboard(dashboard);
  if (!hostname) continue;
  let localResolved = false;
  let addresses = [];
  let error = null;
  try {
    addresses = await dns.lookup(hostname, { all: true });
    localResolved = addresses.length > 0;
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }
  const fallback = resolverFallbackFor(dashboard, hostname, resolverConfig);
  items.push({
    id: dashboard.id,
    hostname,
    provider: dashboard.deployment?.provider ?? null,
    localResolved,
    addresses: addresses.map((entry) => entry.address),
    resolverFallbackConfigured: Boolean(fallback),
    fallback,
    status: localResolved ? "local-dns-ok" : fallback ? "capture-fallback-ok" : "dns-gap",
    error
  });
}

const summary = {
  total: items.length,
  localDnsOk: items.filter((item) => item.status === "local-dns-ok").length,
  captureFallbackOk: items.filter((item) => item.status === "capture-fallback-ok").length,
  dnsGap: items.filter((item) => item.status === "dns-gap").length
};

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  summary,
  items
}, null, 2)}\n`);

console.log(`Dashboard production DNS report written: ${path.relative(root, outputPath)}`);
console.log(JSON.stringify(summary, null, 2));

if (summary.dnsGap > 0) process.exit(1);
