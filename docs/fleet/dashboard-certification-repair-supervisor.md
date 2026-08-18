# Dashboard Certification Repair Supervisor

Generated: 2026-08-15T18:51:38.537Z

This report is the repair layer above certification. It does not replace project migrations; it sequences them, classifies failures, names safe versus assisted repair lanes, and records proof commands.

## Summary

- Projects: 10
- Work items: 53
- Safe autofix items: 0
- Assisted repair items: 53
- Failure classes: 8

## Execution Order

| Project | Repair state | Next failure class | Safe | Assisted | Repair packet |
| --- | --- | --- | --- | --- | --- |
| khashi-vc | assisted-repair-needed | manifest-truth | 0 | 12 | khashi-vc.repair.2026-08-15 |
| hermes-os | assisted-repair-needed | manifest-truth | 0 | 12 | hermes-os.repair.2026-08-15 |
| meal-assistant | assisted-repair-needed | manifest-truth | 0 | 5 | meal-assistant.repair.2026-08-15 |
| media-business-os | assisted-repair-needed | manifest-truth | 0 | 4 | media-business-os.repair.2026-08-15 |
| business-mapper | assisted-repair-needed | manifest-truth | 0 | 4 | business-mapper.repair.2026-08-15 |
| rinseables-os | assisted-repair-needed | manifest-truth | 0 | 4 | rinseables-os.repair.2026-08-15 |
| tlc-capital-group-os | assisted-repair-needed | manifest-truth | 0 | 3 | tlc-capital-group-os.repair.2026-08-15 |
| nous-hermes-agent | assisted-repair-needed | manifest-truth | 0 | 4 | nous-hermes-agent.repair.2026-08-15 |
| media-engine | assisted-repair-needed | local-visual-debt | 0 | 3 | media-engine.repair.2026-08-15 |
| investing-system | assisted-repair-needed | manifest-truth | 0 | 2 | investing-system.repair.2026-08-15 |

## Top Work Items

| Project | Failure class | Lane | Safe | Priority | Issue | Path |
| --- | --- | --- | --- | --- | --- | --- |
| investing-system | manifest-truth | manual-or-assisted | no | 230 | falseNative.migrationLanguage | - |
| khashi-vc | manifest-truth | manual-or-assisted | no | 225 | tier3c.implementationMode | - |
| khashi-vc | manifest-truth | manual-or-assisted | no | 225 | falseNative.migrationLanguage | - |
| khashi-vc | shell-anatomy | assisted-code-migration | no | 220 | local-shell-class | public/roc/market-intelligence-live.html |
| khashi-vc | shell-anatomy | assisted-code-migration | no | 220 | anatomy.secondShellLayout | public/roc/market-intelligence-live.html |
| investing-system | static-route-retirement | manual-or-assisted | no | 215 | surface.compatibilityClaim | public/roc/index.html |
| khashi-vc | hidden-marker | assisted-code-migration | no | 215 | hidden-compliance-marker | public/roc/market-intelligence-live.html |
| media-business-os | manifest-truth | manual-or-assisted | no | 215 | falseNative.migrationLanguage | - |
| khashi-vc | static-route-retirement | manual-or-assisted | no | 210 | surface.compatibilityClaim | public/roc/index.html |
| meal-assistant | manifest-truth | manual-or-assisted | no | 205 | falseNative.migrationLanguage | - |
| media-business-os | hidden-marker | assisted-code-migration | no | 205 | hidden-compliance-marker | public/dashboard/app.js |
| tlc-capital-group-os | manifest-truth | manual-or-assisted | no | 200 | falseNative.migrationLanguage | - |
| hermes-os | manifest-truth | manual-or-assisted | no | 195 | falseNative.migrationLanguage | - |
| tlc-capital-group-os | shell-anatomy | assisted-code-migration | no | 195 | anatomy.secondShellLayout | public/dashboard/index.html |
| khashi-vc | local-visual-debt | assisted-component-replacement | no | 190 | localDebt.excessive | - |
| khashi-vc | shell-anatomy | assisted-code-migration | no | 190 | anatomy.multipleShellMarkers | public/roc/index.html |
| khashi-vc | shell-anatomy | assisted-code-migration | no | 190 | anatomy.multipleSidebarMarkers | public/roc/index.html |
| khashi-vc | shell-anatomy | assisted-code-migration | no | 190 | anatomy.multipleSidebarMarkers | public/roc/market-intelligence-live.html |
| tlc-capital-group-os | hidden-marker | assisted-code-migration | no | 190 | hidden-compliance-marker | public/dashboard/index.html |
| business-mapper | manifest-truth | manual-or-assisted | no | 185 | falseNative.migrationLanguage | - |
| hermes-os | hidden-marker | assisted-code-migration | no | 185 | hidden-compliance-marker | src/workspace/workspace-server.ts |
| hermes-os | hidden-marker | assisted-code-migration | no | 185 | hidden-compliance-marker | src/operator/operator-state.ts |
| hermes-os | hidden-marker | assisted-code-migration | no | 185 | hidden-compliance-marker | src/operator/control-plane.ts |
| media-engine | local-visual-debt | assisted-component-replacement | no | 185 | localDebt.excessive | - |
| business-mapper | shell-anatomy | assisted-code-migration | no | 180 | anatomy.secondShellLayout | business_mapper/static/index.html |
| hermes-os | static-route-retirement | manual-or-assisted | no | 180 | surface.compatibilityClaim | src/operator/control-plane.ts |
| media-business-os | shell-anatomy | assisted-code-migration | no | 180 | anatomy.multipleSidebarMarkers | public/dashboard/index.html |
| media-business-os | shell-anatomy | assisted-code-migration | no | 180 | anatomy.multipleSidebarMarkers | public/dashboard/app.js |
| rinseables-os | manifest-truth | manual-or-assisted | no | 180 | falseNative.migrationLanguage | - |
| business-mapper | hidden-marker | assisted-code-migration | no | 175 | hidden-compliance-marker | business_mapper/static/index.html |
| nous-hermes-agent | manifest-truth | manual-or-assisted | no | 175 | falseNative.migrationLanguage | - |
| rinseables-os | shell-anatomy | assisted-code-migration | no | 175 | anatomy.secondShellLayout | public/dashboard/index.html |
| meal-assistant | local-visual-debt | assisted-component-replacement | no | 170 | localDebt.excessive | - |
| meal-assistant | shell-anatomy | assisted-code-migration | no | 170 | anatomy.multipleShellMarkers | src/server.js |
| meal-assistant | shell-anatomy | assisted-code-migration | no | 170 | anatomy.multipleSidebarMarkers | src/server.js |
| rinseables-os | hidden-marker | assisted-code-migration | no | 170 | hidden-compliance-marker | public/dashboard/index.html |
| khashi-vc | local-visual-debt | assisted-component-replacement | no | 165 | hardcoded-visual-token | public/roc/market-intelligence-live.html |
| nous-hermes-agent | hidden-marker | assisted-code-migration | no | 165 | hidden-compliance-marker | web/src/pages/DashboardKitGalleryPage.tsx |
| rinseables-os | static-route-retirement | manual-or-assisted | no | 165 | surface.compatibilityClaim | public/dashboard/index.html |
| hermes-os | local-visual-debt | assisted-component-replacement | no | 160 | localDebt.excessive | - |

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
