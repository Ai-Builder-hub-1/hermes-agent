# Canonical Main Design Maturity Port

The deployed dashboard design maturity system is preserved on `legacy/dashboard-line` and was promoted from `codex/dashboard-design-maturity-system` at commit `a28b50cdc685dd4f4512415859c3e9309dfb8ef4`.

Current `main` tracks `ai-builder/main` and must stay aligned with the production/upstream code line. Do not force-push the legacy dashboard history onto `main`.

## Current State

- Canonical branch: `main`
- Canonical remote: `ai-builder/main`
- Legacy branch: `legacy/dashboard-line`
- Deployed ref: `codex/dashboard-design-maturity-system`
- Production URL: `https://agent.tlccapitalgroup.com`
- Health URL: `https://agent.tlccapitalgroup.com/api/status`
- Production provider: Hetzner
- Deployment source of truth: `docs/deployment/environments.json`
- Deploy automation status: not configured in this repository

## Deployment Correction

`.github/workflows/deploy-site.yml` is docs-site automation, not production deployment automation for `agent.tlccapitalgroup.com`.

Production deploys must not assume Vercel. The current production target is Hetzner, but the repo does not yet contain the host/service/restart/rollback contract required to automate a Hetzner deploy safely.

## Port Rules

1. New deployable work branches from `ai-builder/main`.
2. Legacy design maturity work ports in small validated slices.
3. Dashboard-kit and web UI code must not be reintroduced until its package and route dependencies are explicitly approved.
4. Feature-ref production deploys are acceptable only as controlled promotions with recorded health evidence.
5. Individual project dashboard migrations remain project-owned work, not canonical repo cleanup.

## Port Slices

| Slice | Name | Status | Purpose |
| --- | --- | --- | --- |
| S1 | Port governance and branch policy | In progress | Establish canonical branch policy, legacy inventory, production evidence, and validation. |
| S2 | Port design maturity knowledge base | Pending | Bring over vocabulary, pattern library, Mobbin workflow, design agent spec, and review checklist. |
| S3 | Port lightweight maturity reports and generators | Pending | Bring over tier assessment, gap matrix, visual evidence tasks, and promotion readiness summaries. |
| S4 | Decide dashboard-kit package fate | Pending decision | Decide whether dashboard-kit returns as a workspace package, external package, or legacy-only artifact. |
| S5 | Port web design intelligence UI | Blocked | Depends on S3 and S4 because current `main` does not carry the old dashboard route/component stack. |
| S6 | Make canonical production deploy come from main | Blocked | Replace stale docs/Vercel deploy assumptions with a Hetzner deploy contract, then deploy from `main` or a signed release ref. |

## External Work

- Document and wire the Hetzner production deploy contract.
- Capture production visual evidence for Nous Hermes Agent.
- Capture production visual evidence for Meal Assistant.
- Capture production visual evidence for Hermes Workspace.
- Migrate each individual project dashboard surface to its target tier.
