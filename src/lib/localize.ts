import type { AppContentLang } from '@/types/announcement';
import { normalizeContentLang } from '@/types/announcement';

/** Pick localized CMS text with Japanese fallback. */
export function pickLocalized(
  lang: string | null | undefined,
  values: {
    ja?: string | null;
    en?: string | null;
    id?: string | null;
  },
): string {
  const code = normalizeContentLang(lang);
  if (code === 'en') {
    return (values.en?.trim() || values.ja?.trim() || '');
  }
  if (code === 'id') {
    return (values.id?.trim() || values.ja?.trim() || '');
  }
  return values.ja?.trim() || '';
}

export type { AppContentLang };
