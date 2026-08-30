import { useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  VIDEO_CATEGORIES,
  type Video,
  type VideoUpdatePayload,
} from '@/types/video';

interface VideoFormProps {
  video: Video;
  saving?: boolean;
  dualSave?: boolean;
  onSubmit: (
    payload: VideoUpdatePayload,
    meta?: { continueEditing?: boolean },
  ) => Promise<void>;
}

export default function VideoForm({
  video,
  saving,
  dualSave = false,
  onSubmit,
}: VideoFormProps) {
  const [category, setCategory] = useState(video.category ?? '');
  const [displayOrder, setDisplayOrder] = useState(video.display_order ?? 0);
  const [isFeatured, setIsFeatured] = useState(Boolean(video.is_featured));
  const [isVisible, setIsVisible] = useState(Boolean(video.is_visible));
  const [showOnHome, setShowOnHome] = useState(Boolean(video.show_on_home));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (stay: boolean) => {
    setError(null);
    try {
      await onSubmit(
        {
          category: category.trim() === '' ? null : category.trim(),
          display_order: Number(displayOrder ?? 0),
          is_featured: isFeatured,
          is_visible: isVisible,
          show_on_home: showOnHome,
        },
        { continueEditing: stay },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '動画の保存に失敗しました');
    }
  };

  return (
    <Card>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(false);
        }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-white/5 text-sm text-muted">
              No Thumbnail
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm text-muted">カテゴリー</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">未設定</option>
              {VIDEO_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="表示順"
            type="number"
            value={String(displayOrder)}
            onChange={(event) =>
              setDisplayOrder(Number(event.target.value || 0))
            }
          />
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(event) => setIsVisible(event.target.checked)}
            />
            公開する
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
            />
            おすすめ
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(event) => setShowOnHome(event.target.checked)}
            />
            TOPに表示
          </label>
        </div>

        {error && (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="submit" disabled={saving}>
            {saving
              ? '保存中...'
              : dualSave
                ? '保存して一覧へ戻る'
                : '保存する'}
          </Button>
          {dualSave ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => void handleSubmit(true)}
            >
              保存して編集を続ける
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
