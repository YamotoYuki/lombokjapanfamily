# Bug Report — STEP15 QA (+ STEP16 security remediation)

**Last updated:** 2026-09-08 (STEP16 addendum below; STEP15 baseline: 2026-08-15, preserved as-is)  
**Severity scale:** Critical / High / Medium / Low  
**Status:** Open / Fixed (STEP15) / Fixed (STEP16) / Accepted risk

STEP16 note (2026-09-08): a code-level security audit re-checked every STEP15
"Open" item against the current codebase before making changes. Several
items (BUG-012, BUG-013, BUG-016, BUG-022) were found **already resolved in
code that landed after 2026-08-15**, i.e. this document had not been updated
to match. BUG-014 and BUG-015 were confirmed still open and were fixed in
this pass. See "Fixed in STEP16" below for each item's evidence. This does
not change the STEP15 history below, which is left intact.

---

## Fixed in STEP15

| ID | Sev | Area | Description | Fix |
|----|-----|------|-------------|-----|
| BUG-001 | Critical | API Auth | `GET /api/posts` returned drafts/scheduled without auth | `require_editor` |
| BUG-002 | Critical | API Auth | `GET /api/posts/<id>` returned any post without auth | `require_editor` |
| BUG-003 | High | API Auth | Public videos could list hidden via `is_visible=false` | Force `is_visible=True` for anonymous |
| BUG-004 | High | API Auth | Gallery/family lists defaulted to include hidden | Force `visible_only` for anonymous |
| BUG-005 | High | API Auth | Gallery/family detail by ID ignored visibility | 404 if hidden + anonymous |
| BUG-006 | High | Upload XSS | Settings SVG upload enabled stored XSS | SVG removed from allowlist |
| BUG-007 | High | XSS | GTM/GA IDs interpolated into scripts | Regex allowlist `G-*` / `GTM-*` |
| BUG-008 | Medium | UX/Validation | Contact empty email wrong message; no size check | Regex + 10MB check |
| BUG-009 | Medium | SEO | Sitemap used relative `<loc>` | Absolute placeholder URLs |

---

## Fixed in STEP16 (2026-09-08)

| ID | Sev | Area | Description | Current state | Evidence | Test | Confirmed |
|----|-----|------|-------------|----------------|----------|------|-----------|
| BUG-012 | High | PWA | `vite-plugin-pwa` not installed; no webmanifest in dist | **Already resolved before STEP16** (not a code change this pass) — `vite-plugin-pwa` is present in `node_modules` and `npm run build` emits `dist/manifest.webmanifest` | `package.json` (`optionalDependencies`), `vite.config.ts` (`loadPwaPlugin`) | Manual: ran `npm run build`, confirmed `dist/manifest.webmanifest` exists (434 bytes) | 2026-09-08 |
| BUG-013 | Medium | Security | `SECRET_KEY` falls back to weak default if unset | **Already resolved before STEP16** — production startup raises `RuntimeError` and refuses to boot if `SECRET_KEY`/`JWT_SECRET` is missing or a known-weak value; the silent fallback only applies outside production (`FLASK_ENV` in development/testing/local) | `backend/app.py:70-74`, `backend/utils/env_check.py:124-130` (`WEAK_SECRET_KEYS`, fatal check) | `backend/tests/test_security_hardening.py` (pre-existing, still passing) | 2026-09-08 |
| BUG-014 | Medium | Security | PostgREST `.or_` keyword filter injection | **Fixed in STEP16.** All 6 call sites that concatenated user input into a `.or_()` filter string now go through a shared sanitizer that strips PostgREST's structural characters (`,():`) before the value is used, plus one `.eq()`-based OR (gallery category) fixed the same way. Most notably this closes the previously-unauthenticated `GET /api/videos?q=...` path. | `backend/utils/validators.py` (`sanitize_search_term`, `build_or_filter`); applied in `backend/services/supabase_service.py`, `gallery_service.py`, `post_service.py`, `contact_service.py`, `sponsor_service.py`, `user_service.py` | `backend/tests/test_search_sanitize.py` (new, 11 tests: normal ja/en/id search, all required attack strings, empty/whitespace/very-long input, unauthenticated `/api/videos?q=` fuzzing, visibility-filter integrity) | 2026-09-08 |
| BUG-015 | Medium | Security | Upload MIME trusted / `octet-stream` bypass by extension | **Fixed in STEP16.** The magic-byte check that previously only covered contact-form attachments is now a shared `verify_file_signature()` helper wired into every upload path (gallery, blog/post images, family photos, avatars, settings logo/favicon/OG image, sponsor files). Declared extension/Content-Type must now match the file's real signature; SVG remains rejected (never in any allowlist). | `backend/utils/validators.py` (`verify_file_signature`); wired via `backend/services/storage_service.py` (gallery/family/announcement/avatar/settings paths) and directly in `backend/services/post_service.py::upload_post_image`, `backend/services/sponsor_service.py::upload_sponsor_file` | `backend/tests/test_upload_signature.py` (new, 24 cases incl. real jpg/png/gif/webp/pdf/docx/xlsx/zip/ico, text-as-jpg, HTML-as-png, HTML-as-webp/docx, wrong-type, unknown extension, empty, corrupted, svg) | 2026-09-08 |
| BUG-016 | Medium | Spam | Contact has no CAPTCHA; global rate limit only | **Already resolved before STEP16** — `POST /api/contacts` calls Cloudflare Turnstile verification, and production startup refuses to boot without `TURNSTILE_SECRET_KEY` configured | `backend/routes/contact_routes.py:17-26`, `backend/utils/env_check.py:143-149` | Manual code read; no live Turnstile call was exercised (would require a real site/secret key pair — dashboard-dependent, see checklist) | 2026-09-08 |
| BUG-022 | Medium | API | Exception `details` often returned to clients | **Already resolved before STEP16** — `utils/response.py::error()` only attaches `details` to the JSON body when `FLASK_ENV=development`; production responses never include it regardless of what routes pass in | `backend/utils/response.py:18-24` | Manual code read (no dedicated regression test added — the guard is a single well-isolated conditional; adding a route-level test was judged out of scope for this pass) | 2026-09-08 |
| BUG-029 | High | Frontend headers | Cloudflare Pages likely serves the SPA with no CSP/security headers at all (`frontend/nginx.conf`'s policy only applies to the Docker/nginx path, and no `_headers` file existed) | **Fixed in STEP16.** Added `public/_headers`, copied verbatim into `dist/_headers` by Vite. Mirrors `frontend/nginx.conf`'s CSP/header policy, adjusted so `connect-src` explicitly allows the Render API origin (cross-origin under the Cloudflare Pages + Render split-hosting topology). HSTS intentionally omitted — see dashboard checklist. | `public/_headers` | Manual: `npm run build` → confirmed `dist/_headers` exists and is non-empty | 2026-09-08 |
| BUG-030 | Medium | Storage config | `settings-assets` bucket's `allowed_mime_types` still included `image/svg+xml` at the Supabase Storage layer even though the app-level validator (`validators.py`) has rejected SVG since the BUG-006 fix | **Fixed in STEP16** at the migration level. A new, idempotent migration removes `image/svg+xml` from the bucket's allowed MIME list without touching any other bucket or existing objects. | `supabase/migrations/20260908000000_settings_assets_remove_svg.sql` | Not run against a live Supabase project from this pass (no database credentials available) — **must be applied via `supabase db push` or the SQL editor, see dashboard checklist** | 2026-09-08 |
| BUG-009 (update) | Medium | SEO | Sitemap used placeholder `https://example.com` | **Fixed in STEP16.** `public/sitemap.xml` now uses `https://lombokjapanfamily.com` for all 6 entries. | `public/sitemap.xml` | Validated as well-formed XML (`xml.etree.ElementTree`); URLs match currently-existing public routes | 2026-09-08 |

---

## Open — must resolve before production GO

| ID | Sev | Area | Description | Recommendation |
|----|-----|------|-------------|----------------|
| BUG-010 | High | Ops | Live E2E not run (Supabase/YouTube/mail/GA4/Storage) | Staging smoke per `release-checklist.md` |
| BUG-011 | High | Perf | Lighthouse Performance target 90+ unlikely; large charts chunk | Measure on staging; code-split Analytics; defer Recharts |
| BUG-017 | Medium | Ops | Deploy workflow builds images but does not deploy | Wire Vercel/Railway/Fly secrets + job (explicitly out of scope for STEP16 — see "変更しない項目") |
| BUG-018 | Medium | QA | No frontend automated tests | Add Playwright smoke (auth matrix + public forms) (explicitly out of scope for STEP16) |
| BUG-019 | Medium | QA | Backend auth/RBAC coverage still thin | Expand pytest matrix with JWT fixtures |
| BUG-030-ops | Medium | Storage config | STEP16's SVG-removal migration (BUG-030) has not been applied to the live Supabase project from this pass | Run `supabase db push` (or apply via SQL editor) against staging/production; separately check the `settings-assets` bucket for any pre-existing `*.svg` object and remove manually if found |

---

## Open — should fix soon (not hard blockers for private staging)

| ID | Sev | Area | Description | Recommendation |
|----|-----|------|-------------|----------------|
| BUG-020 | Medium | UX/RBAC | `canWrite()` unused; viewer dashboard links bounce | Hide links via `canWrite` / role |
| BUG-021 | Medium | Rate limit | In-memory limiter + multi-worker = weak | Redis storage in prod (explicitly out of scope for STEP16 — no new Redis provisioning) |
| BUG-023 | Medium | Docker | Prod image installs pytest/ruff | Split `requirements-prod.txt` |
| BUG-024 | Low | SEO | Sitemap static; blog posts not listed | Generate sitemap from published posts |
| BUG-025 | Low | SEO | `robots.txt` Sitemap path relative | Absolute sitemap URL |
| BUG-026 | Low | PWA | Dual SW risk if VitePWA later installed | Register only one SW path |
| BUG-027 | Low | Lint | `AuthContext` react-refresh warning | Split hook export file |
| BUG-028 | Low | A11y | Full keyboard audit not performed | axe DevTools on staging |

---

## Data integrity

| Check | Result |
|-------|--------|
| Soft-delete patterns (videos/gallery/family) | Designed OK |
| Evidence of data corruption in code paths | None found |
| Live DB integrity check | NOT RUN |

---

## Reproduction notes (historical Critical)

1. Without auth: `GET /api/posts` previously returned drafts — **fixed**.  
2. Without auth: `GET /api/videos?is_visible=false` previously returned hidden — **fixed**.  
3. Without auth: `GET /api/gallery` previously included hidden — **fixed**.

Verify on staging with curl after deploy.
