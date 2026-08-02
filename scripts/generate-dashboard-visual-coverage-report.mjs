#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dashboardsPath = path.join(root, "hermes.dashboards.json");
const screenshotDir = path.join(root, "docs/design/production-screenshots");
const qualityPath = path.join(root, "docs/design/dashboard-visual-quality-report.json");
const jsonPath = path.join(root, "docs/design/dashboard-visual-coverage-report.json");
const mdPath = path.join(root, "docs/design/dashboard-visual-coverage-report.md");

const dashboards = JSON.parse(fs.readFileSync(dashboardsPath, "utf8")).dashboards ?? [];
const quality = fs.existsSync(qualityPath) ? JSON.parse(fs.readFileSync(qualityPath, "utf8")) : { items: [] };
const screenshots = fs.existsSync(screenshotDir) ? fs.readdirSync(screenshotDir).filter((file) => file.endsWith(".png")) : [];
const qualityByProject = new Map((quality.items ?? []).map((item) => [item.project, item]));
const freshnessSlaDays = 30;

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const items = dashboards.map((dashboard) => {
  const screenshot = screenshots.find((file) => file.includes(slug(dashboard.id)) || file.includes(slug(dashboard.projectName ?? dashboard.label)));
  const screenshotPath = screenshot ? path.join(screenshotDir, screenshot) : "";
  const screenshotUpdatedAt = screenshot ? fs.statSync(screenshotPath).mtime.toISOString() : null;
  const screenshotAgeDays = screenshot ? Math.floor((Date.now() - fs.statSync(screenshotPath).mtimeMs) / 86_400_000) : null;
  const qualityItem = qualityByProject.get(slug(dashboard.projectName ?? dashboard.label)) ?? qualityByProject.get(slug(dashboard.owner ?? dashboard.label));
  return {
    dashboardId: dashboard.id,
    label: dashboard.label,
    url: dashboard.url,
    hasScreenshot: Boolean(screenshot),
    screenshot: screenshot ? `docs/design/production-screenshots/${screenshot}` : null,
    screenshotUpdatedAt,
    screenshotAgeDays,
    screenshotFresh: screenshotAgeDays === null ? false : screenshotAgeDays <= freshnessSlaDays,
    hasProofUrl: Boolean(dashboard.proofUrl || dashboard.localProofUrl),
    hasHealthUrl: Boolean(dashboard.healthUrl),
    visualQualityStatus: qualityItem?.status ?? "unscored",
    visualQualityScore: qualityItem?.score ?? null,
    status: screenshot && dashboard.healthUrl ? screenshotAgeDays <= freshnessSlaDays ? "covered" : "stale-evidence" : "needs-evidence"
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  freshnessSlaDays,
  dashboardCount: dashboards.length,
  coveredCount: items.filter((item) => item.status === "covered").length,
  staleCount: items.filter((item) => item.status === "stale-evidence").length,
  items
};

fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, `${[
  "# Dashboard Visual Coverage Report",
  "",
  `Generated: ${report.generatedAt}`,
  `Covered: ${report.coveredCount}/${report.dashboardCount}`,
  `Freshness SLA: ${freshnessSlaDays} days`,
  "",
  ...items.map((item) => `- ${item.status} ${item.label}: screenshot=${item.hasScreenshot}, age=${item.screenshotAgeDays ?? "n/a"}d, health=${item.hasHealthUrl}, quality=${item.visualQualityStatus}`)
].join("\n")}\n`);

console.log(`Dashboard visual coverage report generated: ${report.coveredCount}/${report.dashboardCount} covered.`);
