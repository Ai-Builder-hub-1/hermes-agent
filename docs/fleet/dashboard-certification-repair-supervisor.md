# Dashboard Certification Repair Supervisor

Generated: 2026-09-24T02:26:42.194Z

This report is the repair layer above certification. It does not replace project migrations; it sequences them, classifies failures, names safe versus assisted repair lanes, and records proof commands.

## Summary

- Projects: 10
- Work items: 0
- Safe autofix items: 0
- Assisted repair items: 0
- Failure classes: 8

## Execution Order

| Project | Repair state | Next failure class | Safe | Assisted | Repair packet |
| --- | --- | --- | --- | --- | --- |
| khashi-vc | certified |  | 0 | 0 |  |
| media-engine | certified |  | 0 | 0 |  |
| media-business-os | certified |  | 0 | 0 |  |
| business-mapper | certified |  | 0 | 0 |  |
| meal-assistant | certified |  | 0 | 0 |  |
| hermes-os | certified |  | 0 | 0 |  |
| tlc-capital-group-os | certified |  | 0 | 0 |  |
| rinseables-os | certified |  | 0 | 0 |  |
| investing-system | certified |  | 0 | 0 |  |
| nous-hermes-agent | certified |  | 0 | 0 |  |

## Top Work Items

| Project | Failure class | Lane | Safe | Priority | Issue | Path |
| --- | --- | --- | --- | --- | --- | --- |

## Playbook Classes

### manifest-truth

Lane: manual-or-assisted  
Safe autofix: no  
Severity: 100

Declared maturity does not match actual implementation state.

Repair: Split target maturity from certified maturity, then complete package-native route migration before restoring T3C.

Proof:
- manifest diff proves certified state is not overstated
- dashboard:certify:strict
- fleet:ship-check

### shell-anatomy

Lane: assisted-code-migration  
Safe autofix: no  
Severity: 90

Rendered shell/sidebar/header anatomy is local, nested, duplicated, or incomplete.

Repair: Use a real DashboardShell with one direct sidebar child, one main child, one header region, and one scroll owner.

Proof:
- desktop expanded screenshot
- desktop collapsed screenshot
- mobile screenshot
- DOM anatomy check
- dashboard:certify:strict
- fleet:ship-check

### hidden-marker

Lane: assisted-code-migration  
Safe autofix: no  
Severity: 85

Hidden markers are satisfying old validators without rendering real components.

Repair: Remove hidden markers and render the actual kit components or direct package imports.

Proof:
- source scan shows no hidden hdk/component markers
- dashboard:certify:strict
- fleet:ship-check

### static-route-retirement

Lane: manual-or-assisted  
Safe autofix: no  
Severity: 80

Compatibility/static route is still treated as package-native production UI.

Repair: Demote static routes to dev-review/redirect status and register the true package-native operator route.

Proof:
- production nav points to package-native route
- compatibility route is dev-review or redirect only
- dashboard:certify:strict
- fleet:ship-check

### local-visual-debt

Lane: assisted-component-replacement  
Safe autofix: no  
Severity: 65

Local CSS/spacing/colors/layout primitives still control the dashboard.

Repair: Replace local primitives with kit components/tokens or add expiring exceptions for narrow domain accents.

Proof:
- local override scan
- spacing/card/table proof screenshots
- dashboard:certify:strict
- fleet:ship-check

### chart-contract

Lane: assisted-component-replacement  
Safe autofix: no  
Severity: 55

Charts are fake, hand-drawn, missing axes/states, or not backed by approved chart components.

Repair: Use approved chart wrappers with x/y units, hover/legend/state contracts, and proof screenshots.

Proof:
- chart proof screenshot
- axis/unit/state contract
- dashboard:certify:strict
- fleet:ship-check

### proof-gap

Lane: safe-infra-repair  
Safe autofix: yes  
Severity: 45

Proof capture or Playwright evidence is missing.

Repair: Restore proof script/config and run local screenshot/workflow capture.

Proof:
- Playwright proof output exists
- dashboard:certify:strict
- fleet:ship-check

### dev-tool-production-risk

Lane: safe-code-guard  
Safe autofix: yes  
Severity: 35

Development-only visual selector can load in production.

Repair: Guard selector scripts behind localhost/dev checks and assert production exclusion.

Proof:
- production source excludes visual-selection bridge
- dashboard:certify:strict
- fleet:ship-check
