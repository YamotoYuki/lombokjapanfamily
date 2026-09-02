import { useTranslation } from 'react-i18next';
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
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
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
  const { t, i18n } = useTranslation();
  const locale = (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-xs text-muted">
        <span className="inline-flex whitespace-nowrap">
          {t('admin.common.category')}
        </span>
        <select
          value={video.category ?? ''}
          disabled={busy}
          onChange={(event) => onCategoryChange(video, event.target.value)}
          className="touch-input w-full rounded-xl border border-border bg-primary-bg/70 px-3 text-sm text-white outline-none"
        >
          <option value="">{t('admin.common.unset')}</option>
          {VIDEO_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted">
        <span className="inline-flex whitespace-nowrap">
          {t('admin.videos.displayOrder')}
        </span>
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
      <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2">
        <span className="inline-flex whitespace-nowrap text-xs text-muted">
          {t('admin.common.featured')}
        </span>
        <Toggle
          checked={video.is_featured}
          disabled={busy}
          label={t('admin.videos.toggleFeatured')}
          onChange={() => onToggleFeatured(video)}
        />
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2">
        <span className="inline-flex whitespace-nowrap text-xs text-muted">
          {t('admin.videos.top')}
        </span>
        <Toggle
          checked={video.show_on_home}
          disabled={busy}
          label={t('admin.videos.toggleTop')}
          onChange={() => onToggleHome(video)}
        />
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2">
        <span className="inline-flex whitespace-nowrap text-xs text-muted">
          {t('admin.common.visible')}
        </span>
        <Toggle
          checked={video.is_visible}
          disabled={busy}
          label={t('admin.videos.toggleVisible')}
          onChange={() => onToggleVisible(video)}
        />
      </div>
      <button
        type="button"
        disabled={busy || !video.is_visible}
        onClick={() => onHide(video)}
        className="touch-target inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-3 text-sm text-muted transition-colors hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
      >
        {t('admin.videos.unpublish')}
      </button>
      <p className="col-span-full text-xs text-gold">
        <span className="inline-flex whitespace-nowrap">
          {formatViewCount(video.views || 0, locale)}
        </span>
        <span className="mx-1">·</span>
        <span className="inline-flex whitespace-nowrap">
          {formatPublishedDate(video.published_at, locale)}
        </span>
      </p>
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
  const { t, i18n } = useTranslation();
  const locale = (i18n.resolvedLanguage || i18n.language || 'ja').slice(0, 2);

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
        <p className="text-sm text-muted">{t('admin.videos.empty')}</p>
        <p className="mt-2 text-xs text-muted">{t('admin.videos.emptyHint')}</p>
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
                  className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl"
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
                      {t('admin.videos.noImage')}
                    </div>
                  )}
                </a>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold text-white">
                    {video.title}
                  </h3>
                  <p className="mt-1 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gold">
                    <span className="whitespace-nowrap">
                      {formatViewCount(video.views || 0, locale)}
                    </span>
                    <span className="whitespace-nowrap">
                      {formatPublishedDate(video.published_at, locale)}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <VideoStatusBadge
                      label={
                        video.is_visible
                          ? t('admin.common.visible')
                          : t('admin.common.hidden')
                      }
                      tone={video.is_visible ? 'green' : 'muted'}
                    />
                    {video.is_featured && (
                      <VideoStatusBadge
                        label={t('admin.common.featured')}
                        tone="gold"
                      />
                    )}
                    {video.show_on_home && (
                      <VideoStatusBadge
                        label={t('admin.videos.topBadge')}
                        tone="red"
                      />
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
      <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.videos.colVideo')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.category')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.videos.colViews')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.videos.colPublished')}
            </th>
            <th className="px-2 py-3 font-medium whitespace-nowrap">
              {t('admin.common.featured')}
            </th>
            <th className="px-2 py-3 font-medium whitespace-nowrap">
              {t('admin.videos.top')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.actions')}
            </th>
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
                <td className="px-4 py-3 align-middle">
                  <div className="flex min-w-0 items-center gap-3">
                    <a
                      href={youtubeWatchUrl(video.youtube_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl"
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
                          {t('admin.videos.noImage')}
                        </div>
                      )}
                    </a>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium text-white">
                        {video.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <VideoStatusBadge
                          label={
                            video.is_visible
                              ? t('admin.common.visible')
                              : t('admin.common.hidden')
                          }
                          tone={video.is_visible ? 'green' : 'muted'}
                        />
                        {video.is_featured ? (
                          <VideoStatusBadge
                            label={t('admin.common.featured')}
                            tone="gold"
                          />
                        ) : null}
                        {video.show_on_home ? (
                          <VideoStatusBadge
                            label={t('admin.videos.topBadge')}
                            tone="red"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 align-middle">
                  <select
                    value={video.category ?? ''}
                    disabled={busy}
                    onChange={(event) =>
                      onCategoryChange(video, event.target.value)
                    }
                    className="w-full min-w-[6.5rem] rounded-xl border border-border bg-primary-bg/70 px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">{t('admin.common.unset')}</option>
                    {VIDEO_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3 align-middle">
                  <span className="inline-flex whitespace-nowrap text-gold">
                    {formatViewCount(video.views || 0, locale)}
                  </span>
                </td>
                <td className="px-3 py-3 align-middle">
                  <span className="inline-flex whitespace-nowrap text-muted">
                    {formatPublishedDate(video.published_at, locale)}
                  </span>
                </td>
                <td className="px-2 py-3 align-middle">
                  <div className="flex flex-col items-start gap-2">
                    <Toggle
                      checked={video.is_featured}
                      disabled={busy}
                      label={t('admin.videos.toggleFeatured')}
                      onChange={() => onToggleFeatured(video)}
                    />
                    <Toggle
                      checked={video.is_visible}
                      disabled={busy}
                      label={t('admin.videos.toggleVisible')}
                      onChange={() => onToggleVisible(video)}
                    />
                  </div>
                </td>
                <td className="px-2 py-3 align-middle">
                  <Toggle
                    checked={video.show_on_home}
                    disabled={busy}
                    label={t('admin.videos.toggleTop')}
                    onChange={() => onToggleHome(video)}
                  />
                </td>
                <td className="px-3 py-3 align-middle">
                  <div className="flex flex-col items-stretch gap-2">
                    <input
                      type="number"
                      min={0}
                      title={t('admin.videos.displayOrder')}
                      aria-label={t('admin.videos.displayOrder')}
                      value={video.display_order}
                      disabled={busy}
                      onChange={(event) =>
                        onDisplayOrderChange(
                          video,
                          Number(event.target.value || 0),
                        )
                      }
                      className="w-full min-w-[4.5rem] rounded-xl border border-border bg-primary-bg/70 px-2 py-1.5 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy || !video.is_visible}
                      onClick={() => onHide(video)}
                      className="inline-flex min-w-[5.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted transition-colors hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
                    >
                      {t('admin.videos.unpublishShort')}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
