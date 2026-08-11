# Fleet Ship Check

Generated: 2026-08-11T17:06:38.525Z

Mode: standard

## Decision

- **Safe to commit:** yes
- **Safe to deploy:** yes
- **Blocked by:** nothing

## Summary

| Steps | Failed | Dirty projects | Blocked projects | Needs review | Commit-ready projects | Deploy-ready projects |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | 0 | 2 | 0 | 0 | 10 | 10 |

## Step Results

| Step | Command | Passed | Exit | Output tail |
| --- | --- | --- | --- | --- |
| Release readiness | npm run fleet:release-readiness | yes | 0 | > hermes-agent@1.0.0 fleet:release-readiness<br>> node scripts/generate-fleet-release-readiness.mjs<br><br>Wrote docs/fleet/fleet-release-readiness.json and docs/fleet/fleet-release-readiness.md<br>Fleet release readiness: 2 dirty project(s), 0 blocked, 0 needs review. |
| Release readiness schema | npm run fleet:release-readiness:validate | yes | 0 | > hermes-agent@1.0.0 fleet:release-readiness:validate<br>> node scripts/validate-fleet-release-readiness.mjs<br><br>Fleet release readiness validation: 0 error(s), 0 warning(s). |
| Release readiness strict gate | npm run fleet:release-readiness:strict | yes | 0 | > hermes-agent@1.0.0 fleet:release-readiness:strict<br>> node scripts/generate-fleet-release-readiness.mjs --strict<br><br>Wrote docs/fleet/fleet-release-readiness.json and docs/fleet/fleet-release-readiness.md<br>Fleet release readiness: 2 dirty project(s), 0 blocked, 0 needs review. |
| Web build budget | npm run dashboard:web:build-budget | yes | 0 | Web build budget largest assets:<br>- index-CwI5fgv0.js 526.2 KiB<br>- vendor-xterm-BRN-hOYD.js 484.0 KiB<br>- vendor-nous-ui-DuXYiwlH.js 273.6 KiB<br>- vendor-CHWgcPAU.js 212.1 KiB<br>- index-54zUsFU-.css 115.1 KiB<br>- DashboardKitGalleryPage-C-4PADs-.js 102.1 KiB<br>- FleetMaturityReviewPage-DU092YbQ.js 101.4 KiB<br>- vendor-react-Bx9y0EYb.js 39.7 KiB<br>Web build budget validation: 0 issue(s). |
| Dashboard governance | npm run dashboard:governance:validate | yes | 0 | > hermes-agent@1.0.0 dashboard:governance:validate<br>> node scripts/validate-dashboard-governance.mjs<br><br>Dashboard governance validation: 0 error(s), 0 warning(s). |
