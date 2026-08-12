#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const json = args.includes("--json");
const writeReport = args.includes("--write-report");
const projectArg = valueAfter("--project");

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readProjectPackage(projectRoot) {
  const packagePath =
    path.join(projectRoot, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      path:
        packagePath,
      exists:
        false,
      manifest:
        null
    };
  }
  return {
    path:
      packagePath,
    exists:
      true,
    manifest:
      readJson(packagePath)
  };
}

function dependencyVersion(packageManifest, name) {
  return (
    packageManifest?.dependencies?.[name] ??
    packageManifest?.devDependencies?.[name] ??
    packageManifest?.peerDependencies?.[name] ??
    null
  );
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function rel(file) {
  return path.relative(root, file) || ".";
}

function linkedCssContent(content, surfacePath, projectRoot) {
  const surfaceDir = path.dirname(surfacePath);
  return [...content.matchAll(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi)]
    .map((match) => match[1])
    .map((href) => {
      const normalized = href.startsWith("/")
        ? path.resolve(projectRoot, "public", href.replace(/^\//, ""))
        : path.resolve(surfaceDir, href);
      return fs.existsSync(normalized) ? fs.readFileSync(normalized, "utf8") : "";
    })
    .filter(Boolean)
    .join("\n");
}

function compareVersions(actual, required) {
  const clean = (value) => String(value ?? "").replace(/^[^\d]*/, "").split(".").map((part) => Number(part) || 0);
  const a = clean(actual);
  const b = clean(required);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return 1;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return -1;
  }
  return 0;
}

function issue(severity, code, message, details = {}) {
  return { severity, code, message, ...details };
}

function experienceTierLabel(registry, tier) {
  const match =
    (registry.experienceTiers ?? []).find((item) => Number(item.tier) === Number(tier));
  return match ? `${match.label} (Tier ${match.tier})` : `Tier ${tier}`;
}

function tierBandLabel(registry, band) {
  const match = (registry.experienceTierBands ?? []).find((item) => item.band === band);
  return match ? `${match.label} (${match.band})` : band;
}

function computeCurrentBand({ currentExperienceTier, implementationMode, manifest, issues }) {
  const tier = currentExperienceTier === null ? null : Number(currentExperienceTier);
  const surfaces = manifest?.surfaces ?? [];
  const issueCodes = new Set((issues ?? []).map((item) => item.code));
  const hasTier3ReviewWarnings = [...issueCodes].some((code) => code.startsWith("tier3."));

  if (implementationMode === "planned") return "T0P";
  if (tier === null) return "T0L";
  if (tier <= 0) return surfaces.length ? "T0L" : "T0P";

  if (tier === 1) {
    return surfaces.length ? "T1B" : "T1A";
  }

  if (tier === 2) {
    return implementationMode === "package-native" ? "T2B" : "T2A";
  }

  if (tier >= 3) {
    if (hasTier3ReviewWarnings || issueCodes.has("packageNative.required")) return "T3A";
    return implementationMode === "package-native" ? "T3C" : "T3B";
  }

  return "T0L";
}

function nextActionForBand({ project, currentBand, targetBand, issues }) {
  const issueCodes = new Set((issues ?? []).map((item) => item.code));
  if (issueCodes.has("packageNative.required")) {
    return "Migrate the production dashboard surface to import and render @hermes/dashboard-kit components before treating this project as dashboard-complete.";
  }
  if ([...issueCodes].some((code) => code.startsWith("tier3."))) {
    return "Repair Tier 3 shell, command-header, chart, overflow, table, and proof evidence in the audited surface.";
  }
  if (currentBand === "T1A") {
    return "Add surface inventory, pick a primary recipe, declare state/data contracts, and make the primary dashboard path enforceable.";
  }
  if (currentBand === "T1B") {
    return "Replace report sections with shared dashboard-kit components and required operational states.";
  }
  if (currentBand === "T2A") {
    return "Move from static/hybrid shared-component delivery to package-native shared components when the project owns a frontend surface.";
  }
  if (currentBand === "T3B" && targetBand === "T3C") {
    return "Preserve the current cockpit while planning the package-native migration in the owning project.";
  }
  if (currentBand === "T0P") {
    return "Decide whether this project owns an operator dashboard; if yes, add surface inventory and package-native cockpit scaffolding.";
  }
  return project.tierMigrationNote || "Keep current band evidence fresh and rerun adoption audit after project changes.";
}

function externalWorkItemsFor({ result, project }) {
  const items = [];
  const issueCodes = new Set((result.issues ?? []).map((item) => item.code));
  const currentBand = result.experienceTier?.currentBand;
  const targetBand = result.experienceTier?.targetBand;

  if (currentBand === "T0P") {
    items.push({
      ownerProject: project.id,
      scope: "external-project",
      priority: targetBand === "T3C" ? "P1" : "P2",
      action: "Create or confirm the production dashboard surface inventory in the owning project.",
      reason: "Central registry can track planned readiness, but implementation surfaces must live in the owning project."
    });
  }

  if (currentBand === "T1A") {
    items.push({
      ownerProject: project.id,
      scope: "external-project",
      priority: Number(result.experienceTier?.target ?? 0) >= 3 ? "P1" : "P2",
      action: "Add `.hermes-dashboard.json` surfaces with required components, markers, owner/reviewer, proof route, and migration note.",
      reason: "Adapter sync proves CSS availability but not dashboard quality."
    });
  }

  if ([...issueCodes].some((code) => code.startsWith("tier3."))) {
    items.push({
      ownerProject: project.id,
      scope: "external-project",
      priority: "P0",
      action: "Repair audited Tier 3 surface markers for shell rail, command header, chart panels, semantic chart contracts, and overflow protection.",
      reason: "A Tier 3 cockpit with review warnings must remain a candidate rather than current."
    });
  }

  if (issueCodes.has("packageNative.bridge") || issueCodes.has("packageNative.required")) {
    items.push({
      ownerProject: project.id,
      scope: "external-project",
      priority: targetBand === "T3C" ? "P1" : "P2",
      action: "Implement package-native @hermes/dashboard-kit adoption in the owning project.",
      reason: "Static/hybrid adapters are migration bridges only; dashboard completion requires production surfaces to import and render @hermes/dashboard-kit components."
    });
  }

  return items;
}

function evaluateProject(registry, project, sourceHash) {
  const projectRoot = path.resolve(root, project.path);
  const manifestPath = path.resolve(root, project.manifest);
  const issues = [];
  let manifest = null;

  if (!fs.existsSync(projectRoot)) {
    issues.push(issue("error", "project.missing", "Project path is missing.", { path: project.path }));
    return { project: project.id, name: project.name, status: "missing", issues };
  }

  if (!fs.existsSync(manifestPath)) {
    issues.push(issue("error", "manifest.missing", "Project is not declaring dashboard-kit adoption.", { manifest: project.manifest }));
    return { project: project.id, name: project.name, status: "unregistered", issues };
  }

  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    issues.push(issue("error", "manifest.invalid-json", `Manifest cannot be parsed: ${error.message}`, { manifest: project.manifest }));
    return { project: project.id, name: project.name, status: "invalid", issues };
  }

  if (manifest.schemaVersion !== 1) issues.push(issue("error", "manifest.schemaVersion", "schemaVersion must be 1."));
  if (manifest.projectId !== project.id) issues.push(issue("error", "manifest.projectId", `Expected projectId ${project.id}.`));
  if (manifest.dashboardKit?.package !== registry.source.package) issues.push(issue("error", "manifest.package", `dashboardKit.package must be ${registry.source.package}.`));
  if (compareVersions(manifest.dashboardKit?.requiredVersion, registry.source.minimumRequiredVersion) < 0) {
    issues.push(issue("error", "manifest.requiredVersion", `Required version ${manifest.dashboardKit?.requiredVersion ?? "(missing)"} is below ${registry.source.minimumRequiredVersion}.`));
  }
  if (project.expectedMode !== "planned" && manifest.dashboardKit?.adoptionMode !== project.expectedMode && manifest.dashboardKit?.adoptionMode !== "hybrid") {
    issues.push(issue("warning", "manifest.adoptionMode", `Expected ${project.expectedMode} or hybrid adoption mode.`));
  }

  const currentExperienceTier =
    project.currentExperienceTier ?? manifest.dashboardKit?.currentExperienceTier ?? null;
  const targetExperienceTier =
    project.targetExperienceTier ?? manifest.dashboardKit?.targetExperienceTier ?? null;
  const implementationMode =
    project.implementationMode ?? manifest.dashboardKit?.implementationMode ?? manifest.dashboardKit?.adoptionMode ?? project.expectedMode ?? null;
  const targetExperienceBand =
    project.targetExperienceBand ?? manifest.dashboardKit?.targetExperienceBand ?? null;
  const tierMigrationRequired =
    project.tierMigrationRequired ?? (
      currentExperienceTier !== null &&
      targetExperienceTier !== null &&
      Number(currentExperienceTier) < Number(targetExperienceTier)
    );

  if (currentExperienceTier === null || targetExperienceTier === null) {
    issues.push(issue(
      "warning",
      "experienceTier.missing",
      "Dashboard adoption should declare currentExperienceTier and targetExperienceTier so shell compliance is not confused with product-grade completion."
    ));
  } else if (Number(currentExperienceTier) < Number(targetExperienceTier)) {
    issues.push(issue(
      "warning",
      "experienceTier.migrationRequired",
      `Experience tier is ${experienceTierLabel(registry, currentExperienceTier)} but target is ${experienceTierLabel(registry, targetExperienceTier)}.`,
      {
        currentExperienceTier:
          Number(currentExperienceTier),
        targetExperienceTier:
          Number(targetExperienceTier),
        tierMigrationRequired,
        tierMigrationNote:
          project.tierMigrationNote || manifest.dashboardKit?.tierMigrationNote || ""
      }
    ));
  }

  if (!implementationMode) {
    issues.push(issue(
      "warning",
      "implementationMode.missing",
      "Dashboard adoption should declare implementationMode so static/server-rendered bridges are not confused with package-native completion."
    ));
  }

  const projectPackage =
    readProjectPackage(projectRoot);
  const packageDependencyVersion =
    dependencyVersion(projectPackage.manifest, registry.source.package);

  if (targetExperienceBand === "T3C" && project.packageNativeRequired === true && implementationMode !== "package-native") {
    issues.push(issue(
      "warning",
      "packageNative.bridge",
      `Target band is T3C, but current implementation mode is ${implementationMode}. Treat this as a bridge, not the final standard.`,
      {
        implementationMode,
        targetExperienceBand,
        bridgeStatus:
          project.bridgeStatus || manifest.dashboardKit?.bridgeStatus || ""
      }
    ));
  }

  if (implementationMode === "server-rendered-legacy" && Number(targetExperienceTier) >= 3) {
    issues.push(issue(
      "warning",
      "implementationMode.serverRenderedLegacy",
      "Server-rendered dashboard HTML/CSS cannot be the default path for Tier 3 completion; migrate to package-native/shared dashboard-kit components.",
      {
        implementationMode,
        targetExperienceBand:
          targetExperienceBand || ""
      }
    ));
  }

  const staticAdapterAllowed =
    project.staticAdapterAllowed ?? manifest.dashboardKit?.staticAdapterAllowed ?? true;
  const hasDashboardSurface =
    (manifest.surfaces ?? []).some((surface) => surface.status !== "planned") ||
    (project.requiredSurfaces ?? []).length > 0 ||
    Number(targetExperienceTier) > 0;
  const policyRequiresPackageNative =
    hasDashboardSurface &&
    (
      registry.newDashboardPolicy?.requiredAdoptionModeForAllDashboardProjects === "package-native" ||
      staticAdapterAllowed === false ||
      (
        Number(targetExperienceTier) >= 3 &&
        registry.newDashboardPolicy?.staticAdaptersAllowedForNewTier3 === false &&
        (project.newDashboard === true || manifest.dashboardKit?.newDashboard === true)
      )
    );

  if (policyRequiresPackageNative && implementationMode !== "package-native") {
    issues.push(issue(
      "error",
      "packageNative.required",
      "Registered dashboard production surfaces must import and render @hermes/dashboard-kit directly; static adapters are migration bridges only.",
      {
        implementationMode,
        staticAdapterAllowed,
        requiredAdoptionMode:
          registry.newDashboardPolicy?.requiredAdoptionModeForAllDashboardProjects ||
          registry.newDashboardPolicy?.requiredAdoptionModeForTier3 ||
          "package-native"
      }
    ));
  }

  if (policyRequiresPackageNative && !packageDependencyVersion) {
    issues.push(issue(
      "error",
      "packageNative.dependencyMissing",
      `Project package.json must declare ${registry.source.package} before a dashboard can become package-native.`,
      {
        packageJson:
          projectPackage.exists ? rel(projectPackage.path) : null
      }
    ));
  }

  if (Number(targetExperienceTier) >= 3 && project.mobbinReferenceRequired !== true) {
    issues.push(issue(
      "warning",
      "referenceEvidence.mobbinMissing",
      "Tier 3 dashboard migrations should require Mobbin/reference extraction before implementation."
    ));
  }

  const mobbinReferenceRequired =
    project.mobbinReferenceRequired === true ||
    manifest.dashboardKit?.mobbinReferenceRequired === true ||
    (Number(targetExperienceTier) >= 3 && registry.newDashboardPolicy?.requiresMobbinReferenceIntake === true);
  const referenceIntakePath =
    manifest.referenceIntake?.path
      ? path.resolve(projectRoot, manifest.referenceIntake.path)
      : null;

  if (mobbinReferenceRequired && implementationMode === "package-native") {
    if (!referenceIntakePath) {
      issues.push(issue(
        "error",
        "referenceEvidence.intakeMissing",
        "Package-native Tier 3 dashboards must declare a Mobbin/reference intake path."
      ));
    } else if (!fs.existsSync(referenceIntakePath)) {
      issues.push(issue(
        "error",
        "referenceEvidence.intakeFileMissing",
        "Declared Mobbin/reference intake file is missing.",
        { path: rel(referenceIntakePath) }
      ));
    } else {
      const intake = fs.readFileSync(referenceIntakePath, "utf8");
      if (!/mobbin\.com\/screens\//i.test(intake) && !/Add Mobbin links here before implementation/i.test(intake)) {
        issues.push(issue(
          "warning",
          "referenceEvidence.mobbinLinksMissing",
          "Mobbin/reference intake should list the reviewed Mobbin screen links or remain explicitly marked as draft."
        ));
      }
    }
  }

  const designReviewPath =
    manifest.designReview?.path
      ? path.resolve(projectRoot, manifest.designReview.path)
      : null;

  if (Number(targetExperienceTier) >= 3 && implementationMode === "package-native") {
    if (!designReviewPath) {
      issues.push(issue(
        "error",
        "designReview.artifactMissing",
        "Package-native Tier 3 dashboards must declare a design-review checklist artifact."
      ));
    } else if (!fs.existsSync(designReviewPath)) {
      issues.push(issue(
        "error",
        "designReview.fileMissing",
        "Declared design-review checklist file is missing.",
        { path: rel(designReviewPath) }
      ));
    }
  }

  if (
    Number(targetExperienceTier) >= 3 &&
    implementationMode === "package-native" &&
    registry.newDashboardPolicy?.requiresProofScreenshots === true &&
    !manifest.proof?.playwrightConfig
  ) {
    issues.push(issue(
      "error",
      "proof.playwrightConfigMissing",
      "Package-native Tier 3 dashboards must declare Playwright proof capture configuration."
    ));
  }

  if (
    Number(targetExperienceTier) >= 3 &&
    implementationMode === "package-native" &&
    registry.newDashboardPolicy?.requiresProofScreenshots === true &&
    !manifest.proof?.captureScript
  ) {
    issues.push(issue(
      "error",
      "proof.captureScriptMissing",
      "Package-native Tier 3 dashboards must declare a proof screenshot capture script."
    ));
  }

  const adapterTarget = manifest.dashboardKit?.staticAdapterPath
    ? path.resolve(projectRoot, manifest.dashboardKit.staticAdapterPath)
    : project.adapterTarget
      ? path.resolve(root, project.adapterTarget)
      : null;
  if (adapterTarget && manifest.dashboardKit?.adoptionMode !== "package-native" && manifest.dashboardKit?.adoptionMode !== "planned") {
    if (!fs.existsSync(adapterTarget)) {
      issues.push(issue("error", "adapter.missing", "Static adapter is missing.", { path: rel(adapterTarget) }));
    } else {
      const adapterHash = hash(adapterTarget);
      if (adapterHash !== sourceHash) {
        issues.push(issue("error", "adapter.drifted", "Static adapter has drifted from the canonical dashboard-kit CSS.", {
          path: rel(adapterTarget),
          expectedHash: sourceHash.slice(0, 12),
          actualHash: adapterHash.slice(0, 12)
        }));
      }
      if (manifest.dashboardKit?.canonicalCssHash && manifest.dashboardKit.canonicalCssHash !== sourceHash) {
        issues.push(issue("warning", "adapter.recordedHashStale", "Manifest recorded canonicalCssHash does not match current kit CSS hash.", {
          recordedHash: manifest.dashboardKit.canonicalCssHash.slice(0, 12),
          currentHash: sourceHash.slice(0, 12)
        }));
      }
    }
  }

  const surfaces = new Map((manifest.surfaces ?? []).map((surface) => [surface.id, surface]));
  for (const requiredSurface of project.requiredSurfaces ?? []) {
    if (!surfaces.has(requiredSurface)) {
      issues.push(issue("error", "surface.missing", `Required surface ${requiredSurface} is not listed in manifest.`));
    }
  }

  for (const surface of manifest.surfaces ?? []) {
    const surfacePath = path.resolve(projectRoot, surface.path);
    const surfaceRole = surface.role ?? "ui";
    const isUiSurface =
      !["api", "data-contract", "proof-endpoint", "kit-source", "page-content", "server-route"].includes(surfaceRole);
    if (!fs.existsSync(surfacePath)) {
      issues.push(issue("error", "surface.fileMissing", `Surface file is missing: ${surface.path}`, { surface: surface.id }));
      continue;
    }
    const surfaceContent = fs.readFileSync(surfacePath, "utf8");
    const content = `${surfaceContent}\n${linkedCssContent(surfaceContent, surfacePath, projectRoot)}`;
    for (const marker of surface.markers ?? []) {
      if (!content.includes(marker)) {
        issues.push(issue("error", "surface.markerMissing", `Surface ${surface.id} is missing required marker: ${marker}`, { path: surface.path }));
      }
    }
    for (const component of surface.requiredComponents ?? []) {
      const componentMarkers = [
        component,
        `hdk-${component.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "")}`,
      ];
      if (!componentMarkers.some((marker) => content.includes(marker))) {
        const severity = surface.status === "prototype" || surface.status === "planned" ? "warning" : "error";
        issues.push(issue(severity, "surface.componentMissing", `Surface ${surface.id} does not show adoption evidence for ${component}.`, { path: surface.path }));
      }
    }
    if (isUiSurface && Number(targetExperienceTier) >= 3 && implementationMode === "package-native") {
      if (!content.includes("data-theme=") && !content.includes("hdk-theme-scope")) {
        issues.push(issue(
          "error",
          "theme.modeMissing",
          `Surface ${surface.id} must expose a shell-level theme mode through data-theme or hdk-theme-scope.`,
          { path: surface.path }
        ));
      }
      if (!content.includes("@hermes/dashboard-kit")) {
        issues.push(issue(
          "error",
          "packageNative.importMissing",
          `Surface ${surface.id} must import @hermes/dashboard-kit directly.`,
          { path: surface.path }
        ));
      }
    }
    if (isUiSurface) {
      const allowed = new Set(surface.allowedLegacyPatterns ?? []);
      for (const pattern of registry.legacyPatterns ?? []) {
        if (allowed.has(pattern.id)) continue;
        if (content.toLowerCase().includes(pattern.pattern.toLowerCase())) {
          if (pattern.requiresDevOnlyGuard && hasDevOnlyGuard(content)) continue;
          issues.push(issue(pattern.severity, `legacy.${pattern.id}`, pattern.message, { surface: surface.id, path: surface.path }));
        }
      }
    }
    if (isUiSurface && Number(targetExperienceTier) >= 3 && surface.status !== "prototype" && surface.status !== "planned") {
      const shellQualityIssues =
        evaluateTier3ShellQuality(content, surface, surfaceContent);
      issues.push(...shellQualityIssues);
    }
  }

  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  const status = errorCount ? "stale" : warningCount ? "needs-review" : "current";
  const currentBand = computeCurrentBand({
    currentExperienceTier,
    implementationMode,
    manifest,
    issues
  });
  const result = {
    project:
      project.id,
    name:
      project.name,
    status,
    experienceTier: {
      current:
        currentExperienceTier === null ? null : Number(currentExperienceTier),
      target:
        targetExperienceTier === null ? null : Number(targetExperienceTier),
      currentBand,
      currentBandLabel:
        tierBandLabel(registry, currentBand),
      targetBand:
        targetExperienceBand,
      targetBandLabel:
        targetExperienceBand ? tierBandLabel(registry, targetExperienceBand) : null,
      implementationMode,
      migrationRequired:
        Boolean(tierMigrationRequired),
      nextAction:
        nextActionForBand({ project, currentBand, targetBand: targetExperienceBand, issues }),
      note:
        project.tierMigrationNote || manifest?.dashboardKit?.tierMigrationNote || ""
    },
    packageNative: {
      dependencyDeclared:
        Boolean(packageDependencyVersion),
      dependencyVersion:
        packageDependencyVersion,
      packageJson:
        projectPackage.exists ? rel(projectPackage.path) : null
    },
    issues
  };
  return {
    ...result,
    externalWorkItems:
      externalWorkItemsFor({ result, project })
  };
}

function hasDevOnlyGuard(content) {
  const lower = content.toLowerCase();
  return (
    lower.includes("localhost") &&
    lower.includes("127.0.0.1") &&
    lower.includes("window.location.hostname")
  );
}

function evaluateTier3ShellQuality(content, surface, sourceContent = content) {
  const lower =
    content.toLowerCase();
  const sourceLower =
    sourceContent.toLowerCase();
  const issues = [];
  const sidebarEvidence = [
    "dashboardsidebar",
    "data-component=\"dashboardsidebar\"",
    "hdk-sidebar-rail",
    "hdk-sidebar"
  ];
  const headerEvidence = [
    "dashboardheader",
    "data-component=\"dashboardheader\"",
    "hdk-command-header",
    "hdk-header"
  ];
  const overflowEvidence = [
    "text-overflow",
    "truncate",
    "overflow-wrap",
    "white-space: nowrap",
    "minmax(13.5rem",
    "max-width"
  ];
  const tableEvidence = [
    "hdk-table-tabs",
    "hdk-table-layout",
    "data-component=\"datatabletabs\"",
    "data-component=\"datatable\""
  ];
  const chartEvidence = [
    "data-component=\"chartpanel\"",
    "hdk-chart-panel",
    "data-chart-type="
  ];
  const axisChartEvidence =
    sourceLower.includes("data-chart-type=\"line\"") ||
    sourceLower.includes("data-chart-type=\"area\"") ||
    sourceLower.includes("data-chart-type=\"bar\"") ||
    sourceLower.includes("data-chart-type=\"column\"");
  const axisContractEvidence =
    lower.includes("data-x-axis=") &&
    lower.includes("data-x-axis-label=") &&
    lower.includes("data-y-axis=") &&
    lower.includes("data-y-axis-label=");
  const partToWholeEvidence =
    sourceLower.includes("data-chart-type=\"donut\"") ||
    sourceLower.includes("data-chart-type=\"ring\"") ||
    sourceLower.includes("data-chart-type=\"pie\"");
  const partToWholeContractEvidence =
    lower.includes("data-dimension=") &&
    lower.includes("data-measure=");
  const loadingPerformanceEvidence = [
    "dashboardloadingshell",
    "skeletonmetriccard",
    "skeletonchart",
    "skeletontable",
    "skeletondashboardgrid",
    "dashboardqueryboundary",
    "datafreshnessstrip",
    "staledatabadge",
    "partialdatabanner",
    "data-hdk-component=\"dashboardloadingshell\"",
    "data-hdk-component=\"dashboardqueryboundary\"",
    "data-hdk-component=\"datafreshnessstrip\"",
    "data-hdk-component=\"staledatabadge\"",
    "data-hdk-component=\"partialdatabanner\"",
    "hdk-loading-shell",
    "hdk-skeleton",
    "hdk-data-freshness-strip",
    "hdk-stale-badge",
    "hdk-partial-banner",
    "data-data-state="
  ];
  const freshnessEvidence = [
    "freshness",
    "updatedat",
    "lastupdated",
    "ageseconds",
    "stale",
    "partial",
    "empty",
    "error"
  ];
  const paginatedEvidence = [
    "hdk-pagination",
    "data-hdk-component=\"pagination\"",
    "pagesize",
    "page-size",
    "pagination"
  ];
  const heavyDataLanguage =
    sourceLower.includes("live") ||
    sourceLower.includes("usage") ||
    sourceLower.includes("issues") ||
    sourceLower.includes("errors") ||
    sourceLower.includes("orders") ||
    sourceLower.includes("snapshots") ||
    sourceLower.includes("markets") ||
    sourceLower.includes("stories") ||
    sourceLower.includes("approval") ||
    sourceLower.includes("qa");

  if (!sidebarEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.sidebarRailMissing",
      "Tier 3 surfaces must show a real sidebar rail/nav standard instead of a loose card stack.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (!headerEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.commandHeaderMissing",
      "Tier 3 surfaces must show compact command-header evidence instead of a fat dashboard banner.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  const routerIndex =
    lower.indexOf("data-media-ops-router");
  const commandHeaderIndex =
    lower.indexOf("hdk-command-header");
  if (routerIndex >= 0 && commandHeaderIndex >= 0 && commandHeaderIndex < routerIndex) {
    issues.push(issue(
      "warning",
      "tier3.shellLevelCommandBanner",
      "Command/overview banners should be route-owned content, not shell-level banners repeated above every dashboard page.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (!overflowEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.overflowProtectionMissing",
      "Tier 3 surfaces should show sidebar/header overflow protection so labels, cards, and actions do not spill out of the shell.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (lower.includes("hdk-table") && !tableEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.tableCompositionMissing",
      "Tier 3 surfaces with data tables should show table composition evidence such as DataTableTabs, hdk-table-tabs, hdk-table-layout, or DataTable.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if ((/\bchart\b/.test(sourceLower) || sourceLower.includes("svg")) && !chartEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.chartPanelMissing",
      "Tier 3 surfaces with charts should use ChartPanel/hdk-chart-panel evidence instead of local decorative chart cards.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (axisChartEvidence && !axisContractEvidence) {
    issues.push(issue(
      "warning",
      "tier3.axisChartContractMissing",
      "Axis charts must declare x/y axis fields and labels so line, area, bar, and column charts are semantically reviewable.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (partToWholeEvidence && !partToWholeContractEvidence) {
    issues.push(issue(
      "warning",
      "tier3.partToWholeContractMissing",
      "Donut/ring/pie charts must declare their dimension and measure contract.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (heavyDataLanguage && !loadingPerformanceEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.loadingPerformanceContractMissing",
      "Tier 3 operational routes must use dashboard-kit loading, freshness, stale, partial, and error state primitives.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if ((/\bchart\b/.test(sourceLower) || sourceLower.includes("table") || heavyDataLanguage) && !freshnessEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.dataFreshnessMissing",
      "Tier 3 data surfaces should expose last-updated/freshness evidence and honest stale, partial, empty, and error states.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if ((sourceLower.includes("<table") || sourceLower.includes("hdk-table")) && !paginatedEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.paginationEvidenceMissing",
      "Tier 3 table surfaces should show pagination, bounded page size, or table-window evidence.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  return issues;
}

if (!fs.existsSync(registryPath)) {
  console.error(`Missing dashboard-kit adoption registry: ${rel(registryPath)}`);
  process.exit(1);
}

const registry = readJson(registryPath);
const sourcePath = path.resolve(root, registry.source.cssPath);
if (!fs.existsSync(sourcePath)) {
  console.error(`Missing canonical CSS: ${registry.source.cssPath}`);
  process.exit(1);
}
const sourceHash = hash(sourcePath);
const projects = (registry.projects ?? []).filter((project) => !projectArg || project.id === projectArg);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: registry.source,
  experienceTierBands: registry.experienceTierBands ?? [],
  sourceHash,
  results: projects.map((project) => evaluateProject(registry, project, sourceHash))
};
const results = report.results;
const failing = results.filter((result) => result.issues.some((item) => item.severity === "error"));

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Hermes dashboard-kit adoption audit`);
  console.log(`Source: ${registry.source.package}@${registry.source.version}`);
  console.log(`CSS hash: ${sourceHash}`);
  console.table(results.map((result) => ({
    project: result.project,
    status: result.status,
    tier: result.experienceTier?.current === null
      ? "unset"
      : `${result.experienceTier.current}->${result.experienceTier.target}${result.experienceTier.targetBand ? ` ${result.experienceTier.targetBand}` : ""}`,
    band: result.experienceTier?.currentBand || "unset",
    mode: result.experienceTier?.implementationMode || "unset",
    actions: result.externalWorkItems?.length ?? 0,
    errors: result.issues.filter((item) => item.severity === "error").length,
    warnings: result.issues.filter((item) => item.severity === "warning").length
  })));
  for (const result of results) {
    if (!result.issues.length) continue;
    console.log(`\n${result.name} (${result.project})`);
    for (const item of result.issues) {
      console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}${item.path ? ` [${item.path}]` : ""}`);
    }
  }
}

if (writeReport) {
  const reportDir = path.join(root, "packages/hermes-dashboard-kit/adoption/reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "latest-adoption-report.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  if (!json) console.log(`\nWrote adoption report: ${rel(reportPath)}`);
}

if (strict && failing.length) process.exit(1);
