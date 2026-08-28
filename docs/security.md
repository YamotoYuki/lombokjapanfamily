# Security

## Controls implemented

| Area | Control |
|------|---------|
| Transport | HTTPS at edge (hosting) |
| CORS | Explicit origin allowlist |
| Auth | Supabase JWT verification |
| Access control | Role guards (admin/editor/viewer) + Flask role checks |
| Rate limit | 100 requests/minute (configurable) |
| Headers | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, COOP |
| Uploads | Extension/MIME/size validation |
| Secrets | `.gitignore` + env templates only |
| Audit | DB `audit_logs` + `logs/audit.log` |
| Errors | Centralized handlers (no stack traces to clients) |

## Audit checklist & findings

### SQL Injection
- **Status**: Low risk — Supabase client parameterized queries; no raw SQL string concat in app code.
- **Improve**: Keep avoiding dynamic SQL; review any future RPC.

### XSS
- **Status**: Mitigated — React escapes by default; avoid `dangerouslySetInnerHTML` for untrusted content.
- **Improve**: Sanitize rich text if blog HTML editing expands.

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
- **Status**: Secrets gitignored; only anon key in frontend.
- **Improve**: Enable secret scanning (GitHub Advanced Security) and rotate on incident.

## Operational hardening recommendations

1. Enable Supabase leaked password protection + MFA for admins
2. Restrict Storage bucket policies regularly
3. Set Render/Railway to private networking where possible
4. Add WAF (Cloudflare) in front of public site
5. Quarterly access review of `user_roles`
