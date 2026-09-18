import {
  Baby,
  CalendarDays,
  Clapperboard,
  Coffee,
  Heart,
  MapPin,
  Megaphone,
  Mountain,
  Palette,
  Plane,
  Tag,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  travel: Plane,
  daily: Coffee,
  event: CalendarDays,
  events: CalendarDays,
  kids: Baby,
  indonesia: MapPin,
  japan: Mountain,
  'japan-life': Mountain,
  'international-marriage': Heart,
  marriage: Heart,
  culture: Palette,
  vlog: Clapperboard,
  blog: Clapperboard,
  news: Megaphone,
};

export function categoryIcon(slug?: string | null): LucideIcon {
  const key = (slug || '').trim().toLowerCase();
  return CATEGORY_ICONS[key] || Tag;
}
