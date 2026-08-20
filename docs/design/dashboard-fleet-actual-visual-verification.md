# Dashboard Fleet Actual Visual Verification

Generated: 2026-08-20

This report separates three things that were previously getting blended together:

- Project-level structural standard checks.
- Central HDK/component-native adoption checks.
- Actual rendered dashboard screenshots.

## Current Result

All project-local `dashboard:standard:check` commands pass, but the fleet is not fully visually verified yet because several production routes only captured auth walls and several central adoption checks still identify static bridge debt.

## Actual Screenshot Status

| Project | Actual page status | Screenshot | Immediate meaning |
| --- | --- | --- | --- |
| Nous Hermes Agent | Review needed | `docs/design/production-dashboard-screenshots/nous-hermes-agent.dashboard.png` | Auth wall captured; authenticated dashboard proof is still required. |
| Khashi VC | Review needed | `docs/design/production-dashboard-screenshots/khashi-vc.roc.png` | Auth wall captured; production proof also recently exposed server/database instability. |
| Media Engine | Captured | `docs/design/production-dashboard-screenshots/media-engine.ops.png` | Real dashboard captured and available for visual review. |
| Media Business Operations | Captured | `docs/design/production-dashboard-screenshots/media-business-operations.main.png` | Production capture shows unstyled/stale deploy; local CSS parity and build are now fixed and need deploy. |
| Business Mapper | Captured | `docs/design/production-dashboard-screenshots/business-mapper.workspace.png` | Real page captured; needs deeper visual-quality migration beyond structural pass. |
| Meal Assistant | Review needed | `docs/design/production-dashboard-screenshots/meal-assistant.main.png` | Auth wall plus low-content capture; authenticated route proof is required. |
| Rinseables OS | Review needed | `docs/design/production-dashboard-screenshots/rinseables-os.main.png` | Auth wall captured; authenticated dashboard proof is required. |
| Investing System | Review needed | `docs/design/production-dashboard-screenshots/investing-system.roc.png` | Auth wall captured; authenticated trading desk proof is required. |
| Hermes Workspace | Captured | `docs/design/production-dashboard-screenshots/hermes.workspace.png` | Real page captured; needs visual-quality review against command-cockpit standard. |
| TLC Capital Group OS | Review needed | `docs/design/production-dashboard-screenshots/tlc-capital-group-os.main.png` | Auth wall captured; authenticated OKR/KPI cockpit proof is required. |

## Enforcement Gap Closed In This Pass

Added `dashboard:production-actual:capture` in Nous Hermes Agent.

This captures the real dashboard `url` from `hermes.dashboards.json`, not just the proof endpoint.

Added `dashboard:production-actual:validate`.

This warns when screenshots are auth walls, blank, low-content, failed, or missing.

Added `dashboard:production-actual:validate:strict`.

This fails when auth walls or blank pages are captured, so promotion can be blocked until authenticated visual proof exists.

## Remaining Fleet Gaps

1. Authenticated screenshot capture is not complete.
   The screenshots for Nous, Khashi, Meal Assistant, Rinseables, Investing, and TLC prove the login screen, not the operator dashboard.

2. Central adoption is stricter than project-local checks.
   Project-local checks pass, but central HDK adoption still flags static bridges and missing component evidence in Khashi, Media Engine, Media Business, Business Mapper, Meal Assistant, Hermes, TLC, Rinseables, and Investing.

3. Static compatibility routes remain.
   Eight routes are still tracked as static compatibility debt. They should remain as rollback/review bridges only, not as primary dashboard implementation.

4. Production can be stale while local is fixed.
   Media Business Operations now passes locally and renders styled at `http://127.0.0.1:4100/dashboard`, but production still shows the stale unstyled dashboard until deployed.

5. Visual proof needs page-by-page login support.
   The next enforcement maturity layer is per-dashboard auth automation or read-only visual proof routes that render the actual dashboard state without exposing privileged actions.

## Validation Commands

```bash
npm run dashboard:production-actual:capture -- --timeout=45000
npm run dashboard:production-actual:validate
npm run dashboard:production-actual:validate:strict
```

Project-local standard check loop used in this pass:

```bash
for p in Meal-assistant business-mapper hermes investing-system khashi-vc media-business-operations media-engine nous-hermes-agent rinseables-os tlc-capital-group-os; do
  (cd "/Users/hq/Workspace/projects/$p" && npm run dashboard:standard:check)
done
```

## Next Build Order

1. Deploy Media Business Operations so production picks up the fixed HDK CSS parity and React bundle.
2. Add authenticated visual capture contracts for Investing, Meal Assistant, TLC, Khashi, Rinseables, and Nous.
3. Fix Khashi production proof/runtime instability before treating its screenshots as reliable.
4. Promote actual-dashboard visual validation into the fleet ship check.
5. Continue per-project component-native decomposition where central adoption still marks static bridge debt.
