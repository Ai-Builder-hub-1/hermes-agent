# HDK-First Fleet Audit

Generated: 2026-08-18T12:59:21.981Z

This audit closes the gap between "the kit is installed" and "the dashboard is actually governed by the kit." It checks package dependency, dashboard manifests, local implementation markers, raw/static route debt, and production stylesheet/route delivery.

## Summary

- Projects audited: 10
- HDK dependency present: 10
- HDK baseline compliant: 1
- HDK-first ready: 0
- HDK-first with debt: 8
- Need migration: 2
- Production routes reachable: 0
- Local findings: 106
- Production findings: 0

## Project Status

| Project | Status | HDK baseline | Adoption | Implementation | Implementation native | Production | Finding count |
| --- | --- | --- | --- | --- | --- | --- | --- |
| business-mapper | hdk-first-with-debt | no | package-native | package-native | yes | skipped | 10 |
| hermes | hdk-first-with-debt | no | package-native | package-native | yes | skipped | 11 |
| investing-system | hdk-first-with-debt | no | package-native | package-native | yes | skipped | 12 |
| khashi-vc | needs-migration | no | package-native | package-native-runtime | no | skipped | 14 |
| Meal-assistant | hdk-first-with-debt | no | package-native | package-native | yes | skipped | 11 |
| media-business-operations | needs-migration | no | package-native | package-native | no | skipped | 13 |
| media-engine | hdk-first-with-debt | no | package-native | package-native | yes | skipped | 12 |
| nous-hermes-agent | hdk-first-with-debt | yes | package-native | package-native | yes | skipped | 3 |
| rinseables-os | hdk-first-with-debt | no | package-native | package-native | yes | skipped | 10 |
| tlc-capital-group-os | hdk-first-with-debt | no | package-native | package-native | yes | skipped | 10 |

## Production Delivery

| Project | Production URL | Route status | Probed CSS | Findings |
| --- | --- | --- | --- | --- |
| business-mapper | https://business-mapper.tlccapitalgroup.com/dashboard | skipped | none | none |
| hermes | https://hermes.tlccapitalgroup.com/ | skipped | none | none |
| investing-system | https://investing.tlccapitalgroup.com/roc | skipped | none | none |
| khashi-vc | https://roc.tlccapitalgroup.com/ | skipped | none | none |
| Meal-assistant | https://meal.tlccapitalgroup.com/ | skipped | none | none |
| media-business-operations | https://media-business-operations.tlccapitalgroup.com/dashboard | skipped | none | none |
| media-engine | https://media.tlccapitalgroup.com/dashboard | skipped | none | none |
| nous-hermes-agent | https://agent.tlccapitalgroup.com | skipped | none | none |
| rinseables-os | https://rinseables.tlccapitalgroup.com | skipped | none | none |
| tlc-capital-group-os | https://tlc.tlccapitalgroup.com/dashboard | skipped | none | none |

## Findings

| Project | Layer | Finding |
| --- | --- | --- |
| business-mapper | local | dashboardKit.baseline is not hdk-first |
| business-mapper | local | dashboardKit.shell is not hdk |
| business-mapper | local | dashboardKit.sidebar is not hdk |
| business-mapper | local | dashboardKit.header is not hdk |
| business-mapper | local | dashboardKit.theme is not hdk |
| business-mapper | local | dashboardKit.spacing is not hdk |
| business-mapper | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| business-mapper | local | reference intake is not required |
| business-mapper | local | design review checklist is not required |
| business-mapper | local | 2 raw HTML route marker(s) remain |
| hermes | local | dashboardKit.baseline is not hdk-first |
| hermes | local | dashboardKit.shell is not hdk |
| hermes | local | dashboardKit.sidebar is not hdk |
| hermes | local | dashboardKit.header is not hdk |
| hermes | local | dashboardKit.theme is not hdk |
| hermes | local | dashboardKit.spacing is not hdk |
| hermes | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| hermes | local | reference intake is not required |
| hermes | local | design review checklist is not required |
| hermes | local | 19 raw HTML route marker(s) remain |
| hermes | local | high local CSS/HTML styling surface |
| investing-system | local | dashboardKit.baseline is not hdk-first |
| investing-system | local | dashboardKit.shell is not hdk |
| investing-system | local | dashboardKit.sidebar is not hdk |
| investing-system | local | dashboardKit.header is not hdk |
| investing-system | local | dashboardKit.theme is not hdk |
| investing-system | local | dashboardKit.spacing is not hdk |
| investing-system | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| investing-system | local | reference intake is not required |
| investing-system | local | design review checklist is not required |
| investing-system | local | 5 raw HTML route marker(s) remain |
| investing-system | local | high local CSS/HTML styling surface |
| investing-system | local | high hardcoded color/style surface |
| khashi-vc | local | dashboardKit.baseline is not hdk-first |
| khashi-vc | local | dashboardKit.shell is not hdk |
| khashi-vc | local | dashboardKit.sidebar is not hdk |
| khashi-vc | local | dashboardKit.header is not hdk |
| khashi-vc | local | dashboardKit.theme is not hdk |
| khashi-vc | local | dashboardKit.spacing is not hdk |
| khashi-vc | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| khashi-vc | local | reference intake is not required |
| khashi-vc | local | design review checklist is not required |
| khashi-vc | local | runtime bridge still present |
| khashi-vc | local | compatibility or mount surface remains |
| khashi-vc | local | 26 raw HTML route marker(s) remain |
| khashi-vc | local | high local CSS/HTML styling surface |
| khashi-vc | local | high hardcoded color/style surface |
| Meal-assistant | local | dashboardKit.baseline is not hdk-first |
| Meal-assistant | local | dashboardKit.shell is not hdk |
| Meal-assistant | local | dashboardKit.sidebar is not hdk |
| Meal-assistant | local | dashboardKit.header is not hdk |
| Meal-assistant | local | dashboardKit.theme is not hdk |
| Meal-assistant | local | dashboardKit.spacing is not hdk |
| Meal-assistant | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| Meal-assistant | local | reference intake is not required |
| Meal-assistant | local | design review checklist is not required |
| Meal-assistant | local | 10 raw HTML route marker(s) remain |
| Meal-assistant | local | high local CSS/HTML styling surface |
| media-business-operations | local | dashboardKit.baseline is not hdk-first |
| media-business-operations | local | dashboardKit.shell is not hdk |
| media-business-operations | local | dashboardKit.sidebar is not hdk |
| media-business-operations | local | dashboardKit.header is not hdk |
| media-business-operations | local | dashboardKit.theme is not hdk |
| media-business-operations | local | dashboardKit.spacing is not hdk |
| media-business-operations | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| media-business-operations | local | reference intake is not required |
| media-business-operations | local | design review checklist is not required |
| media-business-operations | local | compatibility or mount surface remains |
| media-business-operations | local | 6 raw HTML route marker(s) remain |
| media-business-operations | local | high local CSS/HTML styling surface |
| media-business-operations | local | high hardcoded color/style surface |
| media-engine | local | dashboardKit.baseline is not hdk-first |
| media-engine | local | dashboardKit.shell is not hdk |
| media-engine | local | dashboardKit.sidebar is not hdk |
| media-engine | local | dashboardKit.header is not hdk |
| media-engine | local | dashboardKit.theme is not hdk |
| media-engine | local | dashboardKit.spacing is not hdk |
| media-engine | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| media-engine | local | reference intake is not required |
| media-engine | local | design review checklist is not required |
| media-engine | local | 671 raw HTML route marker(s) remain |
| media-engine | local | high local CSS/HTML styling surface |
| media-engine | local | high hardcoded color/style surface |
| nous-hermes-agent | local | 41 raw HTML route marker(s) remain |
| nous-hermes-agent | local | high local CSS/HTML styling surface |
| nous-hermes-agent | local | high hardcoded color/style surface |
| rinseables-os | local | dashboardKit.baseline is not hdk-first |
| rinseables-os | local | dashboardKit.shell is not hdk |
| rinseables-os | local | dashboardKit.sidebar is not hdk |
| rinseables-os | local | dashboardKit.header is not hdk |
| rinseables-os | local | dashboardKit.theme is not hdk |
| rinseables-os | local | dashboardKit.spacing is not hdk |
| rinseables-os | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| rinseables-os | local | reference intake is not required |
| rinseables-os | local | design review checklist is not required |
| rinseables-os | local | 2 raw HTML route marker(s) remain |
| tlc-capital-group-os | local | dashboardKit.baseline is not hdk-first |
| tlc-capital-group-os | local | dashboardKit.shell is not hdk |
| tlc-capital-group-os | local | dashboardKit.sidebar is not hdk |
| tlc-capital-group-os | local | dashboardKit.header is not hdk |
| tlc-capital-group-os | local | dashboardKit.theme is not hdk |
| tlc-capital-group-os | local | dashboardKit.spacing is not hdk |
| tlc-capital-group-os | local | missing HDK baseline script(s): hdk:check, hdk:proof, hdk:visual |
| tlc-capital-group-os | local | reference intake is not required |
| tlc-capital-group-os | local | design review checklist is not required |
| tlc-capital-group-os | local | 2 raw HTML route marker(s) remain |

## Recommended Actions

| Project | Action |
| --- | --- |
| business-mapper | Keep HDK first, add visual regression baselines, and only build custom components behind explicit component contracts. |
| hermes | Move shell, spacing, theme, card, table, and chart primitives into HDK tokens/components; keep project CSS to domain-only variants. |
| investing-system | Move shell, spacing, theme, card, table, and chart primitives into HDK tokens/components; keep project CSS to domain-only variants. |
| khashi-vc | Replace runtime bridge route with a package-native frontend entry that imports HDK components directly.<br>Promote one HDK-first route as canonical and demote compatibility routes from operator navigation.<br>Move shell, spacing, theme, card, table, and chart primitives into HDK tokens/components; keep project CSS to domain-only variants. |
| Meal-assistant | Move shell, spacing, theme, card, table, and chart primitives into HDK tokens/components; keep project CSS to domain-only variants. |
| media-business-operations | Promote one HDK-first route as canonical and demote compatibility routes from operator navigation.<br>Move shell, spacing, theme, card, table, and chart primitives into HDK tokens/components; keep project CSS to domain-only variants. |
| media-engine | Move shell, spacing, theme, card, table, and chart primitives into HDK tokens/components; keep project CSS to domain-only variants. |
| nous-hermes-agent | Move shell, spacing, theme, card, table, and chart primitives into HDK tokens/components; keep project CSS to domain-only variants. |
| rinseables-os | Keep HDK first, add visual regression baselines, and only build custom components behind explicit component contracts. |
| tlc-capital-group-os | Keep HDK first, add visual regression baselines, and only build custom components behind explicit component contracts. |

## Enforcement Rule

All dashboard projects should run `npm run dashboard:hdk-first:audit` from Nous Hermes before visual promotion. A project can keep custom domain components, but the page shell, sidebar, spacing, tables, charts, cards, drawers, theme, empty/loading/error states, and proof metadata must come through HDK contracts.
