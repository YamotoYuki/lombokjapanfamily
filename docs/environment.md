# Environment variables

## Frontend

| Key | Required | Description |
|-----|----------|-------------|
| `VITE_API_BASE_URL` | yes | Flask API base (`/api` or absolute URL) |
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | yes | Public anon key |
| `VITE_SITE_URL` | recommended | Canonical site origin for SEO |
| `VITE_SENTRY_DSN` | no | Browser Sentry DSN |

Templates: `.env.example`, `.env.production.example`

## Backend

| Key | Required | Description |
|-----|----------|-------------|
| `SECRET_KEY` | yes (prod) | Flask secret |
| `JWT_SECRET` / `SUPABASE_JWT_SECRET` | recommended | JWT verification secret |
| `SUPABASE_URL` | yes | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service role (server only) |
| `YOUTUBE_API_KEY` | for sync | YouTube Data API |
| `GA4_PROPERTY_ID` | for analytics | GA4 property |
| `GOOGLE_APPLICATION_CREDENTIALS` | for analytics | Service account path |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | for mail | SMTP |
| `CORS_ORIGINS` | yes (prod) | Comma-separated allowlist |
| `RATE_LIMIT_DEFAULT` | no | Default `100 per minute` |
| `SENTRY_DSN` | no | Backend Sentry |
| `APP_VERSION` | no | Reported by `/version` |

Templates: `backend/.env.example`, `backend/.env.production.example`

## Rules

1. Never commit real secrets
2. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
3. Rotate keys after any leak
4. Prefer platform secret managers (Vercel/Railway/Fly secrets)
