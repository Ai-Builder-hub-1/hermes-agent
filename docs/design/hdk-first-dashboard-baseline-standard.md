# HDK-First Dashboard Baseline Standard

Every new dashboard project must start HDK-first. This means the first
production dashboard surface is package-native and governed by
`@hermes/dashboard-kit` before project-specific UI is added.

## Required Baseline

New dashboard projects must include:

- `@hermes/dashboard-kit`
- `DashboardShell`
- `DashboardSidebar`
- `DashboardHeader`
- HDK theme tokens
- HDK spacing tokens
- HDK card, table, chart, state, and proof contracts
- HDK-compatible auth/session placement
- Playwright proof capture
- `hermes.dashboards.json`
- `.hermes-dashboard.json`
- Mobbin/reference intake
- design review checklist

Custom components are allowed only inside HDK shell/layout slots and must use
HDK tokens, sizing, state, and proof contracts. A custom component cannot
replace the shell, sidebar, theme, spacing, auth placement, or proof layer.

## Required Manifest Contract

`.hermes-dashboard.json` must declare:

```json
{
  "dashboardKit": {
    "baseline": "hdk-first",
    "package": "@hermes/dashboard-kit",
    "adoptionMode": "package-native",
    "implementationMode": "package-native",
    "packageNativeRequired": true,
    "staticAdapterAllowed": false,
    "customComponentsPolicy": "allowed-only-inside-hdk-shell-and-token-contracts",
    "shell": "hdk",
    "sidebar": "hdk",
    "header": "hdk",
    "theme": "hdk",
    "spacing": "hdk",
    "auth": "hdk-compatible"
  },
  "enforcement": {
    "localScripts": ["hdk:check", "hdk:proof", "hdk:visual"],
    "creationGate": "hdk:check",
    "deployGate": "hdk:check",
    "exceptionsRequireExpiry": true
  }
}
```

## Required Local Scripts

Every new dashboard project must expose:

```json
{
  "scripts": {
    "hdk:check": "node ../nous-hermes-agent/scripts/enforce-dashboard-creation-gate.mjs --project-dir .",
    "hdk:proof": "npm run test && npm run proof:screenshots",
    "hdk:visual": "npm run proof:screenshots"
  }
}
```

Projects may add stricter local checks, but these commands must exist so any
tooling layer can validate the project without knowing its custom build system.

## Creation Gate

Before a dashboard project is accepted, run:

```bash
npm run dashboard:creation-gate -- --project-dir ../project-name
```

The gate fails if the project:

- omits `@hermes/dashboard-kit`
- omits the baseline manifest contract
- omits `hdk:check`, `hdk:proof`, or `hdk:visual`
- omits a canonical package-native dashboard registry entry
- omits Mobbin/reference intake or design review paths
- omits Playwright proof configuration
- declares non-expiring exceptions
- ships a standalone static dashboard shell as the primary implementation

## Fleet Gate

Before visual promotion or deploy, run:

```bash
npm run dashboard:hdk-first:audit
```

Strict promotion should use:

```bash
npm run dashboard:hdk-first:audit:strict
```

The fleet audit checks dependency, manifest, local implementation markers,
static route debt, production delivery, and HDK token/CSS exposure.

## Completion Rule

A dashboard is not Tier 3 complete because the kit is installed. It is Tier 3
complete only when the production route is HDK-first by implementation, proof
passes, and project-specific components remain inside HDK contracts.
