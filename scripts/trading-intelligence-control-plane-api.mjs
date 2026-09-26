#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const DEFAULT_PORT = Number(process.env.TRADING_INTELLIGENCE_PORT ?? 8791);
const GLOBAL_ENV_KEYS = new Set([
  'INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN',
  'TRADING_INTELLIGENCE_ADMIN_TOKEN',
  'NOUS_DISCORD_WEBHOOK_URL',
  'DISCORD_WEBHOOK_URL',
  'NOUS_TELEGRAM_BOT_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'NOUS_TELEGRAM_CHAT_IDS',
  'TELEGRAM_ALERT_CHAT_IDS',
  'TELEGRAM_ALLOWED_CHAT_IDS',
]);

loadGlobalEnvIntoProcess();

export const DEFAULT_SOURCES = [
  {
    projectId: 'investing-system',
    label: 'Investing System',
    baseUrl: process.env.INVESTING_SYSTEM_API_BASE_URL ?? 'http://127.0.0.1:3102',
    authToken: process.env.INVESTING_SYSTEM_API_READ_TOKEN ?? process.env.INVESTING_SYSTEM_API_ADMIN_TOKEN ?? process.env.INVESTING_SYSTEM_API_TOKEN ?? '',
    adminToken: process.env.INVESTING_SYSTEM_API_ADMIN_TOKEN ?? process.env.INVESTING_SYSTEM_API_TOKEN ?? '',
    routes: {
      summary: '/trading-desk/command-center/summary',
      departments: '/api/departments/control-plane/summary',
      events: '/trading-desk/command-center/events',
      controls: '/trading-desk/command-center/controls',
      control: '/trading-desk/command-center/control',
      credentialHealth: '/credential-health',
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
      departments: '/api/departments/khashi-trader/summary',
      events: '/api/roc/trading-command-center/events',
      controls: '/api/roc/trading-command-center/controls',
      control: '/api/roc/trading-command-center/control',
      credentialHealth: '/api/roc/credential-health',
    },
  },
];

export function createTradingIntelligenceService(options = {}) {
  const fetchFn = options.fetchFn ?? globalThis.fetch;
  const sources = options.sources ?? DEFAULT_SOURCES;
  const decisionLedgerPath = options.decisionLedgerPath ?? process.env.INTELLIGENCE_DECISION_LEDGER_PATH ?? path.join(process.cwd(), 'data', 'intelligence-control-plane', 'decision-ledger.jsonl');

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

  async function getDepartmentPayload(source) {
    const route = source.routes.departments;
    if (!route) {
      return {
        projectId: source.projectId,
        label: source.label,
        available: false,
        error: 'No department route configured.',
        departments: [],
        recommendations: [],
        blockers: [],
        accounts: [],
      };
    }
    const result = await requestSource(source, route);
    const payload = unwrapPayload(result.payload);
    const departments = normalizeDepartmentPayload(payload, source);
    return {
      projectId: source.projectId,
      label: source.label,
      sourceBaseUrl: source.baseUrl,
      available: result.ok,
      httpStatus: result.status,
      latencyMs: result.latencyMs,
      error: result.error,
      payload,
      departments,
      recommendations: collectRecommendations(payload, departments),
      blockers: result.ok ? collectBlockers(payload, departments) : [sourceUnavailableBlocker(source, result)],
      accounts: collectAccounts(payload, departments),
      status: result.ok ? normalizeProjectStatus(payload?.status) : 'unavailable',
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

  async function getCredentialReadiness() {
    const generatedAt = new Date().toISOString();
    const projects = await Promise.all(sources.map(async source => {
      const route = source.routes.credentialHealth;
      if (!route) {
        return {
          projectId: source.projectId,
          label: source.label,
          available: false,
          status: 'unavailable',
          providers: [],
          summary: { configured: 0, total: 0, missing: [], secretsExposed: false, liveTradingBlocked: true },
          blockers: [source.label + ' has no credential health route configured.'],
          recommendations: ['Add a readonly credential health endpoint for ' + source.label + '.'],
        };
      }
      const result = await requestSource(source, route);
      const payload = unwrapPayload(result.payload);
      const providers = asArray(payload?.providers).map(provider => ({
        ...provider,
        projectId: source.projectId,
        projectLabel: source.label,
      }));
      const missing = providers.filter(provider => !provider.configured).map(provider => provider.provider);
      return {
        projectId: source.projectId,
        label: source.label,
        sourceBaseUrl: source.baseUrl,
        available: result.ok,
        httpStatus: result.status,
        latencyMs: result.latencyMs,
        error: result.error,
        status: result.ok ? normalizeProjectStatus(payload?.status) : 'unavailable',
        providers,
        summary: result.ok
          ? payload?.summary ?? { configured: providers.length - missing.length, total: providers.length, missing, secretsExposed: false, liveTradingBlocked: true }
          : { configured: 0, total: 0, missing: [], secretsExposed: false, liveTradingBlocked: true },
        maturity: payload?.maturity ?? { nextActions: [] },
        blockers: result.ok ? providers.flatMap(provider => asArray(provider.blocks).map(block => provider.provider + ': ' + block)) : [sourceUnavailableBlocker(source, result)],
        recommendations: result.ok ? asArray(payload?.maturity?.nextActions) : ['Check ' + source.label + ' credential health route and auth token.'],
      };
    }));
    const providers = projects.flatMap(project => project.providers);
    const missing = providers.filter(provider => !provider.configured);
    const unavailable = projects.filter(project => !project.available);
    return {
      id: 'trading-intelligence-credential-readiness',
      title: 'Trading Intelligence Credential Readiness',
      generatedAt,
      status: unavailable.length ? 'blocked' : missing.length ? 'watch' : 'ready',
      liveTradingLocked: true,
      kpis: {
        projectsAvailable: projects.filter(project => project.available).length,
        projectsTotal: projects.length,
        providersConfigured: providers.filter(provider => provider.configured).length,
        providersTotal: providers.length,
        missingProviders: missing.length,
        secretsExposed: providers.some(provider => provider.secretsExposed !== false),
      },
      projects,
      providers,
      blockers: projects.flatMap(project => project.blockers),
      recommendations: unique(projects.flatMap(project => project.recommendations)).slice(0, 20),
      safety: {
        redacted: true,
        reportsValues: false,
        liveTradingUnlockedByCredentials: false,
      },
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

  async function getDepartments() {
    const generatedAt = new Date().toISOString();
    const projects = await Promise.all(sources.map(getDepartmentPayload));
    return {
      id: 'intelligence-control-plane-departments',
      title: 'Intelligence Control Plane Departments',
      contractVersion: 'department-control-plane.v1',
      generatedAt,
      status: fleetStatus(projects),
      sourceProjectsAvailable: projects.filter(project => project.available).length,
      sourceProjectsTotal: projects.length,
      projects,
      departments: projects.flatMap(project => project.departments),
    };
  }

  async function getIntelligenceSummary() {
    const generatedAt = new Date().toISOString();
    const departmentState = await getDepartments();
    const projects = departmentState.projects;
    const departments = departmentState.departments;
    const blockers = projects.flatMap(project => project.blockers.map(blocker => ({ ...blocker, projectId: project.projectId, projectLabel: project.label })));
    const recommendations = projects.flatMap(project => project.recommendations.map(recommendation => ({ ...recommendation, projectId: project.projectId, projectLabel: project.label })));
    const accounts = projects.flatMap(project => project.accounts.map(account => ({ ...account, projectId: project.projectId, projectLabel: project.label })));
    return {
      id: 'intelligence-control-plane-summary',
      title: 'Department Intelligence Control Plane Summary',
      generatedAt,
      status: blockers.some(blocker => blocker.severity === 'critical' || blocker.severity === 'blocked') || projects.some(project => !project.available) ? 'blocked' : departments.some(department => department.status === 'watch' || department.status === 'stale') ? 'watch' : 'ready',
      liveTradingLocked: true,
      kpis: {
        departments: departments.length,
        projectsAvailable: departmentState.sourceProjectsAvailable,
        projectsTotal: departmentState.sourceProjectsTotal,
        recommendations: recommendations.length,
        blockers: blockers.length,
        accounts: accounts.length,
        cashAvailable: sum(accounts.map(account => account.cashAvailable)),
        buyingPower: sum(accounts.map(account => account.buyingPower)),
        openExposure: sum(accounts.map(account => account.openExposure)),
        dailyPnl: sum(accounts.map(account => account.dailyPnl)),
        totalPnl: sum(accounts.map(account => account.totalPnl)),
      },
      departments,
      accounts,
      blockers,
      recommendations,
      tabs: [
        { id: 'overview', label: 'Overview', status: departmentState.status },
        { id: 'departments', label: 'Departments', status: departmentState.status },
        { id: 'recommendations', label: 'Recommendations', status: recommendations.length ? 'watch' : 'ready' },
        { id: 'blockers', label: 'Blockers', status: blockers.length ? 'blocked' : 'ready' },
        { id: 'accounts', label: 'Accounts', status: accounts.length ? 'ready' : 'watch' },
        { id: 'head-trader', label: 'Head Trader', status: blockers.length ? 'blocked' : 'watch' },
      ],
      safety: {
        recommendationOnly: true,
        liveTradingLocked: true,
        separateAccountCash: true,
        headTraderExecutesOnlyWithExplicitActionPermission: true,
      },
    };
  }

  async function getRecommendations() {
    const summary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-recommendations',
      generatedAt: summary.generatedAt,
      status: summary.status,
      recommendations: summary.recommendations,
    };
  }

  async function getBlockers() {
    const summary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-blockers',
      generatedAt: summary.generatedAt,
      status: summary.blockers.length ? 'blocked' : 'ready',
      blockers: summary.blockers,
    };
  }

  async function getAccounts() {
    const summary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-accounts',
      generatedAt: summary.generatedAt,
      status: summary.accounts.length ? 'ready' : 'watch',
      separateAccountCash: true,
      accounts: summary.accounts,
    };
  }

  async function getDecisionInbox() {
    const summary = await getIntelligenceSummary();
    return mergeDecisionHistory(buildDecisionInbox(summary), readDecisionLedger(decisionLedgerPath));
  }

  async function getHeadTraderSummary() {
    const summary = await getIntelligenceSummary();
    const inbox = mergeDecisionHistory(buildDecisionInbox(summary), readDecisionLedger(decisionLedgerPath));
    return {
      id: 'head-trader-summary',
      title: 'Head Trader Summary',
      generatedAt: summary.generatedAt,
      status: inbox.status,
      role: 'conversation-first decision controller',
      liveTradingLocked: true,
      executionAllowed: false,
      actionPermissions: {
        readFleetState: true,
        explainRecommendation: true,
        requestHumanDecision: true,
        proxyProjectOwnedSafeControls: true,
        submitLiveTrade: false,
      },
      kpis: {
        pendingDecisions: inbox.packets.length,
        blockers: summary.kpis.blockers,
        recommendations: summary.kpis.recommendations,
        accounts: summary.kpis.accounts,
      },
      decisionInbox: inbox.packets,
      blockers: summary.blockers,
      recommendations: summary.recommendations,
    };
  }

  async function snapshotDecisionInbox(input = {}) {
    const summary = await getIntelligenceSummary();
    const inbox = buildDecisionInbox(summary);
    const actorId = typeof input.actorId === 'string' ? input.actorId : 'nous-hermes-control-plane';
    const reason = typeof input.reason === 'string' ? input.reason : 'decision inbox snapshot';
    const records = inbox.packets.map(packet => ({
      type: 'decision_snapshot',
      decisionId: packet.id,
      recordedAt: new Date().toISOString(),
      actorId,
      reason,
      status: packet.conversation?.resolutionStatus ?? 'new',
      packet,
    }));
    appendDecisionLedger(decisionLedgerPath, records);
    return {
      id: 'intelligence-control-plane-decision-snapshot',
      generatedAt: new Date().toISOString(),
      status: 'recorded',
      decisionLedgerPath,
      recorded: records.length,
      decisionIds: records.map(record => record.decisionId),
    };
  }

  async function resolveDecision(input = {}) {
    const decisionId = typeof input.decisionId === 'string' ? input.decisionId : '';
    const resolutionStatus = normalizeResolutionStatus(input.status);
    if (!decisionId) {
      return {
        id: 'intelligence-control-plane-decision-resolution',
        generatedAt: new Date().toISOString(),
        status: 'rejected',
        error: 'decisionId is required',
      };
    }
    const record = {
      type: 'decision_resolution',
      decisionId,
      recordedAt: new Date().toISOString(),
      actorId: typeof input.actorId === 'string' ? input.actorId : 'operator',
      status: resolutionStatus,
      note: typeof input.note === 'string' ? input.note : '',
      channel: typeof input.channel === 'string' ? input.channel : 'chat',
      requiresFollowup: input.requiresFollowup === true,
    };
    appendDecisionLedger(decisionLedgerPath, [record]);
    return {
      id: 'intelligence-control-plane-decision-resolution',
      generatedAt: record.recordedAt,
      status: 'recorded',
      decisionLedgerPath,
      decisionId,
      resolutionStatus,
      record,
    };
  }

  async function getDecisionLedger() {
    const records = readDecisionLedger(decisionLedgerPath);
    return {
      id: 'intelligence-control-plane-decision-ledger',
      generatedAt: new Date().toISOString(),
      status: 'ready',
      decisionLedgerPath,
      records,
      latestByDecision: latestDecisionHistory(records),
    };
  }

  async function getMaturityRoadmap() {
    const summary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-maturity-roadmap',
      title: 'Trading Intelligence Maturity Roadmap',
      generatedAt: summary.generatedAt,
      status: summary.status,
      phases: [
        maturityPhase('v7-decision-workflow', 'Decision Workflow', summary.kpis.blockers ? 'active' : 'ready', [
          'Persist decision lifecycle states.',
          'Attach conversation thread IDs and operator response history.',
          'Expire stale decisions and require renewed evidence before action.',
        ]),
        maturityPhase('v8-cross-system-intelligence', 'Cross-System Trading Intelligence', summary.kpis.accounts >= 2 ? 'active' : 'blocked', [
          'Keep Leon, OANDA, and Khashi cash separate.',
          'Roll up P/L, exposure, open risk, and strategy state into one read model.',
          'Show direction-of-travel over time by system.',
        ]),
        maturityPhase('v9-operator-escalation', 'Operator Escalation', 'planned', [
          'Route decision packets to Discord and Telegram.',
          'Parse approve/reject/defer replies.',
          'Record every response as audit evidence.',
        ]),
        maturityPhase('v10-promotion-governance', 'Promotion Governance', 'active', [
          'Gate watch, shadow, paper, canary, and live stages separately.',
          'Require proof freshness and risk limits per system.',
          'Keep live submit locked until explicit activation.',
        ]),
        maturityPhase('v11-strategy-quality-loop', 'Strategy Quality Loop', 'active', [
          'Compare entry and exit indicator snapshots.',
          'Track false positives, missed opportunities, and realized outcomes.',
          'Separate regime fit from generic strategy performance.',
        ]),
        maturityPhase('v12-portfolio-intelligence', 'Portfolio Intelligence', 'planned', [
          'Add DCF, margin of safety, moat, balance sheet quality, trimming, and rebalancing views.',
          'Keep recommendations suggestive until portfolio approval.',
          'Separate Leon long-term allocation from trading-desk activity.',
        ]),
        maturityPhase('v13-event-desk', 'Event Desk', 'planned', [
          'Track earnings, macro, and contract-specific event risk.',
          'Separate technical signals from event-driven setups.',
          'Record post-event reviews and surprise magnitude.',
        ]),
        maturityPhase('v14-data-reliability-cost', 'Data Reliability and Cost Control', 'active', [
          'Expose raw, rollup, and proof-preserving retention tiers.',
          'Track provider quota and storage growth.',
          'Flag stale or expensive data rails.',
        ]),
        maturityPhase('v15-frontend-contracts', 'Frontend Product Contracts', 'active', [
          'Publish endpoint map, sample payloads, status semantics, and empty/error states.',
          'Document which views are readonly and which require confirmation.',
          'Support multiple frontend implementations without backend guessing.',
        ]),
        maturityPhase('v16-live-readiness', 'Live Trading Readiness', 'blocked', [
          'Require broker proof, canary sizing, kill switches, cancel/replace proof, and explicit unlock.',
          'Keep live submit unavailable from the aggregate control plane.',
          'Promote only after paper/live reconciliation and operator approval.',
        ]),
      ],
      nextActions: [
        'Build durable decision storage before notification reply handling.',
        'Add production endpoint proof after deployment.',
        'Use the frontend contract endpoint as the source for Claude UI work.',
      ],
    };
  }

  async function getStrategyQuality() {
    const summary = await getIntelligenceSummary();
    const strategyDepartments = summary.departments.filter(department => /technical|trader|valuation|portfolio/i.test(department.departmentId));
    return {
      id: 'intelligence-control-plane-strategy-quality',
      title: 'Cross-System Strategy Quality',
      generatedAt: summary.generatedAt,
      status: strategyDepartments.some(department => department.status === 'blocked') ? 'blocked' : strategyDepartments.some(department => department.status === 'watch') ? 'watch' : 'ready',
      strategyDepartments,
      metrics: {
        candidates: sum(strategyDepartments.map(department => department.output?.strategyState?.candidates ?? department.output?.strategyState?.paperCandidates)),
        blockedCandidates: sum(strategyDepartments.map(department => department.output?.strategyState?.blockedCandidates)),
        scoredShadowObservations: sum(strategyDepartments.map(department => department.output?.strategyState?.scoredShadowObservations)),
      },
      requiredEvidence: [
        'entry indicator snapshot',
        'exit indicator snapshot',
        'expected-vs-actual move',
        'spread and slippage context',
        'orderbook/liquidity context when available',
        'paper/live reconciliation before promotion',
      ],
    };
  }

  async function getPromotionGovernance() {
    const summary = await getIntelligenceSummary();
    const policy = buildRiskPolicy(summary);
    const canaryEnabled = policy.gates.every(gate => gate.status === 'pass') && summary.blockers.length === 0;
    return {
      id: 'intelligence-control-plane-promotion-governance',
      title: 'Promotion Governance',
      generatedAt: summary.generatedAt,
      status: 'blocked',
      liveTradingLocked: true,
      stages: [
        promotionStage('watch', true, ['department recommendation', 'fresh enough data']),
        promotionStage('shadow', true, ['strategy trigger evidence', 'risk manager not blocking']),
        promotionStage('paper', true, ['shadow sample quality', 'paper sizing policy', 'operator approval']),
        promotionStage('canary', canaryEnabled, ['broker readonly proof', 'cancel/replace rehearsal', 'paper reconciliation', 'max-loss policy']),
        promotionStage('live', false, ['explicit live unlock', 'kill switch proof', 'daily loss guard', 'human approval']),
      ],
      blockers: summary.blockers,
      riskPolicy: policy,
      safety: {
        aggregatePlaneCanSubmitLiveTrades: false,
        projectOwnedExecutionOnly: true,
        separateBrokerGates: true,
      },
    };
  }

  async function getDataReliability() {
    const summary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-data-reliability',
      title: 'Data Reliability and Cost Control',
      generatedAt: summary.generatedAt,
      status: summary.status,
      retentionTiers: [
        { id: 'raw-fast', purpose: 'short-window trading diagnostics', targetRetention: 'hours to days', storageRisk: 'high' },
        { id: 'candles-rollups', purpose: 'backtest and dashboard charts', targetRetention: 'months', storageRisk: 'medium' },
        { id: 'indicator-snapshots', purpose: 'entry/exit evidence', targetRetention: 'long-lived', storageRisk: 'low' },
        { id: 'proof-artifacts', purpose: 'promotion and audit evidence', targetRetention: 'long-lived', storageRisk: 'low' },
      ],
      freshness: summary.departments.map(department => ({
        projectId: department.projectId,
        departmentId: department.departmentId,
        status: department.dataFreshness?.status ?? 'missing',
        latestDataAt: department.dataFreshness?.latestDataAt ?? null,
        staleReasons: department.dataFreshness?.staleReasons ?? [],
      })),
      recommendedControls: ['storage growth alert', 'provider quota alert', 'rollup freshness proof', 'raw data pruning proof'],
    };
  }

  async function getRiskPolicy() {
    const summary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-risk-policy',
      title: 'Cross-System Risk Policy',
      generatedAt: summary.generatedAt,
      ...buildRiskPolicy(summary),
    };
  }

  async function getLiveFleetProof() {
    const generatedAt = new Date().toISOString();
    const [tradingSummary, intelligenceSummary, departments, inbox, governance, frontendContract] = await Promise.all([
      getSummary(),
      getIntelligenceSummary(),
      getDepartments(),
      getDecisionInbox(),
      getPromotionGovernance(),
      getFrontendContract(),
    ]);
    return {
      id: 'intelligence-control-plane-live-fleet-proof',
      title: 'Readonly Live Fleet Proof',
      generatedAt,
      status: intelligenceSummary.status,
      readonly: true,
      projectSources: tradingSummary.projects.map(project => ({
        projectId: project.projectId,
        available: project.available,
        status: project.status,
        httpStatus: project.httpStatus,
        latencyMs: project.latencyMs,
        error: project.error,
      })),
      assertions: {
        departmentsAvailable: departments.departments.length > 0,
        decisionInboxAvailable: Array.isArray(inbox.packets),
        liveTradingLocked: governance.liveTradingLocked === true,
        frontendContractAvailable: frontendContract.status === 'ready',
      },
      endpointIds: {
        tradingSummary: tradingSummary.id,
        intelligenceSummary: intelligenceSummary.id,
        departments: departments.id,
        decisionInbox: inbox.id,
        promotionGovernance: governance.id,
        frontendContract: frontendContract.id,
      },
    };
  }

  async function getFrontendSamples() {
    const generatedAt = new Date().toISOString();
    const normalSummary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-frontend-samples',
      title: 'Frontend Sample Payloads',
      generatedAt,
      status: 'ready',
      samples: {
        normal: normalSummary,
        empty: sampleSummary('ready', { departments: [], accounts: [], blockers: [], recommendations: [] }),
        stale: sampleSummary('watch', { staleReason: 'Market data freshness exceeded the configured SLA.' }),
        blocked: sampleSummary('blocked', { blockerReason: 'Readonly broker proof is stale.' }),
        partial: sampleSummary('watch', { partialReason: 'Khashi available; Investing System unavailable.' }),
        unavailableSource: {
          id: 'intelligence-control-plane-blockers',
          generatedAt,
          status: 'blocked',
          blockers: [sourceUnavailableBlocker(DEFAULT_SOURCES[0], { error: 'connection refused', status: 0 })],
        },
      },
    };
  }

  async function getEscalationStatus() {
    return {
      id: 'intelligence-control-plane-escalation-status',
      title: 'Head Trader Escalation Status',
      generatedAt: new Date().toISOString(),
      status: messagingTransports().some(transport => transport.configured) ? 'ready' : 'watch',
      transports: messagingTransports(),
      safety: {
        sendsMessagesOnly: true,
        recordsRepliesOnly: true,
        submitLiveTrade: false,
        decisionMutationRequiresAdminToken: true,
      },
      inboundReplyContract: {
        endpoint: '/api/intelligence-control-plane/escalations/reply',
        requiredFields: ['decisionId', 'channel', 'from', 'message'],
        allowedStatuses: ['reviewing', 'approved', 'rejected', 'deferred', 'resolved', 'expired'],
      },
    };
  }

  async function escalateDecision(input = {}) {
    const inbox = await getDecisionInbox();
    const requestedDecisionId = typeof input.decisionId === 'string' ? input.decisionId : null;
    const packet = requestedDecisionId
      ? inbox.packets.find(item => item.id === requestedDecisionId)
      : inbox.packets[0];
    if (!packet) {
      return {
        id: 'intelligence-control-plane-escalation',
        generatedAt: new Date().toISOString(),
        status: 'skipped',
        reason: requestedDecisionId ? `Decision ${requestedDecisionId} was not found.` : 'No decisions are pending escalation.',
        deliveries: [],
      };
    }
    const channels = normalizeChannels(input.channels);
    const message = buildDecisionEscalationMessage(packet);
    const deliveries = [];
    for (const channel of channels) {
      deliveries.push(await deliverEscalation(channel, message, fetchFn));
    }
    const record = {
      type: 'decision_escalation',
      decisionId: packet.id,
      recordedAt: new Date().toISOString(),
      actorId: typeof input.actorId === 'string' ? input.actorId : 'nous-hermes-control-plane',
      status: deliveries.some(delivery => delivery.sent) ? 'sent' : 'skipped',
      channels,
      deliveries,
      messagePreview: message.slice(0, 500),
    };
    appendDecisionLedger(decisionLedgerPath, [record]);
    return {
      id: 'intelligence-control-plane-escalation',
      generatedAt: record.recordedAt,
      status: record.status,
      decisionId: packet.id,
      channels,
      deliveries,
      record,
    };
  }

  async function recordEscalationReply(input = {}) {
    const decisionId = typeof input.decisionId === 'string' ? input.decisionId : '';
    if (!decisionId) {
      return {
        id: 'intelligence-control-plane-escalation-reply',
        generatedAt: new Date().toISOString(),
        status: 'rejected',
        error: 'decisionId is required',
      };
    }
    const status = normalizeReplyStatus(input.status ?? input.message);
    const record = {
      type: 'decision_reply',
      decisionId,
      recordedAt: new Date().toISOString(),
      actorId: typeof input.from === 'string' ? input.from : typeof input.actorId === 'string' ? input.actorId : 'operator',
      channel: typeof input.channel === 'string' ? input.channel : 'chat',
      status,
      message: typeof input.message === 'string' ? input.message : '',
      raw: input,
    };
    appendDecisionLedger(decisionLedgerPath, [record]);
    return {
      id: 'intelligence-control-plane-escalation-reply',
      generatedAt: record.recordedAt,
      status: 'recorded',
      decisionId,
      replyStatus: status,
      record,
    };
  }

  async function getPortfolioIntelligence() {
    const summary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-portfolio-intelligence',
      title: 'Leon Portfolio Intelligence',
      generatedAt: summary.generatedAt,
      status: summary.departments.some(department => department.departmentId === 'portfolio_manager') ? 'watch' : 'blocked',
      scope: 'Leon only; OANDA and Khashi remain separate trading departments.',
      accounts: summary.accounts.filter(account => account.system === 'leon' || account.accountId === 'leon'),
      requiredModules: ['DCF', 'margin of safety', 'moat scoring', 'balance sheet quality', 'correlation', 'trimming', 'rebalancing', 'cash deployment policy'],
      recommendations: summary.recommendations.filter(recommendation => recommendation.projectId === 'investing-system'),
    };
  }

  async function getEventDesk() {
    const summary = await getIntelligenceSummary();
    const eventDepartments = summary.departments.filter(department => department.departmentId === 'event_desk');
    return {
      id: 'intelligence-control-plane-event-desk',
      title: 'Event Desk',
      generatedAt: summary.generatedAt,
      status: eventDepartments.length ? 'watch' : 'blocked',
      departments: eventDepartments,
      eventTypes: ['earnings', 'macro', 'broker-specific', 'contract-specific', 'news catalyst'],
      requiredControls: ['pre-event risk lockout', 'post-event review', 'surprise magnitude', 'buy-the-rumor/sell-the-news tag'],
    };
  }

  async function getFrontendContract() {
    const summary = await getIntelligenceSummary();
    return {
      id: 'intelligence-control-plane-frontend-contract',
      title: 'Frontend Contract for Trading Intelligence Control Plane',
      generatedAt: summary.generatedAt,
      status: 'ready',
      endpoints: intelligenceControlPlaneEndpoints(),
      statusSemantics: {
        ready: 'Complete enough for normal readonly operation.',
        watch: 'Usable with attention or missing maturity evidence.',
        blocked: 'Must be resolved before promotion or higher-risk action.',
        critical: 'Immediate operator attention required.',
      },
      requiredStates: ['loading', 'empty', 'partial', 'stale', 'blocked', 'error'],
      pageModel: [
        { id: 'overview', primaryEndpoints: ['/api/intelligence-control-plane/summary', '/api/intelligence-control-plane/head-trader/summary'] },
        { id: 'decisions', primaryEndpoints: ['/api/intelligence-control-plane/decision-inbox', '/api/intelligence-control-plane/blockers', '/api/intelligence-control-plane/recommendations'] },
        { id: 'accounts-risk', primaryEndpoints: ['/api/intelligence-control-plane/accounts', '/api/intelligence-control-plane/promotion-governance'] },
        { id: 'strategy-quality', primaryEndpoints: ['/api/intelligence-control-plane/strategy-quality'] },
        { id: 'data-reliability', primaryEndpoints: ['/api/intelligence-control-plane/data-reliability'] },
        { id: 'portfolio-intelligence', primaryEndpoints: ['/api/intelligence-control-plane/portfolio-intelligence'] },
        { id: 'event-desk', primaryEndpoints: ['/api/intelligence-control-plane/event-desk'] },
      ],
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

  return {
    getSummary,
    getEvents,
    getControls,
    getCredentialReadiness,
    requestControl,
    getDepartments,
    getIntelligenceSummary,
    getRecommendations,
    getBlockers,
    getAccounts,
    getDecisionInbox,
    getHeadTraderSummary,
    snapshotDecisionInbox,
    resolveDecision,
    getDecisionLedger,
    getMaturityRoadmap,
    getStrategyQuality,
    getPromotionGovernance,
    getDataReliability,
    getRiskPolicy,
    getLiveFleetProof,
    getFrontendSamples,
    getEscalationStatus,
    escalateDecision,
    recordEscalationReply,
    getPortfolioIntelligence,
    getEventDesk,
    getFrontendContract,
  };
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
      if (request.method === 'GET' && url.pathname === '/api/trading-intelligence/credential-readiness') {
        return sendJson(response, 200, await service.getCredentialReadiness());
      }
      if (request.method === 'GET' && url.pathname === '/api/trading-intelligence/frontend-spec') {
        return sendJson(response, 200, frontendSpec());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/summary') {
        return sendJson(response, 200, await service.getIntelligenceSummary());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/departments') {
        return sendJson(response, 200, await service.getDepartments());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/recommendations') {
        return sendJson(response, 200, await service.getRecommendations());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/blockers') {
        return sendJson(response, 200, await service.getBlockers());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/accounts') {
        return sendJson(response, 200, await service.getAccounts());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/decision-inbox') {
        return sendJson(response, 200, await service.getDecisionInbox());
      }
      if (request.method === 'POST' && url.pathname === '/api/intelligence-control-plane/decision-inbox/snapshot') {
        const authResult = requireControlPlaneAdmin(request);
        if (!authResult.ok) return sendJson(response, authResult.status, { error: authResult.error });
        return sendJson(response, 200, await service.snapshotDecisionInbox(await readJson(request)));
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/decisions') {
        return sendJson(response, 200, await service.getDecisionLedger());
      }
      if (request.method === 'POST' && url.pathname === '/api/intelligence-control-plane/decisions/resolve') {
        const authResult = requireControlPlaneAdmin(request);
        if (!authResult.ok) return sendJson(response, authResult.status, { error: authResult.error });
        return sendJson(response, 200, await service.resolveDecision(await readJson(request)));
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/head-trader/summary') {
        return sendJson(response, 200, await service.getHeadTraderSummary());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/maturity-roadmap') {
        return sendJson(response, 200, await service.getMaturityRoadmap());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/strategy-quality') {
        return sendJson(response, 200, await service.getStrategyQuality());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/promotion-governance') {
        return sendJson(response, 200, await service.getPromotionGovernance());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/data-reliability') {
        return sendJson(response, 200, await service.getDataReliability());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/risk-policy') {
        return sendJson(response, 200, await service.getRiskPolicy());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/live-fleet-proof') {
        return sendJson(response, 200, await service.getLiveFleetProof());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/frontend-samples') {
        return sendJson(response, 200, await service.getFrontendSamples());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/escalations/status') {
        return sendJson(response, 200, await service.getEscalationStatus());
      }
      if (request.method === 'POST' && url.pathname === '/api/intelligence-control-plane/escalations/send') {
        const authResult = requireControlPlaneAdmin(request);
        if (!authResult.ok) return sendJson(response, authResult.status, { error: authResult.error });
        return sendJson(response, 200, await service.escalateDecision(await readJson(request)));
      }
      if (request.method === 'POST' && url.pathname === '/api/intelligence-control-plane/escalations/reply') {
        const authResult = requireControlPlaneAdmin(request);
        if (!authResult.ok) return sendJson(response, authResult.status, { error: authResult.error });
        return sendJson(response, 200, await service.recordEscalationReply(await readJson(request)));
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/portfolio-intelligence') {
        return sendJson(response, 200, await service.getPortfolioIntelligence());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/event-desk') {
        return sendJson(response, 200, await service.getEventDesk());
      }
      if (request.method === 'GET' && url.pathname === '/api/intelligence-control-plane/frontend-contract') {
        return sendJson(response, 200, await service.getFrontendContract());
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
      { method: 'GET', path: '/api/intelligence-control-plane/summary', purpose: 'Department, account, blocker, recommendation, and Head Trader readiness summary.' },
      { method: 'GET', path: '/api/intelligence-control-plane/departments', purpose: 'Raw department outputs from Investing System and Khashi VC.' },
      { method: 'GET', path: '/api/intelligence-control-plane/recommendations', purpose: 'Recommendation-only cross-project work queue.' },
      { method: 'GET', path: '/api/intelligence-control-plane/blockers', purpose: 'Cross-project blocker register.' },
      { method: 'GET', path: '/api/intelligence-control-plane/accounts', purpose: 'Separate account awareness for Leon, OANDA, Khashi, and other configured accounts.' },
      { method: 'GET', path: '/api/intelligence-control-plane/decision-inbox', purpose: 'Head Trader decision packets derived from recommendations and blockers.' },
      { method: 'POST', path: '/api/intelligence-control-plane/decision-inbox/snapshot', purpose: 'Admin-token gated persistence of the current decision inbox as audit records.' },
      { method: 'GET', path: '/api/intelligence-control-plane/decisions', purpose: 'Read the durable Head Trader decision ledger.' },
      { method: 'POST', path: '/api/intelligence-control-plane/decisions/resolve', purpose: 'Admin-token gated operator resolution for a decision packet.' },
      { method: 'GET', path: '/api/intelligence-control-plane/head-trader/summary', purpose: 'Conversation-first Head Trader controller state and explicit action permissions.' },
      { method: 'GET', path: '/api/intelligence-control-plane/maturity-roadmap', purpose: 'V7-V16 maturity roadmap and current build phase status.' },
      { method: 'GET', path: '/api/intelligence-control-plane/strategy-quality', purpose: 'Cross-system strategy quality evidence requirements and metrics.' },
      { method: 'GET', path: '/api/intelligence-control-plane/promotion-governance', purpose: 'Watch, shadow, paper, canary, and live promotion stages and blockers.' },
      { method: 'GET', path: '/api/intelligence-control-plane/data-reliability', purpose: 'Freshness, retention tiers, and cost/storage posture.' },
      { method: 'GET', path: '/api/intelligence-control-plane/risk-policy', purpose: 'Computed cross-system risk policy gates and thresholds.' },
      { method: 'GET', path: '/api/intelligence-control-plane/live-fleet-proof', purpose: 'Readonly proof that real configured project sources and aggregate endpoints are reachable.' },
      { method: 'GET', path: '/api/intelligence-control-plane/frontend-samples', purpose: 'Normal, empty, stale, blocked, partial, and unavailable-source sample payloads.' },
      { method: 'GET', path: '/api/intelligence-control-plane/escalations/status', purpose: 'Discord and Telegram escalation readiness without exposing secrets.' },
      { method: 'POST', path: '/api/intelligence-control-plane/escalations/send', purpose: 'Admin-token gated outbound decision escalation to Discord and/or Telegram.' },
      { method: 'POST', path: '/api/intelligence-control-plane/escalations/reply', purpose: 'Admin-token gated inbound reply/audit recording for Discord, Telegram, or chat.' },
      { method: 'GET', path: '/api/intelligence-control-plane/portfolio-intelligence', purpose: 'Leon-only portfolio intelligence planning surface.' },
      { method: 'GET', path: '/api/intelligence-control-plane/event-desk', purpose: 'Separated event desk planning and readiness surface.' },
      { method: 'GET', path: '/api/intelligence-control-plane/frontend-contract', purpose: 'Stable endpoint map, status semantics, required UI states, and page model for frontend builders.' },
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

function buildDecisionInbox(summary) {
  const recommendationPackets = summary.recommendations.map(recommendationToDecisionPacket);
  const blockerPackets = summary.blockers.map(blockerToDecisionPacket);
  return {
    id: 'intelligence-control-plane-decision-inbox',
    title: 'Head Trader Decision Inbox',
    generatedAt: summary.generatedAt,
    status: blockerPackets.length ? 'blocked' : recommendationPackets.length ? 'watch' : 'ready',
    liveTradingLocked: true,
    executionAllowed: false,
    packets: [...blockerPackets, ...recommendationPackets],
  };
}

function messagingTransports() {
  const discordWebhook = process.env.NOUS_DISCORD_WEBHOOK_URL ?? process.env.DISCORD_WEBHOOK_URL ?? '';
  const telegramToken = process.env.NOUS_TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? '';
  const telegramChats = csv(process.env.NOUS_TELEGRAM_CHAT_IDS ?? process.env.TELEGRAM_ALERT_CHAT_IDS ?? process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? '');
  return [
    {
      channel: 'discord',
      configured: Boolean(discordWebhook),
      delivery: 'webhook',
      requiredEnv: ['NOUS_DISCORD_WEBHOOK_URL or DISCORD_WEBHOOK_URL'],
      secretsExposed: false,
    },
    {
      channel: 'telegram',
      configured: Boolean(telegramToken && telegramChats.length),
      delivery: 'bot-api',
      requiredEnv: ['NOUS_TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN', 'NOUS_TELEGRAM_CHAT_IDS or TELEGRAM_ALERT_CHAT_IDS'],
      chatCount: telegramChats.length,
      secretsExposed: false,
    },
  ];
}

function normalizeChannels(value) {
  const channels = Array.isArray(value) ? value : ['discord', 'telegram'];
  const allowed = new Set(['discord', 'telegram']);
  const normalized = channels.map(channel => String(channel).toLowerCase()).filter(channel => allowed.has(channel));
  return normalized.length ? [...new Set(normalized)] : ['discord', 'telegram'];
}

function buildDecisionEscalationMessage(packet) {
  return [
    'Head Trader decision needed',
    `Decision: ${packet.id}`,
    `Type: ${packet.decisionType}`,
    `Subject: ${packet.subjectType}:${packet.subjectId}`,
    `Risk: ${packet.riskState}`,
    `Summary: ${packet.summary}`,
    `Recommended action: ${packet.recommendedAction}`,
    `Question: ${packet.conversation?.operatorQuestion ?? 'How should this be handled?'}`,
    `Options: ${(packet.conversation?.defaultResponseOptions ?? []).join(', ')}`,
    'Live trading remains locked. Reply handling records operator intent only.',
  ].join('\n');
}

async function deliverEscalation(channel, message, fetchFn) {
  if (channel === 'discord') return deliverDiscordEscalation(message, fetchFn);
  if (channel === 'telegram') return deliverTelegramEscalation(message, fetchFn);
  return { channel, attempted: false, sent: false, skipped: true, reason: 'unsupported channel', statusCode: null };
}

async function deliverDiscordEscalation(message, fetchFn) {
  const webhookUrl = process.env.NOUS_DISCORD_WEBHOOK_URL ?? process.env.DISCORD_WEBHOOK_URL ?? '';
  if (!webhookUrl) {
    return { channel: 'discord', attempted: false, sent: false, skipped: true, reason: 'NOUS_DISCORD_WEBHOOK_URL or DISCORD_WEBHOOK_URL is not configured', statusCode: null };
  }
  try {
    const response = await fetchFn(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: message.slice(0, 1900) }),
    });
    const body = await response.text().catch(() => '');
    return {
      channel: 'discord',
      attempted: true,
      sent: response.ok,
      skipped: false,
      reason: response.ok ? null : `Discord returned ${response.status}: ${body.slice(0, 240)}`,
      statusCode: response.status,
    };
  } catch (error) {
    return { channel: 'discord', attempted: true, sent: false, skipped: false, reason: error instanceof Error ? error.message : String(error), statusCode: null };
  }
}

async function deliverTelegramEscalation(message, fetchFn) {
  const token = process.env.NOUS_TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? '';
  const chatIds = csv(process.env.NOUS_TELEGRAM_CHAT_IDS ?? process.env.TELEGRAM_ALERT_CHAT_IDS ?? process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? '');
  if (!token || !chatIds.length) {
    return { channel: 'telegram', attempted: false, sent: false, skipped: true, reason: 'Telegram bot token or chat IDs are not configured', statusCode: null, chatCount: chatIds.length };
  }
  const deliveries = [];
  for (const chatId of chatIds.slice(0, 5)) {
    try {
      const response = await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message.slice(0, 3500) }),
      });
      const body = await response.text().catch(() => '');
      deliveries.push({
        chatId,
        sent: response.ok,
        reason: response.ok ? null : `Telegram returned ${response.status}: ${body.slice(0, 240)}`,
        statusCode: response.status,
      });
    } catch (error) {
      deliveries.push({ chatId, sent: false, reason: error instanceof Error ? error.message : String(error), statusCode: null });
    }
  }
  return {
    channel: 'telegram',
    attempted: true,
    sent: deliveries.some(delivery => delivery.sent),
    skipped: false,
    reason: deliveries.every(delivery => delivery.sent) ? null : 'One or more Telegram deliveries failed.',
    statusCode: deliveries.find(delivery => delivery.statusCode)?.statusCode ?? null,
    chatCount: deliveries.length,
    deliveries,
  };
}

function normalizeReplyStatus(value) {
  if (value === 'reviewing' || value === 'approved' || value === 'rejected' || value === 'deferred' || value === 'resolved' || value === 'expired') return value;
  const text = String(value ?? '').toLowerCase();
  if (text.includes('approve')) return 'approved';
  if (text.includes('reject')) return 'rejected';
  if (text.includes('defer') || text.includes('wait')) return 'deferred';
  if (text.includes('resolve')) return 'resolved';
  return 'reviewing';
}

function csv(value) {
  return String(value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function loadGlobalEnvIntoProcess(env = process.env) {
  const values = readGlobalEnv(env.HERMES_GLOBAL_ENV_PATH);
  for (const [key, value] of Object.entries(values)) {
    if (env[key] === undefined) env[key] = value;
  }
}

function readGlobalEnv(filePath = path.join(process.env.HOME ?? '', '.hermes.env')) {
  if (!filePath || !fs.existsSync(filePath)) return {};
  const values = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const assignment = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed;
    const equalsIndex = assignment.indexOf('=');
    if (equalsIndex <= 0) continue;
    const key = assignment.slice(0, equalsIndex).trim();
    if (!GLOBAL_ENV_KEYS.has(key)) continue;
    values[key] = unquoteEnvValue(assignment.slice(equalsIndex + 1).trim());
  }
  return values;
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function mergeDecisionHistory(inbox, records) {
  const latest = latestDecisionHistory(records);
  return {
    ...inbox,
    persistence: {
      enabled: true,
      snapshotCount: records.filter(record => record.type === 'decision_snapshot').length,
      resolutionCount: records.filter(record => record.type === 'decision_resolution').length,
    },
    packets: inbox.packets.map(packet => {
      const history = latest[packet.id];
      if (!history) return packet;
      return {
        ...packet,
        conversation: {
          ...packet.conversation,
          resolutionStatus: history.status ?? packet.conversation?.resolutionStatus ?? 'new',
          resolvedAt: history.type === 'decision_resolution' ? history.recordedAt : packet.conversation?.resolvedAt ?? null,
          latestRecord: history,
        },
      };
    }),
  };
}

function readDecisionLedger(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function appendDecisionLedger(filePath, records) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${records.map(record => JSON.stringify(record)).join('\n')}\n`);
}

function latestDecisionHistory(records) {
  const latest = {};
  for (const record of records) {
    if (!record?.decisionId) continue;
    const current = latest[record.decisionId];
    if (!current || Date.parse(record.recordedAt ?? '') >= Date.parse(current.recordedAt ?? '')) {
      latest[record.decisionId] = record;
    }
  }
  return latest;
}

function normalizeResolutionStatus(value) {
  if (value === 'reviewing' || value === 'approved' || value === 'rejected' || value === 'deferred' || value === 'resolved' || value === 'expired') return value;
  return 'reviewing';
}

function buildRiskPolicy(summary) {
  const dailyPnl = numberOrNull(summary.kpis.dailyPnl) ?? 0;
  const openExposure = numberOrNull(summary.kpis.openExposure) ?? 0;
  const buyingPower = numberOrNull(summary.kpis.buyingPower) ?? 0;
  const maxDailyLoss = Number(process.env.INTELLIGENCE_MAX_DAILY_LOSS_USD ?? 250);
  const maxOpenExposure = Number(process.env.INTELLIGENCE_MAX_OPEN_EXPOSURE_USD ?? 1000);
  const minBuyingPower = Number(process.env.INTELLIGENCE_MIN_BUYING_POWER_USD ?? 0);
  const gates = [
    riskGate('daily-loss', dailyPnl >= -Math.abs(maxDailyLoss), `Daily P/L ${dailyPnl} must stay above -${Math.abs(maxDailyLoss)}.`),
    riskGate('open-exposure', openExposure <= maxOpenExposure, `Open exposure ${openExposure} must stay at or below ${maxOpenExposure}.`),
    riskGate('buying-power', buyingPower >= minBuyingPower, `Buying power ${buyingPower} must stay at or above ${minBuyingPower}.`),
    riskGate('blockers-clear', summary.blockers.length === 0, `${summary.blockers.length} blocker(s) must clear before canary/live promotion.`),
  ];
  return {
    status: gates.some(gate => gate.status === 'block') ? 'blocked' : 'pass',
    thresholds: {
      maxDailyLossUsd: maxDailyLoss,
      maxOpenExposureUsd: maxOpenExposure,
      minBuyingPowerUsd: minBuyingPower,
    },
    observed: {
      dailyPnl,
      openExposure,
      buyingPower,
      blockers: summary.blockers.length,
    },
    gates,
  };
}

function riskGate(id, passed, detail) {
  return {
    id,
    status: passed ? 'pass' : 'block',
    detail,
    overrideAllowed: false,
  };
}

function sampleSummary(status, options = {}) {
  const generatedAt = new Date().toISOString();
  const blocker = options.blockerReason
    ? [{
        id: 'sample-blocker',
        blockingDepartment: 'head_trader',
        scope: 'global',
        severity: 'blocked',
        reason: options.blockerReason,
        evidenceIds: [],
        affectedRecommendations: [],
        requiredResolution: 'Resolve sample blocker.',
        overrideAllowed: false,
      }]
    : [];
  const departments = options.departments ?? [{
    departmentId: 'head_trader',
    status,
    dataFreshness: {
      status: options.staleReason ? 'stale' : options.partialReason ? 'partial' : 'fresh',
      latestDataAt: generatedAt,
      staleReasons: [options.staleReason, options.partialReason].filter(Boolean),
    },
    recommendations: [],
    blockers: blocker,
    output: {},
  }];
  return {
    id: `sample-${status}-summary`,
    generatedAt,
    status,
    liveTradingLocked: true,
    kpis: {
      departments: departments.length,
      accounts: options.accounts?.length ?? 0,
      recommendations: options.recommendations?.length ?? 0,
      blockers: blocker.length,
    },
    departments,
    accounts: options.accounts ?? [],
    blockers: options.blockers ?? blocker,
    recommendations: options.recommendations ?? [],
  };
}

function maturityPhase(id, label, status, requiredWork) {
  return {
    id,
    label,
    status,
    requiredWork,
    blocksLiveTrading: id === 'v16-live-readiness' || id === 'v10-promotion-governance',
  };
}

function promotionStage(id, enabled, requirements) {
  return {
    id,
    enabled,
    status: enabled ? 'available' : 'locked',
    requirements,
    humanApprovalRequired: id !== 'watch',
    executionAllowed: enabled && id !== 'canary' && id !== 'live',
  };
}

function intelligenceControlPlaneEndpoints() {
  return [
    '/api/intelligence-control-plane/summary',
    '/api/intelligence-control-plane/departments',
    '/api/intelligence-control-plane/recommendations',
    '/api/intelligence-control-plane/blockers',
    '/api/intelligence-control-plane/accounts',
    '/api/intelligence-control-plane/decision-inbox',
    '/api/intelligence-control-plane/decision-inbox/snapshot',
    '/api/intelligence-control-plane/decisions',
    '/api/intelligence-control-plane/decisions/resolve',
    '/api/intelligence-control-plane/head-trader/summary',
    '/api/intelligence-control-plane/maturity-roadmap',
    '/api/intelligence-control-plane/strategy-quality',
    '/api/intelligence-control-plane/promotion-governance',
    '/api/intelligence-control-plane/data-reliability',
    '/api/intelligence-control-plane/risk-policy',
    '/api/intelligence-control-plane/live-fleet-proof',
    '/api/intelligence-control-plane/frontend-samples',
    '/api/intelligence-control-plane/escalations/status',
    '/api/intelligence-control-plane/escalations/send',
    '/api/intelligence-control-plane/escalations/reply',
    '/api/intelligence-control-plane/portfolio-intelligence',
    '/api/intelligence-control-plane/event-desk',
    '/api/intelligence-control-plane/frontend-contract',
  ];
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

function sourceUnavailableBlocker(source, result) {
  return {
    id: `${source.projectId}-department-source-unavailable`,
    blockingDepartment: 'head_trader',
    scope: 'global',
    severity: 'blocked',
    reason: `${source.label} department endpoint is unavailable: ${result.error ?? `HTTP ${result.status}`}`,
    evidenceIds: [source.routes.departments ?? source.routes.summary],
    affectedRecommendations: [],
    requiredResolution: `Verify ${source.label} service health, auth token, and department route before relying on aggregate decisions.`,
    overrideAllowed: false,
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

function normalizeDepartmentPayload(payload, source) {
  if (!payload) return [];
  const rawDepartments = Array.isArray(payload.departments) ? payload.departments : [payload];
  return rawDepartments
    .filter(department => department && typeof department === 'object' && department.departmentId)
    .map(department => ({
      ...department,
      sourceProject: source.projectId,
      projectLabel: source.label,
      status: normalizeProjectStatus(department.status),
    }));
}

function collectRecommendations(payload, departments) {
  return uniqueById([
    ...asArray(payload?.recommendations),
    ...departments.flatMap(department => asArray(department.recommendations)),
  ].map((recommendation, index) => ({
    id: String(recommendation?.id ?? `recommendation-${index + 1}`),
    departmentId: String(recommendation?.departmentId ?? 'head_trader'),
    subjectType: String(recommendation?.subjectType ?? 'portfolio'),
    subjectId: String(recommendation?.subjectId ?? 'unknown'),
    recommendationType: String(recommendation?.recommendationType ?? 'watch'),
    confidence: normalizeConfidence(recommendation?.confidence),
    urgency: normalizeUrgency(recommendation?.urgency),
    rationale: asStringArray(recommendation?.rationale),
    evidenceIds: asStringArray(recommendation?.evidenceIds),
    risks: asStringArray(recommendation?.risks),
    blockers: asStringArray(recommendation?.blockers),
    nextAction: String(recommendation?.nextAction ?? 'Review with the responsible department.'),
    requiresHumanApproval: recommendation?.requiresHumanApproval !== false,
    executionAllowed: recommendation?.executionAllowed === true,
    createdAt: normalizeDate(recommendation?.createdAt),
  })));
}

function collectBlockers(payload, departments) {
  return uniqueById([
    ...asArray(payload?.blockers),
    ...departments.flatMap(department => asArray(department.blockers)),
  ].map((blocker, index) => typeof blocker === 'string'
    ? {
        id: `blocker-${index + 1}`,
        blockingDepartment: 'head_trader',
        scope: 'global',
        severity: 'blocked',
        reason: blocker,
        evidenceIds: [],
        affectedRecommendations: [],
        requiredResolution: 'Inspect the source project and refresh proof before promotion.',
        overrideAllowed: false,
      }
    : {
        id: String(blocker?.id ?? `blocker-${index + 1}`),
        blockingDepartment: String(blocker?.blockingDepartment ?? 'head_trader'),
        scope: String(blocker?.scope ?? 'global'),
        severity: normalizeBlockerSeverity(blocker?.severity),
        reason: String(blocker?.reason ?? 'Unspecified blocker.'),
        evidenceIds: asStringArray(blocker?.evidenceIds),
        affectedRecommendations: asStringArray(blocker?.affectedRecommendations),
        requiredResolution: String(blocker?.requiredResolution ?? 'Resolve before promotion.'),
        overrideAllowed: blocker?.overrideAllowed === true,
      }));
}

function uniqueById(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = item?.id ?? JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function collectAccounts(payload, departments) {
  const accounts = [
    ...asArray(payload?.accounts),
    ...asArray(payload?.accountRisks),
    ...departments.flatMap(department => {
      const output = department.output && typeof department.output === 'object' ? department.output : {};
      return [
        ...asArray(output.accounts),
        ...asArray(output.accountRisks),
        output.accountAwareness,
      ];
    }),
  ]
    .filter(account => account && typeof account === 'object')
    .map((account, index) => ({
      accountId: String(account.accountId ?? account.id ?? `account-${index + 1}`),
      system: String(account.system ?? account.accountId ?? 'unknown'),
      cashAvailable: numberOrNull(account.cashAvailable ?? account.cashUsd ?? account.cashLeftUsd),
      buyingPower: numberOrNull(account.buyingPower ?? account.buyingPowerUsd),
      openExposure: numberOrNull(account.openExposure ?? account.openRiskUsd),
      leverage: numberOrNull(account.leverage),
      dailyPnl: numberOrNull(account.dailyPnl ?? account.realizedPnlTodayUsd),
      totalPnl: numberOrNull(account.totalPnl ?? account.realizedPnlUsd),
      riskState: String(account.riskState ?? 'watch'),
      updatedAt: normalizeDate(account.updatedAt),
    }));
  return uniqueAccounts(accounts);
}

function recommendationToDecisionPacket(recommendation) {
  return {
    id: `decision-${recommendation.id}`,
    sourceDepartment: recommendation.departmentId,
    decisionType: recommendationDecisionType(recommendation.recommendationType),
    subjectType: recommendation.subjectType,
    subjectId: recommendation.subjectId,
    title: `${recommendation.departmentId} ${recommendation.recommendationType} ${recommendation.subjectId}`,
    summary: recommendation.rationale[0] ?? recommendation.nextAction,
    recommendedAction: recommendation.nextAction,
    availableActions: ['explain', 'request_more_evidence', 'mark_reviewed', 'defer'],
    conversation: {
      threadId: null,
      preferredChannels: ['chat', 'discord', 'telegram'],
      operatorQuestion: `How should ${recommendation.subjectId} be handled?`,
      defaultResponseOptions: ['approve_for_next_stage', 'reject', 'request_more_evidence', 'defer'],
      resolutionStatus: 'new',
      resolvedAt: null,
    },
    confidence: recommendation.confidence,
    urgency: recommendation.urgency,
    riskState: recommendation.blockers.length ? 'blocked' : recommendation.risks.length ? 'watch' : 'clear',
    blockers: [],
    evidenceIds: recommendation.evidenceIds,
    requiresHumanApproval: true,
    executionAllowed: false,
    createdAt: recommendation.createdAt,
  };
}

function blockerToDecisionPacket(blocker) {
  return {
    id: `decision-${blocker.id}`,
    sourceDepartment: blocker.blockingDepartment,
    decisionType: 'risk_block',
    subjectType: 'portfolio',
    subjectId: blocker.scope,
    title: `Resolve ${blocker.scope} blocker`,
    summary: blocker.reason,
    recommendedAction: blocker.requiredResolution,
    availableActions: ['explain', 'open_source_project', 'request_proof_refresh', 'defer'],
    conversation: {
      threadId: null,
      preferredChannels: ['chat', 'discord', 'telegram'],
      operatorQuestion: `Should the system attempt to resolve this ${blocker.scope} blocker now?`,
      defaultResponseOptions: ['resolve_now', 'defer', 'request_more_context'],
      resolutionStatus: 'new',
      resolvedAt: null,
    },
    confidence: 'high',
    urgency: blocker.severity === 'critical' ? 'high' : 'medium',
    riskState: blocker.severity,
    blockers: [blocker],
    evidenceIds: blocker.evidenceIds,
    requiresHumanApproval: true,
    executionAllowed: false,
    createdAt: new Date().toISOString(),
  };
}

function uniqueAccounts(accounts) {
  const seen = new Set();
  const output = [];
  for (const account of accounts) {
    const key = `${account.projectId ?? ''}:${account.system}:${account.accountId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(account);
  }
  return output;
}

function recommendationDecisionType(type) {
  if (type === 'buy') return 'buy_recommendation';
  if (type === 'trim') return 'trim_recommendation';
  if (type === 'rebalance') return 'rebalance_recommendation';
  if (type === 'avoid') return 'avoid';
  if (type === 'research_deeper') return 'research_deeper';
  if (type === 'review') return 'human_decision_required';
  return 'watch';
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.length > 0) : [];
}

function normalizeConfidence(value) {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

function normalizeUrgency(value) {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

function normalizeBlockerSeverity(value) {
  return value === 'critical' || value === 'blocked' || value === 'watch' ? value : 'blocked';
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

function requireControlPlaneAdmin(request) {
  const expected = process.env.INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN ?? process.env.TRADING_INTELLIGENCE_ADMIN_TOKEN ?? '';
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: 'INTELLIGENCE_CONTROL_PLANE_ADMIN_TOKEN is required before decision mutations are enabled.',
    };
  }
  const actual = String(request.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (actual !== expected) {
    return {
      ok: false,
      status: 401,
      error: 'control-plane admin authorization required',
    };
  }
  return { ok: true };
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
