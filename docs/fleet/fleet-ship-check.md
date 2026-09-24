# Fleet Ship Check

Generated: 2026-09-24T02:25:49.103Z

Mode: standard

## Decision

- **Safe to commit:** yes
- **Safe to deploy:** yes
- **Blocked by:** nothing

## Summary

| Steps | Failed | Dirty projects | Blocked projects | Needs review | Commit-ready projects | Deploy-ready projects |
| --- | --- | --- | --- | --- | --- | --- |
| 13 | 0 | 1 | 0 | 0 | 10 | 10 |

## Step Results

| Step | Command | Passed | Exit | Output tail |
| --- | --- | --- | --- | --- |
| Release readiness | npm run fleet:release-readiness | yes | 0 | > hermes-agent@1.0.0 fleet:release-readiness<br>> node scripts/generate-fleet-release-readiness.mjs<br><br>Wrote docs/fleet/fleet-release-readiness.json and docs/fleet/fleet-release-readiness.md<br>Fleet release readiness: 1 dirty project(s), 0 blocked, 0 needs review. |
| Release readiness schema | npm run fleet:release-readiness:validate | yes | 0 | > hermes-agent@1.0.0 fleet:release-readiness:validate<br>> node scripts/validate-fleet-release-readiness.mjs<br><br>Fleet release readiness validation: 0 error(s), 0 warning(s). |
| Release readiness strict gate | npm run fleet:release-readiness:strict | yes | 0 | > hermes-agent@1.0.0 fleet:release-readiness:strict<br>> node scripts/generate-fleet-release-readiness.mjs --strict<br><br>Wrote docs/fleet/fleet-release-readiness.json and docs/fleet/fleet-release-readiness.md<br>Fleet release readiness: 1 dirty project(s), 0 blocked, 0 needs review. |
| Web build budget | npm run dashboard:web:build-budget | yes | 0 | Web build budget largest assets:<br>- index-DoljOCct.js 526.7 KiB<br>- vendor-xterm-BRN-hOYD.js 484.0 KiB<br>- vendor-nous-ui-DuXYiwlH.js 273.6 KiB<br>- vendor-CHWgcPAU.js 212.1 KiB<br>- DashboardKitGalleryPage-Bmc3WAMR.js 185.6 KiB<br>- index-DgJURea8.css 120.9 KiB<br>- FleetMaturityReviewPage-7-1UJIeO.js 105.6 KiB<br>- GeneratedDashboardPages-CXYgaGkO.js 78.3 KiB<br>Web build budget validation: 0 issue(s). |
| Dashboard governance | npm run dashboard:governance:validate | yes | 0 | > hermes-agent@1.0.0 dashboard:governance:validate<br>> node scripts/validate-dashboard-governance.mjs<br><br>Dashboard governance validation: 0 error(s), 0 warning(s). |
| Dashboard command governance report | npm run dashboard:command-governance:report | yes | 0 | > hermes-agent@1.0.0 dashboard:command-governance:report<br>> node scripts/generate-dashboard-command-governance-ledger.mjs<br><br>Wrote docs/design/dashboard-command-governance-ledger.json and docs/design/dashboard-command-governance-ledger.md |
| Dashboard command governance validation | npm run dashboard:command-governance:validate | yes | 0 | > hermes-agent@1.0.0 dashboard:command-governance:validate<br>> node scripts/validate-dashboard-command-governance-ledger.mjs<br><br>Dashboard command governance validation: 0 error(s), 0 warning(s). |
| Dashboard certification report | npm run dashboard:certify | yes | 0 | > hermes-agent@1.0.0 dashboard:certify<br>> node scripts/certify-dashboard-fleet.mjs --write<br><br>Wrote docs/fleet/dashboard-certification-report.json<br>Wrote docs/fleet/dashboard-certification-report.md<br>Wrote docs/fleet/dashboard-certification-repair-packets.json<br>Wrote docs/fleet/dashboard-certification-attempt-ledger.json<br>Wrote docs/design/dashboard-certification-standard.md<br>Dashboard certification: 10 certified, 0 needs review, 0 blocked, 0 false-native claim(s). |
| Dashboard certification artifact validation | npm run dashboard:certify:validate:strict | yes | 0 | > hermes-agent@1.0.0 dashboard:certify:validate:strict<br>> node scripts/validate-dashboard-certification.mjs --strict<br><br>Dashboard certification artifact validation: 0 error(s), 0 warning(s). |
| Dashboard certification repair supervisor | npm run dashboard:certify:repair | yes | 0 | > hermes-agent@1.0.0 dashboard:certify:repair<br>> node scripts/generate-dashboard-certification-repair-supervisor.mjs --write<br><br>Wrote docs/design/dashboard-certification-repair-playbooks.json<br>Wrote docs/fleet/dashboard-certification-repair-supervisor.json<br>Wrote docs/fleet/dashboard-certification-repair-supervisor.md<br>Dashboard repair supervisor: 0 work item(s), 0 safe, 0 assisted. |
| Dashboard certification repair validation | npm run dashboard:certify:repair:validate:strict | yes | 0 | > hermes-agent@1.0.0 dashboard:certify:repair:validate:strict<br>> node scripts/validate-dashboard-certification-repair-supervisor.mjs --strict<br><br>Dashboard certification repair supervisor validation: 0 error(s), 0 warning(s). |
| Dashboard certification repair execution ledger | npm run dashboard:certify:repair:execute:strict | yes | 0 | > hermes-agent@1.0.0 dashboard:certify:repair:execute:strict<br>> node scripts/execute-dashboard-certification-repairs.mjs --write --strict<br><br>Wrote docs/fleet/dashboard-certification-repair-execution-ledger.json<br>Wrote docs/fleet/dashboard-certification-repair-execution-ledger.md<br>Dashboard repair execution: 0 applied, 0 executable safe, 0 assisted queued. |
| Dashboard certification pre-deploy gate | npm run dashboard:certify:strict | yes | 0 | > hermes-agent@1.0.0 dashboard:certify:strict<br>> node scripts/certify-dashboard-fleet.mjs --write --strict<br><br>Wrote docs/fleet/dashboard-certification-report.json<br>Wrote docs/fleet/dashboard-certification-report.md<br>Wrote docs/fleet/dashboard-certification-repair-packets.json<br>Wrote docs/fleet/dashboard-certification-attempt-ledger.json<br>Wrote docs/design/dashboard-certification-standard.md<br>Dashboard certification: 10 certified, 0 needs review, 0 blocked, 0 false-native claim(s). |
