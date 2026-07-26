# Hermes Command Center Integration Checklist

Status: local command-center complete; external/live setup required.
Last updated: 2026-07-26.

## Readiness Split

| Layer | Current Status | Meaning |
| --- | ---: | --- |
| Local command-center surface | 100% | Executive briefing, project feed registry, action gates, production evidence checklist, and human setup queue are built locally. |
| External/live integration | 66% | Hermes now has the Remote Operator Runtime dry-run foundation and cross-project integration/credential registry, but live secret-store verification, provider credentials, Discord/Telegram tokens, VPS services, and always-on workers are not fully connected. |
| Overall operating readiness | 82% | Blended state across local surfaces, downstream project adoption, production evidence, cost telemetry, remote operator foundation, integration registry, and runtime execution. |

## Current Build Slice

| Slice | Status | Notes |
| --- | ---: | --- |
| Phase 74 - Remote Operator Runtime | 100% local foundation | Shared remote command envelope, config, policy checks, job status, approval prompts, audit records, health summary, CLI preview/status, dashboard panels, tests, and phase tracking are built. |
| Phase 75 - Discord And Telegram Gateways | 0% implementation | Plan exists; requires gateway adapter implementation plus `DISCORD_BOT_TOKEN`, `TELEGRAM_BOT_TOKEN`, allowed IDs, and VPS service configuration. |
| Phase 76 - Project-Aware Remote Delegation | 0% implementation | Plan exists; requires specialist routing against live project registry, project memory, feeds, and agent briefing workflows. |
| Phase 77 - Approval-Gated Live Execution | 0% implementation | Plan exists; requires worker adapters, allowlists, budget checks, production evidence, rollback paths, and operator approval flows. |
| Phase 78 - Remote Operator Dashboard Integration | 15% foundation | Dashboard now has remote operator health/job/inbox panels; live activity feed and action controls still need implementation. |
| Phase 79 - Global Integration And Credential Registry | 100% local foundation | Cross-project integration records, credential requirements, global-secret candidates, per-project matrix, missing setup items, CLI, dashboard panels, tests, and phase tracking are built. |

## Human-Owned Setup Items

| Integration | Required Values | Store In | Unlocks |
| --- | --- | --- | --- |
| OpenAI actual cost feed | `OPENAI_ADMIN_KEY`, `OPENAI_ORG_ID` | GitHub production environment or org secret store for the billing adapter | Actual OpenAI spend import, model cost attribution, budget alerts |
| Google Cloud and Gemini billing | `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `GOOGLE_CLOUD_BILLING_ACCOUNT_ID`, `GOOGLE_CLOUD_BILLING_EXPORT_DATASET`, `GOOGLE_CLOUD_BILLING_EXPORT_TABLE` | GitHub production environment or org secret store for the billing adapter | Gemini/Google spend import, cloud service cost attribution, budget alerts |
| DeepSeek and Fireworks billing | `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY` | GitHub production environment or org secret store for the billing adapter | Fallback model spend import, provider comparison, capacity guardrails |
| Hetzner production rail | `HETZNER_HOST`, `HETZNER_USER`, `HETZNER_SSH_KEY`, `PRODUCTION_DOMAIN` | GitHub production environment or project deployment secret store | Production deploy evidence, restore drills, server health checks |
| Discord remote operator gateway | `DISCORD_BOT_TOKEN`, allowed Discord user IDs, allowed channel IDs, signing/public key if used | VPS secret store plus GitHub production environment for deploy automation | Discord control surface for briefings, project routing, approvals, streaming status, and workflow launch |
| Telegram remote operator gateway | `TELEGRAM_BOT_TOKEN`, allowed Telegram user IDs, allowed chat IDs | VPS secret store plus GitHub production environment for deploy automation | Telegram/watch-friendly control surface for briefings, approvals, status, specialist agent requests, and workflow launch |
| Remote operator runtime | `HERMES_OPERATOR_API_URL`, `HERMES_OPERATOR_API_TOKEN`, worker allowlist, project workspace root, emergency stop policy | VPS secret store and Hermes production config | Always-on Hermes command router, job queue, worker delegation, streamed progress, approval gates, and audit records |
| TLC authority matrix | production approval owner, spend approval owner, publishing approval owner, destructive action policy | TLC Capital Group OS report feed | Safe command gates, agent delegation policy, approval ledger |

## Project Feed Adoption

| Project | Feed State | Required Feed |
| --- | --- | --- |
| TLC Capital Group OS | Manual sample | Authority matrix and portfolio governance status |
| Hermes | Manual sample | Technical control-plane readiness, worker state, queue state, production drill evidence |
| Media Engine | Stubbed | Output, platform readiness, cost, publishing package, and channel postability feed |
| Khashi VC | Stubbed | Market scan, experiment capacity, restart criteria, and revenue signal feed |
| Media Business Operations | Stubbed | Business readiness, cost, revenue, and blocker feed |
| Rinseables OS | Blocked | Product/business OS readiness and production status feed |

## Command Gate Policy

Hermes can now prepare the following action classes from the command center:

- build from selected plan
- commit and push changes
- deploy to production
- import provider costs
- open incident triage
- delegate agent work
- receive Discord and Telegram operator requests
- route remote requests to project-specific specialist agents
- stream long-running workflow progress back to the originating gateway
- approve, reject, pause, or stop remote jobs

Production-affecting actions must remain approval-gated until each action has evidence capture, rollback or bypass path, production secret posture, and owner assignment.

## External Work Sequence

1. Add provider billing credentials and exports.
2. Add the TLC authority matrix feed.
3. Add project outcome/report feeds in the active business units.
4. Capture production screenshots, health checks, and restore drill evidence.
5. Connect always-on Hermes worker runtime and review enforcement.
6. Promote action gates from preparation-only to approved live execution.

## Remote Operator Build Sequence

1. Define the shared command envelope for CLI, API, dashboard, Discord, and Telegram requests.
2. Add the always-on Hermes operator API with authentication, project scoping, audit records, and health checks.
3. Add dry-run Discord and Telegram gateways that can answer status, briefing, and project-routing requests.
4. Add streaming progress events for active workflows, blockers, artifacts, commits, deploys, and final summaries.
5. Add approval prompts for write-capable, costly, production-affecting, and destructive actions.
6. Add project-aware specialist routing for Khashi lead scientist, Media Engine, Media Business Operations, TLC, Rinseables OS, and future registered projects.
7. Add allowlisted worker adapters for Codex or equivalent coding sessions, tests, feed refreshes, dashboard refreshes, commits, pushes, and deployment rails.
8. Mirror every remote request, approval, worker session, artifact, and outcome into the Hermes dashboard.
9. Enable one low-risk project in live mode, then expand per project after evidence and rollback policies pass.

## Integration Registry Commands

- `hermes integrations needed`: simple list of required credentials still needed.
- `hermes integrations promote`: simple list of credentials found in project `.env` files that should be promoted to global/shared storage.
- `hermes integrations present`: simple list of required credentials already present globally.
- `hermes integrations status`: full cross-project integration and credential registry.
- `hermes integrations missing`: missing credentials, human-owned setup items, and global secret candidates.
- `hermes integrations projects`: project-by-project integration matrix.
- `hermes integrations dashboard`: dashboard panel payloads for registry summary, missing credentials, and project matrix.
