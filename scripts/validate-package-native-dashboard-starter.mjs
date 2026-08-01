#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

check("starter command exists", () => {
  const script = read("scripts/create-package-native-dashboard.mjs");
  for (const phrase of [
    "@hermes/dashboard-kit",
    "resolveStarterTemplate",
    "operations-queue",
    "market-browser",
    "content-calendar",
    "cost-command",
    "household-planner",
    "approval-workflow",
    "DashboardShell",
    "DashboardSidebar",
    "DashboardHeader",
    "data-theme=",
    "mobbin-reference-intake.md",
    "design-review-checklist.md",
    "playwright.config.ts",
    "capture-proof-screenshots.mjs",
    "hermes.dashboards.json",
    "staticAdapterAllowed",
    "package-native"
  ]) {
    requireIncludes(script, phrase, phrase);
  }

  const pkg = JSON.parse(read("package.json"));
  if (pkg.scripts?.["dashboard:package-native:create"] !== "node scripts/create-package-native-dashboard.mjs") {
    throw new Error("missing dashboard:package-native:create script");
  }
  if (pkg.scripts?.["dashboard:package-native:surface:validate"] !== "node scripts/validate-package-native-surface.mjs") {
    throw new Error("missing dashboard:package-native:surface:validate script");
  }
  if (pkg.scripts?.["dashboard:visual-baseline:capture"] !== "node scripts/capture-dashboard-visual-baseline.mjs") {
    throw new Error("missing dashboard:visual-baseline:capture script");
  }
  for (const [name, command] of Object.entries({
    "dashboard:visual-baseline:compare": "node scripts/compare-dashboard-visual-baseline.mjs",
    "dashboard:rendered:audit": "node scripts/audit-rendered-dashboard.mjs",
    "dashboard:tier3:score": "node scripts/score-tier3-dashboard.mjs",
    "dashboard:creation-gate": "node scripts/enforce-dashboard-creation-gate.mjs",
    "dashboard:mobbin-intake:generate": "node scripts/generate-mobbin-reference-intake.mjs"
  })) {
    if (pkg.scripts?.[name] !== command) throw new Error(`missing ${name} script`);
  }
});

check("starter standard is documented", () => {
  const standard = read("docs/design/package-native-dashboard-starter-standard.md");
  for (const phrase of [
    "New dashboard products must start package-native",
    "Static adapters are allowed only",
    "Mobbin Intake",
    "Design Review",
    "Visual Baseline",
    "Tier 3 Score",
    "Project Creation Gate",
    "CI Template",
    "dashboard:package-native:create",
    "Completion Gate"
  ]) {
    requireIncludes(standard, phrase, phrase);
  }
});

check("adoption registry enforces new dashboard policy", () => {
  const registry = JSON.parse(read("packages/hermes-dashboard-kit/adoption/registry.json"));
  if (registry.newDashboardPolicy?.requiredAdoptionModeForTier3 !== "package-native") {
    throw new Error("newDashboardPolicy.requiredAdoptionModeForTier3 must be package-native");
  }
  if (registry.newDashboardPolicy?.staticAdaptersAllowedForNewTier3 !== false) {
    throw new Error("newDashboardPolicy.staticAdaptersAllowedForNewTier3 must be false");
  }
  if (registry.newDashboardPolicy?.requiresMobbinReferenceIntake !== true) {
    throw new Error("newDashboardPolicy.requiresMobbinReferenceIntake must be true");
  }
  if (registry.newDashboardPolicy?.requiresDesignReviewArtifact !== true) {
    throw new Error("newDashboardPolicy.requiresDesignReviewArtifact must be true");
  }
  if (registry.newDashboardPolicy?.requiresPackageNativeSurfaceValidation !== true) {
    throw new Error("newDashboardPolicy.requiresPackageNativeSurfaceValidation must be true");
  }
});

check("adoption audit has enforcement gates", () => {
  const audit = read("packages/hermes-dashboard-kit/scripts/audit-adoption.mjs");
  for (const phrase of [
    "packageNative.required",
    "referenceEvidence.intakeMissing",
    "designReview.artifactMissing",
    "proof.playwrightConfigMissing",
    "proof.captureScriptMissing",
    "theme.modeMissing",
    "packageNative.importMissing"
  ]) {
    requireIncludes(audit, phrase, phrase);
  }
});

check("adoption schema accepts package-native fields", () => {
  const schema = read("packages/hermes-dashboard-kit/adoption/project-schema.json");
  for (const phrase of [
    "implementationMode",
    "staticAdapterAllowed",
    "mobbinReferenceRequired",
    "referenceIntake",
    "designReview",
    "captureScript",
    "proof"
  ]) {
    requireIncludes(schema, phrase, phrase);
  }
});

check("surface validator and visual baseline commands exist", () => {
  const surfaceValidator = read("scripts/validate-package-native-surface.mjs");
  for (const phrase of [
    "Package-native surface validation",
    "design review checklist",
    "proof screenshot capture script",
    "DashboardShell",
    "hardcoded color"
  ]) {
    requireIncludes(surfaceValidator, phrase, phrase);
  }

  const visualBaseline = read("scripts/capture-dashboard-visual-baseline.mjs");
  for (const phrase of [
    "desktop",
    "mobile",
    "light",
    "dark",
    "horizontalOverflow",
    "manifest.json"
  ]) {
    requireIncludes(visualBaseline, phrase, phrase);
  }

  const visualCompare = read("scripts/compare-dashboard-visual-baseline.mjs");
  for (const phrase of [
    "Visual regression compare",
    "baseline",
    "current",
    "horizontalOverflow",
    "visual.changed"
  ]) {
    requireIncludes(visualCompare, phrase, phrase);
  }

  const renderedAudit = read("scripts/audit-rendered-dashboard.mjs");
  for (const phrase of [
    "Rendered dashboard audit",
    "render.overflowX",
    "render.duplicateShell",
    "render.clippedText",
    "render.darkPanelInLightShell"
  ]) {
    requireIncludes(renderedAudit, phrase, phrase);
  }
});

check("Mobbin intake and Tier 3 score automation exist", () => {
  const intake = read("scripts/generate-mobbin-reference-intake.mjs");
  for (const phrase of [
    "Reference score",
    "Automated Search Briefs",
    "Pattern Extraction",
    "Component Mapping",
    "missingTags"
  ]) {
    requireIncludes(intake, phrase, phrase);
  }

  const score = read("scripts/score-tier3-dashboard.mjs");
  for (const phrase of [
    "Tier 3 dashboard score",
    "rendered audit passing",
    "visual regression passing",
    "Mobbin intake present",
    "design review present"
  ]) {
    requireIncludes(score, phrase, phrase);
  }
});

check("project creation gate and CI template exist", () => {
  const gate = read("scripts/enforce-dashboard-creation-gate.mjs");
  for (const phrase of [
    "Dashboard creation gate",
    "hermes.dashboards.json",
    "@hermes/dashboard-kit",
    "standalone dashboard shell",
    "staticAdapterAllowed=false"
  ]) {
    requireIncludes(gate, phrase, phrase);
  }

  const ci = read("docs/design/dashboard-tier3-ci-template.yml");
  for (const phrase of [
    "Hermes Tier 3 Dashboard Gates",
    "dashboard:package-native:surface:validate",
    "dashboard:creation-gate",
    "dashboard:tier3:score",
    "dashboard-tier3-proof"
  ]) {
    requireIncludes(ci, phrase, phrase);
  }
});

check("component coverage includes workflow and planning primitives", () => {
  const productInterface = read("packages/hermes-dashboard-kit/src/product-interface.tsx");
  for (const phrase of [
    "CalendarMonthGrid",
    "ApprovalQueuePanel",
    "PublishingQueuePanel",
    "ProofEvidencePanel",
    "DirectPostingControlPanel"
  ]) {
    requireIncludes(productInterface, phrase, phrase);
  }
});

check("migration codemod plan targets package-native cutover", () => {
  const codemod = read("scripts/generate-dashboard-migration-codemod-plan.mjs");
  for (const phrase of [
    "packageNativeStages",
    "create-package-native-dashboard-shell",
    "map-static-selectors-to-dashboard-kit-components",
    "cutover-canonical-route-and-retire-static-adapter",
    "targetMode: \"package-native\""
  ]) {
    requireIncludes(codemod, phrase, phrase);
  }
});

finish("Package-native dashboard starter validation");

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
