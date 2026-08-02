# Product Architecture System Handbook

Status: V1 governed baseline  
Owner: Nous Hermes Agent  
Source register: `experience-audit/standards-source-register.yaml`  
Rule registry: `experience-audit/product-architecture-standards-registry.yaml`

## Purpose

The Product Architecture System exists so dashboard and product work does not depend on memory, taste, or local reinvention. It defines the controls that constrain product, design, frontend, backend, data, security, reliability, AI-assisted engineering, and governance.

## Evidence Classes

- `N` Normative external: published standard with testable requirements.
- `P` Public practice: public guidance from an engineering or design organization.
- `S` Internal synthesis: project-specific rule assembled from evidence and tradeoffs.
- `O` Observed current state: direct repository or runtime evidence.
- `U` Unknown: not inspectable or insufficiently evidenced.

## Control Map

| Class | Required Output | Primary Enforcement |
| --- | --- | --- |
| Principles | ordered tradeoff rules and ownership | ADR/review references |
| Foundations | tokens, color, type, spacing, motion, icons | token lint, contrast checks |
| Interface System | primitives, components, patterns, templates, visualizations | package boundaries, stories, tests |
| Product/Domain | domain map, ownership, dependency direction | dependency graph and contracts |
| Information/Composition | navigation, routes, shell, pages, overlays | route manifests and shell checks |
| State | state ownership and source-of-truth policy | state matrix and tests |
| Data/API | schema, freshness, provenance, pagination, errors | contract tests and data-quality checks |
| Interaction/Errors | loading, partial failure, jobs, undo, notifications | interaction/fault tests |
| Responsive | adaptive behavior by archetype | viewport and container tests |
| Accessibility | WCAG target, keyboard, focus, names, fallbacks | a11y tests and manual review |
| Performance/Reliability | budgets, SLOs, degradation, rollback | runtime telemetry and launch checks |
| Security/Privacy | ASVS/SSDF mapping, authz, secrets, retention | security review and scans |
| Observability | traces, metrics, logs, correlation IDs | telemetry report and proof capture |
| AI Engineering | agent constraints and evidence protocol | AI instruction pack and review |
| Quality/Review | tests, screenshots, release evidence | CI and review checklist |
| Governance/Lifecycle | ADRs, exceptions, versions, deprecations | registry and expiry checks |
| Enforcement | schemas, linters, validators, drift detection | local and CI validators |

## Non-Negotiable Rules

The detailed machine-readable registry is the source of truth, but these are the rules most likely to prevent the failures we just saw:

- `SHELL-001`: production dashboards get one app shell, not an outer shell and inner shell.
- `PROTO-001`: prototypes must be decomposed before promotion to production.
- `DATA-001`: decision-critical metrics declare source, unit, freshness, null behavior, and owner.
- `SEC-001`: proof routes are readonly and token-protected.
- `AI-ENG-001`: AI agents inspect evidence before making changes and cannot silently introduce new shared patterns.
- `ENF-001`: every MUST rule needs at least one verification mechanism.

## Definition Of Done For A Standard

Every standard must include:

- ID and version
- scope and exclusions
- rationale
- normative rules
- examples and anti-patterns
- adjacency to other standards
- verification method
- owner and reviewer
- exception process
- migration guidance
- health telemetry or review cadence

## Build Stretch Sequence

1. Discovery and freeze.
2. Principles, vocabulary, and ownership.
3. Foundations and interface contracts.
4. State, routing, data, and permissions.
5. Loading, errors, and long-running work.
6. Responsive, visualization, and performance.
7. Security and supply chain.
8. Reliability and operations.
9. AI enforcement and scaled migration.

V7 dashboard adoption should use this sequence. We should not jump from a prototype directly to production UI without passing the route, data, state, proof, and quality gates.
