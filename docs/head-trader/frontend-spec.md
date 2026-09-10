# Head Trader Frontend Spec

Backend contract: `head-trader-control-plane.v1`

Frontend contract: `2026-09-09.v1`

## Purpose

Build a world-class Head Trader page inside Nous Hermes Agent. The page is a conversation-first decision controller for Investing System/OANDA and Khashi VC/perpetual markets.

The page should make these questions obvious:

- What is broken or blocked?
- Which desk owns it: OANDA, Khashi, or cross-system risk?
- What evidence explains the issue?
- What does Head Trader recommend?
- What action is allowed?
- Does the action require confirmation?
- What happened after confirmation?
- Are Discord/Telegram channels enabled?

Do not build live trade submission UI. The backend forbids free-form execution and live order submit.

## API Base

Use same-origin Nous dashboard routes:

```text
/api/head-trader
```

Requests should use normal dashboard auth/session behavior:

```ts
fetch("/api/head-trader/summary", { credentials: "same-origin" })
```

## Endpoints

```text
GET  /api/head-trader/summary
POST /api/head-trader/refresh
GET  /api/head-trader/incidents
GET  /api/head-trader/incidents?status=open
GET  /api/head-trader/incidents/{incidentId}
POST /api/head-trader/incidents/{incidentId}/reply
POST /api/head-trader/incidents/{incidentId}/ignore
POST /api/head-trader/incidents/{incidentId}/resolve
GET  /api/head-trader/action-catalog
POST /api/head-trader/risk-check
POST /api/head-trader/decisions
POST /api/head-trader/decisions/{decisionId}/confirm
POST /api/head-trader/decisions/{decisionId}/reject
GET  /api/head-trader/conversations
GET  /api/head-trader/conversations/{conversationId}
GET  /api/head-trader/audit?limit=100
GET  /api/head-trader/evidence/{incidentId}
GET  /api/head-trader/channels
GET  /api/head-trader/credential-status
GET  /api/head-trader/credential-status/frontend-spec
POST /api/head-trader/webhooks/discord
POST /api/head-trader/webhooks/telegram
GET  /api/head-trader/frontend-spec
```

## Main Types

```ts
type DeskId = "oanda" | "khashi" | "cross_system";
type IncidentStatus = "open" | "waiting_for_human" | "approved" | "rejected" | "executing" | "executed" | "resolved" | "ignored" | "expired";
type PermissionLevel = "inform" | "auto_safe" | "approval_required" | "hard_gate" | "forbidden";
```

```ts
type HeadTraderSummary = {
  id: "head-trader-summary";
  contractVersion: "head-trader-control-plane.v1";
  frontendContractVersion: "2026-09-09.v1";
  generatedAt: string;
  status: "ready" | "watch" | "blocked";
  liveTradingLocked: true;
  desks: DeskStatus[];
  kpis: {
    openIncidents: number;
    waitingForHuman: number;
    criticalIncidents: number;
    actionsAvailable: number;
    sourceProjectsAvailable: number | null;
    sourceProjectsTotal: number | null;
  };
  latestIncidents: HeadTraderIncident[];
  recommendations: string[];
};
```

```ts
type HeadTraderIncident = {
  id: string;
  sourceProject: "investing-system" | "khashi-vc" | "nous-hermes-agent" | string;
  desk: DeskId;
  type: "blocker" | "risk" | "trade_candidate" | "runtime" | "data_quality" | "strategy_quality" | "storage_capacity" | "execution_failure" | string;
  severity: "info" | "watch" | "high" | "critical";
  title: string;
  summary: string;
  evidence: unknown;
  recommendation: string;
  options: HeadTraderActionOption[];
  status: IncidentStatus;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
};
```

```ts
type HeadTraderActionOption = {
  id: string;
  label: string;
  actionId: string | null;
  expectedEffect: string;
  requiresConfirmation: boolean;
};
```

```ts
type HeadTraderAction = {
  id: string;
  label: string;
  desk: DeskId;
  projectId: string;
  permissionLevel: PermissionLevel;
  liveTradingImpact: "none" | "paper_only" | "runtime_control" | "live_order";
  requiresConfirmation: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  backendControlId: string | null;
};
```

```ts
type RiskDecision = {
  id: "head-trader-risk-decision";
  contractVersion: "head-trader-control-plane.v1";
  generatedAt: string;
  allowed: boolean;
  level: "low" | "medium" | "high" | "critical";
  permissionLevel: PermissionLevel;
  requiresConfirmation: boolean;
  blockers: string[];
  explanation: string;
  liveTradingLocked: true;
};
```

```ts
type HeadTraderDecision = {
  id: string;
  incidentId?: string;
  actionId: string;
  backendControlId: string | null;
  actorId: string;
  channel: "dashboard" | "discord" | "telegram";
  reason: string;
  status: "waiting_for_confirmation" | "approved" | "rejected" | "executed" | "failed";
  risk: RiskDecision;
  result: unknown;
  createdAt: string;
  updatedAt: string;
};
```

## Page Layout

Recommended structure:

```text
Header
Desk status cards
KPI ribbon
Incident queue
Conversation panel
Action/risk panel
Audit rail
Channel status panel
Credential status panel
```

## Credential Status Panel

Use `GET /api/head-trader/credential-status` to show whether required
server-side trading credentials are available to Investing System and Khashi VC.
This route is deliberately redacted: it never returns API keys, secret keys,
tokens, prefixes, or suffixes.

Render:

- Overall status: `ready`, `watch`, or `blocked`
- Production proof freshness and `lastVerifiedAt`
- Project rows for `investing-system` and `khashi-vc`
- Credential id, expected services/containers, and blockers
- Variable status as configured/missing with optional value length
- Recommendation text explaining whether the system needs proof refresh or env repair

Do not render:

- Full credential values
- Partial keys
- Copyable secret fields
- Frontend forms that submit Binance secrets

Frontend request:

```ts
fetch("/api/head-trader/credential-status", { credentials: "same-origin" })
```

Proof refresh command for Nous/Hermes operators:

```bash
node scripts/generate-fleet-credential-status.mjs --write --production --strict
```

Core response shape:

```ts
type FleetCredentialStatus = {
  id: "fleet-credential-status";
  contractVersion: "fleet-credential-status.v1";
  generatedAt: string;
  status: "ready" | "watch" | "blocked";
  secretExposurePolicy: "values_never_returned";
  productionProof: {
    available: boolean;
    generatedAt: string | null;
    freshness: "fresh" | "stale" | "missing";
    mode?: string;
    host?: string;
  };
  projects: ProjectCredentialStatus[];
  blockers: string[];
  recommendations: string[];
};

type ProjectCredentialStatus = {
  projectId: "investing-system" | "khashi-vc" | string;
  label: string;
  credentialId: "binance.trading-api" | string;
  status: "ready" | "partial" | "missing" | "unknown";
  proofFreshness: "fresh" | "stale" | "missing";
  lastVerifiedAt: string | null;
  serviceIds: string[];
  productionContainers: string[];
  expectedSource: string;
  variables: CredentialVariableStatus[];
  blockers: string[];
};

type CredentialVariableStatus = {
  name: "BINANCE_API_KEY" | "BINANCE_SECRET_KEY" | string;
  configured: boolean;
  valueLength: number;
  source: string;
};
```

Header should show:

- Head Trader status
- Live trading locked badge
- Last refreshed
- Discord/Telegram status
- Manual refresh button

Desk cards:

- OANDA Desk Trader
- Khashi Perpetual Desk Trader
- Cross-System Risk Officer

Incident queue:

- Group by severity and desk
- Show status, recommendation, and top action option
- Do not hide ignored/resolved incidents if the user chooses historical view

Conversation panel:

- Selected incident
- Human replies
- Head Trader responses
- Intent interpretation
- Decision created from reply

Action/risk panel:

- Selected action
- Permission level
- Risk decision
- Confirmation button
- Reject button
- Backend result

Audit rail:

- Incident refreshed
- Reply received
- Decision created
- Risk checked
- Decision confirmed/rejected
- Control result

## UX Rules

- Never turn free-form text directly into execution.
- Always display interpreted intent before confirmation.
- Always display risk decision before confirmation.
- Hide or disable hard-gate/forbidden execution buttons.
- Show live order actions as forbidden.
- Use confirmation modals for `approval_required`.
- Use a separate “hard gate required” state for `hard_gate`.
- Keep source evidence expandable but not hidden.

## Suggested Fetch Layer

```ts
const BASE = "/api/head-trader";

export async function fetchHeadTraderSummary() {
  const response = await fetch(`${BASE}/summary`, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Head Trader summary failed: ${response.status}`);
  return response.json() as Promise<HeadTraderSummary>;
}

export async function refreshHeadTrader() {
  const response = await fetch(`${BASE}/refresh`, { method: "POST", credentials: "same-origin" });
  if (!response.ok) throw new Error(`Head Trader refresh failed: ${response.status}`);
  return response.json();
}

export async function replyToIncident(incidentId: string, message: string) {
  const response = await fetch(`${BASE}/incidents/${incidentId}/reply`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, channel: "dashboard" }),
  });
  if (!response.ok) throw new Error(`Reply failed: ${response.status}`);
  return response.json();
}

export async function confirmDecision(decisionId: string, reason: string) {
  const response = await fetch(`${BASE}/decisions/${decisionId}/confirm`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error(`Confirm failed: ${response.status}`);
  return response.json();
}
```

## Initial World-Class UI Target

The first frontend should feel like a serious trading operations cockpit:

- dense
- calm
- evidence-forward
- readable under pressure
- status-first
- strict around action safety

The page should answer in under ten seconds:

```text
What needs judgment, why, what does Head Trader recommend, and what can I safely do?
```

## Implementation notes (added when the page shipped)

The page lives at `/head-trader`:

| Piece | Path |
|---|---|
| Page | `web/src/pages/HeadTraderPage.tsx` |
| Typed client + derivations | `web/src/lib/head-trader.ts` |
| Unit tests | `web/src/lib/head-trader.test.ts` |
| Route + metadata | `web/src/dashboard-route-registry.tsx`, `web/src/dashboard-page-metadata.ts` |
| Render evidence | `docs/head-trader/evidence/` |

Three corrections to the fetch layer sketched above, all load-bearing:

1. `credentials: "same-origin"` is not enough. The dashboard passes
   `X-Hermes-Session-Token` from `window.__HERMES_SESSION_TOKEN__` on the
   loopback path, uses cookies only when the OAuth gate is engaged, and
   prefixes `window.__HERMES_BASE_PATH__` behind a reverse proxy. Use
   `fetchJSON` from `@/lib/api`; the wrapper above 401s locally and 404s
   behind a prefix.
2. `hard_gate` and `forbidden` render, disabled, with the reason — never
   hidden. An operator who cannot see the forbidden action does not learn
   that it is forbidden.
3. A decision is confirmable exactly once, from `waiting_for_confirmation`
   or `approved`. The frontend mirrors the backend's
   `CONFIRMABLE_DECISION_STATUSES` so the button disappears rather than
   producing a rejection.

### Channel wiring

Inbound Discord/Telegram is off until three things are all true, and the
Channels panel names whichever is missing:

```sh
HEAD_TRADER_TELEGRAM_ENABLED=true
HEAD_TRADER_TELEGRAM_WEBHOOK_SECRET=<the secret passed to setWebhook>
HEAD_TRADER_TELEGRAM_ALLOWED_SENDERS=<your telegram user id>

HEAD_TRADER_DISCORD_ENABLED=true
HEAD_TRADER_DISCORD_PUBLIC_KEY=<application public key, hex>
HEAD_TRADER_DISCORD_ALLOWED_SENDERS=<your discord user id>
```

An inbound message must reference an incident id (reply to the alert, or
include `incident-...` in the text). It can only ever draft a decision that
still needs confirmation — chat can start a decision, chat can never finish
one.

### Re-running the render evidence

```sh
cd web && npm run build
node docs/head-trader/evidence/page-harness.mjs &
node docs/head-trader/evidence/page-verify.mjs
```

Drives Chromium over loaded / incident-selected / reply / refusal /
cross-desk / confirm / empty / error / mobile and asserts the safety rules
hold on screen: a reply never produces a backend result, a refusal never
produces a confirmable decision, an OANDA incident never proposes a Khashi
control, confirm is gated on a typed reason, and an executed decision cannot
be confirmed again.
