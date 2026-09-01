import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  VideoFilters,
  VideoStatsCards,
  VideoSyncButton,
  VideoTable,
} from '@/components/videos';
import { Card, ViewModeToggle } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  useHideVideo,
  useSyncVideos,
  useUpdateVideo,
  useVideos,
} from '@/hooks/useVideos';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import type { Video, VideoVisibilityFilter } from '@/types/video';

export default function AdminVideosPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('table');

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] =
    useState<VideoVisibilityFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const numberLocale = (i18n.resolvedLanguage || i18n.language || 'ja').slice(
    0,
    2,
  );

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) {
      setActionMessage(stateMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const listParams = useMemo(
    () => ({
      q: keyword.trim() || undefined,
      category: category || undefined,
      is_visible:
        visibility === 'all' ? undefined : visibility === 'visible',
    }),
    [keyword, category, visibility],
  );

  const videosQuery = useVideos(listParams);
  const allVideosQuery = useVideos();
  const syncMutation = useSyncVideos(accessToken);
  const updateMutation = useUpdateVideo(accessToken);
  const hideMutation = useHideVideo(accessToken);

  const videos = videosQuery.data?.items ?? [];
  const statsSource = allVideosQuery.data?.items ?? videos;

  const runUpdate = async (video: Video, payload: Parameters<typeof updateMutation.mutateAsync>[0]['payload']) => {
    setBusyId(video.id);
    setActionError(null);
    setActionMessage(null);
    try {
      await updateMutation.mutateAsync({ id: video.id, payload });
      setActionMessage(t('admin.pages.videos.updated'));
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : t('admin.pages.videos.updateFailed'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSync = async () => {
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await syncMutation.mutateAsync();
      const channelHint =
        result.channel?.subscriber_count != null
          ? t('admin.pages.videos.channelHint', {
              subscribers: result.channel.subscriber_count.toLocaleString(
                numberLocale,
              ),
              videos:
                result.channel.video_count?.toLocaleString(numberLocale) ??
                '—',
            })
          : '';
      setActionMessage(
        result.synced > 0
          ? t('admin.pages.videos.syncSuccess', {
              count: result.synced,
              hint: channelHint,
            })
          : t('admin.pages.videos.syncEmpty', { hint: channelHint }),
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : t('admin.pages.videos.syncFailed'),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Content
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {t('admin.titles.videos')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.pages.videos.description')}
          </p>
        </div>
        <VideoSyncButton
          onSync={handleSync}
          isLoading={syncMutation.isPending}
        />
      </div>

      <VideoStatsCards videos={statsSource} />

      <VideoFilters
        keyword={keyword}
        category={category}
        visibility={visibility}
        onKeywordChange={setKeyword}
        onCategoryChange={setCategory}
        onVisibilityChange={setVisibility}
      />

      {(actionMessage || actionError || videosQuery.isError) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            actionError || videosQuery.isError
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {actionError ||
            (videosQuery.error instanceof Error
              ? videosQuery.error.message
              : null) ||
            actionMessage}
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-medium text-white">
            {t('admin.pages.videos.listTitle')}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              allowTable={allowTable}
            />
            <p className="text-xs text-muted">
              {videosQuery.isLoading
                ? t('admin.common.loading')
                : t('admin.common.countShown', { count: videos.length })}
            </p>
          </div>
        </div>

        {videosQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted">
            {t('admin.pages.videos.loading')}
          </div>
        ) : (
          <VideoTable
            videos={videos}
            busyId={busyId}
            viewMode={viewMode}
            onToggleFeatured={(video) =>
              void runUpdate(video, { is_featured: !video.is_featured })
            }
            onToggleHome={(video) =>
              void runUpdate(video, { show_on_home: !video.show_on_home })
            }
            onToggleVisible={(video) =>
              void runUpdate(video, { is_visible: !video.is_visible })
            }
            onCategoryChange={(video, nextCategory) =>
              void runUpdate(video, {
                category: nextCategory || undefined,
              })
            }
            onDisplayOrderChange={(video, order) =>
              void runUpdate(video, { display_order: order })
            }
            onHide={async (video) => {
              setBusyId(video.id);
              setActionError(null);
              try {
                await hideMutation.mutateAsync(video.id);
                setActionMessage(t('admin.pages.videos.unpublished'));
              } catch (error) {
                setActionError(
                  error instanceof Error
                    ? error.message
                    : t('admin.pages.videos.hideFailed'),
                );
              } finally {
                setBusyId(null);
              }
            }}
          />
        )}
      </Card>
    </div>
  );
}
