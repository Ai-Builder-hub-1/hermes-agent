# Canonical Runtime Env Standard

Generated: 2026-10-03

This standard closes the gap between software maturity and production proof. It defines which runtime inputs may be shared through `~/.hermes.env`, which inputs must stay session/runtime injected, and which command proves the system is unblocked.

## Global-Safe Runtime Inputs

These values are configuration, not secrets. They may live in `~/.hermes.env` and are loaded by the cross-project proof commands.

| Variable | Used By | Purpose |
| --- | --- | --- |
| `EARNINGS_BACKFILL_ARCHIVE_ROOT` | Investing System, Nous audit | Durable production-managed earnings staging/archive root. |
| `EARNINGS_WAREHOUSE_ARCHIVE_ROOT` | Investing System, Nous audit | Durable warehouse destination for mirrored earnings archives. |
| `KHASHI_FRESHNESS_BASE_URL` | Khashi VC, Nous audit | Khashi freshness proof base URL. |
| `KHASHI_ROC_BASE_URL` | Khashi VC, Nous audit | Khashi ROC fallback base URL. |
| `MARKET_WAREHOUSE_ROOT` | Khashi VC, Nous audit | Readable market warehouse catalog root. |
| `KHASHI_WAREHOUSE_ROOT` | Khashi VC, Nous audit | Khashi-specific warehouse catalog root override. |

## Explicit Runtime/Auth Inputs

These values are credentials or session-equivalent. They should be provided by the production runtime, secret manager, or current operator shell. They are not silently loaded through the Khashi proof-script global loader.

| Variable | Used By | Purpose |
| --- | --- | --- |
| `KHASHI_FRESHNESS_TOKEN` | Khashi VC | Bearer token for production freshness proof. |
| `AMARI_VIEWER_TOKEN` | Khashi VC | Viewer token alias for freshness proof. |
| `AMARI_RESEARCHER_TOKEN` | Khashi VC | Researcher token alias for freshness proof. |
| `DASHBOARD_BEARER_TOKEN` | Nous Hermes | Production dashboard API proof. |
| `DASHBOARD_AUTH_COOKIE` | Nous Hermes | Production dashboard API proof through browser/session cookie. |
| `HERMES_DASHBOARD_SESSION_TOKEN` | Nous Hermes | Hermes dashboard session token for protected API validation. |
| `DASHBOARD_SESSION_TOKEN` | Nous Hermes | Session token alias for protected API validation. |

## Proof Commands

Investing:

```bash
cd /Users/hq/Workspace/projects/investing-system
npm run earnings:warehouse:production-proof -- --write-mirror --output=docs/proofs/earnings-warehouse-production-proof-latest.json
```

Khashi:

```bash
cd /Users/hq/Workspace/projects/khashi-vc
KHASHI_FRESHNESS_MODE=production npm run khashi:freshness:proof
npm run khashi:storage:maturity
npm run reports:generate
npm run khashi:maturity:truth
```

Nous:

```bash
cd /Users/hq/Workspace/projects/nous-hermes-agent
npm run dashboard:operational-sources:validate -- --base-url https://agent.tlccapitalgroup.com
npm run canonical:runtime-blockers:audit
npm run canonical:software-maturity:validate:strict
```

## Readiness Rule

Software maturity can be ready while runtime proof remains blocked. Operational maturity is ready only when:

- the Investing proof is `ready`;
- the Khashi maturity truth report is `ready`;
- the Nous source validation report is `ready`;
- OANDA live trading remains locked until explicit approval;
- destructive pruning remains locked until explicit approval.
