-- STEP16 security audit: settings-assets bucket allowed SVG uploads at the
-- storage layer even though the application layer
-- (backend/utils/validators.py: ALLOWED_SETTINGS_ASSET_MIME) has never
-- allowed image/svg+xml since the BUG-006 fix (stored XSS via SVG upload).
-- This left the Storage bucket itself as an unguarded fallback if a future
-- code path wrote to Storage without going through the app-level validator.
--
-- Idempotent: re-running this migration is safe. Only the settings-assets
-- bucket's allowed_mime_types is touched; no other bucket is modified and no
-- existing objects are deleted.
--
-- Note: if any *.svg object was already uploaded to settings-assets before
-- this fix, this migration does not remove it — that requires a manual
-- check in the Supabase Storage dashboard (see audit report).

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon'
]
WHERE id = 'settings-assets';
