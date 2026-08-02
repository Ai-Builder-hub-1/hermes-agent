# Product Architecture AI Instruction Pack

Status: generated baseline  
Owner: Nous Hermes Agent  
Source: `experience-audit/product-architecture-standards-registry.yaml`

## Required Agent Protocol

Before modifying product, dashboard, design-system, backend, data, or deployment code, the agent must:

1. Inspect relevant repository evidence.
2. State what is observed, inferred, proposed, and unknown when the work depends on architecture assumptions.
3. Identify applicable standards, owners, contracts, routes, data sources, states, permissions, errors, accessibility requirements, performance budgets, telemetry, tests, migration, and rollback.
4. Prefer approved components, contracts, and patterns from `@hermes/dashboard-kit`.
5. Avoid introducing new shared dependencies, patterns, stores, clients, primitives, permissions, or shells without an ADR or explicit user authorization.
6. Generate evidence after the change: validation commands, screenshots/proof routes where applicable, and a concise summary of remaining risk.

## Prohibited Agent Behavior

- Do not ship a standalone prototype as production UI.
- Do not create a second app shell inside an existing dashboard.
- Do not claim live or real data when the surface is using mock, preview, stale, partial, or unknown data.
- Do not leave visual-only controls in a production route.
- Do not load visual-selection tooling in production.
- Do not mark a gap closed without evidence.
- Do not invent private company practices or undocumented source claims.

## Minimum Preflight For Dashboard Work

- Canonical route exists.
- Shell model is declared.
- Surface owner and reviewer are declared.
- Dashboard recipe is selected.
- Data/experience contract exists or has an unexpired exception.
- Freshness class and stale threshold exist for decision-critical data.
- Tables define pagination or virtualization behavior.
- Charts define data contract, empty/stale/error state, and accessible fallback.
- Proof route exists or has an unexpired exception.

## Minimum Postflight For Dashboard Work

- `npm run dashboard:governance:validate`
- applicable project adoption audit
- applicable dashboard architecture validator
- screenshot or proof evidence when route behavior changed
- gap register updated if work exposed new limitations
