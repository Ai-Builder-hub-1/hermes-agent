# Rendered Fleet Certification Standard

Status: active  
Owner: Nous Hermes Agent  
Applies to: every TLC dashboard project

## Purpose

HDK adoption is no longer satisfied by a dependency, copied CSS, static adapter, hidden marker, or manifest claim. A dashboard must prove that the rendered operator route visibly uses the HDK shell, sidebar, header, page rhythm, cards, table/chart surfaces, state/data components, and responsive behavior.

## Required Commands

Run source certification:

```bash
npm run dashboard:certify
```

Run rendered browser certification against live local dashboards:

```bash
npm run dashboard:certify:rendered
```

Run both:

```bash
npm run dashboard:fleet:certify
```

Generate the pre-repair readiness artifacts after rendered proof:

```bash
npm run dashboard:pre-repair:readiness
```

Run the strict deploy-blocking version:

```bash
npm run dashboard:fleet:certify:strict
```

Authenticated local routes can be certified by setting either a fleet-wide local password:

```bash
DASHBOARD_AUTH_PASSWORD=local-password npm run dashboard:certify:rendered
```

or a dashboard-specific password:

```bash
DASHBOARD_AUTH_PASSWORD_INVESTING_SYSTEM_ROC=local-password npm run dashboard:certify:rendered -- --id investing-system.roc
```

Bearer proof routes use the dashboard registry `proofAuth.env` value when that environment variable is present.

## What The Rendered Gate Checks

- The route is reachable in a real browser.
- The visible page has one HDK dashboard shell.
- The visible page has an HDK sidebar.
- The visible page has an HDK main/page frame.
- The visible page has an HDK header or command header.
- Visible cards use HDK card surfaces instead of local card/panel classes dominating the page.
- Tables render inside a card/table surface.
- Hidden `data-hdk-component` or `data-component` markers are blocked.
- Horizontal overflow is blocked.
- Primary dashboard titles cannot be squeezed into vertical/letter-stacked columns.
- Desktop sidebar/navigation geometry must look like an approved rail, sidebar, or top command bar; giant stacked content-width nav buttons do not count.
- Primary content cannot start below the first viewport because the shell/nav consumed the screen.
- Excess nested scroll containers are flagged because they usually mean shell containment is broken.
- Mobile sidebars cannot cover the full screen unless intentionally open.
- HDK CSS variables must be present.
- State/data/chart/table/proof markers must be visible enough to prove the route is not just a shell.
- The route inventory includes the canonical route, proof route, and known high-value operator routes.
- The interaction inventory checks that sidebars expose navigation controls and data surfaces expose tabs, filters, dropdowns, or comparable exploration controls.
- The component coverage inventory records visible HDK component families and hidden marker usage for every desktop and mobile capture.

## Why This Exists

The fleet had a false-native enforcement gap: projects could declare `package-native` and pass marker checks while still visually rendering as local static/server HTML. The rendered certification report is the first proof layer that inspects what the user actually sees.

## Output

The rendered gate writes:

- `docs/design/rendered-fleet-certification/report.json`
- `docs/design/rendered-fleet-certification/report.md`
- `docs/design/rendered-fleet-certification/repair-packets.json`
- `docs/design/rendered-fleet-certification/repair-packets.md`
- `docs/design/dashboard-canonical-route-inventory.json`
- `docs/design/dashboard-visual-baseline-reference-registry.json`
- `docs/design/dashboard-pre-repair-readiness.json`
- Desktop and mobile screenshots for each reachable dashboard

The repair packets are the required dashboard work queue. A blocked dashboard must name the exact rendered blockers, route findings, screenshots, repair actions, and rerun commands before project-side redesign work starts.

## Local URL Overrides

If a project is running on a different local port, set:

```bash
DASHBOARD_LOCAL_URL_<DASHBOARD_ID>=http://localhost:PORT/path
```

Use uppercase and replace punctuation with underscores. Example:

```bash
DASHBOARD_LOCAL_URL_MEDIA_BUSINESS_OPERATIONS_MAIN=http://localhost:4101/dashboard
```

## Promotion Rule

A dashboard is not certified until both source certification and rendered certification pass. If a project needs a component the kit does not have, the component should be added to `@hermes/dashboard-kit` first, then the project should migrate to it.

## Pre-Redesign Readiness

Before starting visual redesign in an individual project, the fleet gate must have:

- A canonical route inventory that names every operator-critical route.
- A visual baseline reference registry for shell/sidebar, spacing, cards, tables, charts, auth/session, sidecars, state feedback, and proof surfaces.
- A reachable proof route or explicit auth configuration.
- Desktop and mobile screenshots.
- Route inventory for the important operator surfaces.
- Interaction inventory for sidebars, tabs, filters, drawers, and primary commands.
- Component coverage for the visible HDK families on the route.
- A repair packet that explains exactly what must change and how to re-run proof.

This keeps “make it look better” from becoming a loose manual pass. The fleet standard produces the checklist first, then the project work follows it.

The pre-repair readiness gate does not mean the dashboard already passes. It means we have enough route, screenshot, interaction, component coverage, baseline, and repair packet evidence to safely start fixing that dashboard without guessing.
