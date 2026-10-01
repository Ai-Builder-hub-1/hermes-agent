# CP04 Runtime Intelligence Maturity

This plan finishes the runtime layer around CP04 production-independent warehouse durability. It turns the prior architecture into live dashboard/API decisions: safe-to-deploy, safe-to-prune, tier health, continuity posture, recovery confidence, data quality, game days, policy-as-code, remediation, and an executive certification packet.

## Operating Rules

- Production runtime must not depend on the external drive.
- Production deployment must not depend on the external drive when production-local backup and restore proof are fresh.
- The live database remains the operational source of truth.
- The warehouse is backup, archive, replay, evidence, analytics, and mirror storage.
- Destructive pruning remains disabled until explicit scoped approval, fresh backup, fresh restore proof, dry-run hash, and post-prune verification exist.

## Runtime Contract

The warehouse summary exposes `cp04Runtime` with these required fields:

- `durabilityTiers`
- `deployGate`
- `pruneGate`
- `mirrorContinuity`
- `dataQuality`
- `lineage`
- `costValue`
- `recoveryConfidence`
- `sloBudget`
- `continuityMode`
- `correlation`
- `gameDays`
- `policyAsCode`
- `alerts`
- `remediation`
- `executivePacket`
- `runtimeCertification`

## Phases

| Phase | Name | Status | Test |
| --- | --- | --- | --- |
| 1 | Dashboard Tier Cards | built | Runtime summary exposes four durability tiers and the dashboard renders tier cards. |
| 2 | Safe-To-Deploy Decision | built | Deploy gate does not require the external mirror or local computer when production-local proof is available. |
| 3 | Safe-To-Prune Decision | built | Prune gate reports destructive pruning disabled by default and lists approval requirements. |
| 4 | Storage Proof Registry Ingestion | built | Backbone proof categories map to warehouse proof tables. |
| 5 | Normalized CP04 Alerts | built | Runtime alerts include project, dataset, tier, gate class, severity, observedAt, and nextAction. |
| 6 | Failure Drill Command Suite | built | Game-day drill cases cover local offline, external drive unplugged, backup, restore, disk, collector, and mirror catch-up. |
| 7 | Deploy Gate Runtime Integration | built | Warehouse summary returns deployGate for dashboard and API consumers. |
| 8 | Prune Approval Runtime Flow | built | Warehouse summary returns pruneGate with defaultDestructiveMode disabled and approvalRequired true. |
| 9 | Data Quality Intelligence | built | Runtime dataQuality score includes source freshness, backup, restore, provider, and mirror checks. |
| 10 | Collection-To-Decision Lineage | built | Runtime lineage links source events, proof links, and decision gates. |
| 11 | Warehouse Cost/Value Scoring | built | Runtime costValue scores warehouse bytes, mirror bytes, ingest bytes, and risk reduction. |
| 12 | Recovery Confidence Score | built | Runtime recoveryConfidence reports score and boolean proof inputs. |
| 13 | Warehouse SLOs And Error Budgets | built | Runtime sloBudget exposes status, remaining budget, total budget, and breaches. |
| 14 | Business Continuity Mode | built | Runtime continuityMode explains the local-offline and mirror-disconnected operating posture. |
| 15 | Cross-Project Correlation | built | Runtime correlation names Nous Hermes, investing-system, and khashi-vc. |
| 16 | Automated Game Days | built | Runtime gameDays expose expected outcomes for scheduled drills. |
| 17 | Policy-As-Code | built | Runtime policyAsCode lists enforceable deploy, mirror, and prune rules. |
| 18 | Autonomous Remediation Suggestions | built | Runtime remediation ranks next actions by priority and gate impact. |
| 19 | Executive CP04 Review Packet | built | Runtime executivePacket summarizes status, approvals, risks, and score. |
| 20 | Full Runtime Certification | built | Runtime certification includes a score, complete flag, and all 20 phases. |

## Completion Standard

This track is complete when the validator passes for all 20 phases, the warehouse backend test proves the runtime contract, the dashboard build accepts the typed API surface, and the safe automation commands exist for scheduled proof, certification, deploy gate, prune approval packet, and game-day evidence.

## Automation Commands

- `warehouse:cp04:automation` runs the safe scheduled proof cycle.
- `warehouse:cp04:certify` records the current CP04 runtime certification.
- `warehouse:cp04:deploy-gate` evaluates deploy readiness for release tooling.
- `warehouse:cp04:install-cron` installs active-profile CP04 cron jobs.
- `warehouse:cp04:prune-packet` creates a non-destructive prune approval packet.
- `warehouse:cp04:game-day` records a safe game-day drill.

## Production Cadence

| Job | Cadence | Mode |
| --- | --- | --- |
| CP04 safe proof cycle | `*/15 * * * *` | no-agent cron script |
| CP04 runtime certification | `0 * * * *` | no-agent cron script |
| CP04 external mirror game-day | `0 10 * * 1` | no-agent cron script |

Deploy tooling should call `warehouse:cp04:deploy-gate` before a production promotion. A blocked deploy gate exits non-zero; a missing external mirror by itself remains warning-only.
