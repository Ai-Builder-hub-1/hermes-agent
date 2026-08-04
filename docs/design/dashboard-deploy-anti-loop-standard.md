# Dashboard Deploy Anti-Loop Standard

Status: ready

The deploy anti-loop gate prevents agents from repeatedly deploying production only to refresh deployment evidence, then committing that refreshed evidence and deploying again.

## Rule

Before an agent-driven dashboard deploy, run:

```bash
npm run dashboard:deploy-anti-loop:check
```

The gate compares the deployed source commit recorded in `docs/design/dashboard-deployment-ledger.json` with the target commit.

Deploy is allowed when runtime-impacting files changed. Deploy is blocked when the target only contains generated reports or dashboard governance-tooling changes.

## Intentional Exceptions

Use an override only when a human explicitly wants a non-runtime deployment:

```bash
node scripts/check-dashboard-deploy-anti-loop.mjs --allow-non-runtime
```

or:

```bash
HERMES_ALLOW_NON_RUNTIME_DEPLOY=1 npm run dashboard:deploy-anti-loop:check
```

Report-only and governance-only commits should normally be committed and pushed to the private repository without a production rebuild.
