/** SNS URL helpers for Family profiles (existing DB columns only). */

export type FamilySnsField =
  | 'youtube_url'
  | 'instagram_url'
  | 'tiktok_url'
  | 'x_url';

const ALLOWED_HOSTS: Record<FamilySnsField, Set<string>> = {
  youtube_url: new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
  ]),
  instagram_url: new Set(['instagram.com', 'www.instagram.com']),
  tiktok_url: new Set(['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com']),
  x_url: new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com']),
};

export function normalizeOptionalUrl(
  value: string | null | undefined,
): string | null {
  const text = (value ?? '').trim();
  return text === '' ? null : text;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidFamilySnsUrl(
  field: FamilySnsField,
  value: string | null | undefined,
): boolean {
  const text = (value ?? '').trim();
  if (!text) return true;
  if (!isHttpUrl(text)) return false;
  try {
    const host = new URL(text).hostname.toLowerCase();
    return ALLOWED_HOSTS[field].has(host);
  } catch {
    return false;
  }
}

/** Only show saved, valid personal SNS links on public pages. */
export function isDisplayableSnsUrl(
  field: FamilySnsField,
  value: string | null | undefined,
): value is string {
  const text = (value ?? '').trim();
  if (!text) return false;
  return isValidFamilySnsUrl(field, text);
}

export function snsValidationError(
  field: FamilySnsField,
  value: string | null | undefined,
  invalidMessage: string,
): string | undefined {
  const text = (value ?? '').trim();
  if (!text) return undefined;
  return isValidFamilySnsUrl(field, text) ? undefined : invalidMessage;
}
