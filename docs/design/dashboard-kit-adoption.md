# Dashboard Kit Adoption

Dashboard adoption is governed by the registry at
`packages/hermes-dashboard-kit/adoption/registry.json`.

Required commands:

- `npm run dashboard-kit:adoption:report`
- `npm run dashboard-kit:adoption:audit`
- `npm run dashboard-kit:adoption:audit:strict`
- `npm run dashboard:world-class:report`

The strict adoption gate is `dashboard-kit:adoption:audit:strict`. It should run
before promoting a Tier 3 dashboard and whenever a registered dashboard changes
shell, sidebar, chart, table, proof, or local CSS behavior.

Static adapters are migration bridges. Tier 3C completion requires
package-native imports from `@hermes/dashboard-kit`.
