/**
 * Serve the built dashboard with stubbed trading-intelligence endpoints so the
 * real page can be rendered and screenshotted. Query params pick the scenario:
 *   ?ti=ready | degraded | empty | error
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Serve the built SPA. Build first: (cd web && npm run build)
const DIST = process.env.TI_DIST ?? new URL('../../../../hermes_cli/web_dist', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

const iso = (m) => new Date(Date.now() - m * 60000).toISOString();

const investing = {
  projectId: 'investing-system', label: 'Investing System', sourceBaseUrl: 'http://investing-system:3102',
  available: true, httpStatus: 200, latencyMs: 214, error: null, status: 'watch', liveTradingLocked: true,
  kpis: { runtimeRunning: true, runtimeStale: false, openTrades: 3, openOrders: 1, unprotectedOpenTrades: 0,
    realizedPnlToday: 0, strategyGrossPnl: -412.5, reviewedTrades: 0, usableLearningTrades: 4,
    learningProgressPct: 26.7, latestTradeExplanationReady: true },
  tabs: [{ id: 'oanda', label: 'OANDA', status: 'watch' }],
  blockers: ['Broker lifecycle sync has 2 exits submitted but not broker-confirmed.',
             'Learning sample is below the minimum usable trade count; strategy scoring is not yet trustworthy.'],
  recommendations: ['Run broker lifecycle sync and reconcile submitted exits before treating exit automation as healthy.',
                    'Collect closed broker trades before judging strategy quality.'],
  sourceRoutes: { events: '/trading-desk/command-center/events' }, summary: { mode: 'practice' },
};
const khashi = {
  projectId: 'khashi-vc', label: 'Khashi VC', sourceBaseUrl: 'http://khashi:3101',
  available: true, httpStatus: 200, latencyMs: 486, error: null, status: 'blocked', liveTradingLocked: true,
  kpis: { healthScore: 62, liveMarkets: 1462, pricedLiveMarkets: 903, orderbookSnapshots: 51820,
    streamBuckets: 388, technicalCandles: 240115, indicatorSnapshots: 18904, scanRuns: 76,
    openTrades: 0, closedTrades: 18, realizedPnlUsd: 124.4, openRiskUsd: 260, paperCandidates: 7 },
  tabs: [{ id: 'paper', label: 'Paper', status: 'ready' }],
  blockers: ['Market collection is paused: storage pressure gate has not cleared since the last restart plan.',
             'Freshness proof is stale — production freshness evidence is older than the collection window.',
             'Paper ledger holds open exposure recorded from replay-only fills.'],
  recommendations: ['/api/roc/kalshi-paper-reconciliation-proof',
                    'Clear the storage pressure gate, then resume restricted collection before active.'],
  sourceRoutes: { events: '/api/roc/trading-command-center/events' }, summary: { mode: 'shadow-paper-readonly' },
};

const summary = () => ({
  id: 'trading-intelligence-control-plane-summary',
  contractVersion: 'trading-intelligence-control-plane.v1',
  frontendContractVersion: '2026-09-08.v1',
  title: 'Trading Intelligence Control Plane Summary',
  generatedAt: iso(0), status: 'blocked', liveTradingLocked: true,
  kpis: { projectsAvailable: 2, projectsTotal: 2, openTrades: 3, closedTrades: 18,
    realizedPnlUsd: 124.4, openRiskUsd: 260, liveMarkets: 1462, strategyCandidates: 7,
    liveTradingLocked: true, blockers: 5 },
  projects: [investing, khashi],
  tabs: [],
  blockers: [...investing.blockers.map(b => `Investing System: ${b}`), ...khashi.blockers.map(b => `Khashi VC: ${b}`)],
  recommendations: [...investing.recommendations.map(r => `Investing System: ${r}`), ...khashi.recommendations.map(r => `Khashi VC: ${r}`)],
});

const degraded = () => {
  const s = summary();
  s.projects = [{ ...investing, available: false, httpStatus: 0, latencyMs: 8031, status: 'unavailable',
    error: '<urlopen error [Errno -2] Name or service not known>', kpis: {}, tabs: [],
    blockers: ['Investing System command-center summary is unavailable: <urlopen error [Errno -2] Name or service not known>'],
    recommendations: ['Check Investing System API base URL, auth token, and service health.'] }, khashi];
  s.kpis = { ...s.kpis, projectsAvailable: 1, openTrades: 0, blockers: 4 };
  s.blockers = ['Investing System: Investing System command-center summary is unavailable: <urlopen error [Errno -2] Name or service not known>',
    ...khashi.blockers.map(b => `Khashi VC: ${b}`)];
  return s;
};

const emptySummary = () => {
  const s = summary();
  s.status = 'ready'; s.blockers = []; s.recommendations = [];
  s.kpis = { ...s.kpis, blockers: 0, openTrades: 0, closedTrades: 0, realizedPnlUsd: null,
    openRiskUsd: null, liveMarkets: null, strategyCandidates: null };
  return s;
};

const events = () => ({
  id: 'trading-intelligence-control-plane-events', contractVersion: 'trading-intelligence-control-plane.v1',
  title: 'Trading Intelligence Control Plane Events', generatedAt: iso(0), limit: 10,
  events: [
    { id: 'kh-9f21', sourceProject: 'khashi-vc', sourceSystem: 'roc', stream: 'collection', type: 'collection_gate_blocked', status: 'blocked', severity: 'critical', title: 'collection_gate_blocked', occurredAt: iso(3), instrument: null, summary: 'Storage pressure gate blocked the restricted-collection restart plan.', links: {}, rawRef: {} },
    { id: 'inv-7c04', sourceProject: 'investing-system', sourceSystem: 'oanda', stream: 'broker-lifecycle-event', type: 'broker-lifecycle-event', status: 'submitted', severity: 'warning', title: 'EUR_USD broker lifecycle submitted', occurredAt: iso(11), instrument: 'EUR_USD', summary: 'Exit submitted but not broker-confirmed after 2 polling cycles.', links: {}, rawRef: {} },
    { id: 'kh-8ab3', sourceProject: 'khashi-vc', sourceSystem: 'kalshi-paper', stream: 'paper-ledger', type: 'paper_trade_closed', status: 'closed', severity: 'info', title: 'KXPRESPARTY-28 paper trade closed', occurredAt: iso(24), instrument: 'KXPRESPARTY-28', summary: 'Paper trade closed with realized P/L 41.2.', links: {}, rawRef: {} },
    { id: 'inv-7be1', sourceProject: 'investing-system', sourceSystem: 'oanda', stream: 'runtime-service-state', type: 'runtime-service-state', status: 'running', severity: 'info', title: 'OANDA runtime running', occurredAt: iso(38), instrument: null, summary: 'Runtime heartbeat refreshed; practice mode, live submit locked.', links: {}, rawRef: {} },
    { id: 'kh-8a02', sourceProject: 'khashi-vc', sourceSystem: 'roc', stream: 'freshness', type: 'freshness_proof_stale', status: 'stale', severity: 'warning', title: 'freshness_proof_stale', occurredAt: iso(52), instrument: null, summary: 'Production freshness evidence is older than the collection window.', links: {}, rawRef: {} },
    { id: 'inv-7ad9', sourceProject: 'investing-system', sourceSystem: 'oanda', stream: 'strategy-exit-executor-run', type: 'strategy-exit-executor-run', status: 'partial', severity: 'warning', title: 'GBP_USD exit executor partial', occurredAt: iso(67), instrument: 'GBP_USD', summary: 'Exit executor completed with 1 unresolved candidate link.', links: {}, rawRef: {} },
    { id: 'inv-79c5', sourceProject: 'investing-system', sourceSystem: 'oanda', stream: 'practice-execution', type: 'practice-execution', status: 'accepted', severity: 'info', title: 'USD_JPY practice execution accepted', occurredAt: iso(104), instrument: 'USD_JPY', summary: 'Practice entry accepted at 1.2 units, stop attached.', links: {}, rawRef: {} },
  ],
});

const invControls = [
  { id: 'refresh_daily_ops', label: 'Run OANDA Daily Ops', intent: 'Refresh OANDA evidence rollups, repair state, and autonomy readiness.', execution: 'available', effect: 'persists oanda-daily-ops-automation-report', dangerous: false },
  { id: 'pause_oanda_runtime', label: 'Pause OANDA Runtime', intent: 'Mark the OANDA practice runtime stopped so dashboards and supervisors treat it as halted.', execution: 'available', effect: 'persists runtime-service-state=stopped', dangerous: true },
  { id: 'resume_oanda_runtime', label: 'Resume OANDA Runtime', intent: 'Preview the host action required to restart the supervised OANDA runtime worker.', execution: 'host_orchestrator_required', effect: 'no process mutation from this API', dangerous: true },
  { id: 'emergency_lock_trading', label: 'Emergency Lock Trading', intent: 'Confirm live trading is locked and mark the practice runtime stopped.', execution: 'available', effect: 'live submit is already locked', dangerous: true },
].map(c => ({ ...c, namespacedId: `investing-system:${c.id}`, projectId: 'investing-system', projectLabel: 'Investing System' }));

const khaControls = [
  ['pause_collection', 'Pause Collection', 'Stop new collection and stream writes.', 'npm run khashi:collection:pause', true],
  ['shadow_collection', 'Shadow Collection', 'Resume low-risk shadow collection without stream writes.', 'npm run khashi:collection:shadow', false],
  ['restricted_collection', 'Restricted Collection', 'Resume restricted collection after restart gates pass.', 'npm run khashi:collection:restricted', true],
  ['active_collection', 'Active Collection', 'Resume active collection after operator review and storage gates pass.', 'npm run khashi:collection:active', true],
  ['rollback_collection', 'Rollback Collection', 'Return collection to paused mode.', 'npm run khashi:collection:rollback', true],
  ['run_freshness_proof', 'Run Freshness Proof', 'Refresh production freshness evidence.', 'npm run khashi:freshness:proof', false],
].map(([id, label, intent, runbookCommand, requiresServiceRestart]) => ({
  id, label, intent, runbookCommand, requiresServiceRestart, namespacedId: `khashi-vc:${id}`,
  projectId: 'khashi-vc', projectLabel: 'Khashi VC', execution: 'runbook-required', brokerMutation: false, liveTradingLocked: true,
}));

const controls = () => ({
  id: 'trading-intelligence-control-plane-controls', contractVersion: 'trading-intelligence-control-plane.v1',
  title: 'Trading Intelligence Control Plane Controls', generatedAt: iso(0),
  safety: { liveTradingLocked: true, submitLiveOrderAvailable: false, projectOwnedControlsOnly: true,
    note: 'Nous proxies explicit project-owned control requests; it does not submit trades.' },
  projects: [
    { projectId: 'investing-system', label: 'Investing System', available: true, error: null, safety: {}, controls: invControls },
    { projectId: 'khashi-vc', label: 'Khashi VC', available: true, error: null, safety: {}, controls: khaControls },
  ],
  controls: [...invControls, ...khaControls],
});

let scenario = 'ready';

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.searchParams.has('ti')) scenario = url.searchParams.get('ti');
  const p = url.pathname;

  if (p === '/api/trading-intelligence/summary') {
    if (scenario === 'error') return send(res, 500, { detail: 'aggregator exploded' });
    if (scenario === 'degraded') return send(res, 200, degraded());
    if (scenario === 'empty') return send(res, 200, emptySummary());
    return send(res, 200, summary());
  }
  if (p === '/api/trading-intelligence/events') {
    if (scenario === 'empty') return send(res, 200, { ...events(), events: [] });
    if (scenario === 'degraded') {
      return send(res, 200, { ...events(), events: [
        { id: 'nous-inv-unavail', sourceProject: 'investing-system', sourceSystem: 'nous-hermes-agent', stream: 'source-health', type: 'source_unavailable', status: 'blocked', severity: 'info', title: 'Investing System unavailable', occurredAt: iso(0), instrument: null, summary: 'Source command-center endpoint did not respond.', links: {}, rawRef: {} },
        ...events().events.filter(e => e.sourceProject === 'khashi-vc'),
      ] });
    }
    return send(res, 200, events());
  }
  if (p === '/api/trading-intelligence/controls') {
    if (scenario === 'empty') return send(res, 200, { ...controls(), projects: controls().projects.map(x => ({ ...x, controls: [] })), controls: [] });
    return send(res, 200, controls());
  }
  if (p === '/api/trading-intelligence/control') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}');
      const [projectId, action] = String(parsed.action || '').split(':');
      send(res, 200, {
        id: 'trading-intelligence-control-plane-control',
        contractVersion: 'trading-intelligence-control-plane.v1',
        generatedAt: new Date().toISOString(), status: 'proxied', projectId, action,
        httpStatus: 200, sourceBaseUrl: 'http://khashi:3101', error: null,
        result: { projectId, action, status: parsed.execute ? 'recorded' : 'preview', execute: !!parsed.execute,
          liveTradingLocked: true, brokerMutation: false, reason: parsed.reason ?? null },
      });
    });
    return;
  }
  // everything else the SPA asks for: benign shapes so the shell boots.
  // These are shell endpoints, unrelated to the page under test — they just
  // have to be the right *shape* or App.tsx's own memos throw.
  if (p === '/api/dashboard/plugins') return send(res, 200, []);               // PluginManifestResponse[]
  if (p === '/api/dashboard/themes') return send(res, 200, { active: 'default', themes: [] });
  if (p === '/api/dashboard/font') return send(res, 200, { font: 'theme' });
  if (p === '/api/profiles') return send(res, 200, { profiles: [] });
  if (p === '/api/profiles/active') return send(res, 200, { active: 'default', current: 'default' });
  if (p === '/api/auth/me') return send(res, 401, { detail: 'Unauthorized' });  // loopback mode
  if (p === '/api/status') return send(res, 200, { gateway_running: false, gateway_state: 'unknown', active_sessions: 0, auth_required: false, auth_providers: [], gateway_platforms: {} });
  if (p === '/api/config') return send(res, 200, { dashboard: {} });
  if (p.startsWith('/api/')) return send(res, 200, {});

  const file = p === '/' || !path.extname(p) ? '/index.html' : p;
  const full = path.join(DIST, file);
  if (!fs.existsSync(full)) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(full)] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(full));
}).listen(4319, () => console.log('harness on 4319'));
