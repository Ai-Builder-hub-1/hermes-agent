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

## Ownership Rule

Tier 3 projects do not build sidebars. They declare routes and navigation groups;
`@hermes/dashboard-kit` renders the sidebar, controls its spacing, owns its
expanded/collapsed/mobile behavior, and supplies the scroll contract.

Project-local sidebar primitives are not allowed in Tier 3 unless there is an
approved, expiring exception:

- local `.sidebar`, `.topbar`, `.nav-item`, `.dashboard-shell`, or
  project-prefixed equivalents,
- copied `hermes-dashboard-kit.css` files used as the primary runtime style,
- hidden sidebar markers that exist only to satisfy validators,
- project-specific sidebar width, gap, active-state, theme, or scroll tokens.

If a project needs a different sidebar look, the work belongs in
`@hermes/dashboard-kit` as an approved variant. The project should not fork the
sidebar standard locally.

## Route Declaration Contract

Dashboard routes should be supplied to the kit as route data, not hand-written
navigation markup:

```js
{
  id: "planner",
  label: "Planner",
  shortLabel: "PL",
  href: "#planner",
  group: "Planning",
  badge: "3",
  status: "ready",
  description: "Plan meals by day or week"
}
```

Dashboards with five or more routes must use at least two named groups. Short
labels are required for collapsed mode. Badges should be counts or states, not
secondary descriptions that make the rail noisy.

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

The proof is not complete unless the rendered DOM also shows:

- exactly one production shell candidate,
- one primary sidebar candidate,
- `data-sidebar-toggle` or an approved mobile drawer trigger,
- collapsed labels through `data-short`, `data-short-label`, or equivalent,
- a main content pane that owns desktop vertical scroll.

## Enforcement

The following checks must be part of Tier 3 validation:

- rendered audit checks for brand mark, grouped nav, active route, collapsed labels, footer/status, and mobile nav evidence;
- Tier 3 score includes operational navigation quality;
- package-native surface validation inspects source for the required sidebar contract;
- visual baseline capture includes desktop-expanded, desktop-collapsed, and mobile screenshots.
- local override scanning fails Tier 3 when a project maintains its own sidebar
  primitive or copied kit CSS instead of consuming the package.
