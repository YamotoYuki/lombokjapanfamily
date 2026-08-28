import type { Video } from '@/types/video';
import {
  VIDEO_CATEGORIES,
  formatPublishedDate,
  formatViewCount,
  youtubeWatchUrl,
} from '@/types/video';
import VideoStatusBadge from '@/components/videos/VideoStatusBadge';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';
import { LazyImage } from '@/components/common';

interface VideoTableProps {
  videos: Video[];
  busyId?: string | null;
  viewMode?: ViewMode;
  onToggleFeatured: (video: Video) => void;
  onToggleHome: (video: Video) => void;
  onToggleVisible: (video: Video) => void;
  onCategoryChange: (video: Video, category: string) => void;
  onDisplayOrderChange: (video: Video, order: number) => void;
  onHide: (video: Video) => void;
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={[
        'relative h-7 w-12 rounded-full transition-colors',
        checked ? 'bg-youtube-red' : 'bg-white/15',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  );
}

function VideoActions({
  video,
  busy,
  onToggleFeatured,
  onToggleHome,
  onToggleVisible,
  onCategoryChange,
  onDisplayOrderChange,
  onHide,
}: {
  video: Video;
  busy: boolean;
  onToggleFeatured: (video: Video) => void;
  onToggleHome: (video: Video) => void;
  onToggleVisible: (video: Video) => void;
  onCategoryChange: (video: Video, category: string) => void;
  onDisplayOrderChange: (video: Video, order: number) => void;
  onHide: (video: Video) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-xs text-muted">
        カテゴリ
        <select
          value={video.category ?? ''}
          disabled={busy}
          onChange={(event) => onCategoryChange(video, event.target.value)}
          className="touch-input w-full rounded-xl border border-border bg-primary-bg/70 px-3 text-sm text-white outline-none"
        >
          <option value="">未設定</option>
          {VIDEO_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted">
        表示順
        <input
          type="number"
          min={0}
          value={video.display_order}
          disabled={busy}
          onChange={(event) =>
            onDisplayOrderChange(video, Number(event.target.value || 0))
          }
          className="touch-input w-full rounded-xl border border-border bg-primary-bg/70 px-3 text-sm text-white outline-none"
        />
      </label>
      <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
        <span className="text-xs text-muted">おすすめ</span>
        <Toggle
          checked={video.is_featured}
          disabled={busy}
          label="おすすめ切替"
          onChange={() => onToggleFeatured(video)}
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
        <span className="text-xs text-muted">トップ</span>
        <Toggle
          checked={video.show_on_home}
          disabled={busy}
          label="トップ表示切替"
          onChange={() => onToggleHome(video)}
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
        <span className="text-xs text-muted">公開</span>
        <Toggle
          checked={video.is_visible}
          disabled={busy}
          label="公開切替"
          onChange={() => onToggleVisible(video)}
        />
      </div>
      <button
        type="button"
        disabled={busy || !video.is_visible}
        onClick={() => onHide(video)}
        className="touch-target rounded-xl border border-white/10 px-3 text-sm text-muted transition-colors hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
      >
        非公開にする
      </button>
    </div>
  );
}

export default function VideoTable({
  videos,
  busyId,
  viewMode = 'table',
  onToggleFeatured,
  onToggleHome,
  onToggleVisible,
  onCategoryChange,
  onDisplayOrderChange,
  onHide,
}: VideoTableProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
        <p className="text-sm text-muted">表示できる動画がありません。</p>
        <p className="mt-2 text-xs text-muted">
          YouTube同期を実行するか、フィルター条件を変更してください。
        </p>
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className="grid gap-4">
        {videos.map((video) => {
          const busy = busyId === video.id;
          return (
            <article
              key={video.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex gap-3">
                <a
                  href={youtubeWatchUrl(video.youtube_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl"
                >
                  {video.thumbnail_url ? (
                    <LazyImage
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover"
                      widths={[256, 480]}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface text-[10px] text-muted">
                      No Image
                    </div>
                  )}
                </a>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold text-white">
                    {video.title}
                  </h3>
                  <p className="mt-1 text-xs text-gold">
                    {formatViewCount(video.views || 0)} ·{' '}
                    {formatPublishedDate(video.published_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <VideoStatusBadge
                      label={video.is_visible ? '公開' : '非公開'}
                      tone={video.is_visible ? 'green' : 'muted'}
                    />
                    {video.is_featured && (
                      <VideoStatusBadge label="おすすめ" tone="gold" />
                    )}
                    {video.show_on_home && (
                      <VideoStatusBadge label="TOP" tone="red" />
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-white/5 pt-4">
                <VideoActions
                  video={video}
                  busy={busy}
                  onToggleFeatured={onToggleFeatured}
                  onToggleHome={onToggleHome}
                  onToggleVisible={onToggleVisible}
                  onCategoryChange={onCategoryChange}
                  onDisplayOrderChange={onDisplayOrderChange}
                  onHide={onHide}
                />
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium">動画</th>
            <th className="px-4 py-3 font-medium">カテゴリ</th>
            <th className="px-4 py-3 font-medium">再生回数</th>
            <th className="px-4 py-3 font-medium">投稿日</th>
            <th className="px-4 py-3 font-medium">おすすめ</th>
            <th className="px-4 py-3 font-medium">トップ</th>
            <th className="px-4 py-3 font-medium">公開</th>
            <th className="px-4 py-3 font-medium">表示順</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => {
            const busy = busyId === video.id;
            return (
              <tr
                key={video.id}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <a
                      href={youtubeWatchUrl(video.youtube_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl"
                    >
                      {video.thumbnail_url ? (
                        <LazyImage
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-full w-full object-cover"
                          widths={[192, 320]}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface text-[10px] text-muted">
                          No Image
                        </div>
                      )}
                    </a>
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-medium text-white">
                        {video.title}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <VideoStatusBadge
                          label={video.is_visible ? '公開' : '非公開'}
                          tone={video.is_visible ? 'green' : 'muted'}
                        />
                        {video.is_featured && (
                          <VideoStatusBadge label="おすすめ" tone="gold" />
                        )}
                        {video.show_on_home && (
                          <VideoStatusBadge label="TOP" tone="red" />
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={video.category ?? ''}
                    disabled={busy}
                    onChange={(event) =>
                      onCategoryChange(video, event.target.value)
                    }
                    className="rounded-xl border border-border bg-primary-bg/70 px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">未設定</option>
                    {VIDEO_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-gold">
                  {formatViewCount(video.views || 0)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatPublishedDate(video.published_at)}
                </td>
                <td className="px-4 py-3">
                  <Toggle
                    checked={video.is_featured}
                    disabled={busy}
                    label="おすすめ切替"
                    onChange={() => onToggleFeatured(video)}
                  />
                </td>
                <td className="px-4 py-3">
                  <Toggle
                    checked={video.show_on_home}
                    disabled={busy}
                    label="トップ表示切替"
                    onChange={() => onToggleHome(video)}
                  />
                </td>
                <td className="px-4 py-3">
                  <Toggle
                    checked={video.is_visible}
                    disabled={busy}
                    label="公開切替"
                    onChange={() => onToggleVisible(video)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    value={video.display_order}
                    disabled={busy}
                    onChange={(event) =>
                      onDisplayOrderChange(
                        video,
                        Number(event.target.value || 0),
                      )
                    }
                    className="w-20 rounded-xl border border-border bg-primary-bg/70 px-2 py-1.5 text-xs text-white outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={busy || !video.is_visible}
                    onClick={() => onHide(video)}
                    className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted transition-colors hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
                  >
                    非公開
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
