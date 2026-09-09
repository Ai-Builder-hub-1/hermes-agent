/**
 * Serve the built dashboard with stubbed Head Trader endpoints so the real
 * page can be rendered, driven and screenshotted.
 *   ?ht=ready | empty | error
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Build first: (cd web && npm run build)
const DIST = process.env.HT_DIST ?? new URL('../../../../hermes_cli/web_dist', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const iso = (m) => new Date(Date.now() - m * 60000).toISOString();

let scenario = 'ready';
const state = { incidents: [], decisions: {}, audit: [] };

const ACTIONS = [
  { id: 'head_trader.send_summary', label: 'Send trading summary', desk: 'cross_system', projectId: 'nous-hermes-agent', permissionLevel: 'inform', liveTradingImpact: 'none', requiresConfirmation: false, riskLevel: 'low', backendControlId: null },
  { id: 'head_trader.refresh_readonly', label: 'Refresh readonly intelligence', desk: 'cross_system', projectId: 'nous-hermes-agent', permissionLevel: 'auto_safe', liveTradingImpact: 'none', requiresConfirmation: false, riskLevel: 'low', backendControlId: null },
  { id: 'investing.pause_oanda_runtime', label: 'Pause OANDA runtime', desk: 'oanda', projectId: 'investing-system', permissionLevel: 'approval_required', liveTradingImpact: 'runtime_control', requiresConfirmation: true, riskLevel: 'high', backendControlId: 'investing-system:pause_oanda_runtime' },
  { id: 'investing.resume_oanda_runtime', label: 'Resume OANDA runtime', desk: 'oanda', projectId: 'investing-system', permissionLevel: 'hard_gate', liveTradingImpact: 'runtime_control', requiresConfirmation: true, riskLevel: 'critical', backendControlId: 'investing-system:resume_oanda_runtime' },
  { id: 'khashi.run_freshness_proof', label: 'Run Khashi freshness proof', desk: 'khashi', projectId: 'khashi-vc', permissionLevel: 'approval_required', liveTradingImpact: 'paper_only', requiresConfirmation: true, riskLevel: 'medium', backendControlId: 'khashi-vc:run_freshness_proof' },
  { id: 'khashi.active_collection', label: 'Request active Khashi collection', desk: 'khashi', projectId: 'khashi-vc', permissionLevel: 'hard_gate', liveTradingImpact: 'paper_only', requiresConfirmation: true, riskLevel: 'critical', backendControlId: 'khashi-vc:active_collection' },
  { id: 'head_trader.place_live_order', label: 'Place live order', desk: 'cross_system', projectId: 'nous-hermes-agent', permissionLevel: 'forbidden', liveTradingImpact: 'live_order', requiresConfirmation: true, riskLevel: 'critical', backendControlId: null },
];

const OPTIONS = {
  khashi: [
    { id: 'run-proof', label: 'Run freshness proof', actionId: 'khashi.run_freshness_proof', expectedEffect: 'Ask Khashi to verify market freshness.', requiresConfirmation: true },
    { id: 'go-active', label: 'Request active collection', actionId: 'khashi.active_collection', expectedEffect: 'Resume active collection after gates pass.', requiresConfirmation: true },
    { id: 'live', label: 'Place live order', actionId: 'head_trader.place_live_order', expectedEffect: 'Never routable from Head Trader.', requiresConfirmation: true },
    { id: 'explain', label: 'Explain evidence', actionId: null, expectedEffect: 'Show why the incident was opened.', requiresConfirmation: false },
  ],
  oanda: [
    { id: 'pause-runtime', label: 'Pause OANDA runtime', actionId: 'investing.pause_oanda_runtime', expectedEffect: 'Persist stopped runtime state.', requiresConfirmation: true },
    { id: 'resume-runtime', label: 'Resume OANDA runtime', actionId: 'investing.resume_oanda_runtime', expectedEffect: 'Host orchestrator required.', requiresConfirmation: true },
    { id: 'explain', label: 'Explain evidence', actionId: null, expectedEffect: 'Show why the incident was opened.', requiresConfirmation: false },
  ],
};

function seed() {
  state.incidents = [
    {
      id: 'incident-khashi-9f21ab33cc71', sourceProject: 'khashi-vc', desk: 'khashi', type: 'blocker', severity: 'critical',
      title: 'Khashi VC needs attention', status: 'waiting_for_human',
      summary: 'Market collection is paused: storage pressure gate has not cleared since the last restart plan.',
      recommendation: 'Run Khashi freshness proof before trusting new perpetual-market paper decisions.',
      evidence: { project: { projectId: 'khashi-vc', status: 'blocked', httpStatus: 200, latencyMs: 486 }, tradingContractVersion: 'trading-intelligence-control-plane.v1' },
      options: OPTIONS.khashi, createdAt: iso(180), updatedAt: iso(3),
    },
    {
      id: 'incident-oanda-7c04de11aa02', sourceProject: 'investing-system', desk: 'oanda', type: 'blocker', severity: 'high',
      title: 'Investing System needs attention', status: 'open',
      summary: 'Broker lifecycle sync has 2 exits submitted but not broker-confirmed.',
      recommendation: 'Review OANDA runtime and consider pausing before accepting new strategy decisions.',
      evidence: { project: { projectId: 'investing-system', status: 'watch', httpStatus: 200, latencyMs: 214 } },
      options: OPTIONS.oanda, createdAt: iso(240), updatedAt: iso(11),
    },
    {
      id: 'incident-khashi-8a02ff5512bd', sourceProject: 'khashi-vc', desk: 'khashi', type: 'data_quality', severity: 'watch',
      title: 'Freshness proof is stale', status: 'open',
      summary: 'Production freshness evidence is older than the collection window.',
      recommendation: 'Run Khashi freshness proof.', evidence: {}, options: OPTIONS.khashi,
      createdAt: iso(300), updatedAt: iso(52),
    },
    {
      id: 'incident-oanda-1188cc99ee44', sourceProject: 'investing-system', desk: 'oanda', type: 'runtime', severity: 'info',
      title: 'OANDA runtime resumed', status: 'resolved',
      summary: 'Runtime heartbeat refreshed; practice mode, live submit locked.',
      recommendation: 'No action needed.', evidence: {}, options: OPTIONS.oanda,
      createdAt: iso(600), updatedAt: iso(300),
    },
  ];
  state.audit = [
    { type: 'incidents.refreshed', actorId: 'system', createdAt: iso(3) },
    { type: 'conversation.reply', actorId: 'telegram:42', createdAt: iso(9) },
    { type: 'decision.created', actorId: 'telegram:42', createdAt: iso(9) },
    { type: 'channel.webhook.refused', actorId: 'discord', createdAt: iso(22) },
    { type: 'decision.confirm_refused', actorId: 'operator', createdAt: iso(40) },
  ];
  state.decisions = {};
}
seed();

const openIncidents = () => state.incidents.filter((i) => ['open', 'waiting_for_human', 'approved', 'executing'].includes(i.status));

const summary = () => ({
  id: 'head-trader-summary', contractVersion: 'head-trader-control-plane.v1', frontendContractVersion: '2026-09-09.v1',
  generatedAt: iso(0), status: 'blocked', liveTradingLocked: true,
  desks: [
    { id: 'oanda', label: 'OANDA Desk Trader', status: 'watch', projectId: 'investing-system', available: true },
    { id: 'khashi', label: 'Khashi Perpetual Desk Trader', status: 'blocked', projectId: 'khashi-vc', available: true },
    { id: 'cross_system', label: 'Cross-System Risk Officer', status: 'watch', projectId: 'nous-hermes-agent', available: true },
  ],
  kpis: {
    openIncidents: openIncidents().length,
    waitingForHuman: openIncidents().filter((i) => i.status === 'waiting_for_human').length,
    criticalIncidents: openIncidents().filter((i) => i.severity === 'critical').length,
    actionsAvailable: ACTIONS.length,
    sourceProjectsAvailable: 2, sourceProjectsTotal: 2,
  },
  latestIncidents: openIncidents(),
  recommendations: [
    'Khashi VC: clear the storage pressure gate, then resume restricted collection before active.',
    'Investing System: run broker lifecycle sync and reconcile submitted exits.',
  ],
});

function riskFor(actionId) {
  const action = ACTIONS.find((a) => a.id === actionId);
  const blockers = [];
  if (!action) return { id: 'head-trader-risk-decision', contractVersion: 'head-trader-control-plane.v1', generatedAt: iso(0), allowed: false, level: 'critical', permissionLevel: 'unknown', requiresConfirmation: true, blockers: ['Unknown action.'], explanation: 'The requested action is not in the explicit Head Trader catalog.', liveTradingLocked: true };
  if (action.liveTradingImpact === 'live_order') blockers.push('Live order actions are never routable from Head Trader.');
  if (action.permissionLevel === 'forbidden') blockers.push('Action is forbidden by policy.');
  if (action.permissionLevel === 'hard_gate') blockers.push('Action requires a hard human gate outside conversational confirmation.');
  const allowed = blockers.length === 0 && ['inform', 'auto_safe', 'approval_required'].includes(action.permissionLevel);
  return {
    id: 'head-trader-risk-decision', contractVersion: 'head-trader-control-plane.v1', generatedAt: iso(0),
    allowed, level: action.riskLevel, permissionLevel: action.permissionLevel,
    requiresConfirmation: action.requiresConfirmation, blockers,
    explanation: allowed && action.requiresConfirmation ? 'Allowed after confirmation.' : allowed ? 'Allowed.' : 'Blocked by Head Trader risk policy.',
    liveTradingLocked: true,
  };
}

function interpret(text, incident) {
  const t = String(text || '').toLowerCase();
  const desk = incident?.desk;
  if (/\b(do\s*n[o']?t|don'?t|no\b|never|hold\s+off|not\s+yet)\b/.test(t)) return { intent: 'decline', actionId: null, confidence: 0.8, desk, reason: 'reply reads as a refusal, so no action is proposed' };
  if (/(explain|why|evidence)/.test(t)) return { intent: 'explain', actionId: null, confidence: 0.9, desk };
  if (/(status|summary|what happened)/.test(t)) return { intent: 'status', actionId: null, confidence: 0.85, desk };
  if (/(proof|freshness)/.test(t)) {
    return desk === 'khashi'
      ? { intent: 'action', actionId: 'khashi.run_freshness_proof', confidence: 0.78, desk }
      : { intent: 'unsupported_for_desk', actionId: null, confidence: 0.6, desk, reason: `that action is not available on the ${desk} desk` };
  }
  if (/(pause|halt|stop)/.test(t)) {
    const id = desk === 'khashi' ? 'khashi.pause_collection' : desk === 'oanda' ? 'investing.pause_oanda_runtime' : null;
    return id ? { intent: 'action', actionId: id, confidence: 0.75, desk } : { intent: 'unsupported_for_desk', actionId: null, confidence: 0.6, desk };
  }
  return { intent: 'unknown', actionId: null, confidence: 0.35, desk };
}

let decisionSeq = 0;
function makeDecision({ actionId, incidentId, reason, channel = 'dashboard' }) {
  const action = ACTIONS.find((a) => a.id === actionId);
  const risk = riskFor(actionId);
  const d = {
    id: `decision-${(++decisionSeq).toString(16).padStart(12, '0')}`,
    incidentId, actionId, backendControlId: action?.backendControlId ?? null,
    actorId: 'operator', channel, reason: reason ?? '',
    status: risk.allowed ? (risk.requiresConfirmation ? 'waiting_for_confirmation' : 'approved') : 'rejected',
    risk, result: null, createdAt: iso(0), updatedAt: iso(0),
  };
  state.decisions[d.id] = d;
  state.audit.unshift({ type: 'decision.created', actorId: 'operator', createdAt: iso(0) });
  return d;
}

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((resolve) => {
  let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
});

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.searchParams.has('ht')) { scenario = url.searchParams.get('ht'); seed(); }
  const p = url.pathname;

  if (p.startsWith('/api/head-trader')) {
    if (scenario === 'error') return send(res, 500, { detail: 'head trader store unreadable' });
    const empty = scenario === 'empty';

    if (p === '/api/head-trader/summary') {
      const s = summary();
      if (empty) { s.status = 'ready'; s.latestIncidents = []; s.kpis = { ...s.kpis, openIncidents: 0, waitingForHuman: 0, criticalIncidents: 0 }; s.recommendations = []; }
      return send(res, 200, s);
    }
    if (p === '/api/head-trader/incidents') return send(res, 200, { incidents: empty ? [] : state.incidents });
    if (p === '/api/head-trader/action-catalog') return send(res, 200, { id: 'head-trader-action-catalog', contractVersion: 'head-trader-control-plane.v1', generatedAt: iso(0), permissionLevels: ['inform', 'auto_safe', 'approval_required', 'hard_gate', 'forbidden'], actions: ACTIONS });
    if (p === '/api/head-trader/audit') return send(res, 200, { audit: empty ? [] : state.audit });
    if (p === '/api/head-trader/channels') {
      return send(res, 200, { channels: [
        { id: 'discord', enabled: false, configured: false, senderAllowListSize: 0, inboundReady: false, verification: 'discord_ed25519', mode: 'disabled_by_default' },
        { id: 'telegram', enabled: true, configured: true, senderAllowListSize: 1, inboundReady: true, verification: 'telegram_secret_token', mode: 'disabled_by_default' },
      ] });
    }
    if (p === '/api/head-trader/refresh') return send(res, 200, { createdOrUpdated: state.incidents.length });

    const reply = p.match(/^\/api\/head-trader\/incidents\/([^/]+)\/reply$/);
    if (reply) {
      const body = await readBody(req);
      const incident = state.incidents.find((i) => i.id === decodeURIComponent(reply[1]));
      const intent = interpret(body.message, incident);
      const messages = [
        { id: `m${Date.now()}a`, role: 'human', actorId: 'operator', text: body.message, createdAt: iso(0) },
        { id: `m${Date.now()}b`, role: 'head_trader', actorId: 'head-trader', text:
            intent.intent === 'action' ? `I matched that to ${ACTIONS.find((a) => a.id === intent.actionId)?.label}. Confirmation is required before routing the control.`
            : intent.intent === 'decline' ? 'Understood - I read that as a no, so I have not proposed any action. The incident stays open.'
            : intent.intent === 'unsupported_for_desk' ? `That action is not available on the ${intent.desk} desk, so I have not proposed anything.`
            : intent.intent === 'explain' ? `${incident?.title}: ${incident?.summary} Recommendation: ${incident?.recommendation}`
            : `Incident ${incident?.id} is ${incident?.status} with severity ${incident?.severity}.`,
          metadata: { intent }, createdAt: iso(0) },
      ];
      const decision = intent.actionId ? makeDecision({ actionId: intent.actionId, incidentId: incident?.id, reason: body.message, channel: 'dashboard' }) : null;
      state.audit.unshift({ type: 'conversation.reply', actorId: 'operator', createdAt: iso(0) });
      return send(res, 200, { id: 'head-trader-reply', contractVersion: 'head-trader-control-plane.v1', generatedAt: iso(0), status: 'received', conversation: { id: 'conv-1', incidentId: incident?.id, channel: 'dashboard' }, messages, intent, decision });
    }

    if (p === '/api/head-trader/decisions') {
      const body = await readBody(req);
      return send(res, 200, { id: 'head-trader-decision', contractVersion: 'head-trader-control-plane.v1', generatedAt: iso(0), decision: makeDecision(body) });
    }

    const confirm = p.match(/^\/api\/head-trader\/decisions\/([^/]+)\/confirm$/);
    if (confirm) {
      const body = await readBody(req);
      const d = state.decisions[decodeURIComponent(confirm[1])];
      if (!d) return send(res, 200, { status: 'rejected', error: 'decision not found' });
      if (!['waiting_for_confirmation', 'approved'].includes(d.status)) {
        return send(res, 200, { status: 'rejected', error: `decision is ${d.status}; only ['approved','waiting_for_confirmation'] can be confirmed`, decision: d });
      }
      d.status = 'executed';
      d.updatedAt = iso(0);
      d.result = { status: 'proxied', httpStatus: 200, projectId: d.actionId.split('.')[0], action: d.backendControlId, reason: body.reason, execute: true, liveTradingLocked: true };
      state.audit.unshift({ type: 'decision.confirmed', actorId: 'operator', createdAt: iso(0) });
      const inc = state.incidents.find((i) => i.id === d.incidentId);
      if (inc) { inc.status = 'executed'; inc.updatedAt = iso(0); }
      return send(res, 200, { status: 'executed', decision: d });
    }

    const reject = p.match(/^\/api\/head-trader\/decisions\/([^/]+)\/reject$/);
    if (reject) {
      const d = state.decisions[decodeURIComponent(reject[1])];
      if (d) { d.status = 'rejected'; d.updatedAt = iso(0); }
      return send(res, 200, { decision: d ?? null });
    }

    const mutate = p.match(/^\/api\/head-trader\/incidents\/([^/]+)\/(ignore|resolve)$/);
    if (mutate) {
      const inc = state.incidents.find((i) => i.id === decodeURIComponent(mutate[1]));
      if (inc) { inc.status = mutate[2] === 'ignore' ? 'ignored' : 'resolved'; inc.updatedAt = iso(0); }
      return send(res, 200, { incident: inc ?? null });
    }
    return send(res, 200, {});
  }

  // shell endpoints, correctly shaped so App.tsx's own memos do not throw
  if (p === '/api/dashboard/plugins') return send(res, 200, []);
  if (p === '/api/dashboard/themes') return send(res, 200, { active: 'default', themes: [] });
  if (p === '/api/dashboard/font') return send(res, 200, { font: 'theme' });
  if (p === '/api/profiles') return send(res, 200, { profiles: [] });
  if (p === '/api/profiles/active') return send(res, 200, { active: 'default', current: 'default' });
  if (p === '/api/auth/me') return send(res, 401, { detail: 'Unauthorized' });
  if (p === '/api/status') return send(res, 200, { gateway_running: false, gateway_state: 'unknown', active_sessions: 0, auth_required: false, auth_providers: [], gateway_platforms: {} });
  if (p === '/api/config') return send(res, 200, { dashboard: {} });
  if (p.startsWith('/api/')) return send(res, 200, {});

  const file = p === '/' || !path.extname(p) ? '/index.html' : p;
  const full = path.join(DIST, file);
  if (!fs.existsSync(full)) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(full)] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(full));
}).listen(4320, () => console.log('head-trader harness on 4320'));
