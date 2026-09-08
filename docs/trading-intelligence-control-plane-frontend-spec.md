# Trading Intelligence Control Plane Frontend Spec

Backend artifacts:

- Same-origin dashboard API: `hermes_cli/trading_intelligence.py` mounted through `hermes_cli/web_server.py`
- Standalone/local contract server: `scripts/trading-intelligence-control-plane-api.mjs`

Contract version: `2026-09-08.v1`

## Purpose

Build a Nous Hermes Agent dashboard that brings Investing System and Khashi VC trading signals, proof, P/L, risk posture, latest events, and safe controls into one place.

This page must not recreate the full Investing System or Khashi VC dashboards. It is a command-center layer for answering:

- Are both systems running in the right direction?
- What happened recently?
- What is open, closed, profitable, blocked, or stale?
- Is live trading locked?
- What can I pause, refresh, or escalate from here?

## Backend Server

Primary production path:

```text
The routes are mounted inside the existing Nous Hermes dashboard server.
Claude should call `/api/trading-intelligence/*` on the same origin as the Nous dashboard.
```

The same-origin routes inherit the existing dashboard auth gate. In production, an unauthenticated request may return `401`; the authenticated dashboard page can call the routes normally.

Standalone local/dev fallback:

```bash
node scripts/trading-intelligence-control-plane-api.mjs
```

Default port:

```text
8791
```

Environment:

```text
TRADING_INTELLIGENCE_PORT=8791
TRADING_INTELLIGENCE_CORS_ORIGIN=*

INVESTING_SYSTEM_API_BASE_URL=
INVESTING_SYSTEM_API_READ_TOKEN=
INVESTING_SYSTEM_API_ADMIN_TOKEN=

KHASHI_VC_API_BASE_URL=
KHASHI_VC_API_READ_TOKEN=
KHASHI_VC_API_ADMIN_TOKEN=
```

Production Docker defaults try service DNS first:

```text
http://investing-system:3102
http://khashi:3101
```

Local development falls back to:

```text
http://127.0.0.1:3102
http://127.0.0.1:3101
```

If a token is present, the aggregator sends:

```http
Authorization: Bearer <token>
```

For read calls, the backend prefers a read token but may fall back to the admin token when a source project only exposes `API_ADMIN_TOKEN` or `AMARI_ADMIN_TOKEN` in production.

## Aggregator Endpoints

Base path:

```text
/api/trading-intelligence
```

### GET `/health`

Standalone server path only:

```text
/health
```

Response:

```json
{
  "ok": true,
  "service": "trading-intelligence-control-plane",
  "generatedAt": "2026-09-08T00:00:00.000Z"
}
```

### GET `/api/trading-intelligence/summary`

Primary page-load endpoint.

Response shape:

```ts
type TradingIntelligenceSummary = {
  id: "trading-intelligence-control-plane-summary";
  contractVersion: "trading-intelligence-control-plane.v1";
  title: "Trading Intelligence Control Plane Summary";
  generatedAt: string;
  status: "ready" | "watch" | "blocked";
  liveTradingLocked: boolean;
  frontendContractVersion: "2026-09-08.v1";
  kpis: {
    projectsAvailable: number;
    projectsTotal: number;
    openTrades: number | null;
    closedTrades: number | null;
    realizedPnlUsd: number | null;
    openRiskUsd: number | null;
    liveMarkets: number | null;
    strategyCandidates: number | null;
    liveTradingLocked: boolean;
    blockers: number;
  };
  projects: TradingProjectSummary[];
  tabs: TradingControlPlaneTab[];
  blockers: string[];
  recommendations: string[];
};
```

Project summary:

```ts
type TradingProjectSummary = {
  projectId: "investing-system" | "khashi-vc";
  label: string;
  sourceBaseUrl: string;
  available: boolean;
  httpStatus: number;
  latencyMs: number;
  error: string | null;
  status: string;
  liveTradingLocked: boolean;
  kpis: Record<string, number | string | boolean | null>;
  tabs: Array<{
    id: string;
    label: string;
    status: string;
    sourceRoutes?: string[];
  }>;
  blockers: string[];
  recommendations: string[];
  sourceRoutes: Record<string, string>;
  summary: unknown;
};
```

Tabs:

```ts
type TradingControlPlaneTab = {
  id:
    | "overview"
    | "investing-system"
    | "khashi-vc"
    | "pnl-risk"
    | "strategy-quality"
    | "events"
    | "controls";
  label: string;
  status: "ready" | "watch" | "blocked" | "unavailable" | string;
  projectIds: string[];
};
```

Recommended UI:

- Top KPI ribbon:
  - Projects available
  - Open trades
  - Closed/reviewed trades
  - Realized P/L
  - Open risk
  - Live markets
  - Strategy candidates
  - Blockers
- Two project cards:
  - Investing System
  - Khashi VC
- Use project cards to show availability, status, latency, live lock, top blockers, top recommendations, and source links.
- Never show green “live-ready” unless `liveTradingLocked === false`; current backend expects locked mode.

### GET `/api/trading-intelligence/events?limit=10`

Merged latest activity and trade events.

Response shape:

```ts
type TradingEventsResponse = {
  id: "trading-intelligence-control-plane-events";
  contractVersion: "trading-intelligence-control-plane.v1";
  title: "Trading Intelligence Control Plane Events";
  generatedAt: string;
  limit: number;
  events: TradingEvent[];
};
```

Event:

```ts
type TradingEvent = {
  id: string;
  sourceProject: "investing-system" | "khashi-vc" | string;
  sourceSystem: string;
  stream: string;
  type: string;
  status: string;
  severity: "info" | "warning" | "error" | string;
  title: string;
  occurredAt: string;
  instrument: string | null;
  summary: string;
  links: Record<string, string>;
  rawRef: Record<string, unknown>;
};
```

Recommended UI:

- Latest 10 events list.
- Filter chips:
  - All
  - Investing System
  - Khashi VC
  - Errors
  - Trades
  - Controls
- Each event row should show project, time, title, status, severity, instrument, and summary.

### GET `/api/trading-intelligence/controls`

Namespaced control catalog.

Response shape:

```ts
type TradingControlsResponse = {
  id: "trading-intelligence-control-plane-controls";
  contractVersion: "trading-intelligence-control-plane.v1";
  title: "Trading Intelligence Control Plane Controls";
  generatedAt: string;
  safety: {
    liveTradingLocked: true;
    submitLiveOrderAvailable: false;
    projectOwnedControlsOnly: true;
    note: string;
  };
  projects: Array<{
    projectId: string;
    label: string;
    available: boolean;
    error: string | null;
    safety: Record<string, unknown>;
    controls: TradingControl[];
  }>;
  controls: TradingControl[];
};
```

Control:

```ts
type TradingControl = {
  id: string;
  namespacedId: string; // example: "khashi-vc:pause_collection"
  projectId: string;
  projectLabel: string;
  label: string;
  intent?: string;
  runbookCommand?: string;
  execution?: string;
  effect?: string;
  dangerous?: boolean;
  brokerMutation?: boolean;
  liveTradingLocked?: boolean;
  requiresServiceRestart?: boolean;
};
```

Recommended UI:

- Controls tab grouped by project.
- Require a confirmation modal for controls where `dangerous === true` or `requiresServiceRestart === true`.
- Default to preview mode. Do not send `execute: true` on first click.
- Show runbook command if returned.
- Show a permanent banner that live order submit is unavailable from Nous.

### POST `/api/trading-intelligence/control`

Proxy a project-owned control request.

Request:

```ts
type ControlRequest = {
  action: string; // namespaced action preferred, e.g. "investing-system:pause_oanda_runtime"
  projectId?: string; // optional if action is namespaced
  execute?: boolean; // false or omitted returns preview
  reason?: string;
  actorId?: string;
  correlationId?: string;
};
```

Examples:

```json
{
  "action": "investing-system:pause_oanda_runtime",
  "execute": false,
  "reason": "Operator wants to inspect stale signals first."
}
```

```json
{
  "action": "khashi-vc:pause_collection",
  "execute": true,
  "reason": "Storage pressure review."
}
```

Response:

```ts
type ControlResponse = {
  id: "trading-intelligence-control-plane-control";
  contractVersion: "trading-intelligence-control-plane.v1";
  generatedAt: string;
  status: "proxied" | "failed" | "rejected";
  projectId?: string;
  action?: string;
  httpStatus?: number;
  error?: string | null;
  result?: unknown;
};
```

## Source Project Endpoints

The frontend should normally call Nous only. These source routes are for debugging and deep-linking.

Investing System:

```text
GET  /trading-desk/command-center/summary
GET  /trading-desk/command-center/events?limit=10
GET  /trading-desk/command-center/controls
POST /trading-desk/command-center/control
```

Khashi VC:

```text
GET  /api/roc/trading-command-center/summary
GET  /api/roc/trading-command-center/events?limit=10
GET  /api/roc/trading-command-center/controls
POST /api/roc/trading-command-center/control
```

## Source-Specific Controls

Investing System controls:

- `investing-system:refresh_daily_ops`
- `investing-system:pause_oanda_runtime`
- `investing-system:resume_oanda_runtime`
- `investing-system:emergency_lock_trading`

Khashi VC controls:

- `khashi-vc:pause_collection`
- `khashi-vc:shadow_collection`
- `khashi-vc:restricted_collection`
- `khashi-vc:active_collection`
- `khashi-vc:rollback_collection`
- `khashi-vc:run_freshness_proof`

Live trade submit is intentionally absent.

## Frontend Layout Recommendation

Build a dense internal operations dashboard, not a marketing page.

Suggested structure:

1. Sticky header:
   - Title: Trading Intelligence
   - Status badge
   - Last refreshed
   - Refresh button
   - Live trading lock badge
2. KPI ribbon:
   - 8 compact KPI cards from `summary.kpis`
3. Project comparison:
   - Two side-by-side project panels on desktop
   - Stacked cards on mobile
   - Each project panel shows status, latency, top KPIs, blockers, recommendations, and source-route links.
4. Tabbed workspace:
   - Overview
   - Investing System
   - Khashi VC
   - P/L and Risk
   - Strategy Quality
   - Events
   - Controls
5. Events rail:
   - Latest 10 merged events
   - Severity coloring
   - Project filters
6. Controls panel:
   - Project grouped controls
   - Preview first
   - Confirmation required for dangerous/service-restart controls
   - Show exact response from POST `/control`

## Visual Rules

- This page should follow the Nous/Hermes dashboard standard and reuse dashboard-kit primitives.
- Do not copy Investing System or Khashi VC frontend layouts directly.
- Use tabs and cards for command-center scanning, not full replicated dashboards.
- Treat `blockers` and `recommendations` as first-class UI, not footnotes.
- Use status colors consistently:
  - ready/healthy/pass: green
  - watch/partial/degraded/stale: amber
  - blocked/failed/error/unavailable: red
  - locked-readonly: neutral/amber with lock icon

## Refresh Behavior

- Poll `/summary` every 30-60 seconds.
- Poll `/events?limit=10` every 15-30 seconds if the Events tab or side rail is visible.
- Fetch `/controls` on first Controls tab open and after any control POST.
- Disable execute buttons while a request is in flight.

## Error States

If a project is unavailable:

- Keep the rest of the dashboard visible.
- Show source project as unavailable.
- Show `summary.projects[n].error`.
- Show a red event row from `/events` with `type: "source_unavailable"`.

If POST `/control` fails:

- Show response `error`.
- Do not assume control executed.
- Keep the control visible with a retry option.

## Backend Tests

Run:

```bash
uv run pytest tests/test_trading_intelligence_dashboard_api.py
node --test tests-js/trading-intelligence-control-plane-api.test.mjs
```

Source project tests:

```bash
# Investing System
npm run build
npm run test:trading-desk

# Khashi VC
npm test -- tests/web/kalshi-trading-desk-api.test.ts tests/web/proof-api-contract.test.ts
```
