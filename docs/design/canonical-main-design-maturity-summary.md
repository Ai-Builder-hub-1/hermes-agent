# Canonical Main Design Maturity Summary

Generated: 2026-08-02T03:27:42.916Z

| Metric | Value |
| --- | --- |
| Canonical branch | main |
| Canonical remote | ai-builder/main |
| Legacy branch | legacy/dashboard-line |
| Deployed legacy ref | codex/dashboard-design-maturity-system |
| Production URL | https://agent.tlccapitalgroup.com |
| Production provider | hetzner |
| Deploy automation | contract-partially-documented |
| Deployment source of truth | docs/deployment/environments.json |
| Completed slices | 3/6 |
| Pending slices | 0 |
| Blocked or decision slices | 3 |
| External work items | 6 |

## Port Slices

| Slice | Name | Status | Blocks |
| --- | --- | --- | --- |
| S1 | Port governance and branch policy | completed | none |
| S2 | Port design maturity knowledge base | completed | none |
| S3 | Port lightweight maturity reports and generators | completed | S2 |
| S4 | Decide dashboard-kit package fate | pending-decision | S1 |
| S5 | Port web design intelligence UI | blocked | S3, S4 |
| S6 | Make canonical production deploy come from main | blocked | D1, D2 |

## Next Canonical Actions

- Keep new work branched from ai-builder/main.
- Treat Hetzner as the production provider and deploy-site.yml as docs-only automation.
- Treat production main promotion as a controlled cutover because Hetzner currently builds from codex/dashboard-design-maturity-system.
- Decide whether dashboard-kit is a canonical workspace package, external package, or legacy-only artifact.
- Capture project-owned visual evidence outside this canonical repo cleanup.

## External Work

| ID | Work | Status | Owner |
| --- | --- | --- | --- |
| D1 | Document and wire Hetzner production deploy contract | in-progress | project |
| D2 | Approve production cutover from legacy dashboard branch to main | blocked | project |
| E1 | Capture Nous Hermes Agent production visual evidence | pending | project |
| E2 | Capture Meal Assistant production visual evidence | pending | project |
| E3 | Capture Hermes Workspace production visual evidence | pending | project |
| E4 | Migrate individual project dashboard surfaces to their target tier | pending | project |
