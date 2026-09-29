# Operational Live Source Validation Report

Generated: 2026-09-29T14:04:06.268Z

## Summary

| Metric | Value |
| --- | --- |
| baseUrl | http://127.0.0.1:9121 |
| sources | 50 |
| reachable | 50 |
| authRequired | 0 |
| dependencyUnavailable | 0 |
| failed | 0 |
| blocked | 0 |
| impactedRoutes | 0 |
| status | ready |
| authMode | loopback_session_token |
| sessionTokenDiscovered | true |

## Sources

| Source | Status | HTTP | Pages | Issue |
| --- | --- | --- | --- | --- |
| /api/analytics/models | reachable | 200 | /system/analytics | none |
| /api/analytics/usage | reachable | 200 | /system/analytics | none |
| /api/cron/jobs | reachable | 200 | /system/automations | none |
| /api/head-trader/audit | reachable | 200 | /trading/head-trader | none |
| /api/head-trader/credential-status | reachable | 200 | /system/credentials | none |
| /api/head-trader/incidents | reachable | 200 | /operate/incidents, /trading/head-trader | none |
| /api/head-trader/summary | reachable | 200 | /trading/head-trader, /trading/risk | none |
| /api/logs | reachable | 200 | /system/logs | none |
| /api/model/auxiliary | reachable | 200 | /system/models | none |
| /api/model/info | reachable | 200 | /system/models | none |
| /api/model/options | reachable | 200 | /system/models | none |
| /api/operating-runtime/audit | reachable | 200 | /operate, /operate/approvals, /operate/blockers, /operate/chat-actions, /operate/evidence | none |
| /api/operating-runtime/evidence | reachable | 200 | /operate, /operate/actions, /operate/blockers, /operate/chat-actions, /operate/evidence, /operate/runs, /system/deployments, /system/workers | none |
| /api/operating-runtime/incidents | reachable | 200 | /operate/incidents | none |
| /api/operating-runtime/summary | reachable | 200 | /operate | none |
| /api/operating-runtime/workbench | reachable | 200 | /operate/actions | none |
| /api/second-brain/candidates | reachable | 200 | /second-brain | none |
| /api/second-brain/compounding-intelligence | reachable | 200 | /compounding-intelligence | none |
| /api/second-brain/contradictions | reachable | 200 | /contradictions | none |
| /api/second-brain/decisions | reachable | 200 | /decision-lineage | none |
| /api/second-brain/retrieval-pack | reachable | 200 | /compounding-intelligence | none |
| /api/second-brain/search | reachable | 200 | /second-brain | none |
| /api/second-brain/summary | reachable | 200 | /second-brain | none |
| /api/sessions | reachable | 200 | /system/sessions | none |
| /api/status | reachable | 200 | /system/admin | none |
| /api/system/credentials/series | reachable | 200 | /system/credentials | none |
| /api/system/credentials/summary | reachable | 200 | /system/credentials | none |
| /api/system/deployments/series | reachable | 200 | /system/deployments | none |
| /api/system/deployments/summary | reachable | 200 | /system/deployments | none |
| /api/system/freshness/series | reachable | 200 | /system/freshness | none |
| /api/system/freshness/summary | reachable | 200 | /system/freshness | none |
| /api/system/stats | reachable | 200 | /system/admin | none |
| /api/system/storage/series | reachable | 200 | /system/storage | none |
| /api/system/storage/summary | reachable | 200 | /system/storage | none |
| /api/system/warehouse/jobs | reachable | 200 | /system/warehouse | none |
| /api/system/warehouse/series | reachable | 200 | /system/warehouse | none |
| /api/system/warehouse/sources | reachable | 200 | /system/freshness, /system/warehouse | none |
| /api/system/warehouse/summary | reachable | 200 | /system/warehouse | none |
| /api/system/workers/series | reachable | 200 | /system/workers | none |
| /api/system/workers/summary | reachable | 200 | /operate/runs, /system/workers | none |
| /api/trading-intelligence/command-center | reachable | 200 | /trading, /trading/investing, /trading/khashi, /trading/risk, /trading/shadow-paper, /trading/strategies | none |
| /api/trading-intelligence/controls | reachable | 200 | /trading | none |
| /api/trading-intelligence/events | reachable | 200 | /trading/evidence, /trading/shadow-paper | none |
| /api/trading-research/backtesting/series | reachable | 200 | /trading/backtesting | none |
| /api/trading-research/backtesting/summary | reachable | 200 | /trading/backtesting | none |
| /api/trading-research/evidence/ledger | reachable | 200 | /trading/evidence | none |
| /api/trading-research/evidence/series | reachable | 200 | /trading/evidence | none |
| /api/trading-research/strategies/series | reachable | 200 | /trading/strategies | none |
| /api/trading-research/strategies/summary | reachable | 200 | /trading/backtesting, /trading/strategies | none |
| /dashboard-plugins/registry | reachable | 200 | /system/plugins | none |

## Impacted Routes

No routes have unreachable declared live sources.
