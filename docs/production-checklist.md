# Production checklist

## Auth & RBAC
- [ ] Admin / Editor / Viewer accounts exist and roles are correct
- [ ] `/admin/users` is admin-only
- [ ] Editor cannot open Settings / Users
- [ ] Viewer is read-only on Dashboard / Analytics
- [ ] JWT secret configured (`SUPABASE_JWT_SECRET` or `JWT_SECRET`)

## Settings & public site
- [ ] Site name / logo / favicon reflected on public pages
- [ ] SEO title/description/OG image present in `<head>`
- [ ] SNS links appear in footer
- [ ] Maintenance mode blocks anonymous visitors; admin can bypass

## Analytics & integrations
- [ ] GA4 measurement ID set (if used)
- [ ] Backend GA4 property credentials work for `/admin/analytics`
- [ ] YouTube sync works with API key

## Storage
- [ ] `settings-assets`, `gallery`, `posts`, `avatars`, `attachments` buckets exist
- [ ] Upload validation rejects non-image payloads

## Security
- [ ] CORS origins limited to production domains
- [ ] Rate limit active (429 under burst)
- [ ] Security headers present on API responses
- [ ] No secrets in git history
- [ ] Service role key only on backend

## Reliability
- [ ] `/health` and `/version` return 200
- [ ] Sentry DSN configured (optional but recommended)
- [ ] Logs written under `backend/logs/`
- [ ] Backup schedule confirmed (`docs/backup.md`)

## Performance / PWA / SEO
- [ ] Production build succeeds
- [ ] Route-based code splitting loads admin chunks lazily
- [ ] PWA installable on mobile
- [ ] `robots.txt` and `sitemap.xml` reachable
- [ ] Canonical URL set via `VITE_SITE_URL`

## Ops
- [ ] CI green on main
- [ ] Rollback plan documented
- [ ] On-call / owner assigned for incidents
