# Fleet Credential Status

Generated: 2026-09-10T02:51:12.786Z

Mode: production-proof

Secret policy: values_never_read_or_returned

## Project Status

| Project | Credential | Status | Variables | Blockers |
| --- | --- | --- | --- | --- |
| investing-system | binance.trading-api | ready | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) | none |
| khashi-vc | binance.trading-api | ready | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) | none |

## Production Containers

| Project | Container | Available | Health | Variables |
| --- | --- | --- | --- | --- |
| investing-system | deploy-investing-system-1 | available | healthy | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) |
| investing-system | deploy-oanda-practice-runtime-1 | available | none | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) |
| khashi-vc | deploy-khashi-1 | available | none | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) |
| khashi-vc | deploy-khashi-scheduler-1 | available | none | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) |
| khashi-vc | deploy-khashi-sync-worker-1 | available | none | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) |
| khashi-vc | deploy-khashi-poll-worker-1 | available | none | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) |
| khashi-vc | deploy-khashi-stream-worker-1 | available | none | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) |
| khashi-vc | deploy-khashi-maintenance-worker-1 | available | none | BINANCE_API_KEY: set (64)<br>BINANCE_SECRET_KEY: set (64) |

## Frontend Rule

Render configured/missing status, source, last verified time, and optional value length. Never render credential values or ask the operator to paste secrets into chat.
