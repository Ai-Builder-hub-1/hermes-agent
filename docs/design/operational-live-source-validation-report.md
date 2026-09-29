# Operational Live Source Validation Report

Generated: 2026-09-29T13:15:49.902Z

## Summary

| Metric | Value |
| --- | --- |
| baseUrl | http://127.0.0.1:9119 |
| sources | 49 |
| reachable | 0 |
| failed | 0 |
| blocked | 49 |
| impactedRoutes | 32 |
| status | attention |

## Sources

| Source | Status | HTTP | Pages | Issue |
| --- | --- | --- | --- | --- |
| /api/analytics | blocked |  | /system/analytics | fetch failed |
| /api/cron/jobs | blocked |  | /system/automations | fetch failed |
| /api/head-trader/audit | blocked |  | /trading/head-trader | fetch failed |
| /api/head-trader/credential-status | blocked |  | /system/credentials | fetch failed |
| /api/head-trader/incidents | blocked |  | /operate/incidents, /trading/head-trader | fetch failed |
| /api/head-trader/risk-check | blocked |  | /trading/risk | fetch failed |
| /api/head-trader/summary | blocked |  | /trading/head-trader, /trading/risk | fetch failed |
| /api/logs | blocked |  | /system/logs | fetch failed |
| /api/model/auxiliary | blocked |  | /system/models | fetch failed |
| /api/model/info | blocked |  | /system/models | fetch failed |
| /api/model/options | blocked |  | /system/models | fetch failed |
| /api/operating-runtime/audit | blocked |  | /operate, /operate/approvals, /operate/blockers, /operate/chat-actions, /operate/evidence | fetch failed |
| /api/operating-runtime/evidence | blocked |  | /operate, /operate/actions, /operate/blockers, /operate/chat-actions, /operate/evidence, /operate/runs, /system/deployments, /system/workers | fetch failed |
| /api/operating-runtime/incidents | blocked |  | /operate/incidents | fetch failed |
| /api/operating-runtime/permission-decision | blocked |  | /operate/approvals | fetch failed |
| /api/operating-runtime/summary | blocked |  | /operate | fetch failed |
| /api/operating-runtime/workbench | blocked |  | /operate/actions | fetch failed |
| /api/second-brain/candidates | blocked |  | /second-brain | fetch failed |
| /api/second-brain/compounding-intelligence | blocked |  | /compounding-intelligence | fetch failed |
| /api/second-brain/retrieval-pack | blocked |  | /compounding-intelligence | fetch failed |
| /api/second-brain/search | blocked |  | /second-brain | fetch failed |
| /api/second-brain/summary | blocked |  | /second-brain | fetch failed |
| /api/sessions | blocked |  | /system/sessions | fetch failed |
| /api/status | blocked |  | /system/admin | fetch failed |
| /api/system/credentials/series | blocked |  | /system/credentials | fetch failed |
| /api/system/credentials/summary | blocked |  | /system/credentials | fetch failed |
| /api/system/deployments/series | blocked |  | /system/deployments | fetch failed |
| /api/system/deployments/summary | blocked |  | /system/deployments | fetch failed |
| /api/system/freshness/series | blocked |  | /system/freshness | fetch failed |
| /api/system/freshness/summary | blocked |  | /system/freshness | fetch failed |
| /api/system/stats | blocked |  | /system/admin | fetch failed |
| /api/system/storage/series | blocked |  | /system/storage | fetch failed |
| /api/system/storage/summary | blocked |  | /system/storage | fetch failed |
| /api/system/warehouse/jobs | blocked |  | /system/warehouse | fetch failed |
| /api/system/warehouse/series | blocked |  | /system/warehouse | fetch failed |
| /api/system/warehouse/sources | blocked |  | /system/freshness, /system/warehouse | fetch failed |
| /api/system/warehouse/summary | blocked |  | /system/warehouse | fetch failed |
| /api/system/workers/series | blocked |  | /system/workers | fetch failed |
| /api/system/workers/summary | blocked |  | /operate/runs, /system/workers | fetch failed |
| /api/trading-intelligence/command-center | blocked |  | /trading, /trading/investing, /trading/khashi, /trading/risk, /trading/shadow-paper, /trading/strategies | fetch failed |
| /api/trading-intelligence/controls | blocked |  | /trading | fetch failed |
| /api/trading-intelligence/events | blocked |  | /trading/evidence, /trading/shadow-paper | fetch failed |
| /api/trading-research/backtesting/series | blocked |  | /trading/backtesting | fetch failed |
| /api/trading-research/backtesting/summary | blocked |  | /trading/backtesting | fetch failed |
| /api/trading-research/evidence/ledger | blocked |  | /trading/evidence | fetch failed |
| /api/trading-research/evidence/series | blocked |  | /trading/evidence | fetch failed |
| /api/trading-research/strategies/series | blocked |  | /trading/strategies | fetch failed |
| /api/trading-research/strategies/summary | blocked |  | /trading/backtesting, /trading/strategies | fetch failed |
| /dashboard-plugins/registry | blocked |  | /system/plugins | fetch failed |

## Impacted Routes

| Route | Blocked sources |
| --- | --- |
| /compounding-intelligence | /api/second-brain/compounding-intelligence, /api/second-brain/retrieval-pack |
| /operate | /api/operating-runtime/audit, /api/operating-runtime/evidence, /api/operating-runtime/summary |
| /operate/actions | /api/operating-runtime/evidence, /api/operating-runtime/workbench |
| /operate/approvals | /api/operating-runtime/audit, /api/operating-runtime/permission-decision |
| /operate/blockers | /api/operating-runtime/audit, /api/operating-runtime/evidence |
| /operate/chat-actions | /api/operating-runtime/audit, /api/operating-runtime/evidence |
| /operate/evidence | /api/operating-runtime/audit, /api/operating-runtime/evidence |
| /operate/incidents | /api/head-trader/incidents, /api/operating-runtime/incidents |
| /operate/runs | /api/operating-runtime/evidence, /api/system/workers/summary |
| /second-brain | /api/second-brain/candidates, /api/second-brain/search, /api/second-brain/summary |
| /system/admin | /api/status, /api/system/stats |
| /system/analytics | /api/analytics |
| /system/automations | /api/cron/jobs |
| /system/credentials | /api/head-trader/credential-status, /api/system/credentials/series, /api/system/credentials/summary |
| /system/deployments | /api/operating-runtime/evidence, /api/system/deployments/series, /api/system/deployments/summary |
| /system/freshness | /api/system/freshness/series, /api/system/freshness/summary, /api/system/warehouse/sources |
| /system/logs | /api/logs |
| /system/models | /api/model/auxiliary, /api/model/info, /api/model/options |
| /system/plugins | /dashboard-plugins/registry |
| /system/sessions | /api/sessions |
| /system/storage | /api/system/storage/series, /api/system/storage/summary |
| /system/warehouse | /api/system/warehouse/jobs, /api/system/warehouse/series, /api/system/warehouse/sources, /api/system/warehouse/summary |
| /system/workers | /api/operating-runtime/evidence, /api/system/workers/series, /api/system/workers/summary |
| /trading | /api/trading-intelligence/command-center, /api/trading-intelligence/controls |
| /trading/backtesting | /api/trading-research/backtesting/series, /api/trading-research/backtesting/summary, /api/trading-research/strategies/summary |
| /trading/evidence | /api/trading-intelligence/events, /api/trading-research/evidence/ledger, /api/trading-research/evidence/series |
| /trading/head-trader | /api/head-trader/audit, /api/head-trader/incidents, /api/head-trader/summary |
| /trading/investing | /api/trading-intelligence/command-center |
| /trading/khashi | /api/trading-intelligence/command-center |
| /trading/risk | /api/head-trader/risk-check, /api/head-trader/summary, /api/trading-intelligence/command-center |
| /trading/shadow-paper | /api/trading-intelligence/command-center, /api/trading-intelligence/events |
| /trading/strategies | /api/trading-intelligence/command-center, /api/trading-research/strategies/series, /api/trading-research/strategies/summary |
