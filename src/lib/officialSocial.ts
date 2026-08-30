import {
  Facebook,
  Instagram,
  Music2,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import {
  OFFICIAL_FACEBOOK_URL,
  OFFICIAL_INSTAGRAM_URL,
  OFFICIAL_TIKTOK_URL,
  OFFICIAL_YOUTUBE_URL,
} from '@/data/officialSocial';
import type { Settings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

export type OfficialSocialLink = {
  id: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'x';
  label: string;
  href: string;
  icon: LucideIcon;
  accentClass: string;
};

function firstUrl(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = value?.trim();
    if (text) return text;
  }
  return '';
}

/**
 * Shared official SNS links for Footer + TOP OfficialSocialSection.
 * Prefers Settings values; falls back to DEFAULT_SETTINGS / brand defaults.
 * Only links with a resolved URL are returned.
 *
 * TOP section shows the four primary platforms (excludes X) so the row stays even.
 */
export function getOfficialSocialLinks(
  settings?: Settings | null,
  options?: { includeX?: boolean },
): OfficialSocialLink[] {
  const includeX = options?.includeX ?? true;
  const candidates: OfficialSocialLink[] = [
    {
      id: 'youtube',
      label: 'YouTube',
      href: firstUrl(
        settings?.youtube_url,
        settings?.youtube_channel_url,
        DEFAULT_SETTINGS.youtube_channel_url,
        OFFICIAL_YOUTUBE_URL,
      ),
      icon: Youtube,
      accentClass:
        'hover:border-youtube-red/50 hover:bg-youtube-red/15 hover:text-youtube-red',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      href: firstUrl(
        settings?.instagram_url,
        DEFAULT_SETTINGS.instagram_url,
        OFFICIAL_INSTAGRAM_URL,
      ),
      icon: Instagram,
      accentClass: 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      href: firstUrl(
        settings?.tiktok_url,
        DEFAULT_SETTINGS.tiktok_url,
        OFFICIAL_TIKTOK_URL,
      ),
      icon: Music2,
      accentClass: 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: firstUrl(
        settings?.facebook_url,
        DEFAULT_SETTINGS.facebook_url,
        OFFICIAL_FACEBOOK_URL,
      ),
      icon: Facebook,
      accentClass: 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold',
    },
  ];

  if (includeX) {
    candidates.push({
      id: 'x',
      label: 'X',
      href: firstUrl(settings?.x_url, DEFAULT_SETTINGS.x_url),
      icon: Twitter,
      accentClass: 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold',
    });
  }

  return candidates.filter((item) => Boolean(item.href));
}
