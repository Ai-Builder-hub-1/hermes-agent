#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkProject } from './dashboard-ui-policy.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'hermes.dashboards.json'), 'utf8'));
const release = process.argv.includes('--release');
let failed = false;
for (const project of new Set(registry.dashboards.map(item => path.resolve(root, item.projectPath)))) {
  const result = checkProject(project, { release });
  // Run the project-owned acceptance command too: it retains backend boundary guards.
  const local = spawnSync('npm', ['run', 'dashboard:standard:check'], { cwd: project, encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
  if (local.status !== 0) result.errors.push(`Local standard failed: ${local.error?.message ?? local.stderr ?? ''} ${local.stdout ?? ''}`);
  console.log(JSON.stringify(result));
  failed ||= result.errors.length > 0;
}
if (failed) process.exitCode = 1;
