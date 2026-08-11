# Fleet Release Readiness

Generated: 2026-08-11T17:06:38.328Z

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
| Nous Hermes Agent | 61 | mixed | commit-after-validation | yes | yes | 34 | 26 | 1 | 0 | 0 | 0 |
| Khashi VC ROC | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Media Engine Ops | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Media Business Operations | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Business Mapper Workspace | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Meal Assistant | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Rinseables OS | 6 | mixed | commit-after-validation | yes | yes | 4 | 2 | 0 | 0 | 0 | 0 |
| Investing System ROC | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| Hermes Workspace | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |
| TLC Capital Group OS | 0 | clean | clean | yes | yes | 0 | 0 | 0 | 0 | 0 | 0 |

## Cleanup Guidance

| Project | Proof policy | Cleanup actions |
| --- | --- | --- |
| Nous Hermes Agent | screenshot-proof-present-commit-only-if-referenced | commit-screenshots-only-when-registry-or-baseline-references-them<br>commit-generated-evidence-with-generator-command-evidence<br>run-project-validation-before-commit |
| Khashi VC ROC | proof-not-required | no-cleanup-needed |
| Media Engine Ops | proof-not-required | no-cleanup-needed |
| Media Business Operations | proof-not-required | no-cleanup-needed |
| Business Mapper Workspace | proof-not-required | no-cleanup-needed |
| Meal Assistant | proof-not-required | no-cleanup-needed |
| Rinseables OS | proof-or-generated-evidence-present-validate-before-ship | commit-generated-evidence-with-generator-command-evidence<br>run-project-validation-before-commit |
| Investing System ROC | proof-not-required | no-cleanup-needed |
| Hermes Workspace | proof-not-required | no-cleanup-needed |
| TLC Capital Group OS | proof-not-required | no-cleanup-needed |

## Dirty File Classification

### Nous Hermes Agent

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | docs/design/dashboard-cross-project-component-audit.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-cross-project-component-audit.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-kit-gallery-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-kit-gallery-report.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-kit-gallery.html | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/dashboard-production-proof-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/design/static-dashboard-route-audit.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/README.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | docs/fleet/fleet-evidence-ledger.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-status.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-suggestions.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-suggestions.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-work-graph.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-maturity-work-graph.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | hermes.dashboards.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | package-lock.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | package.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/DESIGN.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/README.md | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/adoption/component-review-registry.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/adoption/registry.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | packages/hermes-dashboard-kit/scripts/audit-adoption.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/scripts/generate-gallery.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/scripts/status.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/src/dashboard-kit.css | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/src/index.js | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | packages/hermes-dashboard-kit/tests/dashboard-kit.test.js | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/audit-dashboard-component-gaps.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | scripts/generate-fleet-maturity-tracker.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/App.tsx | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/dashboard-page-metadata.ts | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/dashboard-route-registry.tsx | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/lib/resolve-page-title.ts | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/pages/DashboardKitGalleryPage.tsx | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | web/src/pages/dashboard-kit-gallery-data.ts | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | web/src/pages/dashboard-kit-gallery-kit.css | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | web/vite.config.ts | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/design/dashboard-kit-design-review.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-kit-reference-intake.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-live-e2e-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-monitoring-registry.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/production-screenshots/rinseables-os.main.png | screenshot-proof | commit-if-referenced | Visual proof is commit-worthy only when referenced by a registry, report, or baseline contract. |
| ?? | docs/fleet/fleet-release-readiness.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/fleet/fleet-release-readiness.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/fleet/fleet-ship-check.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/fleet/fleet-ship-check.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | scripts/check-dashboard-live-e2e.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/check-dashboard-monitoring.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/check-web-build-budget.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/fleet-ship-check.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/generate-dashboard-live-e2e-registry.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/generate-dashboard-monitoring-registry.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/generate-fleet-maturity-review-data.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/generate-fleet-release-readiness.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/validate-dashboard-kit-gallery-maturity.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/validate-fleet-release-readiness.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | web/src/pages/FleetMaturityReviewPage.tsx | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | web/src/pages/fleet-maturity-review-data.ts | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |

### Rinseables OS

| Status | Path | Class | Policy | Reason |
| --- | --- | --- | --- | --- |
| M  | .hermes-dashboard.json | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
|  M | public/dashboard/styles.css | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | docs/design/dashboard-design-review.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | docs/design/dashboard-reference-intake.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
| ?? | playwright.config.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |
| ?? | scripts/capture-dashboard-proof.mjs | deployable-source | commit-after-validation | Source, config, test, standard, or manifest change. |

