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

type ExtraKey = keyof FamilyProfileExtras;

/** First label is the canonical write label (Japanese). */
const FIELD_DEFS: { key: ExtraKey; labels: string[] }[] = [
  { key: 'nickname', labels: ['ニックネーム', 'Nickname'] },
  { key: 'age', labels: ['年齢', 'Age'] },
  { key: 'hometown', labels: ['出身地', 'Hometown'] },
  {
    key: 'currentLocation',
    labels: ['居住地', '現在の居住地', 'Current location', 'Location'],
  },
  { key: 'languages', labels: ['言語', 'Languages'] },
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

export function parseFamilyDescription(description?: string | null): {
  bio: string;
  extras: FamilyProfileExtras;
} {
  const extras: FamilyProfileExtras = {};
  const bioLines: string[] = [];
  const text = (description || '').replace(/\r\n/g, '\n');

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      if (bioLines.length > 0) bioLines.push('');
      continue;
    }
    const match = line.match(/^([^:：]{1,40})[:：]\s*(.+)$/);
    if (match) {
      const label = match[1].trim().toLowerCase();
      const value = match[2].trim();
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
  };
}

export function encodeFamilyDescription(
  bio: string,
  extras: FamilyProfileExtras,
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
