/* ------------------------------------------------------------------
 * Trading Intelligence Control Plane — prototype fixture
 *
 * Field names are taken verbatim from the real producers, NOT from the
 * handoff spec, so the prototypes fail the same way production will:
 *   investing-system : src/trading-desk/oanda.ts
 *                      getInvestingTradingCommandCenterSummary / Events / Controls
 *   khashi-vc        : src/web/roc-api.ts
 *                      tradingCommandCenterSummary / Events / Controls
 *   aggregation      : hermes_cli/trading_intelligence.py
 *
 * Shape mirrors the state described in the handoff §24:
 *   projectsAvailable 2/2 · investing=watch · khashi=blocked · fleet=blocked
 * ------------------------------------------------------------------ */
const TI = (() => {
  const now = new Date();
  const iso = (minutesAgo) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

  /* --- investing-system: note realizedPnlToday is a GENUINE 0. -------
     Before the _first_number fix this collapsed through the `or` chain
     into strategyGrossPnl and the ribbon showed -412.5 blended in. */
  const investing = {
    projectId: "investing-system",
    label: "Investing System",
    sourceBaseUrl: "http://investing-system:3102",
    available: true,
    httpStatus: 200,
    latencyMs: 214,
    error: null,
    status: "watch",
    liveTradingLocked: true,
    kpis: {
      runtimeRunning: true,
      runtimeStale: false,
      openTrades: 3,
      openOrders: 1,
      unprotectedOpenTrades: 0,
      realizedPnlToday: 0,
      strategyGrossPnl: -412.5,
      reviewedTrades: 0,
      usableLearningTrades: 4,
      learningProgressPct: 26.7,
      latestTradeExplanationReady: true,
    },
    tabs: [
      { id: "overview", label: "Overview", status: "watch", sourceRoutes: ["/trading-desk/cross-broker/overview", "/trading-desk/oanda/system-truth"] },
      { id: "oanda", label: "OANDA", status: "watch", sourceRoutes: ["/trading-desk/oanda/runtime-service-status"] },
      { id: "risk", label: "Risk", status: "ready", sourceRoutes: ["/trading-desk/oanda/pnl-risk"] },
      { id: "pnl", label: "P/L", status: "watch", sourceRoutes: ["/trading-desk/oanda/trading-reporting-command-center"] },
      { id: "strategy", label: "Strategy", status: "blocked", sourceRoutes: ["/trading-desk/oanda/trade-explanation"] },
      { id: "events", label: "Events", status: "ready", sourceRoutes: ["/trading-desk/command-center/events"] },
      { id: "controls", label: "Controls", status: "ready", sourceRoutes: ["/trading-desk/command-center/controls"] },
    ],
    blockers: [
      "Broker lifecycle sync has 2 exits submitted but not broker-confirmed.",
      "Learning sample is below the minimum usable trade count; strategy scoring is not yet trustworthy.",
    ],
    recommendations: [
      "Run broker lifecycle sync and reconcile submitted exits before treating exit automation as healthy.",
      "Collect closed broker trades before judging strategy quality.",
      "Backfill risk snapshots so R-multiple and risk-adjusted reporting are trustworthy.",
    ],
    sourceRoutes: {
      overview: "/trading-desk/cross-broker/overview",
      reporting: "/trading-desk/oanda/trading-reporting-command-center",
      runtime: "/trading-desk/oanda/runtime-service-status",
      controls: "/trading-desk/command-center/controls",
      events: "/trading-desk/command-center/events",
    },
    summary: { mode: "practice", note: "Full source payload elided in the prototype fixture." },
  };

  const khashi = {
    projectId: "khashi-vc",
    label: "Khashi VC",
    sourceBaseUrl: "http://khashi:3101",
    available: true,
    httpStatus: 200,
    latencyMs: 486,
    error: null,
    status: "blocked",
    liveTradingLocked: true,
    kpis: {
      healthScore: 62,
      healthStatus: "degraded",
      liveMarkets: 1462,
      pricedLiveMarkets: 903,
      orderbookSnapshots: 51820,
      streamBuckets: 388,
      technicalCandles: 240115,
      indicatorSnapshots: 18904,
      scanRuns: 76,
      openTrades: 0,
      closedTrades: 18,
      realizedPnlUsd: 124.4,
      openRiskUsd: 260,
      winRate: 0.5,
      paperCandidates: 7,
      scoredShadowObservations: 341,
    },
    tabs: [
      { id: "overview", label: "Overview", status: "blocked", sourceRoutes: ["/api/roc/production-health"] },
      { id: "khashi", label: "Khashi", status: "watch", sourceRoutes: ["/api/roc/kalshi-trading-desk"] },
      { id: "strategy", label: "Strategy", status: "watch", sourceRoutes: ["/api/roc/technical-strategy-quality"] },
      { id: "paper", label: "Paper", status: "ready", sourceRoutes: ["/api/roc/paper-ledger"] },
      { id: "market-data", label: "Market Data", status: "blocked", sourceRoutes: ["/api/roc/data-flow-health"] },
      { id: "events", label: "Events", status: "ready", sourceRoutes: ["/api/roc/trading-command-center/events"] },
      { id: "controls", label: "Controls", status: "ready", sourceRoutes: ["/api/roc/trading-command-center/controls"] },
    ],
    blockers: [
      "Market collection is paused: storage pressure gate has not cleared since the last restart plan.",
      "Freshness proof is stale — production freshness evidence is older than the collection window.",
      "Paper ledger holds open exposure recorded from replay-only fills.",
    ],
    recommendations: [
      "/api/roc/kalshi-paper-reconciliation-proof",
      "Clear the storage pressure gate, then resume restricted collection before active.",
      "Move beyond replay-only fills before treating paper results as live-trading evidence.",
    ],
    sourceRoutes: {
      productionHealth: "/api/roc/production-health",
      tradingDesk: "/api/roc/kalshi-trading-desk",
      paperLedger: "/api/roc/paper-ledger",
      controls: "/api/roc/trading-command-center/controls",
      events: "/api/roc/trading-command-center/events",
    },
    summary: { mode: "shadow-paper-readonly", note: "Full source payload elided in the prototype fixture." },
  };

  const summary = {
    id: "trading-intelligence-control-plane-summary",
    contractVersion: "trading-intelligence-control-plane.v1",
    frontendContractVersion: "2026-09-08.v1",
    title: "Trading Intelligence Control Plane Summary",
    generatedAt: iso(0),
    status: "blocked",
    liveTradingLocked: true,
    kpis: {
      projectsAvailable: 2,
      projectsTotal: 2,
      openTrades: 3,
      closedTrades: 18,
      // 0 (investing realizedPnlToday) + 124.4 (khashi realizedPnlUsd)
      realizedPnlUsd: 124.4,
      openRiskUsd: 260,       // khashi only — investing publishes no openRiskUsd
      liveMarkets: 1462,      // khashi only
      strategyCandidates: 7,  // khashi paperCandidates only
      liveTradingLocked: true,
      blockers: 5,
    },
    projects: [investing, khashi],
    tabs: [
      { id: "overview", label: "Overview", status: "blocked", projectIds: ["investing-system", "khashi-vc"] },
      { id: "investing-system", label: "Investing System", status: "watch", projectIds: ["investing-system"] },
      { id: "khashi-vc", label: "Khashi VC", status: "blocked", projectIds: ["khashi-vc"] },
      { id: "pnl-risk", label: "P/L and Risk", status: "watch", projectIds: ["investing-system", "khashi-vc"] },
      { id: "strategy-quality", label: "Strategy Quality", status: "watch", projectIds: ["investing-system", "khashi-vc"] },
      // NOTE: backend emits "Latest Events", not "Events" as the handoff §15 says.
      { id: "events", label: "Latest Events", status: "ready", projectIds: ["investing-system", "khashi-vc"] },
      { id: "controls", label: "Controls", status: "ready", projectIds: ["investing-system", "khashi-vc"] },
    ],
    blockers: [
      ...investing.blockers.map((b) => `Investing System: ${b}`),
      ...khashi.blockers.map((b) => `Khashi VC: ${b}`),
    ],
    recommendations: [
      ...investing.recommendations.map((r) => `Investing System: ${r}`),
      ...khashi.recommendations.map((r) => `Khashi VC: ${r}`),
    ],
  };

  const events = {
    id: "trading-intelligence-control-plane-events",
    contractVersion: "trading-intelligence-control-plane.v1",
    title: "Trading Intelligence Control Plane Events",
    generatedAt: iso(0),
    limit: 10,
    events: [
      { id: "kh-9f21", sourceProject: "khashi-vc", sourceSystem: "roc", stream: "collection", type: "collection_gate_blocked", status: "blocked", severity: "critical", title: "collection_gate_blocked", occurredAt: iso(3), instrument: null, summary: "Storage pressure gate blocked the restricted-collection restart plan.", links: { sourceRoute: "/api/roc/trading-command-center/events", tradingDesk: "/api/roc/kalshi-trading-desk" }, rawRef: { activityId: "kh-9f21" } },
      { id: "inv-7c04", sourceProject: "investing-system", sourceSystem: "oanda", stream: "broker-lifecycle-event", type: "broker-lifecycle-event", status: "submitted", severity: "warning", title: "EUR_USD broker lifecycle submitted", occurredAt: iso(11), instrument: "EUR_USD", summary: "Exit submitted but not broker-confirmed after 2 polling cycles.", links: { sourceRoute: "/trading-desk/command-center/events", tradeExplanation: "/trading-desk/oanda/trade-explanation" }, rawRef: { ledgerRecordId: "inv-7c04" } },
      { id: "kh-8ab3", sourceProject: "khashi-vc", sourceSystem: "kalshi-paper", stream: "paper-ledger", type: "paper_trade_closed", status: "closed", severity: "info", title: "KXPRESPARTY-28 paper trade closed", occurredAt: iso(24), instrument: "KXPRESPARTY-28", summary: "Paper trade closed with realized P/L 41.2.", links: { sourceRoute: "/api/roc/trading-command-center/events", paperLedger: "/api/roc/paper-ledger" }, rawRef: { paperTradeId: "kh-8ab3" } },
      { id: "inv-7be1", sourceProject: "investing-system", sourceSystem: "oanda", stream: "runtime-service-state", type: "runtime-service-state", status: "running", severity: "info", title: "OANDA runtime running", occurredAt: iso(38), instrument: null, summary: "Runtime heartbeat refreshed; practice mode, live submit locked.", links: { sourceRoute: "/trading-desk/command-center/events" }, rawRef: { ledgerRecordId: "inv-7be1" } },
      { id: "kh-8a02", sourceProject: "khashi-vc", sourceSystem: "roc", stream: "freshness", type: "freshness_proof_stale", status: "stale", severity: "warning", title: "freshness_proof_stale", occurredAt: iso(52), instrument: null, summary: "Production freshness evidence is older than the collection window.", links: { sourceRoute: "/api/roc/trading-command-center/events" }, rawRef: { activityId: "kh-8a02" } },
      { id: "inv-7ad9", sourceProject: "investing-system", sourceSystem: "oanda", stream: "strategy-exit-executor-run", type: "strategy-exit-executor-run", status: "partial", severity: "warning", title: "GBP_USD exit executor partial", occurredAt: iso(67), instrument: "GBP_USD", summary: "Exit executor completed with 1 unresolved candidate link.", links: { sourceRoute: "/trading-desk/command-center/events" }, rawRef: { ledgerRecordId: "inv-7ad9" } },
      { id: "kh-89f7", sourceProject: "khashi-vc", sourceSystem: "roc", stream: "controls", type: "control_request_recorded", status: "recorded", severity: "info", title: "pause_collection", occurredAt: iso(88), instrument: null, summary: "Operator request recorded: pause_collection (runbook-required).", links: { sourceRoute: "/api/roc/trading-command-center/events" }, rawRef: { activityId: "kh-89f7" } },
      { id: "inv-79c5", sourceProject: "investing-system", sourceSystem: "oanda", stream: "practice-execution", type: "practice-execution", status: "accepted", severity: "info", title: "USD_JPY practice execution accepted", occurredAt: iso(104), instrument: "USD_JPY", summary: "Practice entry accepted at 1.2 units, stop attached.", links: { sourceRoute: "/trading-desk/command-center/events" }, rawRef: { ledgerRecordId: "inv-79c5" } },
      { id: "kh-8971", sourceProject: "khashi-vc", sourceSystem: "kalshi-paper", stream: "paper-ledger", type: "paper_trade_opened", status: "open", severity: "info", title: "KXFED-26SEP paper trade opened", occurredAt: iso(131), instrument: "KXFED-26SEP", summary: "Paper trade opened with max risk 60.", links: { sourceRoute: "/api/roc/trading-command-center/events" }, rawRef: { paperTradeId: "kh-8971" } },
      { id: "inv-7942", sourceProject: "investing-system", sourceSystem: "oanda", stream: "trade-after-action-review", type: "trade-after-action-review", status: "candidate", severity: "warning", title: "AUD_USD trade review candidate", occurredAt: iso(160), instrument: "AUD_USD", summary: "Review linked by candidate match only; entry snapshot missing.", links: { sourceRoute: "/trading-desk/command-center/events" }, rawRef: { ledgerRecordId: "inv-7942" } },
    ],
  };

  /* Control field sets differ per project — investing has dangerous/effect,
     khashi has runbookCommand/requiresServiceRestart. Neither emits riskLevel
     or requiresConfirmation, so the UI must derive them. */
  const investingControls = [
    { id: "refresh_daily_ops", namespacedId: "investing-system:refresh_daily_ops", projectId: "investing-system", projectLabel: "Investing System", label: "Run OANDA Daily Ops", intent: "Refresh OANDA evidence rollups, repair state, and autonomy readiness.", execution: "available", effect: "persists oanda-daily-ops-automation-report", dangerous: false },
    { id: "pause_oanda_runtime", namespacedId: "investing-system:pause_oanda_runtime", projectId: "investing-system", projectLabel: "Investing System", label: "Pause OANDA Runtime", intent: "Mark the OANDA practice runtime stopped so dashboards and supervisors treat it as halted.", execution: "available", effect: "persists runtime-service-state=stopped; host process restart/stop remains owned by deployment automation", dangerous: true },
    { id: "resume_oanda_runtime", namespacedId: "investing-system:resume_oanda_runtime", projectId: "investing-system", projectLabel: "Investing System", label: "Resume OANDA Runtime", intent: "Preview the host action required to restart the supervised OANDA runtime worker.", execution: "host_orchestrator_required", effect: "no process mutation from this API", dangerous: true },
    { id: "emergency_lock_trading", namespacedId: "investing-system:emergency_lock_trading", projectId: "investing-system", projectLabel: "Investing System", label: "Emergency Lock Trading", intent: "Confirm live trading is locked and mark the practice runtime stopped.", execution: "available", effect: "persists runtime-service-state=stopped; live submit is already locked", dangerous: true },
  ];
  const khashiControls = [
    ["pause_collection", "Pause Collection", "Stop new collection and stream writes.", "npm run khashi:collection:pause", true],
    ["shadow_collection", "Shadow Collection", "Resume low-risk shadow collection without stream writes.", "npm run khashi:collection:shadow", false],
    ["restricted_collection", "Restricted Collection", "Resume restricted collection after restart gates pass.", "npm run khashi:collection:restricted", true],
    ["active_collection", "Active Collection", "Resume active collection after operator review and storage gates pass.", "npm run khashi:collection:active", true],
    ["rollback_collection", "Rollback Collection", "Return collection to paused mode.", "npm run khashi:collection:rollback", true],
    ["run_freshness_proof", "Run Freshness Proof", "Refresh production freshness evidence.", "npm run khashi:freshness:proof", false],
  ].map(([id, label, intent, runbookCommand, requiresServiceRestart]) => ({
    id, namespacedId: `khashi-vc:${id}`, projectId: "khashi-vc", projectLabel: "Khashi VC",
    label, intent, runbookCommand, requiresServiceRestart,
    execution: "runbook-required", brokerMutation: false, liveTradingLocked: true,
  }));

  const controls = {
    id: "trading-intelligence-control-plane-controls",
    contractVersion: "trading-intelligence-control-plane.v1",
    title: "Trading Intelligence Control Plane Controls",
    generatedAt: iso(0),
    safety: {
      liveTradingLocked: true,
      submitLiveOrderAvailable: false,
      projectOwnedControlsOnly: true,
      note: "Nous proxies explicit project-owned control requests; it does not submit trades.",
    },
    projects: [
      { projectId: "investing-system", label: "Investing System", available: true, error: null, safety: { liveTradingLocked: true, defaultDryRun: true, adminAuthRequired: true }, controls: investingControls },
      { projectId: "khashi-vc", label: "Khashi VC", available: true, error: null, safety: { liveTradingLocked: true, dashboardMutatesBroker: false, adminAuthRequired: true }, controls: khashiControls },
    ],
    controls: [...investingControls, ...khashiControls],
  };

  /* A degraded variant used by the "one source down" state, so the
     prototypes can prove the page stays usable with a dead source. */
  const degradedSummary = (() => {
    const clone = JSON.parse(JSON.stringify(summary));
    const inv = clone.projects[0];
    Object.assign(inv, {
      available: false, httpStatus: 0, latencyMs: 8031, status: "unavailable",
      error: "<urlopen error [Errno -2] Name or service not known>",
      kpis: {}, tabs: [], liveTradingLocked: true,
      blockers: ["Investing System command-center summary is unavailable: <urlopen error [Errno -2] Name or service not known>"],
      recommendations: ["Check Investing System API base URL, auth token, and service health."],
    });
    clone.kpis = { ...clone.kpis, projectsAvailable: 1, openTrades: 0, closedTrades: 18, realizedPnlUsd: 124.4, blockers: 4 };
    clone.blockers = [
      "Investing System: Investing System command-center summary is unavailable: <urlopen error [Errno -2] Name or service not known>",
      ...khashi.blockers.map((b) => `Khashi VC: ${b}`),
    ];
    clone.tabs = clone.tabs.map((t) => (t.id === "investing-system" ? { ...t, status: "unavailable" } : t));
    return clone;
  })();

  return { summary, events, controls, degradedSummary };
})();
