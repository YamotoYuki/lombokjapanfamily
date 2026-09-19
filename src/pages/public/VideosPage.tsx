import { useMemo, useState } from 'react';
import { Search, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FadeIn, PageHero, VideoCard } from '@/components/public';
import { Input } from '@/components/ui';
import { YOUTUBE_CHANNEL_URL, YOUTUBE_SUBSCRIBE_URL } from '@/data/brand';
import { PAGE_IMAGES } from '@/data/pageImages';
import { useSettings } from '@/hooks/useSettings';
import { useVideos } from '@/hooks/useVideos';
import {
  formatPublishedDate,
  formatViewCount,
  selectPopularVideos,
  youtubeWatchUrl,
  type Video,
} from '@/types/video';
import type { PublicVideo } from '@/types/public';

type VideoTab = 'latest' | 'popular';

function toPublicVideo(video: Video, lang: string): PublicVideo {
  return {
    id: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnail_url || '',
    views: formatViewCount(video.views || 0, lang),
    publishedAt: formatPublishedDate(video.published_at, lang),
    duration: video.duration || '',
    youtubeUrl: youtubeWatchUrl(video.youtube_id),
  };
}

export default function VideosPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const { data: settings } = useSettings();
  const youtubeUrl = settings?.youtube_channel_url || YOUTUBE_CHANNEL_URL;
  const subscribeUrl = youtubeUrl.includes('sub_confirmation')
    ? youtubeUrl
    : `${youtubeUrl}${youtubeUrl.includes('?') ? '&' : '?'}sub_confirmation=1`;

  const [activeTab, setActiveTab] = useState<VideoTab>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError, error } = useVideos({ is_visible: true });
  const allItems = useMemo(() => data?.items ?? [], [data?.items]);

  const latestItems = useMemo(
    () =>
      [...allItems].sort(
        (a, b) =>
          new Date(b.published_at || 0).getTime() -
          new Date(a.published_at || 0).getTime(),
      ),
    [allItems],
  );
  const popularItems = useMemo(
    () => selectPopularVideos(allItems, allItems.length || 1),
    [allItems],
  );

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const videos = useMemo<PublicVideo[]>(() => {
    const tabItems = activeTab === 'popular' ? popularItems : latestItems;
    const filtered = query
      ? tabItems.filter(
          (video) =>
            video.title.toLowerCase().includes(query) ||
            (video.description || '').toLowerCase().includes(query),
        )
      : tabItems;
    return filtered.map((video) => toPublicVideo(video, lang));
  }, [activeTab, popularItems, latestItems, query, lang]);

  return (
    <>
      <PageHero
        eyebrow={t('videos.pageEyebrow')}
        title={t('videos.pageTitle')}
        description={t('videos.pageDescription')}
        backgroundImage={PAGE_IMAGES.videos}
      />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-gradient-to-r from-youtube-red/15 via-white/[0.03] to-gold/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              {t('videos.channelEyebrow')}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              @lombokjapanfamily
            </p>
            <p className="mt-1 text-sm text-muted">{t('videos.channelHint')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-youtube-red/25 transition-all hover:-translate-y-0.5 hover:bg-red-600"
            >
              <Youtube size={16} aria-hidden />
              {t('videos.watchChannel')}
            </a>
            <a
              href={subscribeUrl || YOUTUBE_SUBSCRIBE_URL}
              target="_blank"
              rel="noreferrer"
              className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold/20"
            >
              {t('videos.subscribe')}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-20">
        <div className="mb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
            {t('videos.archiveEyebrow')}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
            {t('videos.archiveTitle')}
          </h2>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('videos.searchPlaceholder')}
              className="!pl-9"
            />
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('latest')}
              className={`touch-target flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none ${
                activeTab === 'latest'
                  ? 'bg-gold text-primary-bg shadow-lg shadow-gold/20'
                  : 'border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-white'
              }`}
            >
              {t('videos.tabLatest')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('popular')}
              className={`touch-target flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none ${
                activeTab === 'popular'
                  ? 'bg-gold text-primary-bg shadow-lg shadow-gold/20'
                  : 'border border-white/10 bg-white/5 text-muted hover:border-gold/30 hover:text-white'
              }`}
            >
              {t('videos.tabPopular')}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mt-8 rounded-2xl border border-white/10 px-6 py-16 text-center text-sm text-muted">
            {t('videos.loading')}
          </div>
        )}

        {isError && (
          <div className="mb-6 mt-8 rounded-2xl border border-youtube-red/30 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error instanceof Error ? error.message : t('videos.error')}
          </div>
        )}

        {!isLoading && !isError && allItems.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
            {t('videos.emptyArchive')}{' '}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:text-amber-300"
            >
              {t('videos.emptyArchiveChannel')}
            </a>
            {t('videos.emptyArchiveSuffix')}
          </div>
        )}

        {!isLoading && !isError && allItems.length > 0 && isSearching && videos.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
            <p className="text-2xl" aria-hidden>
              🔍
            </p>
            <p className="mt-3 text-sm text-muted">{t('videos.searchEmpty')}</p>
            <p className="mt-1 text-xs text-muted/70">
              {t('videos.searchEmptyHint')}
            </p>
          </div>
        )}

        {!isLoading && videos.length > 0 && (
          <div
            key={`${activeTab}-${isSearching ? query : ''}`}
            className="animate-grid-switch mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
          >
            {videos.map((video, index) => (
              <FadeIn key={video.id} delayMs={index * 60}>
                <VideoCard video={video} />
              </FadeIn>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
