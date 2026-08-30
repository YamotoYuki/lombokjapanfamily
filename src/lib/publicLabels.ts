import type { TFunction } from 'i18next';

/** Map stored gallery/video category names to i18n keys. */
const CATEGORY_KEYS: Record<string, string> = {
  // Recommended production set
  Family: 'gallery.categories.family',
  'Japan Life': 'gallery.categories.japanLife',
  Lombok: 'gallery.categories.lombok',
  Travel: 'gallery.categories.travel',
  Food: 'gallery.categories.food',
  Events: 'gallery.categories.events',
  Other: 'gallery.categories.other',
  // Legacy Japanese / older seeds
  旅行: 'gallery.categories.travel',
  日常: 'gallery.categories.daily',
  イベント: 'gallery.categories.events',
  子供: 'gallery.categories.kids',
  インドネシア: 'gallery.categories.lombok',
  日本: 'gallery.categories.japanLife',
  家族: 'gallery.categories.family',
  Vlog: 'gallery.categories.vlog',
  国際結婚: 'gallery.categories.marriage',
  文化: 'gallery.categories.culture',
  未分類: 'gallery.categories.other',
};

const ROLE_KEYS: Record<string, string> = {
  father: 'family.roles.father',
  mother: 'family.roles.mother',
  parent: 'family.roles.parent',
  child: 'family.roles.child',
  son: 'family.roles.son',
  daughter: 'family.roles.daughter',
  kid: 'family.roles.child',
  kids: 'family.roles.child',
  boy: 'family.roles.son',
  girl: 'family.roles.daughter',
  父: 'family.roles.father',
  母: 'family.roles.mother',
  子ども: 'family.roles.child',
  子供: 'family.roles.child',
  息子: 'family.roles.son',
  娘: 'family.roles.daughter',
  長男: 'family.roles.son',
  次男: 'family.roles.son',
  三男: 'family.roles.son',
  長女: 'family.roles.daughter',
  次女: 'family.roles.daughter',
  三女: 'family.roles.daughter',
  grandfather: 'family.roles.grandfather',
  grandmother: 'family.roles.grandmother',
  祖父: 'family.roles.grandfather',
  祖母: 'family.roles.grandmother',
};

export function translateCategoryName(
  name: string | null | undefined,
  t: TFunction,
): string {
  const text = (name || '').trim();
  if (!text) return t('gallery.categories.other');
  const direct = CATEGORY_KEYS[text];
  if (direct) return t(direct);
  const found = Object.entries(CATEGORY_KEYS).find(
    ([label]) => label.toLowerCase() === text.toLowerCase(),
  );
  return found ? t(found[1]) : text;
}

export function translateFamilyRole(
  role: string | null | undefined,
  t: TFunction,
): string {
  const text = (role || '').trim();
  if (!text) return '';
  const key = ROLE_KEYS[text.toLowerCase()] || ROLE_KEYS[text];
  return key ? t(key) : text;
}

export function appLocale(lang?: string): string {
  const code = (lang || 'ja').slice(0, 2);
  if (code === 'en') return 'en-US';
  if (code === 'id') return 'id-ID';
  return 'ja-JP';
}
