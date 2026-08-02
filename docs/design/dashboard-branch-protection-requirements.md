# Dashboard Branch Protection Requirements

Status: V12 standard

Require these checks before dashboard/design-system merges:

- `Dashboard Design System / dashboard-quality`
- `npm run dashboard:standards:summary:fast`
- `npm run dashboard:token-scan:strict`
- `npm run dashboard:governance-exceptions:validate`
- `npm run dashboard:maturity-reports:validate`
- `npm run dashboard:branch-protection:verify`

Require these before release or deployment promotion:

- `npm run dashboard:standards:summary`
- `npm run dashboard:visual:check`
- `npm run dashboard:a11y:check`
- `npm run dashboard:v8:production:check`

Generated maturity reports should be refreshed before validation:

- `npm run dashboard:component-evidence:backlog`
- `npm run dashboard:visual-coverage:report`
- `npm run dashboard:promotion-history:generate`
- `npm run dashboard:promotion-readiness:generate`
- `npm run dashboard:a11y:matrix`
- `npm run dashboard:token-scan:report`
- `npm run dashboard:review-packet:generate:changed`

Promotion exceptions must be recorded in `docs/design/dashboard-governance-exceptions.json`.
Expired exceptions are blocking and cannot promote a project to `T3C`.

When GitHub branch protection cannot be read through `gh api`, record manual verification in:

- `docs/design/dashboard-branch-protection-attestation.json`
