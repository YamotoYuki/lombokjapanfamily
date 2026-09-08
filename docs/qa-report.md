# QA Report — Lombok-Japan Family CMS (STEP15, + STEP16 security remediation)

**Date:** 2026-08-15 (STEP15 baseline); **STEP16 addendum: 2026-09-08**  
**Scope:** Frontend / Backend API / Auth / RBAC / Storage / Integrations / PWA / SEO / Docker / CI  
**Environment:** Static code review + local `tsc` / `eslint` / `pytest` / `vite build`  
**Live staging credentials:** Not available in this QA run (Supabase / YouTube / SMTP / GA4 not exercised end-to-end) — still true as of STEP16, see dashboard checklist in `docs/bug-report.md`

---

## STEP16 addendum (2026-09-08)

A code-level security audit (see `docs/bug-report.md` "Fixed in STEP16") re-verified every item this report and `bug-report.md` had marked "Open" as of STEP15, then fixed the ones still open in code:

- **Already resolved before STEP16** (this report was simply out of date): BUG-012 (PWA manifest), BUG-013 (`SECRET_KEY` fail-fast), BUG-016 (Turnstile), BUG-022 (exception details).
- **Newly fixed in STEP16**: BUG-014 (PostgREST filter injection, incl. the unauthenticated `GET /api/videos?q=` path), BUG-015 (upload magic-byte verification, all upload paths), the sitemap placeholder domain, a Cloudflare Pages `_headers` file (frontend security headers), and a new migration removing `image/svg+xml` from the `settings-assets` Storage bucket's allowed MIME types.
- **Explicitly out of scope for STEP16** (per the remediation request): BUG-010/011 (live E2E, Lighthouse), BUG-017 (real deploy automation), BUG-018 (frontend test framework), BUG-021 (Redis rate-limit storage), BUG-023 (prod image dev-dependency split).

Backend test count grew from 81 (pre-STEP16 baseline, `pytest -q` on 2026-09-08 before any change) to **116 passing** after STEP16 (35 new tests across `test_search_sanitize.py` and `test_upload_signature.py`). The "12 passed" figure previously in this report predates even the STEP15 baseline and was not re-verified here beyond confirming the current, larger count.

---

## Executive summary

Critical unauthenticated content-leak endpoints were found and **patched during STEP15**.  
Frontend route-level RBAC is sound. Automated backend tests: **116 passed** as of STEP16 (see addendum above). Frontend typecheck/lint: **pass** (1 pre-existing eslint warning, unrelated to STEP16 changes).

**Production Go Live:** **CONDITIONAL GO** (upgraded from STEP15's NO-GO — see STEP16 addendum). Still blocked on items outside STEP16's scope: staging E2E (BUG-010), measured Lighthouse (BUG-011), real deploy automation (BUG-017), and the dashboard-only checklist in `docs/bug-report.md` (Cloudflare Pages header verification, Supabase migration apply + SVG object check, Render/Cloudflare Git-integration confirmation).  
**Staging candidate:** **CONDITIONAL GO** after checklist in `release-checklist.md`.

**Overall completion (product):** **~90%** (unchanged from STEP15 — STEP16 was a security-remediation pass, not a feature pass)

---

## 1. Frontend comprehensive test

| Area | Result | Evidence |
|------|--------|----------|
| Typecheck | PASS | `npm run typecheck` |
| Lint | PASS (1 warning) | `AuthContext` react-refresh export warning |
| Production build | PASS | `npm run build` |
| Automated unit/E2E | FAIL (missing) | No Vitest/Playwright project tests |
| Public routes | PASS (static) | `/`, `/videos`, `/blog`, `/gallery`, `/contact`, `/family` |
| Admin routes | PASS (static) | Dashboard…Settings wired with guards |
| Responsive | PASS (static) | Mobile `<768` / Tablet `768–1023` / Desktop `≥1024` |
| Touch targets | PASS (static) | `--touch-min: 44px`, Button/Input classes |

### Public pages (code-level)

| Page | Status | Notes |
|------|--------|-------|
| Home | OK | Hero 70vh mobile / 100vh desktop; grids responsive |
| Videos | OK | 1/2/4 grid |
| Blog | OK | Public list uses `/posts/public`; content rendered as text (XSS-safe) |
| Gallery | OK | 2/3/4 grid; lightbox Escape + ARIA |
| Contact | OK | Client email regex + 10MB check added in STEP15 |

### Admin pages (code-level)

| Page | Guard | Status |
|------|-------|--------|
| Dashboard | staff | OK |
| Videos / Blog / Gallery / Contact / Family / Sponsors | RequireEditor | OK |
| Analytics | staff (+ sync admin) | OK |
| Users / Settings | RequireAdmin | OK |

---

## 2. API comprehensive test

| Check | Result |
|-------|--------|
| Health `/health` `/api/health` | PASS (pytest) |
| Version `/version` | PASS (pytest) |
| Security headers (nosniff / frame DENY) | PASS (pytest) |
| Upload validator (png ok / exe reject / svg reject) | PASS (pytest) |
| Public visibility gates (posts/videos/gallery/family) | PASS (pytest, added STEP15) |
| Live CRUD against Supabase | NOT RUN (no staging) |

---

## 3. Auth test

| Case | Expected | Result |
|------|----------|--------|
| Unauthenticated → `/admin/*` | Redirect login | PASS (frontend `ProtectedRoute`) |
| Unauthenticated → CMS post list/detail | 401/403 | PASS (pytest after fix) |
| JWT via Bearer + profile/role lookup | Required for staff | PASS (code review) |
| Default `SECRET_KEY` fallback | Prod risk | OPEN (Medium) — refuse boot recommended |

---

## 4. RBAC test

| Role | Expected | Frontend | Backend |
|------|----------|----------|---------|
| Admin | All pages + mutations | PASS (routes) | PASS (require_admin / editor) |
| Editor | No Users/Settings | PASS (RequireAdmin + sidebar) | PASS |
| Viewer | Dashboard/Analytics only; no content edit routes | PASS (routes) | Mutations gated; reads staff-scoped |

**Residual:** `canWrite()` unused — viewer may see dashboard deep-links that bounce (UX, not privilege escalation).

---

## 5. Storage test

| Bucket | Validation | Path safety | Live upload |
|--------|------------|-------------|-------------|
| avatars (family) | Image 5MB | UUID path | NOT RUN |
| gallery | Image 5MB | Sanitized slug | NOT RUN |
| posts | Image MIME 5MB | Folder clamp | NOT RUN |
| attachments | Ext+MIME 10MB | UUID path | NOT RUN |
| settings-assets | jpg/png/webp/ico (SVG **removed** STEP15 at app layer; STEP16 also removed `image/svg+xml` from the Storage bucket's `allowed_mime_types` via new migration — not yet applied to a live project, see `docs/bug-report.md`) | UUID path | NOT RUN |

---

## 6. Supabase connection

| Item | Status |
|------|--------|
| Client config present | PASS (code) |
| Service role on backend only | PASS (design) |
| Migrations present | PASS (`supabase/migrations/`) |
| Live connectivity | NOT RUN |

---

## 7. YouTube API

| Item | Status |
|------|--------|
| Sync endpoint editor+ | PASS (code) |
| Featured / home visible filters | PASS (code) |
| Public list forces `is_visible=True` | PASS (STEP15 fix + test) |
| Live sync | NOT RUN (needs `YOUTUBE_API_KEY`) |

---

## 8. Analytics

| Item | Status |
|------|--------|
| Staff GET charts | PASS (code) |
| Sync admin-only | PASS (code) |
| Live GA4 sync | NOT RUN |

---

## 9. Contact

| Item | Status |
|------|--------|
| Public POST + DB insert | PASS (code) |
| Attachment upload | PASS (code) |
| Admin notify + auto-reply | PASS (code; soft-fail on mail error) |
| CAPTCHA / tight rate limit | Turnstile **confirmed present in code** as of STEP16 (`backend/routes/contact_routes.py`); rate limit still in-memory (see BUG-021, out of STEP16 scope) |
| Live mail delivery | NOT RUN |

---

## 10. Sponsors (案件管理)

| Item | Status |
|------|--------|
| Staff list / editor mutate | PASS (code) |
| File upload validation | PASS (code) |
| Live CRUD | NOT RUN |

---

## 11. Settings

| Item | Status |
|------|--------|
| Public GET | PASS (intentional) |
| PATCH / uploads admin-only | PASS |
| SVG XSS vector | FIXED (disallowed) |

---

## 12. Mobile / responsive

| Device class | Code support | Device lab |
|--------------|--------------|------------|
| iPhone width | PASS | NOT RUN |
| Android width | PASS | NOT RUN |
| iPad / landscape | PASS (CSS) | NOT RUN |
| Desktop | PASS | NOT RUN |

---

## 13. PWA

| Item | Status |
|------|--------|
| `sw.js` + offline.html + icons | PASS |
| Prod SW registration | PASS (`main.tsx`) |
| Web Manifest via vite-plugin-pwa | FAIL — package not installed (TLS/npm) |
| Installability | PARTIAL |

---

## 14. SEO

| Item | Status |
|------|--------|
| Helmet title/description/OG | PASS |
| robots.txt disallow `/admin` | PASS |
| sitemap absolute URLs | FIXED — real domain `https://lombokjapanfamily.com` set in STEP16 (previously a placeholder host) |
| Dynamic blog URLs in sitemap | OPEN (static file only) |

---

## 15. Lighthouse (estimated — not measured)

| Category | Target | Estimate | Notes |
|----------|--------|----------|-------|
| Performance | 90+ | **70–82** | Large `charts` + main chunks |
| Accessibility | 90+ | **90–94** | ARIA/drawer improved; needs audit |
| Best Practices | 90+ | **88–93** | PWA/manifest gap |
| SEO | 95+ | **90–96** | After absolute sitemap + meta |

**Target not met for Performance until measured and optimized.**

---

## 16. Docker

| Item | Status |
|------|--------|
| `docker-compose.yml` backend+frontend | PASS (static) |
| Backend Dockerfile non-root + healthcheck | PASS |
| Frontend multi-stage nginx | PASS |
| Image build in this environment | NOT RUN |
| Deploy workflow builds images | PASS (CI definition) |

---

## 17. GitHub Actions

| Workflow | Status |
|----------|--------|
| `ci.yml` lint/typecheck/build + pytest | PASS (definition) |
| `deploy.yml` docker build, no real deploy | PARTIAL — placeholder notify job |
| Live CI run on GitHub | NOT VERIFIED (no remote git in workspace) |

---

## Error monitoring

| Item | Status |
|------|--------|
| Backend Sentry optional DSN | PASS (code) |
| Frontend ErrorBoundary + optional Sentry | PASS (code) |
| Live events | NOT RUN |

---

## Security spot checks

| Threat | Result |
|--------|--------|
| XSS (blog HTML) | PASS — React text |
| XSS (GTM/GA injection) | MITIGATED — ID regex allowlist |
| XSS (SVG upload) | FIXED — SVG blocked |
| SQL injection | N/A raw SQL; PostgREST filter injection **fixed in STEP16** (shared sanitizer, see `bug-report.md` BUG-014) |
| Broken access (draft posts etc.) | FIXED |
| File upload | MIME trust gap **fixed in STEP16** — magic-byte verification now covers every upload path, see `bug-report.md` BUG-015 |
| Frontend response headers (Cloudflare Pages) | **Addressed in STEP16** via `public/_headers`; actual production response headers still need dashboard verification (see `bug-report.md` checklist) |

---

## Fixes applied during STEP15 QA

1. Gate `GET /api/posts` and `GET /api/posts/<id>` with editor auth  
2. Force visible-only for anonymous videos / gallery / family  
3. Disallow SVG in settings assets  
4. Sanitize GA4 / GTM IDs client-side  
5. Contact form email regex + 10MB client check  
6. Absolute sitemap placeholder URLs  
7. Added `tests/test_public_visibility.py` (+ SVG validator test)

---

## Fixes applied during STEP16 (2026-09-08)

1. Shared PostgREST search-term sanitizer (`sanitize_search_term`/`build_or_filter`) applied to all 6 user-input `.or_()` sites, including the unauthenticated `GET /api/videos?q=` path
2. Shared magic-byte file-signature verification (`verify_file_signature`) applied to every upload path (gallery, blog/post images, family photos, avatars, settings logo/favicon/OG, sponsor files) — previously only contact attachments were checked
3. Cloudflare Pages `_headers` file added (CSP/security headers for the split-hosting frontend path)
4. New Supabase migration removing `image/svg+xml` from `settings-assets`' allowed Storage MIME types (existing migrations left untouched)
5. `public/sitemap.xml` placeholder domain replaced with the real production domain
6. `docs/bug-report.md` / this report updated to reflect items already fixed in code since STEP15 but not previously reflected in documentation
7. Added `backend/tests/test_search_sanitize.py` and `backend/tests/test_upload_signature.py` (35 new tests)

---

## Related documents

- `docs/bug-report.md` — issue tracker  
- `docs/release-checklist.md` — go-live gates  
- `docs/security.md` / `docs/production-checklist.md` — ops references
