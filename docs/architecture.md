# Architecture

## Overview

```
Browser (React PWA)
   │  HTTPS
   ├─► Vercel / Cloudflare Pages / nginx (frontend)
   │
   └─► Flask API (Gunicorn)  ──► Supabase PostgreSQL
                │                 Supabase Auth
                │                 Supabase Storage
                ├─► YouTube Data API
                ├─► GA4 Data API
                └─► SMTP / mail provider
```

## Components

### Frontend
- Public marketing site + `/admin` CMS
- Auth via Supabase JWT (anon key + session)
- Role guards: Admin / Editor / Viewer
- Settings-driven SEO, branding, maintenance mode
- PWA (vite-plugin-pwa)

### Backend
- REST API under `/api/*`
- JWT verification (`SUPABASE_JWT_SECRET` or `JWT_SECRET`)
- RBAC helpers: `require_admin` / `require_editor` / `require_staff`
- Rate limit default: **100 req/min**
- Security headers + request logging + rotating file logs
- Audit logs persisted to `audit_logs` (+ `logs/audit.log`)

### Data
- Content CMS tables (videos, posts, gallery, contacts, family, sponsors, analytics, settings, users)
- RLS policies for admin/editor/viewer/public as defined in migrations

## Environments

| Env | Frontend | Backend |
|-----|----------|---------|
| Local | Vite `:5173` | Flask `:5000` |
| Compose | nginx `:8080` | gunicorn `:5000` |
| Prod | Vercel/CF Pages | Render/Railway/Fly.io |

## Versioning

- App version exposed at `GET /version` (`APP_VERSION`)
- Frontend package version in `package.json`
