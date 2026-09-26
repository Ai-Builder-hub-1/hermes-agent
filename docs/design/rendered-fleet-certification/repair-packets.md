# Rendered Fleet Repair Packets

Generated: 2026-08-22T20:30:58.828Z

These packets are the dashboard-by-dashboard work queue produced by browser-rendered certification. They are intentionally visual and route-specific so repairs do not stop at package dependency or marker compliance.

| Dashboard | Verdict | Score | Actions | Screenshots |
| --- | --- | --- | --- | --- |
| nous-hermes-agent.dashboard | blocked | 74 | 1 | docs/design/rendered-fleet-certification/nous-hermes-agent-dashboard-desktop.png<br>docs/design/rendered-fleet-certification/nous-hermes-agent-dashboard-mobile.png |
| khashi-vc.roc | needs-review | 95 | 1 | docs/design/rendered-fleet-certification/khashi-vc-roc-desktop.png<br>docs/design/rendered-fleet-certification/khashi-vc-roc-mobile.png |
| media-engine.ops | blocked | 79 | 1 | docs/design/rendered-fleet-certification/media-engine-ops-desktop.png<br>docs/design/rendered-fleet-certification/media-engine-ops-mobile.png |
| media-business-operations.main | blocked | 84 | 1 | docs/design/rendered-fleet-certification/media-business-operations-main-desktop.png<br>docs/design/rendered-fleet-certification/media-business-operations-main-mobile.png |
| meal-assistant.main | unreachable | 0 | 1 | none |
| hermes.workspace | unreachable | 0 | 1 | none |

## Nous Hermes Agent

Dashboard: nous-hermes-agent.dashboard  
Verdict: blocked  
Score: 74

### Actions
- Repair the canonical dashboard shell geometry: header, sidebar/top command bar, auth controls, and main workspace must occupy approved HDK regions without squeezed titles, content-like nav stacks, below-fold starts, or nested scroll traps.

### Verification
- npm run dashboard:certify:rendered -- --id nous-hermes-agent.dashboard
- Desktop and mobile screenshots must match the approved HDK shell/sidebar/card rhythm.
- No hidden HDK markers, local card dominance, auth-wall capture, or horizontal overflow can remain.

## Khashi VC ROC

Dashboard: khashi-vc.roc  
Verdict: needs-review  
Score: 95

### Actions
- Repair the canonical dashboard shell geometry: header, sidebar/top command bar, auth controls, and main workspace must occupy approved HDK regions without squeezed titles, content-like nav stacks, below-fold starts, or nested scroll traps.

### Verification
- npm run dashboard:certify:rendered -- --id khashi-vc.roc
- Desktop and mobile screenshots must match the approved HDK shell/sidebar/card rhythm.
- No hidden HDK markers, local card dominance, auth-wall capture, or horizontal overflow can remain.

## Media Engine Ops

Dashboard: media-engine.ops  
Verdict: blocked  
Score: 79

### Actions
- Repair the canonical dashboard shell geometry: header, sidebar/top command bar, auth controls, and main workspace must occupy approved HDK regions without squeezed titles, content-like nav stacks, below-fold starts, or nested scroll traps.

### Verification
- npm run dashboard:certify:rendered -- --id media-engine.ops
- Desktop and mobile screenshots must match the approved HDK shell/sidebar/card rhythm.
- No hidden HDK markers, local card dominance, auth-wall capture, or horizontal overflow can remain.

## Media Business Operations

Dashboard: media-business-operations.main  
Verdict: blocked  
Score: 84

### Actions
- Repair the canonical dashboard shell geometry: header, sidebar/top command bar, auth controls, and main workspace must occupy approved HDK regions without squeezed titles, content-like nav stacks, below-fold starts, or nested scroll traps.

### Verification
- npm run dashboard:certify:rendered -- --id media-business-operations.main
- Desktop and mobile screenshots must match the approved HDK shell/sidebar/card rhythm.
- No hidden HDK markers, local card dominance, auth-wall capture, or horizontal overflow can remain.

## Meal Assistant

Dashboard: meal-assistant.main  
Verdict: unreachable  
Score: 0

### Actions
- Register and verify a local proof URL that opens the actual operator dashboard without manual navigation.

### Verification
- npm run dashboard:certify:rendered -- --id meal-assistant.main
- Desktop and mobile screenshots must match the approved HDK shell/sidebar/card rhythm.
- No hidden HDK markers, local card dominance, auth-wall capture, or horizontal overflow can remain.

## Hermes Workspace

Dashboard: hermes.workspace  
Verdict: unreachable  
Score: 0

### Actions
- Register and verify a local proof URL that opens the actual operator dashboard without manual navigation.

### Verification
- npm run dashboard:certify:rendered -- --id hermes.workspace
- Desktop and mobile screenshots must match the approved HDK shell/sidebar/card rhythm.
- No hidden HDK markers, local card dominance, auth-wall capture, or horizontal overflow can remain.
