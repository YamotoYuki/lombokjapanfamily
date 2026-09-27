import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminStickyActions, AutoTranslateButtons } from '@/components/admin';
import AnnouncementImageUploader from '@/components/announcements/AnnouncementImageUploader';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { useAnnouncementStats } from '@/hooks/useAnnouncements';
import {
  translateFields,
  type TranslateLang,
  type TranslateSource,
} from '@/services/translateApi';
import {
  ANNOUNCEMENT_CATEGORIES,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  type Announcement,
  type AnnouncementCategory,
  type AnnouncementInput,
} from '@/types/announcement';

interface AnnouncementFormProps {
  initial?: Announcement | null;
  saving?: boolean;
  dualSave?: boolean;
  onSubmit: (
    input: AnnouncementInput,
    meta?: { continueEditing?: boolean },
  ) => Promise<void>;
  onCancel?: () => void;
}

type FormState = {
  title_ja: string;
  title_en: string;
  title_id: string;
  content_ja: string;
  content_en: string;
  content_id: string;
  category: AnnouncementCategory;
  published_at_local: string;
  featured_image: string;
  youtube_url: string;
  is_featured: boolean;
  is_published: boolean;
  publish_start_at_local: string;
  publish_end_at_local: string;
};

type LangTab = 'ja' | 'en' | 'id';

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
  content_ja: '',
  content_en: '',
  content_id: '',
  category: 'announcement',
  published_at_local: toDatetimeLocalValue(new Date().toISOString()),
  featured_image: '',
  youtube_url: '',
  is_featured: false,
  is_published: true,
  publish_start_at_local: '',
  publish_end_at_local: '',
});

export default function AnnouncementForm({
  initial,
  saving,
  dualSave = false,
  onSubmit,
  onCancel,
}: AnnouncementFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [langTab, setLangTab] = useState<LangTab>('ja');
  const [sourceOption, setSourceOption] = useState<TranslateSource>('ja');
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState<string | null>(null);
  const statsQuery = useAnnouncementStats();
  // Mirrors ANNOUNCEMENT_FEATURED_LIMIT in backend/services/announcement_service.py
  // — a client-side pre-check; the backend still enforces this authoritatively.
  const ANNOUNCEMENT_FEATURED_LIMIT = 3;
  const featuredCount = statsQuery.data?.featured_count ?? 0;

  const langTabs: { id: LangTab; label: string }[] = [
    { id: 'ja', label: t('admin.common.japanese') },
    { id: 'en', label: t('admin.common.english') },
    { id: 'id', label: t('admin.common.indonesian') },
  ];

  useEffect(() => {
    if (!initial) {
      setForm(emptyForm());
      setError(null);
      setTranslateNote(null);
      setLangTab('ja');
      return;
    }
    setForm({
      title_ja: initial.title_ja || initial.title || '',
      title_en: initial.title_en || '',
      title_id: initial.title_id || '',
      content_ja: initial.content_ja || initial.content || '',
      content_en: initial.content_en || '',
      content_id: initial.content_id || '',
      category: initial.category,
      published_at_local: toDatetimeLocalValue(initial.published_at),
      featured_image: initial.featured_image ?? '',
      youtube_url: initial.youtube_url ?? '',
      is_featured: initial.is_featured,
      is_published: initial.is_published,
      publish_start_at_local: toDatetimeLocalValue(initial.publish_start_at),
      publish_end_at_local: toDatetimeLocalValue(initial.publish_end_at),
    });
    setError(null);
    setTranslateNote(null);
    setLangTab('ja');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on identity + server timestamp
  }, [initial?.id, initial?.updated_at]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const SOURCE_FIELDS: Record<LangTab, () => Record<string, string>> = {
    ja: () => ({ title: form.title_ja, content: form.content_ja }),
    en: () => ({ title: form.title_en, content: form.content_en }),
    id: () => ({ title: form.title_id, content: form.content_id }),
  };

  const TRANSLATED_NOTE_KEY: Record<LangTab, string> = {
    ja: 'admin.common.translatedToJa',
    en: 'admin.common.translatedToEn',
    id: 'admin.common.translatedToId',
  };

  const handleAutoTranslate = async (target: TranslateLang) => {
    const hadPreviousError = Boolean(error);
    setError(null);
    setTranslateNote(null);
    const sourceFields = SOURCE_FIELDS[langTab]();
    if (!Object.values(sourceFields).some((value) => value.trim())) {
      setError(t('admin.common.translateNeedJa'));
      return;
    }
    setTranslating(true);
    try {
      const result = await translateFields(sourceFields, {
        source: sourceOption,
        target,
      });
      if (target === 'ja') {
        setForm((prev) => ({
          ...prev,
          title_ja: result.fields.title || prev.title_ja,
          content_ja: result.fields.content || prev.content_ja,
        }));
      } else if (target === 'en') {
        setForm((prev) => ({
          ...prev,
          title_en: result.fields.title || prev.title_en,
          content_en: result.fields.content || prev.content_en,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          title_id: result.fields.title || prev.title_id,
          content_id: result.fields.content || prev.content_id,
        }));
      }
      setLangTab(target);
      setSourceOption(target);
      setTranslateNote(
        hadPreviousError
          ? t('admin.common.translateRecovered')
          : t(TRANSLATED_NOTE_KEY[target]),
      );
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
      setLangTab('ja');
      return;
    }
    if (
      form.is_featured &&
      !initial?.is_featured &&
      featuredCount >= ANNOUNCEMENT_FEATURED_LIMIT
    ) {
      setError(
        t('admin.announcements.featuredLimitReached', {
          limit: ANNOUNCEMENT_FEATURED_LIMIT,
        }),
      );
      return;
    }
    try {
      await onSubmit(
        {
          title_ja: form.title_ja.trim(),
          title_en: form.title_en.trim() || null,
          title_id: form.title_id.trim() || null,
          content_ja: form.content_ja,
          content_en: form.content_en.trim() || null,
          content_id: form.content_id.trim() || null,
          category: form.category,
          published_at: fromDatetimeLocalValue(form.published_at_local),
          featured_image: form.featured_image.trim() || null,
          youtube_url: form.youtube_url.trim() || null,
          is_featured: form.is_featured,
          is_published: form.is_published,
          publish_start_at: fromDatetimeLocalValue(form.publish_start_at_local),
          publish_end_at: fromDatetimeLocalValue(form.publish_end_at_local),
        },
        { continueEditing: stay },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.announcements.saveFailed'),
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
          <div
            className="scrollbar-thin flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1"
            role="tablist"
            aria-label={t('admin.common.languageSwitch')}
          >
            {langTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={langTab === tab.id}
                onClick={() => {
                  setLangTab(tab.id);
                  setSourceOption(tab.id);
                }}
                className={[
                  'touch-target min-h-11 shrink-0 flex-1 rounded-xl px-3 text-xs font-medium transition-colors sm:text-sm',
                  langTab === tab.id
                    ? 'bg-youtube-red/20 text-white'
                    : 'text-muted hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            {langTab === 'ja' ? (
              <>
                <Input
                  label={`${t('admin.common.titleJa')}*`}
                  value={form.title_ja}
                  onChange={(event) => setField('title_ja', event.target.value)}
                />
                <Textarea
                  label={t('admin.common.bodyJa')}
                  value={form.content_ja}
                  onChange={(event) =>
                    setField('content_ja', event.target.value)
                  }
                  rows={6}
                />
              </>
            ) : null}
            {langTab === 'en' ? (
              <>
                <Input
                  label={t('admin.common.titleEn')}
                  value={form.title_en}
                  onChange={(event) => setField('title_en', event.target.value)}
                  placeholder={t('admin.common.emptyFallsBackToJa')}
                />
                <Textarea
                  label={t('admin.common.bodyEn')}
                  value={form.content_en}
                  onChange={(event) =>
                    setField('content_en', event.target.value)
                  }
                  rows={6}
                  placeholder={t('admin.common.emptyFallsBackToJa')}
                />
              </>
            ) : null}
            {langTab === 'id' ? (
              <>
                <Input
                  label={t('admin.common.titleId')}
                  value={form.title_id}
                  onChange={(event) => setField('title_id', event.target.value)}
                  placeholder={t('admin.common.emptyFallsBackToJa')}
                />
                <Textarea
                  label={t('admin.common.bodyId')}
                  value={form.content_id}
                  onChange={(event) =>
                    setField('content_id', event.target.value)
                  }
                  rows={6}
                  placeholder={t('admin.common.emptyFallsBackToJa')}
                />
              </>
            ) : null}
            <AutoTranslateButtons
              sourceSlot={langTab}
              sourceOption={sourceOption}
              onSourceOptionChange={setSourceOption}
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
        </div>

        <div className="space-y-3">
          <SectionTitle>{t('admin.common.basicInfo')}</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">
                {t('admin.common.category')}
              </span>
              <select
                value={form.category}
                onChange={(event) =>
                  setField(
                    'category',
                    event.target.value as AnnouncementCategory,
                  )
                }
                className="min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-gold/40"
              >
                {ANNOUNCEMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="bg-primary-bg">
                    {t(`admin.announcements.categories.${category}`)}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label={t('admin.common.publishedAt')}
              type="datetime-local"
              value={form.published_at_local}
              onChange={(event) =>
                setField('published_at_local', event.target.value)
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>{t('admin.common.media')}</SectionTitle>
          <AnnouncementImageUploader
            value={form.featured_image}
            onChange={(url) => setField('featured_image', url)}
          />
          <Input
            label={t('admin.announcements.youtubeOptional')}
            value={form.youtube_url}
            onChange={(event) => setField('youtube_url', event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div className="space-y-3">
          <SectionTitle>{t('admin.common.displaySettings')}</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <p className="text-xs text-muted">
            {t('admin.announcements.publishWindowHint')}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="touch-target flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) =>
                  setField('is_published', event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-primary-bg"
              />
              {t('admin.common.publish')}
            </label>
            <label
              className="touch-target flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted"
              title={t('admin.announcements.tipFeatured')}
            >
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) =>
                  setField('is_featured', event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-primary-bg"
              />
              {t('admin.common.featuredHighlight')}
            </label>
          </div>
        </div>

        {error ? (
          <div className="whitespace-pre-line rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <AdminStickyActions>
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
        </AdminStickyActions>
      </form>
    </Card>
  );
}
