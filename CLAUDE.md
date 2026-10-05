## Visual freedom and production safeguards

The project owns its frontend design. `.hermes-dashboard.json` → `uiPolicy` is the
current acceptance policy and supersedes older mandatory HDK/tier/layout rules.
Claude may change the shell, navigation, colors, typography, CSS, component library,
and frontend framework. HDK remains optional; its adoption score is not release readiness.

Keep experiments in `prototypes/` or `design-prototypes/`, outside production
static roots and navigation. These are development-only, never proof of production
readiness. Promoting a prototype requires integrating its data and auth contracts.

Run `npm run dashboard:standard:check` for admission. Preserve backend authentication,
API/data semantics, action permissions, and functional tests. Before production use,
run `npm run dashboard:release:check`: it requires reviewed, current-revision evidence
for build, auth, API contracts, workflows, accessibility, desktop/mobile layout,
data states, prototype isolation, and production proof. Do not manufacture evidence
or treat an admission pass as release approval. Existing project tests/builds still apply.

Do not run shared-kit sync/migration to restore a previous design. Visual asset sync
is manual and requires an explicit project selection and `--apply-visual-sync`.
Legacy HDK checks are available as `dashboard:hdk:check` for optional kit adoption;
their component names, CSS hashes, or tiers do not govern a project-owned frontend.

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
