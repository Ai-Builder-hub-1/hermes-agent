#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const write = args.has("--write-report");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const reportPath = path.join(root, "docs/design/static-dashboard-route-audit.json");

if (!fs.existsSync(registryPath)) {
  throw new Error(`Missing adoption registry: ${registryPath}`);
}

const registry = readJson(registryPath);
const findings = [];

for (const project of registry.projects ?? []) {
  const projectRoot = path.resolve(root, project.path);
  const manifestPath = path.resolve(root, project.manifest);
  if (!fs.existsSync(manifestPath)) {
    findings.push(issue("error", project, "", "missing_manifest", `Missing dashboard manifest: ${project.manifest}`));
    continue;
  }
  const manifest = readJson(manifestPath);
  for (const surface of manifest.surfaces ?? []) {
    const surfacePath = surface.path ?? "";
    const ext = path.extname(surfacePath).toLowerCase();
    const role = surface.role ?? "";
    const isStaticRoute = ext === ".html" || /(^|\/)public\//.test(surfacePath);
    const isPrimary = /primary|production|operator/.test(role) && !/compatibility|legacy|review|dev/.test(role);
    if (!isStaticRoute) continue;

    if (isPrimary) {
      findings.push(issue(
        "error",
        project,
        surfacePath,
        "primary_static_dashboard_route",
        "Primary dashboard route is still a hand-authored static/public surface. Migrate to a package-native frontend entrypoint."
      ));
    } else {
      findings.push(issue(
        "warning",
        project,
        surfacePath,
        "static_compatibility_route",
        "Static dashboard route remains as compatibility/review debt. Keep it out of primary navigation and schedule archive/removal."
      ));
    }
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: {
    primaryStaticDashboardRoutesAllowed: false,
    compatibilityStaticRoutesAllowedTemporarily: true,
    target: "package-native frontend entrypoints that consume @hermes/dashboard-kit",
  },
  totals: {
    errors: findings.filter((item) => item.severity === "error").length,
    warnings: findings.filter((item) => item.severity === "warning").length,
    findings: findings.length,
  },
  findings,
};

if (write) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

for (const finding of findings) {
  const prefix = finding.severity === "error" ? "error" : "warn";
  console.log(`${prefix} ${finding.projectId} ${finding.surfacePath || "(manifest)"} ${finding.code}: ${finding.message}`);
}

if (strict && report.totals.errors) {
  console.error(`Static dashboard route audit failed: ${report.totals.errors} primary static route(s).`);
  process.exit(1);
}

console.log(`Static dashboard route audit complete: ${report.totals.errors} error(s), ${report.totals.warnings} warning(s).`);

function issue(severity, project, surfacePath, code, message) {
  return {
    severity,
    projectId: project.id,
    projectName: project.name,
    surfacePath,
    code,
    message,
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
