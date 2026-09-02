import type { PublicFamilyMember } from '@/types/public';
import {
  encodeFamilyDescription,
  mergeFamilyTranslations,
  parseFamilyDescription,
  pickExtra,
  type FamilyProfileExtras,
} from '@/lib/familyProfileFields';
import { normalizeContentLang } from '@/types/announcement';

/** Free-text fields that can be translated per language. */
export const FAMILY_TRANSLATABLE_FIELDS = [
  'name',
  'display_name',
  'nickname',
  'description',
  'hometown',
  'current_location',
  'languages',
  'hobbies',
  'favorite_movie',
  'favorite_anime',
  'favorite_food',
  'favorite_drink',
  'favorite_music',
  'favorite_japan',
  'favorite_indonesia',
  'dream',
  'message',
] as const;

export type FamilyTranslatableField =
  (typeof FAMILY_TRANSLATABLE_FIELDS)[number];

/** Localized values keyed by form field name; Japanese stays in the columns. */
export type FamilyTranslations = {
  en?: Record<string, string>;
  id?: Record<string, string>;
};

export type FamilyProfile = {
  id: string;
  name: string;
  display_name?: string;
  nickname?: string;
  role?: string;
  photo_url?: string;
  description?: string;
  hometown?: string;
  current_location?: string;
  languages?: string;
  hobbies?: string;
  favorite_food?: string;
  favorite_japan?: string;
  favorite_indonesia?: string;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  x_url?: string | null;
  display_order: number;
  is_visible: boolean;
  show_on_home?: boolean;
  translations?: FamilyTranslations;
  created_at: string;
  updated_at: string;
};

/** Frontend form model (extras may live only inside description). */
export type FamilyProfileInput = {
  name: string;
  display_name?: string | null;
  nickname?: string | null;
  age?: string | null;
  role?: string | null;
  photo_url?: string | null;
  /** Free-text bio only in the form UI; packed with extras on save. */
  description?: string | null;
  hometown?: string | null;
  current_location?: string | null;
  languages?: string | null;
  hobbies?: string | null;
  favorite_movie?: string | null;
  favorite_anime?: string | null;
  favorite_food?: string | null;
  favorite_drink?: string | null;
  favorite_music?: string | null;
  favorite_japan?: string | null;
  favorite_indonesia?: string | null;
  dream?: string | null;
  message?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  x_url?: string | null;
  display_order?: number;
  is_visible?: boolean;
  show_on_home?: boolean;
  translations?: FamilyTranslations;
};

export type FamilyReorderItem = {
  id: string;
  display_order: number;
};

export type FamilyStats = {
  total: number;
  visible_count: number;
  home_count?: number;
};

export type FamilyListParams = {
  visibleOnly?: boolean;
  showOnHome?: boolean;
};

export function familyDisplayName(
  profile: Pick<FamilyProfile, 'name' | 'display_name'>,
) {
  return (profile.display_name?.trim() || profile.name).trim();
}

export function shortFamilyIntro(text?: string, maxLength = 56) {
  const { bio } = parseFamilyDescription(text);
  const value = bio.trim();
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}…`;
}

export function extrasFromForm(
  input: Pick<
    FamilyProfileInput,
    | 'nickname'
    | 'age'
    | 'hometown'
    | 'current_location'
    | 'languages'
    | 'hobbies'
    | 'favorite_movie'
    | 'favorite_anime'
    | 'favorite_food'
    | 'favorite_drink'
    | 'favorite_music'
    | 'favorite_japan'
    | 'favorite_indonesia'
    | 'dream'
    | 'message'
  >,
): FamilyProfileExtras {
  const clean = (value?: string | null) => value?.trim() || undefined;
  return {
    nickname: clean(input.nickname),
    age: clean(input.age),
    hometown: clean(input.hometown),
    currentLocation: clean(input.current_location),
    languages: clean(input.languages),
    hobbies: clean(input.hobbies),
    favoriteMovie: clean(input.favorite_movie),
    favoriteAnime: clean(input.favorite_anime),
    favoriteFood: clean(input.favorite_food),
    favoriteDrink: clean(input.favorite_drink),
    favoriteMusic: clean(input.favorite_music),
    favoriteJapan: clean(input.favorite_japan),
    favoriteIndonesia: clean(input.favorite_indonesia),
    dream: clean(input.dream),
    message: clean(input.message),
  };
}

export function packFamilyDescription(input: FamilyProfileInput): string {
  return encodeFamilyDescription(
    input.description || '',
    extrasFromForm(input),
    input.translations,
  );
}

export function formValuesFromProfile(profile: FamilyProfile): FamilyProfileInput {
  const { bio, extras, translations: packedTranslations } =
    parseFamilyDescription(profile.description);
  return {
    name: profile.name,
    display_name: profile.display_name ?? '',
    nickname: pickExtra(profile.nickname, extras.nickname) ?? '',
    age: extras.age ?? '',
    role: profile.role ?? '',
    description: bio,
    hometown: pickExtra(profile.hometown, extras.hometown) ?? '',
    current_location:
      pickExtra(profile.current_location, extras.currentLocation) ?? '',
    languages: pickExtra(profile.languages, extras.languages) ?? '',
    hobbies: pickExtra(profile.hobbies, extras.hobbies) ?? '',
    favorite_movie: extras.favoriteMovie ?? '',
    favorite_anime: extras.favoriteAnime ?? '',
    favorite_food: pickExtra(profile.favorite_food, extras.favoriteFood) ?? '',
    favorite_drink: extras.favoriteDrink ?? '',
    favorite_music: extras.favoriteMusic ?? '',
    favorite_japan:
      pickExtra(profile.favorite_japan, extras.favoriteJapan) ?? '',
    favorite_indonesia:
      pickExtra(profile.favorite_indonesia, extras.favoriteIndonesia) ?? '',
    dream: extras.dream ?? '',
    message: extras.message ?? '',
    photo_url: profile.photo_url ?? '',
    instagram_url: profile.instagram_url ?? '',
    tiktok_url: profile.tiktok_url ?? '',
    youtube_url: profile.youtube_url ?? '',
    x_url: profile.x_url ?? '',
    display_order: profile.display_order,
    is_visible: profile.is_visible,
    show_on_home: profile.show_on_home ?? true,
    translations: mergeFamilyTranslations(
      profile.translations,
      packedTranslations,
    ),
  };
}

export function toPublicFamilyMember(
  profile: FamilyProfile,
  lang?: string | null,
): PublicFamilyMember {
  const { bio, extras, translations: packedTranslations } =
    parseFamilyDescription(profile.description);
  const translations = mergeFamilyTranslations(
    profile.translations,
    packedTranslations,
  );
  const code = normalizeContentLang(lang);
  const bag =
    code === 'en' || code === 'id' ? translations[code] || {} : {};
  const pickT = (key: FamilyTranslatableField, jaValue?: string) => {
    const localized = bag[key]?.trim();
    if (localized) return localized;
    return jaValue?.trim() || undefined;
  };
  const cleanExtra = (value?: string) =>
    value?.trim() && value.trim() !== '未設定' ? value.trim() : undefined;

  const jaHometown = pickExtra(profile.hometown, extras.hometown);
  const jaLocation = pickExtra(profile.current_location, extras.currentLocation);
  const jaLanguages = pickExtra(profile.languages, extras.languages);
  const jaHobbies = pickExtra(profile.hobbies, extras.hobbies);
  const jaFood = pickExtra(profile.favorite_food, extras.favoriteFood);
  const jaJapan = pickExtra(profile.favorite_japan, extras.favoriteJapan);
  const jaIndonesia = pickExtra(
    profile.favorite_indonesia,
    extras.favoriteIndonesia,
  );

  return {
    id: profile.id,
    name:
      pickT('display_name', undefined) ||
      pickT('name', familyDisplayName(profile)) ||
      familyDisplayName(profile),
    nickname: cleanExtra(
      pickT('nickname', pickExtra(profile.nickname, extras.nickname)) ||
        pickExtra(profile.nickname, extras.nickname),
    ),
    age: cleanExtra(extras.age),
    role: profile.role || '',
    bio: pickT('description', bio) || '',
    photoUrl: profile.photo_url || '',
    hometown: pickT('hometown', jaHometown),
    currentLocation: pickT('current_location', jaLocation),
    languages: pickT('languages', jaLanguages),
    hobbies: pickT('hobbies', jaHobbies),
    favoriteMovie: cleanExtra(
      pickT('favorite_movie', extras.favoriteMovie) || extras.favoriteMovie,
    ),
    favoriteAnime: cleanExtra(
      pickT('favorite_anime', extras.favoriteAnime) || extras.favoriteAnime,
    ),
    favoriteFood: pickT('favorite_food', jaFood),
    favoriteDrink: cleanExtra(
      pickT('favorite_drink', extras.favoriteDrink) || extras.favoriteDrink,
    ),
    favoriteMusic: cleanExtra(
      pickT('favorite_music', extras.favoriteMusic) || extras.favoriteMusic,
    ),
    favoriteJapan: pickT('favorite_japan', jaJapan),
    favoriteIndonesia: pickT('favorite_indonesia', jaIndonesia),
    dream: cleanExtra(pickT('dream', extras.dream) || extras.dream),
    message: cleanExtra(pickT('message', extras.message) || extras.message),
    instagram: profile.instagram_url || undefined,
    youtube: profile.youtube_url || undefined,
    tiktok: profile.tiktok_url || undefined,
    x: profile.x_url || undefined,
  };
}
