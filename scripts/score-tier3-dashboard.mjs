#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const projectDir = path.resolve(process.cwd(), args.projectDir || ".");
const out = path.resolve(projectDir, args.out || "proof/tier3-dashboard-score.json");
const manifest = readJson(path.join(projectDir, ".hermes-dashboard.json"));
const checks = [];

score("package-native implementation", 16, manifest.dashboardKit?.adoptionMode === "package-native" || manifest.dashboardKit?.implementationMode === "package-native");
score("Tier 3 target and current", 10, Number(manifest.dashboardKit?.targetExperienceTier) >= 3 && Number(manifest.dashboardKit?.currentExperienceTier) >= 3);
score("static adapter disabled", 8, manifest.dashboardKit?.staticAdapterAllowed === false);
score("Mobbin intake present", 10, fileExists(manifest.referenceIntake?.path));
score("design review present", 8, fileExists(manifest.designReview?.path));
score("proof config present", 8, fileExists(manifest.proof?.playwrightConfig));
score("proof capture script present", 6, fileExists(manifest.proof?.captureScript));
score("surface imports dashboard kit", 10, surfacesContain("@hermes/dashboard-kit"));
score("one-shell primitives present", 8, surfacesContain("DashboardShell") && surfacesContain("DashboardSidebar") && surfacesContain("DashboardHeader"));
score("state coverage declared", 6, surfacesContain("DashboardEmptyState") || surfacesContain("VisualizationStateFrame"));
score("chart/table coverage", 5, surfacesContain("ChartPanel") && surfacesContain("DataTable"));
score("theme mode present", 5, surfacesContain("data-theme=") || surfacesContain("hdk-theme-scope"));

const renderedAudit = readJsonIfExists(path.join(projectDir, "proof/rendered-dashboard-audit.json"));
if (renderedAudit) {
  score("rendered audit passing", 8, renderedAudit.status === "pass", renderedAudit.status);
} else {
  checks.push({ id: "rendered audit passing", weight: 8, earned: 0, status: "missing", note: "Run dashboard:rendered:audit against the local/proof URL." });
}

const visualRegression = readJsonIfExists(path.join(projectDir, "proof/dashboard-baseline/visual-regression-report.json"));
if (visualRegression) {
  score("visual regression passing", 8, visualRegression.status === "pass", visualRegression.status);
} else {
  checks.push({ id: "visual regression passing", weight: 8, earned: 0, status: "missing", note: "Capture and compare approved/current visual baselines." });
}

const total = checks.reduce((sum, check) => sum + check.weight, 0);
const earned = checks.reduce((sum, check) => sum + check.earned, 0);
const percent = total ? Math.round((earned / total) * 1000) / 10 : 0;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  projectId: manifest.projectId,
  projectDir,
  score: percent,
  status: percent >= 95 ? "tier3-ready" : percent >= 80 ? "near-tier3" : "needs-migration",
  checks
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Tier 3 dashboard score: ${percent}% (${report.status})`);
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
if (args.strict === "true" && percent < Number(args.minimum || 95)) process.exit(1);

function score(id, weight, passed, note) {
  checks.push({ id, weight, earned: passed ? weight : 0, status: passed ? "pass" : "fail", note });
}

function surfacesContain(needle) {
  return (manifest.surfaces ?? []).some((surface) => {
    const file = path.join(projectDir, surface.path || "");
    return fs.existsSync(file) && fs.readFileSync(file, "utf8").includes(needle);
  });
}

function fileExists(relativePath) {
  return Boolean(relativePath && fs.existsSync(path.join(projectDir, relativePath)));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readJsonIfExists(file) {
  return fs.existsSync(file) ? readJson(file) : null;
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
