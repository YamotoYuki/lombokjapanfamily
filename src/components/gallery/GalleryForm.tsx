import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminStickyActions, AutoTranslateButtons } from '@/components/admin';
import GalleryImageUploader from '@/components/gallery/GalleryImageUploader';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { translateJaFields } from '@/services/translateApi';
import type {
  GalleryCategory,
  GalleryItem,
  GalleryItemInput,
} from '@/types/gallery';

interface GalleryFormProps {
  initial?: GalleryItem | null;
  categories: GalleryCategory[];
  saving?: boolean;
  uploading?: boolean;
  dualSave?: boolean;
  onUpload: (file: File, categorySlug?: string) => Promise<string>;
  onSubmit: (
    input: GalleryItemInput,
    meta?: { continueEditing?: boolean },
  ) => Promise<void>;
  onCancel?: () => void;
}

type LangTab = 'ja' | 'en' | 'id';

const empty: GalleryItemInput = {
  title: '',
  description: '',
  title_ja: '',
  title_en: '',
  title_id: '',
  description_ja: '',
  description_en: '',
  description_id: '',
  image_url: '',
  thumbnail_url: '',
  category_id: '',
  location: '',
  taken_at: '',
  display_order: 0,
  is_featured: false,
  is_visible: true,
};

export default function GalleryForm({
  initial,
  categories,
  saving,
  uploading,
  dualSave = false,
  onUpload,
  onSubmit,
  onCancel,
}: GalleryFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<GalleryItemInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [langTab, setLangTab] = useState<LangTab>('ja');
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState<string | null>(null);

  const langTabs: { id: LangTab; label: string }[] = [
    { id: 'ja', label: t('admin.common.japanese') },
    { id: 'en', label: t('admin.common.english') },
    { id: 'id', label: t('admin.common.indonesian') },
  ];

  useEffect(() => {
    if (!initial) {
      setForm(empty);
      setLangTab('ja');
      setTranslateNote(null);
      return;
    }
    const titleJa = initial.title_ja || initial.title || '';
    const descriptionJa = initial.description_ja || initial.description || '';
    setForm({
      title: titleJa,
      description: descriptionJa,
      title_ja: titleJa,
      title_en: initial.title_en ?? '',
      title_id: initial.title_id ?? '',
      description_ja: descriptionJa,
      description_en: initial.description_en ?? '',
      description_id: initial.description_id ?? '',
      image_url: initial.image_url ?? '',
      thumbnail_url: initial.thumbnail_url ?? initial.image_url ?? '',
      category_id: initial.category_id ?? '',
      location: initial.location ?? '',
      taken_at: initial.taken_at ?? '',
      display_order: initial.display_order ?? 0,
      is_featured: initial.is_featured,
      is_visible: initial.is_visible,
    });
    setLangTab('ja');
    setTranslateNote(null);
  }, [initial]);

  const setField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedSlug = categories.find((c) => c.id === form.category_id)?.slug;

  const handleAutoTranslate = async (target: 'en' | 'id') => {
    setError(null);
    setTranslateNote(null);
    const titleJa = String(form.title_ja || '').trim();
    const descriptionJa = String(form.description_ja || '').trim();
    if (!titleJa && !descriptionJa) {
      setError(t('admin.gallery.translateNeed'));
      setLangTab('ja');
      return;
    }
    setTranslating(true);
    try {
      const source: Record<string, string> = {};
      if (titleJa) source.title = titleJa;
      if (descriptionJa) source.description = descriptionJa;
      const result = await translateJaFields(source, target);
      if (target === 'en') {
        setForm((prev) => ({
          ...prev,
          title_en: result.title || prev.title_en,
          description_en: result.description || prev.description_en,
        }));
        setLangTab('en');
        setTranslateNote(t('admin.common.translatedToEn'));
      } else {
        setForm((prev) => ({
          ...prev,
          title_id: result.title || prev.title_id,
          description_id: result.description || prev.description_id,
        }));
        setLangTab('id');
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
    if (!form.image_url) {
      setError(t('admin.common.selectImage'));
      return;
    }
    const titleJa = String(form.title_ja || '').trim();
    const descriptionJa = String(form.description_ja || '').trim();
    try {
      await onSubmit(
        {
          ...form,
          title: titleJa || undefined,
          description: descriptionJa || undefined,
          title_ja: titleJa || null,
          title_en: String(form.title_en || '').trim() || null,
          title_id: String(form.title_id || '').trim() || null,
          description_ja: descriptionJa || null,
          description_en: String(form.description_en || '').trim() || null,
          description_id: String(form.description_id || '').trim() || null,
          category_id: form.category_id || undefined,
          location: form.location?.trim() || undefined,
          taken_at: form.taken_at || undefined,
          thumbnail_url: form.thumbnail_url || form.image_url,
          display_order: Number(form.display_order ?? 0),
          is_featured: Boolean(form.is_featured),
          is_visible: Boolean(form.is_visible),
        },
        { continueEditing: stay },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.pages.gallery.saveFailed'),
      );
    }
  };

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(event, false)}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">
            {initial
              ? t('admin.gallery.editPhoto')
              : t('admin.gallery.addPhoto')}
          </h3>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {t('admin.gallery.close')}
            </Button>
          )}
        </div>

        <GalleryImageUploader
          previewUrl={form.image_url}
          uploading={uploading}
          onUploaded={(url) => {
            setField('image_url', url);
            setField('thumbnail_url', url);
          }}
          onUpload={async (file) => onUpload(file, selectedSlug)}
        />

        <div className="space-y-3">
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
                onClick={() => setLangTab(tab.id)}
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

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            {langTab === 'ja' ? (
              <>
                <Input
                  label={t('admin.common.titleJa')}
                  value={String(form.title_ja ?? '')}
                  onChange={(event) =>
                    setField('title_ja', event.target.value)
                  }
                />
                <Textarea
                  label={t('admin.gallery.descriptionJa')}
                  value={String(form.description_ja ?? '')}
                  onChange={(event) =>
                    setField('description_ja', event.target.value)
                  }
                  rows={3}
                />
                <AutoTranslateButtons
                  translating={translating}
                  disabled={saving}
                  onTranslate={handleAutoTranslate}
                />
              </>
            ) : null}
            {langTab === 'en' ? (
              <>
                <Input
                  label={t('admin.common.titleEn')}
                  value={String(form.title_en ?? '')}
                  onChange={(event) =>
                    setField('title_en', event.target.value)
                  }
                  placeholder={t('admin.common.emptyFallsBackToJa')}
                />
                <Textarea
                  label={t('admin.gallery.descriptionEn')}
                  value={String(form.description_en ?? '')}
                  onChange={(event) =>
                    setField('description_en', event.target.value)
                  }
                  rows={3}
                  placeholder={t('admin.common.emptyFallsBackToJa')}
                />
              </>
            ) : null}
            {langTab === 'id' ? (
              <>
                <Input
                  label={t('admin.common.titleId')}
                  value={String(form.title_id ?? '')}
                  onChange={(event) =>
                    setField('title_id', event.target.value)
                  }
                  placeholder={t('admin.common.emptyFallsBackToJa')}
                />
                <Textarea
                  label={t('admin.gallery.descriptionId')}
                  value={String(form.description_id ?? '')}
                  onChange={(event) =>
                    setField('description_id', event.target.value)
                  }
                  rows={3}
                  placeholder={t('admin.common.emptyFallsBackToJa')}
                />
              </>
            ) : null}
          </div>
          {translateNote ? (
            <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-amber-100">
              {translateNote}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted">
            {t('admin.gallery.category')}
          </label>
          <select
            value={form.category_id ?? ''}
            onChange={(event) => setField('category_id', event.target.value)}
            className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="">{t('admin.common.unset')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label={t('admin.gallery.location')}
            value={form.location ?? ''}
            onChange={(event) => setField('location', event.target.value)}
          />
          <Input
            label={t('admin.gallery.takenAt')}
            type="date"
            value={form.taken_at ?? ''}
            onChange={(event) => setField('taken_at', event.target.value)}
          />
          <Input
            label={t('admin.gallery.displayOrder')}
            type="number"
            value={String(form.display_order ?? 0)}
            onChange={(event) =>
              setField('display_order', Number(event.target.value || 0))
            }
          />
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(form.is_featured)}
              onChange={(event) => setField('is_featured', event.target.checked)}
            />
            {t('admin.gallery.setFeatured')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(form.is_visible)}
              onChange={(event) => setField('is_visible', event.target.checked)}
            />
            {t('admin.gallery.publish')}
          </label>
        </div>

        {error && (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <AdminStickyActions>
          <Button
            type="submit"
            disabled={saving || translating}
            className="w-full sm:w-auto"
          >
            {saving
              ? t('admin.common.saving')
              : dualSave
                ? t('admin.common.saveAndBack')
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
              {t('admin.gallery.saveAndContinue')}
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
