# Backup & restore

## Strategy

| Asset | Frequency | Method |
|-------|-----------|--------|
| Supabase PostgreSQL | **Daily** | Supabase automatic backups (Pro) or `pg_dump` cron |
| Supabase Storage | **Weekly** | Object sync (`rclone` / storage download script) |
| Secrets / env | On change | Password manager / sealed vault (not git) |
| Audit logs | Continuous | DB table + rotating `backend/logs/audit.log` |

## Daily DB backup (recommended)

### Managed (Supabase Dashboard)
1. Project Settings → Database → Backups
2. Confirm PITR / daily backups enabled on production plan

### Self-managed dump

```bash
# Example using connection string from Supabase
pg_dump "$DATABASE_URL" --format=custom --file="backup-$(date +%F).dump"
```

Store artifacts in encrypted object storage (S3/R2) with 30-day retention.

## Weekly Storage backup

```bash
# Pseudo: sync public buckets
rclone sync supabase:gallery ./backups/storage/gallery
rclone sync supabase:posts ./backups/storage/posts
rclone sync supabase:settings-assets ./backups/storage/settings-assets
rclone sync supabase:avatars ./backups/storage/avatars
```

## Restore procedure

### Database
1. Pause write traffic / enable maintenance mode in Settings
2. Restore dump to a staging project first and verify
3. Restore production database from verified dump / PITR timestamp
4. Re-run critical smoke tests (auth, settings, posts)
5. Disable maintenance mode

### Storage
1. Restore bucket objects from weekly archive
2. Verify public URLs for logo/favicon/featured images
3. Re-upload missing assets via Admin Settings if needed

## Drill cadence

- Quarterly restore drill on staging
- Document RTO/RPO targets (suggested RPO ≤ 24h, RTO ≤ 4h)
