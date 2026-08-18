# Dashboard Certification Standard

Status: active  
Owner: Nous Hermes Agent  
Applies to: every TLC dashboard project, regardless of whether changes are made by Codex, Hermes OS, DeepSeek, another agent, or a human.

## Purpose

The certification gate prevents dashboards from reaching commit/deploy with declared compliance that is not proven by implementation. A dashboard is not Tier 3C because it has hidden markers, copied CSS, or a manifest claim. It is Tier 3C only when the operator route is package-native, rendered correctly, visually proven, interaction-tested, data-honest, and free of unapproved local visual primitives.

## Required Flow

```
project change
  -> npm run dashboard:certify
  -> repair packet if needed
  -> npm run dashboard:certify:strict
  -> commit/deploy only after certification
  -> production proof verification
```

## Layers

1. central-certification-layer
2. rendered-dom-anatomy-validator
3. hidden-marker-ban
4. component-native-proof
5. static-route-retirement
6. css-override-budget
7. visual-proof-standard
8. screenshot-aware-quality-gate
9. visual-regression-baselines
10. workflow-interaction-tests
11. data-ux-contracts
12. chart-contract-enforcement
13. self-healing-promotion-supervisor
14. failure-classifier
15. repair-playbooks
16. promotion-state-machine
17. attempt-ledger
18. tool-agnostic-integration
19. fleet-enforcement-registry
20. tier-claim-approval-gate

## Promotion State Machine

- pending
- preflight
- certifying
- repair-needed
- repairing
- certified
- committed
- deployed
- production-verifying
- verified
- blocked
- rolled-back

## Blocking Rules

- T3C cannot be claimed by static, compatibility, runtime-bridge, or server-rendered local UI routes.
- Hidden `data-hdk-component` or `data-component` markers do not count as rendered component proof.
- A dashboard shell must have one primary shell, one primary sidebar, one global header region, and one main scroll pane.
- Compatibility routes can remain temporarily only as dev-review, redirect, or historical proof routes.
- Project-local visual primitives require an expiring exception and cannot be the primary layout/component system.
- Proof must include screenshots and workflow interaction evidence when shell, chart, table, drawer, form, or major layout behavior changes.

## Tool-Agnostic Rule

Every build surface must call this certification layer. The editor or agent does not matter. Codex, Hermes OS, DeepSeek, CLI scripts, and human commits all use the same Nous Hermes gate.
