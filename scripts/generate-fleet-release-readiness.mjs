#!/usr/bin/env node
import path from "node:path";
import {
  dashboardRegistry,
  markdownTable,
  resolveProjectPath,
  root,
  runGit,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const outJson = path.join(root, "docs/fleet/fleet-release-readiness.json");
const outMd = path.join(root, "docs/fleet/fleet-release-readiness.md");
const strict = process.argv.includes("--strict");

const generatedEvidencePatterns = [
  /^docs\/fleet\/fleet-.*\.(json|md)$/,
  /^docs\/design\/dashboard-.*\.(json|md|html)$/,
  /^docs\/design\/static-dashboard-route-audit\.json$/,
  /^docs\/design\/canonical-main-design-maturity-.*\.(json|md)$/,
  /^packages\/hermes-dashboard-kit\/adoption\/reports\/.*\.json$/,
  /^web\/src\/pages\/.*-data\.ts$/,
  /^web\/src\/pages\/dashboard-kit-gallery-kit\.css$/,
  /^data\/.*ledger.*\.json$/
];

const screenshotProofPatterns = [
  /^docs\/design\/production-screenshots\/.*\.(png|jpg|jpeg|webp)$/,
  /^proof\/.*\.(png|jpg|jpeg|webp|json|md)$/
];

const deployableSourcePatterns = [
  /^src\//,
  /^web\/src\//,
  /^web\/vite\.config\.(ts|js|mjs)$/,
  /^packages\/[^/]+\/src\//,
  /^packages\/[^/]+\/DESIGN\.md$/,
  /^packages\/[^/]+\/README\.md$/,
  /^packages\/[^/]+\/scripts\//,
  /^packages\/[^/]+\/tests\//,
  /^packages\/[^/]+\/adoption\/.*\.(json|md)$/,
  /^core\//,
  /^discord\//,
  /^tasks\//,
  /^scripts\/.*\.(mjs|js|ts|py)$/,
  /^tests\//,
  /^public\//,
  /^docs\/.*\.(md|json)$/,
  /^docs\/design\/.*\.(md|json)$/,
  /^docs\/deployment\/.*\.(md|json)$/,
  /^docs\/fleet\/README\.md$/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^vite\.config\.(ts|js|mjs)$/,
  /^playwright\.config\.(ts|js|mjs)$/,
  /^tsconfig.*\.json$/,
  /^hermes\.dashboards\.json$/,
  /^hermes-dashboard\.json$/,
  /^\.hermes-dashboard\.json$/
];

const localOnlyPatterns = [
  /^\.env($|\.)/,
  /(^|\/)\.env($|\.)/,
  /^\.DS_Store$/,
  /(^|\/)\.DS_Store$/,
  /^\.codex\//,
  /^\.agents\//,
  /^\.cache\//,
  /^tmp-/,
  /^tmp\//,
  /^logs?\//,
  /\.log$/
];

const unsafePatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /^hermes_cli\/web_dist\//,
  /^web_dist\//,
  /^coverage\//,
  /secret/i,
  /token/i,
  /credential/i
];

function porcelainEntries(projectRoot) {
  const output = runGit(projectRoot, ["status", "--porcelain=v1", "-uall"]);
  return output.split("\n").filter(Boolean).map((line) => {
    const status = line.slice(0, 2);
    const rawPath = line.slice(2).trim();
    const filePath = rawPath.includes(" -> ") ? rawPath.split(" -> ").pop() : rawPath;
    return { status, path: filePath };
  });
}

function matches(patterns, filePath) {
  return patterns.some((pattern) => pattern.test(filePath));
}

function classifyFile(entry) {
  if (matches(unsafePatterns, entry.path)) {
    return {
      class: "unsafe",
      commitPolicy: "block",
      reason: "Potential build output, dependency tree, secret, token, or credential artifact."
    };
  }
  if (matches(localOnlyPatterns, entry.path)) {
    return {
      class: "local-only",
      commitPolicy: "exclude",
      reason: "Local machine or environment artifact; should not be committed."
    };
  }
  if (matches(screenshotProofPatterns, entry.path)) {
    return {
      class: "screenshot-proof",
      commitPolicy: "commit-if-referenced",
      reason: "Visual proof is commit-worthy only when referenced by a registry, report, or baseline contract."
    };
  }
  if (matches(generatedEvidencePatterns, entry.path)) {
    return {
      class: "generated-evidence",
      commitPolicy: "commit-with-generator",
      reason: "Generated governance/proof evidence; commit with its source or command evidence."
    };
  }
  if (matches(deployableSourcePatterns, entry.path)) {
    return {
      class: "deployable-source",
      commitPolicy: "commit-after-validation",
      reason: "Source, config, test, standard, or manifest change."
    };
  }
  return {
    class: "unknown",
    commitPolicy: "review",
    reason: "No release-readiness rule matched this path."
  };
}

function summarize(entries) {
  const counts = {};
  for (const entry of entries) {
    counts[entry.classification.class] = (counts[entry.classification.class] || 0) + 1;
  }
  return counts;
}

function commitIntent(counts, entries) {
  if (!entries.length) return "clean";
  const source = counts["deployable-source"] || 0;
  const evidence = counts["generated-evidence"] || 0;
  const screenshots = counts["screenshot-proof"] || 0;
  const local = counts["local-only"] || 0;
  const unsafe = counts.unsafe || 0;
  const unknown = counts.unknown || 0;
  if (unsafe || unknown) return "manual-review";
  const activeKinds = [
    source ? "source" : null,
    evidence ? "evidence" : null,
    screenshots ? "screenshots" : null,
    local ? "local" : null
  ].filter(Boolean);
  if (activeKinds.length > 1) return "mixed";
  if (source) return "source-change";
  if (evidence) return "generated-evidence";
  if (screenshots) return "proof-refresh";
  if (local) return "local-cleanup";
  return "manual-review";
}

function proofPolicy(counts) {
  const source = counts["deployable-source"] || 0;
  const screenshots = counts["screenshot-proof"] || 0;
  const evidence = counts["generated-evidence"] || 0;
  if (screenshots) return "screenshot-proof-present-commit-only-if-referenced";
  if (source && evidence) return "proof-or-generated-evidence-present-validate-before-ship";
  if (source) return "proof-required-for-ui-route-theme-or-dashboard-surface-changes";
  if (evidence) return "proof-not-required-for-generated-evidence-refresh";
  return "proof-not-required";
}

function cleanupActions(counts) {
  const actions = [];
  if (counts.unsafe) actions.push("remove-or-ignore-unsafe-artifacts-before-commit");
  if (counts.unknown) actions.push("review-unknown-files-or-add-release-readiness-rule");
  if (counts["local-only"]) actions.push("exclude-local-only-files-from-commit");
  if (counts["screenshot-proof"]) actions.push("commit-screenshots-only-when-registry-or-baseline-references-them");
  if (counts["generated-evidence"]) actions.push("commit-generated-evidence-with-generator-command-evidence");
  if (counts["deployable-source"]) actions.push("run-project-validation-before-commit");
  if (!actions.length) actions.push("no-cleanup-needed");
  return actions;
}

function projectRecommendation(entries) {
  const counts = summarize(entries);
  if (!entries.length) return "clean";
  if (counts.unsafe) return "blocked";
  if (counts.unknown) return "needs-review";
  if (counts["deployable-source"]) return "commit-after-validation";
  if (counts["generated-evidence"] || counts["screenshot-proof"]) return "commit-proof-refresh";
  if (counts["local-only"]) return "exclude-local-only";
  return "needs-review";
}

const projects = dashboardRegistry().map((dashboard) => {
  const projectRoot = resolveProjectPath(dashboard.projectPath);
  const entries = porcelainEntries(projectRoot).map((entry) => ({
    ...entry,
    classification: classifyFile(entry)
  }));
  const counts = summarize(entries);
  const recommendation = projectRecommendation(entries);
  return {
    id: dashboard.id,
    label: dashboard.label,
    projectPath: dashboard.projectPath,
    projectRoot: path.relative(root, projectRoot) || ".",
    productionUrl: dashboard.url,
    deployService: dashboard.deployment?.composeService ?? null,
    dirtyCount: entries.length,
    counts,
    commitIntent: commitIntent(counts, entries),
    proofPolicy: proofPolicy(counts),
    cleanupActions: cleanupActions(counts),
    recommendation,
    commitReady:
      ["clean", "commit-after-validation", "commit-proof-refresh"].includes(recommendation),
    deployReady:
      recommendation === "clean" || recommendation === "commit-after-validation",
    entries
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose:
    "Fleet release readiness classifier for deciding what can be committed, what must be excluded, and what blocks deployment.",
  rules: {
    deployableSource: "Commit after the project validation/build/proof commands pass.",
    generatedEvidence: "Commit when paired with the generator command or the source change that caused it.",
    screenshotProof: "Commit only when referenced by a proof registry, baseline matrix, or evidence ledger.",
    localOnly: "Exclude from commits; add ignore rules or move outside the repo if it keeps appearing.",
    unsafe: "Block commit/deploy until removed, ignored, or explicitly reclassified.",
    unknown: "Needs human or standards review; add a rule if it is a recurring legitimate artifact.",
    commitIntent:
      "Every dirty project is labeled clean, source-change, generated-evidence, proof-refresh, mixed, local-cleanup, or manual-review.",
    proofRetention:
      "Production proof screenshots and baselines are kept when referenced; one-off captures are excluded unless a registry or evidence ledger owns them."
  },
  totals: {
    projects: projects.length,
    dirtyProjects: projects.filter((project) => project.dirtyCount > 0).length,
    blockedProjects: projects.filter((project) => project.recommendation === "blocked").length,
    needsReviewProjects: projects.filter((project) => project.recommendation === "needs-review").length,
    commitReadyProjects: projects.filter((project) => project.commitReady).length,
    deployReadyProjects: projects.filter((project) => project.deployReady).length
  },
  projects
};

writeJson(outJson, report);
writeMarkdown(outMd, `# Fleet Release Readiness

Generated: ${report.generatedAt}

This report classifies dirty-tree changes before commit/deploy. It exists so Codex can move forward confidently without blindly committing proof artifacts, screenshots, local-only files, build outputs, or unknown files.

## Rules

- **Deployable source:** ${report.rules.deployableSource}
- **Generated evidence:** ${report.rules.generatedEvidence}
- **Screenshot proof:** ${report.rules.screenshotProof}
- **Local-only:** ${report.rules.localOnly}
- **Unsafe:** ${report.rules.unsafe}
- **Unknown:** ${report.rules.unknown}

## Project Summary

${markdownTable(
  ["Project", "Dirty", "Intent", "Recommendation", "Commit ready", "Deploy ready", "Source", "Generated", "Screenshots", "Local", "Unsafe", "Unknown"],
  projects.map((project) => [
    project.label,
    project.dirtyCount,
    project.commitIntent,
    project.recommendation,
    project.commitReady ? "yes" : "no",
    project.deployReady ? "yes" : "no",
    project.counts["deployable-source"] || 0,
    project.counts["generated-evidence"] || 0,
    project.counts["screenshot-proof"] || 0,
    project.counts["local-only"] || 0,
    project.counts.unsafe || 0,
    project.counts.unknown || 0
  ])
)}

## Cleanup Guidance

${markdownTable(
  ["Project", "Proof policy", "Cleanup actions"],
  projects.map((project) => [
    project.label,
    project.proofPolicy,
    project.cleanupActions.join("<br>")
  ])
)}

## Dirty File Classification

${projects
  .filter((project) => project.entries.length)
  .map((project) => `### ${project.label}

${markdownTable(
  ["Status", "Path", "Class", "Policy", "Reason"],
  project.entries.map((entry) => [
    entry.status,
    entry.path,
    entry.classification.class,
    entry.classification.commitPolicy,
    entry.classification.reason
  ])
)}
`)
  .join("\n")}
`);

const blockers = projects.filter((project) => ["blocked", "needs-review"].includes(project.recommendation));
console.log(`Wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
console.log(`Fleet release readiness: ${report.totals.dirtyProjects} dirty project(s), ${report.totals.blockedProjects} blocked, ${report.totals.needsReviewProjects} needs review.`);
if (strict && blockers.length) {
  for (const project of blockers) {
    console.log(`- ${project.recommendation}: ${project.label}`);
  }
  process.exit(1);
}
