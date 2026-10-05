#!/usr/bin/env node
import fs from 'node:fs';
import { checkProject, projectOwnsVisuals } from './dashboard-ui-policy.mjs';
const manifest = JSON.parse(fs.readFileSync('.hermes-dashboard.json', 'utf8'));
if (!projectOwnsVisuals(manifest)) {
  await import('./check-dashboard-platform-hdk-standard.mjs');
} else {
  const result = checkProject(process.cwd());
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
