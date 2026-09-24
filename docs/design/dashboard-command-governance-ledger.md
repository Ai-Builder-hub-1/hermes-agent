# Dashboard Command Governance Ledger

Generated: 2026-09-24T17:15:59.082Z

## Decision

- Safe command posture: yes
- Unsafe enabled mutations: 0
- Missing command controls: 0
- Read-only eligible actions: 340
- Blocked mutating actions: 408

## Policy

Mutating actions remain disabled until the live endpoint, permission gate, confirmation step, audit event, cooldown, duplicate suppression, and rollback/recovery proof all exist. This is treated as the safe production posture.

## Routes

| Priority | Route | Posture | Read-only eligible | Mutating blocked | Unsafe mutations |
| --- | --- | --- | ---: | ---: | ---: |
| P3 | /hermes-os | locked-safe | 5 | 6 | 0 |
| P2 | /design-system | locked-safe | 5 | 6 | 0 |
| P2 | /design-intelligence | locked-safe | 5 | 6 | 0 |
| P3 | /dashboard-migrations | locked-safe | 5 | 6 | 0 |
| P3 | /executive-summary | locked-safe | 5 | 6 | 0 |
| P3 | /executive-briefing | locked-safe | 5 | 6 | 0 |
| P0 | /central-command | locked-safe | 5 | 6 | 0 |
| P3 | /theme-system | locked-safe | 5 | 6 | 0 |
| P2 | /dashboard-marketplace | locked-safe | 5 | 6 | 0 |
| P2 | /dashboard-prototypes | locked-safe | 5 | 6 | 0 |
| P2 | /hermes-command | locked-safe | 5 | 6 | 0 |
| P3 | /live-signals | locked-safe | 5 | 6 | 0 |
| P3 | /task-routing | locked-safe | 5 | 6 | 0 |
| P3 | /decision-ledger | locked-safe | 5 | 6 | 0 |
| P3 | /model-routing | locked-safe | 5 | 6 | 0 |
| P3 | /operating-loops | locked-safe | 5 | 6 | 0 |
| P1 | /permission-security | locked-safe | 5 | 6 | 0 |
| P3 | /business-os | locked-safe | 5 | 6 | 0 |
| P3 | /project-snapshots | locked-safe | 5 | 6 | 0 |
| P3 | /durable-memory | locked-safe | 5 | 6 | 0 |
| P1 | /permission-runtime | locked-safe | 5 | 6 | 0 |
| P1 | /cost-governor | locked-safe | 5 | 6 | 0 |
| P3 | /loop-runner | locked-safe | 5 | 6 | 0 |
| P3 | /business-command | locked-safe | 5 | 6 | 0 |
| P3 | /agent-workbench | locked-safe | 5 | 6 | 0 |
| P2 | /evaluation-gates | locked-safe | 5 | 6 | 0 |
| P3 | /autonomy-readiness | locked-safe | 5 | 6 | 0 |
| P3 | /project-registry | locked-safe | 5 | 6 | 0 |
| P3 | /project-plan-command | locked-safe | 5 | 6 | 0 |
| P1 | /telemetry-fabric | locked-safe | 5 | 6 | 0 |
| P0 | /incident-command | locked-safe | 5 | 6 | 0 |
| P1 | /deployment-promotion | locked-safe | 5 | 6 | 0 |
| P0 | /secrets-posture | locked-safe | 5 | 6 | 0 |
| P1 | /data-source-catalog | locked-safe | 5 | 6 | 0 |
| P3 | /finance-attribution | locked-safe | 5 | 6 | 0 |
| P2 | /learning-engine | locked-safe | 5 | 6 | 0 |
| P2 | /agent-eval-lab | locked-safe | 5 | 6 | 0 |
| P3 | /executive-cockpit | locked-safe | 5 | 6 | 0 |
| P0 | /production-verification | locked-safe | 5 | 6 | 0 |
| P3 | /command-gate-runtime | locked-safe | 5 | 6 | 0 |
| P1 | /telemetry-adapter-kit | locked-safe | 5 | 6 | 0 |
| P0 | /incident-ingestion | locked-safe | 5 | 6 | 0 |
| P3 | /promotion-runner | locked-safe | 5 | 6 | 0 |
| P0 | /secret-scanner | locked-safe | 5 | 6 | 0 |
| P1 | /cost-attribution-engine | locked-safe | 5 | 6 | 0 |
| P2 | /learning-ingestion | locked-safe | 5 | 6 | 0 |
| P2 | /model-eval-harness | locked-safe | 5 | 6 | 0 |
| P3 | /circuit-breakers | locked-safe | 5 | 6 | 0 |
| P0 | /production-sweep | locked-safe | 5 | 6 | 0 |
| P3 | /hetzner-promotion-execution | locked-safe | 5 | 6 | 0 |
| P3 | /command-gate-coverage | locked-safe | 5 | 6 | 0 |
| P3 | /project-adapter-rollout | locked-safe | 5 | 6 | 0 |
| P0 | /incident-automation | locked-safe | 5 | 6 | 0 |
| P0 | /live-secret-scan | locked-safe | 5 | 6 | 0 |
| P1 | /cost-reconciliation | locked-safe | 5 | 6 | 0 |
| P2 | /outcome-learning-feeds | locked-safe | 5 | 6 | 0 |
| P2 | /golden-eval-execution | locked-safe | 5 | 6 | 0 |
| P0 | /hard-breaker-enforcement | locked-safe | 5 | 6 | 0 |
| P3 | /network-runner-adapter | locked-safe | 5 | 6 | 0 |
| P3 | /hetzner-ssh-adapter | locked-safe | 5 | 6 | 0 |
| P0 | /secret-provider-adapter | locked-safe | 5 | 6 | 0 |
| P3 | /billing-provider-adapter | locked-safe | 5 | 6 | 0 |
| P3 | /project-outcome-emitter | locked-safe | 5 | 6 | 0 |
| P2 | /provider-eval-runner | locked-safe | 5 | 6 | 0 |
| P3 | /breaker-middleware | locked-safe | 5 | 6 | 0 |
| P0 | /incident-subscriptions | locked-safe | 5 | 6 | 0 |
| P3 | /evidence-artifact-store | locked-safe | 5 | 6 | 0 |
| P3 | /release-train-orchestrator | locked-safe | 5 | 6 | 0 |
