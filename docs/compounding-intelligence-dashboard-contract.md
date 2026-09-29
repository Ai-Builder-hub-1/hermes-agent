# Compounding Intelligence Dashboard Contract

Status: implementation contract  
Owner surfaces: Nous Hermes dashboard, Hermes Brain API, source-project adapters  
Primary service: `hermes-brain`

## Purpose

The compounding-intelligence dashboard answers one operating question:

> Is our second brain improving future decisions across Nous Hermes, Investing System, Khashi VC, TLC Capital Group OS, and Hermes Brain itself?

It should not be a raw memory browser. It should show maturity, freshness, source coverage, retrieval readiness, review work, and warehouse durability.

## Hermes Brain Endpoints

Aggregate dashboard:

```text
GET /api/brain/compounding-intelligence
```

Active-work retrieval context:

```text
GET /api/brain/retrieval-pack?q=<query>&project=<project>&ticker=<ticker>&strategy=<strategy>&workflow=<workflow>
```

Operational proof:

```bash
npm run proof:compounding-intelligence
```

## Ten Dashboard Phases

1. Candidate intake
2. Promotion governance
3. Evidence grounding
4. Belief graph
5. Retrieval context
6. Contradiction review
7. Staleness and decay
8. Memory-to-action loop
9. Warehouse durability
10. Fleet coverage

Each phase must show `status`, `score`, `evidence`, `gaps`, and `nextActions`.

## Required Nous Panels

- Overall maturity score and status.
- Ten-phase readiness table.
- Source coverage for `nous-hermes`, `hermes-brain`, `investing-system`, `khashi-vc`, and `tlc-capital-group-os`.
- Operating cadence: stale nodes, pending candidates, contradiction edges, open actions, and latest warehouse sync.
- Retrieval readiness: active nodes, cited nodes, graph-linked nodes, and actionable nodes.
- Retrieval-pack preview for the current page/workflow.
- Open memory actions routed into the normal Nous work surfaces.

## Source Project Responsibilities

- Investing System exports thesis, valuation, financial-statement-analysis, risk, and decision candidates.
- Khashi VC exports trading blockers, strategy promotion/rejection, freshness incidents, and after-action lessons.
- Nous Hermes exports deployment, dashboard maturity, automation, cron, permission, and governance memories.
- TLC Capital Group OS exports portfolio strategy, KPI, business-unit, and operating-cadence memories.
- Hermes Brain exports policy, coverage, contradiction, staleness, and warehouse proof memories.

## Completion Gate

The dashboard is operational when a user can open Nous Hermes and answer:

- What phase is weakest?
- Which source project is not contributing memory?
- Which memories are stale, contradictory, or action-generating?
- Was the brain synced to the warehouse?
- What cited memories should inform the work I am about to do?
