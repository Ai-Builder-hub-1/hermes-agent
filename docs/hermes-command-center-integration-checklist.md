# Hermes Command Center Integration Checklist

Status: local command-center complete; external/live setup required.
Last updated: 2026-07-25.

## Readiness Split

| Layer | Current Status | Meaning |
| --- | ---: | --- |
| Local command-center surface | 100% | Executive briefing, project feed registry, action gates, production evidence checklist, and human setup queue are built locally. |
| External/live integration | 56% | Hermes can model and prepare integrations, but live feeds, credentials, production evidence, and always-on workers are not fully connected. |
| Overall operating readiness | 72% | Blended state across local surfaces, downstream project adoption, production evidence, cost telemetry, and runtime execution. |

## Human-Owned Setup Items

| Integration | Required Values | Store In | Unlocks |
| --- | --- | --- | --- |
| OpenAI actual cost feed | `OPENAI_ADMIN_KEY`, `OPENAI_ORG_ID` | GitHub production environment or org secret store for the billing adapter | Actual OpenAI spend import, model cost attribution, budget alerts |
| Google Cloud and Gemini billing | `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `GOOGLE_CLOUD_BILLING_ACCOUNT_ID`, `GOOGLE_CLOUD_BILLING_EXPORT_DATASET`, `GOOGLE_CLOUD_BILLING_EXPORT_TABLE` | GitHub production environment or org secret store for the billing adapter | Gemini/Google spend import, cloud service cost attribution, budget alerts |
| DeepSeek and Fireworks billing | `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY` | GitHub production environment or org secret store for the billing adapter | Fallback model spend import, provider comparison, capacity guardrails |
| Hetzner production rail | `HETZNER_HOST`, `HETZNER_USER`, `HETZNER_SSH_KEY`, `PRODUCTION_DOMAIN` | GitHub production environment or project deployment secret store | Production deploy evidence, restore drills, server health checks |
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

Production-affecting actions must remain approval-gated until each action has evidence capture, rollback or bypass path, production secret posture, and owner assignment.

## External Work Sequence

1. Add provider billing credentials and exports.
2. Add the TLC authority matrix feed.
3. Add project outcome/report feeds in the active business units.
4. Capture production screenshots, health checks, and restore drill evidence.
5. Connect always-on Hermes worker runtime and review enforcement.
6. Promote action gates from preparation-only to approved live execution.
