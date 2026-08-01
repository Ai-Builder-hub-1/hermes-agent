# Product Architecture Standards Current Assessment

Status: evidence baseline  
Owner: Nous Hermes Agent  
Source handoff: `/Users/hq/Downloads/Product_Architecture_Standards_Audit_and_Build_Handoff.docx`  
Generated: 2026-07-31

## Purpose

This assessment turns the Product Architecture Standards handoff into an evidence-backed operating baseline for dashboard and product architecture work. It does not claim final maturity. It records what is observed, inferred, proposed, and unknown so implementation can proceed through governed stretches rather than one-off dashboard fixes.

## Evidence Boundary

- OBSERVED: the repository contains a shared dashboard kit, governance gates, adoption registry, Kashi experience contracts, validation scripts, proof registry, and production screenshot artifacts.
- OBSERVED: the Kashi work exposed a real architecture gap: a standalone live command surface could appear inside another app shell, creating an outer-shell/inner-shell experience.
- OBSERVED: V6 governance now includes a single-shell route model, proof route requirement, dashboard recipe requirement, exceptions, owners, reviewers, and local validation.
- INFERRED: the same shell, route, data freshness, and visual-quality risks will recur in Media Engine, Hermes OS, TLC OS, and other dashboards unless adoption is enforced centrally.
- PROPOSED: the handoff should become the controlling architecture rubric for V7 adoption and later dashboard migrations.
- UNKNOWN: production runtime behavior for every downstream dashboard cannot be fully certified without current proof captures, auth-safe read-only routes, screenshots, and telemetry.

## First Outputs Required By The Handoff

| Output | Current Evidence | Status |
| --- | --- | --- |
| Repository and runtime evidence index | `experience-audit/repository-map.yaml`, `experience-audit/evidence-ledger.yaml` | Present, needs downstream expansion |
| Current architecture map | `experience-audit/repository-map.yaml`, `experience-audit/dependency-graph.yaml`, `experience-audit/surfaces.yaml` | Present |
| Six vertical feature traces | `experience-audit/feature-traces.yaml` | Present |
| Standards maturity matrix | `experience-audit/standards-maturity.yaml` | Present |
| Gap register and dependency graph | `experience-audit/gaps.yaml`, `docs/design/kaoshi-experience-architecture-gap-register.json`, `experience-audit/dependency-graph.yaml` | Present, needs Product Architecture System gaps added during V7 |
| Recommended first build stretch | This document and `docs/design/kaoshi-experience-architecture-build-plan.md` | Present |
| Standards source register | `experience-audit/standards-source-register.yaml` | Present |
| Product Architecture System handbook | `docs/design/product-architecture-system-handbook.md` | Present |
| Machine-readable standards registry | `experience-audit/product-architecture-standards-registry.yaml` | Present |
| Adoption and migration system | `experience-audit/product-architecture-adoption-plan.yaml` | Present |
| AI instruction pack | `docs/design/product-architecture-ai-instruction-pack.md` | Present |
| Architecture health dashboard contract | `experience-audit/architecture-health-dashboard.yaml` | Present |
| Enforcement validator | `scripts/validate-product-architecture-system.mjs` | Present |

## Current Architecture Map

The dashboard architecture is split across four layers:

1. Governance and standards: `docs/design/dashboard-governance-and-enforcement.md`, `docs/design/dashboard-admission-rfc-template.md`, `experience-audit/governance-gates.yaml`.
2. Shared implementation: `packages/hermes-dashboard-kit`.
3. Evidence and audit registries: `experience-audit/`, `docs/design/dashboard-production-proof-registry.json`, `packages/hermes-dashboard-kit/adoption/registry.json`.
4. Downstream product surfaces: Kashi VC, Media Engine, Hermes OS, TLC Capital Group OS, and related dashboards consume the shared standards through contracts, adapters, proof routes, and migration reports.

## Standards Maturity Summary

The central system is materially stronger than before because it now has package-level implementation, manifest-based governance, validators, adoption scans, proof registry, and a Kashi reference surface.

It is not complete. Most classes sit around maturity level 2 or 3:

- Level 2 where standards are documented but not fully verified across every project.
- Level 3 where shared implementation or validation exists centrally.
- Target level 4 for V7 is enforced adoption across priority dashboards.
- Target level 5 comes later when health, drift, exceptions, runtime outcomes, and telemetry are measured continuously.

The detailed maturity matrix lives in `experience-audit/standards-maturity.yaml`.

## Primary Gaps

| Gap | Class | Why It Matters | Next Control |
| --- | --- | --- | --- |
| Shell drift | Information/composition | Users can land in an app inside another app. | Enforce one canonical shell per product route. |
| Prototype promotion drift | Governance/lifecycle | Standalone prototypes can become production by accident. | Require decomposition into shell, page content, components, and route config. |
| Visual quality drift | Interface/foundations | Dashboards can comply structurally while still looking generic. | Require visual-quality targets, screenshots, and package-native chart components. |
| Data freshness ambiguity | Data/API/state | Operators cannot tell if a chart is live, stale, partial, mock, or empty. | Require freshness class, stale threshold, last-updated text, and state rendering. |
| Proof gaps | Quality/enforcement | Codex cannot verify production without human login or screenshots. | Expand readonly proof routes and screenshot capture. |
| AI drift | AI-assisted engineering | AI agents can introduce new local patterns without knowing the standard. | Generate AI instruction packs from registries and fail prohibited patterns. |
| Downstream unevenness | Governance/adoption | Kashi can improve while Media Engine or Hermes OS remain inconsistent. | V7 priority migration by project cluster. |

## Recommended First Build Stretch

The next build stretch should be V7 broad adoption, but it should not start as a visual redesign sprint. It should start as a governed migration sprint:

1. Pick one downstream surface at a time.
2. Confirm its canonical route and one-shell model.
3. Write or update its experience/data contract.
4. Map it to a dashboard recipe.
5. Wire package-native kit components.
6. Add proof route or explicit exception.
7. Capture screenshot evidence.
8. Run adoption and governance checks.

For Kashi VC, this means the unified production shell should own the route, and the live market intelligence content should become page content inside that shell rather than a nested standalone dashboard.

## Acceptance For This Assessment

- The handoff has been accessed and summarized without product implementation.
- Current standards artifacts are mapped to the handoff’s required first outputs.
- Six vertical traces are present.
- Standards maturity is recorded in machine-readable form.
- Remaining gaps are explicit enough to drive the next build stretch.
