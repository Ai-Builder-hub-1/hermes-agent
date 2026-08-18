# Fleet Release Readiness

Generated: 2026-08-15T18:51:37.998Z

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
| Nous Hermes Agent | 44 | mixed | commit-after-validation | yes | yes | 17 | 27 | 0 | 0 | 0 | 0 |
| Khashi VC ROC | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Media Engine Ops | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Media Business Operations | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Business Mapper Workspace | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Meal Assistant | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Rinseables OS | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Investing System ROC | 3 | source-change | commit-after-validation | yes | yes | 3 | 0 | 0 | 0 | 0 | 0 |
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
| Investing System ROC | proof-required-for-ui-route-theme-or-dashboard-surface-changes | run-project-validation-before-commit |
| Hermes Workspace | proof-not-required | no-cleanup-needed |
| TLC Capital Group OS | proof-not-required | no-cleanup-needed |

## Dirty File Classification

### Nous Hermes Agent

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | docs/design/dashboard-component-native-implementation-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-component-native-implementation-report.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-cross-project-component-audit.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-cross-project-component-audit.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-kit-served-css-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-kit-served-css-report.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-live-e2e-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-monitoring-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-operating-system-layer-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-operating-system-layer-report.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-rendered-implementation-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-rendered-implementation-report.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/static-dashboard-route-audit.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-evidence-ledger.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-status.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-suggestions.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-suggestions.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-work-graph.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-work-graph.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-release-readiness.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-release-readiness.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-ship-check.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-ship-check.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/tlc-operating-system-maturity-build-plan.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/tlc-operating-system-maturity-build-plan.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | package.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | scripts/fleet-ship-check.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/design/dashboard-certification-repair-playbooks.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-certification-standard.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/fleet/dashboard-certification-attempt-ledger.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/fleet/dashboard-certification-repair-execution-ledger.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/fleet/dashboard-certification-repair-execution-ledger.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/fleet/dashboard-certification-repair-packets.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/fleet/dashboard-certification-repair-supervisor.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/fleet/dashboard-certification-repair-supervisor.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/fleet/dashboard-certification-report.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/fleet/dashboard-certification-report.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/certify-dashboard-fleet.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/execute-dashboard-certification-repairs.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/generate-dashboard-certification-repair-supervisor.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/validate-dashboard-certification-repair-supervisor.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/validate-dashboard-certification.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

### Investing System ROC

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | public/roc/index.html | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | public/roc/styles.css | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

