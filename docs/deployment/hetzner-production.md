# Nous Hermes Agent Hetzner Production Deploy

Nous Hermes Agent deploys through the shared Hermes/Hetzner promotion rail, not Vercel.

## Canonical Deploy Target

- GitHub repository: `Ai-Builder-hub-1/hermes-agent`
- Service key: `nous-hermes-agent`
- Server app path: `$HOME/apps/nous-hermes-agent`
- Public URL pattern: `https://agent.${HERMES_PRODUCTION_BASE_DOMAIN}`
- Health path: `/api/status`
- Promotion script: `/root/apps/deploy/scripts/promote-service.sh`

The local target registry is `hermes.production-targets.json`. It mirrors the Hermes OS deployment spine so GitHub Actions, local tooling, and the Hetzner server all use the same service key.

## Required GitHub Actions Secrets

Configure these on the private repo only:

```bash
gh secret set HETZNER_HOST --repo Ai-Builder-hub-1/hermes-agent
gh secret set HETZNER_USER --repo Ai-Builder-hub-1/hermes-agent
gh secret set HETZNER_SSH_KEY --repo Ai-Builder-hub-1/hermes-agent
gh secret set PRODUCTION_BASE_DOMAIN --repo Ai-Builder-hub-1/hermes-agent
```

Optional:

```bash
gh secret set HETZNER_SSH_PORT --repo Ai-Builder-hub-1/hermes-agent
gh variable set HETZNER_PROMOTE_SCRIPT --body /root/apps/deploy/scripts/promote-service.sh --repo Ai-Builder-hub-1/hermes-agent
```

Dashboard auth and proof capture secrets can also live in the same private repo:

```bash
gh secret set HERMES_AGENT_DASHBOARD_USERNAME --repo Ai-Builder-hub-1/hermes-agent
gh secret set HERMES_AGENT_DASHBOARD_PASSWORD --repo Ai-Builder-hub-1/hermes-agent
gh secret set HERMES_DASHBOARD_PROOF_TOKEN --repo Ai-Builder-hub-1/hermes-agent
```

## Manual Deploy

```bash
gh workflow run deploy-site.yml \
  --repo Ai-Builder-hub-1/hermes-agent \
  --ref codex/design-intelligence-standards \
  -f ref=codex/design-intelligence-standards \
  -f service=nous-hermes-agent
```

The workflow skips deployment with a notice when required Hetzner secrets are missing. It should never require `VERCEL_DEPLOY_HOOK`.

## Public Upstream Guard

The public upstream `NousResearch/hermes-agent` remains fetch-only for this local workspace. Pushes and private deployments must target `Ai-Builder-hub-1/hermes-agent`.
