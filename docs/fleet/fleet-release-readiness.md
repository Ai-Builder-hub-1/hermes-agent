# Fleet Release Readiness

Generated: 2026-09-24T02:00:29.086Z

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
| Nous Hermes Agent | 48 | mixed | commit-after-validation | yes | yes | 31 | 17 | 0 | 0 | 0 | 0 |
| Khashi VC ROC | 2 | source-change | commit-after-validation | yes | yes | 2 | 0 | 0 | 0 | 0 | 0 |
| Media Engine Ops | 1 | source-change | commit-after-validation | yes | yes | 1 | 0 | 0 | 0 | 0 | 0 |
| Media Business Operations | 3 | source-change | commit-after-validation | yes | yes | 3 | 0 | 0 | 0 | 0 | 0 |
| Business Mapper Workspace | 2 | source-change | commit-after-validation | yes | yes | 2 | 0 | 0 | 0 | 0 | 0 |
| Meal Assistant | 1 | source-change | commit-after-validation | yes | yes | 1 | 0 | 0 | 0 | 0 | 0 |
| Rinseables OS | 2 | source-change | commit-after-validation | yes | yes | 2 | 0 | 0 | 0 | 0 | 0 |
| Investing System ROC | 1 | source-change | commit-after-validation | yes | yes | 1 | 0 | 0 | 0 | 0 | 0 |
| Hermes Workspace | 4 | source-change | commit-after-validation | yes | yes | 4 | 0 | 0 | 0 | 0 | 0 |
| TLC Capital Group OS | 2 | source-change | commit-after-validation | yes | yes | 2 | 0 | 0 | 0 | 0 | 0 |

## Cleanup Guidance

| Project | Proof policy | Cleanup actions |
| --- | --- | --- |
| Nous Hermes Agent | proof-or-generated-evidence-present-validate-before-ship | commit-generated-evidence-with-generator-command-evidence<br>run-project-validation-before-commit |
| Khashi VC ROC | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| Media Engine Ops | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| Media Business Operations | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| Business Mapper Workspace | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| Meal Assistant | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| Rinseables OS | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| Investing System ROC | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| Hermes Workspace | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| TLC Capital Group OS | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |

## Dirty File Classification

### Nous Hermes Agent

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/design/dashboard-certification-repair-playbooks.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-deployment-ledger.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-deployment-ledger.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-health-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-live-e2e-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-live-health-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-live-source-gap-ledger.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-live-source-gap-ledger.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-monitoring-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-runtime-data-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-runtime-data-report.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/generated-dashboard-route-evidence-bindings.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/design/generated-dashboard-route-evidence-bindings.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/design/generated-dashboard-route-maturity-ledger.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/design/generated-dashboard-route-maturity-ledger.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
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
|  M | package.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/certify-dashboard-fleet.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/check-dashboard-live-e2e.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/check-dashboard-monitoring.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/fleet-ship-check.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/generate-dashboard-deployment-ledger.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/generate-fleet-release-readiness.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/generate-generated-dashboard-route-evidence-bindings.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/validate-dashboard-live-source-gap-ledger.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/validate-dashboard-maturity-reports.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/pages/DashboardKitGalleryPage.tsx | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/pages/dashboard-live-source-gap-ledger.runtime.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/pages/generated-dashboard-route-evidence-bindings.runtime.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/pages/generated-dashboard-route-maturity-ledger.runtime.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/design/comprehensive-dashboard-maturity-assessment.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/design/comprehensive-dashboard-maturity-assessment.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/design/dashboard-command-governance-ledger.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-command-governance-ledger.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | scripts/generate-dashboard-command-governance-ledger.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/validate-dashboard-command-governance-ledger.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Khashi VC ROC

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | public/roc/market-intelligence-live.html | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Media Engine Ops

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Media Business Operations

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | frontend/src/main.tsx | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | public/dashboard/app.js | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Business Mapper Workspace

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | business_mapper/static/index.html | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Meal Assistant

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Rinseables OS

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | public/dashboard/index.html | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Investing System ROC

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Hermes Workspace

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | src/operator/control-plane.ts | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | src/operator/operator-state.ts | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | src/workspace/workspace-server.ts | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### TLC Capital Group OS

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | public/dashboard/index.html | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

