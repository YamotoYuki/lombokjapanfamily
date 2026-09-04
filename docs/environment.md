# Environment variables

## Frontend

| Key | Required | Description |
|-----|----------|-------------|
| `VITE_API_BASE_URL` | yes | Flask API base (`/api` or absolute URL) |
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | yes | Public anon key |
| `VITE_TURNSTILE_SITE_KEY` | yes (prod) | Cloudflare Turnstile **site** key (public). Required when backend has `TURNSTILE_SECRET_KEY`. Allow the Workers hostname on the Turnstile widget. |
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
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | for mail | SMTP (Gmail: `smtp.gmail.com` + app password). Store secrets in Render/Railway — never commit real values. |
| `SMTP_FROM` / `EMAIL_FROM` | for mail | From address (usually same as `SMTP_USER`) |
| `ADMIN_CONTACT_EMAIL` | for mail | Admin notification inbox for new contacts |
| `MAIL_PROVIDER` | no | `smtp` (default), `resend`, or `sendgrid` |
| `TURNSTILE_SECRET_KEY` | yes (prod) | Cloudflare Turnstile — required in production for `/api/contacts` |
| `RATE_LIMIT_CONTACT` | no | Public contact create limit (default `8 per minute`) |
| `RATE_LIMIT_STORAGE_URI` | recommended (prod) | Prefer Redis over `memory://` for multi-worker |
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
