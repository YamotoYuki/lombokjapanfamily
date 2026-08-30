-- Recommended Gallery categories for production
-- Family / Japan Life / Lombok / Travel / Food / Events / Other

INSERT INTO public.gallery_categories (name, slug, description, display_order)
VALUES
  ('Family', 'family', 'Family moments', 1),
  ('Japan Life', 'japan-life', 'Life in Japan', 2),
  ('Lombok', 'lombok', 'Lombok scenes', 3),
  ('Travel', 'travel', 'Travel photos', 4),
  ('Food', 'food', 'Food and dining', 5),
  ('Events', 'events', 'Events and gatherings', 6),
  ('Other', 'other', 'Uncategorized / other', 99)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = timezone('utc', now());

-- Align legacy Japanese seed names to the recommended English set where slugs match.
UPDATE public.gallery_categories
SET name = 'Family',
    description = COALESCE(description, 'Family moments'),
    display_order = 1,
    updated_at = timezone('utc', now())
WHERE slug = 'family';

UPDATE public.gallery_categories
SET name = 'Travel',
    description = COALESCE(description, 'Travel photos'),
    display_order = 4,
    updated_at = timezone('utc', now())
WHERE slug = 'travel';

-- Prefer slug `events` for Events; keep legacy `event` rows pointing at Events label.
UPDATE public.gallery_categories
SET name = 'Events',
    description = COALESCE(description, 'Events and gatherings'),
    display_order = 6,
    updated_at = timezone('utc', now())
WHERE slug IN ('event', 'events');
