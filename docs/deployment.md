# Deployment

## Recommended production topology

1. **Frontend** → Vercel or Cloudflare Pages
2. **Backend** → Render / Railway / Fly.io (Docker)
3. **Database & Storage** → Supabase project (production)

## Prerequisites

- Supabase migrations applied through the latest file in `supabase/migrations/`
  — as of 2026-09-08 this includes `20260908000000_settings_assets_remove_svg.sql`
  (STEP16 security fix; removes `image/svg+xml` from the `settings-assets`
  bucket's allowed MIME types). Apply with `supabase db push` or the SQL
  editor; this has **not** been applied to any live project from this repo.
- Secrets configured (see `docs/environment.md`)
- CORS origins set to production domains
- Custom domain + HTTPS certificates
- If deploying the frontend to Cloudflare Pages: confirm `public/_headers`
  (copied to `dist/_headers` by `vite build`) is actually applied to
  production responses after the first deploy — see the dashboard checklist
  in `docs/bug-report.md`.

## Option A: Docker Compose (VM / VPS)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# edit secrets
docker compose up -d --build
```

Health checks:
- `GET http://<host>:5000/health`
- `GET http://<host>:8080/healthz`

## Option B: Split hosting

### Frontend (Vercel)

1. Import GitHub repository
2. Framework: Vite
3. Env: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, optional `VITE_SENTRY_DSN`
4. Build command: `npm run build`
5. Output: `dist`

### Backend (Render / Railway)

1. Use `backend/Dockerfile`
2. Set env vars from `backend/.env.production.example`
3. Expose port `5000`
4. Health check path: `/health`
5. Contact mail (Gmail SMTP) — set as **platform Secrets** (never commit):

```text
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail>
SMTP_PASSWORD=<gmail-app-password>
SMTP_FROM=<gmail>
EMAIL_FROM=<gmail>
ADMIN_CONTACT_EMAIL=<admin-inbox>
```

Startup should log `[MAIL] SMTP configured` (no password in logs).
Soft-fail: contact rows still save if SMTP fails.

### Fly.io example

```bash
cd backend
fly launch --dockerfile Dockerfile
fly secrets set SECRET_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
fly deploy
```

## GitHub Actions

- `ci.yml`: lint / typecheck / build / pytest on PR & push
- `deploy.yml`: builds Docker images (extend with platform deploy secrets)

## Post-deploy smoke test

1. `/` loads with SEO tags
2. `/admin/login` works
3. Admin can open `/admin/settings`
4. `/api/health` and `/version` return 200
5. Maintenance mode toggles public gate
6. Upload logo succeeds
7. Sentry receives a test event (if enabled)
