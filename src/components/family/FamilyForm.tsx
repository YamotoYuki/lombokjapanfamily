import { useEffect, useState } from 'react';
import { AdminStickyActions } from '@/components/admin';
import FamilyImageUploader from '@/components/family/FamilyImageUploader';
import FamilySocialFields from '@/components/family/FamilySocialFields';
import { Button, Card, Input, Textarea } from '@/components/ui';
import {
  normalizeOptionalUrl,
  snsValidationError,
  type FamilySnsField,
} from '@/lib/familySns';
import {
  formValuesFromProfile,
  packFamilyDescription,
  type FamilyProfile,
  type FamilyProfileInput,
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
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
      {children}
    </p>
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
  const [form, setForm] = useState<FamilyProfileInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [snsErrors, setSnsErrors] = useState<
    Partial<Record<FamilySnsField, string>>
  >({});

  useEffect(() => {
    if (!initial) {
      setForm(empty);
      setSnsErrors({});
      setError(null);
      return;
    }
    setForm(formValuesFromProfile(initial));
    setSnsErrors({});
    setError(null);
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

  const trimOrNull = (value?: string | null) => {
    const text = value?.trim();
    return text ? text : null;
  };

  const handleSubmit = async (
    event: React.FormEvent,
    stay = false,
  ) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('名前を入力してください');
      return;
    }

    const invalidMessage = 'URLの形式が正しくありません';
    const nextSnsErrors: Partial<Record<FamilySnsField, string>> = {};
    (['youtube_url', 'instagram_url', 'tiktok_url', 'x_url'] as const).forEach(
      (field) => {
        const message = snsValidationError(field, form[field], invalidMessage);
        if (message) nextSnsErrors[field] = message;
      },
    );
    setSnsErrors(nextSnsErrors);
    if (Object.keys(nextSnsErrors).length > 0) {
      setError('SNS URLの形式を確認してください');
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
        },
        { continueEditing: stay },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '家族プロフィールの保存に失敗しました',
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
            {initial ? 'プロフィール編集' : '新規プロフィール'}
          </h3>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              閉じる
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <SectionTitle>基本情報</SectionTitle>
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
              label="名前 *"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="公開名・本名など"
            />
            <Input
              label="続柄"
              value={form.role ?? ''}
              onChange={(event) => setField('role', event.target.value)}
              placeholder="例: Father / Mother / Daughter"
            />
            <Input
              label="表示名（任意）"
              value={form.display_name ?? ''}
              onChange={(event) => setField('display_name', event.target.value)}
              placeholder="一覧で別名を出す場合"
            />
            <Input
              label="並び順"
              type="number"
              value={String(form.display_order ?? 0)}
              onChange={(event) =>
                setField('display_order', Number(event.target.value || 0))
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>プロフィール</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="ニックネーム"
              value={form.nickname ?? ''}
              onChange={(event) => setField('nickname', event.target.value)}
            />
            <Input
              label="使用言語"
              value={form.languages ?? ''}
              onChange={(event) => setField('languages', event.target.value)}
              placeholder="例: 日本語 / Bahasa Indonesia"
            />
          </div>
          <Textarea
            label="自己紹介"
            value={form.description ?? ''}
            onChange={(event) => setField('description', event.target.value)}
            rows={4}
            placeholder="家族紹介・自己紹介文"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="出身地"
              value={form.hometown ?? ''}
              onChange={(event) => setField('hometown', event.target.value)}
            />
            <Input
              label="居住地"
              value={form.current_location ?? ''}
              onChange={(event) =>
                setField('current_location', event.target.value)
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>趣味・好きなもの</SectionTitle>
          <Input
            label="趣味"
            value={form.hobbies ?? ''}
            onChange={(event) => setField('hobbies', event.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="好きな映画"
              value={form.favorite_movie ?? ''}
              onChange={(event) =>
                setField('favorite_movie', event.target.value)
              }
            />
            <Input
              label="好きなアニメ"
              value={form.favorite_anime ?? ''}
              onChange={(event) =>
                setField('favorite_anime', event.target.value)
              }
            />
            <Input
              label="好きな音楽"
              value={form.favorite_music ?? ''}
              onChange={(event) =>
                setField('favorite_music', event.target.value)
              }
            />
            <Input
              label="好きな食べ物"
              value={form.favorite_food ?? ''}
              onChange={(event) => setField('favorite_food', event.target.value)}
            />
            <Input
              label="好きな飲み物"
              value={form.favorite_drink ?? ''}
              onChange={(event) =>
                setField('favorite_drink', event.target.value)
              }
            />
            <Input
              label="好きな日本の場所"
              value={form.favorite_japan ?? ''}
              onChange={(event) =>
                setField('favorite_japan', event.target.value)
              }
            />
            <Input
              label="好きなインドネシアの場所"
              value={form.favorite_indonesia ?? ''}
              onChange={(event) =>
                setField('favorite_indonesia', event.target.value)
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>メッセージ</SectionTitle>
          <Textarea
            label="将来の夢"
            value={form.dream ?? ''}
            onChange={(event) => setField('dream', event.target.value)}
            rows={3}
          />
          <Textarea
            label="一言メッセージ"
            value={form.message ?? ''}
            onChange={(event) => setField('message', event.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <SectionTitle>SNS</SectionTitle>
          <p className="text-xs text-muted">
            アカウントがない場合は空欄のまま保存できます。
          </p>
          <FamilySocialFields
            values={form}
            errors={snsErrors}
            onChange={(field, value) => setField(field, value)}
          />
        </div>

        <div className="space-y-3">
          <SectionTitle>表示設定</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={Boolean(form.is_visible)}
                onChange={(event) => setField('is_visible', event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-primary-bg"
              />
              表示ON（公開する）
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
              TOPに表示
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

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
