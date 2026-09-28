import { useState } from 'react';
import type { Settings } from '@/types/settings';
import { useTranslation } from 'react-i18next';
import { AdminLanguageSettings, AutoTranslateButtons } from '@/components/admin';
import { Textarea } from '@/components/ui';
import {
  translateFields,
  type TranslateLang,
  type TranslateSource,
} from '@/services/translateApi';

interface SystemSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

const TRANSLATED_NOTE_KEY: Record<TranslateLang, string> = {
  ja: 'admin.common.translatedToJa',
  en: 'admin.common.translatedToEn',
  id: 'admin.common.translatedToId',
};

export default function SystemSettings({ value, onChange }: SystemSettingsProps) {
  const { t } = useTranslation();
  const [sourceSlot, setSourceSlot] = useState<TranslateLang>('ja');
  const [sourceOption, setSourceOption] = useState<TranslateSource>('ja');
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState<string | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const handleSourceOptionChange = (next: TranslateSource) => {
    setSourceOption(next);
    if (next !== 'auto') setSourceSlot(next);
  };

  const sourceTextFor = (lang: TranslateLang): string => {
    if (lang === 'ja') return value.maintenance_message_ja ?? '';
    if (lang === 'en') return value.maintenance_message_en ?? '';
    return value.maintenance_message_id ?? '';
  };

  const handleAutoTranslate = async (target: TranslateLang) => {
    const hadPreviousError = Boolean(translateError);
    setTranslateError(null);
    setTranslateNote(null);
    const sourceText = sourceTextFor(sourceSlot);
    if (!sourceText.trim()) {
      setTranslateError(t('admin.settings.maintenanceTranslateNeed'));
      return;
    }
    setTranslating(true);
    try {
      const result = await translateFields(
        { message: sourceText },
        { source: sourceOption, target },
      );
      if (target === 'ja') {
        onChange({ maintenance_message_ja: result.fields.message });
      } else if (target === 'en') {
        onChange({ maintenance_message_en: result.fields.message });
      } else {
        onChange({ maintenance_message_id: result.fields.message });
      }
      setSourceSlot(target);
      setSourceOption(target);
      setTranslateNote(
        hadPreviousError
          ? t('admin.common.translateRecovered')
          : t(TRANSLATED_NOTE_KEY[target]),
      );
    } catch (err) {
      setTranslateError(
        err instanceof Error ? err.message : t('admin.common.translateFailed'),
      );
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('admin.settings.systemTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {t('admin.settings.systemDescription')}
        </p>
      </div>

      <AdminLanguageSettings />

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
        <div>
          <p className="text-sm font-medium text-white">Maintenance Mode</p>
          <p className="mt-1 text-xs text-muted">
            {value.maintenance_mode
              ? t('admin.settings.maintenanceOn')
              : t('admin.settings.maintenanceOff')}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value.maintenance_mode}
          onClick={() => onChange({ maintenance_mode: !value.maintenance_mode })}
          className={[
            'relative h-8 w-14 rounded-full transition-colors',
            value.maintenance_mode ? 'bg-youtube-red' : 'bg-white/15',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 h-6 w-6 rounded-full bg-white transition-transform',
              value.maintenance_mode ? 'left-7' : 'left-1',
            ].join(' ')}
          />
        </button>
      </div>

      {value.maintenance_mode ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
          <div>
            <p className="text-sm font-medium text-white">
              {t('admin.settings.maintenanceMessageTitle')}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t('admin.settings.maintenanceMessageHint')}
            </p>
          </div>
          <Textarea
            label={t('admin.settings.maintenanceMessageJa')}
            value={value.maintenance_message_ja ?? ''}
            onChange={(e) =>
              onChange({ maintenance_message_ja: e.target.value })
            }
            placeholder={t('admin.settings.maintenanceMessagePlaceholder')}
            rows={3}
          />
          <Textarea
            label={t('admin.settings.maintenanceMessageEn')}
            value={value.maintenance_message_en ?? ''}
            onChange={(e) =>
              onChange({ maintenance_message_en: e.target.value })
            }
            placeholder={t('admin.settings.maintenanceMessagePlaceholder')}
            rows={3}
          />
          <Textarea
            label={t('admin.settings.maintenanceMessageId')}
            value={value.maintenance_message_id ?? ''}
            onChange={(e) =>
              onChange({ maintenance_message_id: e.target.value })
            }
            placeholder={t('admin.settings.maintenanceMessagePlaceholder')}
            rows={3}
          />

          <AutoTranslateButtons
            sourceSlot={sourceSlot}
            sourceOption={sourceOption}
            onSourceOptionChange={handleSourceOptionChange}
            translating={translating}
            onTranslate={(target) => void handleAutoTranslate(target)}
          />
          {translateError ? (
            <p className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-xs text-red-200">
              {translateError}
            </p>
          ) : null}
          {translateNote ? (
            <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-amber-100">
              {translateNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
