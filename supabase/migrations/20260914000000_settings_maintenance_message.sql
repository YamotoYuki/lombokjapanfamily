-- Per-language custom message shown on the public maintenance screen.
-- NULL/empty falls back to the existing static maintenance.body i18n text.

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS maintenance_message_ja TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_message_en TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_message_id TEXT;
