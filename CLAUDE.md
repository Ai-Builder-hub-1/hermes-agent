# Claude Project Guidance

Nous Hermes Agent is the design and dashboard standards hub for the workspace. When launched through `npm run claude`, Claude starts here and receives sibling project folders through `--add-dir`.

Use this repository's dashboard standards, validation scripts, Hermes Dashboard Kit, evidence reports, and fleet maturity tooling as the source of truth for design governance. When the user asks for design work in another project, first inspect that target project's files and `CLAUDE.md`, then apply the relevant standards from this hub.

Do not edit downstream projects from assumptions alone. Name the target project, inspect its package scripts and existing UI patterns, and use the hub's validation commands when they apply.

Use this project for design-focused frontend work with the same care you would bring to production code.

Before editing, inspect the existing app structure, design system, component patterns, routing, state management, and package scripts. Prefer existing helpers, components, icons, tokens, and CSS conventions over introducing new ones.

For design work:
- Build the actual usable screen or workflow first, not a landing page unless explicitly requested.
- Keep the interface polished, specific to the product, and free of generic AI-looking decoration.
- Preserve current behavior unless the requested design change clearly requires behavior changes.
- Make layouts responsive across desktop and mobile.
- Use stable dimensions for controls, grids, boards, media, and repeated UI so text and hover states do not shift the layout.
- Avoid nested cards, decorative gradient blobs, and one-color themes.
- Use icons for common actions where the app has an icon library.
- Check that text fits inside buttons, cards, toolbars, and compact panels.

Before finishing, run the relevant formatter, lint, tests, type checks, or build command when available. If this is visual work, run the app locally and inspect the result in desktop and mobile viewports.
