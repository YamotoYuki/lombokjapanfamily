-- Remove CMS wording from public site description (footer / SEO fallback).
UPDATE public.settings
SET site_description = 'Official YouTube channel website',
    updated_at = NOW()
WHERE site_description = 'Official YouTube channel website and CMS';
