import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/locales/en/translation.json';
import id from '@/locales/id/translation.json';
import ja from '@/locales/ja/translation.json';

export const SUPPORTED_LANGS = ['ja', 'id', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGS)[number];

export const LANG_STORAGE_KEY = 'ljf_lang';

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'ja' || value === 'id' || value === 'en';
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      id: { translation: id },
      en: { translation: en },
    },
    fallbackLng: 'ja',
    supportedLngs: [...SUPPORTED_LANGS],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

export function setAppLanguage(lang: AppLanguage) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  return i18n.changeLanguage(lang);
}

export function restorePublicLanguage() {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  const lang: AppLanguage = isAppLanguage(saved) ? saved : 'ja';
  document.documentElement.lang = lang;
  return i18n.changeLanguage(lang);
}

/** Keep Admin Japanese without overwriting the public language preference. */
export async function forceAdminJapanese() {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  document.documentElement.lang = 'ja';
  await i18n.changeLanguage('ja');
  if (isAppLanguage(saved)) {
    localStorage.setItem(LANG_STORAGE_KEY, saved);
  } else {
    localStorage.removeItem(LANG_STORAGE_KEY);
  }
}

export default i18n;
