#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(root, "..");
const jsonOut = path.join(root, "docs/design/project-status-ledger.json");
const mdOut = path.join(root, "docs/design/project-status-ledger.md");

const projects = [
  {
    id: "tlc-capital-group-os",
    name: "TLC Capital Group OS",
    repo: "tlc-capital-group-os",
    role: "Enterprise source of truth, readiness, OKRs, portfolio governance.",
    readiness: "88 enterprise readiness in the portfolio hub.",
    built: [
      "Portfolio readiness hub, readiness snapshots, command center, and maintenance endpoint.",
      "Enterprise backlog registry and production readiness reporting.",
      "OKR execution backbone for objectives, key results, evidence, task links, check-ins, and rollups."
    ],
    gaps: [
      "Production cron for readiness history needs to be enabled.",
      "Project outcome feeds and dashboard snapshots need to be emitted by every business unit.",
      "Knowledge/search indexing, diagnostics ingestion, external provider credentials, and package-native UI migration remain open."
    ]
  },
  {
    id: "nous-hermes-agent",
    name: "Nous Hermes Agent",
    repo: "nous-hermes-agent",
    role: "Shared dashboard kit, governance, standards, adoption, and proof infrastructure.",
    readiness: "65 software integration in the portfolio hub; dashboard governance is much stronger than child-project adoption.",
    built: [
      "Dashboard kit governance, experience tiers, adoption registry, proof reports, loading standards, Mobbin/reference rules, and component coverage audits.",
      "Package-native creation, validation, maturity, visual evidence, token, theme, and local override tooling."
    ],
    gaps: [
      "Keep production visual evidence, deployment evidence, and dashboard governance reports refreshed after runtime-impacting releases.",
      "Register Nous Hermes Agent itself as an audited operator dashboard if it should be assessed as a product surface, not just the standards/control system."
    ]
  },
  {
    id: "hermes-os",
    name: "Hermes OS",
    repo: "hermes",
    role: "Runtime, deploy, operator access, diagnostics, and shared control-plane layer.",
    readiness: "40 business readiness in the portfolio hub.",
    built: [
      "Deployment/source-of-truth docs and shared control-plane direction exist."
    ],
    gaps: [
      "Complete the business-unit constitution, TLC OS boundary, KPI contract, and authority matrix so Hermes OS is measured as a shared platform rather than a normal business unit.",
      "Keep deploy/log/health rails synchronized between source and the live Hetzner deployment rail."
    ]
  },
  {
    id: "media-engine",
    name: "Media Engine",
    repo: "media-engine",
    role: "Content production, thumbnails, transcription, social packaging, Discord handoff, and media operations.",
    readiness: "56 business readiness and 45.5 plan completion in the portfolio hub.",
    built: [
      "Production renderer imports dashboard-kit and has visual QA infrastructure.",
      "Thumbnail pipeline experiments, audio/transcription package flow, YouTube SEO copy upgrades, and Discord handoff work exist."
    ],
    gaps: [
      "Provider spend controls, production worker verification, cleanup/pruning, and AI executive profile remain open.",
      "Optional deeper component decomposition can continue as maturity work, but it is no longer blocking the current T3C dashboard standard."
    ]
  },
  {
    id: "media-business-os",
    name: "Media Business OS",
    repo: "media-business-operations",
    role: "Brand/business operations, cross-brand decisions, posting governance, QA, and performance operating cockpit.",
    readiness: "60 business readiness in the portfolio hub.",
    built: [
      "Dashboard has been upgraded toward the standard with light-mode cleanup, loading/performance expectations, and package-native dependency alignment."
    ],
    gaps: [
      "Brand decisions, production worker handoff, brand controls, readiness history, TLC OS reporting, and postable page controls remain open.",
      "Optional deeper shared-component adoption can continue as maturity work, but it is no longer blocking the current T3C dashboard standard."
    ]
  },
  {
    id: "khashi-vc",
    name: "Kashi VC",
    repo: "khashi-vc",
    role: "Live market intelligence, volatility scanning, market browser, streaming capacity, and strategy evidence.",
    readiness: "90 software plan completion in the portfolio hub.",
    built: [
      "Live Command is the current reference surface for live market cockpit behavior.",
      "Live market browser, pagination, stream/snapshot work, proof route work, and capacity-governor direction exist."
    ],
    gaps: [
      "Production E2E evidence, database hardening, scheduler/capacity proof, long-run strategy evidence, and chart/data reliability need more proof.",
      "Optional decomposition of compatibility/static surfaces can continue as maturity work, but the primary audited cockpit is current at T3C."
    ]
  },
  {
    id: "business-mapper",
    name: "Business Mapper / Consulting",
    repo: "business-mapper",
    role: "Consulting/business mapping, offers, operating maps, and client-facing planning.",
    readiness: "32 business readiness and 82 tool completion in the portfolio hub.",
    built: [
      "Dashboard-kit dependency and shared-component target are recognized."
    ],
    gaps: [
      "Consulting offer, pricing, target customer, KPI contract, authority matrix, and production outcome reporting remain open."
    ]
  },
  {
    id: "meal-assistant",
    name: "Meal Assistant",
    repo: "Meal-assistant",
    role: "Household meal planning, meal library, calendar, checklist, review, and household workflows.",
    readiness: "90 software plan completion in the portfolio hub.",
    built: [
      "Planner/calendar/dashboard MVP exists with local development workflow."
    ],
    gaps: [
      "Real Telegram deployment, recipe/search/speech providers, production DB, hosted auth, and monitoring remain open.",
      "Real household usage should drive further planner/calendar polish; the audited dashboard standard is current at T3C."
    ]
  },
  {
    id: "rinseables-os",
    name: "Rinseables OS / SaaS",
    repo: "rinseables-os",
    role: "Rinseables SaaS/product operating system and related audience layer.",
    readiness: "40 business readiness and 90 software plan completion in the portfolio hub.",
    built: [
      "Software plan is mature enough to be tracked as a serious product candidate."
    ],
    gaps: [
      "Product offer, revenue model, KPI/customer analytics, engineering/outreach engines, media layer relationship, and legacy principles naming cleanup remain open."
    ]
  },
  {
    id: "investing-system",
    name: "Investing System / Leon",
    repo: "investing-system",
    role: "Investment research, external data, execution governance, and voice/audio investment workflow.",
    readiness: "90 software plan completion in the portfolio hub.",
    built: [
      "Strategic plan and core system direction exist."
    ],
    gaps: [
      "Live external data, provider coverage, broker/custodian sync, voice/audio UX, and live execution governance remain open."
    ]
  }
];

const enterpriseBacklogPath = path.join(workspaceRoot, "tlc-capital-group-os/registries/enterprise-backlog.json");
const adoptionReportPath = path.join(root, "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json");
const tierAssessmentPath = path.join(root, "docs/design/project-dashboard-tier-assessment.json");
const maturitySummaryPath = path.join(root, "docs/design/canonical-main-design-maturity-summary.json");

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function runGit(repo, args) {
  const cwd = path.join(workspaceRoot, repo);
  if (!fs.existsSync(path.join(cwd, ".git"))) {
    return "";
  }
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function gitStatus(repo) {
  const branch = runGit(repo, ["status", "--short", "--branch"]).split("\n")[0] ?? "";
  const dirtyLines = runGit(repo, ["status", "--porcelain"]).split("\n").filter(Boolean);
  const aheadMatch = branch.match(/\[ahead (\d+)/);
  const behindMatch = branch.match(/behind (\d+)/);
  return {
    branch,
    clean: dirtyLines.length === 0,
    dirtyCount: dirtyLines.length,
    dirtyFiles: dirtyLines.slice(0, 12),
    ahead: aheadMatch ? Number(aheadMatch[1]) : 0,
    behind: behindMatch ? Number(behindMatch[1]) : 0
  };
}

function latestCommits(repo) {
  const log = runGit(repo, ["log", "--oneline", "--max-count=4"]);
  return log ? log.split("\n") : [];
}

function adoptionFor(projectId, adoption) {
  return (adoption.results ?? []).find((item) => item.project === projectId) ?? null;
}

function tierFor(projectId, tierAssessment) {
  return (tierAssessment.projects ?? []).find((item) => item.id === projectId || item.project === projectId) ?? null;
}

function backlogFor(projectId, enterpriseBacklog) {
  return (enterpriseBacklog.items ?? []).filter((item) => item.project === projectId || item.projectId === projectId);
}

function interpretation(project, adoption) {
  if (!adoption) return "No current dashboard adoption record; needs inventory.";
  const note = adoption.experienceTier?.nextAction ?? adoption.experienceTier?.note ?? adoption.tierMigrationNote ?? adoption.note ?? "";
  const unresolvedNote = /needs|pending|remaining|still|migration|decomposition/i.test(note);
  const currentBand = adoption.experienceTier?.currentBand ?? adoption.currentExperienceBand ?? "";
  const issueCount = adoption.issues?.length ?? 0;
  if (adoption.status === "current" && currentBand === "T3C" && issueCount === 0) {
    return "Dashboard standard is current at T3C with no adoption issues; remaining notes are product or operating maturity, not dashboard-standard blockers.";
  }
  if (adoption.status === "current" && unresolvedNote) {
    return "Dashboard is registered/current, but the narrative still names follow-up maturity work.";
  }
  if (adoption.status === "current") return "Registered/current by latest dashboard adoption report.";
  return `Adoption status is ${adoption.status}; needs follow-up.`;
}

const adoption = readJson(adoptionReportPath, { results: [] });
const tierAssessment = readJson(tierAssessmentPath, { projects: [] });
const maturitySummary = readJson(maturitySummaryPath, {});
const enterpriseBacklog = readJson(enterpriseBacklogPath, { items: [] });

const rows = projects.map((project) => {
  const adoptionRecord = adoptionFor(project.id, adoption);
  const tierRecord = tierFor(project.id, tierAssessment);
  return {
    ...project,
    dashboard: {
      latestStatus: adoptionRecord?.status ?? "unregistered",
      reportedTier: adoptionRecord?.experienceTier?.currentBand ?? adoptionRecord?.targetExperienceBand ?? adoptionRecord?.targetTier ?? null,
      targetBand: adoptionRecord?.experienceTier?.targetBand ?? null,
      currentTier: adoptionRecord?.experienceTier?.current ?? adoptionRecord?.currentExperienceTier ?? null,
      targetTier: adoptionRecord?.experienceTier?.target ?? adoptionRecord?.targetExperienceTier ?? null,
      implementationMode: adoptionRecord?.experienceTier?.implementationMode ?? adoptionRecord?.implementationMode ?? null,
      bridgeStatus: adoptionRecord?.bridgeStatus ?? null,
      issueCount: adoptionRecord?.issues?.length ?? 0,
      note: adoptionRecord?.experienceTier?.nextAction ?? adoptionRecord?.experienceTier?.note ?? adoptionRecord?.tierMigrationNote ?? adoptionRecord?.note ?? "",
      olderAssessmentStatus: tierRecord?.auditStatus ?? tierRecord?.status ?? null,
      olderAssessmentBand: tierRecord?.currentExperienceBand ?? null,
      interpretation: interpretation(project, adoptionRecord)
    },
    git: gitStatus(project.repo),
    recentCommits: latestCommits(project.repo),
    enterpriseBacklog: backlogFor(project.id, enterpriseBacklog).map((item) => ({
      id: item.id,
      status: item.status,
      priority: item.priority,
      title: item.title
    }))
  };
});

const crossProject = {
  sourceCaveat: "The latest dashboard adoption report, tier assessment, and cross-project backlog are regenerated together. Dashboard-standard blockers should come from the latest adoption report and backlog; business/product maturity remains tracked separately.",
  dirtyRepos: rows.filter((row) => !row.git.clean).map((row) => row.id),
  aheadRepos: rows.filter((row) => row.git.ahead > 0).map((row) => ({ id: row.id, ahead: row.git.ahead })),
  enterpriseBacklogOpenItems: (enterpriseBacklog.items ?? []).length,
  nousMaturitySummary: {
    generatedAt: maturitySummary.generatedAt ?? null,
    completedSlices: maturitySummary.completedSlices ?? maturitySummary.completedCount ?? null,
    blockedSlices: maturitySummary.blockedSlices ?? maturitySummary.blockedCount ?? null,
    status: maturitySummary.status ?? null
  },
  recommendedNextActions: [
    "No blocking cross-project dashboard-standard build items are open in the latest adoption report.",
    "Keep production proof, deployment evidence, and dashboard governance reports refreshed after runtime-impacting releases.",
    "Advance remaining business/product maturity: Hermes OS boundary/constitution/KPI contract, Consulting offer/pricing/templates, Rinseables product model/KPI rails, and Media Business authority/readiness history.",
    "Implement project-feed.v1, /api/hermes/outcomes, and /dashboard-snapshot emitters where still missing or not yet promoted into production proof.",
    "Keep external credentials, provider integrations, production cron jobs, monitoring, and live E2E evidence as the next maturity layer."
  ]
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceReports: {
    dashboardAdoption: path.relative(root, adoptionReportPath),
    olderTierAssessment: path.relative(root, tierAssessmentPath),
    nousMaturitySummary: path.relative(root, maturitySummaryPath),
    tlcEnterpriseBacklog: path.relative(root, enterpriseBacklogPath)
  },
  crossProject,
  projects: rows
};

fs.writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);

const lines = [
  "# Project Status Ledger",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "This is the consolidated operating ledger for the current workspace. It intentionally separates reported status from honest interpretation because several source reports are at different freshness levels.",
  "",
  "## Cross-Project Status",
  "",
  `- Dirty repos: ${crossProject.dirtyRepos.length ? crossProject.dirtyRepos.join(", ") : "none"}`,
  `- Repos ahead of remote: ${crossProject.aheadRepos.length ? crossProject.aheadRepos.map((item) => `${item.id} +${item.ahead}`).join(", ") : "none"}`,
  `- Enterprise backlog items: ${crossProject.enterpriseBacklogOpenItems}`,
  "",
  "## Recommended Next Actions",
  "",
  ...crossProject.recommendedNextActions.map((action) => `- ${action}`),
  "",
  "## Project Ledger",
  ""
];

for (const row of rows) {
  lines.push(`### ${row.name}`);
  lines.push("");
  lines.push(`- Role: ${row.role}`);
  lines.push(`- Readiness: ${row.readiness}`);
  lines.push(`- Dashboard: ${row.dashboard.latestStatus}; reported band ${row.dashboard.reportedTier ?? "unknown"}; mode ${row.dashboard.implementationMode ?? "unknown"}`);
  lines.push(`- Interpretation: ${row.dashboard.interpretation}`);
  lines.push(`- Git: ${row.git.branch || "not available"}; ${row.git.clean ? "clean" : `${row.git.dirtyCount} dirty file(s)`}`);
  if (row.enterpriseBacklog.length) {
    lines.push(`- Enterprise backlog: ${row.enterpriseBacklog.map((item) => `${item.id} (${item.status}, ${item.priority})`).join("; ")}`);
  }
  lines.push("");
  lines.push("Built:");
  for (const item of row.built) lines.push(`- ${item}`);
  lines.push("");
  lines.push("Still needed:");
  for (const item of row.gaps) lines.push(`- ${item}`);
  lines.push("");
}

fs.writeFileSync(mdOut, `${lines.join("\n")}\n`);

console.log(`Wrote ${path.relative(root, jsonOut)}`);
console.log(`Wrote ${path.relative(root, mdOut)}`);
