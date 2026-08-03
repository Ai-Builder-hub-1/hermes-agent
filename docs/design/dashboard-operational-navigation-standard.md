# Dashboard Operational Navigation Standard

Tier 3 dashboards must use a product-grade operational navigation rail. The rail does not need to look identical across projects, but it must prove that the product team worked through hierarchy, state, density, and responsive behavior.

## Required Pattern

Every Tier 3 sidebar must include:

- **Brand block**: a visible project mark or monogram, product name, and concise operating subtitle.
- **Grouped navigation**: at least two named nav groups, or a documented exception for dashboards with fewer than five routes.
- **Active route state**: the current route must be visually distinct and programmatically discoverable through `.active`, `.is-active`, `aria-current="page"`, or an equivalent state.
- **Collapsed labels**: each nav item must provide a short label through `data-short`, `data-short-label`, icon-only text, or an equivalent accessible collapsed affordance.
- **Footer/status area**: a dashboard switcher, readiness/status note, action-surface note, or environment/role status must live below the primary nav.
- **Text safety**: brand text, nav labels, badges, and footer copy must truncate or wrap without overflowing the rail.
- **Keyboard state**: nav items and the collapse control must expose visible hover/focus/pressed/active treatment.
- **Mobile behavior**: mobile must become a usable top nav, drawer, stacked rail, or collapsed rail. It cannot remain a cramped desktop sidebar.

## Visual Craft Bar

A sidebar fails Tier 3 when it is only a list of plain buttons, even if it uses `DashboardSidebar` or `.hdk-sidebar-rail`.

The rail should provide:

- a clear visual spine for the dashboard,
- grouped operating questions rather than a flat page list,
- a restrained but intentional surface treatment,
- a clear active route,
- collapsed behavior that still communicates destination,
- a footer/status area that explains the operational context.

Media Business Operations is an approved reference implementation for the pattern, not a required visual clone. Other dashboards may use different tone, density, icons, or grouping as long as the required pattern is present.

## Mobbin Extraction Rule

Mobbin references must be converted into durable navigation rules before implementation:

1. Identify the navigation model: rail, top nav, split nav, drawer, or hybrid.
2. Extract group labels, active-state treatment, collapse behavior, footer/status treatment, and mobile behavior.
3. Map the extracted behavior into `@hermes/dashboard-kit` components or an approved project-specific composition.
4. Record what should not be copied visually.
5. Add the extracted sidebar acceptance criteria to the project design review.

## Proof Requirements

Tier 3 proof must include:

- desktop expanded sidebar screenshot,
- desktop collapsed sidebar screenshot when the product supports collapse,
- mobile sidebar/navigation screenshot,
- active route visible in proof,
- no horizontal document overflow,
- no clipped nav labels in expanded mode,
- collapsed labels or icons visible in collapsed mode,
- footer/status area visible or intentionally moved into mobile navigation.

## Enforcement

The following checks must be part of Tier 3 validation:

- rendered audit checks for brand mark, grouped nav, active route, collapsed labels, footer/status, and mobile nav evidence;
- Tier 3 score includes operational navigation quality;
- package-native surface validation inspects source for the required sidebar contract;
- visual baseline capture includes desktop-expanded, desktop-collapsed, and mobile screenshots.
