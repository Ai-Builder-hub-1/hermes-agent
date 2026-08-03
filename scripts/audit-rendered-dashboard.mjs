#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const args = parseArgs(process.argv.slice(2));
const url = args.url || process.env.DASHBOARD_PROOF_URL;
if (!url) {
  console.error("Usage: npm run dashboard:rendered:audit -- --url http://127.0.0.1:4177 --out proof/rendered-audit.json");
  process.exit(1);
}

const out = path.resolve(process.cwd(), args.out || "proof/rendered-dashboard-audit.json");
const browser = await chromium.launch();
const findings = [];
const states = [];

for (const theme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
  const audit = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("body *"));
    const visible = all.filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    });
    const overflowX = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const shellCount = document.querySelectorAll(".hdk-shell, [data-hdk-shell], .dashboard-shell, .app-shell").length;
    const sidebarCount = document.querySelectorAll(".hdk-sidebar, .hdk-sidebar-rail, .sidebar, [data-hdk-sidebar]").length;
    const sidebar =
      document.querySelector("[data-component='DashboardSidebar'], [data-hdk-component='Sidebar'], .hdk-sidebar-rail, .hdk-sidebar, .sidebar");
    const sidebarControls =
      sidebar ? Array.from(sidebar.querySelectorAll("a, button, [role='link'], [role='button']")) : [];
    const sidebarGroups =
      sidebar ? sidebar.querySelectorAll("section, [data-nav-group], .nav-group, fieldset").length : 0;
    const sidebarActive =
      sidebar ? sidebar.querySelectorAll(".active, .is-active, [aria-current='page'], [data-active='true']").length : 0;
    const sidebarShortLabels =
      sidebarControls.filter((element) =>
        element.hasAttribute("data-short") ||
        element.hasAttribute("data-short-label") ||
        element.querySelector("[aria-hidden='true']") ||
        element.getAttribute("aria-label")
      ).length;
    const sidebarBrand =
      sidebar ? sidebar.querySelector(".hdk-brand, .hdk-sidebar-brand, .brand, [data-sidebar-brand], [data-nav-brand], .mark, .hdk-brand__mark") : null;
    const sidebarFooter =
      sidebar ? sidebar.querySelector(".hdk-sidebar-footer, .sidebar-note, .dashboard-switcher, [data-sidebar-footer], [data-dashboard-list]") : null;
    const sidebarToggle =
      sidebar ? sidebar.querySelector("[data-sidebar-toggle], [aria-label*='Collapse'], [aria-label*='Expand']") : null;
    const clipped = visible
      .filter((element) => element.scrollWidth > element.clientWidth + 3 || element.scrollHeight > element.clientHeight + 3)
      .slice(0, 30)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: String(element.getAttribute("class") || "").slice(0, 120),
        text: String(element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight
      }));
    const stateTerms = ["empty", "loading", "error", "stale", "partial", "proof", "permission"];
    const visibleText = document.body.innerText.toLowerCase();
    return {
      overflowX,
      shellCount,
      sidebarCount,
      clipped,
      chartPanels: document.querySelectorAll(".hdk-chart-panel, [data-chart-panel], svg[role='img'], canvas").length,
      tables: document.querySelectorAll(".hdk-table-wrap, table, [role='table'], [role='grid']").length,
      sidebarQuality: {
        hasBrand:
          Boolean(sidebarBrand),
        groups:
          sidebarGroups,
        active:
          sidebarActive,
        controls:
          sidebarControls.length,
        shortLabels:
          sidebarShortLabels,
        hasFooter:
          Boolean(sidebarFooter),
        hasToggle:
          Boolean(sidebarToggle),
        mobileMode:
          window.innerWidth <= 640 ? "mobile" : "desktop"
      },
      stateCoverage: stateTerms.filter((term) => visibleText.includes(term)),
      darkCardsInLightShell: document.documentElement.getAttribute("data-theme") === "light"
        ? Array.from(document.querySelectorAll("*")).filter((element) => {
            const color = window.getComputedStyle(element).backgroundColor;
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!match) return false;
            const [, r, g, b] = match.map(Number);
            return r < 35 && g < 35 && b < 35 && !element.closest("[data-approved-dark-panel='true']");
          }).length
        : 0
    };
  });

  if (audit.overflowX > 2) findings.push(finding("error", "render.overflowX", `${theme} mode has horizontal document overflow ${audit.overflowX}px`));
  if (audit.shellCount > 1) findings.push(finding("error", "render.duplicateShell", `${theme} mode has ${audit.shellCount} shell candidates`));
  if (audit.sidebarCount === 0) findings.push(finding("error", "render.sidebarMissing", `${theme} mode has no sidebar/navigation rail evidence`));
  if (audit.sidebarCount > 2) findings.push(finding("warning", "render.duplicateSidebar", `${theme} mode has ${audit.sidebarCount} sidebar candidates`));
  if (!audit.sidebarQuality.hasBrand) findings.push(finding("error", "render.sidebarBrandMissing", `${theme} mode sidebar is missing a brand mark/block`));
  if (audit.sidebarQuality.groups < 2 && audit.sidebarQuality.controls >= 5) findings.push(finding("error", "render.sidebarGroupsMissing", `${theme} mode sidebar has ${audit.sidebarQuality.controls} controls but fewer than two nav groups`));
  if (audit.sidebarQuality.active < 1) findings.push(finding("error", "render.sidebarActiveMissing", `${theme} mode sidebar has no active route state`));
  if (audit.sidebarQuality.controls >= 5 && audit.sidebarQuality.shortLabels < Math.ceil(audit.sidebarQuality.controls * 0.6)) {
    findings.push(finding("warning", "render.sidebarCollapsedLabelsMissing", `${theme} mode sidebar lacks collapsed-label evidence on enough nav controls`, audit.sidebarQuality));
  }
  if (!audit.sidebarQuality.hasFooter) findings.push(finding("warning", "render.sidebarFooterMissing", `${theme} mode sidebar lacks footer/status/dashboard-switcher context`));
  if (!audit.sidebarQuality.hasToggle && audit.sidebarQuality.controls >= 5) findings.push(finding("warning", "render.sidebarToggleMissing", `${theme} mode sidebar lacks collapse/drawer toggle evidence`));
  if (audit.clipped.length > 8) findings.push(finding("warning", "render.clippedText", `${theme} mode has ${audit.clipped.length} clipped/overflowing visible elements`, { examples: audit.clipped.slice(0, 5) }));
  if (audit.chartPanels === 0) findings.push(finding("warning", "render.chartPanelsMissing", `${theme} mode has no chart/canvas/chart panel evidence`));
  if (audit.tables === 0) findings.push(finding("warning", "render.tablesMissing", `${theme} mode has no table/grid evidence`));
  if (audit.darkCardsInLightShell > 0) findings.push(finding("warning", "render.darkPanelInLightShell", `${theme} mode has ${audit.darkCardsInLightShell} unapproved dark panel candidates`));
  states.push({ theme, ...audit });
  await page.close();
}

await browser.close();
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  url,
  status: findings.some((item) => item.severity === "error") ? "fail" : findings.length ? "needs-review" : "pass",
  findings,
  states
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Rendered dashboard audit: ${report.status}`);
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
if (args.strict === "true" && report.status !== "pass") process.exit(1);

function finding(severity, code, message, data) {
  return { severity, code, message, data };
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
