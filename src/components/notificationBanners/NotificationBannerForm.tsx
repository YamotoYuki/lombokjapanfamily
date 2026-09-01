import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AutoTranslateButtons } from '@/components/admin';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { translateJaFields } from '@/services/translateApi';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  type NotificationBanner,
  type NotificationBannerInput,
} from '@/types/notificationBanner';

interface NotificationBannerFormProps {
  initial?: NotificationBanner | null;
  saving?: boolean;
  dualSave?: boolean;
  onSubmit: (
    input: NotificationBannerInput,
    meta?: { continueEditing?: boolean },
  ) => Promise<void>;
  onCancel?: () => void;
}

type FormState = {
  title_ja: string;
  title_en: string;
  title_id: string;
  message_ja: string;
  message_en: string;
  message_id: string;
  link_url: string;
  publish_start_at_local: string;
  publish_end_at_local: string;
  is_active: boolean;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
      {children}
    </p>
  );
}

const emptyForm = (): FormState => ({
  title_ja: '',
  title_en: '',
  title_id: '',
  message_ja: '',
  message_en: '',
  message_id: '',
  link_url: '',
  publish_start_at_local: '',
  publish_end_at_local: '',
  is_active: true,
});

export default function NotificationBannerForm({
  initial,
  saving,
  dualSave = false,
  onSubmit,
  onCancel,
}: NotificationBannerFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setForm(emptyForm());
      setError(null);
      return;
    }
    setForm({
      title_ja: initial.title_ja || '',
      title_en: initial.title_en || '',
      title_id: initial.title_id || '',
      message_ja: initial.message_ja || '',
      message_en: initial.message_en || '',
      message_id: initial.message_id || '',
      link_url: initial.link_url ?? '',
      publish_start_at_local: toDatetimeLocalValue(initial.publish_start_at),
      publish_end_at_local: toDatetimeLocalValue(initial.publish_end_at),
      is_active: initial.is_active,
    });
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on identity + server timestamp
  }, [initial?.id, initial?.updated_at]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAutoTranslate = async (target: 'en' | 'id') => {
    setError(null);
    setTranslateNote(null);
    if (!form.title_ja.trim() && !form.message_ja.trim()) {
      setError(t('admin.banners.translateNeedJa'));
      return;
    }
    setTranslating(true);
    try {
      const result = await translateJaFields(
        {
          title: form.title_ja,
          message: form.message_ja,
        },
        target,
      );
      if (target === 'en') {
        setForm((prev) => ({
          ...prev,
          title_en: result.title || prev.title_en,
          message_en: result.message || prev.message_en,
        }));
        setTranslateNote(t('admin.common.translatedToEn'));
      } else {
        setForm((prev) => ({
          ...prev,
          title_id: result.title || prev.title_id,
          message_id: result.message || prev.message_id,
        }));
        setTranslateNote(t('admin.common.translatedToId'));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.common.translateFailed'),
      );
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent, stay = false) => {
    event.preventDefault();
    setError(null);
    if (!form.title_ja.trim()) {
      setError(t('admin.common.titleJaRequired'));
      return;
    }
    try {
      await onSubmit(
        {
          title_ja: form.title_ja.trim(),
          title_en: form.title_en.trim() || null,
          title_id: form.title_id.trim() || null,
          message_ja: form.message_ja,
          message_en: form.message_en.trim() || null,
          message_id: form.message_id.trim() || null,
          link_url: form.link_url.trim() || null,
          publish_start_at: fromDatetimeLocalValue(form.publish_start_at_local),
          publish_end_at: fromDatetimeLocalValue(form.publish_end_at_local),
          is_active: form.is_active,
        },
        { continueEditing: stay },
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.banners.saveFailed'),
      );
    }
  };

  return (
    <Card glass={false}>
      <form
        className="space-y-6"
        onSubmit={(event) => void handleSubmit(event, false)}
      >
        <div className="space-y-3">
          <SectionTitle>{t('admin.common.multilingual')}</SectionTitle>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-gold">
              {t('admin.common.japanese')}
            </p>
            <Input
              label={`${t('admin.common.titleJa')}*`}
              value={form.title_ja}
              onChange={(event) => setField('title_ja', event.target.value)}
            />
            <Textarea
              label={t('admin.banners.messageJa')}
              value={form.message_ja}
              onChange={(event) => setField('message_ja', event.target.value)}
              rows={3}
            />
            <AutoTranslateButtons
              translating={translating}
              disabled={saving}
              onTranslate={handleAutoTranslate}
            />
          </div>
          {translateNote ? (
            <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-amber-100">
              {translateNote}
            </p>
          ) : null}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-gold">
              {t('admin.common.english')}
            </p>
            <Input
              label={t('admin.common.titleEn')}
              value={form.title_en}
              onChange={(event) => setField('title_en', event.target.value)}
              placeholder={t('admin.common.emptyFallsBackToJa')}
            />
            <Textarea
              label={t('admin.banners.messageEn')}
              value={form.message_en}
              onChange={(event) => setField('message_en', event.target.value)}
              rows={3}
              placeholder={t('admin.common.emptyFallsBackToJa')}
            />
          </div>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-gold">
              {t('admin.common.indonesian')}
            </p>
            <Input
              label={t('admin.common.titleId')}
              value={form.title_id}
              onChange={(event) => setField('title_id', event.target.value)}
              placeholder={t('admin.common.emptyFallsBackToJa')}
            />
            <Textarea
              label={t('admin.banners.messageId')}
              value={form.message_id}
              onChange={(event) => setField('message_id', event.target.value)}
              rows={3}
              placeholder={t('admin.common.emptyFallsBackToJa')}
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>{t('admin.banners.linkAndPeriod')}</SectionTitle>
          <Input
            label={t('admin.banners.linkUrl')}
            value={form.link_url}
            onChange={(event) => setField('link_url', event.target.value)}
            placeholder={t('admin.banners.linkPlaceholder')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('admin.common.publishStart')}
              type="datetime-local"
              value={form.publish_start_at_local}
              onChange={(event) =>
                setField('publish_start_at_local', event.target.value)
              }
            />
            <Input
              label={t('admin.common.publishEnd')}
              type="datetime-local"
              value={form.publish_end_at_local}
              onChange={(event) =>
                setField('publish_end_at_local', event.target.value)
              }
            />
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setField('is_active', event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-primary-bg"
            />
            {t('admin.common.enable')}
          </label>
        </div>

        {error ? (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap">
          <Button type="submit" disabled={saving || translating} className="w-full sm:w-auto">
            {saving
              ? t('admin.common.saving')
              : dualSave
                ? t('admin.common.saveAndReturn')
                : t('admin.common.save')}
          </Button>
          {dualSave ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving || translating}
              className="w-full sm:w-auto"
              onClick={(event) => void handleSubmit(event, true)}
            >
              {t('admin.common.continueEditing')}
            </Button>
          ) : null}
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              disabled={saving || translating}
              className="w-full sm:w-auto"
              onClick={onCancel}
            >
              {t('admin.common.cancel')}
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
