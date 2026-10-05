// Canonical source: Nous Hermes scripts/dashboard-ui-policy.mjs.
// Project copies keep CI independent of sibling checkouts and the optional HDK package.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const DATA_STATES = ['loading', 'empty', 'partial', 'stale', 'error', 'ready'];
export const RELEASE_CHECKS = ['build', 'authentication', 'api-contracts', 'workflows', 'accessibility', 'responsive-layout', 'data-states', 'prototype-isolation', 'production-proof'];
export function projectOwnsVisuals(manifest) {
  return manifest.uiPolicy?.version === 1 && manifest.uiPolicy.visualOwnership === 'project';
}
export function safeRelative(value) {
  return typeof value === 'string' && value.length > 0 && !path.isAbsolute(value) &&
    !value.includes('\\') && value.split('/').every(part => part && part !== '.' && part !== '..');
}
export function isPrototypePath(relative, manifest) {
  const normalized = relative.split(path.sep).join('/');
  return (manifest.uiPolicy?.prototypeRoots ?? []).some(root =>
    safeRelative(root) && (normalized === root || normalized.startsWith(`${root}/`)));
}
export function validateUiPolicy(manifest, registry, platform) {
  const errors = [];
  const policy = manifest.uiPolicy;
  if (!projectOwnsVisuals(manifest)) errors.push('uiPolicy must declare version 1 and visualOwnership=project.');
  if (policy?.sharedAssetSync !== 'manual') errors.push('Shared visual assets must use manual synchronization.');
  if (!Array.isArray(policy?.prototypeRoots)) errors.push('prototypeRoots must be an array.');
  for (const root of policy?.prototypeRoots ?? []) {
    // A prototype folder must not be an existing application/static asset root.
    if (!safeRelative(root) || !['prototypes', 'design-prototypes'].includes(root.split('/')[0])) {
      errors.push(`Prototype root must be inside prototypes/ or design-prototypes/: ${root}`);
    }
    for (const surface of manifest.surfaces ?? []) {
      if (surface.path && isPrototypePath(surface.path, { uiPolicy: { prototypeRoots: [root] } }) && surface.shellModel !== 'standalone-dev-only') {
        errors.push(`Production surface ${surface.id} cannot point into prototype root ${root}.`);
      }
    }
  }
  if (!safeRelative(policy?.releaseEvidence)) errors.push('releaseEvidence must be a project-relative file.');
  if (!manifest.projectId) errors.push('A projectId is required.');
  if (!Array.isArray(registry.dashboards) || !registry.dashboards.length) errors.push('Dashboard route registry is required.');
  for (const dashboard of registry.dashboards ?? []) {
    for (const field of ['id', 'owner', 'url', 'proofUrl', 'healthUrl']) {
      if (typeof dashboard[field] !== 'string' || !dashboard[field].trim()) errors.push(`Dashboard ${dashboard.id ?? '?'} requires ${field}.`);
    }
    for (const field of ['url', 'proofUrl', 'healthUrl']) {
      try {
        if (!/^(https?:\/\/|\/(?!\/))/.test(dashboard[field])) throw new Error('Invalid route');
        const url = new URL(dashboard[field], platform.productionUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
        if (url.pathname.split('/').some(segment => ['prototypes', 'design-prototypes'].includes(decodeURIComponent(segment)))) {
          errors.push(`Production ${field} must not point to a prototype: ${dashboard[field]}`);
        }
      } catch { errors.push(`Dashboard ${dashboard.id ?? '?'} has an invalid ${field}.`); }
    }
  }
  if (platform.schemaVersion !== 1 || platform.status !== 'active' || platform.projectId !== manifest.projectId) errors.push('Active platform metadata must match the project.');
  for (const state of DATA_STATES) if (!platform.dataStates?.includes(state)) errors.push(`Missing data state: ${state}`);
  for (const state of ['overflow-scan', 'primary-workflow', 'production-proof']) if (!platform.proofStates?.includes(state)) errors.push(`Missing proof state: ${state}`);
  for (const field of ['pages', 'workflowActions']) if (!Array.isArray(platform[field]) || !platform[field].length) errors.push(`Platform ${field} must be declared.`);
  if (!manifest.proof?.captureScript) errors.push('A production proof capture script is required.');
  return errors;
}
export function validateReleaseEvidence(evidence, { projectId, revision, now = Date.now(), artifactExists }) {
  const errors = [];
  if (evidence.schemaVersion !== 1 || evidence.projectId !== projectId) errors.push('Release evidence must match this project and schema version 1.');
  if (!revision || evidence.revision !== revision) errors.push('Release evidence must match the current Git revision.');
  const generatedAt = Date.parse(evidence.generatedAt);
  if (!Number.isFinite(generatedAt) || generatedAt > now || now - generatedAt > 7 * 86400000) errors.push('Release evidence must be from the last seven days, not the future.');
  if (evidence.stage !== 'production-candidate') errors.push('Prototype evidence cannot certify a production candidate.');
  if (typeof evidence.reviewedBy !== 'string' || !evidence.reviewedBy.trim()) errors.push('Production evidence requires a named reviewer.');
  for (const check of RELEASE_CHECKS) {
    const result = evidence.checks?.[check];
    if (result?.status !== 'passed' || !safeRelative(result?.artifact) || !artifactExists(result.artifact)) errors.push(`Missing passing evidence artifact: ${check}`);
  }
  for (const viewport of ['desktop', 'mobile']) {
    const artifact = evidence.screenshots?.[viewport];
    if (!safeRelative(artifact) || !artifactExists(artifact)) errors.push(`Missing ${viewport} screenshot evidence.`);
  }
  return errors;
}
export function checkProject(root, { release = false } = {}) {
  const errors = [];
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  let manifest;
  try {
    manifest = read('.hermes-dashboard.json');
    const registry = read('hermes.dashboards.json');
    const platform = read('.hermes-dashboard-platform.json');
    errors.push(...validateUiPolicy(manifest, registry, platform));
    for (const prototypeRoot of manifest.uiPolicy?.prototypeRoots ?? []) {
      const folder = path.join(root, prototypeRoot);
      if (fs.existsSync(folder) && fs.realpathSync(folder) !== path.resolve(folder)) errors.push(`Prototype root cannot be a symbolic link: ${prototypeRoot}`);
    }
    const capture = manifest.proof?.captureScript;
    if (!safeRelative(capture) || !fs.existsSync(path.join(root, capture))) errors.push('Proof capture script is missing.');
    if (release && errors.length === 0) {
      const evidencePath = manifest.uiPolicy.releaseEvidence;
      const sourcePaths = ['.', `:(exclude)${evidencePath}`, ':(exclude)docs/design/ui-proof/**'];
      const revision = execFileSync('git', ['log', '-1', '--format=%H', '--', ...sourcePaths], { cwd: root, encoding: 'utf8' }).trim();
      // Evidence files may be produced after the source commit. Source changes may not.
      const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', ...sourcePaths], { cwd: root, encoding: 'utf8' }).trim();
      if (status) errors.push('Commit and review source changes before production certification.');
      const artifactExists = relative => {
        if (!safeRelative(relative)) return false;
        const file = path.join(root, relative);
        if (!fs.existsSync(file)) return false;
        const resolved = fs.realpathSync(file);
        const rel = path.relative(fs.realpathSync(root), resolved);
        return safeRelative(rel) && fs.statSync(file).isFile() && fs.statSync(file).size > 0;
      };
      errors.push(...validateReleaseEvidence(read(evidencePath), { projectId: manifest.projectId, revision, artifactExists }));
    }
  } catch (error) { errors.push(error.message); }
  return { projectId: manifest?.projectId ?? path.basename(root), mode: release ? 'production-evidence' : 'admission', visualOwnership: manifest?.uiPolicy?.visualOwnership, errors, productionReady: release && errors.length === 0 };
}
