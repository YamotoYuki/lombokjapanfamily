import { useMemo, useState } from 'react';
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
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [viewMode, setViewMode] = useResponsiveViewMode('table');

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] =
    useState<VideoVisibilityFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
      setActionMessage('動画設定を更新しました。');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : '更新に失敗しました。',
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
      setActionMessage(
        result.synced > 0
          ? `${result.synced}件の動画を同期しました。`
          : '同期対象の動画がありませんでした。',
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'YouTube同期に失敗しました。',
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
          <h2 className="mt-2 text-3xl font-semibold text-white">Videos</h2>
          <p className="mt-2 text-sm text-muted">
            YouTube動画の同期・カテゴリ・おすすめ・公開設定を管理します。
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
          <h3 className="font-medium text-white">動画一覧</h3>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <p className="text-xs text-muted">
              {videosQuery.isLoading
                ? '読み込み中...'
                : `${videos.length}件表示`}
            </p>
          </div>
        </div>

        {videosQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted">
            動画データを読み込んでいます...
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
                setActionMessage('動画を非公開にしました。');
              } catch (error) {
                setActionError(
                  error instanceof Error
                    ? error.message
                    : '非公開処理に失敗しました。',
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
