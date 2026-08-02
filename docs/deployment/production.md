# Production Deployment

## Current Source Of Truth

Production for the Ai-Builder Nous Hermes Agent is Hetzner-backed.

| Field | Value |
| --- | --- |
| Provider | Hetzner |
| Production URL | https://agent.tlccapitalgroup.com |
| Health URL | https://agent.tlccapitalgroup.com/api/status |
| Canonical remote | ai-builder/main |
| Canonical branch | main |
| Deploy automation | Not configured in this repository |

## Important Correction

`.github/workflows/deploy-site.yml` is docs-site automation. It is not production deployment automation for `agent.tlccapitalgroup.com`.

Do not use Vercel as the assumed production path for this project. If a deploy attempt mentions Vercel, treat that as stale automation or an invalid runbook reference.

## Known Gap

The repo knows the production URL and health endpoint, but it does not yet know the Hetzner deployment topology.

The missing deployment facts are:

- Hetzner host alias or GitHub secret names for SSH access.
- Runtime model: systemd, Docker Compose, container image, or another process manager.
- Service name and restart command.
- Build artifact or checkout path on the host.
- Rollback command.
- Required environment files and secret ownership.
- Post-deploy health and log checks.

## Required Deploy Contract

Before production deploy automation is added, the project needs a documented contract with:

| Requirement | Status |
| --- | --- |
| Host identity recorded without exposing secrets | Missing |
| Runtime/service manager recorded | Missing |
| Deploy command recorded | Missing |
| Restart command recorded | Missing |
| Rollback command recorded | Missing |
| Health check recorded | Present |
| GitHub Actions production environment protection | Missing |
| Stale deploy workflows disabled or marked non-production | Present |

## Safe Interim Procedure

Until the missing facts are filled in, deployment must be treated as a manual Hetzner operation owned by the project operator.

Minimum evidence to record after any manual production deploy:

- Git commit deployed.
- Deployment command used.
- Service restart result.
- Health endpoint response.
- Timestamp.
- Operator.

## Target Automation

The target production workflow should:

1. Run from `main` or a signed release ref.
2. Require a protected GitHub `production` environment.
3. Use Hetzner SSH or a documented artifact promotion path.
4. Restart the correct service.
5. Query `https://agent.tlccapitalgroup.com/api/status`.
6. Upload deploy evidence as an artifact or PR comment.
7. Fail closed on unknown host, service, or health status.
