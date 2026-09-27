import { Languages, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import type { TranslateLang, TranslateSource } from '@/services/translateApi';

const ALL_LANGS: TranslateLang[] = ['ja', 'en', 'id'];

interface AutoTranslateButtonsProps {
  /** Which slot ('ja' | 'en' | 'id') is currently treated as the source
   * text — always concrete, even when `sourceOption` is 'auto'. Drives
   * which 2 target buttons are shown (the source's own language is never
   * offered as a target). */
  sourceSlot: TranslateLang;
  /** The value shown in the "原文言語" select: an explicit language, or
   * 'auto' to let the backend detect it from the text. */
  sourceOption: TranslateSource;
  onSourceOptionChange: (value: TranslateSource) => void;
  translating?: boolean;
  disabled?: boolean;
  onTranslate: (target: TranslateLang) => void | Promise<void>;
  hint?: string;
}

/** One-click draft translation for admin CMS forms: pick a source
 * language (or auto-detect) and translate into either of the other two. */
export default function AutoTranslateButtons({
  sourceSlot,
  sourceOption,
  onSourceOptionChange,
  translating = false,
  disabled = false,
  onTranslate,
  hint,
}: AutoTranslateButtonsProps) {
  const { t } = useTranslation();
  const resolvedHint = hint ?? t('admin.common.translateHint');
  const targets = ALL_LANGS.filter((lang) => lang !== sourceSlot);

  const langLabel: Record<TranslateLang, string> = {
    ja: t('admin.common.japanese'),
    en: t('admin.common.english'),
    id: t('admin.common.indonesian'),
  };
  const targetKey: Record<TranslateLang, string> = {
    ja: 'admin.common.translateToJa',
    en: 'admin.common.translateToEn',
    id: 'admin.common.translateToId',
  };

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">
          {t('admin.common.sourceLanguage')}
        </span>
        <select
          value={sourceOption}
          onChange={(event) =>
            onSourceOptionChange(event.target.value as TranslateSource)
          }
          disabled={disabled || translating}
          className="touch-input w-full max-w-xs rounded-2xl border border-border bg-primary-bg/60 px-3 text-sm text-white outline-none"
        >
          <option value="auto">{t('admin.common.autoDetect')}</option>
          <option value="ja">{langLabel.ja}</option>
          <option value="en">{langLabel.en}</option>
          <option value="id">{langLabel.id}</option>
        </select>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        {targets.map((target) => (
          <Button
            key={target}
            type="button"
            variant="secondary"
            disabled={disabled || translating}
            className="w-full sm:w-auto"
            onClick={() => void onTranslate(target)}
          >
            {translating ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Languages size={16} />
            )}
            {t(targetKey[target])}
          </Button>
        ))}
      </div>
      {resolvedHint ? <p className="text-xs text-muted">{resolvedHint}</p> : null}
    </div>
  );
}
