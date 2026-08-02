#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

check("theme source contract", () => {
  const themes = read("packages/hermes-dashboard-kit/src/themes.ts");
  for (const phrase of [
    "DashboardThemeMode",
    "DashboardThemeModeTokenSet",
    "DashboardThemeModeProfile",
    "dashboardThemeModes",
    "dashboardThemeModeCssVariables",
    "surfacePage",
    "surfacePanel",
    "surfacePanelStrong",
    "textPrimary",
    "textInverse",
    "chartAxis",
    "chartGrid",
    "chartTooltipBg",
    "chartTooltipText",
    "statusSuccessSoft",
    "statusWarningSoft",
    "statusErrorSoft",
    "statusInfoSoft"
  ]) {
    requireIncludes(themes, phrase, phrase);
  }
});

check("static adapter theme selectors", () => {
  const css = read("packages/hermes-dashboard-kit/static/hermes-dashboard-kit.css");
  for (const phrase of [
    '[data-theme="light"]',
    '[data-theme="dark"]',
    '[data-theme="system"]',
    ".hdk-theme-light",
    ".hdk-theme-dark",
    ".hdk-theme-system",
    "--hdk-chart-axis",
    "--hdk-chart-grid",
    "--hdk-chart-tooltip-bg",
    "--hdk-chart-tooltip-text",
    "--hdk-text-secondary",
    "--hdk-inverse",
    "--hdk-focus"
  ]) {
    requireIncludes(css, phrase, phrase);
  }

  const forbiddenComponentColors =
    css
      .split("\n")
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => /#[0-9a-fA-F]{3,8}/.test(line))
      .filter(({ line }) => !line.includes("--hdk-"));

  if (forbiddenComponentColors.length) {
    throw new Error(`hardcoded component colors outside token declarations: ${forbiddenComponentColors.map(({ number }) => number).join(", ")}`);
  }
});

check("theme mode docs and registries", () => {
  const standard = read("docs/design/dashboard-theme-mode-standard.md");
  for (const phrase of [
    "data-theme=\"light\"",
    "data-theme=\"dark\"",
    "data-theme=\"system\"",
    "Contrast Contract",
    "Visual QA Requirement",
    "Mobbin"
  ]) {
    requireIncludes(standard, phrase, phrase);
  }

  const design = read("packages/hermes-dashboard-kit/DESIGN.md");
  requireIncludes(design, "dashboard-theme-mode-standard.md", "DESIGN theme standard pointer");
  requireIncludes(design, "--hdk-chart-tooltip-bg", "DESIGN chart tooltip token");

  const reference = read("docs/design/operating-interface-reference-library.json");
  requireIncludes(reference, "theme-mode-systems", "reference library theme-mode family");
  requireIncludes(reference, "mobbinReferences", "Mobbin references");

  const registry = read("docs/design/operating-interface-system-registry.json");
  requireIncludes(registry, "theme-mode-contract", "system registry theme contract");
});

check("light and dark token contrast", () => {
  const themes = read("packages/hermes-dashboard-kit/src/themes.ts");
  const light = extractTokenObject(themes, "lightTokens");
  const dark = extractTokenObject(themes, "darkTokens");
  const pairs = [
    ["surfacePage", "textPrimary"],
    ["surfacePanel", "textPrimary"],
    ["surfacePanelStrong", "textInverse"],
    ["surfaceInset", "textSecondary"],
    ["chartTooltipBg", "chartTooltipText"],
    ["statusSuccessSoft", "statusSuccess"],
    ["statusWarningSoft", "statusWarning"],
    ["statusErrorSoft", "statusError"],
    ["statusInfoSoft", "statusInfo"]
  ];

  for (const [mode, tokens] of [["light", light], ["dark", dark]]) {
    for (const [background, foreground] of pairs) {
      const ratio = contrastRatio(tokens[background], tokens[foreground]);
      if (ratio < 3) {
        throw new Error(`${mode} ${background}/${foreground} contrast ${ratio.toFixed(2)} is below 3:1`);
      }
    }
  }
});

finish("Dashboard theme contract validation");

function check(label, fn) {
  try {
    fn();
    console.log(`ok ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function finish(label) {
  if (failures.length) {
    console.error(`${label} failed (${failures.length})`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`${label} passed`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireIncludes(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`missing ${label}`);
}

function extractTokenObject(source, name) {
  const match = source.match(new RegExp(`const ${name}: DashboardThemeModeTokenSet = \\{([\\s\\S]*?)\\n\\};`));
  if (!match) throw new Error(`missing ${name}`);
  const tokens = {};
  for (const line of match[1].split("\n")) {
    const token = line.match(/^\s*([a-zA-Z0-9]+):\s*"([^"]+)"/);
    if (token) tokens[token[1]] = token[2];
  }
  return tokens;
}

function contrastRatio(background, foreground) {
  const bg = relativeLuminance(hexToRgb(background));
  const fg = relativeLuminance(hexToRgb(foreground));
  const light = Math.max(bg, fg);
  const dark = Math.min(bg, fg);
  return (light + 0.05) / (dark + 0.05);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`unsupported color ${hex}`);
  }
  return [
    Number.parseInt(clean.slice(0, 2), 16) / 255,
    Number.parseInt(clean.slice(2, 4), 16) / 255,
    Number.parseInt(clean.slice(4, 6), 16) / 255
  ];
}

function relativeLuminance([red, green, blue]) {
  const [r, g, b] = [red, green, blue].map((channel) => {
    if (channel <= 0.03928) return channel / 12.92;
    return ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
