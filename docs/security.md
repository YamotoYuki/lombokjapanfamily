# Security

**STEP16 update (2026-09-08):** a code-level security audit fixed two gaps
this document did not previously call out explicitly — PostgREST `.or_()`
filter-string injection (search keywords were concatenated unescaped; see
"SQL Injection" below) and missing magic-byte verification on most upload
paths (see "Uploads" below). It also added a Cloudflare Pages `_headers`
file so the CSP/header policy below actually reaches the browser when the
frontend is served by Cloudflare Pages rather than the nginx/Docker path
this document was originally written against. Details and evidence:
`docs/bug-report.md` ("Fixed in STEP16" table, BUG-014/015/029/030).

## Controls implemented

| Area | Control |
|------|---------|
| Transport | HTTPS at edge (hosting); HSTS on Flask in production |
| CORS | Explicit origin allowlist |
| Auth | Supabase JWT verification |
| Access control | Role guards (admin/editor/viewer) + Flask role checks |
| MFA visibility | Admin UI shows MFA status (self + user list/detail) |
| Rate limit | 100 requests/minute (configurable) |
| Headers | CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, COOP |
| Spam | Cloudflare Turnstile on Contact (when keys configured) |
| Uploads | Extension/MIME/size validation + magic-byte signature verification (all paths, STEP16) |
| Secrets | `.gitignore` + env templates only |
| Audit | DB `audit_logs` + `logs/audit.log` |
| Errors | Centralized handlers (no stack traces to clients) |

## Content Security Policy (CSP)

### Frontend (nginx / SPA)
Mirrored in `frontend/nginx.conf` (Docker/nginx hosting path) and in
`public/_headers` (Cloudflare Pages hosting path — see `docs/bug-report.md`
BUG-029; `_headers`' `connect-src` additionally allows the Render API origin
by hostname, since Pages and Render are separate origins):

- `default-src 'self'`
- `script-src` — self, unsafe-inline (GTM bootstrap), Cloudflare Turnstile, GTM/GA, Supabase
- `style-src` — self, unsafe-inline, Google Fonts
- `font-src` — self, fonts.gstatic.com
- `img-src` — self, data, blob, https
- `connect-src` — self, Supabase (https/wss), Turnstile, GA/GTM, Sentry
- `frame-src` — Turnstile, GTM, YouTube
- `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`

### Backend (Flask API)
Default: `default-src 'none'; frame-ancestors 'none'; base-uri 'none'`  
Override with `CONTENT_SECURITY_POLICY` env if needed.

## Cloudflare Turnstile (Contact)

1. Create a Turnstile widget in Cloudflare Dashboard.
2. Set frontend `VITE_TURNSTILE_SITE_KEY` (build-time) in Cloudflare Workers/Pages **build** variables.
3. Set backend `TURNSTILE_SECRET_KEY` on Render (same widget's **secret** key — do not swap with the site key).
4. In the Turnstile widget hostname list, allow `lombokjapanfamily.lombokjapanfamily.workers.dev` (and any custom domain).
5. When secret is **unset**, verification is skipped (local/dev).
6. When secret is **set**, `POST /api/contacts` requires `cf_turnstile_response`.

## MFA (recommended operations)

MFA enrollment is managed in **Supabase Auth** (not in-app enrollment UI yet).

Recommended:

1. Supabase Dashboard → **Authentication → Providers / Multi-Factor** → enable TOTP
2. Enable **Leaked password protection**
3. Each admin: Authentication → Users → enable MFA (or self-enroll via Supabase account security)
4. CMS shows MFA status:
   - Top bar account menu (current user)
   - Users list / user detail (`mfa_enabled`)
5. Prefer requiring MFA for `admin` role before production go-live

## Audit checklist & findings

### SQL Injection
- **Status**: Low risk for standard filters (Supabase client parameterizes `.eq()`/`.ilike()`/etc. as individual query params). **Fixed in STEP16**: the one real gap — user search keywords concatenated directly into PostgREST `.or_()` filter *strings* (a different mechanism from parameterized single-column filters, since `.or_()` takes one raw filter-syntax string) — is now sanitized via `backend/utils/validators.py::sanitize_search_term`/`build_or_filter` at all 6 call sites, including the previously-unauthenticated `GET /api/videos?q=`. See `docs/bug-report.md` BUG-014.
- **Improve**: Keep avoiding dynamic SQL; review any future RPC; any *new* `.or_()`/`.and_()` call must go through the shared sanitizer rather than building its own filter string.

### XSS
- **Status**: Mitigated — React escapes by default; CSP restricts script origins; avoid `dangerouslySetInnerHTML` for untrusted content.
- **Improve**: Replace GTM inline bootstrap with nonces to drop `'unsafe-inline'`.

### CSRF
- **Status**: API uses Bearer JWT (not cookie session) → classic CSRF risk is low.
- **Improve**: If cookie auth is added later, implement CSRF tokens + SameSite cookies.

### Broken Access Control
- **Status**: Frontend route guards + backend `require_*` on admin/editor endpoints.
- **Improve**: Periodic permission matrix tests in CI for each role.

### 認可漏れ
- **Status**: Public GET endpoints remain open intentionally (settings read, public content). Mutations require roles.
- **Improve**: Add integration tests asserting 401/403 for anonymous writes.

### 環境変数漏洩
- **Status**: Secrets gitignored; only anon / Turnstile site key in frontend.
- **Improve**: Enable secret scanning (GitHub Advanced Security) and rotate on incident.

## Operational hardening recommendations

1. Enable Supabase leaked password protection + MFA for admins
2. Set Turnstile keys before public launch
3. Restrict Storage bucket policies regularly
4. Set Render/Railway to private networking where possible
5. Add WAF (Cloudflare) in front of public site
6. Quarterly access review of `user_roles`
