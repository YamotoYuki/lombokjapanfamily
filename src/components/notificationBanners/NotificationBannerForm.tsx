import { useEffect, useState } from 'react';
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
      setError('先に日本語のタイトルまたはメッセージを入力してください');
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
        setTranslateNote(
          '日本語から英語へ翻訳しました。内容を確認してから保存してください。',
        );
      } else {
        setForm((prev) => ({
          ...prev,
          title_id: result.title || prev.title_id,
          message_id: result.message || prev.message_id,
        }));
        setTranslateNote(
          '日本語からインドネシア語へ翻訳しました。内容を確認してから保存してください。',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '翻訳に失敗しました');
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent, stay = false) => {
    event.preventDefault();
    setError(null);
    if (!form.title_ja.trim()) {
      setError('タイトル（日本語）を入力してください');
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
        err instanceof Error ? err.message : '通知バナーの保存に失敗しました',
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
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-gold">日本語</p>
            <Input
              label="タイトル（日本語）*"
              value={form.title_ja}
              onChange={(event) => setField('title_ja', event.target.value)}
            />
            <Textarea
              label="メッセージ（日本語）"
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
            <p className="text-xs font-medium text-gold">English</p>
            <Input
              label="タイトル（English）"
              value={form.title_en}
              onChange={(event) => setField('title_en', event.target.value)}
              placeholder="空欄の場合は日本語を表示"
            />
            <Textarea
              label="メッセージ（English）"
              value={form.message_en}
              onChange={(event) => setField('message_en', event.target.value)}
              rows={3}
              placeholder="空欄の場合は日本語を表示"
            />
          </div>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-gold">Bahasa Indonesia</p>
            <Input
              label="タイトル（Bahasa Indonesia）"
              value={form.title_id}
              onChange={(event) => setField('title_id', event.target.value)}
              placeholder="空欄の場合は日本語を表示"
            />
            <Textarea
              label="メッセージ（Bahasa Indonesia）"
              value={form.message_id}
              onChange={(event) => setField('message_id', event.target.value)}
              rows={3}
              placeholder="空欄の場合は日本語を表示"
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>リンク・公開期間</SectionTitle>
          <Input
            label="リンクURL"
            value={form.link_url}
            onChange={(event) => setField('link_url', event.target.value)}
            placeholder="https://... または /videos"
          />
          <div className="grid gap-3 sm:grid-cols-2">
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
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setField('is_active', event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-primary-bg"
            />
            有効にする
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
              ? '保存中...'
              : dualSave
                ? '保存して戻る'
                : '保存する'}
          </Button>
          {dualSave ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving || translating}
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
              disabled={saving || translating}
              className="w-full sm:w-auto"
              onClick={onCancel}
            >
              キャンセル
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
