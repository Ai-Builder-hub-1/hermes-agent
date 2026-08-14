# Dashboard Visual Maturity Rubric

Status: Active  
Version: V1

This rubric separates technical dashboard compliance from visual product quality. A dashboard can pass package-native and rendered-implementation checks while still looking generic, cramped, or immature. Visual maturity is the layer that decides whether it actually looks and behaves like a premium product.

## Visual Tiers

| Tier | Label | Minimum Score | Meaning |
| --- | --- | ---: | --- |
| V0 | Raw functional surface | 0 | The route renders, but visual quality is not approved. |
| V1 | Readable organized surface | 55 | One-shell and readable, but still generic or uneven. |
| V2 | Consistent system surface | 72 | Uses shared primitives consistently, but lacks product-grade hierarchy/polish. |
| V3 | Product-grade cockpit | 88 | Modern, task-oriented, polished, responsive, and interaction-complete. |
| V4 | Reference-grade pattern leader | 96 | Approved as a reusable visual reference for future dashboards. |

## Criteria

- Sidebar/navigation: one sidebar, strong grouping, polished collapsed/expanded states, no overflow.
- Page hierarchy: primary task is obvious, no repeated banners, non-actionable status is secondary.
- Spacing rhythm: consistent horizontal/vertical spacing, no crowded card edges.
- Card composition: headers, controls, badges, and body align cleanly.
- Typography/copy: headings match container scale, helper text uses approved affordances.
- Tables/data surfaces: card containment, pagination, consolidated sort/filter, internal horizontal scroll only.
- Charts/visualizations: real chart components, axes/labels/tooltips, honest states, modern style.
- Forms/drawers/actions: compact forms, clear drawers, verified buttons and persistence.
- Responsive containment: desktop/tablet/mobile/collapsed states are captured and clean.
- Reference alignment: references are cited and translated into our components.
- Product workflow fit: the route supports real work, not just a static report.

## Promotion

- V2 requires technical gate, desktop screenshot, no catastrophic overflow, and score >= 72.
- V3 requires V2, desktop/tablet/mobile proof, relevant drawer/modal proof, human approval, and score >= 88.
- V4 requires V3, reusable reference approval, component/pattern promotion, and score >= 96.

