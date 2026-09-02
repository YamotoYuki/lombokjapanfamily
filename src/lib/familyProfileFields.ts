/** Profile extras stored in description when DB enrich columns are absent. */

export type FamilyProfileExtras = {
  nickname?: string;
  age?: string;
  hometown?: string;
  currentLocation?: string;
  languages?: string;
  hobbies?: string;
  favoriteMovie?: string;
  favoriteAnime?: string;
  favoriteFood?: string;
  favoriteDrink?: string;
  favoriteMusic?: string;
  favoriteJapan?: string;
  favoriteIndonesia?: string;
  dream?: string;
  message?: string;
};

/** Localized free-text bag (en / id). Kept in description when DB column is absent. */
export type FamilyDescriptionTranslations = {
  en?: Record<string, string>;
  id?: Record<string, string>;
};

type ExtraKey = keyof FamilyProfileExtras;

/** Sentinel label for packing translations into description (DB-column fallback). */
export const FAMILY_TRANSLATIONS_LABEL = '__translations__';

/** First label is the canonical write label (Japanese). */
const FIELD_DEFS: { key: ExtraKey; labels: string[] }[] = [
  { key: 'nickname', labels: ['ニックネーム', 'Nickname'] },
  { key: 'age', labels: ['年齢', 'Age'] },
  { key: 'hometown', labels: ['出身地', 'Hometown'] },
  {
    key: 'currentLocation',
    labels: ['居住地', '現在の居住地', 'Current location', 'Location'],
  },
  { key: 'languages', labels: ['使用言語', '言語', 'Languages'] },
  { key: 'hobbies', labels: ['趣味', 'Hobbies'] },
  { key: 'favoriteMovie', labels: ['好きな映画', 'Favorite movie'] },
  { key: 'favoriteAnime', labels: ['好きなアニメ', 'Favorite anime'] },
  { key: 'favoriteFood', labels: ['好きな食べ物', 'Favorite food'] },
  { key: 'favoriteDrink', labels: ['好きな飲み物', 'Favorite drink'] },
  { key: 'favoriteMusic', labels: ['好きな音楽', 'Favorite music'] },
  {
    key: 'favoriteJapan',
    labels: [
      '好きな日本の場所',
      '好きな日本のもの',
      'Favorite Japan',
      'Favorite place in Japan',
    ],
  },
  {
    key: 'favoriteIndonesia',
    labels: [
      '好きなインドネシアの場所',
      '好きなインドネシアのもの',
      'Favorite Indonesia',
      'Favorite place in Indonesia',
    ],
  },
  { key: 'dream', labels: ['将来の夢', 'Dream'] },
  { key: 'message', labels: ['一言メッセージ', 'Message'] },
];

const LABEL_TO_KEY = new Map<string, ExtraKey>();
for (const def of FIELD_DEFS) {
  for (const label of def.labels) {
    LABEL_TO_KEY.set(label.toLowerCase(), def.key);
  }
}

function canonicalLabel(key: ExtraKey): string {
  return FIELD_DEFS.find((def) => def.key === key)?.labels[0] ?? key;
}

function cleanTranslationBag(
  bag: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!bag) return undefined;
  const cleaned: Record<string, string> = {};
  Object.entries(bag).forEach(([field, value]) => {
    const text = (value ?? '').trim();
    if (text) cleaned[field] = text;
  });
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export function cleanFamilyTranslations(
  translations?: FamilyDescriptionTranslations | null,
): FamilyDescriptionTranslations {
  const result: FamilyDescriptionTranslations = {};
  const en = cleanTranslationBag(translations?.en);
  const id = cleanTranslationBag(translations?.id);
  if (en) result.en = en;
  if (id) result.id = id;
  return result;
}

function parsePackedTranslations(
  raw: string,
): FamilyDescriptionTranslations | undefined {
  try {
    const parsed = JSON.parse(raw) as FamilyDescriptionTranslations;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return undefined;
    }
    return cleanFamilyTranslations(parsed);
  } catch {
    return undefined;
  }
}

export function parseFamilyDescription(description?: string | null): {
  bio: string;
  extras: FamilyProfileExtras;
  translations: FamilyDescriptionTranslations;
} {
  const extras: FamilyProfileExtras = {};
  const bioLines: string[] = [];
  let translations: FamilyDescriptionTranslations = {};
  const text = (description || '').replace(/\r\n/g, '\n');

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      if (bioLines.length > 0) bioLines.push('');
      continue;
    }
    const match = line.match(/^([^:：]{1,80})[:：]\s*(.+)$/);
    if (match) {
      const label = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (label === FAMILY_TRANSLATIONS_LABEL && value) {
        translations = parsePackedTranslations(value) ?? translations;
        continue;
      }
      const key = LABEL_TO_KEY.get(label);
      if (key && value) {
        if (!extras[key]) extras[key] = value;
        continue;
      }
    }
    bioLines.push(rawLine.trimEnd());
  }

  return {
    bio: bioLines.join('\n').trim(),
    extras,
    translations,
  };
}

export function encodeFamilyDescription(
  bio: string,
  extras: FamilyProfileExtras,
  translations?: FamilyDescriptionTranslations | null,
): string {
  const parts: string[] = [];
  const cleanBio = bio.trim();
  if (cleanBio) parts.push(cleanBio);

  const order: ExtraKey[] = FIELD_DEFS.map((def) => def.key);
  for (const key of order) {
    const value = extras[key]?.trim();
    if (!value) continue;
    parts.push(`${canonicalLabel(key)}: ${value}`);
  }

  const cleanedTranslations = cleanFamilyTranslations(translations);
  if (Object.keys(cleanedTranslations).length > 0) {
    // Single-line JSON so parseFamilyDescription can recover it when the
    // family_profiles.translations column is not available yet.
    parts.push(
      `${FAMILY_TRANSLATIONS_LABEL}: ${JSON.stringify(cleanedTranslations)}`,
    );
  }

  return parts.join('\n');
}

export function pickExtra(
  columnValue: string | null | undefined,
  parsedValue: string | undefined,
): string | undefined {
  const clean = (value?: string | null) => {
    const text = value?.trim();
    if (!text || text === '未設定') return undefined;
    return text;
  };
  return clean(columnValue) ?? clean(parsedValue);
}

export function mergeFamilyTranslations(
  columnValue?: FamilyDescriptionTranslations | null,
  packedValue?: FamilyDescriptionTranslations | null,
): FamilyDescriptionTranslations {
  const fromColumn = cleanFamilyTranslations(columnValue);
  if (Object.keys(fromColumn).length > 0) return fromColumn;
  return cleanFamilyTranslations(packedValue);
}
