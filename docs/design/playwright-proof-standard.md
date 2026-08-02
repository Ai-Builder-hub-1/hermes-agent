# Playwright Proof Standard

Every dashboard-capable project must keep Playwright available locally so proof capture does not depend on a global install, one developer machine, or a production login session.

Local Chromium is part of the standard. A project is not proof-ready just because `playwright` is listed in `package.json`; the Chromium runtime must also be installed and discoverable by the local project.

## Required Project Contract

Each project with a dashboard, review surface, or operator UI must provide:

- `devDependency`: `playwright`
- Local Chromium runtime installed through Playwright
- `npm run proof:doctor`: verify the package and browser runtime are available
- `npm run proof:capture`: capture local proof screenshots and metadata
- `npm run proof:install`: install the local browser runtime with `npx playwright install chromium`
- Output folder: `artifacts/proof/<surface>/<timestamp>/`
- Metadata file: `proof.json`

## Proof Capture Requirements

The capture must prove:

- The target page renders without a blank screen.
- One primary shell exists for dashboard routes.
- Tier 3 surfaces expose expected `data-review-id` hooks.
- Key states are visible when applicable: loading, empty, partial, stale, error, ready.
- Light/dark theme captures are produced when a project supports more than one theme.
- Generated package/review artifacts can be opened from disk with `file://` when they are designed to be standalone.

## Standard Scripts

Projects should expose these scripts:

```json
{
  "proof:doctor": "node tasks/check-playwright-proof.js",
  "proof:install": "npx playwright install chromium",
  "proof:capture": "node tasks/capture-dashboard-proof.js"
}
```

`proof:doctor` must fail when:

- `playwright` is not installed locally
- Chromium has not been installed by Playwright
- the browser executable path cannot be resolved

`proof:install` should be run after project install, on new machines, and whenever Playwright updates browser revisions.

If a project has multiple dashboards, `proof:capture` should accept:

```text
--url http://localhost:4200/dashboard
--file production-runs/.../review.html
--surface media-engine.ops
--out artifacts/proof
```

## Standard Output

Each run should write:

- `desktop.png`
- `mobile.png`
- `proof.json`

`proof.json` must include:

- project
- surface
- source URL or file path
- capturedAt
- viewport list
- page title
- primary `data-review-id` counts
- pass/fail status
- warnings

## Governance Rule

A dashboard cannot be marked Tier 3 complete unless `proof:capture` runs locally and produces nonblank evidence. CI should eventually run the same command for every adopted project.

If Chromium cannot launch because of the host security sandbox, the project still passes the local-runtime requirement when `proof:doctor` passes, but final screenshot proof must be run in an environment where Chromium can launch.
