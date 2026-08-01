import fs from 'node:fs';
import path from 'node:path';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function appendFile(filePath, lines) {
  if (!filePath) return;
  fs.appendFileSync(filePath, `${lines.join('\n')}\n`);
}

function normalizeBaseDomain(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

function normalizePath(value) {
  const pathValue = String(value || '/').trim() || '/';
  return pathValue.startsWith('/') ? pathValue : `/${pathValue}`;
}

function resolveDomain(template, baseDomain) {
  const domain = String(template || '').trim();
  if (!domain) return '';
  return domain
    .replaceAll('${HERMES_PRODUCTION_BASE_DOMAIN}', baseDomain)
    .replaceAll('${PRODUCTION_BASE_DOMAIN}', baseDomain)
    .replaceAll('$HERMES_PRODUCTION_BASE_DOMAIN', baseDomain)
    .replaceAll('$PRODUCTION_BASE_DOMAIN', baseDomain);
}

const service = String(process.env.HERMES_SERVICE_KEY || process.env.DEPLOY_SERVICE || 'nous-hermes-agent').trim();
const explicitUrl = String(process.env.PRODUCTION_URL || '').trim();
const protocol = String(process.env.PRODUCTION_PROTOCOL || 'https').replace(/:$/, '');
const registryPath = path.resolve(process.env.PRODUCTION_TARGETS_PATH || 'hermes.production-targets.json');
let target;

if (fs.existsSync(registryPath)) {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  target = (registry.targets || []).find((entry) => entry.service === service);
}

let productionUrl = explicitUrl.replace(/\/+$/, '');
let healthPath = normalizePath(process.env.PRODUCTION_HEALTH_PATH || target?.healthPath || '');

if (!productionUrl) {
  const baseDomain = normalizeBaseDomain(
    process.env.PRODUCTION_BASE_DOMAIN || process.env.HERMES_PRODUCTION_BASE_DOMAIN,
  );
  if (!baseDomain) {
    fail('PRODUCTION_URL or PRODUCTION_BASE_DOMAIN must be set so the production URL can be resolved.');
  }
  if (!fs.existsSync(registryPath)) {
    fail(`Production target registry not found: ${registryPath}`);
  }

  if (!target) {
    fail(`No production target found for service "${service}" in ${registryPath}`);
  }

  const domain = resolveDomain(target.domain, baseDomain);
  if (!domain) {
    fail(`Production target "${service}" does not define a public domain.`);
  }

  productionUrl = `${protocol}://${domain}`.replace(/\/+$/, '');
  healthPath = normalizePath(process.env.PRODUCTION_HEALTH_PATH || target.healthPath || '/');
}

const healthUrl = `${productionUrl}${healthPath}`;

appendFile(process.env.GITHUB_ENV, [
  `HERMES_SERVICE_KEY=${service}`,
  `PRODUCTION_URL=${productionUrl}`,
  `PRODUCTION_HEALTH_PATH=${healthPath}`,
  `PRODUCTION_HEALTH_URL=${healthUrl}`,
]);

appendFile(process.env.GITHUB_OUTPUT, [
  `service=${service}`,
  `production_url=${productionUrl}`,
  `health_path=${healthPath}`,
  `health_url=${healthUrl}`,
]);

console.log(`Resolved ${service} production URL: ${productionUrl}`);
console.log(`Resolved ${service} health URL: ${healthUrl}`);
