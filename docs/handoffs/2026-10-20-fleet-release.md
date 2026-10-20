# Fleet release — 2026-10-20

Edward authorized committing and deploying the audited pending work through the
existing backbone, with no-mistakes skipped. Feature histories are preserved on
release/fleet-20261020 and will be merged into the configured production branch.

Validation: The pending application change updates the Investing System link to Night Ops. Workflow YAML parses and automatic triggers are removed; Python application code is unchanged.

Hosted workflows in this release are manual/reusable only where present, preserving
existing manual inputs. Application credentials, private environment backups,
runtime snapshots, generated reports, and data are not publication artifacts.

Fresh signed review and revision-bound UI certification are explicitly deferred
under the user instruction; no clean certification receipt is claimed. Functional
checks, builds, and service health remain required. The backbone's waiver is
explicit and recorded in deployment evidence; its default review policy remains.

Next: push the release and production branch, promote using the backbone on
hermes-os, and verify source/image evidence and the live service. For the media
release, use the normal single production bot rollout, never a second token-bearing
test bot. Existing provider-spend authorization is not increased by deployment.
The host deployment-evidence/latest records the resulting commit and rollback.
