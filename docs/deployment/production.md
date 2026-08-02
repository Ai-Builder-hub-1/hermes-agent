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
| Deploy automation | Contract partially documented; not automated in this repository |
| SSH host alias | `hermes-os` |
| Runtime | Docker Compose |
| Compose project path | `/root/apps/deploy` |
| Compose service | `nous-hermes-agent` |
| Container | `deploy-nous-hermes-agent-1` |
| Reverse proxy | Caddy |

## Important Correction

`.github/workflows/deploy-site.yml` is docs-site automation. It is not production deployment automation for `agent.tlccapitalgroup.com`.

Do not use Vercel as the assumed production path for this project. If a deploy attempt mentions Vercel, treat that as stale automation or an invalid runbook reference.

Do not assume a systemd unit named `hermes-gateway` exists on the production host. A read-only host check returned `Unit hermes-gateway.service could not be found.`

## Verified Runtime Facts

Read-only checks against `hermes-os` show the current production topology:

- `agent.tlccapitalgroup.com` terminates through Caddy and reverse proxies to `nous-hermes-agent:9119`.
- The production service is Docker Compose service `nous-hermes-agent` in compose project `deploy`.
- The active container name is `deploy-nous-hermes-agent-1`.
- The compose file path is `/root/apps/deploy/docker-compose.yml`.
- The container exposes internal port `9119` and has a Docker health check against `/api/status`.
- The container mounts `/data/nous-hermes-agent` at `/opt/data`.
- `/root/apps/deploy` is not currently a git checkout, so production automation cannot rely on `git pull` from that directory.

Useful read-only verification commands:

```sh
ssh hermes-os hostname
ssh hermes-os docker compose -f /root/apps/deploy/docker-compose.yml ps
ssh hermes-os docker ps
ssh hermes-os sed -n '1,220p' /root/apps/deploy/Caddyfile
curl -sS https://agent.tlccapitalgroup.com/api/status
```

`/api/status` rejects `HEAD` with `405` and allows `GET`; use `GET` for deploy evidence. A healthy HTTP response alone is not enough for operational signoff because the response may include domain state such as `gateway_running`.

## Remaining Gap

The repo now knows the production URL, health endpoint, host alias, runtime manager, compose project, service name, and reverse proxy.

The missing deployment facts are:

- Artifact source and deploy strategy for `/root/apps/deploy`: rsync bundle, image build on host, image pull, or another release promotion path.
- Whether automation should rebuild only `nous-hermes-agent` or the full `deploy` compose project.
- Exact restart command and expected downtime behavior.
- Rollback command.
- Required environment files and secret ownership.
- Post-deploy health and log checks.

## Required Deploy Contract

Before production deploy automation is added, the project needs a documented contract with:

| Requirement | Status |
| --- | --- |
| Host identity recorded without exposing secrets | Present |
| Runtime/service manager recorded | Present |
| Compose project and service recorded | Present |
| Deploy command recorded | Missing |
| Restart command recorded | Missing |
| Rollback command recorded | Missing |
| Health check recorded | Present |
| GitHub Actions production environment protection | Missing |
| Stale deploy workflows disabled or marked non-production | Present |

## Safe Interim Procedure

Until the missing facts are filled in, deployment must be treated as a manual Hetzner operation owned by the project operator.

Safe service inspection:

```sh
ssh hermes-os docker compose -f /root/apps/deploy/docker-compose.yml ps nous-hermes-agent
ssh hermes-os docker inspect deploy-nous-hermes-agent-1
```

Do not run `docker compose up`, `docker compose restart`, image rebuilds, or host file replacement as an implicit deploy. Those are production-affecting actions and require an explicit deployment decision.

Minimum evidence to record after any manual production deploy:

- Git commit deployed.
- Deployment command used.
- Service restart result.
- Health endpoint response.
- Expected values for domain health fields such as `gateway_running`.
- Timestamp.
- Operator.

## Target Automation

The target production workflow should:

1. Run from `main` or a signed release ref.
2. Require a protected GitHub `production` environment.
3. Use Hetzner SSH with a documented artifact promotion path for `/root/apps/deploy`.
4. Restart or replace only the approved compose service unless a full stack deploy is explicitly approved.
5. Query `https://agent.tlccapitalgroup.com/api/status`.
6. Upload deploy evidence as an artifact or PR comment.
7. Fail closed on unknown artifact source, service, rollback path, or health status.
