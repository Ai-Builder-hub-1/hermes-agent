#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import { dashboardRegistry, designDir, markdownTable, resolveProjectPath, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const args = parseArgs(process.argv.slice(2));
const strict = Boolean(args.strict);
const write = args.write !== false;
const includeProduction = Boolean(args.production);
const timeoutMs = Number(args.timeout ?? 12000);
const outputDir = path.join(designDir, "rendered-fleet-certification");
const outJson = path.join(outputDir, "report.json");
const outMd = path.join(outputDir, "report.md");
const outRepairsJson = path.join(outputDir, "repair-packets.json");
const outRepairsMd = path.join(outputDir, "repair-packets.md");
const selectedIds = new Set(String(args.id ?? args.dashboard ?? "").split(",").map((item) => item.trim()).filter(Boolean));
const projectEnvCache = new Map();

const viewportProfiles = [
  { id: "desktop", width: 1440, height: 1000 },
  { id: "mobile", width: 390, height: 844 }
];

const localCandidates = {
  "nous-hermes-agent.dashboard": [
    "http://127.0.0.1:5174/dashboard-kit-gallery",
    "http://localhost:5174/dashboard-kit-gallery",
    "http://127.0.0.1:5173/dashboard-kit-gallery",
    "http://localhost:5173/dashboard-kit-gallery",
    "http://127.0.0.1:9119/dashboard-kit-gallery",
    "http://localhost:9119/dashboard-kit-gallery"
  ],
  "khashi-vc.roc": [
    "http://localhost:4102/",
    "http://127.0.0.1:4102/",
    "http://127.0.0.1:3000/dashboard/proof?view=live-market-intelligence",
    "http://localhost:3000/dashboard/proof?view=live-market-intelligence"
  ],
  "media-engine.ops": ["http://localhost:4200/", "http://127.0.0.1:4200/"],
  "media-business-operations.main": [
    "http://localhost:5176/dashboard/react/",
    "http://127.0.0.1:5176/dashboard/react/",
    "http://localhost:4101/dashboard",
    "http://127.0.0.1:4101/dashboard",
    "http://localhost:4100/dashboard"
  ],
  "business-mapper.workspace": ["http://localhost:8765/dashboard", "http://127.0.0.1:8765/dashboard"],
  "meal-assistant.main": [
    "http://localhost:4184/dashboard/proof",
    "http://127.0.0.1:4184/dashboard/proof",
    "http://localhost:4184/",
    "http://127.0.0.1:4184/",
    "http://localhost:4184/login"
  ],
  "rinseables-os.main": ["http://localhost:3100/", "http://127.0.0.1:3100/"],
  "investing-system.roc": ["http://localhost:3102/roc", "http://127.0.0.1:3102/roc"],
  "hermes.workspace": ["http://localhost:3920/", "http://127.0.0.1:3920/", "http://localhost:3921/", "http://127.0.0.1:3921/"],
  "tlc-capital-group-os.main": ["http://localhost:3001/", "http://127.0.0.1:3001/", "http://localhost:3104/", "http://localhost:3100/dashboard"]
};

const localRoutePaths = {
  "nous-hermes-agent.dashboard": ["/", "/dashboard-kit-gallery", "/dashboard/proof"],
  "khashi-vc.roc": ["/", "/dashboard/proof?view=mission-control", "/dashboard/proof?view=market-intelligence", "/dashboard/proof?view=collection-capacity", "/dashboard/proof?view=live-market-intelligence"],
  "media-engine.ops": ["/", "/dashboard", "/dashboard/proof"],
  "media-business-operations.main": ["/dashboard/react/", "/dashboard/react/research-desk", "/dashboard", "/research-desk", "/dashboard/proof"],
  "business-mapper.workspace": ["/dashboard", "/dashboard/proof"],
  "meal-assistant.main": ["/", "/login", "/planner", "/analytics", "/dashboard/proof"],
  "rinseables-os.main": ["/", "/dashboard", "/dashboard/proof"],
  "investing-system.roc": ["/roc", "/dashboard/proof"],
  "hermes.workspace": ["/", "/dashboard/proof"],
  "tlc-capital-group-os.main": ["/", "/dashboard", "/dashboard/proof"]
};

const dashboards = dashboardRegistry().filter((dashboard) => !selectedIds.size || selectedIds.has(dashboard.id));
if (!dashboards.length) {
  console.error(selectedIds.size ? `No dashboard matched ${[...selectedIds].join(", ")}` : "No dashboards found.");
  process.exit(1);
}

const browser = await chromium.launch();
const items = [];
for (const dashboard of dashboards) {
  items.push(await certifyDashboard(browser, dashboard));
}
await browser.close();

const summary = {
  total: items.length,
  certified: items.filter((item) => item.verdict === "certified").length,
  needsReview: items.filter((item) => item.verdict === "needs-review").length,
  blocked: items.filter((item) => item.verdict === "blocked").length,
  unreachable: items.filter((item) => item.verdict === "unreachable").length,
  averageScore: round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1))
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: includeProduction ? "production" : "local",
  standard: {
    name: "Rendered Fleet HDK Certification",
    passMeaning: "The browser-rendered dashboard visibly uses the HDK shell, sidebar, header, page rhythm, cards, state/data surfaces, and responsive layout. Hidden markers, copied CSS, or package.json dependencies alone do not count.",
    blockingRules: [
      "route unreachable",
      "no visible HDK shell",
      "no visible HDK sidebar",
      "no visible HDK main/page frame",
      "hidden data-hdk/data-component markers used as compliance evidence",
      "horizontal overflow over 24px",
      "more local card/panel shells than visible HDK card surfaces",
      "tables rendered outside a card/surface"
    ]
  },
  summary,
  items
};
const repairPackets = buildRepairPackets(report);

if (write) {
  writeJson(outJson, report);
  writeMarkdown(outMd, renderMarkdown(report));
  writeJson(outRepairsJson, repairPackets);
  writeMarkdown(outRepairsMd, renderRepairMarkdown(repairPackets));
  console.log(`Wrote ${path.relative(root, outJson)}`);
  console.log(`Wrote ${path.relative(root, outMd)}`);
  console.log(`Wrote ${path.relative(root, outRepairsJson)}`);
  console.log(`Wrote ${path.relative(root, outRepairsMd)}`);
}
console.log(`Rendered fleet certification: ${summary.certified}/${summary.total} certified, ${summary.blocked} blocked, ${summary.needsReview} needs review, ${summary.unreachable} unreachable.`);

if (strict && summary.certified !== summary.total) process.exit(1);

async function certifyDashboard(activeBrowser, dashboard) {
  const targetResult = await resolveReachableUrl(activeBrowser, dashboard);
  const target = targetResult.url;
  if (!target) {
    return {
      id: dashboard.id,
      label: dashboard.label,
      targetUrl: null,
      verdict: "unreachable",
      score: 0,
      blockers: [finding("route.unreachable", `No local candidate URL loaded successfully. Attempts: ${targetResult.attempts.map((attempt) => `${attempt.url} => ${attempt.status ?? attempt.error ?? "no response"}`).join("; ") || "none"}`)],
      warnings: [],
      candidateAttempts: targetResult.attempts,
      captures: []
    };
  }

  const captures = [];
  const blockers = [];
  const warnings = [];
  const routes = await inspectRouteInventory(activeBrowser, dashboard, target);
  for (const viewport of viewportProfiles) {
    const capture = await inspectViewport(activeBrowser, dashboard, target, viewport);
    captures.push(capture);
    for (const issue of capture.blockers) blockers.push({ ...issue, viewport: viewport.id });
    for (const issue of capture.warnings) warnings.push({ ...issue, viewport: viewport.id });
  }

  const uniqueBlockers = uniqueFindings(blockers);
  const uniqueWarnings = uniqueFindings(warnings);
  const score = Math.max(0, 100 - uniqueBlockers.length * 16 - uniqueWarnings.length * 5);
  const verdict = uniqueBlockers.length ? "blocked" : uniqueWarnings.length ? "needs-review" : "certified";
  return {
    id: dashboard.id,
    label: dashboard.label,
    targetUrl: target,
    verdict,
    score,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    candidateAttempts: targetResult.attempts,
    routeInventory: routes,
    captures
  };
}

async function resolveReachableUrl(activeBrowser, dashboard) {
  const envKey = `DASHBOARD_LOCAL_URL_${dashboard.id.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
  const candidates = [
    process.env[envKey],
    ...(localCandidates[dashboard.id] ?? []),
    dashboard.localProofUrl,
    dashboard.localUrl,
    includeProduction ? dashboard.proofUrl ?? dashboard.url : null
  ].filter(Boolean);
  const attempts = [];
  for (const candidate of candidates) {
    const context = await newContext(activeBrowser, dashboard, { width: viewportProfiles[0].width, height: viewportProfiles[0].height });
    const page = await context.newPage();
    const attempt = { url: candidate, status: null, textLength: 0, elementCount: 0, title: "", error: null };
    try {
      const response = await page.goto(candidate, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      await maybePassAuth(page, dashboard);
      await page.waitForTimeout(250);
      const readiness = await page.evaluate(() => ({
        textLength: document.body?.innerText?.trim().length ?? 0,
        elementCount: document.body?.querySelectorAll("*").length ?? 0,
        title: document.title
      })).catch(() => ({ textLength: 0, elementCount: 0, title: "" }));
      attempt.status = response?.status() ?? null;
      attempt.textLength = readiness.textLength;
      attempt.elementCount = readiness.elementCount;
      attempt.title = readiness.title;
      attempts.push(attempt);
      if ((response?.status() ?? 0) < 500 && (readiness.textLength > 20 || readiness.elementCount > 8 || readiness.title)) return { url: candidate, attempts };
    } catch (error) {
      attempt.error = error instanceof Error ? error.message : String(error);
      attempts.push(attempt);
      // Try the next candidate with a fresh page so failed navigations do not poison later attempts.
    } finally {
      await context.close();
    }
  }
  return { url: null, attempts };
}

async function inspectViewport(activeBrowser, dashboard, targetUrl, viewport) {
  const context = await newContext(activeBrowser, dashboard, { width: viewport.width, height: viewport.height });
  const page = await context.newPage();
  const safeId = dashboard.id.replace(/[^a-z0-9]+/gi, "-");
  const screenshotPath = path.join(outputDir, `${safeId}-${viewport.id}.png`);
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  try {
    const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await maybePassAuth(page, dashboard);
    await page.waitForTimeout(500);
    const audit = await page.evaluate(renderedAudit);
    const interaction = await page.evaluate(interactionAudit);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const blockers = [];
    const warnings = [];
    if ((response?.status() ?? 0) >= 500) blockers.push(finding("route.httpError", `HTTP status ${response?.status()}.`));
    if (audit.visibleTextLength < 80) blockers.push(finding("route.blankOrBlocked", "Rendered page has very little visible text."));
    if (audit.passwordFields && !audit.visibleShells) warnings.push(finding("auth.loginOnly", "Route lands on login before the operator dashboard can be visually certified."));
    if (!audit.visibleShells) blockers.push(finding("hdk.shellMissing", "No visible HDK DashboardShell or hdk-shell."));
    if (!audit.visibleSidebars) blockers.push(finding("hdk.sidebarMissing", "No visible HDK DashboardSidebar or hdk-sidebar."));
    if (!audit.visibleMainFrames) blockers.push(finding("hdk.mainMissing", "No visible HDK main/page frame."));
    if (!audit.visibleHeaders) warnings.push(finding("hdk.headerMissing", "No visible HDK DashboardHeader/command header."));
    if (audit.titleStacked) blockers.push(finding("layout.titleStacked", "Primary dashboard title is vertically stacked or squeezed into an invalid shell column."));
    if (audit.desktopSidebarGeometryInvalid && viewport.id === "desktop") blockers.push(finding("layout.sidebarGeometryInvalid", "Desktop sidebar/nav geometry does not look like a rail, sidebar, or approved top command bar."));
    if (audit.mainBelowFold) blockers.push(finding("layout.mainBelowFold", "Primary dashboard content starts too far below the first viewport."));
    if (audit.excessNestedScrollContainers) warnings.push(finding("layout.excessNestedScroll", `${audit.scrollContainerCount} visible scroll containers were detected; dashboard shells should avoid nested scrollbars unless explicitly approved.`));
    if (!audit.visibleCards && audit.localCardLike > 0) blockers.push(finding("hdk.cardsMissing", "Local card/panel surfaces exist without visible HDK cards."));
    if (audit.localCardLike > audit.visibleCards * 2 + 4) blockers.push(finding("local.cardDominance", `Local card/panel classes (${audit.localCardLike}) dominate visible HDK card surfaces (${audit.visibleCards}).`));
    if (audit.tablesOutsideCards) blockers.push(finding("table.cardContract", `${audit.tablesOutsideCards} table(s) render outside a visible card/surface.`));
    if (audit.hiddenMarkers) blockers.push(finding("marker.hiddenCompliance", `${audit.hiddenMarkers} hidden HDK/component marker(s) found.`));
    if (audit.overflowX > 24) blockers.push(finding("layout.horizontalOverflow", `Horizontal overflow is ${audit.overflowX}px.`));
    if (audit.mobileSidebarCoversScreen && viewport.id === "mobile") blockers.push(finding("mobile.sidebarOverlay", "Sidebar covers most of the mobile viewport."));
    if (!interaction.sidebarNavCount && audit.visibleSidebars && interaction.controlCount < 4) warnings.push(finding("interaction.sidebarNavMissing", "Sidebar is visible but exposes no visible links/buttons for route navigation."));
    if (!interaction.tabLikeCount && interaction.nonSidebarControlCount < 3 && audit.visibleStateOrDataComponents) warnings.push(finding("interaction.explorationControlsMissing", "Data surface has no visible tabs, segmented controls, dropdowns, or sufficient page controls for operator exploration."));
    if (interaction.disabledControlRatio > 0.66 && interaction.controlCount >= 6) warnings.push(finding("interaction.disabledControls", `${Math.round(interaction.disabledControlRatio * 100)}% of visible controls are disabled.`));
    if (!audit.hasHdkCssVariables) warnings.push(finding("hdk.tokensMissing", "HDK CSS variables are not visible on the rendered route."));
    if (!audit.visibleStateOrDataComponents) warnings.push(finding("hdk.stateDataMissing", "No visible HDK state/data/chart/table/proof component markers found."));
    const componentCoverage = componentCoverageFor(audit);

    return {
      viewport: viewport.id,
      url: targetUrl,
      httpStatus: response?.status() ?? null,
      screenshot: path.relative(root, screenshotPath),
      audit,
      interaction,
      componentCoverage,
      blockers,
      warnings
    };
  } catch (error) {
    return {
      viewport: viewport.id,
      url: targetUrl,
      httpStatus: null,
      screenshot: null,
      audit: null,
      interaction: null,
      componentCoverage: null,
      error: serializeError(error),
      blockers: [finding("route.captureFailed", error instanceof Error ? error.message : String(error))],
      warnings: []
    };
  } finally {
    await context.close();
  }
}

async function inspectRouteInventory(activeBrowser, dashboard, targetUrl) {
  const origin = safeOrigin(targetUrl);
  if (!origin) return [];
  const paths = [
    new URL(targetUrl).pathname + new URL(targetUrl).search,
    ...(localRoutePaths[dashboard.id] ?? []),
    dashboard.route,
    dashboard.proofUrl ? new URL(dashboard.proofUrl).pathname + new URL(dashboard.proofUrl).search : null
  ].filter(Boolean);
  const uniquePaths = [...new Set(paths)];
  const context = await newContext(activeBrowser, dashboard, { width: 1280, height: 860 });
  const page = await context.newPage();
  const routes = [];
  try {
    for (const routePath of uniquePaths) {
      const url = new URL(routePath, origin).toString();
      const entry = { path: routePath, url, status: null, reachable: false, authWall: false, dashboardLike: false, visibleTextLength: 0, blockers: [], warnings: [] };
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 7000) });
        await maybePassAuth(page, dashboard);
        await page.waitForTimeout(150);
        const audit = await page.evaluate(renderedAudit);
        entry.status = response?.status() ?? null;
        entry.reachable = (response?.status() ?? 0) < 500;
        entry.authWall = Boolean(audit.passwordFields && !audit.visibleShells);
        entry.dashboardLike = Boolean(audit.visibleShells || audit.visibleSidebars || audit.visibleCards || audit.visibleStateOrDataComponents);
        entry.visibleTextLength = audit.visibleTextLength;
        if (!entry.reachable) entry.blockers.push(finding("route.unreachable", "Route did not load under local proof inventory."));
        if (entry.authWall) entry.blockers.push(finding("route.authWall", "Route is protected by auth and no dashboard proof was reached."));
        if (entry.reachable && !entry.dashboardLike) entry.warnings.push(finding("route.notDashboardLike", "Route loaded but does not look like an operator dashboard surface."));
      } catch (error) {
        entry.blockers.push(finding("route.captureFailed", error instanceof Error ? error.message : String(error)));
      }
      routes.push(entry);
    }
  } finally {
    await context.close();
  }
  return routes;
}

async function newContext(activeBrowser, dashboard, viewport) {
  const headers = {};
  const proofAuthEnv = dashboard.proofAuth?.type === "bearer-env" ? dashboard.proofAuth.env : null;
  if (proofAuthEnv && process.env[proofAuthEnv]) headers.Authorization = `Bearer ${process.env[proofAuthEnv]}`;
  return activeBrowser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    extraHTTPHeaders: headers
  });
}

async function maybePassAuth(page, dashboard) {
  const password = credentialFor(dashboard, "PASSWORD");
  if (!password) return false;
  const hasPasswordField = await page.locator("input[type='password']").first().isVisible({ timeout: 200 }).catch(() => false);
  if (!hasPasswordField) return false;
  const username = credentialFor(dashboard, "USERNAME");
  if (username) {
    const usernameInput = page.locator("input[name='username'], input#username, input[type='email'], input[type='text']").first();
    if (await usernameInput.isVisible({ timeout: 200 }).catch(() => false)) {
      await usernameInput.fill(username).catch(() => {});
    }
  }
  await page.locator("input[type='password']").first().fill(password).catch(() => {});
  const button = page.locator("button, input[type='submit']").filter({ hasText: /log in|login|enter|unlock|continue|submit/i }).first();
  if (await button.isVisible({ timeout: 200 }).catch(() => false)) {
    await button.click().catch(() => {});
  } else {
    await page.keyboard.press("Enter").catch(() => {});
  }
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  return true;
}

function authPasswordFor(dashboard) {
  return credentialFor(dashboard, "PASSWORD");
}

function credentialFor(dashboard, name) {
  const idSuffix = dashboard.id.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const projectEnv = projectEnvFor(dashboard);
  return process.env[`DASHBOARD_AUTH_${name}_${idSuffix}`]
    ?? process.env[`DASHBOARD_AUTH_${name}`]
    ?? projectEnv[`AMARI_AUTH_${name}`]
    ?? projectEnv[`DASHBOARD_AUTH_${name}`]
    ?? "";
}

function projectEnvFor(dashboard) {
  if (!dashboard.projectPath) return {};
  if (projectEnvCache.has(dashboard.id)) return projectEnvCache.get(dashboard.id);
  const envPath = path.join(resolveProjectPath(dashboard.projectPath), ".env");
  const values = {};
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }
  }
  projectEnvCache.set(dashboard.id, values);
  return values;
}

function safeOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function renderedAudit() {
  const isVisible = (element) => {
    if (!(element instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 2 && rect.height > 2;
  };
  const visible = (selector) => [...document.querySelectorAll(selector)].filter(isVisible);
  const hidden = (selector) => [...document.querySelectorAll(selector)].filter((element) => !isVisible(element));
  const classContains = (terms) =>
    [...document.querySelectorAll("[class]")].filter((element) => {
      if (!isVisible(element)) return false;
      const tokens = String(element.getAttribute("class") ?? "").toLowerCase().split(/\s+/).filter(Boolean);
      const hasLocalToken = tokens.some((token) => {
        if (token.startsWith("hdk-")) return false;
        if (/^(bg|text|border|from|to|via)-card/.test(token)) return false;
        return terms.some((term) => token === term || token.startsWith(`${term}-`) || token.endsWith(`-${term}`) || token.includes(`-${term}-`));
      });
      const containsRealHdkSurface = Boolean(element.querySelector(".hdk-card, .hdk-table, .hdk-chart-panel, [data-hdk-component]"));
      return hasLocalToken && !containsRealHdkSurface;
    });
  const componentNames = (elements) => {
    const names = new Map();
    for (const element of elements) {
      const explicit = element.getAttribute("data-hdk-component") || element.getAttribute("data-component");
      const classNames = String(element.getAttribute("class") ?? "")
        .split(/\s+/)
        .filter((name) => name.startsWith("hdk-"))
        .slice(0, 4);
      const keys = explicit ? [explicit] : classNames;
      for (const key of keys) names.set(key, (names.get(key) ?? 0) + 1);
    }
    return [...names.entries()].map(([name, count]) => ({ name, count }));
  };
  const hiddenComponentElements = hidden("[data-hdk-component], [data-component]");
  const hiddenComplianceMarkers = hiddenComponentElements.filter((element) => {
    const text = String(element.textContent ?? "").replace(/\s+/g, " ").trim();
    const classes = String(element.getAttribute("class") ?? "");
    const dataComponent = String(element.getAttribute("data-component") ?? "");
    const dataHdkComponent = String(element.getAttribute("data-hdk-component") ?? "");
    const markerSignature = `${classes} ${dataComponent} ${dataHdkComponent}`;
    const inactiveContainer = element.matches(
      "[role='tabpanel'], [data-view], [data-route], [aria-hidden='true'], .tab-panel, .view, .screen, .pane, .panel"
    ) || element.closest(
      "[role='tabpanel'][hidden], [data-view][hidden], [data-route][hidden], .tab-panel[hidden], .view[hidden], .screen[hidden], .pane[hidden]"
    );
    const hasOperationalChildren = Boolean(element.querySelector("button, a[href], input, select, textarea, table, canvas, svg, [role='button'], [role='tab']"));
    const explicitComplianceShim = element.hasAttribute("data-hdk-component-list");
    const hiddenAttributeShim = element.hasAttribute("hidden")
      && /hdk-|DashboardShell|DashboardSidebar|DashboardHeader|DashboardQueryBoundary|DataFreshnessStrip|DataTable|Chart|ProofStrip|MetricCard|StatePanel/i.test(markerSignature)
      && text.length < 120
      && !hasOperationalChildren;
    const emptyMarker = element.hasAttribute("hidden") && text.length < 24 && !hasOperationalChildren;
    return explicitComplianceShim || (!inactiveContainer && (hiddenAttributeShim || emptyMarker));
  });
  const visibleSidebars = visible(".hdk-sidebar, .hdk-sidebar-rail, [data-hdk-component='DashboardSidebar'], [data-component='DashboardSidebar']");
  const visibleShells = visible(".hdk-shell, [data-hdk-component='DashboardShell'], [data-component='DashboardShell']");
  const visibleHeaders = visible(".hdk-command-header, .hdk-header, [data-hdk-component='DashboardHeader'], [data-component='DashboardHeader']");
  const visibleMainFrames = visible(".hdk-main, .hdk-page-frame, .hdk-page, main");
  const primaryTitle = visible("h1, [data-hdk-component='DashboardHeader'] h1, [data-component='DashboardHeader'] h1")[0] ?? null;
  const titleRect = primaryTitle?.getBoundingClientRect?.() ?? null;
  const titleText = primaryTitle?.textContent?.trim?.() ?? "";
  const titleStacked = Boolean(
    titleRect &&
    titleText.length >= 8 &&
    titleRect.width > 0 &&
    titleRect.height / Math.max(titleRect.width, 1) > 2.6
  );
  const desktopSidebarGeometryInvalid = visibleSidebars.some((element) => {
    const rect = element.getBoundingClientRect();
    const looksLikeLeftRail = rect.left <= 12 && rect.width <= Math.min(360, window.innerWidth * 0.34) && rect.height >= window.innerHeight * 0.55;
    const looksLikeTopBar = rect.top <= 140 && rect.height <= 96 && rect.width >= window.innerWidth * 0.55;
    const looksLikeFloatingMenu = rect.width <= 420 && rect.height <= window.innerHeight * 0.72;
    return !(looksLikeLeftRail || looksLikeTopBar || looksLikeFloatingMenu);
  });
  const firstMainRect = visibleMainFrames[0]?.getBoundingClientRect?.() ?? null;
  const mainBelowFold = Boolean(firstMainRect && firstMainRect.top > window.innerHeight * 0.55);
  const scrollContainerCount = [...document.querySelectorAll("body *")].filter((element) => {
    if (!isVisible(element)) return false;
    const style = window.getComputedStyle(element);
    return /(auto|scroll)/.test(`${style.overflow}${style.overflowX}${style.overflowY}`)
      && (element.scrollHeight > element.clientHeight + 24 || element.scrollWidth > element.clientWidth + 24);
  }).length;
  const mobileSidebarCoversScreen = visibleSidebars.some((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > window.innerWidth * 0.82 && rect.height > window.innerHeight * 0.82;
  });
  const tablesOutsideCards = visible("table").filter((table) => !table.closest(".hdk-card, [data-hdk-component='DataTable'], .hdk-table, .hdk-table-wrap")).length;
  const style = window.getComputedStyle(document.documentElement);
  return {
    visibleTextLength: document.body.innerText.trim().length,
    passwordFields: visible("input[type='password']").length,
    visibleShells: visibleShells.length,
    visibleSidebars: visibleSidebars.length,
    visibleHeaders: visibleHeaders.length,
    visibleMainFrames: visibleMainFrames.length,
    visibleCards: visible(".hdk-card, [data-hdk-component='MetricCard'], [data-hdk-component='StatePanel']").length,
    visibleStateOrDataComponents: visible("[data-hdk-component='DashboardQueryBoundary'], [data-hdk-component='DataFreshnessStrip'], [data-hdk-component='DataTable'], [data-hdk-component='LineChart'], [data-hdk-component='BarChart'], [data-hdk-component='DonutChart'], [data-hdk-component='ProofStrip'], .hdk-table, .hdk-chart-panel").length,
    visibleHdkComponents: componentNames(visible("[data-hdk-component], [data-component], [class*='hdk-']")),
    hiddenHdkComponents: componentNames(hiddenComponentElements),
    hiddenComplianceComponents: componentNames(hiddenComplianceMarkers),
    hiddenOperationalComponents: Math.max(0, hiddenComponentElements.length - hiddenComplianceMarkers.length),
    localCardLike: classContains(["card", "panel"]).length,
    localShellLike: classContains(["shell", "sidebar", "topbar", "layout"]).length,
    tablesOutsideCards,
    hiddenMarkers: hiddenComplianceMarkers.length,
    overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    titleStacked,
    desktopSidebarGeometryInvalid,
    mainBelowFold,
    scrollContainerCount,
    excessNestedScrollContainers: scrollContainerCount > 3,
    mobileSidebarCoversScreen,
    hasHdkCssVariables: Boolean(style.getPropertyValue("--hdk-surface-page") || style.getPropertyValue("--hdk-space-card") || style.getPropertyValue("--hdk-sidebar-width"))
  };
}

function componentCoverageFor(audit) {
  const visibleNames = new Set((audit.visibleHdkComponents ?? []).map((item) => item.name));
  const hasName = (...needles) => [...visibleNames].some((name) => needles.some((needle) => name.toLowerCase().includes(needle)));
  const families = {
    shell: Boolean(audit.visibleShells),
    sidebar: Boolean(audit.visibleSidebars),
    header: Boolean(audit.visibleHeaders),
    pageFrame: Boolean(audit.visibleMainFrames),
    cards: Boolean(audit.visibleCards),
    tables: hasName("datatable", "hdk-table") || audit.tablesOutsideCards === 0,
    charts: hasName("chart"),
    proof: hasName("proof"),
    stateData: Boolean(audit.visibleStateOrDataComponents),
    tokens: Boolean(audit.hasHdkCssVariables)
  };
  return {
    families,
    visibleComponents: audit.visibleHdkComponents ?? [],
    hiddenComponents: audit.hiddenHdkComponents ?? [],
    missingFamilies: Object.entries(families).filter(([, present]) => !present).map(([name]) => name)
  };
}

function serializeError(error) {
  return {
    name: error instanceof Error ? error.name : "Error",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? String(error.stack ?? "").split("\n").slice(0, 6).join("\n") : ""
  };
}

function interactionAudit() {
  const isVisible = (element) => {
    if (!(element instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 2 && rect.height > 2;
  };
  const controls = [...document.querySelectorAll("button, a[href], input, select, textarea, [role='button'], [role='tab'], [role='menuitem']")].filter(isVisible);
  const disabled = controls.filter((element) => element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true");
  const sidebar = document.querySelector(".hdk-sidebar, .hdk-sidebar-rail, [data-hdk-component='DashboardSidebar'], [data-component='DashboardSidebar']");
  const sidebarControls = sidebar ? [...sidebar.querySelectorAll("button, a[href], [role='button']")].filter(isVisible) : [];
  const tabLike = controls.filter((element) => {
    const role = element.getAttribute("role") ?? "";
    const text = element.textContent ?? "";
    const cls = element.getAttribute("class") ?? "";
    return /tab|menuitem|combobox/i.test(role) || /tab|segment|dropdown|filter|select/i.test(cls) || /overview|runtime|proof|state|chart|table|week|month|all/i.test(text);
  });
  return {
    controlCount: controls.length,
    sidebarNavCount: sidebarControls.length,
    nonSidebarControlCount: controls.filter((element) => !sidebar?.contains(element)).length,
    tabLikeCount: tabLike.length,
    disabledControlCount: disabled.length,
    disabledControlRatio: controls.length ? disabled.length / controls.length : 0
  };
}

function uniqueFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.code}:${finding.viewport ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function finding(code, message) {
  return { code, message };
}

function renderMarkdown(report) {
  const rows = report.items.map((item) => [
    item.id,
    item.verdict,
    item.score,
    item.targetUrl ?? "unreachable",
    item.blockers.length,
    item.warnings.length,
    item.routeInventory?.length ?? 0,
    item.captures.map((capture) => capture.screenshot).filter(Boolean).join("<br>") || "none"
  ]);
  const details = report.items.map((item) => {
    const blockers = item.blockers.length ? item.blockers.map((issue) => `- BLOCKER ${issue.code}${issue.viewport ? ` (${issue.viewport})` : ""}: ${issue.message}`).join("\n") : "- None";
    const warnings = item.warnings.length ? item.warnings.map((issue) => `- WARNING ${issue.code}${issue.viewport ? ` (${issue.viewport})` : ""}: ${issue.message}`).join("\n") : "- None";
    const captures = item.captures.map((capture) => {
      const audit = capture.audit ?? {};
      const interaction = capture.interaction ?? {};
      const error = capture.error?.message ? `; error=${capture.error.message.replace(/\n/g, " ").slice(0, 220)}` : "";
      return `- ${capture.viewport}: ${capture.screenshot ?? "no screenshot"}; shell=${audit.visibleShells ?? 0}; sidebar=${audit.visibleSidebars ?? 0}; cards=${audit.visibleCards ?? 0}; localCards=${audit.localCardLike ?? 0}; overflowX=${audit.overflowX ?? "n/a"}; controls=${interaction.controlCount ?? 0}; sidebarControls=${interaction.sidebarNavCount ?? 0}${error}`;
    }).join("\n") || "- None";
    const attempts = item.candidateAttempts?.length
      ? markdownTable(["Candidate", "Status", "Text", "Elements", "Error"], item.candidateAttempts.map((attempt) => [
          attempt.url,
          attempt.status ?? "n/a",
          attempt.textLength ?? 0,
          attempt.elementCount ?? 0,
          attempt.error ? attempt.error.replace(/\n/g, " ").slice(0, 180) : "none"
        ]))
      : "No candidate attempts recorded.";
    const coverage = item.captures.map((capture) => {
      const missing = capture.componentCoverage?.missingFamilies?.join(", ") || "none";
      const visible = capture.componentCoverage?.visibleComponents?.map((component) => `${component.name}=${component.count}`).join(", ") || "none";
      return `- ${capture.viewport}: missing=${missing}; visible=${visible}`;
    }).join("\n") || "- None";
    const routes = item.routeInventory?.length
      ? markdownTable(["Path", "Reachable", "Dashboard-like", "Auth wall", "Issues"], item.routeInventory.map((route) => [
          route.path,
          route.reachable ? "yes" : "no",
          route.dashboardLike ? "yes" : "no",
          route.authWall ? "yes" : "no",
          [...(route.blockers ?? []), ...(route.warnings ?? [])].map((issue) => issue.code).join(", ") || "none"
        ]))
      : "No route inventory captured.";
    return `## ${item.label}\n\nVerdict: **${item.verdict}**  \nScore: ${item.score}  \nURL: ${item.targetUrl ?? "unreachable"}\n\n### Blockers\n${blockers}\n\n### Warnings\n${warnings}\n\n### Candidate Attempts\n${attempts}\n\n### Captures\n${captures}\n\n### Component Coverage\n${coverage}\n\n### Route Inventory\n${routes}`;
  }).join("\n\n");
  return `# Rendered Fleet HDK Certification\n\nGenerated: ${report.generatedAt}\n\nThis report opens the actual dashboard routes in a browser. It is meant to catch the exact escape hatch we have been seeing: dependency/marker compliance without visual/component compliance.\n\n## Summary\n\n- Total: ${report.summary.total}\n- Certified: ${report.summary.certified}\n- Needs review: ${report.summary.needsReview}\n- Blocked: ${report.summary.blocked}\n- Unreachable: ${report.summary.unreachable}\n- Average score: ${report.summary.averageScore}%\n\n${markdownTable(["Dashboard", "Verdict", "Score", "URL", "Blockers", "Warnings", "Routes", "Screenshots"], rows)}\n\n${details}\n`;
}

function buildRepairPackets(report) {
  const packets = report.items
    .filter((item) => item.verdict !== "certified")
    .map((item) => ({
      id: `${item.id}.rendered-repair`,
      dashboard: item.id,
      label: item.label,
      verdict: item.verdict,
      score: item.score,
      targetUrl: item.targetUrl,
      candidateAttempts: item.candidateAttempts ?? [],
      screenshots: item.captures.map((capture) => capture.screenshot).filter(Boolean),
      captureErrors: item.captures.filter((capture) => capture.error).map((capture) => ({
        viewport: capture.viewport,
        url: capture.url,
        error: capture.error
      })),
      componentGaps: [...new Set(item.captures.flatMap((capture) => capture.componentCoverage?.missingFamilies ?? []))],
      routeFindings: (item.routeInventory ?? []).flatMap((route) => [...(route.blockers ?? []), ...(route.warnings ?? [])].map((finding) => ({ ...finding, path: route.path }))),
      blockers: item.blockers,
      warnings: item.warnings,
      actions: repairActionsFor(item),
      verification: [
        `npm run dashboard:certify:rendered -- --id ${item.id}`,
        "Desktop and mobile screenshots must match the approved HDK shell/sidebar/card rhythm.",
        "No hidden HDK markers, local card dominance, auth-wall capture, or horizontal overflow can remain."
      ]
    }));
  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    standard: "Rendered Fleet HDK Certification Repair Packets",
    packetCount: packets.length,
    packets
  };
}

function repairActionsFor(item) {
  const codes = new Set([...(item.blockers ?? []), ...(item.warnings ?? []), ...((item.routeInventory ?? []).flatMap((route) => [...(route.blockers ?? []), ...(route.warnings ?? [])]))].map((issue) => issue.code));
  const actions = [];
  if (item.verdict === "unreachable" || codes.has("route.unreachable") || codes.has("route.captureFailed")) {
    actions.push("Register and verify a local proof URL that opens the actual operator dashboard without manual navigation.");
  }
  if (codes.has("route.authWall") || codes.has("auth.loginOnly")) {
    actions.push("Add a read-only proof route or configure DASHBOARD_AUTH_PASSWORD_<ID> so certification reaches the authenticated dashboard surface.");
  }
  if (codes.has("hdk.shellMissing") || codes.has("hdk.sidebarMissing") || codes.has("hdk.mainMissing")) {
    actions.push("Migrate the route shell to visible HDK DashboardShell, DashboardSidebar, DashboardHeader, and page frame components.");
  }
  if (codes.has("marker.hiddenCompliance")) {
    actions.push("Remove hidden data-hdk/data-component compliance markers; only visible imported components count.");
  }
  if (codes.has("local.cardDominance") || codes.has("hdk.cardsMissing")) {
    actions.push("Replace local card/panel wrappers with HDK card/state/table/chart surfaces and keep project CSS domain-specific.");
  }
  if (codes.has("table.cardContract")) {
    actions.push("Wrap every data table in an HDK card/table surface with pagination and density controls where needed.");
  }
  if (codes.has("layout.horizontalOverflow") || codes.has("mobile.sidebarOverlay")) {
    actions.push("Fix responsive shell constraints so mobile and desktop screenshots have no unintended overflow or sidebar coverage.");
  }
  if (codes.has("layout.sidebarGeometryInvalid") || codes.has("layout.titleStacked") || codes.has("layout.mainBelowFold") || codes.has("layout.excessNestedScroll")) {
    actions.push("Repair the canonical dashboard shell geometry: header, sidebar/top command bar, auth controls, and main workspace must occupy approved HDK regions without squeezed titles, content-like nav stacks, below-fold starts, or nested scroll traps.");
  }
  if (codes.has("hdk.tokensMissing")) {
    actions.push("Load HDK CSS tokens on the rendered route instead of local-only theme variables.");
  }
  if (codes.has("hdk.stateDataMissing")) {
    actions.push("Render at least one visible HDK data/state/chart/proof component on the route; static shell-only views are not certifiable.");
  }
  if (codes.has("interaction.sidebarNavMissing") || codes.has("interaction.tabsMissing") || codes.has("interaction.disabledControls")) {
    actions.push("Wire visible navigation, tabs, filters, or command controls so the route is operational, not just presentational.");
  }
  return actions.length ? actions : ["Review rendered screenshots and migrate the dashboard route to the visible HDK operator standard."];
}

function renderRepairMarkdown(repairs) {
  const rows = repairs.packets.map((packet) => [
    packet.dashboard,
    packet.verdict,
    packet.score,
    packet.actions.length,
    packet.screenshots.join("<br>") || "none"
  ]);
  const details = repairs.packets.map((packet) => {
    const actions = packet.actions.map((action) => `- ${action}`).join("\n");
    const verification = packet.verification.map((step) => `- ${step}`).join("\n");
    return `## ${packet.label}\n\nDashboard: ${packet.dashboard}  \nVerdict: ${packet.verdict}  \nScore: ${packet.score}\n\n### Actions\n${actions}\n\n### Verification\n${verification}`;
  }).join("\n\n");
  return `# Rendered Fleet Repair Packets\n\nGenerated: ${repairs.generatedAt}\n\nThese packets are the dashboard-by-dashboard work queue produced by browser-rendered certification. They are intentionally visual and route-specific so repairs do not stop at package dependency or marker compliance.\n\n${markdownTable(["Dashboard", "Verdict", "Score", "Actions", "Screenshots"], rows)}\n\n${details}\n`;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function round(value) {
  return Math.round((Number.isFinite(value) ? value : 0) * 10) / 10;
}
