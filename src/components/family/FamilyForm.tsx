import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminStickyActions, AutoTranslateButtons } from '@/components/admin';
import FamilyImageUploader from '@/components/family/FamilyImageUploader';
import FamilySocialFields from '@/components/family/FamilySocialFields';
import { Button, Card, Input, Textarea } from '@/components/ui';
import {
  normalizeOptionalUrl,
  snsValidationError,
  type FamilySnsField,
} from '@/lib/familySns';
import { cleanFamilyTranslations } from '@/lib/familyProfileFields';
import { translateJaFields } from '@/services/translateApi';
import {
  FAMILY_TRANSLATABLE_FIELDS,
  formValuesFromProfile,
  packFamilyDescription,
  type FamilyProfile,
  type FamilyProfileInput,
  type FamilyTranslatableField,
  type FamilyTranslations,
} from '@/types/family';

interface FamilyFormProps {
  initial?: FamilyProfile | null;
  saving?: boolean;
  uploading?: boolean;
  dualSave?: boolean;
  onSubmit: (
    input: FamilyProfileInput,
    meta?: { continueEditing?: boolean },
  ) => Promise<void>;
  onUploadPhoto?: (file: File) => Promise<string | void>;
  onCancel?: () => void;
}

type LangTab = 'ja' | 'en' | 'id';

type FieldDef = { field: FamilyTranslatableField; rows?: number };

const BIO_FIELD: FieldDef = { field: 'description', rows: 4 };

const SHORT_FIELDS: FieldDef[] = [
  { field: 'hometown' },
  { field: 'current_location' },
  { field: 'languages' },
  { field: 'hobbies' },
  { field: 'favorite_movie' },
  { field: 'favorite_anime' },
  { field: 'favorite_music' },
  { field: 'favorite_food' },
  { field: 'favorite_drink' },
  { field: 'favorite_japan' },
  { field: 'favorite_indonesia' },
];

const LONG_FIELDS: FieldDef[] = [
  { field: 'dream', rows: 3 },
  { field: 'message', rows: 3 },
];

const empty: FamilyProfileInput = {
  name: '',
  display_name: '',
  nickname: '',
  age: '',
  role: '',
  description: '',
  hometown: '',
  current_location: '',
  languages: '',
  hobbies: '',
  favorite_movie: '',
  favorite_anime: '',
  favorite_food: '',
  favorite_drink: '',
  favorite_music: '',
  favorite_japan: '',
  favorite_indonesia: '',
  dream: '',
  message: '',
  photo_url: '',
  instagram_url: '',
  tiktok_url: '',
  youtube_url: '',
  x_url: '',
  display_order: 0,
  is_visible: true,
  show_on_home: true,
  translations: {},
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
      {children}
    </p>
  );
}

/** Same free-text field set for every language tab. */
function TranslatableFields({
  suffix,
  placeholder,
  bioPlaceholder,
  fieldLabel,
  getValue,
  onChange,
}: {
  suffix: string;
  placeholder?: string;
  bioPlaceholder: string;
  fieldLabel: (field: FamilyTranslatableField) => string;
  getValue: (field: FamilyTranslatableField) => string;
  onChange: (field: FamilyTranslatableField, value: string) => void;
}) {
  return (
    <>
      <Textarea
        label={`${fieldLabel(BIO_FIELD.field)}${suffix}`}
        value={getValue(BIO_FIELD.field)}
        onChange={(event) => onChange(BIO_FIELD.field, event.target.value)}
        rows={BIO_FIELD.rows}
        placeholder={placeholder ?? bioPlaceholder}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {SHORT_FIELDS.map((def) => (
          <Input
            key={def.field}
            label={`${fieldLabel(def.field)}${suffix}`}
            value={getValue(def.field)}
            onChange={(event) => onChange(def.field, event.target.value)}
            placeholder={placeholder}
          />
        ))}
      </div>
      {LONG_FIELDS.map((def) => (
        <Textarea
          key={def.field}
          label={`${fieldLabel(def.field)}${suffix}`}
          value={getValue(def.field)}
          onChange={(event) => onChange(def.field, event.target.value)}
          rows={def.rows}
          placeholder={placeholder}
        />
      ))}
    </>
  );
}

export default function FamilyForm({
  initial,
  saving,
  uploading,
  dualSave = false,
  onSubmit,
  onUploadPhoto,
  onCancel,
}: FamilyFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FamilyProfileInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [langTab, setLangTab] = useState<LangTab>('ja');
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState<string | null>(null);
  const [snsErrors, setSnsErrors] = useState<
    Partial<Record<FamilySnsField, string>>
  >({});

  const langTabs: { id: LangTab; label: string }[] = [
    { id: 'ja', label: t('admin.common.japanese') },
    { id: 'en', label: t('admin.common.english') },
    { id: 'id', label: t('admin.common.indonesian') },
  ];

  const langSuffix: Record<LangTab, string> = {
    ja: `（${t('admin.common.japanese')}）`,
    en: `（${t('admin.common.english')}）`,
    id: `（${t('admin.common.indonesian')}）`,
  };

  const fieldLabel = (field: FamilyTranslatableField) =>
    t(`admin.family.fields.${field}`);

  useEffect(() => {
    if (!initial) {
      setForm(empty);
      setSnsErrors({});
      setError(null);
      setLangTab('ja');
      setTranslateNote(null);
      return;
    }
    setForm(formValuesFromProfile(initial));
    setSnsErrors({});
    setError(null);
    setLangTab('ja');
    setTranslateNote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on identity + server timestamp
  }, [initial?.id, initial?.updated_at]);

  const setField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (
      field === 'youtube_url' ||
      field === 'instagram_url' ||
      field === 'tiktok_url' ||
      field === 'x_url'
    ) {
      setSnsErrors((prev) => {
        const next = { ...prev };
        delete next[field as FamilySnsField];
        return next;
      });
    }
  };

  const setTranslationField = (
    lang: 'en' | 'id',
    field: FamilyTranslatableField,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: { ...(prev.translations?.[lang] ?? {}), [field]: value },
      },
    }));
  };

  const trimOrNull = (value?: string | null) => {
    const text = value?.trim();
    return text ? text : null;
  };

  /** Drop blank values so the API stores only real translations. */
  const cleanTranslations = (): FamilyTranslations =>
    cleanFamilyTranslations(form.translations);

  const handleAutoTranslate = async (target: 'en' | 'id') => {
    setError(null);
    setTranslateNote(null);
    const source: Record<string, string> = {};
    FAMILY_TRANSLATABLE_FIELDS.forEach((field) => {
      const text = (form[field] ?? '').trim();
      if (text) source[field] = text;
    });
    if (Object.keys(source).length === 0) {
      setError(t('admin.family.translateNeed'));
      setLangTab('ja');
      return;
    }
    setTranslating(true);
    try {
      const result = await translateJaFields(source, target);
      setForm((prev) => {
        const bag = { ...(prev.translations?.[target] ?? {}) };
        Object.entries(result).forEach(([field, value]) => {
          const text = (value ?? '').trim();
          if (text) bag[field] = text;
        });
        return {
          ...prev,
          translations: { ...prev.translations, [target]: bag },
        };
      });
      setLangTab(target);
      setTranslateNote(
        target === 'en'
          ? t('admin.common.translatedToEn')
          : t('admin.common.translatedToId'),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.common.translateFailed'),
      );
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent,
    stay = false,
  ) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError(t('admin.common.nameRequired'));
      return;
    }

    const invalidMessage = t('admin.family.invalidUrl');
    const nextSnsErrors: Partial<Record<FamilySnsField, string>> = {};
    (['youtube_url', 'instagram_url', 'tiktok_url', 'x_url'] as const).forEach(
      (field) => {
        const message = snsValidationError(field, form[field], invalidMessage);
        if (message) nextSnsErrors[field] = message;
      },
    );
    setSnsErrors(nextSnsErrors);
    if (Object.keys(nextSnsErrors).length > 0) {
      setError(t('admin.family.snsUrlInvalid'));
      return;
    }

    try {
      const packedDescription = packFamilyDescription(form);
      await onSubmit(
        {
          ...form,
          name: form.name.trim(),
          display_name: trimOrNull(form.display_name),
          nickname: trimOrNull(form.nickname),
          age: trimOrNull(form.age),
          role: trimOrNull(form.role),
          description: packedDescription,
          hometown: trimOrNull(form.hometown),
          current_location: trimOrNull(form.current_location),
          languages: trimOrNull(form.languages),
          hobbies: trimOrNull(form.hobbies),
          favorite_movie: trimOrNull(form.favorite_movie),
          favorite_anime: trimOrNull(form.favorite_anime),
          favorite_food: trimOrNull(form.favorite_food),
          favorite_drink: trimOrNull(form.favorite_drink),
          favorite_music: trimOrNull(form.favorite_music),
          favorite_japan: trimOrNull(form.favorite_japan),
          favorite_indonesia: trimOrNull(form.favorite_indonesia),
          dream: trimOrNull(form.dream),
          message: trimOrNull(form.message),
          photo_url: form.photo_url?.trim() || undefined,
          youtube_url: normalizeOptionalUrl(form.youtube_url),
          instagram_url: normalizeOptionalUrl(form.instagram_url),
          tiktok_url: normalizeOptionalUrl(form.tiktok_url),
          x_url: normalizeOptionalUrl(form.x_url),
          display_order: Number(form.display_order ?? 0),
          is_visible: Boolean(form.is_visible),
          show_on_home: Boolean(form.show_on_home),
          translations: cleanTranslations(),
        },
        { continueEditing: stay },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.pages.family.saveFailed'),
      );
    }
  };

  return (
    <Card glass={false}>
      <form
        className="space-y-6"
        onSubmit={(event) => void handleSubmit(event, false)}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">
            {initial
              ? t('admin.family.editProfile')
              : t('admin.family.newProfile')}
          </h3>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {t('admin.family.close')}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <SectionTitle>{t('admin.family.sectionBasic')}</SectionTitle>
          <FamilyImageUploader
            previewUrl={form.photo_url ?? undefined}
            uploading={uploading}
            onSelect={async (file) => {
              if (onUploadPhoto) {
                const url = await onUploadPhoto(file);
                if (url) setField('photo_url', url);
                return;
              }
              const objectUrl = URL.createObjectURL(file);
              setField('photo_url', objectUrl);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('admin.family.nameRequiredLabel')}
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder={t('admin.family.namePlaceholder')}
            />
            <Input
              label={t('admin.family.role')}
              value={form.role ?? ''}
              onChange={(event) => setField('role', event.target.value)}
              placeholder={t('admin.family.rolePlaceholder')}
            />
            <Input
              label={t('admin.family.displayName')}
              value={form.display_name ?? ''}
              onChange={(event) => setField('display_name', event.target.value)}
              placeholder={t('admin.family.displayNamePlaceholder')}
            />
            <Input
              label={t('admin.family.nickname')}
              value={form.nickname ?? ''}
              onChange={(event) => setField('nickname', event.target.value)}
            />
            <Input
              label={t('admin.family.sortOrder')}
              type="number"
              value={String(form.display_order ?? 0)}
              onChange={(event) =>
                setField('display_order', Number(event.target.value || 0))
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>{t('admin.family.sectionI18n')}</SectionTitle>
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
                <TranslatableFields
                  suffix={langSuffix.ja}
                  bioPlaceholder={t('admin.family.bioPlaceholder')}
                  fieldLabel={fieldLabel}
                  getValue={(field) => form[field] ?? ''}
                  onChange={(field, value) => setField(field, value)}
                />
                <AutoTranslateButtons
                  translating={translating}
                  disabled={saving}
                  onTranslate={handleAutoTranslate}
                />
              </>
            ) : (
              <TranslatableFields
                suffix={langSuffix[langTab]}
                placeholder={t('admin.common.emptyFallsBackToJa')}
                bioPlaceholder={t('admin.family.bioPlaceholder')}
                fieldLabel={fieldLabel}
                getValue={(field) =>
                  form.translations?.[langTab]?.[field] ?? ''
                }
                onChange={(field, value) =>
                  setTranslationField(langTab, field, value)
                }
              />
            )}
          </div>
          {translateNote ? (
            <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-amber-100">
              {translateNote}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <SectionTitle>{t('admin.family.sectionSns')}</SectionTitle>
          <p className="text-xs text-muted">{t('admin.family.snsHint')}</p>
          <FamilySocialFields
            values={form}
            errors={snsErrors}
            onChange={(field, value) => setField(field, value)}
          />
        </div>

        <div className="space-y-3">
          <SectionTitle>{t('admin.family.sectionVisibility')}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={Boolean(form.is_visible)}
                onChange={(event) => setField('is_visible', event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-primary-bg"
              />
              {t('admin.family.visibleOn')}
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={Boolean(form.show_on_home)}
                onChange={(event) =>
                  setField('show_on_home', event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-primary-bg"
              />
              {t('admin.family.showOnHome')}
            </label>
          </div>
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
              {t('admin.family.saveAndContinue')}
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
