#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  dashboardRegistry,
  markdownTable,
  readJson,
  resolveProjectPath,
  root,
  runGit,
  workspaceRoot,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const fleetDir = path.join(root, "docs/fleet");
const registryPath = path.join(fleetDir, "fleet-registry.json");
const evidencePath = path.join(fleetDir, "fleet-evidence-ledger.json");
const workGraphPath = path.join(fleetDir, "fleet-maturity-work-graph.json");
const suggestionsPath = path.join(fleetDir, "fleet-maturity-suggestions.json");
const statusMdPath = path.join(fleetDir, "fleet-maturity-status.md");
const workGraphMdPath = path.join(fleetDir, "fleet-maturity-work-graph.md");
const suggestionsMdPath = path.join(fleetDir, "fleet-maturity-suggestions.md");

const sourcePaths = {
  adoption: path.join(root, "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json"),
  proof: path.join(root, "docs/design/dashboard-production-proof-registry.json"),
  deployment: path.join(root, "docs/design/dashboard-deployment-ledger.json"),
  status: path.join(root, "docs/design/project-status-ledger.json"),
  staticRoutes: path.join(root, "docs/design/static-dashboard-route-audit.json"),
  liveE2E: path.join(root, "docs/design/dashboard-live-e2e-registry.json"),
  monitoring: path.join(root, "docs/design/dashboard-monitoring-registry.json"),
  enterpriseBacklog: path.join(workspaceRoot, "tlc-capital-group-os/registries/enterprise-backlog.json")
};

const baseProjects = [
  {
    id: "tlc-capital-group-os",
    name: "TLC Capital Group OS",
    repo: "tlc-capital-group-os",
    projectPath: "../tlc-capital-group-os",
    ownerSystem: "tlc-enterprise",
    service: "tlc-capital-group-os",
    productionUrl: "https://tlc.tlccapitalgroup.com/dashboard",
    healthUrl: "https://tlc.tlccapitalgroup.com/health",
    proofUrl: "https://tlc.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://tlc.tlccapitalgroup.com/dashboard-snapshot",
    maturityRole: "enterprise-source-of-truth",
    relationships: [
      { type: "rolls-up", target: "hermes-os" },
      { type: "rolls-up", target: "media-business-operations" },
      { type: "rolls-up", target: "media-engine" },
      { type: "rolls-up", target: "rinseables-os" },
      { type: "rolls-up", target: "business-mapper" },
      { type: "rolls-up", target: "investing-system" }
    ]
  },
  {
    id: "nous-hermes-agent",
    name: "Nous Hermes Agent",
    repo: "nous-hermes-agent",
    projectPath: ".",
    ownerSystem: "hermes-standards",
    service: "nous-hermes-agent",
    productionUrl: "https://agent.tlccapitalgroup.com",
    healthUrl: "https://agent.tlccapitalgroup.com/api/status",
    proofUrl: "https://agent.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://agent.tlccapitalgroup.com/api/dashboard-snapshot",
    maturityRole: "standards-and-fleet-control-plane",
    relationships: [
      { type: "governs-dashboard-standards-for", target: "*" },
      { type: "tracks-maturity-for", target: "*" },
      { type: "feeds", target: "hermes-os" },
      { type: "feeds", target: "tlc-capital-group-os" }
    ]
  },
  {
    id: "hermes-os",
    name: "Hermes OS",
    repo: "hermes",
    projectPath: "../hermes",
    ownerSystem: "hermes-runtime",
    service: "hermes",
    productionUrl: "https://hermes.tlccapitalgroup.com/",
    healthUrl: "https://hermes.tlccapitalgroup.com/api/dashboard-summary",
    proofUrl: "https://hermes.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://hermes.tlccapitalgroup.com/api/dashboard-summary",
    maturityRole: "runtime-and-deployment-rail",
    relationships: [
      { type: "deploys", target: "*" },
      { type: "reports-to", target: "tlc-capital-group-os" },
      { type: "is-controlled-by", target: "nous-hermes-agent" }
    ]
  },
  {
    id: "media-engine",
    name: "Media Engine",
    repo: "media-engine",
    projectPath: "../media-engine",
    ownerSystem: "media-production",
    service: "media-engine-dashboard",
    productionUrl: "https://media.tlccapitalgroup.com/dashboard",
    healthUrl: "https://media.tlccapitalgroup.com/health",
    proofUrl: "https://media.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://media.tlccapitalgroup.com/dashboard-snapshot",
    maturityRole: "content-production-engine",
    relationships: [
      { type: "feeds-output-status-to", target: "media-business-operations" },
      { type: "feeds-cost-telemetry-to", target: "media-business-operations" },
      { type: "uses-business-priorities-from", target: "tlc-capital-group-os" },
      { type: "may-produce-for", target: "rinseables-os" }
    ]
  },
  {
    id: "media-business-operations",
    adoptionId: "media-business-os",
    name: "Media Business Operations",
    repo: "media-business-operations",
    projectPath: "../media-business-operations",
    ownerSystem: "media-business",
    service: "media-business-operations",
    productionUrl: "https://media-business-operations.tlccapitalgroup.com/dashboard",
    healthUrl: "https://media-business-operations.tlccapitalgroup.com/health",
    proofUrl: "https://media-business-operations.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://media-business-operations.tlccapitalgroup.com/api/dashboard-summary",
    maturityRole: "media-business-operating-system",
    relationships: [
      { type: "consumes-output-status-from", target: "media-engine" },
      { type: "reports-brand-readiness-to", target: "tlc-capital-group-os" },
      { type: "may-operate-audience-layer-for", target: "rinseables-os" }
    ]
  },
  {
    id: "khashi-vc",
    name: "Khashi VC",
    repo: "khashi-vc",
    projectPath: "../khashi-vc",
    ownerSystem: "market-intelligence",
    service: "khashi",
    productionUrl: "https://roc.tlccapitalgroup.com/",
    healthUrl: "https://roc.tlccapitalgroup.com/readyz",
    proofUrl: "https://roc.tlccapitalgroup.com/dashboard/proof?view=live-market-intelligence",
    snapshotUrl: "https://roc.tlccapitalgroup.com/api/dashboard-snapshot",
    maturityRole: "live-market-intelligence",
    relationships: [
      { type: "reports-diagnostics-to", target: "hermes-os" },
      { type: "reports-opportunity-readiness-to", target: "tlc-capital-group-os" }
    ]
  },
  {
    id: "business-mapper",
    name: "Business Mapper / Consulting",
    repo: "business-mapper",
    projectPath: "../business-mapper",
    ownerSystem: "consulting",
    service: "business-mapper",
    productionUrl: "https://business-mapper.tlccapitalgroup.com/dashboard",
    healthUrl: "https://business-mapper.tlccapitalgroup.com/health",
    proofUrl: "https://business-mapper.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://business-mapper.tlccapitalgroup.com/api/dashboard-snapshot",
    maturityRole: "consulting-offer-and-delivery-system",
    relationships: [
      { type: "packages-capabilities-from", target: "hermes-os" },
      { type: "reports-offer-readiness-to", target: "tlc-capital-group-os" }
    ]
  },
  {
    id: "meal-assistant",
    name: "Meal Assistant",
    repo: "Meal-assistant",
    projectPath: "../Meal-assistant",
    ownerSystem: "household-product",
    service: "meal-assistant",
    productionUrl: "https://meal.tlccapitalgroup.com/",
    healthUrl: "https://meal.tlccapitalgroup.com/health",
    proofUrl: "https://meal.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://meal.tlccapitalgroup.com/api/dashboard-snapshot",
    maturityRole: "household-planning-product",
    relationships: [
      { type: "reports-product-readiness-to", target: "tlc-capital-group-os" },
      { type: "uses-runtime-rail", target: "hermes-os" }
    ]
  },
  {
    id: "rinseables-os",
    name: "Rinseables OS",
    repo: "rinseables-os",
    projectPath: "../rinseables-os",
    ownerSystem: "rinseables-business",
    service: "rinseables-os",
    productionUrl: "https://rinseables.tlccapitalgroup.com",
    healthUrl: "https://rinseables.tlccapitalgroup.com/health",
    proofUrl: "https://rinseables.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://rinseables.tlccapitalgroup.com/api/dashboard-snapshot",
    maturityRole: "saas-product-and-audience-layer",
    relationships: [
      { type: "may-consume-media-from", target: "media-engine" },
      { type: "may-report-audience-through", target: "media-business-operations" },
      { type: "reports-business-readiness-to", target: "tlc-capital-group-os" }
    ]
  },
  {
    id: "investing-system",
    name: "Investing System",
    repo: "investing-system",
    projectPath: "../investing-system",
    ownerSystem: "investment-operations",
    service: "investing-system",
    productionUrl: "https://investing.tlccapitalgroup.com/roc",
    healthUrl: "https://investing.tlccapitalgroup.com/health",
    proofUrl: "https://investing.tlccapitalgroup.com/dashboard/proof",
    snapshotUrl: "https://investing.tlccapitalgroup.com/api/dashboard-snapshot",
    maturityRole: "investment-research-and-governance",
    relationships: [
      { type: "reports-investment-readiness-to", target: "tlc-capital-group-os" },
      { type: "uses-runtime-rail", target: "hermes-os" }
    ]
  }
];

const evidenceKinds = [
  "production-health",
  "deployment-evidence",
  "readonly-proof",
  "screenshot-baseline",
  "dashboard-standard",
  "static-route-debt",
  "live-e2e",
  "dns-proxy",
  "monitoring",
  "external-credentials",
  "outcome-feed"
];

function optionalJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return readJson(file);
}

function repoState(repo) {
  const repoRoot = path.join(workspaceRoot, repo);
  const branch = runGit(repoRoot, ["status", "--short", "--branch"]).split("\n")[0] ?? "";
  const dirty = runGit(repoRoot, ["status", "--porcelain"]).split("\n").filter(Boolean);
  const commit = runGit(repoRoot, ["rev-parse", "HEAD"]);
  const ahead = Number(branch.match(/\[ahead (\d+)/)?.[1] ?? 0);
  const behind = Number(branch.match(/behind (\d+)/)?.[1] ?? 0);
  return {
    path: path.relative(root, repoRoot),
    branch,
    commit,
    shortCommit: commit ? commit.slice(0, 12) : "",
    clean: dirty.length === 0,
    dirtyCount: dirty.length,
    ahead,
    behind
  };
}

function remotePromotionEvidence(service) {
  if (process.env.HERMES_FLEET_REMOTE_EVIDENCE === "0") return { available: false, status: "disabled" };
  try {
    const remotePath = `/root/apps/deploy/deployment-evidence/latest/${service}.json`;
    const output = execFileSync("ssh", ["hermes-os", "cat", remotePath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 6000
    });
    const evidence = JSON.parse(output);
    return {
      available: true,
      status: evidence.status ?? "unknown",
      target: evidence.target ?? null,
      eventId: evidence.eventId ?? null,
      resolvedCommit: evidence.source?.resolvedCommit ?? null,
      finishedAt: evidence.finishedAt ?? null,
      remotePath
    };
  } catch (error) {
    return {
      available: false,
      status: "missing",
      error: error instanceof Error ? error.message.split("\n")[0] : String(error),
      remotePath: `/root/apps/deploy/deployment-evidence/latest/${service}.json`
    };
  }
}

function findByProject(report, projectId, aliases = []) {
  const ids = new Set([projectId, ...aliases]);
  return (report.results ?? report.projects ?? report.entries ?? []).find((entry) =>
    ids.has(entry.project) || ids.has(entry.id) || ids.has(entry.projectId)
  );
}

function statusFromBoolean(condition, missingStatus = "missing") {
  return condition ? "current" : missingStatus;
}

function evidenceItem(project, kind, status, detail = {}) {
  const severity =
    status === "current" || status === "not-applicable"
      ? "none"
      : ["deployment-evidence", "production-health", "readonly-proof", "dashboard-standard", "static-route-debt"].includes(kind)
        ? "blocking"
        : "maturity";
  return {
    id: `${project.id}.${kind}`,
    projectId: project.id,
    kind,
    status,
    severity,
    lastCheckedAt: generatedAt,
    ...detail
  };
}

function workItem({ id, title, type, ownerProject, affectedProjects = [], sourceProject = null, trigger, priority = "medium", status = "open", canCodexProceed = true, requiresHumanDecision = false, evidenceRequiredToClose = [], dependencies = [], suggestedNextAfterClose = [] }) {
  return {
    id,
    title,
    type,
    ownerProject,
    affectedProjects,
    sourceProject,
    trigger,
    status,
    priority,
    canCodexProceed,
    requiresHumanDecision,
    evidenceRequiredToClose,
    dependencies,
    suggestedNextAfterClose
  };
}

const generatedAt = new Date().toISOString();
const dashboards = dashboardRegistry();
const adoptionReport = optionalJson(sourcePaths.adoption, { results: [] });
const proofRegistry = optionalJson(sourcePaths.proof, { entries: [] });
const deploymentLedger = optionalJson(sourcePaths.deployment, { entries: [] });
const projectStatus = optionalJson(sourcePaths.status, { projects: [] });
const staticRoutes = optionalJson(sourcePaths.staticRoutes, { findings: [] });
const liveE2ERegistry = optionalJson(sourcePaths.liveE2E, { entries: [] });
const monitoringRegistry = optionalJson(sourcePaths.monitoring, { entries: [] });
const enterpriseBacklog = optionalJson(sourcePaths.enterpriseBacklog, { items: [] });

const registry = baseProjects.map((project) => {
  const dashboard = dashboards.find((item) => item.projectPath === project.projectPath || item.deployment?.composeService === project.service);
  const repo = repoState(project.repo);
  const adoption = findByProject(adoptionReport, project.adoptionId ?? project.id, [project.id]);
  const status = findByProject(projectStatus, project.id, [project.adoptionId].filter(Boolean));
  const deployment = findByProject(deploymentLedger, dashboard?.id ?? project.id, [project.id]);
  const proof = findByProject(proofRegistry, dashboard?.id ?? project.id, [project.id]);
  const promotion = remotePromotionEvidence(project.service);
  return {
    schemaVersion: 1,
    id: project.id,
    name: project.name,
    repo: project.repo,
    projectPath: project.projectPath,
    ownerSystem: project.ownerSystem,
    maturityRole: project.maturityRole,
    production: {
      provider: "hetzner",
      service: project.service,
      url: dashboard?.url ?? project.productionUrl,
      healthUrl: dashboard?.healthUrl ?? project.healthUrl,
      proofUrl: dashboard?.proofUrl ?? project.proofUrl,
      snapshotUrl: dashboard?.snapshotUrl ?? project.snapshotUrl,
      promotionEvidencePath: promotion.remotePath
    },
    dashboard: {
      registered: Boolean(adoption),
      dashboardId: dashboard?.id ?? null,
      status: adoption?.status ?? "unregistered",
      currentBand: adoption?.experienceTier?.currentBand ?? status?.dashboard?.reportedTier ?? "unknown",
      targetBand: adoption?.experienceTier?.targetBand ?? null,
      implementationMode: adoption?.experienceTier?.implementationMode ?? null,
      issueCount: adoption?.issues?.length ?? 0
    },
    readiness: {
      text: status?.readiness ?? null,
      interpretation: status?.dashboard?.interpretation ?? null
    },
    repoState: repo,
    latestPromotion: promotion,
    proof: {
      status: proof?.status ?? "not-in-proof-registry",
      capturedAt: proof?.proof?.capturedAt ?? null,
      screenshotCaptured: Boolean(proof?.proof?.screenshotCaptured),
      httpStatus: proof?.proof?.httpStatus ?? null
    },
    enterpriseBacklog: (enterpriseBacklog.items ?? [])
      .filter((item) => item.project === project.id || item.projectId === project.id)
      .map((item) => ({ id: item.id, status: item.status, priority: item.priority, title: item.title })),
    relationships: project.relationships
  };
});

const evidenceEntries = registry.flatMap((project) => {
  const proofCurrent = project.proof.status === "baseline-present" || project.proof.httpStatus === 200;
  const dashboardCurrent = project.dashboard.status === "current" && project.dashboard.issueCount === 0;
  const projectAliases = new Set([project.id, project.adoptionId].filter(Boolean));
  const staticFindings = (staticRoutes.findings ?? []).filter((finding) => projectAliases.has(finding.projectId));
  const staticErrors = staticFindings.filter((finding) => finding.severity === "error");
  const staticWarnings = staticFindings.filter((finding) => finding.severity === "warning");
  const staticRouteStatus = staticErrors.length ? "blocked" : staticWarnings.length ? "needs-review" : "current";
  const liveE2E = (liveE2ERegistry.entries ?? []).find((entry) => projectAliases.has(entry.projectId));
  const monitoring = (monitoringRegistry.entries ?? []).find((entry) => projectAliases.has(entry.projectId));
  const hasOutcomeFeed = Boolean(project.production.snapshotUrl);
  const externalCredBacklog = project.enterpriseBacklog.find((item) => /credential/i.test(item.id) || /credential/i.test(item.title ?? ""));
  return [
    evidenceItem(project, "production-health", statusFromBoolean(Boolean(project.production.healthUrl)), {
      source: project.production.healthUrl,
      recommendedFix: project.production.healthUrl ? null : "Declare and verify a production health URL."
    }),
    evidenceItem(project, "deployment-evidence", statusFromBoolean(project.latestPromotion.available && project.latestPromotion.status === "succeeded"), {
      source: project.latestPromotion.remotePath,
      promotion: project.latestPromotion,
      recommendedFix: project.latestPromotion.available ? null : `Promote ${project.production.service} through the Hetzner promotion rail.`
    }),
    evidenceItem(project, "readonly-proof", statusFromBoolean(Boolean(project.production.proofUrl) && proofCurrent, Boolean(project.production.proofUrl) ? "stale" : "missing"), {
      source: project.production.proofUrl,
      proof: project.proof,
      recommendedFix: proofCurrent ? null : "Capture or refresh the production readonly proof route."
    }),
    evidenceItem(project, "screenshot-baseline", statusFromBoolean(project.proof.screenshotCaptured, "missing"), {
      source: project.proof.capturedAt,
      recommendedFix: project.proof.screenshotCaptured ? null : "Capture a production screenshot baseline."
    }),
    evidenceItem(project, "dashboard-standard", statusFromBoolean(dashboardCurrent, project.dashboard.registered ? "needs-review" : "missing"), {
      source: "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json",
      dashboard: project.dashboard,
      recommendedFix: dashboardCurrent ? null : "Register or repair the dashboard adoption surface."
    }),
    evidenceItem(project, "static-route-debt", staticRouteStatus, {
      source: "docs/design/static-dashboard-route-audit.json",
      findings: staticFindings.map((finding) => ({
        severity: finding.severity,
        code: finding.code,
        surfacePath: finding.surfacePath,
        message: finding.message
      })),
      recommendedFix: staticFindings.length
        ? "Migrate primary static/public dashboard routes to package-native frontend entrypoints and keep compatibility routes out of primary navigation."
        : null
    }),
    evidenceItem(project, "live-e2e", liveE2E?.status === "current" ? "current" : liveE2E?.status === "declared" ? "needs-review" : "missing", {
      source: "docs/design/dashboard-live-e2e-registry.json",
      evidence: liveE2E ?? null,
      recommendedFix: liveE2E?.status === "current"
        ? null
        : liveE2E?.recommendedFix ?? "Add or refresh live E2E evidence for the primary production workflow."
    }),
    evidenceItem(project, "dns-proxy", statusFromBoolean(Boolean(project.production.url), "missing"), {
      source: project.production.url,
      recommendedFix: project.production.url ? null : "Declare the production DNS and Caddy route."
    }),
    evidenceItem(project, "monitoring", monitoring?.status === "current" ? "current" : monitoring?.status === "declared" ? "needs-review" : "missing", {
      source: "docs/design/dashboard-monitoring-registry.json",
      evidence: monitoring ?? null,
      recommendedFix: monitoring?.status === "current"
        ? null
        : monitoring?.recommendedFix ?? "Add monitoring/log shipping evidence and alert ownership."
    }),
    evidenceItem(project, "external-credentials", externalCredBacklog ? "blocked" : "not-applicable", {
      source: externalCredBacklog?.id ?? null,
      recommendedFix: externalCredBacklog ? "Resolve or explicitly defer external credential setup with owner and authority policy." : null
    }),
    evidenceItem(project, "outcome-feed", statusFromBoolean(hasOutcomeFeed, "missing"), {
      source: project.production.snapshotUrl,
      recommendedFix: hasOutcomeFeed ? null : "Add project-feed.v1, /api/hermes/outcomes, or /dashboard-snapshot evidence."
    })
  ];
});

const workItems = [];

for (const project of registry) {
  for (const evidence of evidenceEntries.filter((item) => item.projectId === project.id && !["current", "not-applicable"].includes(item.status))) {
    workItems.push(workItem({
      id: `${project.id}.${evidence.kind}.maturity`,
      title: `${project.name}: ${evidence.kind.replaceAll("-", " ")} is ${evidence.status}`,
      type: evidence.kind,
      ownerProject: project.id,
      affectedProjects: [project.id],
      sourceProject: "nous-hermes-agent",
      trigger: `Fleet evidence scan found ${evidence.kind}=${evidence.status}.`,
      priority: evidence.severity === "blocking" ? "high" : "medium",
      canCodexProceed: !["external-credentials"].includes(evidence.kind),
      requiresHumanDecision: evidence.kind === "external-credentials",
      evidenceRequiredToClose: [evidence.kind],
      suggestedNextAfterClose: ["Refresh fleet maturity tracker.", "Check downstream cross-project trigger rules."]
    }));
  }
}

const triggerRules = [
  {
    id: "media-engine-output-to-media-business-readiness",
    sourceProject: "media-engine",
    ownerProject: "media-business-operations",
    affectedProjects: ["media-engine", "media-business-operations", "tlc-capital-group-os"],
    title: "Propagate Media Engine output/deploy maturity into Media Business readiness and TLC rollups.",
    trigger: "Media Engine production, cost, or publishing evidence changes.",
    dependencies: ["media-engine.deployment-evidence", "media-engine.outcome-feed"]
  },
  {
    id: "media-business-readiness-to-tlc-portfolio",
    sourceProject: "media-business-operations",
    ownerProject: "tlc-capital-group-os",
    affectedProjects: ["media-business-operations", "tlc-capital-group-os"],
    title: "Roll Media Business brand/readiness changes into TLC portfolio readiness.",
    trigger: "Media Business authority, readiness history, or brand controls change.",
    dependencies: ["media-business-operations.outcome-feed"]
  },
  {
    id: "rinseables-product-to-media-and-tlc",
    sourceProject: "rinseables-os",
    ownerProject: "tlc-capital-group-os",
    affectedProjects: ["rinseables-os", "media-business-operations", "media-engine", "tlc-capital-group-os"],
    title: "Connect Rinseables product/audience maturity to Media Business, Media Engine, and TLC reporting.",
    trigger: "Rinseables product model, KPI, revenue, or audience layer changes.",
    dependencies: ["rinseables-os.outcome-feed", "rinseables-os.dashboard-standard"]
  },
  {
    id: "khashi-diagnostics-to-hermes-runtime",
    sourceProject: "khashi-vc",
    ownerProject: "hermes-os",
    affectedProjects: ["khashi-vc", "hermes-os", "tlc-capital-group-os"],
    title: "Promote Khashi production diagnostics into Hermes runtime evidence and TLC readiness.",
    trigger: "Khashi production diagnostics, scheduler capacity, or live E2E evidence changes.",
    dependencies: ["khashi-vc.live-e2e", "khashi-vc.deployment-evidence"]
  },
  {
    id: "hermes-rail-change-to-fleet-evidence",
    sourceProject: "hermes-os",
    ownerProject: "nous-hermes-agent",
    affectedProjects: registry.map((project) => project.id),
    title: "After Hermes deploy rail changes, refresh fleet deployment evidence and anti-loop status.",
    trigger: "Hermes promotion rail, Caddy route, deploy script, or evidence schema changes.",
    dependencies: ["hermes-os.deployment-evidence"]
  }
];

for (const rule of triggerRules) {
  const openDependencies = rule.dependencies.filter((dependency) => {
    const [projectId, kind] = dependency.split(".");
    const evidence = evidenceEntries.find((item) => item.projectId === projectId && item.kind === kind);
    return !evidence || !["current", "not-applicable"].includes(evidence.status);
  });
  workItems.push(workItem({
    id: rule.id,
    title: rule.title,
    type: "cross-project-maturity",
    ownerProject: rule.ownerProject,
    affectedProjects: rule.affectedProjects,
    sourceProject: rule.sourceProject,
    trigger: rule.trigger,
    priority: openDependencies.length ? "medium" : "low",
    status: openDependencies.length ? "waiting-on-evidence" : "recommended",
    canCodexProceed: true,
    requiresHumanDecision: false,
    evidenceRequiredToClose: rule.dependencies,
    dependencies: openDependencies,
    suggestedNextAfterClose: [
      "Refresh TLC portfolio readiness if affected.",
      "Refresh Nous fleet maturity tracker.",
      "Check whether another project now needs outcome-feed or monitoring work."
    ]
  }));
}

const suggestions = workItems
  .filter((item) => item.status !== "closed")
  .map((item) => {
    const dependencyPenalty = item.dependencies.length;
    const priorityScore = item.priority === "high" ? 100 : item.priority === "medium" ? 60 : 30;
    const decisionPenalty = item.requiresHumanDecision ? 25 : 0;
    return {
      id: `suggest.${item.id}`,
      workItemId: item.id,
      title: item.title,
      ownerProject: item.ownerProject,
      affectedProjects: item.affectedProjects,
      status: item.requiresHumanDecision ? "needs-human-decision" : dependencyPenalty ? "recommended" : "ready-to-build",
      priority: item.priority,
      score: priorityScore - dependencyPenalty * 10 - decisionPenalty,
      reason: item.trigger,
      nextAction: item.requiresHumanDecision
        ? "Get human authority/credential decision before implementation."
        : dependencyPenalty
          ? "Close dependency evidence first, then execute the cross-project maturity item."
          : "Codex can build or refresh this maturity work."
    };
  })
  .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

const registryReport = {
  schemaVersion: 1,
  generatedAt,
  purpose: "Fleet-wide project, production, dashboard, and relationship registry for Nous Hermes Agent.",
  projects: registry
};

const evidenceReport = {
  schemaVersion: 1,
  generatedAt,
  purpose: "Fleet-wide evidence ledger for production proof, deployment evidence, monitoring, credentials, E2E, and outcome feeds.",
  evidenceKinds,
  summary: {
    total: evidenceEntries.length,
    current: evidenceEntries.filter((entry) => entry.status === "current").length,
    missing: evidenceEntries.filter((entry) => entry.status === "missing").length,
    needsReview: evidenceEntries.filter((entry) => entry.status === "needs-review").length,
    stale: evidenceEntries.filter((entry) => entry.status === "stale").length,
    blocked: evidenceEntries.filter((entry) => entry.status === "blocked").length,
    notApplicable: evidenceEntries.filter((entry) => entry.status === "not-applicable").length
  },
  entries: evidenceEntries
};

const workGraph = {
  schemaVersion: 1,
  generatedAt,
  purpose: "Structured fleet maturity work graph, including cross-project triggers and closure evidence.",
  summary: {
    total: workItems.length,
    open: workItems.filter((item) => ["open", "recommended", "waiting-on-evidence"].includes(item.status)).length,
    humanDecision: workItems.filter((item) => item.requiresHumanDecision).length,
    crossProject: workItems.filter((item) => item.type === "cross-project-maturity").length
  },
  items: workItems
};

const suggestionReport = {
  schemaVersion: 1,
  generatedAt,
  purpose: "Ranked next maturity suggestions generated after fleet evidence and cross-project trigger analysis.",
  summary: {
    total: suggestions.length,
    readyToBuild: suggestions.filter((item) => item.status === "ready-to-build").length,
    needsHumanDecision: suggestions.filter((item) => item.status === "needs-human-decision").length,
    recommended: suggestions.filter((item) => item.status === "recommended").length
  },
  suggestions
};

writeJson(registryPath, registryReport);
writeJson(evidencePath, evidenceReport);
writeJson(workGraphPath, workGraph);
writeJson(suggestionsPath, suggestionReport);

const projectRows = registry.map((project) => [
  project.name,
  project.production.service,
  project.dashboard.currentBand,
  project.latestPromotion.available && project.latestPromotion.status === "succeeded" ? "current" : "missing",
  project.proof.status,
  project.repoState.clean ? "clean" : `${project.repoState.dirtyCount} dirty`,
  project.relationships.map((rel) => `${rel.type}:${rel.target}`).join("; ")
]);

const evidenceRows = evidenceKinds.map((kind) => {
  const entries = evidenceEntries.filter((entry) => entry.kind === kind);
  return [
    kind,
    entries.filter((entry) => entry.status === "current").length,
    entries.filter((entry) => entry.status === "missing").length,
    entries.filter((entry) => entry.status === "needs-review").length,
    entries.filter((entry) => entry.status === "stale").length,
    entries.filter((entry) => entry.status === "blocked").length
  ];
});

writeMarkdown(statusMdPath, `# Fleet Maturity Status

Generated: ${generatedAt}

Purpose: one fleet-wide tracker for production proof, deployment evidence, monitoring, credentials, live E2E evidence, outcome feeds, business/product maturity, and cross-project maturity triggers.

## Summary

- Projects tracked: ${registry.length}
- Evidence entries: ${evidenceReport.summary.total}
- Current evidence entries: ${evidenceReport.summary.current}
- Missing evidence entries: ${evidenceReport.summary.missing}
- Needs-review evidence entries: ${evidenceReport.summary.needsReview}
- Blocked evidence entries: ${evidenceReport.summary.blocked}
- Maturity work items: ${workGraph.summary.total}
- Cross-project work items: ${workGraph.summary.crossProject}
- Ready-to-build suggestions: ${suggestionReport.summary.readyToBuild}
- Human-decision suggestions: ${suggestionReport.summary.needsHumanDecision}

## Project Registry

${markdownTable(["Project", "Service", "Dashboard Band", "Deploy Evidence", "Proof", "Repo", "Relationships"], projectRows)}

## Evidence Coverage

${markdownTable(["Evidence Kind", "Current", "Missing", "Needs Review", "Stale", "Blocked"], evidenceRows)}

## Top Suggestions

${markdownTable(["Suggestion", "Owner", "Status", "Priority", "Next Action"], suggestions.slice(0, 15).map((item) => [
  item.title,
  item.ownerProject,
  item.status,
  item.priority,
  item.nextAction
]))}
`);

writeMarkdown(workGraphMdPath, `# Fleet Maturity Work Graph

Generated: ${generatedAt}

${markdownTable(["Work Item", "Type", "Owner", "Affected Projects", "Status", "Priority", "Human Decision"], workItems.map((item) => [
  item.title,
  item.type,
  item.ownerProject,
  item.affectedProjects.join(", "),
  item.status,
  item.priority,
  item.requiresHumanDecision ? "yes" : "no"
]))}
`);

writeMarkdown(suggestionsMdPath, `# Fleet Maturity Suggestions

Generated: ${generatedAt}

${markdownTable(["Suggestion", "Owner", "Affected Projects", "Status", "Priority", "Reason", "Next Action"], suggestions.map((item) => [
  item.title,
  item.ownerProject,
  item.affectedProjects.join(", "),
  item.status,
  item.priority,
  item.reason,
  item.nextAction
]))}
`);

console.log(`Wrote ${path.relative(root, registryPath)}`);
console.log(`Wrote ${path.relative(root, evidencePath)}`);
console.log(`Wrote ${path.relative(root, workGraphPath)}`);
console.log(`Wrote ${path.relative(root, suggestionsPath)}`);
console.log(`Wrote ${path.relative(root, statusMdPath)}`);
console.log(`Wrote ${path.relative(root, workGraphMdPath)}`);
console.log(`Wrote ${path.relative(root, suggestionsMdPath)}`);
