# Fleet Release Readiness

Generated: 2026-09-24T02:26:40.779Z

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
| Nous Hermes Agent | 2 | generated-evidence | commit-proof-refresh | yes | no | 0 | 2 | 0 | 0 | 0 | 0 |
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
| Nous Hermes Agent | proof-not-required-for-generated-evidence-refresh | commit-generated-evidence-with-generator-command-evidence |
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
| M  | docs/fleet/fleet-release-readiness.json | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |
|  M | docs/fleet/fleet-release-readiness.md | generated-evidence | commit-with-generator | Generated governance/proof evidence; commit with its source or command evidence. |

