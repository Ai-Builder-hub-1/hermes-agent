# UI Vocabulary v1

This vocabulary standardizes how Kaoshi/Hermes agents describe product interfaces before implementation. It is intentionally product-neutral: Kaoshi visual identity, tokens, and components remain the source of truth.

## Page Types

| Term | Definition | Use When | Avoid When | Mobbin Search Terms |
| --- | --- | --- | --- | --- |
| Dashboard | Summary page showing current status, key metrics, and next actions. | Users need quick orientation. | The main task is deep investigation or row-level operations. | executive dashboard, metrics overview |
| Analytics workspace | High-density analysis surface combining filters, charts, tables, and drill-down. | Analysts need compare/filter/investigate loops. | Users only need a final report. | analytics workspace, insights dashboard |
| Monitoring page | Live or near-live state page focused on alerts, health, and anomalies. | Operators need detect/respond workflows. | Data is historical and non-urgent. | monitoring dashboard, alert center |
| Command center | Operational control surface with status, queues, approvals, and guarded actions. | Users can start, stop, approve, deploy, or rollback. | The page is read-only. | command center, operations console |
| Master-detail page | List/grid plus focused detail or inspector region. | Users scan many records and inspect one. | The content is primarily narrative. | master detail, split view |
| Review queue | Prioritized list of items awaiting human approval or triage. | Decisions are repetitive and stateful. | Items do not require explicit disposition. | approval queue, moderation queue |
| Settings page | Configuration grouped by scope and risk. | Users edit preferences, credentials, integrations, or policies. | The task is exploratory analysis. | settings, admin configuration |

## Layout Terms

| Term | Definition | Notes |
| --- | --- | --- |
| Single-column layout | One main reading or editing column. | Best for docs, settings details, and narrow workflows. |
| Split view | Two persistent panes with related context. | Useful for master-detail and compare workflows. |
| Inspector panel | Secondary panel showing details, metadata, and row actions. | Should collapse on narrow screens. |
| Sticky command bar | Persistent action/filter region tied to page state. | Use for high-frequency operations. |
| Responsive grid | Grid that changes columns based on container space. | Prefer component-aware rules over page-only breakpoints. |

## Component Terms

| Term | Definition | Expected States |
| --- | --- | --- |
| KPI card | Compact metric plus trend/context. | loading, stale, empty, error |
| Metric ribbon | Horizontal group of KPI cards. | loading, partial data |
| Filter bar | Visible controls that change result scope. | dirty, applied, invalid |
| Filter drawer | Secondary filter surface for lower-frequency controls. | open, closed, applied, reset |
| Data grid | Table-like dense record surface. | loading, empty, sorted, filtered, selected |
| Detail panel | Focused content for a selected entity. | no selection, loading, error |
| Alert feed | Ordered stream of noteworthy events. | empty, unread, acknowledged |
| Empty state | Purposeful no-data state. | initial, zero-results, permission-restricted |

## Interaction Terms

| Term | Definition |
| --- | --- |
| Drill-down | Moving from summary to more specific supporting evidence. |
| Progressive disclosure | Hiding lower-priority detail until needed. |
| Bulk action | Operation applied to selected rows/items. |
| Cross-filtering | A selection in one visualization filters another surface. |
| Linked highlighting | Related data points highlight together without changing scope. |
| Optimistic update | UI updates before server confirmation with rollback behavior. |
| Confirmation flow | Guarded action sequence for destructive or production-affecting changes. |

## State Terms

| Term | Definition |
| --- | --- |
| Initial state | First load before data has been requested or selected. |
| Loading state | Data request in progress. |
| Skeleton state | Layout-preserving placeholder while loading. |
| Empty state | No data exists for the current scope. |
| Zero-results state | Filters/search removed all matching results. |
| Partial-data state | Some but not all expected data is available. |
| Stale-data state | Data is old enough to warn the operator. |
| Permission-restricted state | User cannot view or act because of role/policy. |

## Hierarchy Terms

| Term | Definition |
| --- | --- |
| Primary action | The action most aligned with the page's core task. |
| Secondary action | Useful but less frequent action. |
| Dominant metric | Metric that anchors the page's main decision. |
| Density | Amount of useful information visible without interaction. |
| Scannability | How quickly a user can find signal, anomalies, and next actions. |
