# Monitoring

## Error monitoring (Sentry)

### Backend
Set `SENTRY_DSN` in backend environment. Flask integration is initialized in `app.py`.

### Frontend
Set `VITE_SENTRY_DSN`. Soft-loads `@sentry/react` when available (`src/lib/sentry.ts`).

## What to monitor

| Signal | Source |
|--------|--------|
| Frontend exceptions | Sentry browser / ErrorBoundary |
| Backend exceptions | Sentry Flask + `logs/error.log` |
| API latency / 5xx | Hosting metrics + request logs |
| Auth failures | `logs/app.log` / audit trails |
| Rate limit spikes | 429 responses |

## Health endpoints

- `GET /health` — liveness
- `GET /version` — release metadata
- Frontend nginx `GET /healthz`

## Alert suggestions

1. Error rate > 2% for 5 minutes
2. Health check failing for 2 consecutive intervals
3. Disk usage on log volume > 80%
4. Backup job failure
