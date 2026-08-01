# Kaoshi Experience Contract Standard

Status: V2 complete baseline
Owner: Nous Hermes Agent / Hermes Dashboard Kit

## Purpose

Every reusable dashboard component, visualization, and production surface must carry an experience contract before it is treated as Kaoshi-grade. A contract prevents the same failure from repeating across projects: a screen can look presentable while still being unclear about the user decision, data freshness, missing states, accessibility, permissions, telemetry, and proof.

## Required Contract Families

| Family | Required Questions |
| --- | --- |
| Purpose | What user problem does this solve? What decision or action does it support? Who is the audience? When is this component allowed or prohibited? |
| Data | What schema, units, provenance, nullability, uncertainty, transformations, and version compatibility does it require? |
| State | What happens during initial, loading, partial, empty, success, refreshing, stale, offline, unauthorized, unavailable, and error states? |
| Interaction | What pointer, touch, keyboard, selection, drilldown, zoom, filter, reset, undo, confirmation, and agent-execution behaviors exist? |
| Freshness | Is the data static, manual, periodic, near-live, live, historical, forecast, or unknown? What is stale? What retries? |
| Responsive | What changes across desktop, laptop, tablet, mobile, embedded panel, print/export, and density settings? |
| Accessibility | What names, roles, focus paths, keyboard paths, contrast, reduced motion, and equivalent table/text outputs exist? |
| Performance | What load budget, render budget, data-volume threshold, virtualization, aggregation, and low-power fallback applies? |
| Security | What visibility, field masking, permissions, audit logging, and sensitive data handling applies? |
| Observability | What events, timings, refresh failures, stale duration, interaction completion, errors, and owner alerts are emitted? |
| Quality | What unit, integration, E2E, visual regression, accessibility, performance, and contract tests prove it? |
| Governance | Who owns it? What is its status, version, migration path, deprecation rule, approved library set, and exception process? |

## Standard States

Use this vocabulary everywhere:

- `initial`
- `loading`
- `partial`
- `empty`
- `success`
- `refreshing`
- `stale`
- `offline`
- `unauthorized`
- `unavailable`
- `error`

Do not invent local synonyms in contracts. UI copy can be friendlier, but the exported contract should remain normalized.

## Freshness Classes

| Class | Meaning | Typical Stale Threshold |
| --- | --- | --- |
| `static` | Rarely changes and is bundled or manually published | none |
| `manual` | Human-maintained file or upload | declared by owner |
| `periodic` | Batch update on a schedule | 2x schedule interval |
| `near-live` | Frequent polling, usually under five minutes | 2x poll interval |
| `live` | High-frequency polling or streaming | 2-3x poll interval |
| `historical` | Archived observations | source-specific |
| `forecast` | Projection or model output | model-specific |
| `unknown` | Freshness cannot be trusted yet | always watch/degraded |

## Admission Rules

A new dashboard surface can be started when:

- [ ] its primary user decision is named
- [ ] its workspace is mapped to Command, Operations, Intelligence, Capacity, Projects, or Controls
- [ ] its canonical route is declared
- [ ] its shell model is declared as `single-shell`, `standalone-dev-only`, or `compatibility-route`
- [ ] production navigation cannot enter a nested app shell
- [ ] each data source has owner, endpoint/file, freshness, and failure mode
- [ ] production/prototype/mock data states are visually distinct
- [ ] table-like content has pagination, virtualization, or an explicit small-data guarantee
- [ ] charts have an approved visualization intent
- [ ] proof route expectations are known

A reusable component can be promoted to the kit when:

- [ ] two or more dashboards need it, or one critical dashboard depends on it
- [ ] the contract families above are filled
- [ ] accessible fallback is defined
- [ ] state rendering exists for loading, empty, stale, and error
- [ ] adoption and migration notes exist

## Machine-Readable Source

The executable baseline lives in:

- `experience-audit/experience-contract.schema.json`
- `experience-audit/experience-contracts.yaml`

Validate with:

```bash
npm run dashboard:kaoshi:validate
```
