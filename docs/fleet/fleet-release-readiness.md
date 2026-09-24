# Fleet Release Readiness

Generated: 2026-09-24T17:15:58.488Z

This report classifies dirty-tree changes before commit/deploy. It exists so Codex can move forward confidently without blindly committing proof artifacts, screenshots, local-only files, build outputs, or unknown files.

## Rules

- **Deployable source:** Commit after the project validation/build/proof commands pass.
- **Generated evidence:** Commit when paired with the generator command or the source change that caused it.
- **Screenshot proof:** Commit only when referenced by a proof registry, baseline matrix, or evidence ledger.
- **Local-only:** Exclude from commits; add ignore rules or move outside the repo if it keeps appearing.
- **Unsafe:** Block commit/deploy until removed, ignored, or explicitly reclassified.
- **Unknown:** Needs human or standards review; add a rule if it is a recurring legitimate artifact.

## Project Summary

| Project | Dirty | Intent | Recommendation | Commit ready | Deploy ready | Source | Generated | Screenshots | Local | Unsafe | Unknown |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nous Hermes Agent | 37 | mixed | commit-after-validation | yes | yes | 21 | 16 | 0 | 0 | 0 | 0 |
| Khashi VC ROC | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Media Engine Ops | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Media Business Operations | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Business Mapper Workspace | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Meal Assistant | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Rinseables OS | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Investing System ROC | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Hermes Workspace | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| TLC Capital Group OS | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |

## Cleanup Guidance

| Project | Proof policy | Cleanup actions |
| --- | --- | --- |
| Nous Hermes Agent | proof-or-generated-evidence-present-validate-before-ship | commit-generated-evidence-with-generator-command-evidence<br>run-project-validation-before-commit |
| Khashi VC ROC | proof-not-required | no-cleanup-needed |
| Media Engine Ops | proof-not-required | no-cleanup-needed |
| Media Business Operations | proof-not-required | no-cleanup-needed |
| Business Mapper Workspace | proof-not-required | no-cleanup-needed |
| Meal Assistant | proof-not-required | no-cleanup-needed |
| Rinseables OS | proof-not-required | no-cleanup-needed |
| Investing System ROC | proof-not-required | no-cleanup-needed |
| Hermes Workspace | proof-not-required | no-cleanup-needed |
| TLC Capital Group OS | proof-not-required | no-cleanup-needed |

## Dirty File Classification

### Nous Hermes Agent

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | docs/design/dashboard-certification-repair-playbooks.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-command-governance-ledger.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-command-governance-ledger.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-live-e2e-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-live-health-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-monitoring-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/dashboard-certification-attempt-ledger.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/dashboard-certification-repair-execution-ledger.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/dashboard-certification-repair-execution-ledger.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/dashboard-certification-repair-packets.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/dashboard-certification-repair-supervisor.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/dashboard-certification-repair-supervisor.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/dashboard-certification-report.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/dashboard-certification-report.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/fleet-release-readiness.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-release-readiness.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-ship-check.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-ship-check.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | package-lock.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | package.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/validate-dashboard-maturity-reports.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/pages/GeneratedDashboardPages.tsx | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/design/dashboard-action-unlock-ledger.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-action-unlock-ledger.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-fully-operational-standard.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-operational-maturity-packets.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-operational-maturity-packets.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/fleet/dashboard-fully-operational-certification.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/fleet/dashboard-fully-operational-certification.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/generate-dashboard-action-unlock-ledger.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/generate-dashboard-fully-operational-certification.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/generate-dashboard-operational-maturity-packets.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/validate-dashboard-action-unlock-ledger.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/validate-dashboard-fully-operational-certification.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/validate-dashboard-operational-maturity-packets.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | web/src/pages/dashboard-operational-maturity-packets-data.ts | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | web/src/pages/dashboard-operational-maturity-packets.runtime.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

