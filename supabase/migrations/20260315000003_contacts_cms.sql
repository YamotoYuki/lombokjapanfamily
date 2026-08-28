-- STEP7: Contact management extensions

-- Expand contact_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'contact_status' AND e.enumlabel = 'archived'
  ) THEN
    ALTER TYPE public.contact_status ADD VALUE 'archived';
  END IF;
END $$;

-- New enums
DO $$ BEGIN
  CREATE TYPE public.contact_type AS ENUM (
    'general', 'sponsor', 'collaboration', 'media', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_priority AS ENUM (
    'low', 'normal', 'high', 'urgent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_type public.contact_type NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS priority public.contact_priority NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Ensure subject is present
UPDATE public.contacts SET subject = '（件名なし）' WHERE subject IS NULL OR subject = '';
ALTER TABLE public.contacts ALTER COLUMN subject SET NOT NULL;

-- Replace text check if still present
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_status_check;

CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON public.contacts (contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_priority ON public.contacts (priority);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts (assigned_to);

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
