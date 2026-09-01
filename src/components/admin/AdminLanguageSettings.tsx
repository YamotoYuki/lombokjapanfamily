import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import {
  SUPPORTED_LANGS,
  setAppLanguage,
  type AppLanguage,
} from '@/i18n';

interface AdminLanguageSettingsProps {
  className?: string;
}

/**
 * CMS display-language preference (localStorage `ljf_lang`).
 * Shared with the public site; not a server-side Settings field.
 */
export default function AdminLanguageSettings({
  className = '',
}: AdminLanguageSettingsProps) {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || 'ja').slice(
    0,
    2,
  ) as AppLanguage;

  return (
    <div
      className={[
        'rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4',
        className,
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Languages size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">
            {t('admin.language.title')}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t('admin.language.description')}
          </p>
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="group"
            aria-label={t('language.label')}
          >
            {SUPPORTED_LANGS.map((lang) => {
              const active = current === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => void setAppLanguage(lang)}
                  aria-pressed={active}
                  className={[
                    'touch-target rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'border-gold/50 bg-gold/15 text-gold'
                      : 'border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:text-white',
                  ].join(' ')}
                >
                  {t(`language.${lang}`)}
                  <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted">
                    {lang}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
