# Dashboard Production Proof Endpoints

Interactive dashboard login pages are not valid production proof. A screenshot baseline should prove that the live dashboard renders useful data, not that an auth wall exists.

Every production dashboard should expose a readonly proof endpoint for automated visual capture.

## Contract

Each registered dashboard in `hermes.dashboards.json` should declare:

```json
{
  "id": "khashi-vc.roc",
  "url": "https://roc.tlccapitalgroup.com/",
  "proofUrl": "https://roc.tlccapitalgroup.com/dashboard/proof",
  "proofAuth": {
    "type": "bearer-env",
    "env": "HERMES_DASHBOARD_PROOF_TOKEN"
  }
}
```

The proof endpoint should:

- Render the same live dashboard data used by the authenticated dashboard.
- Be readonly: no buttons that mutate production state.
- Hide secrets, credentials, tokens, private messages, and destructive controls.
- Show freshness, degraded states, and data-source failures.
- Load without interactive username/password fields.
- Accept a shared proof token through an `Authorization: Bearer ...` header or a project-specific token rule.
- Return an HTTP error for invalid/missing proof credentials.
- Be stable enough for screenshot comparison and design review.

## Supported Auth Types

The screenshot capture script supports:

| Type | Behavior |
| --- | --- |
| `bearer-env` | Reads the token from `env` and sends `Authorization: Bearer <token>`. |
| `query-token-env` | Reads the token from `env` and appends it as a query parameter. Default parameter is `proofToken`; override with `param`. |

Preferred:

```json
{
  "proofAuth": {
    "type": "bearer-env",
    "env": "HERMES_DASHBOARD_PROOF_TOKEN"
  }
}
```

## Capture Flow

Run:

```bash
npm run dashboard:production-proof:registry
npm run dashboard:production-proof:capture
npm run dashboard:production-proof:registry
npm run dashboard:maturity:report
npm run dashboard:world-class:report
```

For one dashboard:

```bash
npm run dashboard:production-proof:capture -- --id=khashi-vc.roc
```

Screenshots are stored in:

```text
docs/design/production-screenshots/
```

The proof registry is:

```text
docs/design/dashboard-production-proof-registry.json
```

## Status Meanings

| Status | Meaning |
| --- | --- |
| `baseline-present` | Screenshot exists and no auth wall or blank primary region was detected. |
| `captured-review-needed` | Screenshot exists, but the capture appears to show an auth wall or suspicious blank state. |
| `baseline-needed` | Screenshot could not be captured or does not exist. |

## Adoption Rule

Do not mark a dashboard world-class until:

- `proofUrl` is declared.
- proof auth is configured.
- screenshot capture uses the proof endpoint.
- screenshot status is `baseline-present`.
- visual quality and telemetry gates pass.

This is the long-term alternative to storing interactive credentials in screenshot tooling.
