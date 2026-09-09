/* ==================================================================
 * Shared helpers — Trading Intelligence Control Plane prototypes
 * ================================================================== */
const H = (() => {
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, v === true ? "" : String(v));
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return n;
  };

  /* --- formatting -------------------------------------------------
     null / undefined must read "No data", NEVER 0 (handoff §7).
     A real 0 must read "0". These are different answers. */
  const NO_DATA = "No data";
  const isNum = (v) => typeof v === "number" && Number.isFinite(v);

  const fmtInt = (v) => (isNum(v) ? v.toLocaleString("en-US") : NO_DATA);
  const fmtCurrency = (v) =>
    isNum(v)
      ? (v < 0 ? "−" : "") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : NO_DATA;
  const fmtPct = (v) => (isNum(v) ? `${v.toFixed(1)}%` : NO_DATA);
  const fmtRatio = (a, b) => (isNum(a) && isNum(b) ? `${a}/${b}` : NO_DATA);

  /* Only signed P/L gets up/down colour. Risk, exposure and counts must
     stay neutral — green on "open risk $260" would read as "good". */
  const pnlTone = (v) => (!isNum(v) ? "" : v > 0 ? "pnl-up" : v < 0 ? "pnl-down" : "pnl-flat");
  const isSignedPnl = (key) => /pnl/i.test(String(key)) && !/risk/i.test(String(key));

  /* camelCase field name -> readable label, raw key kept as the tooltip. */
  const humanize = (key) =>
    String(key)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\bPnl\b/gi, "P/L")
      .replace(/\bPct\b/gi, "%")
      .replace(/\bUsd\b/gi, "USD")
      .replace(/^./, (c) => c.toUpperCase());

  const relTime = (iso) => {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "unknown";
    const s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 45) return "just now";
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400) return `${Math.round(s / 3600)}h ago`;
    return `${Math.round(s / 86400)}d ago`;
  };
  const clockTime = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "--:--:--" : d.toTimeString().slice(0, 8);
  };
  /* Staleness: generatedAt older than the poll window means the numbers
     on screen are not what the fleet looks like now. */
  const isStale = (iso, seconds = 120) => (Date.now() - new Date(iso).getTime()) / 1000 > seconds;

  /* --- status ------------------------------------------------------
     _normalize_project_status passes unmatched source strings straight
     through, so `status` is an open string, not a 4-value union. */
  const KNOWN = ["ready", "watch", "blocked", "unavailable"];
  const tone = (status) => (KNOWN.includes(String(status)) ? String(status) : "unknown");
  const toneClass = (status) => `t-${tone(status)}`;
  const railClass = (status) => `rail-${tone(status)}`;

  const ICON = {
    ready: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5l3.2 3.2L13 5"/></svg>',
    watch: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2.5l6 11H2z"/><path d="M8 6.6v3"/><path d="M8 11.4v.1"/></svg>',
    blocked: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="5.7"/><path d="M4 12L12 4"/></svg>',
    unavailable: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="5.7"/><path d="M8 5v4"/><path d="M8 11v.1"/></svg>',
    unknown: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="5.7"/><path d="M6.3 6.4a1.8 1.8 0 113 1.4v.7"/><path d="M8 11v.1"/></svg>',
    lock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="10" height="7" rx="1.6"/><path d="M5.6 7V5.2a2.4 2.4 0 014.8 0V7"/></svg>',
  };

  /* Status is never colour-alone: every badge carries an icon + the word. */
  const statusBadge = (status, extra = "") =>
    el("span", { class: `badge ${toneClass(status)}`, title: `status: ${status}`, html: `${ICON[tone(status)]}<span>${status}${extra}</span>` });

  const lockBadge = (locked) =>
    locked
      ? el("span", { class: "badge t-lock", html: `${ICON.lock}<span>Live trading locked</span>` })
      : el("span", { class: "badge t-watch", html: `${ICON.watch}<span>Live trading UNLOCKED</span>` });

  /* --- events ------------------------------------------------------ */
  const SEV_ORDER = { critical: 0, error: 1, warning: 2, info: 3 };
  /* §9: source_unavailable renders critical even when the source's own
     severity disagrees. */
  const eventSeverity = (ev) => (ev.type === "source_unavailable" ? "critical" : String(ev.severity || "info"));
  const sevTone = (sev) =>
    ({ critical: "blocked", error: "blocked", warning: "watch", info: "unknown" }[sev] || "unknown");
  const sevRail = (sev) =>
    ({ critical: "rail-blocked", error: "rail-blocked", warning: "rail-watch", info: "rail-unknown" }[sev] || "rail-unknown");

  const EVENT_FILTERS = [
    { id: "all", label: "All", test: () => true },
    { id: "investing-system", label: "Investing System", test: (e) => e.sourceProject === "investing-system" },
    { id: "khashi-vc", label: "Khashi VC", test: (e) => e.sourceProject === "khashi-vc" },
    { id: "warnings", label: "Warnings", test: (e) => eventSeverity(e) === "warning" },
    { id: "errors", label: "Errors", test: (e) => ["error", "critical"].includes(eventSeverity(e)) },
    { id: "trades", label: "Trades", test: (e) => /trade|execution|lifecycle|paper/i.test(`${e.stream} ${e.type}`) },
    { id: "controls", label: "Controls", test: (e) => /control/i.test(`${e.stream} ${e.type}`) },
    { id: "strategy", label: "Strategy", test: (e) => /strategy|exit|indicator|shadow/i.test(`${e.stream} ${e.type}`) },
    { id: "source-health", label: "Source Health", test: (e) => /source|health|freshness|collection/i.test(`${e.stream} ${e.type}`) },
  ];

  /* --- controls ----------------------------------------------------
     Neither source emits riskLevel or requiresConfirmation, so derive
     both from the fields that ARE published. */
  const riskLevel = (c) => {
    if (c.brokerMutation) return "critical";
    if (c.id === "emergency_lock_trading") return "critical";
    if (c.dangerous || c.requiresServiceRestart) return "high";
    if (c.execution === "host_orchestrator_required" || c.execution === "runbook-required") return "medium";
    return "low";
  };
  const riskTone = (r) => ({ critical: "blocked", high: "blocked", medium: "watch", low: "ready" }[r] || "unknown");
  const requiresConfirmation = (c) => riskLevel(c) !== "low";

  /* Preview-first: the first request is always execute:false (§13). */
  const buildRequest = (c, { execute, reason }) => ({
    action: c.namespacedId,
    execute,
    reason,
    actorId: "nous-dashboard-operator",
    correlationId: `ti-${Date.now().toString(36)}`,
  });

  const mockControlResponse = (c, req) => ({
    id: "trading-intelligence-control-plane-control",
    contractVersion: "trading-intelligence-control-plane.v1",
    generatedAt: new Date().toISOString(),
    status: "proxied",
    projectId: c.projectId,
    action: c.id,
    httpStatus: 200,
    sourceBaseUrl: c.projectId === "khashi-vc" ? "http://khashi:3101" : "http://investing-system:3102",
    error: null,
    result: {
      projectId: c.projectId,
      status: req.execute ? "recorded" : "preview",
      action: c.id,
      execute: req.execute,
      liveTradingLocked: true,
      brokerMutation: false,
      runbookCommand: c.runbookCommand ?? null,
      effect: c.effect ?? null,
      nextAction: req.execute
        ? c.runbookCommand
          ? `Run ${c.runbookCommand} on the production host and restart the project service if required.`
          : "Operator request recorded to the project ledger."
        : "Submit with execute=true to record an auditable operator request.",
    },
  });

  /* Never claim success on transport alone (§20). */
  const executionSucceeded = (res) =>
    res.status === "proxied" &&
    res.httpStatus >= 200 && res.httpStatus < 300 &&
    !!res.result &&
    !["rejected", "failed", "error"].includes(String(res.result.status));

  /* --- KPI ribbon definition (shared across variants) --------------- */
  const kpiCards = (k) => [
    { label: "Projects available", value: fmtRatio(k.projectsAvailable, k.projectsTotal), tone: k.projectsAvailable === k.projectsTotal ? "ready" : "blocked", note: "sources reachable" },
    { label: "Open trades", value: fmtInt(k.openTrades), note: "both systems" },
    { label: "Closed / reviewed", value: fmtInt(k.closedTrades), note: "closedTrades ∪ reviewedTrades" },
    { label: "Realized P/L", value: fmtCurrency(k.realizedPnlUsd), pnl: k.realizedPnlUsd, note: "today, attributed" },
    { label: "Open risk", value: fmtCurrency(k.openRiskUsd), note: "khashi-vc only" },
    { label: "Live markets", value: fmtInt(k.liveMarkets), note: "khashi-vc only" },
    { label: "Strategy candidates", value: fmtInt(k.strategyCandidates), note: "paper candidates" },
    { label: "Blockers", value: fmtInt(k.blockers), tone: k.blockers > 0 ? "blocked" : "ready", note: "across the fleet" },
  ];

  const projectColor = (id) => (id === "investing-system" ? "var(--series-1)" : "var(--series-2)");
  const projectShort = (id) => (id === "investing-system" ? "INV" : id === "khashi-vc" ? "KHA" : "SRC");

  /* --- dev-only state switcher ------------------------------------- */
  const STATES = [
    ["ready", "Loaded"],
    ["loading", "Loading"],
    ["degraded", "One source down"],
    ["empty", "Empty"],
    ["error", "Summary error"],
  ];

  function stateBar(current, onChange, variantName) {
    const bar = el("div", { class: "statebar" }, el("strong", {}, "Prototype state"));
    for (const [id, label] of STATES) {
      bar.append(el("button", { type: "button", "aria-pressed": String(id === current), onclick: () => onChange(id) }, label));
    }
    bar.append(el("span", { class: "spacer" }));
    bar.append(el("strong", {}, variantName));
    bar.append(
      el("button", {
        type: "button",
        onclick: () => {
          const root = document.documentElement;
          const dark = root.getAttribute("data-theme") === "dark" ||
            (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
          root.setAttribute("data-theme", dark ? "light" : "dark");
        },
      }, "Toggle theme")
    );
    return bar;
  }

  /* Resolve the fixture for a given prototype state. */
  function dataFor(state) {
    if (state === "error") return { summary: null, events: TI.events, controls: TI.controls, error: "Summary failed: 500" };
    if (state === "degraded") return { summary: TI.degradedSummary, events: { ...TI.events, events: [
      { id: "nous-inv-unavail", sourceProject: "investing-system", sourceSystem: "nous-hermes-agent", stream: "source-health", type: "source_unavailable", status: "blocked", severity: "info", title: "Investing System unavailable", occurredAt: new Date().toISOString(), instrument: null, summary: "Source command-center endpoint did not respond.", links: { summary: "/trading-desk/command-center/summary" }, rawRef: { baseUrls: ["http://investing-system:3102", "http://127.0.0.1:3102"] } },
      ...TI.events.events.filter((e) => e.sourceProject === "khashi-vc"),
    ] }, controls: { ...TI.controls, projects: TI.controls.projects.map((p) => p.projectId === "investing-system" ? { ...p, available: false, error: "source_unavailable", controls: [] } : p), controls: TI.controls.controls.filter((c) => c.projectId === "khashi-vc") }, error: null };
    if (state === "empty") return { summary: { ...TI.summary, blockers: [], recommendations: [], status: "ready", kpis: { ...TI.summary.kpis, blockers: 0, openTrades: 0, closedTrades: 0, realizedPnlUsd: null, openRiskUsd: null, strategyCandidates: null } }, events: { ...TI.events, events: [] }, controls: { ...TI.controls, projects: TI.controls.projects.map((p) => ({ ...p, controls: [] })), controls: [] }, error: null };
    return { summary: TI.summary, events: TI.events, controls: TI.controls, error: null };
  }

  return {
    el, NO_DATA, isNum, fmtInt, fmtCurrency, fmtPct, fmtRatio, pnlTone,
    isSignedPnl, humanize,
    relTime, clockTime, isStale, tone, toneClass, railClass, ICON,
    statusBadge, lockBadge, SEV_ORDER, eventSeverity, sevTone, sevRail, EVENT_FILTERS,
    riskLevel, riskTone, requiresConfirmation, buildRequest, mockControlResponse, executionSucceeded,
    kpiCards, projectColor, projectShort, STATES, stateBar, dataFor,
  };
})();

/* ==================================================================
 * Control confirmation dialog — preview-first, shared by all variants.
 * ================================================================== */
function openControlDialog(control, onDone) {
  const { el } = H;
  const risk = H.riskLevel(control);
  let preview = null;
  let executed = null;
  let reason = "";

  const scrim = el("div", { class: "scrim", onclick: (e) => { if (e.target === scrim) close(); } });
  const body = el("div", { class: "body" });
  const foot = el("footer");
  const dialog = el("div", { class: "dialog", role: "dialog", "aria-modal": "true", "aria-label": `Control: ${control.label}` },
    el("header", {},
      el("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" },
        el("span", { class: "eyebrow" }, control.projectLabel),
        el("span", { class: `badge t-${H.riskTone(risk)}`, html: `${H.ICON[H.riskTone(risk)] || H.ICON.unknown}<span>${risk} risk</span>` }),
        control.requiresServiceRestart ? el("span", { class: "badge t-watch", html: `${H.ICON.watch}<span>service restart</span>` }) : null,
        el("span", { class: "badge t-lock", html: `${H.ICON.lock}<span>live locked</span>` })
      ),
      el("div", { style: "font-size:16px;font-weight:700;margin-top:6px" }, control.label),
      el("code", { class: "mono", style: "font-size:11px;color:var(--ink-muted)" }, control.namespacedId)
    ),
    body, foot);

  function render() {
    body.replaceChildren();
    body.append(el("p", { style: "margin:0 0 12px;color:var(--ink-2)" }, control.intent || control.description || ""));

    const kv = el("dl", { class: "kv" });
    const rows = [
      ["Execution", control.execution || "—"],
      ["Broker mutation", control.brokerMutation ? "possible" : "no"],
      ["Live trading", "locked"],
      ["Confirmation", H.requiresConfirmation(control) ? "required" : "not required"],
    ];
    if (control.effect) rows.push(["Effect", control.effect]);
    if (control.runbookCommand) rows.push(["Runbook", el("code", { class: "mono" }, control.runbookCommand)]);
    for (const [k, v] of rows) { kv.append(el("dt", {}, k), el("dd", {}, v)); }
    body.append(kv);

    body.append(el("label", { style: "display:block;margin:14px 0 5px", class: "eyebrow" }, "Reason (sent with the request)"));
    const ta = el("textarea", {
      rows: 2,
      placeholder: "Why are you running this? Recorded on the project ledger.",
      style: "width:100%;font:inherit;font-size:12px;padding:7px 8px;border:1px solid var(--rule-strong);border-radius:5px;background:var(--surface);color:var(--ink);resize:vertical",
      oninput: (e) => { reason = e.target.value; sync(); },
    });
    ta.value = reason;
    body.append(ta);

    if (preview) {
      body.append(el("div", { class: "eyebrow", style: "margin:14px 0 5px" }, "Preview response · execute:false"));
      body.append(el("pre", { class: "payload" }, JSON.stringify(preview, null, 2)));
    }
    if (executed) {
      const ok = H.executionSucceeded(executed);
      body.append(el("div", { style: "margin:14px 0 5px;display:flex;align-items:center;gap:8px" },
        el("span", { class: "eyebrow" }, "Execute response"),
        el("span", { class: `badge t-${ok ? "ready" : "blocked"}`, html: `${ok ? H.ICON.ready : H.ICON.blocked}<span>${ok ? "proxied + source confirmed" : "not confirmed"}</span>` })
      ));
      body.append(el("pre", { class: "payload" }, JSON.stringify(executed, null, 2)));
    }
    sync();
  }

  function sync() {
    foot.replaceChildren();
    foot.append(el("span", { style: "flex:1;font-size:11px;color:var(--ink-muted)" },
      executed ? "Refresh /summary, /events and /controls after completion." :
      preview ? "Preview returned. Confirm to send execute:true." : "Step 1 of 2 — preview first."));
    foot.append(el("button", { class: "btn", type: "button", onclick: close }, executed ? "Close" : "Cancel"));
    if (!preview) {
      foot.append(el("button", { class: "btn btn-primary", type: "button", onclick: () => { preview = H.mockControlResponse(control, H.buildRequest(control, { execute: false, reason })); render(); } }, "Preview"));
    } else if (!executed) {
      foot.append(el("button", {
        class: `btn ${risk === "low" ? "btn-primary" : "btn-danger"}`, type: "button",
        disabled: H.requiresConfirmation(control) && reason.trim().length < 8,
        title: H.requiresConfirmation(control) && reason.trim().length < 8 ? "A reason of at least 8 characters is required for this risk level" : "",
        onclick: () => { executed = H.mockControlResponse(control, H.buildRequest(control, { execute: true, reason })); render(); onDone && onDone(control, executed); },
      }, `Execute ${control.label}`));
    }
  }

  function close() { scrim.remove(); document.removeEventListener("keydown", esc); }
  function esc(e) { if (e.key === "Escape") close(); }
  document.addEventListener("keydown", esc);

  scrim.append(dialog);
  document.body.append(scrim);
  render();
  return scrim;
}
