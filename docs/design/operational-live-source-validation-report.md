# Operational Live Source Validation Report

Generated: 2026-10-03T02:18:14.659Z

## Summary

| Metric | Value |
| --- | --- |
| baseUrl | https://agent.tlccapitalgroup.com |
| sources | 56 |
| reachable | 3 |
| authRequired | 53 |
| dependencyUnavailable | 0 |
| failed | 0 |
| blocked | 0 |
| impactedRoutes | 35 |
| status | auth_required |
| authMode | none |
| sessionTokenDiscovered | false |

## Sources

| Source | Status | HTTP | Pages | Issue |
| --- | --- | --- | --- | --- |
| /api/analytics/models | auth_required | 401 | /system/analytics | HTTP status 401 |
| /api/analytics/usage | auth_required | 401 | /system/analytics | HTTP status 401 |
| /api/compounding-intelligence/summary | auth_required | 401 | /compounding-intelligence | HTTP status 401 |
| /api/cron/jobs | auth_required | 401 | /system/automations | HTTP status 401 |
| /api/head-trader/audit | auth_required | 401 | /trading/head-trader | HTTP status 401 |
| /api/head-trader/credential-status | auth_required | 401 | /system/credentials | HTTP status 401 |
| /api/head-trader/incidents | auth_required | 401 | /operate/incidents, /trading/head-trader | HTTP status 401 |
| /api/head-trader/summary | auth_required | 401 | /trading/head-trader | HTTP status 401 |
| /api/logs | auth_required | 401 | /system/logs | HTTP status 401 |
| /api/model/auxiliary | auth_required | 401 | /system/models | HTTP status 401 |
| /api/model/info | reachable | 200 | /system/models | none |
| /api/model/options | auth_required | 401 | /system/models | HTTP status 401 |
| /api/operate/queue | auth_required | 401 | /operate | HTTP status 401 |
| /api/operating-runtime/audit | auth_required | 401 | /operate, /operate/approvals, /operate/blockers, /operate/chat-actions, /operate/evidence | HTTP status 401 |
| /api/operating-runtime/evidence | auth_required | 401 | /operate, /operate/actions, /operate/blockers, /operate/chat-actions, /operate/evidence, /operate/runs, /system/deployments, /system/workers | HTTP status 401 |
| /api/operating-runtime/incidents | auth_required | 401 | /operate/incidents | HTTP status 401 |
| /api/operating-runtime/summary | auth_required | 401 | /operate | HTTP status 401 |
| /api/operating-runtime/workbench | auth_required | 401 | /operate/actions | HTTP status 401 |
| /api/second-brain/candidates | auth_required | 401 | /second-brain | HTTP status 401 |
| /api/second-brain/contradictions | auth_required | 401 | /contradictions | HTTP status 401 |
| /api/second-brain/decision-intelligence/metrics | auth_required | 401 | /preflight | HTTP status 401 |
| /api/second-brain/decisions | auth_required | 401 | /decision-lineage | HTTP status 401 |
| /api/second-brain/high-impact-workflows | auth_required | 401 | /preflight | HTTP status 401 |
| /api/second-brain/preflight-checks | auth_required | 401 | /preflight | HTTP status 401 |
| /api/second-brain/research-tasks | auth_required | 401 | /research-queue | HTTP status 401 |
| /api/second-brain/search | auth_required | 401 | /second-brain | HTTP status 401 |
| /api/second-brain/summary | auth_required | 401 | /second-brain | HTTP status 401 |
| /api/sessions | auth_required | 401 | /system/sessions | HTTP status 401 |
| /api/status | reachable | 200 | /system/admin | none |
| /api/system/credentials/series | auth_required | 401 | /system/credentials | HTTP status 401 |
| /api/system/credentials/summary | auth_required | 401 | /system/credentials | HTTP status 401 |
| /api/system/deployments/series | auth_required | 401 | /system/deployments | HTTP status 401 |
| /api/system/deployments/summary | auth_required | 401 | /system/deployments | HTTP status 401 |
| /api/system/freshness/series | auth_required | 401 | /system/freshness | HTTP status 401 |
| /api/system/freshness/summary | auth_required | 401 | /system/freshness | HTTP status 401 |
| /api/system/stats | auth_required | 401 | /system/admin | HTTP status 401 |
| /api/system/storage/series | auth_required | 401 | /system/storage | HTTP status 401 |
| /api/system/storage/summary | auth_required | 401 | /system/storage | HTTP status 401 |
| /api/system/warehouse/jobs | auth_required | 401 | /system/warehouse | HTTP status 401 |
| /api/system/warehouse/series | auth_required | 401 | /system/warehouse | HTTP status 401 |
| /api/system/warehouse/sources | auth_required | 401 | /system/freshness, /system/warehouse | HTTP status 401 |
| /api/system/warehouse/summary | auth_required | 401 | /system/warehouse | HTTP status 401 |
| /api/system/workers/series | auth_required | 401 | /system/workers | HTTP status 401 |
| /api/system/workers/summary | auth_required | 401 | /operate/runs, /system/workers | HTTP status 401 |
| /api/trading-intelligence/command-center | auth_required | 401 | /trading, /trading/investing, /trading/khashi, /trading/shadow-paper, /trading/strategies | HTTP status 401 |
| /api/trading-intelligence/controls | auth_required | 401 | /trading | HTTP status 401 |
| /api/trading-intelligence/events | auth_required | 401 | /trading/evidence, /trading/shadow-paper | HTTP status 401 |
| /api/trading-intelligence/portfolio/summary | auth_required | 401 | /trading/risk | HTTP status 401 |
| /api/trading-research/backtesting/series | auth_required | 401 | /trading/backtesting | HTTP status 401 |
| /api/trading-research/backtesting/summary | auth_required | 401 | /trading/backtesting | HTTP status 401 |
| /api/trading-research/evidence/ledger | auth_required | 401 | /trading/evidence | HTTP status 401 |
| /api/trading-research/evidence/series | auth_required | 401 | /trading/evidence | HTTP status 401 |
| /api/trading-research/outcomes/summary | auth_required | 401 | /trading/evidence | HTTP status 401 |
| /api/trading-research/strategies/series | auth_required | 401 | /trading/strategies | HTTP status 401 |
| /api/trading-research/strategies/summary | auth_required | 401 | /trading/backtesting, /trading/strategies | HTTP status 401 |
| /dashboard-plugins/registry | reachable | 200 | /system/plugins | none |

## Impacted Routes

| Route | Blocked sources |
| --- | --- |
| /compounding-intelligence | /api/compounding-intelligence/summary |
| /contradictions | /api/second-brain/contradictions |
| /decision-lineage | /api/second-brain/decisions |
| /operate | /api/operate/queue, /api/operating-runtime/audit, /api/operating-runtime/evidence, /api/operating-runtime/summary |
| /operate/actions | /api/operating-runtime/evidence, /api/operating-runtime/workbench |
| /operate/approvals | /api/operating-runtime/audit |
| /operate/blockers | /api/operating-runtime/audit, /api/operating-runtime/evidence |
| /operate/chat-actions | /api/operating-runtime/audit, /api/operating-runtime/evidence |
| /operate/evidence | /api/operating-runtime/audit, /api/operating-runtime/evidence |
| /operate/incidents | /api/head-trader/incidents, /api/operating-runtime/incidents |
| /operate/runs | /api/operating-runtime/evidence, /api/system/workers/summary |
| /preflight | /api/second-brain/decision-intelligence/metrics, /api/second-brain/high-impact-workflows, /api/second-brain/preflight-checks |
| /research-queue | /api/second-brain/research-tasks |
| /second-brain | /api/second-brain/candidates, /api/second-brain/search, /api/second-brain/summary |
| /system/admin | /api/system/stats |
| /system/analytics | /api/analytics/models, /api/analytics/usage |
| /system/automations | /api/cron/jobs |
| /system/credentials | /api/head-trader/credential-status, /api/system/credentials/series, /api/system/credentials/summary |
| /system/deployments | /api/operating-runtime/evidence, /api/system/deployments/series, /api/system/deployments/summary |
| /system/freshness | /api/system/freshness/series, /api/system/freshness/summary, /api/system/warehouse/sources |
| /system/logs | /api/logs |
| /system/models | /api/model/auxiliary, /api/model/options |
| /system/sessions | /api/sessions |
| /system/storage | /api/system/storage/series, /api/system/storage/summary |
| /system/warehouse | /api/system/warehouse/jobs, /api/system/warehouse/series, /api/system/warehouse/sources, /api/system/warehouse/summary |
| /system/workers | /api/operating-runtime/evidence, /api/system/workers/series, /api/system/workers/summary |
| /trading | /api/trading-intelligence/command-center, /api/trading-intelligence/controls |
| /trading/backtesting | /api/trading-research/backtesting/series, /api/trading-research/backtesting/summary, /api/trading-research/strategies/summary |
| /trading/evidence | /api/trading-intelligence/events, /api/trading-research/evidence/ledger, /api/trading-research/evidence/series, /api/trading-research/outcomes/summary |
| /trading/head-trader | /api/head-trader/audit, /api/head-trader/incidents, /api/head-trader/summary |
| /trading/investing | /api/trading-intelligence/command-center |
| /trading/khashi | /api/trading-intelligence/command-center |
| /trading/risk | /api/trading-intelligence/portfolio/summary |
| /trading/shadow-paper | /api/trading-intelligence/command-center, /api/trading-intelligence/events |
| /trading/strategies | /api/trading-intelligence/command-center, /api/trading-research/strategies/series, /api/trading-research/strategies/summary |
