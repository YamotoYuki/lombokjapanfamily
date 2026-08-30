import { useEffect, useState } from 'react';
import { AdminStickyActions } from '@/components/admin';
import { Button, Card, Input, Textarea } from '@/components/ui';
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORY_LABELS,
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

const LANG_TABS: { id: LangTab; label: string }[] = [
  { id: 'ja', label: '日本語' },
  { id: 'en', label: 'English' },
  { id: 'id', label: 'Bahasa Indonesia' },
];

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
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [langTab, setLangTab] = useState<LangTab>('ja');

  useEffect(() => {
    if (!initial) {
      setForm(emptyForm());
      setError(null);
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
    setLangTab('ja');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on identity + server timestamp
  }, [initial?.id, initial?.updated_at]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent, stay = false) => {
    event.preventDefault();
    setError(null);
    if (!form.title_ja.trim()) {
      setError('タイトル（日本語）を入力してください');
      setLangTab('ja');
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
        err instanceof Error ? err.message : 'お知らせの保存に失敗しました',
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
          <SectionTitle>多言語コンテンツ</SectionTitle>
          <div
            className="scrollbar-thin flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1"
            role="tablist"
            aria-label="言語切替"
          >
            {LANG_TABS.map((tab) => (
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

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            {langTab === 'ja' ? (
              <>
                <Input
                  label="タイトル（日本語）*"
                  value={form.title_ja}
                  onChange={(event) => setField('title_ja', event.target.value)}
                />
                <Textarea
                  label="本文（日本語）"
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
                  label="タイトル（English）"
                  value={form.title_en}
                  onChange={(event) => setField('title_en', event.target.value)}
                  placeholder="空欄の場合は日本語を表示"
                />
                <Textarea
                  label="本文（English）"
                  value={form.content_en}
                  onChange={(event) =>
                    setField('content_en', event.target.value)
                  }
                  rows={6}
                  placeholder="空欄の場合は日本語を表示"
                />
              </>
            ) : null}
            {langTab === 'id' ? (
              <>
                <Input
                  label="タイトル（Bahasa Indonesia）"
                  value={form.title_id}
                  onChange={(event) => setField('title_id', event.target.value)}
                  placeholder="空欄の場合は日本語を表示"
                />
                <Textarea
                  label="本文（Bahasa Indonesia）"
                  value={form.content_id}
                  onChange={(event) =>
                    setField('content_id', event.target.value)
                  }
                  rows={6}
                  placeholder="空欄の場合は日本語を表示"
                />
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>基本情報</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">カテゴリ</span>
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
                    {ANNOUNCEMENT_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="公開日"
              type="datetime-local"
              value={form.published_at_local}
              onChange={(event) =>
                setField('published_at_local', event.target.value)
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>メディア</SectionTitle>
          <Input
            label="アイキャッチ画像 URL"
            value={form.featured_image}
            onChange={(event) => setField('featured_image', event.target.value)}
            placeholder="https://..."
          />
          {form.featured_image ? (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img
                src={form.featured_image}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : null}
          <Input
            label="YouTube URL（任意）"
            value={form.youtube_url}
            onChange={(event) => setField('youtube_url', event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div className="space-y-3">
          <SectionTitle>表示設定</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="公開開始日時"
              type="datetime-local"
              value={form.publish_start_at_local}
              onChange={(event) =>
                setField('publish_start_at_local', event.target.value)
              }
            />
            <Input
              label="公開終了日時"
              type="datetime-local"
              value={form.publish_end_at_local}
              onChange={(event) =>
                setField('publish_end_at_local', event.target.value)
              }
            />
          </div>
          <p className="text-xs text-muted">
            未設定の場合は「公開する」フラグのみで表示します。開始前・終了後は非公開になります。
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
              公開する
            </label>
            <label className="touch-target flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) =>
                  setField('is_featured', event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-primary-bg"
              />
              注目表示
            </label>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <AdminStickyActions>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving
              ? '保存中...'
              : dualSave
                ? '保存して戻る'
                : '保存する'}
          </Button>
          {dualSave ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              className="w-full sm:w-auto"
              onClick={(event) => void handleSubmit(event, true)}
            >
              保存して編集を続ける
            </Button>
          ) : null}
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              className="w-full sm:w-auto"
              onClick={onCancel}
            >
              キャンセル
            </Button>
          ) : null}
        </AdminStickyActions>
      </form>
    </Card>
  );
}
