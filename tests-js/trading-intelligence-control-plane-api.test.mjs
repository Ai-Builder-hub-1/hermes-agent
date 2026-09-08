import test from 'node:test';
import assert from 'node:assert/strict';
import { createTradingIntelligenceService, frontendSpec } from '../scripts/trading-intelligence-control-plane-api.mjs';

const sources = [
  {
    projectId: 'investing-system',
    label: 'Investing System',
    baseUrl: 'http://investing.local',
    authToken: 'read',
    adminToken: 'admin',
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
    baseUrl: 'http://khashi.local',
    authToken: 'read',
    adminToken: 'admin',
    routes: {
      summary: '/api/roc/trading-command-center/summary',
      events: '/api/roc/trading-command-center/events',
      controls: '/api/roc/trading-command-center/controls',
      control: '/api/roc/trading-command-center/control',
    },
  },
];

test('aggregates source summaries into a fleet-level backend contract', async () => {
  const fetchCalls = [];
  const service = createTradingIntelligenceService({
    sources,
    fetchFn: async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      if (String(url).includes('investing.local') && String(url).includes('/summary')) {
        return jsonResponse({
          projectId: 'investing-system',
          status: 'watch',
          liveTradingLocked: true,
          kpis: { openTrades: 1, realizedPnlToday: 2.25, reviewedTrades: 4 },
          tabs: [{ id: 'oanda', label: 'OANDA', status: 'watch' }],
          blockers: ['runtime stale'],
          recommendations: ['restart runtime'],
          sourceRoutes: { events: '/trading-desk/command-center/events' },
        });
      }
      if (String(url).includes('khashi.local') && String(url).includes('/summary')) {
        return jsonResponse({
          data: {
            projectId: 'khashi-vc',
            status: 'ready',
            liveTradingLocked: true,
            kpis: { openTrades: 2, closedTrades: 3, realizedPnlUsd: 1.5, paperCandidates: 5 },
            tabs: [{ id: 'paper', label: 'Paper', status: 'ready' }],
            blockers: [],
            recommendations: ['review paper'],
            sourceRoutes: { events: '/api/roc/trading-command-center/events' },
          },
        });
      }
      return jsonResponse({});
    },
  });

  const summary = await service.getSummary();

  assert.equal(summary.status, 'watch');
  assert.equal(summary.liveTradingLocked, true);
  assert.equal(summary.kpis.projectsAvailable, 2);
  assert.equal(summary.kpis.openTrades, 3);
  assert.equal(summary.kpis.closedTrades, 7);
  assert.equal(summary.kpis.realizedPnlUsd, 3.75);
  assert.equal(summary.kpis.strategyCandidates, 5);
  assert.equal(summary.projects[0].projectId, 'investing-system');
  assert.ok(summary.tabs.some(tab => tab.id === 'controls'));
  assert.ok(summary.blockers.some(blocker => blocker.includes('runtime stale')));
  assert.equal(fetchCalls[0].init.headers.authorization, 'Bearer read');
});

test('merges source events and preserves project attribution', async () => {
  const service = createTradingIntelligenceService({
    sources,
    fetchFn: async (url) => {
      if (String(url).includes('investing.local')) {
        return jsonResponse({
          events: [{
            id: 'inv-1',
            sourceProject: 'investing-system',
            type: 'practice-execution',
            status: 'accepted',
            occurredAt: '2026-01-01T00:00:00.000Z',
            title: 'OANDA accepted',
            summary: 'Accepted practice trade.',
          }],
        });
      }
      return jsonResponse({
        data: {
          events: [{
            id: 'kha-1',
            sourceProject: 'khashi-vc',
            type: 'paper_trade_closed',
            status: 'filled',
            occurredAt: '2026-01-02T00:00:00.000Z',
            title: 'Khashi closed',
            summary: 'Closed paper trade.',
          }],
        },
      });
    },
  });

  const events = await service.getEvents(10);

  assert.equal(events.events.length, 2);
  assert.equal(events.events[0].id, 'kha-1');
  assert.equal(events.events[0].sourceProject, 'khashi-vc');
  assert.equal(events.events[1].sourceProject, 'investing-system');
});

test('namespaces controls and proxies project-owned control requests', async () => {
  const fetchCalls = [];
  const service = createTradingIntelligenceService({
    sources,
    fetchFn: async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      if (String(url).includes('/controls')) {
        return jsonResponse({
          data: {
            controls: [{ id: 'pause_collection', label: 'Pause Collection' }],
            safety: { liveTradingLocked: true },
          },
        });
      }
      return jsonResponse({ data: { status: 'recorded', action: 'pause_collection' } });
    },
  });

  const controls = await service.getControls();
  const proxied = await service.requestControl({
    action: 'khashi-vc:pause_collection',
    execute: true,
    reason: 'test',
  });

  assert.equal(controls.controls.some(control => control.namespacedId === 'khashi-vc:pause_collection'), true);
  assert.equal(proxied.status, 'proxied');
  assert.equal(proxied.projectId, 'khashi-vc');
  assert.equal(proxied.action, 'pause_collection');
  const postCall = fetchCalls.find(call => call.init.method === 'POST');
  assert.equal(postCall.init.headers.authorization, 'Bearer admin');
  assert.deepEqual(JSON.parse(postCall.init.body), {
    action: 'pause_collection',
    execute: true,
    reason: 'test',
    actorId: 'nous-hermes-control-plane',
  });
});

test('reports unavailable source as a blocked event and degraded project', async () => {
  const service = createTradingIntelligenceService({
    sources,
    fetchFn: async (url) => {
      if (String(url).includes('investing.local')) throw new Error('connection refused');
      return jsonResponse({ data: { projectId: 'khashi-vc', status: 'ready', liveTradingLocked: true, kpis: {}, blockers: [], recommendations: [] } });
    },
  });

  const summary = await service.getSummary();
  const events = await service.getEvents(10);

  assert.equal(summary.status, 'blocked');
  assert.equal(summary.projects.find(project => project.projectId === 'investing-system').available, false);
  assert.equal(events.events.some(event => event.type === 'source_unavailable'), true);
});

test('publishes a frontend spec endpoint contract', () => {
  const spec = frontendSpec();

  assert.equal(spec.name, 'Trading Intelligence Control Plane');
  assert.ok(spec.endpoints.some(endpoint => endpoint.path === '/summary'));
  assert.ok(spec.uiSections.includes('controls'));
});

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
