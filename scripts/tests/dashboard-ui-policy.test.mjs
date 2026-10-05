import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { checkProject, validateUiPolicy, validateReleaseEvidence, isPrototypePath, RELEASE_CHECKS } from '../dashboard-ui-policy.mjs';

const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function write(root, relative, value) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-policy-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const manifest = {
    projectId: 'custom-app',
    uiPolicy: { version: 1, visualOwnership: 'project', prototypeRoots: ['prototypes'], sharedAssetSync: 'manual', releaseEvidence: 'docs/design/ui-release-evidence.json' },
    // Deliberately no HDK dependency, native markers, fixed layout or CSS tokens.
    dashboardKit: { targetExperienceTier: 3 },
    surfaces: [{ id: 'main', path: 'src/custom.html' }],
    proof: { captureScript: 'scripts/proof.mjs' }
  };
  const registry = { dashboards: [{ id: 'custom-app.main', owner: 'Product team', url: '/', healthUrl: '/health', proofUrl: '/proof' }] };
  const platform = { schemaVersion: 1, status: 'active', projectId: 'custom-app', productionUrl: 'https://example.test', dataStates: ['loading', 'empty', 'partial', 'stale', 'error', 'ready'], proofStates: ['overflow-scan', 'primary-workflow', 'production-proof'], pages: ['main'], workflowActions: ['inspect'] };
  const persist = () => {
    write(root, '.hermes-dashboard.json', manifest);
    write(root, 'hermes.dashboards.json', registry);
    write(root, '.hermes-dashboard-platform.json', platform);
  };
  persist();
  write(root, 'scripts/proof.mjs', '// Project proof tooling\n');
  write(root, 'src/custom.html', '<html><body><nav>Custom navigation</nav></body></html>');
  write(root, 'src/design.css', '.card { padding: 13px; }\n:root { --accent: red; }');
  return { root, manifest, registry, platform, persist };
}
function run(script, root, args = []) {
  return spawnSync(process.execPath, [path.join(scripts, script), ...args], { cwd: root, encoding: 'utf8' });
}
function evidence(revision = 'source-revision') {
  return { schemaVersion: 1, projectId: 'custom-app', revision, generatedAt: new Date().toISOString(), stage: 'production-candidate', reviewedBy: 'Operator', checks: Object.fromEntries(RELEASE_CHECKS.map(name => [name, { status: 'passed', artifact: `docs/design/ui-proof/${name}.txt` }])), screenshots: { desktop: 'docs/design/ui-proof/desktop.png', mobile: 'docs/design/ui-proof/mobile.png' } };
}

test('custom frontend without HDK passes admission, never production certification', t => {
  const { root } = fixture(t);
  const result = checkProject(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.productionReady, false);
  assert.equal(run('enforce-dashboard-creation-gate.mjs', root, ['--project-dir', root]).status, 0);
});
test('missing workflow/data state/proof route still blocks admission', t => {
  const f = fixture(t);
  f.platform.dataStates = f.platform.dataStates.filter(x => x !== 'stale');
  f.platform.workflowActions = [];
  f.registry.dashboards[0].proofUrl = '';
  f.persist();
  const errors = checkProject(f.root).errors.join('\n');
  assert.match(errors, /Missing data state: stale/);
  assert.match(errors, /workflowActions/);
  assert.match(errors, /proofUrl/);
});
test('malformed or missing policy fails admission instead of granting an exemption', t => {
  const f = fixture(t); delete f.manifest.uiPolicy; f.persist();
  assert.ok(checkProject(f.root).errors.length);
});
test('prototype roots cannot cover production app directories or escape the project', t => {
  const f = fixture(t);
  for (const root of ['.', 'public', 'src', '../elsewhere', '/tmp', 'prototypes/../../public']) {
    f.manifest.uiPolicy.prototypeRoots = [root];
    assert.ok(validateUiPolicy(f.manifest, f.registry, f.platform).length, root);
  }
});
test('production routes and surfaces cannot promote a prototype implicitly', t => {
  const f = fixture(t);
  f.registry.dashboards[0].url = '/%70rototypes/new';
  f.manifest.surfaces[0].path = 'prototypes/new/main.html';
  const errors = validateUiPolicy(f.manifest, f.registry, f.platform).join('\n');
  assert.match(errors, /Production surface/);
  assert.match(errors, /must not point to a prototype/);
});
test('prototype path matching is directory bounded', t => {
  const f = fixture(t);
  assert.equal(isPrototypePath('prototypes/a/style.css', f.manifest), true);
  assert.equal(isPrototypePath('prototypes-production/style.css', f.manifest), false);
});
test('custom production styles are advisory; legacy styles remain strict', t => {
  const f = fixture(t);
  let result = run('scan-dashboard-local-overrides.mjs', f.root, ['--project-dir', f.root, '--strict', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(JSON.parse(result.stdout).results[0].issues.length);
  delete f.manifest.uiPolicy; f.persist();
  result = run('scan-dashboard-local-overrides.mjs', f.root, ['--project-dir', f.root, '--strict', '--json']);
  assert.equal(result.status, 1);
});
test('CSS explicitly referenced by a dev-only prototype is excluded consistently', t => {
  const f = fixture(t);
  f.manifest.surfaces = [{ id: 'preview', path: 'prototypes/demo.css', shellModel: 'standalone-dev-only' }];
  write(f.root, 'prototypes/demo.css', '.sidebar { color: red; }');
  fs.rmSync(path.join(f.root, 'src/design.css')); f.persist();
  const result = run('scan-dashboard-local-overrides.mjs', f.root, ['--project-dir', f.root, '--strict', '--json']);
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout).results[0].issues, []);
});
test('expired visual exceptions do not exempt a legacy project', t => {
  const f = fixture(t); delete f.manifest.uiPolicy;
  f.manifest.exceptions = [{ type: 'local-visual-override', path: 'src/design.css', selector: '*', token: '*', expiresAt: '2020-01-01' }]; f.persist();
  assert.equal(run('scan-dashboard-local-overrides.mjs', f.root, ['--project-dir', f.root, '--strict']).status, 1);
});
test('missing, failed, stale, prototype or wrong-revision release evidence is rejected', () => {
  const context = { projectId: 'custom-app', revision: 'source-revision', artifactExists: () => true };
  assert.deepEqual(validateReleaseEvidence(evidence(), context), []);
  for (const change of [
    x => { x.checks.authentication.status = 'failed'; },
    x => { delete x.checks['api-contracts']; },
    x => { x.generatedAt = '2020-01-01'; },
    x => { x.generatedAt = '2099-01-01'; },
    x => { x.stage = 'prototype'; },
    x => { x.revision = 'older-revision'; },
    x => { delete x.screenshots.mobile; },
    x => { x.checks.workflows.artifact = '../external'; },
    x => { x.reviewedBy = ''; }
  ]) {
    const value = evidence(); change(value);
    assert.ok(validateReleaseEvidence(value, context).length);
  }
  assert.ok(validateReleaseEvidence(evidence(), { ...context, artifactExists: () => false }).length);
});
test('release evidence can be committed after source; dirty source still blocks', t => {
  const f = fixture(t);
  const git = (...args) => execFileSync('git', args, { cwd: f.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init'); git('config', 'user.name', 'Policy test'); git('config', 'user.email', 'test@example.invalid');
  git('add', '.'); git('commit', '-m', 'Source under test');
  const revision = git('rev-parse', 'HEAD');
  assert.ok(checkProject(f.root, { release: true }).errors.length);
  const proof = evidence(revision);
  for (const check of Object.values(proof.checks)) write(f.root, check.artifact, 'Test fixture proof artifact');
  for (const screenshot of Object.values(proof.screenshots)) write(f.root, screenshot, 'Test fixture screenshot');
  write(f.root, f.manifest.uiPolicy.releaseEvidence, proof);
  assert.equal(checkProject(f.root, { release: true }).productionReady, true);
  git('add', '.'); git('commit', '-m', 'Reviewed evidence only');
  assert.equal(checkProject(f.root, { release: true }).productionReady, true);
  write(f.root, 'src/design.css', '.card { padding: 22px; }');
  assert.equal(checkProject(f.root, { release: true }).productionReady, false);
});
test('shared asset sync skips project-owned files unless individually authorized', t => {
  const f = fixture(t);
  const hub = path.join(f.root, 'hub');
  const target = path.join(f.root, 'project');
  write(target, '.hermes-dashboard.json', f.manifest);
  write(target, 'vendor/hermes-dashboard-kit/src/index.js', 'local code');
  write(target, 'vendor/hermes-dashboard-kit/static/hermes-dashboard-kit.css', 'local design');
  write(hub, 'packages/hermes-dashboard-kit/src/index.js', 'shared code');
  write(hub, 'packages/hermes-dashboard-kit/static/hermes-dashboard-kit.css', 'shared design');
  write(hub, 'packages/hermes-dashboard-kit/adoption/registry.json', { projects: [{ id: 'custom-app', path: '../project' }] });
  fs.mkdirSync(path.join(hub, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(scripts, 'sync-dashboard-kit-vendor.mjs'), path.join(hub, 'scripts/sync-dashboard-kit-vendor.mjs'));
  const invoke = args => spawnSync(process.execPath, ['scripts/sync-dashboard-kit-vendor.mjs', ...args], { cwd: hub, encoding: 'utf8' });
  assert.equal(invoke([]).status, 0);
  assert.equal(fs.readFileSync(path.join(target, 'vendor/hermes-dashboard-kit/src/index.js'), 'utf8'), 'local code');
  assert.equal(invoke(['--project', 'custom-app', '--apply-visual-sync', '--dry-run']).status, 0);
  assert.equal(fs.readFileSync(path.join(target, 'vendor/hermes-dashboard-kit/src/index.js'), 'utf8'), 'local code');
  assert.equal(invoke(['--project', 'custom-app', '--apply-visual-sync']).status, 0);
  assert.equal(fs.readFileSync(path.join(target, 'vendor/hermes-dashboard-kit/src/index.js'), 'utf8'), 'shared code');
});

test('custom tokens are allowed while shared library source remains strict', t => {
  const f = fixture(t);
  write(f.root, 'docs/design/dashboard-token-enforcement.json', { forbiddenPatterns: [{ id: 'hard-coded-color', pattern: '#[a-fA-F0-9]{6}', scope: ['src', 'packages/hermes-dashboard-kit'] }] });
  write(f.root, 'src/brand.css', '.brand { color: #abcdef; }');
  assert.equal(run('scan-dashboard-tokens.mjs', f.root, ['--strict', '--all']).status, 0);
  write(f.root, 'packages/hermes-dashboard-kit/src/component.css', '.kit { color: #abcdef; }');
  assert.equal(run('scan-dashboard-tokens.mjs', f.root, ['--strict', '--all']).status, 1);
});
