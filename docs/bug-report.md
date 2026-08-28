# Bug Report — STEP15 QA

**Last updated:** 2026-08-15  
**Severity scale:** Critical / High / Medium / Low  
**Status:** Open / Fixed (STEP15) / Accepted risk

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

## Open — must resolve before production GO

| ID | Sev | Area | Description | Recommendation |
|----|-----|------|-------------|----------------|
| BUG-010 | High | Ops | Live E2E not run (Supabase/YouTube/mail/GA4/Storage) | Staging smoke per `release-checklist.md` |
| BUG-011 | High | Perf | Lighthouse Performance target 90+ unlikely; large charts chunk | Measure on staging; code-split Analytics; defer Recharts |
| BUG-012 | High | PWA | `vite-plugin-pwa` not installed; no webmanifest in dist | Fix npm TLS; install plugin or add static `manifest.webmanifest` |
| BUG-013 | Medium | Security | `SECRET_KEY` falls back to weak default if unset | Fail fast in production when missing/weak |
| BUG-014 | Medium | Security | PostgREST `.or_` keyword filter injection | Escape `%`, `,`, `)` in search terms |
| BUG-015 | Medium | Security | Upload MIME trusted / `octet-stream` bypass by extension | Magic-byte sniff; stricter allowlist |
| BUG-016 | Medium | Spam | Contact has no CAPTCHA; global rate limit only | Turnstile/reCAPTCHA + route limit |
| BUG-017 | Medium | Ops | Deploy workflow builds images but does not deploy | Wire Vercel/Railway/Fly secrets + job |
| BUG-018 | Medium | QA | No frontend automated tests | Add Playwright smoke (auth matrix + public forms) |
| BUG-019 | Medium | QA | Backend auth/RBAC coverage still thin | Expand pytest matrix with JWT fixtures |

---

## Open — should fix soon (not hard blockers for private staging)

| ID | Sev | Area | Description | Recommendation |
|----|-----|------|-------------|----------------|
| BUG-020 | Medium | UX/RBAC | `canWrite()` unused; viewer dashboard links bounce | Hide links via `canWrite` / role |
| BUG-021 | Medium | Rate limit | In-memory limiter + multi-worker = weak | Redis storage in prod |
| BUG-022 | Medium | API | Exception `details` often returned to clients | Strip details when `FLASK_ENV=production` |
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
