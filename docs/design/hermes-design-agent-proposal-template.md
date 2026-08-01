# Hermes Design Agent Proposal Template

Use this template before implementing or promoting any Hermes UI page, dashboard, or reusable pattern.

## 1. Classification

- Surface:
- Page or component name:
- Page type:
- Primary user:
- Primary task:
- Secondary tasks:
- Frequency of use:
- Data density:
- Permissions:
- Device and pane expectations:

## 2. Pattern Selection

- Recommended pattern:
- Why this pattern fits:
- When this pattern would be wrong:
- Related patterns considered:
- Existing route or component examples:

## 3. Information Hierarchy

1. Primary operating signal:
2. Required decisions:
3. Required actions:
4. Supporting evidence:
5. Secondary details:

## 4. Component Map

Existing components to reuse:

- `@hermes/dashboard-kit`:
- `@nous-research/ui`:
- Domain components:

New components requested:

| Component | Reuse case | Owner | Why existing components do not cover it |
|---|---|---|---|
|  |  |  |  |

## 5. State Map

| State | Required behavior | Component/pattern |
|---|---|---|
| Loading |  |  |
| Empty |  |  |
| Zero-results |  |  |
| Partial-data |  |  |
| Stale-data |  |  |
| Error |  |  |
| Permission-restricted |  |  |
| Mobile |  |  |

## 6. Data Contract

- API/source contract:
- UI model:
- Runtime schema:
- Transformation owner:
- Freshness SLA:
- Stale-data behavior:
- Cache/fetching strategy:
- Rerender or performance risks:

## 7. Responsive Proof

| Viewport or pane | Layout behavior | Risk |
|---|---|---|
| Large desktop |  |  |
| Collapsed desktop |  |  |
| Tablet |  |  |
| Mobile |  |  |
| Narrow embedded panel |  |  |

## 8. Accessibility

- Keyboard path:
- Focus behavior:
- Labels and semantics:
- Contrast considerations:
- Reduced-motion behavior:
- Table alternatives:
- Chart alternatives:
- Error announcements:

## 9. Mobbin References

Do not copy complete screens. Use references only for structural evidence.

| Reference | Pattern demonstrated | Adapt | Do not copy |
|---|---|---|---|
|  |  |  |  |

## 10. Implementation Handoff

- Files expected to change:
- Route metadata:
- Data modules:
- Tests or validators:
- Human approval points:
- Implementation risks:

Validation commands:

- `npm run dashboard:design-system:status`
- `npm run architecture:standards:validate`
- `npm run dashboard:governance:validate`
- `npm run dashboard:interface-system:validate`
- `npm run dashboard:recipe:score`
- `npm run dashboard:standards:summary:fast`
