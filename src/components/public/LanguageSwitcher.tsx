import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Languages } from 'lucide-react';
import {
  SUPPORTED_LANGS,
  setAppLanguage,
  type AppLanguage,
} from '@/i18n';

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export default function LanguageSwitcher({
  className = '',
  compact = false,
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = (i18n.resolvedLanguage || i18n.language || 'ja').slice(
    0,
    2,
  ) as AppLanguage;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const select = (lang: AppLanguage) => {
    void setAppLanguage(lang);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={['relative', className].join(' ')}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('language.label')}
        aria-expanded={open}
        className={[
          'touch-target inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 text-sm font-medium text-white/85 transition-all hover:border-gold/40 hover:text-white',
          compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
        ].join(' ')}
      >
        <Languages size={16} aria-hidden />
        <span className={compact ? 'hidden sm:inline' : ''}>
          {t(`language.${current}`)}
        </span>
        <span className={compact ? 'sm:hidden' : 'hidden'}>
          {current.toUpperCase()}
        </span>
        <ChevronDown
          size={14}
          className={[
            'text-muted transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-white/10 bg-primary-bg/95 py-1 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {SUPPORTED_LANGS.map((lang) => {
            const active = current === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => select(lang)}
                className={[
                  'flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors',
                  active
                    ? 'bg-youtube-red/15 text-gold'
                    : 'text-white/80 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                <span>{t(`language.${lang}`)}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted">
                  {lang}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
