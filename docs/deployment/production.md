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
| Build context | `/root/apps/nous-hermes-agent` |
| Current host checkout | `codex/dashboard-design-maturity-system` |
| Current host commit | `a28b50cdc685dd4f4512415859c3e9309dfb8ef4` |
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
- The compose service builds from `/root/apps/nous-hermes-agent`; production is not pulling a published image for this service.
- The current build-context checkout is `codex/dashboard-design-maturity-system` at `a28b50cdc685dd4f4512415859c3e9309dfb8ef4`.
- The container exposes internal port `9119` and has a Docker health check against `/api/status`.
- The container mounts `/data/nous-hermes-agent` at `/opt/data`.
- `/root/apps/deploy` is not currently a git checkout, so production automation cannot rely on `git pull` from that directory.
- Promoting `ai-builder/main` is a controlled cutover, not a routine restart, because the current deployed checkout is a legacy dashboard branch.

Useful read-only verification commands:

```sh
ssh hermes-os hostname
ssh hermes-os docker compose -f /root/apps/deploy/docker-compose.yml ps
ssh hermes-os docker ps
ssh hermes-os sed -n '1,220p' /root/apps/deploy/Caddyfile
ssh hermes-os sed -n '260,560p' /root/apps/deploy/docker-compose.yml
ssh hermes-os git -C /root/apps/nous-hermes-agent status --short --branch
ssh hermes-os git -C /root/apps/nous-hermes-agent rev-parse HEAD
curl -sS https://agent.tlccapitalgroup.com/api/status
```

`/api/status` rejects `HEAD` with `405` and allows `GET`; use `GET` for deploy evidence. A healthy HTTP response alone is not enough for operational signoff because the response may include domain state such as `gateway_running`.

## Remaining Gap

The repo now knows the production URL, health endpoint, host alias, runtime manager, compose project, service name, reverse proxy, build context, current host branch, current host commit, restart command, rebuild command, and rollback shape.

The missing deployment facts are:

- Decision on whether production should remain on `codex/dashboard-design-maturity-system` or cut over to `ai-builder/main`.
- Proof that `main` has the required dashboard route/component parity before cutover.
- Exact rollback target for each promotion event.
- Required environment files and secret ownership.
- Image/source revision labeling so a running container can report the Git ref it was built from.
- Post-deploy domain-health expectations, including whether `gateway_running:false` is acceptable for dashboard-only operation.

## Required Deploy Contract

Before production deploy automation is added, the project needs a documented contract with:

| Requirement | Status |
| --- | --- |
| Host identity recorded without exposing secrets | Present |
| Runtime/service manager recorded | Present |
| Compose project and service recorded | Present |
| Build context recorded | Present |
| Routine restart command recorded | Present |
| Service rebuild command recorded | Present |
| Rollback strategy recorded | Present |
| Main cutover approval | Missing |
| Image/source revision labels | Missing |
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

Routine service restart, without changing source or rebuilding:

```sh
ssh hermes-os docker compose -f /root/apps/deploy/docker-compose.yml restart nous-hermes-agent
```

Rebuild only the Nous Hermes Agent service from the current host checkout:

```sh
ssh hermes-os docker compose -f /root/apps/deploy/docker-compose.yml up -d --build --no-deps nous-hermes-agent
```

Rollback strategy:

1. Record the currently deployed good ref before promotion.
2. Switch `/root/apps/nous-hermes-agent` back to that recorded ref.
3. Rebuild only `nous-hermes-agent` with the service rebuild command above.
4. Verify Docker health and `GET https://agent.tlccapitalgroup.com/api/status`.

Do not run `git switch`, `git reset`, `docker compose up`, `docker compose restart`, image rebuilds, or host file replacement as an implicit deploy. Those are production-affecting actions and require an explicit deployment decision.

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
3. Confirm the host checkout is clean before changing refs.
4. Promote the approved Git ref in `/root/apps/nous-hermes-agent`.
5. Rebuild only `nous-hermes-agent` unless a full stack deploy is explicitly approved.
6. Stamp the image with the source ref and commit.
7. Verify Docker health and query `https://agent.tlccapitalgroup.com/api/status`.
8. Upload deploy evidence as an artifact or PR comment.
9. Fail closed on unknown source ref, dirty host checkout, service mismatch, rollback target, or domain-health status.

## Main Cutover Blocker

The deployed production checkout is not `main`; it is `codex/dashboard-design-maturity-system` at `a28b50cdc685dd4f4512415859c3e9309dfb8ef4`.

The local diff from that deployed ref to current `main` is broad enough that `main` promotion should be treated as a product cutover. It should not be automated until either:

- the required dashboard maturity UI is ported to `main`, or
- the operator explicitly approves replacing the current legacy dashboard production surface with the current `main` surface.
