#!/usr/bin/env node
import path from 'node:path';
import { checkProject } from './dashboard-ui-policy.mjs';
const args = process.argv.slice(2);
const at = args.indexOf('--project-dir');
const root = at < 0 ? process.cwd() : path.resolve(args[at + 1]);
const result = checkProject(root, { release: args.includes('--release') });
console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;
