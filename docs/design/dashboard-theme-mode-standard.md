# Dashboard Theme Mode Standard

This is the required light/dark/system theme contract for Hermes/TLC dashboards.
It is Mobbin-informed but implemented as original Hermes design-system rules.

## Reference Inputs

Reference screens inspected for this standard:

- [Vapi dark dashboard](https://mobbin.com/screens/1bd5c747-466a-4a3e-9b8c-5aab2b05cfbc)
- [Mixpanel dark analytics](https://mobbin.com/screens/1a7d8d86-f0e8-456a-a60c-65c6eb13a252)
- [Basedash dark data product](https://mobbin.com/screens/190a82d9-8013-45c6-b768-5cc7d0cc2a7b)
- [Mixpanel light analytics](https://mobbin.com/screens/10d76bb3-6f65-4805-ad42-30ee24ec78e2)
- [Whop light dashboard](https://mobbin.com/screens/461965db-524a-42ea-93db-d0a3b28c588c)
- [Framer light product dashboard](https://mobbin.com/screens/27a96864-839c-45f8-b1f4-479672827122)

The recurring lesson is not a specific palette. The lesson is discipline:
one shell-level theme, semantic surfaces, readable contrast, chart-specific
tokens, and no local components inventing their own dark or light mode.

## Theme Modes

Every governed dashboard must declare one of:

- `data-theme="light"`
- `data-theme="dark"`
- `data-theme="system"`

`system` is a preference mode. Before validation, it must resolve to a visible
light or dark token set through CSS variables.

## Required Token Contract

The dashboard kit exposes these canonical tokens:

| Area | Required tokens |
| --- | --- |
| Surfaces | `--hdk-bg`, `--hdk-card`, `--hdk-card-muted`, `--hdk-panel-strong`, `--hdk-inset` |
| Text | `--hdk-text`, `--hdk-text-secondary`, `--hdk-muted`, `--hdk-inverse` |
| Borders/focus | `--hdk-border`, `--hdk-border-strong`, `--hdk-focus` |
| Charts | `--hdk-chart-axis`, `--hdk-chart-grid`, `--hdk-chart-tooltip-bg`, `--hdk-chart-tooltip-text`, `--hdk-chart-series-primary`, `--hdk-chart-series-secondary`, `--hdk-chart-series-tertiary` |
| Status | `--hdk-success`, `--hdk-success-soft`, `--hdk-warning`, `--hdk-warning-soft`, `--hdk-critical`, `--hdk-critical-soft`, `--hdk-info`, `--hdk-info-soft` |
| Material | `--hdk-shadow-rgb`, `--hdk-radius`, `--hdk-font` |

Compatibility aliases such as `--hdk-background`, `--hdk-foreground`, and
project-level `--background` may exist, but production components should render
through the canonical `--hdk-*` token layer.

## Light Mode Rules

- The page, shell, sidebar, cards, tables, forms, charts, drawers, and tooltips
  must inherit the same light token set from the shell.
- Dark panels inside light mode are allowed only for intentional inverse panels
  using `--hdk-panel-strong` plus `--hdk-inverse`.
- Do not use random dark cards, black table headers, black chart tooltips, or
  status pills unless those colors come from the token contract.
- Chart axes, grid lines, legends, and tooltips must use chart tokens.

## Dark Mode Rules

- The page, shell, sidebar, cards, tables, forms, charts, drawers, and tooltips
  must inherit the same dark token set from the shell.
- Light cards inside dark mode are not allowed unless the component is explicitly
  an inverse/evidence/export surface and passes contrast.
- Do not use light-mode pastel status fills in dark mode. Use the dark status
  soft tokens.
- Chart axes and grid lines must remain visible without becoming bright dividers.

## Contrast Contract

The minimum contrast target is:

- Body and normal UI text: `4.5:1`
- Large display text and major numerals: `3:1`

The following token pairs must pass contrast checks in every theme mode:

- `surfacePage` with `textPrimary`
- `surfacePanel` with `textPrimary`
- `surfacePanelStrong` with `textInverse`
- `surfaceInset` with `textSecondary`
- `chartTooltipBg` with `chartTooltipText`
- `statusSuccessSoft` with `statusSuccess`
- `statusWarningSoft` with `statusWarning`
- `statusErrorSoft` with `statusError`
- `statusInfoSoft` with `statusInfo`

## Component Contract

These components must never hardcode light/dark colors outside token definitions:

- shell/sidebar/header
- cards/panels/banners
- tables/tabs/forms
- drawers/modals
- chart panels, chart SVGs, tooltips, legends, axes, grids
- status pills and alerts
- command bars and buttons

If a project needs a unique brand skin, it must create a theme profile and map
that profile to the canonical tokens. It must not create parallel local tokens
that only one dashboard understands.

## Visual QA Requirement

Tier 3 dashboard review should capture:

- light mode desktop
- dark mode desktop
- collapsed sidebar or mobile mode in whichever mode is the product default

Screenshots should be rejected when:

- dark surfaces contain dark text
- light surfaces contain light text
- chart axes or legends disappear
- table headers use the wrong mode
- local components introduce a second theme system
- visual selector/debug UI appears in production
