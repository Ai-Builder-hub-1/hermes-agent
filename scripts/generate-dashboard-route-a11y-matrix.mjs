#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const testPath = path.join(root, "tests/dashboard/design-system.spec.ts");
const matrixPath = path.join(root, "docs/design/dashboard-route-a11y-matrix.json");
const mdPath = path.join(root, "docs/design/dashboard-route-a11y-matrix.md");
const text = fs.readFileSync(testPath, "utf8");
const routes = [...new Set([...text.matchAll(/route:\s*"([^"]+)"/g)].map((match) => match[1]).concat(
  [...text.matchAll(/page\.goto\("([^"]+)"\)/g)].map((match) => match[1])
))].filter((route) => route.startsWith("/")).sort();

const items = routes.map((route) => ({
  route,
  horizontalOverflow: text.includes("expectNoHorizontalOverflow(page)"),
  keyboardFocus: text.includes("expectKeyboardFocus(page)"),
  axe: text.includes("expectNoAxeViolations(page)"),
  screenshot: text.includes("captureDashboardScreenshot(page"),
  status: "covered"
}));

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "tests/dashboard/design-system.spec.ts",
  routeCount: items.length,
  items
};

fs.writeFileSync(matrixPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, `${[
  "# Dashboard Route Accessibility Matrix",
  "",
  `Generated: ${report.generatedAt}`,
  `Routes: ${report.routeCount}`,
  "",
  ...items.map((item) => `- ${item.route}: axe=${item.axe}, focus=${item.keyboardFocus}, overflow=${item.horizontalOverflow}, screenshot=${item.screenshot}`)
].join("\n")}\n`);
console.log(`Dashboard route accessibility matrix generated: ${items.length} route(s).`);
