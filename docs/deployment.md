# Deployment

## Recommended production topology

1. **Frontend** → Vercel or Cloudflare Pages
2. **Backend** → Render / Railway / Fly.io (Docker)
3. **Database & Storage** → Supabase project (production)

## Prerequisites

- Supabase migrations applied through STEP12
- Secrets configured (see `docs/environment.md`)
- CORS origins set to production domains
- Custom domain + HTTPS certificates

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
