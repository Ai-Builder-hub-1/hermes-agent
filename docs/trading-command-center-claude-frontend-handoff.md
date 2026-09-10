# Trading Command Center Claude Frontend Handoff

Date: 2026-09-10

## Goal

Build a world-class Nous Hermes Agent frontend page that brings Investing System and Khashi VC trading state into one control surface.

Do not recreate the full Investing System or Khashi VC dashboards. This page is a high-level command center for:

- total cash left today
- daily P/L
- open risk
- system health
- recent trades/events
- blockers and human decisions
- safe operational controls
- whether each system is moving in the right direction

## Primary Backend Endpoint

Use this same-origin endpoint from the Nous dashboard:

```text
GET /api/trading-intelligence/command-center?limit=10
```

Alias:

```text
GET /api/trading-command-center?limit=10
```

Production routes are authenticated by the existing Nous dashboard auth gate. Do not design around unauthenticated public access.

## Critical Semantics

Cash fields are not all the same.

Use `dailyMetrics.bySource[]` before labeling cash:

- `isRealBrokerCash: true` means broker-account cash/buying power from a read-only source.
- `isKalshiDemoCash: true` would mean official Kalshi demo funds if that gets wired later.
- `capitalSource: "internal-khashi-paper-bankroll"` means an internal Khashi simulation bankroll, not real Kalshi cash.
- `capitalSource: "not-configured"` means Khashi is not contributing cash.
- `null` means unknown, not zero.

Current production shape:

- Investing System contributes real broker-account cash.
- Khashi VC contributes trading/perpetual/shadow metrics, but not cash unless a separate simulated bankroll is configured.

## Key Response Fields

```ts
type TradingCommandCenter = {
  id: "trading-command-center";
  contractVersion: "trading-command-center.v1";
  frontendContractVersion: string;
  title: string;
  generatedAt: string;
  status: "ready" | "watch" | "blocked" | string;
  liveTradingLocked: boolean;
  summary: CommandSummary;
  lanes: Lane[];
  dailyMetrics: DailyMetrics;
  dailySeries: DailySeries;
  capital: CapitalSnapshot;
  pnl: PnlSnapshot;
  risk: RiskSnapshot;
  positions: PositionSnapshot;
  strategies: StrategySnapshot;
  recentEvents: TradingEvent[];
  actionQueue: ActionItem[];
  freshness: FreshnessRow[];
  blockers: string[];
  recommendations: string[];
  sourceProjects: SourceProject[];
  sourceRoutes: Record<string, string>;
  frontendBuildNotes: string[];
};
```

## Daily Metrics

Use `dailyMetrics` for the top KPI ribbon.

Recommended KPI cards:

- Cash left today: `dailyMetrics.cashLeftUsd`
- Risk-adjusted cash left: `dailyMetrics.riskAdjustedCashLeftUsd`
- Buying power: `dailyMetrics.buyingPowerUsd`
- Total equity: `dailyMetrics.totalEquityUsd`
- Realized P/L today: `dailyMetrics.realizedPnlTodayUsd`
- Net P/L: `dailyMetrics.netPnlUsd`
- Open risk: `dailyMetrics.openRiskUsd`
- Open trades: `dailyMetrics.openTrades`
- Human actions required: `dailyMetrics.humanActionsRequired`

Always render coverage:

```ts
dailyMetrics.coverage = {
  cashLeft: "known" | "partial" | "missing";
  buyingPower: "known" | "partial" | "missing";
  totalEquity: "known" | "partial" | "missing";
  dailyPnl: "known" | "partial" | "missing";
  risk: "known" | "partial" | "missing";
}
```

If coverage is partial, show which source is missing in a source breakdown row.

## Daily Series

Use `dailySeries.points` for trend charts.

Recommended charts from backend:

- `cash-left`: `cashLeftUsd`, `riskAdjustedCashLeftUsd`
- `daily-pnl`: `realizedPnlTodayUsd`, `netPnlUsd`
- `risk`: `openRiskUsd`

If:

```ts
dailySeries.historyStatus === "current_day_only"
```

show a single-day chart or compact current-day state with “history collecting”. Do not invent historical data.

## Lanes

Render `lanes` as the system map:

- `leon_long_term`: long-term portfolio/research lane
- `leon_short_term_opportunity`: trims/adds/catalysts lane
- `oanda_fx_trading`: OANDA FX runtime and practice trading lane
- `khashi_perpetual_trading`: Khashi perpetual/shadow trading lane

Each lane includes:

- `status`
- `available`
- `capitalKnown`
- `liveTradingLocked`
- `kpis`
- `metricCoverage`
- `blockers`
- `recommendations`
- `sourceRoutes`

## Recent Activity

Use `recentEvents` for the last activity rail/table.

Fields:

- `sourceProject`
- `sourceSystem`
- `stream`
- `type`
- `status`
- `severity`
- `title`
- `occurredAt`
- `instrument`
- `summary`
- `links`

Render newest first. Give filters for source project, severity, and stream.

## Controls

Controls come from `actionQueue` and `/api/trading-intelligence/controls`.

Control rules:

- Never show a live-trade submit control from this page.
- All risky controls must preview first.
- POST to `/api/trading-intelligence/control`.
- Use namespaced actions such as `investing-system:pause_oanda_runtime`.
- Show result status and source project response.

Example POST:

```json
{
  "action": "investing-system:pause_oanda_runtime",
  "execute": false,
  "reason": "Operator reviewing risk before continuing."
}
```

## Frontend Version Options

### Version A: Executive Command Center

Best for quick phone or desktop check-ins.

Layout:

- compact sticky header
- large KPI ribbon
- two source cards
- daily trend strip
- action queue
- recent 10 events

Strength:

- fastest to understand
- best for “are we moving in the right direction?”

Weakness:

- less room for strategy/risk detail

### Version B: Trading Desk Operations

Best for active monitoring.

Layout:

- header with live lock and refresh
- KPI ribbon
- left system lane stack
- center charts: cash left, daily P/L, open risk
- right action queue and blockers
- bottom recent events table

Strength:

- best command-center feel
- gives controls and blockers proper weight

Weakness:

- denser and needs careful responsive behavior

### Version C: Risk-First Control Room

Best when live/paper promotion is the priority.

Layout:

- top risk/status band
- cash and risk cards grouped together
- source-by-source capital semantics table
- blocker matrix
- controls grouped by source
- strategy and recent trade panels lower on the page

Strength:

- prevents unsafe interpretation
- makes missing/partial data obvious

Weakness:

- less exciting visually
- P/L is secondary to safety

### Version D: Analyst Review Workspace

Best for reviewing strategy quality and trade outcomes.

Layout:

- KPI ribbon
- daily series charts
- tabs: Overview, Cash, P/L, Risk, Strategy, Events, Controls
- expandable event rows
- strategy and position detail drawers

Strength:

- best for deeper review sessions
- scales as more history is collected

Weakness:

- requires the most front-end state management

## Recommended First Build

Build Version B first.

Reason:

It matches the actual goal: one place to see Investing System and Khashi VC, understand current cash/P&L/risk, see what happened recently, and pause or escalate systems without jumping between dashboards.

## Visual Standards

Use the existing Nous/Hermes dashboard identity and dashboard-kit patterns. Do not copy Robinhood, Binance, OANDA, or Kalshi visual branding.

Recommended components:

- dashboard shell
- metric cards
- segmented tabs
- compact line/area/bar charts
- source comparison table
- action queue
- blocker panel
- event table
- freshness strip
- status badges

Density should be high but readable. Avoid landing-page layout, oversized hero cards, decorative gradients, and generic AI dashboard cards.

## Error And Empty States

Required states:

- all sources healthy
- one source unavailable
- source stale
- cash coverage partial
- no Khashi bankroll configured
- no recent events
- controls unavailable
- live trading locked
- command POST failed

If Khashi cash is missing, render:

```text
Khashi cash not configured. Khashi metrics are shadow/paper/read-only trading metrics, not Kalshi cash.
```

## Polling

Recommended:

- command center: every 30 seconds
- events visible: every 15 seconds
- controls: on tab open and after POST

Do not poll faster unless the backend later exposes streaming or an explicit fast-refresh endpoint.

## Implementation Checklist

- Call only the Nous endpoint for the main page.
- Treat all numeric `null`s as unknown.
- Render `coverage`.
- Render capital semantics before cash labels.
- Make live lock visible at all times.
- Keep controls preview-first.
- Do not include live submit order buttons.
- Include responsive mobile state.
- Include loading, empty, stale, partial, and failed states.
- Include source-by-source drilldown.
- Use `dailySeries.recommendedCharts` to decide chart series.
- Do not fabricate history when `historyStatus` is `current_day_only`.

