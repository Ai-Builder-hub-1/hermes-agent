#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const args = parseArgs(process.argv.slice(2));
const url = args.url || process.env.DASHBOARD_PROOF_URL;
if (!url) {
  console.error("Usage: npm run dashboard:visual-baseline:capture -- --url http://127.0.0.1:4177 --out proof/dashboard-baseline");
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), args.out || "proof/dashboard-baseline");
const viewports = [
  { id: "desktop-expanded", width: 1440, height: 1000, sidebar: "expanded" },
  { id: "desktop-collapsed", width: 1440, height: 1000, sidebar: "collapsed" },
  { id: "mobile", width: 390, height: 844, sidebar: "mobile" }
];
const themes = ["light", "dark", "system"];
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const manifest = {
  schemaVersion: 1,
  capturedAt: new Date().toISOString(),
  url,
  screenshots: []
};

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  for (const theme of themes) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
    await page.evaluate((sidebarState) => {
      const shell =
        document.querySelector(".hdk-shell, .shell, [data-hdk-shell], [data-component='DashboardShell']");
      if (sidebarState === "collapsed") {
        shell?.classList.add("sidebar-collapsed");
        shell?.setAttribute("data-sidebar-state", "collapsed");
      } else if (sidebarState === "expanded") {
        shell?.classList.remove("sidebar-collapsed");
        shell?.setAttribute("data-sidebar-state", "expanded");
      } else {
        shell?.setAttribute("data-sidebar-state", "mobile");
      }
    }, viewport.sidebar);
    const horizontalOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    const filename = `${viewport.id}-${theme}.png`;
    await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
    manifest.screenshots.push({
      viewport: viewport.id,
      theme,
      width: viewport.width,
      height: viewport.height,
      sidebar: viewport.sidebar,
      file: filename,
      horizontalOverflow
    });
  }
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Captured ${manifest.screenshots.length} dashboard baseline screenshots in ${outDir}`);

function parseArgs(raw) {
  const parsed = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = raw[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
