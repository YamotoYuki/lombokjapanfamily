# Release Checklist — Go Live Gates

Use this checklist on **staging first**, then production.  
Related: `docs/qa-report.md`, `docs/bug-report.md`, `docs/production-checklist.md`.

**Go Live rule:** All **Blockers** must be checked. **Critical** must be zero open.

---

## A. Blockers (must pass)

### Build & CI
- [ ] `npm ci && npm run lint && npm run typecheck && npm run build` succeeds
- [ ] `cd backend && pytest -q` passes (expect ≥12)
- [ ] GitHub Actions CI green on release commit
- [ ] Docker images build (`deploy.yml` or local `docker compose build`)

### Secrets & config
- [ ] `SECRET_KEY` set (no default fallback)
- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set (backend only)
- [ ] `SUPABASE_JWT_SECRET` or `JWT_SECRET` set
- [ ] `CORS_ORIGINS` = production origin(s) only
- [ ] `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set (frontend build args)
- [ ] `VITE_SITE_URL` = canonical HTTPS origin
- [ ] `YOUTUBE_API_KEY` set if sync enabled
- [ ] Mail provider env set (`SMTP_*` / Resend / SendGrid) + `ADMIN_CONTACT_EMAIL`
- [ ] Optional: `SENTRY_DSN` (FE/BE)

### Auth & RBAC (manual)
- [ ] Logged-out user cannot open `/admin/*` (redirect login)
- [ ] Admin can open all admin pages
- [ ] Editor **cannot** open Users / Settings (redirect)
- [ ] Viewer **cannot** open Videos/Blog/… edit pages; Dashboard/Analytics OK
- [ ] `curl` without token: `GET /api/posts` → 401/403
- [ ] `curl` without token: `GET /api/videos?is_visible=false` → only visible items
- [ ] `curl` without token: `GET /api/gallery` / `/api/family` → visible only

### Data & integrations (staging)
- [ ] YouTube sync creates/updates videos; featured/home flags work
- [ ] Blog create → schedule → publish → public slug visible; draft not public
- [ ] Gallery/family/sponsor CRUD + uploads succeed
- [ ] Contact submit → row in DB → admin mail + auto-reply received
- [ ] Analytics sync (admin) populates charts
- [ ] Settings logo/favicon/OG upload + public SEO tags update
- [ ] Buckets: `avatars`, `gallery`, `posts`, `attachments`, `settings-assets`

### Security smoke
- [ ] Upload `.exe` / `.svg` (settings) rejected
- [ ] XSS probe in blog body shows as text, not HTML
- [ ] Rate limit returns 429 under burst (optional but recommended)
- [ ] No service-role key in frontend bundle (`grep` dist)

### Quality gates
- [ ] Mobile / tablet / desktop smoke on real devices or BrowserStack
- [ ] Lighthouse mobile: Perf ≥90, A11y ≥90, BP ≥90, SEO ≥95 **or** documented waiver with plan
- [ ] PWA: installable (manifest + SW) **or** documented waiver
- [ ] Zero open Critical bugs in `bug-report.md`
- [ ] Zero known auth/RBAC privilege escalations

---

## B. Pre-deploy

- [ ] Replace `https://example.com` in `public/sitemap.xml` with real origin
- [ ] `robots.txt` Sitemap URL absolute
- [ ] Maintenance mode off (unless intentional)
- [ ] DB migrations applied on production Supabase
- [ ] Backup verified (`docs/backup.md`)
- [ ] Rollback plan documented (previous image tag / previous static assets)

---

## C. Deploy steps (suggested)

1. Merge release branch → `main`  
2. Confirm CI green  
3. Build & push Docker images (or platform build)  
4. Deploy backend → confirm `/health` 200  
5. Deploy frontend with production Vite env  
6. Run section A Auth + Contact + YouTube smokes  
7. Enable Sentry alerts  
8. Announce Go Live

---

## D. Post-deploy (T+1h / T+24h)

- [ ] Error rate normal in Sentry/logs  
- [ ] Contact form still delivers  
- [ ] YouTube sync scheduled job (if any) OK  
- [ ] No spike in 401/403/500  
- [ ] CDN/cache purge if used  

---

## Sign-off

| Role | Name | Date | Decision |
|------|------|------|----------|
| QA | | | PASS / FAIL |
| Tech lead | | | GO / NO-GO |
| Product owner | | | GO / NO-GO |

**Current STEP15 recommendation:** **NO-GO for production** until Blockers (esp. staging E2E + Lighthouse measure + secrets) are complete.  
**Staging deploy:** **CONDITIONAL GO** after Auth/API visibility fixes verified on a real environment.
