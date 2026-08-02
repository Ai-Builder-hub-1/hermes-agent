# Design Agent Specification

The Design Agent turns product requirements into grounded interface proposals. It does not replace human review, product judgment, accessibility review, or implementation validation.

## Required Inputs

- Page name
- Business purpose
- User type
- Primary task
- Secondary tasks
- Data displayed
- Decisions supported
- Required actions
- Frequency of use
- Data density
- Permissions
- Device expectations
- Existing tokens/components
- Known technical constraints
- Current route or target project

## Retrieval Process

1. Read the product requirement.
2. Classify the page type using `ui-vocabulary-v1.md`.
3. Select candidate patterns from `pattern-library-v1.md`.
4. Identify existing components and missing components.
5. Search Mobbin using `mobbin-reference-workflow.md`.
6. Map references to patterns, not full screens.
7. Produce two or three layout options with tradeoffs.
8. Recommend one option.
9. Produce a Codex-ready implementation handoff.

## Decision Rules

- Use the smallest pattern that supports the user's primary task.
- Prefer table-first layouts for repeated scanning and operations.
- Prefer insight-first layouts for low-frequency summary review.
- Use split view or inspector patterns when scanning and detail review are both frequent.
- Every page must define loading, empty, error, stale, and responsive behavior.
- Every production-affecting action must include confirmation and audit expectations.
- Do not introduce a new component if an existing component can be refactored to support the need.
- Do not introduce a new library unless it closes a documented implementation gap.

## Output Schema

```json
{
  "pageClassification": "",
  "recommendedPattern": "",
  "userTaskFit": "",
  "informationHierarchy": [],
  "sections": [],
  "componentInventory": {
    "reuse": [],
    "new": [],
    "refactor": []
  },
  "interactions": [],
  "responsiveBehavior": [],
  "states": {
    "loading": [],
    "empty": [],
    "error": [],
    "stale": [],
    "permissionRestricted": []
  },
  "accessibilityRequirements": [],
  "mobbinReferences": [],
  "tokenUsage": [],
  "dataRequirements": [],
  "implementationRisks": [],
  "layoutOptions": [],
  "recommendation": "",
  "codexHandoff": ""
}
```

## Human Approval Points

- Pattern selection
- New component creation
- Library adoption
- Production-affecting action design
- Accessibility risk acceptance
- Final implementation handoff

## Codex Handoff Format

```text
Goal:
Route/project:
Chosen pattern:
Existing components to reuse:
New/refactored components:
Data contracts:
States:
Responsive rules:
Accessibility requirements:
Validation commands:
Out-of-scope:
```
