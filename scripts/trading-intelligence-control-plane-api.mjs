#!/usr/bin/env node
import http from 'node:http';

const DEFAULT_PORT = Number(process.env.TRADING_INTELLIGENCE_PORT ?? 8791);

export const DEFAULT_SOURCES = [
  {
    projectId: 'investing-system',
    label: 'Investing System',
    baseUrl: process.env.INVESTING_SYSTEM_API_BASE_URL ?? 'http://127.0.0.1:3102',
    authToken: process.env.INVESTING_SYSTEM_API_READ_TOKEN ?? process.env.INVESTING_SYSTEM_API_ADMIN_TOKEN ?? process.env.INVESTING_SYSTEM_API_TOKEN ?? '',
    adminToken: process.env.INVESTING_SYSTEM_API_ADMIN_TOKEN ?? process.env.INVESTING_SYSTEM_API_TOKEN ?? '',
    routes: {
      summary: '/trading-desk/command-center/summary',
      events: '/trading-desk/command-center/events',
      controls: '/trading-desk/command-center/controls',
      control: '/trading-desk/command-center/control',
    },
  },
  {
    projectId: 'khashi-vc',
    label: 'Khashi VC',
    baseUrl: process.env.KHASHI_VC_API_BASE_URL ?? 'http://127.0.0.1:3101',
    authToken: process.env.KHASHI_VC_API_READ_TOKEN ?? process.env.KHASHI_VC_API_ADMIN_TOKEN ?? process.env.KHASHI_VC_API_TOKEN ?? '',
    adminToken: process.env.KHASHI_VC_API_ADMIN_TOKEN ?? process.env.KHASHI_VC_API_TOKEN ?? '',
    routes: {
      summary: '/api/roc/trading-command-center/summary',
      events: '/api/roc/trading-command-center/events',
      controls: '/api/roc/trading-command-center/controls',
      control: '/api/roc/trading-command-center/control',
    },
  },
];

export function createTradingIntelligenceService(options = {}) {
  const fetchFn = options.fetchFn ?? globalThis.fetch;
  const sources = options.sources ?? DEFAULT_SOURCES;

  async function requestSource(source, route, { method = 'GET', token, body } = {}) {
    const url = new URL(route, ensureTrailingSlash(source.baseUrl));
    const headers = { accept: 'application/json' };
    const authToken = token ?? (method === 'GET' ? source.authToken : source.adminToken);
    if (authToken) headers.authorization = `Bearer ${authToken}`;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const startedAt = Date.now();
    try {
      const response = await fetchFn(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;
      return {
        ok: response.ok,
        status: response.status,
        latencyMs: Date.now() - startedAt,
        payload,
        error: response.ok ? null : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        latencyMs: Date.now() - startedAt,
        payload: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async function getProjectSummary(source) {
    const result = await requestSource(source, source.routes.summary);
    const summary = unwrapPayload(result.payload);
    return {
      projectId: source.projectId,
      label: source.label,
      sourceBaseUrl: source.baseUrl,
      available: result.ok,
      httpStatus: result.status,
      latencyMs: result.latencyMs,
      error: result.error,
      summary,
      status: result.ok ? normalizeProjectStatus(summary?.status) : 'unavailable',
      liveTradingLocked: result.ok ? summary?.liveTradingLocked !== false : true,
      kpis: result.ok ? summary?.kpis ?? {} : {},
      tabs: result.ok ? summary?.tabs ?? [] : [],
      blockers: result.ok ? asArray(summary?.blockers) : [`${source.label} command-center summary is unavailable: ${result.error}`],
      recommendations: result.ok ? asArray(summary?.recommendations) : [`Check ${source.label} API base URL, auth token, and service health.`],
      sourceRoutes: result.ok ? summary?.sourceRoutes ?? {} : source.routes,
    };
  }

  async function getSummary() {
    const generatedAt = new Date().toISOString();
    const projects = await Promise.all(sources.map(getProjectSummary));
    const blockers = projects.flatMap(project => project.blockers.map(blocker => `${project.label}: ${blocker}`));
    const recommendations = unique(projects.flatMap(project => project.recommendations.map(item => `${project.label}: ${item}`))).slice(0, 20);
    const status = fleetStatus(projects);
    return {
      id: 'trading-intelligence-control-plane-summary',
      title: 'Trading Intelligence Control Plane Summary',
      generatedAt,
      status,
      liveTradingLocked: projects.every(project => project.liveTradingLocked !== false),
      kpis: aggregateKpis(projects),
      projects,
      tabs: [
        { id: 'overview', label: 'Overview', status, projectIds: projects.map(project => project.projectId) },
        { id: 'investing-system', label: 'Investing System', status: projects.find(project => project.projectId === 'investing-system')?.status ?? 'unavailable', projectIds: ['investing-system'] },
        { id: 'khashi-vc', label: 'Khashi VC', status: projects.find(project => project.projectId === 'khashi-vc')?.status ?? 'unavailable', projectIds: ['khashi-vc'] },
        { id: 'pnl-risk', label: 'P/L and Risk', status: blockers.length ? 'watch' : 'ready', projectIds: projects.map(project => project.projectId) },
        { id: 'strategy-quality', label: 'Strategy Quality', status: blockers.length ? 'watch' : 'ready', projectIds: projects.map(project => project.projectId) },
        { id: 'events', label: 'Latest Events', status: 'ready', projectIds: projects.map(project => project.projectId) },
        { id: 'controls', label: 'Controls', status: 'ready', projectIds: projects.map(project => project.projectId) },
      ],
      blockers,
      recommendations,
      frontendContractVersion: '2026-09-08.v1',
    };
  }

  async function getEvents(limit = 10) {
    const boundedLimit = Math.max(1, Math.min(50, Number(limit) || 10));
    const results = await Promise.all(sources.map(async source => {
      const route = `${source.routes.events}?limit=${boundedLimit}`;
      const result = await requestSource(source, route);
      const payload = unwrapPayload(result.payload);
      const events = asArray(payload?.events).map(event => normalizeEvent(event, source));
      return result.ok
        ? events
        : [sourceUnavailableEvent(source, result.error)];
    }));
    return {
      id: 'trading-intelligence-control-plane-events',
      title: 'Trading Intelligence Control Plane Events',
      generatedAt: new Date().toISOString(),
      limit: boundedLimit,
      events: results.flat()
        .sort((left, right) => Date.parse(right.occurredAt ?? '') - Date.parse(left.occurredAt ?? ''))
        .slice(0, boundedLimit),
    };
  }

  async function getControls() {
    const results = await Promise.all(sources.map(async source => {
      const result = await requestSource(source, source.routes.controls);
      const payload = unwrapPayload(result.payload);
      const controls = asArray(payload?.controls).map(control => ({
        ...control,
        namespacedId: `${source.projectId}:${control.id}`,
        projectId: source.projectId,
        projectLabel: source.label,
      }));
      return {
        projectId: source.projectId,
        label: source.label,
        available: result.ok,
        error: result.error,
        controls,
        safety: payload?.safety ?? {},
      };
    }));
    return {
      id: 'trading-intelligence-control-plane-controls',
      title: 'Trading Intelligence Control Plane Controls',
      generatedAt: new Date().toISOString(),
      safety: {
        liveTradingLocked: true,
        submitLiveOrderAvailable: false,
        projectOwnedControlsOnly: true,
        note: 'Nous proxies explicit project-owned control requests; it does not submit trades.',
      },
      projects: results,
      controls: results.flatMap(result => result.controls),
    };
  }

  async function requestControl(input) {
    const action = String(input?.action ?? '');
    const explicitProjectId = typeof input?.projectId === 'string' ? input.projectId : null;
    const [projectId, localAction] = action.includes(':')
      ? action.split(':', 2)
      : [explicitProjectId, action];
    const source = sources.find(item => item.projectId === projectId);
    if (!source || !localAction) {
      return {
        id: 'trading-intelligence-control-plane-control',
        generatedAt: new Date().toISOString(),
        status: 'rejected',
        error: 'Unknown project or action. Use projectId plus action, or a namespaced action like investing-system:pause_oanda_runtime.',
        requested: input,
      };
    }
    const result = await requestSource(source, source.routes.control, {
      method: 'POST',
      body: {
        ...input,
        action: localAction,
        actorId: input?.actorId ?? 'nous-hermes-control-plane',
      },
    });
    return {
      id: 'trading-intelligence-control-plane-control',
      generatedAt: new Date().toISOString(),
      status: result.ok ? 'proxied' : 'failed',
      projectId: source.projectId,
      action: localAction,
      httpStatus: result.status,
      error: result.error,
      result: result.payload,
    };
  }

  return { getSummary, getEvents, getControls, requestControl };
}

export function createServer(service = createTradingIntelligenceService()) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (request.method === 'OPTIONS') return sendJson(response, 204, null);
    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        return sendJson(response, 200, { ok: true, service: 'trading-intelligence-control-plane', generatedAt: new Date().toISOString() });
      }
      if (request.method === 'GET' && url.pathname === '/api/trading-intelligence/summary') {
        return sendJson(response, 200, await service.getSummary());
      }
      if (request.method === 'GET' && url.pathname === '/api/trading-intelligence/events') {
        return sendJson(response, 200, await service.getEvents(url.searchParams.get('limit')));
      }
      if (request.method === 'GET' && url.pathname === '/api/trading-intelligence/controls') {
        return sendJson(response, 200, await service.getControls());
      }
      if (request.method === 'GET' && url.pathname === '/api/trading-intelligence/frontend-spec') {
        return sendJson(response, 200, frontendSpec());
      }
      if (request.method === 'POST' && url.pathname === '/api/trading-intelligence/control') {
        return sendJson(response, 200, await service.requestControl(await readJson(request)));
      }
      return sendJson(response, 404, { error: 'not found' });
    } catch (error) {
      return sendJson(response, 500, { error: error instanceof Error ? error.message : 'internal error' });
    }
  });
}

export function frontendSpec() {
  return {
    name: 'Trading Intelligence Control Plane',
    version: '2026-09-08.v1',
    basePath: '/api/trading-intelligence',
    endpoints: [
      { method: 'GET', path: '/summary', purpose: 'Fleet-level project status, KPI rollup, tabs, blockers, recommendations.' },
      { method: 'GET', path: '/events?limit=10', purpose: 'Merged latest events from Investing System and Khashi VC.' },
      { method: 'GET', path: '/controls', purpose: 'Namespaced project control catalog.' },
      { method: 'POST', path: '/control', purpose: 'Proxy a project-owned control request. Use dry-run/preview first.' },
    ],
    uiSections: ['overview', 'project cards', 'pnl and risk', 'strategy quality', 'latest events', 'controls'],
  };
}

function aggregateKpis(projects) {
  return {
    projectsAvailable: projects.filter(project => project.available).length,
    projectsTotal: projects.length,
    openTrades: sum(projects.map(project => project.kpis.openTrades)),
    closedTrades: sum(projects.map(project => project.kpis.closedTrades ?? project.kpis.reviewedTrades)),
    realizedPnlUsd: sum(projects.map(project => project.kpis.realizedPnlUsd ?? project.kpis.realizedPnlToday ?? project.kpis.strategyGrossPnl)),
    openRiskUsd: sum(projects.map(project => project.kpis.openRiskUsd)),
    liveMarkets: sum(projects.map(project => project.kpis.liveMarkets)),
    strategyCandidates: sum(projects.map(project => project.kpis.paperCandidates)),
    liveTradingLocked: projects.every(project => project.liveTradingLocked !== false),
    blockers: projects.reduce((total, project) => total + project.blockers.length, 0),
  };
}

function fleetStatus(projects) {
  if (projects.some(project => !project.available || project.status === 'blocked' || project.status === 'unavailable')) return 'blocked';
  if (projects.some(project => project.status === 'watch' || project.status === 'partial' || project.status === 'degraded')) return 'watch';
  return 'ready';
}

function normalizeEvent(event, source) {
  return {
    id: String(event?.id ?? `${source.projectId}-event-${Date.now()}`),
    sourceProject: String(event?.sourceProject ?? source.projectId),
    sourceSystem: String(event?.sourceSystem ?? source.projectId),
    stream: String(event?.stream ?? event?.type ?? 'event'),
    type: String(event?.type ?? event?.stream ?? 'event'),
    status: String(event?.status ?? 'info'),
    severity: String(event?.severity ?? 'info'),
    title: String(event?.title ?? event?.type ?? 'Event'),
    occurredAt: normalizeDate(event?.occurredAt),
    instrument: event?.instrument ?? null,
    summary: String(event?.summary ?? ''),
    links: event?.links ?? {},
    rawRef: event?.rawRef ?? {},
  };
}

function sourceUnavailableEvent(source, error) {
  return {
    id: `${source.projectId}-unavailable-${Date.now()}`,
    sourceProject: source.projectId,
    sourceSystem: 'nous-hermes-agent',
    stream: 'source-health',
    type: 'source_unavailable',
    status: 'blocked',
    severity: 'error',
    title: `${source.label} unavailable`,
    occurredAt: new Date().toISOString(),
    instrument: null,
    summary: error ?? 'Source command-center endpoint did not respond.',
    links: { summary: source.routes.summary },
    rawRef: { baseUrl: source.baseUrl },
  };
}

function unwrapPayload(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function normalizeProjectStatus(status) {
  if (!status) return 'unknown';
  if (/blocked|locked|critical|fail/i.test(String(status))) return 'blocked';
  if (/watch|partial|degraded|collecting|stale/i.test(String(status))) return 'watch';
  if (/ready|healthy|reporting|pass/i.test(String(status))) return 'ready';
  return String(status);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sum(values) {
  const numbers = values.filter(value => typeof value === 'number' && Number.isFinite(value));
  return numbers.length ? Number(numbers.reduce((total, value) => total + value, 0).toFixed(2)) : null;
}

function unique(values) {
  return [...new Set(values.filter(value => typeof value === 'string' && value.trim()))];
}

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  return new Date().toISOString();
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': process.env.TRADING_INTELLIGENCE_CORS_ORIGIN ?? '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type',
    'cache-control': 'no-store',
  });
  response.end(payload === null ? '' : JSON.stringify(payload, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(DEFAULT_PORT, '0.0.0.0', () => {
    process.stdout.write(`Trading Intelligence Control Plane API listening on ${DEFAULT_PORT}\n`);
  });
}
