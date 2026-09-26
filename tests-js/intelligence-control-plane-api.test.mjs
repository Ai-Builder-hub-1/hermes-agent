import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer, createTradingIntelligenceService } from '../scripts/trading-intelligence-control-plane-api.mjs';

const sources = [
  {
    projectId: 'investing-system',
    label: 'Investing System',
    baseUrl: 'http://investing.local',
    authToken: 'read',
    adminToken: 'admin',
    routes: {
      summary: '/trading-desk/command-center/summary',
      departments: '/api/departments/control-plane/summary',
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
      departments: '/api/departments/khashi-trader/summary',
      events: '/api/roc/trading-command-center/events',
      controls: '/api/roc/trading-command-center/controls',
      control: '/api/roc/trading-command-center/control',
    },
  },
];

test('aggregates department outputs across Investing System and Khashi VC', async () => {
  const service = createService();

  const summary = await service.getIntelligenceSummary();
  const departments = await service.getDepartments();
  const accounts = await service.getAccounts();

  assert.equal(summary.liveTradingLocked, true);
  assert.equal(summary.safety.separateAccountCash, true);
  assert.equal(departments.departments.some(department => department.departmentId === 'risk_manager'), true);
  assert.equal(departments.departments.some(department => department.departmentId === 'khashi_trader'), true);
  assert.equal(accounts.separateAccountCash, true);
  assert.equal(accounts.accounts.some(account => account.accountId === 'leon'), true);
  assert.equal(accounts.accounts.some(account => account.accountId === 'khashi-vc'), true);
  assert.equal(summary.recommendations.every(recommendation => recommendation.executionAllowed === false), true);
});

test('creates Head Trader decision packets from recommendations and blockers', async () => {
  const service = createService();

  const inbox = await service.getDecisionInbox();
  const headTrader = await service.getHeadTraderSummary();

  assert.equal(inbox.executionAllowed, false);
  assert.equal(inbox.liveTradingLocked, true);
  assert.equal(inbox.packets.some(packet => packet.decisionType === 'risk_block'), true);
  assert.equal(inbox.packets.some(packet => packet.decisionType === 'buy_recommendation'), true);
  assert.equal(headTrader.role, 'conversation-first decision controller');
  assert.equal(headTrader.actionPermissions.submitLiveTrade, false);
  assert.equal(headTrader.actionPermissions.proxyProjectOwnedSafeControls, true);
  assert.equal(headTrader.decisionInbox.every(packet => packet.executionAllowed === false), true);
  assert.equal(headTrader.decisionInbox.every(packet => packet.conversation?.resolutionStatus === 'new'), true);
});

test('serves focused recommendations and blockers collections', async () => {
  const service = createService();

  const recommendations = await service.getRecommendations();
  const blockers = await service.getBlockers();

  assert.equal(recommendations.recommendations.length, 2);
  assert.equal(blockers.status, 'blocked');
  assert.equal(blockers.blockers.length, 2);
});

test('exposes post V6 maturity surfaces for frontend and operations planning', async () => {
  const service = createService();

  const roadmap = await service.getMaturityRoadmap();
  const strategyQuality = await service.getStrategyQuality();
  const governance = await service.getPromotionGovernance();
  const dataReliability = await service.getDataReliability();
  const portfolio = await service.getPortfolioIntelligence();
  const eventDesk = await service.getEventDesk();
  const frontendContract = await service.getFrontendContract();

  assert.equal(roadmap.phases.some(phase => phase.id === 'v16-live-readiness'), true);
  assert.equal(strategyQuality.requiredEvidence.includes('entry indicator snapshot'), true);
  assert.equal(governance.liveTradingLocked, true);
  assert.equal(governance.stages.find(stage => stage.id === 'live').enabled, false);
  assert.equal(dataReliability.retentionTiers.some(tier => tier.id === 'raw-fast'), true);
  assert.equal(portfolio.scope.includes('Leon only'), true);
  assert.equal(eventDesk.eventTypes.includes('macro'), true);
  assert.equal(frontendContract.endpoints.includes('/api/intelligence-control-plane/decision-inbox'), true);
});

test('turns an unavailable department source into an explicit blocker decision', async () => {
  const service = createTradingIntelligenceService({
    sources,
    fetchFn: async (url) => {
      if (String(url).includes('investing.local')) throw new Error('connection refused');
      return jsonResponse({
        id: 'dept-khashi-trader-current',
        departmentId: 'khashi_trader',
        sourceSystem: 'khashi-vc',
        status: 'ready',
        blockers: [],
        recommendations: [],
        output: {
          accountAwareness: {
            accountId: 'khashi-vc',
            system: 'khashi',
            cashAvailable: 500,
            buyingPower: 500,
            openExposure: 0,
            leverage: null,
            dailyPnl: 0,
            totalPnl: 0,
            riskState: 'normal',
            updatedAt: '2026-09-15T00:00:00.000Z',
          },
        },
      });
    },
  });

  const blockers = await service.getBlockers();
  const inbox = await service.getDecisionInbox();

  assert.equal(blockers.blockers.some(blocker => blocker.id === 'investing-system-department-source-unavailable'), true);
  assert.equal(inbox.packets.some(packet => packet.id === 'decision-investing-system-department-source-unavailable'), true);
});

test('serves new maturity surfaces over HTTP routes', async () => {
  const server = createServer(createService());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const paths = [
      '/api/intelligence-control-plane/summary',
      '/api/intelligence-control-plane/decision-inbox',
      '/api/intelligence-control-plane/head-trader/summary',
      '/api/intelligence-control-plane/maturity-roadmap',
      '/api/intelligence-control-plane/strategy-quality',
      '/api/intelligence-control-plane/promotion-governance',
      '/api/intelligence-control-plane/data-reliability',
      '/api/intelligence-control-plane/risk-policy',
      '/api/intelligence-control-plane/live-fleet-proof',
      '/api/intelligence-control-plane/frontend-samples',
      '/api/intelligence-control-plane/portfolio-intelligence',
      '/api/intelligence-control-plane/event-desk',
      '/api/intelligence-control-plane/frontend-contract',
    ];
    for (const path of paths) {
      const response = await fetch(`${baseUrl}${path}`);
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(typeof payload.id, 'string');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('persists and resolves Head Trader decisions through admin-gated routes', async () => {
  const previousToken = process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN;
  const ledgerPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nous-decision-ledger-')), 'decision-ledger.jsonl');
  process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN = 'test-admin-token';
  const server = createServer(createService({ decisionLedgerPath: ledgerPath }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const unauthorized = await fetch(`${baseUrl}/api/intelligence-control-plane/decision-inbox/snapshot`, { method: 'POST', body: '{}' });
    assert.equal(unauthorized.status, 401);

    const snapshot = await fetch(`${baseUrl}/api/intelligence-control-plane/decision-inbox/snapshot`, {
      method: 'POST',
      headers: { authorization: 'Bearer test-admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({ actorId: 'test', reason: 'contract proof' }),
    });
    const snapshotPayload = await snapshot.json();
    assert.equal(snapshot.status, 200);
    assert.equal(snapshotPayload.status, 'recorded');
    assert.equal(snapshotPayload.recorded > 0, true);

    const resolve = await fetch(`${baseUrl}/api/intelligence-control-plane/decisions/resolve`, {
      method: 'POST',
      headers: { authorization: 'Bearer test-admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({ decisionId: snapshotPayload.decisionIds[0], status: 'deferred', actorId: 'operator', note: 'wait for proof' }),
    });
    const resolvePayload = await resolve.json();
    assert.equal(resolve.status, 200);
    assert.equal(resolvePayload.resolutionStatus, 'deferred');

    const ledger = await fetch(`${baseUrl}/api/intelligence-control-plane/decisions`);
    const ledgerPayload = await ledger.json();
    assert.equal(ledgerPayload.records.some(record => record.type === 'decision_resolution'), true);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previousToken === undefined) delete process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN;
    else process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN = previousToken;
  }
});

test('keeps decision mutation disabled when admin token is not configured', async () => {
  const previousToken = process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN;
  delete process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN;
  const server = createServer(createService());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/intelligence-control-plane/decisions/resolve`, {
      method: 'POST',
      headers: { authorization: 'Bearer any', 'content-type': 'application/json' },
      body: JSON.stringify({ decisionId: 'decision-1', status: 'resolved' }),
    });
    const payload = await response.json();
    assert.equal(response.status, 503);
    assert.match(payload.error, /INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previousToken === undefined) delete process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN;
    else process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN = previousToken;
  }
});

test('reports escalation readiness without exposing messaging secrets', async () => {
  const previous = saveMessagingEnv();
  delete process.env.NOUS_DISCORD_WEBHOOK_URL;
  delete process.env.DISCORD_WEBHOOK_URL;
  delete process.env.NOUS_TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.NOUS_TELEGRAM_CHAT_IDS;
  delete process.env.TELEGRAM_ALERT_CHAT_IDS;
  try {
    const status = await createService().getEscalationStatus();

    assert.equal(status.status, 'watch');
    assert.equal(status.transports.every(transport => transport.secretsExposed === false), true);
    assert.equal(status.transports.find(transport => transport.channel === 'discord').configured, false);
  } finally {
    restoreMessagingEnv(previous);
  }
});

test('skips escalation delivery safely when messaging credentials are absent', async () => {
  const previous = saveMessagingEnv();
  delete process.env.NOUS_DISCORD_WEBHOOK_URL;
  delete process.env.DISCORD_WEBHOOK_URL;
  delete process.env.NOUS_TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.NOUS_TELEGRAM_CHAT_IDS;
  delete process.env.TELEGRAM_ALERT_CHAT_IDS;
  try {
    const result = await createService().escalateDecision({ channels: ['discord', 'telegram'] });

    assert.equal(result.status, 'skipped');
    assert.equal(result.deliveries.length, 2);
    assert.equal(result.deliveries.every(delivery => delivery.skipped === true), true);
  } finally {
    restoreMessagingEnv(previous);
  }
});

test('delivers escalation through configured Discord webhook and Telegram bot API', async () => {
  const previous = saveMessagingEnv();
  process.env.NOUS_DISCORD_WEBHOOK_URL = 'https://discord.local/webhook';
  process.env.NOUS_TELEGRAM_BOT_TOKEN = 'telegram-token';
  process.env.NOUS_TELEGRAM_CHAT_IDS = '100,200';
  const calls = [];
  try {
    const service = createService({
      fetchFn: async (url, init) => {
        calls.push({ url: String(url), init });
        if (String(url).includes('discord.local')) return jsonResponse({ ok: true });
        if (String(url).includes('api.telegram.org')) return jsonResponse({ ok: true, result: { message_id: 1 } });
        return fixtureFetch(url);
      },
    });

    const result = await service.escalateDecision({ channels: ['discord', 'telegram'], actorId: 'test' });

    assert.equal(result.status, 'sent');
    assert.equal(result.deliveries.find(delivery => delivery.channel === 'discord').sent, true);
    assert.equal(result.deliveries.find(delivery => delivery.channel === 'telegram').sent, true);
    assert.equal(calls.some(call => call.url.includes('discord.local')), true);
    assert.equal(calls.some(call => call.url.includes('api.telegram.org/bottelegram-token/sendMessage')), true);
  } finally {
    restoreMessagingEnv(previous);
  }
});

test('records escalation replies into the durable decision ledger', async () => {
  const ledgerPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nous-reply-ledger-')), 'decision-ledger.jsonl');
  const service = createService({ decisionLedgerPath: ledgerPath });

  const reply = await service.recordEscalationReply({
    decisionId: 'decision-khashi-live-gate-1',
    channel: 'telegram',
    from: 'operator',
    message: 'defer until proof refresh',
  });
  const ledger = await service.getDecisionLedger();

  assert.equal(reply.status, 'recorded');
  assert.equal(reply.replyStatus, 'deferred');
  assert.equal(ledger.records.some(record => record.type === 'decision_reply'), true);
});

function createService(options = {}) {
  const decisionLedgerPath = options.decisionLedgerPath ?? path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nous-test-ledger-')), 'decision-ledger.jsonl');
  return createTradingIntelligenceService({
    ...options,
    decisionLedgerPath,
    sources,
    fetchFn: options.fetchFn ?? fixtureFetch,
  });
}

async function fixtureFetch(url) {
  const href = String(url);
  if (href.includes('investing.local') && href.includes('/api/departments/control-plane/summary')) {
    return jsonResponse({
          id: 'department-control-plane-summary',
          sourceSystem: 'investing-system',
          status: 'watch',
          accounts: [{
            accountId: 'leon',
            system: 'leon',
            cashAvailable: 1000,
            buyingPower: 1000,
            openExposure: 250,
            leverage: 0,
            dailyPnl: 12,
            totalPnl: 40,
            riskState: 'normal',
            updatedAt: '2026-09-15T00:00:00.000Z',
          }],
          blockers: [{
            id: 'risk-cash-policy',
            blockingDepartment: 'risk_manager',
            scope: 'leon',
            severity: 'watch',
            reason: 'Cash policy requires review.',
            evidenceIds: ['risk-ledger'],
            affectedRecommendations: ['leon-buy-tlry'],
            requiredResolution: 'Review portfolio cash limits.',
            overrideAllowed: false,
          }],
          recommendations: [{
            id: 'leon-buy-tlry',
            departmentId: 'leon_analyst',
            subjectType: 'ticker',
            subjectId: 'TLRY',
            recommendationType: 'buy',
            confidence: 'medium',
            urgency: 'medium',
            rationale: ['Shallow and deep analysis support watchlist accumulation only after risk approval.'],
            evidenceIds: ['analysis-tlry'],
            risks: ['Volatility'],
            blockers: ['Cash policy requires review.'],
            nextAction: 'Review TLRY recommendation with risk manager.',
            requiresHumanApproval: true,
            executionAllowed: false,
            createdAt: '2026-09-15T00:00:00.000Z',
          }],
          departments: [{
            departmentId: 'risk_manager',
            status: 'watch',
            recommendations: [],
            blockers: [],
            output: {},
          }],
    });
  }
  if (href.includes('khashi.local') && href.includes('/api/departments/khashi-trader/summary')) {
    return jsonResponse({
          id: 'dept-khashi-trader-current',
          departmentId: 'khashi_trader',
          sourceSystem: 'khashi-vc',
          status: 'blocked',
          blockers: [{
            id: 'khashi-live-gate-1',
            blockingDepartment: 'khashi_trader',
            scope: 'khashi',
            severity: 'blocked',
            reason: 'Readonly broker proof is stale.',
            evidenceIds: ['khashi-proof'],
            affectedRecommendations: ['khashi-live-locked-current'],
            requiredResolution: 'Refresh readonly broker proof.',
            overrideAllowed: false,
          }],
          recommendations: [{
            id: 'khashi-live-locked-current',
            departmentId: 'khashi_trader',
            subjectType: 'account',
            subjectId: 'khashi-vc',
            recommendationType: 'block',
            confidence: 'high',
            urgency: 'high',
            rationale: ['Live submit remains unavailable.'],
            evidenceIds: ['khashi-proof'],
            risks: ['Broker proof stale'],
            blockers: ['Readonly broker proof is stale.'],
            nextAction: 'Refresh proof and keep live locked.',
            requiresHumanApproval: true,
            executionAllowed: false,
            createdAt: '2026-09-15T00:00:00.000Z',
          }],
          output: {
            accountAwareness: {
              accountId: 'khashi-vc',
              system: 'khashi',
              cashAvailable: 500,
              buyingPower: 500,
              openExposure: 25,
              leverage: null,
              dailyPnl: 3,
              totalPnl: 7,
              riskState: 'blocked',
              updatedAt: '2026-09-15T00:00:00.000Z',
            },
          },
    });
  }
  return jsonResponse({});
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function saveMessagingEnv() {
  return {
    NOUS_DISCORD_WEBHOOK_URL: process.env.NOUS_DISCORD_WEBHOOK_URL,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    NOUS_TELEGRAM_BOT_TOKEN: process.env.NOUS_TELEGRAM_BOT_TOKEN,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    NOUS_TELEGRAM_CHAT_IDS: process.env.NOUS_TELEGRAM_CHAT_IDS,
    TELEGRAM_ALERT_CHAT_IDS: process.env.TELEGRAM_ALERT_CHAT_IDS,
  };
}

function restoreMessagingEnv(previous) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
